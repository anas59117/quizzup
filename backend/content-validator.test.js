const test = require('node:test');
const assert = require('node:assert/strict');
const { validateQuestions, validateContent } = require('./content-validator');

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
