const test = require('node:test');
const assert = require('node:assert/strict');
const { shuffleQuestions } = require('./questions');

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
