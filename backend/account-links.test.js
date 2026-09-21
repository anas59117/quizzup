const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLinks } = require('./account-links');

test('normalizes only valid Firebase to guest account links', () => {
  const normalized = normalizeLinks({
    firebaseToCanonical: {
      firebaseA: 'guest_abcdefghijklmnopqrstuvwx',
      firebaseB: 'not-a-guest',
      '': 'guest_abcdefghijklmnopqrstuvwx',
    },
  });

  assert.deepEqual(normalized, {
    firebaseA: 'guest_abcdefghijklmnopqrstuvwx',
  });
});

test('normalizes malformed link stores to an empty map', () => {
  assert.deepEqual(normalizeLinks(null), {});
  assert.deepEqual(normalizeLinks({ firebaseToCanonical: [] }), {});
});
