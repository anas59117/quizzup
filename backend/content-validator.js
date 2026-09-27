const fs = require('node:fs');
const path = require('node:path');

const VALID_STATUSES = new Set(['done', 'pending']);
const VALID_FAMILIES = new Set(['sport', 'musique', 'divertissement', 'culture', 'gaming', 'entertainment', 'manga']);

const normalize = (value) => String(value).trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ');
const questionKey = (question) => normalize(question.image || question.text || '');

function validateQuestions(questions, { key = 'unknown', minimum = 1 } = {}) {
  const errors = [];
  if (!Array.isArray(questions)) return [`${key}: le contenu doit être un tableau`];
  if (questions.length < minimum) errors.push(`${key}: ${questions.length} question(s), minimum requis ${minimum}`);

  const seenQuestions = new Set();
  questions.forEach((question, index) => {
    const prefix = `${key}[${index}]`;
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
      errors.push(`${prefix}: la question doit être un objet`);
      return;
    }
    if (typeof question.text !== 'string' || !question.text.trim()) errors.push(`${prefix}: texte manquant`);
    if (!Array.isArray(question.answers) || question.answers.length !== 4) {
      errors.push(`${prefix}: exactement 4 réponses sont requises`);
    } else {
      const answers = question.answers.map(normalize);
      if (question.answers.some((answer) => typeof answer !== 'string' || !answer.trim())) {
        errors.push(`${prefix}: chaque réponse doit être un texte non vide`);
      }
      if (new Set(answers).size !== 4) errors.push(`${prefix}: réponses dupliquées`);
    }
    if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3) {
      errors.push(`${prefix}: correct doit être un entier compris entre 0 et 3`);
    }

    const dedupeKey = questionKey(question);
    if (!dedupeKey) return;
    if (seenQuestions.has(dedupeKey)) errors.push(`${prefix}: question dupliquée`);
    seenQuestions.add(dedupeKey);
  });
  return errors;
}

function validateContent({ categories, roadmap, policy, frontendSource }) {
  const errors = [];
  const warnings = [];
  const roadmapKeys = new Set();

  for (const entry of roadmap) {
    if (!entry || typeof entry.key !== 'string' || !entry.key.trim()) {
      errors.push('roadmap: entrée sans clé valide');
      continue;
    }
    if (roadmapKeys.has(entry.key)) errors.push(`roadmap: clé dupliquée ${entry.key}`);
    roadmapKeys.add(entry.key);
    if (!VALID_STATUSES.has(entry.status)) errors.push(`${entry.key}: statut invalide ${entry.status}`);
    if (!VALID_FAMILIES.has(entry.family)) errors.push(`${entry.key}: famille invalide ${entry.family}`);
    if (entry.status !== 'done') continue;
    if (!categories[entry.key]) {
      errors.push(`${entry.key}: marquée done mais absente du backend`);
      continue;
    }
    errors.push(...validateQuestions(categories[entry.key].questions, { key: entry.key }));
    if (frontendSource && !new RegExp(`key:\\s*['\"]${entry.key}['\"]`).test(frontendSource)) {
      errors.push(`${entry.key}: marquée done mais absente du frontend`);
    }
  }

  const policyKeys = new Set();
  for (const batch of policy.batches || []) {
    if (!batch || !Array.isArray(batch.categories)) {
      errors.push('policy: lot sans tableau categories');
      continue;
    }
    const minimum = Number.isInteger(batch.minimumQuestions) ? batch.minimumQuestions : 50;
    for (const key of batch.categories) {
      if (policyKeys.has(key)) errors.push(`policy: catégorie répétée ${key}`);
      policyKeys.add(key);
      const roadmapEntry = roadmap.find((entry) => entry.key === key);
      if (!roadmapEntry) errors.push(`${key}: absente de la roadmap`);
      else if (roadmapEntry.status !== 'done') errors.push(`${key}: intégrée à un lot mais statut ${roadmapEntry.status}`);
      if (!categories[key]) errors.push(`${key}: intégrée à un lot mais absente du backend`);
      else errors.push(...validateQuestions(categories[key].questions, { key, minimum }));
    }
  }

  for (const entry of roadmap.filter((item) => item.status === 'done')) {
    const positions = new Set((categories[entry.key]?.questions || []).map((question) => question.correct));
    if ((categories[entry.key]?.questions?.length || 0) >= 20 && positions.size < 4) {
      warnings.push(`${entry.key}: les bonnes réponses n'utilisent que ${positions.size}/4 positions`);
    }
  }

  return { errors, warnings };
}

function loadAndValidate() {
  const root = __dirname;
  const { CATEGORIES } = require('./questions');
  const roadmap = require('./data/CONTENT_ROADMAP.json');
  const policy = require('./data/CONTENT_BATCHES.json');
  const frontendPath = path.join(root, '..', 'frontend', 'src', 'ui.js');
  const frontendSource = fs.existsSync(frontendPath) ? fs.readFileSync(frontendPath, 'utf8') : '';
  return { ...validateContent({ categories: CATEGORIES, roadmap, policy, frontendSource }), roadmap, policy };
}

if (require.main === module) {
  const result = loadAndValidate();
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
  } else {
    const done = result.roadmap.filter((entry) => entry.status === 'done').length;
    const managed = (result.policy.batches || []).reduce((sum, batch) => sum + batch.categories.length, 0);
    console.log(`Contenu valide: ${done}/${result.roadmap.length} catégories terminées, ${managed} catégorie(s) sous politique renforcée.`);
  }
}

module.exports = { normalize, questionKey, validateQuestions, validateContent, loadAndValidate };
