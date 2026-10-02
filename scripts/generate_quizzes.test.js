const test = require('node:test');
const assert = require('node:assert/strict');
const { generateQuiz, createGeminiRequester, saveDraft, loadProjectEnv } = require('./generate_quizzes');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('generates 100 questions in the requested difficulty cycle and balances answers', async () => {
  const calls = [];
  const request = async ({ difficulty, count }) => {
    calls.push([difficulty, count]);
    return Array.from({ length: count }, (_, index) => ({
      text: `${difficulty} question ${index + (calls.length * 100)} ?`,
      answers: ['A', 'B', 'C', 'D'],
      correct: 0,
    }));
  };
  const quiz = await generateQuiz({ theme: 'Batman', request });
  assert.deepEqual(calls, [['facile', 20], ['intermediaire', 20], ['difficile', 40], ['expert', 20]]);
  assert.equal(quiz.length, 100);
  assert.deepEqual(quiz.slice(0, 5).map(({ text }) => text.split(' ')[0]),
    ['facile', 'intermediaire', 'difficile', 'difficile', 'expert']);
  assert.deepEqual([0, 1, 2, 3].map((position) => quiz.filter((q) => q.correct === position).length), [25, 25, 25, 25]);
  assert.ok(quiz.every((q) => q.answers[q.correct] === 'A'));
});

test('rejects duplicate questions across batches', async () => {
  const request = async ({ count }) => Array.from({ length: count }, (_, index) => ({
    text: `Question ${index} ?`, answers: ['A', 'B', 'C', 'D'], correct: 0,
  }));
  await assert.rejects(generateQuiz({ theme: 'Batman', request }), /dupliqu/);
});

test('uses Gemini Interactions API with search and structured JSON', async () => {
  let call;
  const fakeFetch = async (url, options) => {
    call = { url, options };
    return { ok: true, json: async () => ({ status: 'completed', steps: [
      { type: 'model_output', content: [{ type: 'text', text: JSON.stringify({ questions: [{ text: 'Q ?', answers: ['A','B','C','D'], correct: 0 }] }) }] },
    ] }) };
  };
  const request = createGeminiRequester({ apiKey: 'secret', model: 'gemini-pro-latest', fetchImpl: fakeFetch });
  const questions = await request({ theme: 'Batman', difficulty: 'facile', count: 1, previous: [] });
  assert.equal(questions.length, 1);
  assert.match(call.url, /\/v1beta\/interactions$/);
  assert.equal(call.options.headers['x-goog-api-key'], 'secret');
  const body = JSON.parse(call.options.body);
  assert.deepEqual(body.tools, [{ type: 'google_search' }]);
  assert.equal(body.response_format.mime_type, 'application/json');
  assert.equal(body.generation_config.thinking_level, 'high');
});

test('saves a draft without overwriting existing work', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-draft-'));
  try {
    const destination = path.join(directory, 'batman.json');
    saveDraft(destination, [{ text: 'Q ?', answers: ['A','B','C','D'], correct: 0 }]);
    assert.throws(() => saveDraft(destination, []), /EEXIST/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('loads GEMINI_API_KEY from the project .env file', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-env-'));
  const original = process.env.GEMINI_API_KEY;
  try {
    fs.writeFileSync(path.join(directory, '.env'), 'GEMINI_API_KEY=test-only-key\n');
    delete process.env.GEMINI_API_KEY;
    loadProjectEnv(directory);
    assert.equal(process.env.GEMINI_API_KEY, 'test-only-key');
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
