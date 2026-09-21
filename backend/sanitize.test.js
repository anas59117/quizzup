const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanDisplayName, cleanAvatar } = require('./sanitize');

test('normalizes whitespace and strips control characters from names', () => {
  assert.equal(cleanDisplayName('  Alice\n\tBob  '), 'Alice Bob');
  assert.equal(cleanDisplayName('\u0000\u0001'), 'Player');
});

test('caps names and preserves a supplied fallback', () => {
  assert.equal(cleanDisplayName('abcdefghijklmnop', 'X', 5), 'abcde');
  assert.equal(cleanDisplayName('', 'Guest'), 'Guest');
});

test('strips control characters from avatars and falls back when empty', () => {
  assert.equal(cleanAvatar('\n🐺\t'), '🐺');
  assert.equal(cleanAvatar('\n\t', '🙂'), '🙂');
});
