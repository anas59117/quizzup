const test = require('node:test');
const assert = require('node:assert/strict');
const { validateQuestions, validateContent } = require('./content-validator');
const { CATEGORIES } = require('./questions');

test('every shipped quiz has valid questions and distinct answer choices', () => {
  const errors = [];
  for (const [key, category] of Object.entries(CATEGORIES)) {
    errors.push(...validateQuestions(category.questions, { key, minimum: 6 }));
    category.questions.forEach((question, index) => {
      // Keep mathematical signs and punctuation: only accents and case are folded.
      const identities = question.answers.map((answer) => answer.normalize('NFD')
        .replace(/\p{M}/gu, '').trim().toLocaleLowerCase('fr-FR'));
      if (new Set(identities).size !== 4) errors.push(`${key}[${index}]: equivalent answer choices`);
    });
  }
  assert.deepEqual(errors, []);
});

const validQuestion = (correct = 0) => ({
  text: `Question ${correct} ?`,
  answers: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  correct,
});

test('accepts a valid four-answer question set', () => {
  assert.deepEqual(validateQuestions([validQuestion()], { key: 'demo' }), []);
});

test('rejects duplicate answers, duplicate questions and invalid correct indexes', () => {
  const duplicate = validQuestion(8);
  duplicate.answers = ['Même', 'même ', 'Autre', 'Encore'];
  const errors = validateQuestions([duplicate, { ...duplicate }], { key: 'demo' });
  assert.ok(errors.some((error) => error.includes('réponses dupliquées')));
  assert.ok(errors.some((error) => error.includes('correct doit être')));
  assert.ok(errors.some((error) => error.includes('question dupliquée')));
});

test('enforces the minimum declared by a managed content batch', () => {
  const result = validateContent({
    categories: { demo: { questions: [validQuestion()] } },
    roadmap: [{ key: 'demo', family: 'gaming', status: 'done' }],
    policy: { batches: [{ name: 'batch-1', minimumQuestions: 2, categories: ['demo'] }] },
    frontendSource: "{ key: 'demo' }",
  });
  assert.ok(result.errors.some((error) => error.includes('minimum requis 2')));
});

test('requires every completed category in both backend and frontend', () => {
  const result = validateContent({
    categories: {},
    roadmap: [{ key: 'missing', family: 'culture', status: 'done' }],
    policy: { batches: [] },
    frontendSource: '',
  });
  assert.ok(result.errors.some((error) => error.includes('absente du backend')));
});
