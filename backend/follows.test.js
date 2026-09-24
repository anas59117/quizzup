const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'follows-'));
const follows = require('./follows');

test('follow / unfollow keeps both directions in sync', () => {
  assert.deepStrictEqual(follows.follow('a', 'b'), { ok: true, changed: true });
  assert.deepStrictEqual(follows.follow('a', 'b'), { ok: true, changed: false });
  follows.follow('c', 'b');
  assert.ok(follows.isFollowing('a', 'b'));
  assert.ok(!follows.isFollowing('b', 'a'));
  assert.deepStrictEqual(follows.counts('b'), { followers: 2, following: 0 });
  assert.deepStrictEqual(follows.counts('a'), { followers: 0, following: 1 });
  assert.deepStrictEqual(follows.getFollowing('a'), ['b']);

  follows.unfollow('a', 'b');
  assert.ok(!follows.isFollowing('a', 'b'));
  assert.deepStrictEqual(follows.counts('b'), { followers: 1, following: 0 });
});

test('rejects self-follow and bad ids', () => {
  assert.strictEqual(follows.follow('a', 'a').ok, false);
  assert.strictEqual(follows.follow('', 'b').ok, false);
});

test('normalize dedupes and drops self edges', () => {
  const n = follows.normalize({ following: { a: ['b', 'b', 'a', 3], z: 'nope' } });
  assert.deepStrictEqual(n.a, ['b']);
  assert.ok(!n.z);
});
