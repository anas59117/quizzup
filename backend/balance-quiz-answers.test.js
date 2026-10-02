const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { balanceQuizAnswers } = require('../scripts/balance-quiz-answers');

function sampleQuestions() {
  return Array.from({ length: 100 }, (_, index) => ({
    text: `Question ${index + 1} ?`,
    answers: [`Bonne ${index}`, `Fausse A ${index}`, `Fausse B ${index}`, `Fausse C ${index}`],
    correct: 0,
  }));
}

test('balances 100 answers 25/25/25/25 without changing the question or correct answer', () => {
  const original = sampleQuestions();
  const balanced = balanceQuizAnswers(original);
  const counts = [0, 0, 0, 0];

  balanced.forEach((question, index) => {
    counts[question.correct] += 1;
    assert.equal(question.text, original[index].text);
    assert.equal(question.answers[question.correct], original[index].answers[original[index].correct]);
    assert.deepEqual([...question.answers].sort(), [...original[index].answers].sort());
  });

  assert.deepEqual(counts, [25, 25, 25, 25]);
  assert.equal(original[0].correct, 0);
  assert.deepEqual(original[0].answers, ['Bonne 0', 'Fausse A 0', 'Fausse B 0', 'Fausse C 0']);
});

test('rejects an incomplete or invalid quiz before producing output', () => {
  assert.throws(() => balanceQuizAnswers(sampleQuestions().slice(0, 99)), /exactement 100/);
  const invalid = sampleQuestions();
  invalid[8].answers[1] = invalid[8].answers[0];
  assert.throws(() => balanceQuizAnswers(invalid), /réponses dupliquées/);
});

test('CLI writes a new balanced JSON file without overwriting the raw input', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-balance-'));
  const input = path.join(directory, 'raw.json');
  const output = path.join(directory, 'balanced.json');
  const source = `${JSON.stringify(sampleQuestions())}\n`;
  try {
    fs.writeFileSync(input, source);
    execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'balance-quiz-answers.js'), input, output]);
    const balanced = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.deepEqual([0, 1, 2, 3].map((position) => balanced.filter((q) => q.correct === position).length), [25, 25, 25, 25]);
    assert.equal(fs.readFileSync(input, 'utf8'), source);
    assert.throws(() => execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'balance-quiz-answers.js'), input, output], { stdio: 'pipe' }));
  } finally {
    if (fs.existsSync(output)) fs.unlinkSync(output);
    fs.unlinkSync(input);
    fs.rmdirSync(directory);
  }
});
