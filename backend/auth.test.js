const test = require('node:test');
const assert = require('node:assert/strict');
const { tokenExpiryMs } = require('./auth');

function fakeJwt(payload) {
  const head = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${head}.${body}.sig`;
}

test('extracts JWT expiration in milliseconds', () => {
  assert.equal(tokenExpiryMs(fakeJwt({ exp: 12345 })), 12345000);
});

test('returns zero for malformed or missing expiration', () => {
  assert.equal(tokenExpiryMs('not-a-jwt'), 0);
  assert.equal(tokenExpiryMs(fakeJwt({})), 0);
  assert.equal(tokenExpiryMs(fakeJwt({ exp: 'nope' })), 0);
});
