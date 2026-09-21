const test = require('node:test');
const assert = require('node:assert/strict');
const { levelFromXp } = require('./stats');

test('level curve matches exact triangular XP boundaries', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
  assert.deepEqual(levelFromXp(199), { level: 1, xpIntoLevel: 199, xpForLevel: 200 });
  assert.deepEqual(levelFromXp(200), { level: 2, xpIntoLevel: 0, xpForLevel: 400 });
  assert.deepEqual(levelFromXp(599), { level: 2, xpIntoLevel: 399, xpForLevel: 400 });
  assert.deepEqual(levelFromXp(600), { level: 3, xpIntoLevel: 0, xpForLevel: 600 });
});

test('level calculation stays finite for very large persisted XP', () => {
  const result = levelFromXp(Number.MAX_SAFE_INTEGER);
  assert.equal(Number.isFinite(result.level), true);
  assert.equal(result.xpIntoLevel >= 0, true);
  assert.equal(result.xpIntoLevel < result.xpForLevel, true);
});

test('invalid XP is treated as zero', () => {
  assert.deepEqual(levelFromXp(-10), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
  assert.deepEqual(levelFromXp('nope'), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
});
