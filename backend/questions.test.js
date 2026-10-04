const test = require('node:test');
const assert = require('node:assert/strict');
const { CATEGORIES, getQuestions, shuffleQuestions, difficultyForRound, selectProgressiveQuestions } = require('./questions');

test('question shuffle does not mutate the source array', () => {
  const source = [1, 2, 3, 4];
  const original = source.slice();
  shuffleQuestions(source, () => 0);
  assert.deepEqual(source, original);
});

test('question shuffle follows Fisher-Yates swaps deterministically', () => {
  const values = [0, 0, 0];
  let i = 0;
  const result = shuffleQuestions([1, 2, 3, 4], () => values[i++]);
  assert.deepEqual(result, [2, 3, 4, 1]);
});


test('six-round matches follow the intended difficulty curve', () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, index) => difficultyForRound(index, 6)),
    ['easy', 'easy', 'medium', 'medium', 'hard', 'expert']
  );
});

test('progressive selection keeps approachable questions first and expert question last', () => {
  const source = Array.from({ length: 20 }, (_, index) => ({
    text: `Question ${index}`,
    answers: [`Correct ${index}`, 'B', 'C', 'D'],
    correct: 0,
    _difficultyScore: index / 19,
  }));
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  assert.deepEqual(selected.map((q) => q.difficulty), [
    'easy', 'easy', 'medium', 'medium', 'hard', 'expert',
  ]);
  assert.ok(selected[0].text === 'Question 0');
  assert.ok(selected[1].text.startsWith('Question '));
  assert.ok(Number(selected[1].text.split(' ')[1]) <= 6);
  assert.ok(Number(selected[4].text.split(' ')[1]) >= 12);
  assert.ok(Number(selected[5].text.split(' ')[1]) >= 16);
});

test('expert round prioritizes editorially tagged questions', () => {
  const source = [
    { text: 'easy 1', answers: ['A', 'B', 'C', 'D'], correct: 0, _difficultyScore: 0.1 },
    { text: 'easy 2', answers: ['B', 'A', 'C', 'D'], correct: 0, _difficultyScore: 0.2 },
    { text: 'medium 1', answers: ['C', 'A', 'B', 'D'], correct: 0, _difficultyScore: 0.45 },
    { text: 'medium 2', answers: ['D', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.55 },
    { text: 'hard', answers: ['E', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.75 },
    { text: 'position only', answers: ['F', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.95 },
    { text: 'reviewed expert', answers: ['G', 'A', 'B', 'C'], correct: 0, difficulty: 'expert', _difficultyScore: 0.95 },
  ];
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  assert.equal(selected.length, 6);
  assert.equal(selected[5].text, 'reviewed expert');
  assert.equal(selected[5].difficulty, 'expert');
});

test('progressive selection avoids repeated correct answers when alternatives exist', () => {
  const source = [
    { text: 'A1', answers: ['A', 'B', 'C', 'D'], correct: 0, _difficultyScore: 0.1 },
    { text: 'A2', answers: ['A', 'E', 'F', 'G'], correct: 0, _difficultyScore: 0.2 },
    { text: 'B1', answers: ['B', 'A', 'C', 'D'], correct: 0, _difficultyScore: 0.3 },
    { text: 'C1', answers: ['C', 'A', 'B', 'D'], correct: 0, _difficultyScore: 0.5 },
    { text: 'D1', answers: ['D', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.7 },
    { text: 'E1', answers: ['E', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.85 },
    { text: 'F1', answers: ['F', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.95 },
  ];
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  const correctAnswers = selected.map((q) => q.answers[q.correct]);
  assert.equal(new Set(correctAnswers).size, correctAnswers.length);
});


test('every quiz category produces a complete progressive six-round match', () => {
  const expected = ['easy', 'easy', 'medium', 'medium', 'hard', 'expert'];
  for (const key of Object.keys(CATEGORIES)) {
    const selected = getQuestions(6, key, () => 0);
    assert.equal(selected.length, 6, `${key} must provide six questions`);
    assert.deepEqual(
      selected.map((q) => q.difficulty),
      expected,
      `${key} must follow the global difficulty curve`
    );
    assert.equal(
      new Set(selected.map((q) => q.image || q.text)).size,
      6,
      `${key} must not repeat a question in one match`
    );
  }
});

test('answers are shuffled at serve time and the correct index follows the right answer', () => {
  const { shuffleAnswers } = require('./questions');
  const q = { text: 'Q', answers: ['A', 'B', 'C', 'D'], correct: 1 };
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const s = shuffleAnswers(q);
    assert.equal(s.answers[s.correct], 'B');
    assert.deepEqual([...s.answers].sort(), ['A', 'B', 'C', 'D']);
    seen.add(s.correct);
  }
  assert.ok(seen.size > 1);
  assert.deepEqual(q.answers, ['A', 'B', 'C', 'D']);
  const fixed = { text: 'Q', answers: ['X', 'Y', 'Z', 'Toutes les réponses'], correct: 3 };
  assert.deepEqual(shuffleAnswers(fixed), fixed);
});
