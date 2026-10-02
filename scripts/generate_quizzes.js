// Generate a reviewable 100-question draft without adding it to the live quiz catalog.
// Usage: node scripts/generate_quizzes.js "Nouveau thème" nouveau_theme
const fs = require('node:fs');
const path = require('node:path');
const { validateQuestions } = require('../backend/content-validator');
const { balanceQuizAnswers } = require('./balance-quiz-answers');

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DIFFICULTIES = [
  ['facile', 20], ['intermediaire', 20], ['difficile', 40], ['expert', 20],
];
const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          answers: { type: 'array', items: { type: 'string' } },
          correct: { type: 'integer' },
        },
        required: ['text', 'answers', 'correct'],
      },
    },
  },
  required: ['questions'],
};

function outputText(interaction) {
  if (interaction.status !== 'completed') throw new Error(`Interaction Gemini non terminée (${interaction.status || 'statut inconnu'}).`);
  const step = [...(interaction.steps || [])].reverse().find((entry) => entry.type === 'model_output');
  const text = (step?.content || []).filter((part) => part.type === 'text').map((part) => part.text).join('');
  if (!text) throw new Error('Gemini n’a pas renvoyé de texte JSON.');
  return text;
}

function createGeminiRequester({ apiKey, model = 'gemini-3.1-pro-preview', fetchImpl = fetch, search = true } = {}) {
  if (!apiKey) throw new Error('GEMINI_API_KEY est manquante.');
  return async ({ theme, difficulty, count, previous }) => {
    const prompt = [
      `Crée exactement ${count} questions originales de quiz en français sur « ${theme} », niveau ${difficulty}.`,
      'Public 16–30 ans. Cycle global QuizzUp : facile, intermédiaire, difficile, difficile, expert.',
      'Facile = connu des débutants ; intermédiaire = fans occasionnels ; difficile = fans avertis ; expert = détail vérifiable mais juste.',
      'Chaque question doit être claire, courte, jouable en 10 secondes et avoir une seule bonne réponse indiscutable.',
      'Quatre choix distincts et plausibles. Évite les pièges ambigus, les faits périssables et les formulations « jamais » ou « toujours ». Vérifie les faits avec Google Search quand nécessaire.',
      'Réponds uniquement avec un objet JSON {"questions":[{"text":"...","answers":["...","...","...","..."],"correct":0}]}.',
      `Ne répète aucune de ces questions déjà générées : ${JSON.stringify(previous.map((q) => q.text))}.`,
    ].join('\n');
    const body = {
      model,
      input: prompt,
      ...(search ? { tools: [{ type: 'google_search' }] } : {}),
      generation_config: { temperature: 1, max_output_tokens: 65536, top_p: 0.95, thinking_level: 'high' },
      response_format: { type: 'text', mime_type: 'application/json', schema: QUESTION_SCHEMA },
      store: false,
    };
    const response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${payload.error?.message || 'erreur API'}`);
    let parsed;
    try { parsed = JSON.parse(outputText(payload)); }
    catch (error) { throw new Error(`Réponse Gemini non exploitable : ${error.message}`); }
    if (!Array.isArray(parsed.questions)) throw new Error('Gemini n’a pas renvoyé un tableau questions.');
    return parsed.questions;
  };
}

async function generateQuiz({ theme, request }) {
  if (!theme?.trim()) throw new Error('Le thème est requis.');
  const batches = [];
  const previous = [];
  for (const [difficulty, count] of DIFFICULTIES) {
    const questions = await request({ theme, difficulty, count, previous });
    if (!Array.isArray(questions) || questions.length !== count) {
      throw new Error(`${difficulty}: ${count} questions attendues, ${questions?.length ?? 0} reçues.`);
    }
    const issues = validateQuestions([...previous, ...questions], { key: theme });
    if (issues.length) throw new Error(issues.join('\n'));
    batches.push(questions);
    previous.push(...questions);
  }
  const [easy, medium, hard, expert] = batches;
  const ordered = Array.from({ length: 20 }, (_, index) => [
    easy[index], medium[index], hard[index * 2], hard[index * 2 + 1], expert[index],
  ]).flat();
  return balanceQuizAnswers(ordered);
}

function saveDraft(destination, questions) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(questions, null, 2)}\n`, { flag: 'wx' });
}

async function main(args = process.argv.slice(2)) {
  const [theme, slug] = args;
  if (!theme || !slug || args.length !== 2 || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug)) {
    throw new Error('Usage: node scripts/generate_quizzes.js "Nom du thème" slug_du_theme');
  }
  const destination = path.join(__dirname, '..', 'generated-quizzes', `${slug}.json`);
  if (fs.existsSync(destination)) throw new Error(`Brouillon déjà présent : ${destination}`);
  if (fs.existsSync(path.join(__dirname, '..', 'backend', 'data', `${slug}.json`))) {
    throw new Error(`Quiz déjà présent dans backend/data : ${slug}`);
  }
  const request = createGeminiRequester({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview' });
  const questions = await generateQuiz({ theme, request });
  saveDraft(destination, questions);
  console.log(`${destination}: 100 questions, cycle 1/1/2/1, réponses 25/25/25/25. Relecture humaine requise avant intégration.`);
}

if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

module.exports = { createGeminiRequester, generateQuiz, saveDraft, main };
