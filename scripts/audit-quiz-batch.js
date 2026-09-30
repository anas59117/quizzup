// Usage: node scripts/audit-quiz-batch.js fortnite minecraft ...
// Complements the global validator with an exact target and likely duplicate prompts.
const path = require('node:path');
const { validateQuestions } = require('../backend/content-validator');

const keys = process.argv.slice(2);
if (!keys.length || keys.some((key) => !/^[a-z0-9_]+$/.test(key))) {
  console.error('Pass one or more category keys (letters, digits and underscores).');
  process.exit(2);
}

function words(text) {
  return new Set(String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2));
}

function similarity(a, b) {
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / (a.size + b.size - intersection || 1);
}

let errors = 0;
for (const key of keys) {
  const questions = require(path.join('..', 'backend', 'data', `${key}.json`));
  const issues = validateQuestions(questions, { key, minimum: 100 });
  if (!Array.isArray(questions)) {
    issues.forEach((issue) => console.error(issue));
    errors += issues.length;
    continue;
  }
  if (questions.length !== 100) issues.push(`${key}: expected exactly 100, found ${questions.length}`);
  for (const issue of issues) console.error(issue);
  errors += issues.length;

  const tokenSets = questions.map((q) => words(q.text));
  let similar = 0;
  for (let i = 0; i < questions.length; i += 1) {
    for (let j = i + 1; j < questions.length; j += 1) {
      // The first 50 were already published; focus this batch audit on additions.
      if (i < 50 && j < 50) continue;
      const a = questions[i].answers?.[questions[i].correct];
      const b = questions[j].answers?.[questions[j].correct];
      if (a && b && words(a).size && similarity(words(a), words(b)) === 1
        && similarity(tokenSets[i], tokenSets[j]) >= 0.65) {
        console.warn(`${key}: review similar questions ${i + 1} and ${j + 1}`);
        similar += 1;
      }
    }
  }
  const positions = [0, 0, 0, 0];
  questions.forEach((q) => { if (Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4) positions[q.correct] += 1; });
  console.log(`${key}: ${questions.length} questions, answer positions ${positions.join('/')}, ${similar} similarity alerts`);
}
process.exitCode = errors ? 1 : 0;
