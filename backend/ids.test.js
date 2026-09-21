const test = require('node:test');
const assert = require('node:assert/strict');
const { randomId, randomRoomCode } = require('./ids');

test('randomId preserves the requested prefix and produces unique values', () => {
  const a = randomId('player_');
  const b = randomId('player_');
  assert.match(a, /^player_[0-9a-f]{32}$/);
  assert.match(b, /^player_[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test('randomRoomCode only uses the configured alphabet', () => {
  let n = 0;
  const sequence = [0, 1, 2, 3, 0];
  const code = randomRoomCode('ABCD', 5, () => sequence[n++]);
  assert.equal(code, 'ABCDA');
});

test('randomRoomCode validates configuration', () => {
  assert.throws(() => randomRoomCode('A', 5), /INVALID_ALPHABET/);
  assert.throws(() => randomRoomCode('AB', 0), /INVALID_CODE_LENGTH/);
});
