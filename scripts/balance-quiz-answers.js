// Usage: node scripts/balance-quiz-answers.js raw.json backend/data/slug.json
// Validates the raw 100-question quiz, then writes a new file with 25 correct
// answers in each position. The source file is never modified.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { validateQuestions } = require('../backend/content-validator');

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const other = crypto.randomInt(index + 1);
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}

function balanceQuizAnswers(questions) {
  const issues = validateQuestions(questions, { key: 'quiz', minimum: 100 });
  if (Array.isArray(questions) && questions.length !== 100) {
    issues.unshift(`quiz: exactement 100 questions requises, trouvé ${questions.length}`);
  }
  if (issues.length) throw new Error(issues.join('\n'));

  const positions = shuffle(Array.from({ length: 100 }, (_, index) => index % 4));
  return questions.map((question, index) => {
    const correctAnswer = question.answers[question.correct];
    const answers = shuffle(question.answers.filter((_, answerIndex) => answerIndex !== question.correct));
    answers.splice(positions[index], 0, correctAnswer);
    return { ...question, answers, correct: positions[index] };
  });
}

if (require.main === module) {
  const [source, destination] = process.argv.slice(2);
  if (!source || !destination || process.argv.length !== 4) {
    console.error('Usage: node scripts/balance-quiz-answers.js raw.json backend/data/slug.json');
    process.exitCode = 2;
  } else {
    try {
      const inputPath = path.resolve(source);
      const outputPath = path.resolve(destination);
      if (inputPath === outputPath) throw new Error('La source et la destination doivent être différentes.');
      const questions = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
      const balanced = balanceQuizAnswers(questions);
      fs.writeFileSync(outputPath, `${JSON.stringify(balanced, null, 2)}\n`, { flag: 'wx' });
      console.log(`${outputPath}: 100 questions, positions 25/25/25/25`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = { balanceQuizAnswers };
