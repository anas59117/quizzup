const test = require('node:test');
const assert = require('node:assert/strict');
const { STORE_NAMES, emptyStore } = require('./storage/catalog');
const { encodeSnapshot, decodeSnapshot, canonicalHash } = require('./storage/codec');

const samples = {
  'account-links': { firebaseToCanonical: { google: 'guest_123' } },
  'async-challenges': [{ id: 'b', score: 3 }, { id: 'a', score: 5 }],
  'category-stats': { '2026-11-01': { started: 2 } },
  challenges: [{ id: 'z', status: 'pending' }, { id: 'a', status: 'completed' }],
  follows: { following: { alice: ['bob', 'camille'] } },
  'match-history': { alice: [{ id: 'match2' }, { id: 'match1' }] },
  messages: { threads: [{ members: ['bob', 'alice'], messages: [{ text: 'Salut 🦊' }] }], themes: { alice: ['psg', 'zelda'] }, future: { keep: true } },
  notifications: { alice: [{ type: 'friend_overtook', at: 123 }] },
  posts: { posts: [{ id: 'b', comments: ['second', 'first'] }, { id: 'a' }], metadata: { preserve: true } },
  reports: { counts: { 'Question ?': 2 }, quarantined: ['b', 'a'] },
  social: { profiles: { alice: { name: 'Élodie 漢', avatar: 'robot' } }, friends: { alice: ['bob'] }, requests: {} },
  stats: { alice: { xp: 200, coins: 50 } },
  'topic-stats': { alice: { psg: { xp: 10 } } },
  'user-reports': { reports: [{ reporterId: 'alice', targetId: 'bob', reason: 'insultes 🦊' }], blocks: { alice: ['bob'] }, flaggedNames: { bob: 1 }, future: { keep: true } },
};

for (const name of Object.keys(samples)) test(`${name} survives an exact entity round trip including order and unknown fields`, () => {
  const encoded = encodeSnapshot(name, samples[name]);
  assert.deepEqual(decodeSnapshot(name, encoded.layout, encoded.records), samples[name]);
  assert.equal(encoded.hash, canonicalHash(samples[name]));
});

test('every supported store has a valid empty default', () => {
  assert.equal(STORE_NAMES.length, 14);
  for (const name of STORE_NAMES) {
    const value = emptyStore(name), encoded = encodeSnapshot(name, value);
    assert.deepEqual(decodeSnapshot(name, encoded.layout, encoded.records), value);
  }
});

test('prototype-like and punctuation keys are data and hashes ignore object key order', () => {
  const data = JSON.parse('{"__proto__":{"xp":5},"constructor":{"xp":3},"a/b\\\"c":{"xp":1}}');
  const encoded = encodeSnapshot('stats', data);
  assert.deepEqual(decodeSnapshot('stats', encoded.layout, encoded.records), data);
  assert.equal(canonicalHash({ b: 2, a: 1 }), canonicalHash({ a: 1, b: 2 }));
  assert.equal({}.xp, undefined);
});

test('JSON text containing NUL or lone surrogates is preserved without data loss', () => {
  const value = { a: { text: '\u0000\ud800' } };
  const encoded = encodeSnapshot('stats', value);
  assert.deepEqual(decodeSnapshot('stats', encoded.layout, encoded.records), value);
});

test('invalid root shapes and incomplete/corrupt entities fail closed', () => {
  assert.throws(() => encodeSnapshot('stats', []));
  assert.throws(() => encodeSnapshot('unknown-store', {}));
  assert.throws(() => encodeSnapshot('posts', { posts: 'wrong' }));
  const encoded = encodeSnapshot('challenges', [{ id: 'a' }, { id: 'b' }]);
  assert.throws(() => decodeSnapshot('challenges', encoded.layout, encoded.records.slice(0, 1)));
  const records = structuredClone(encoded.records); records[0].payload.id = 'tampered';
  assert.throws(() => decodeSnapshot('challenges', encoded.layout, records));
});
