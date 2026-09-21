const test = require('node:test');
const assert = require('node:assert/strict');

process.env.GUEST_AUTH_SECRET = 'test-secret-that-is-long-enough-for-hmac-1234567890';

const {
  issueGuestToken,
  issueOrRefreshGuestToken,
  verifyGuestToken,
  tokenTtlMs,
} = require('./guest-auth');

test('issues and verifies a signed guest token', () => {
  const issued = issueGuestToken();
  assert.ok(issued);
  assert.match(issued.uid, /^guest_/);
  assert.equal(verifyGuestToken(issued.token), issued.uid);
});

test('rejects a tampered guest token', () => {
  const issued = issueGuestToken();
  const parts = issued.token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  payload.sub = 'guest_attackerattackerattacker';
  parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
  assert.equal(verifyGuestToken(parts.join('.')), null);
});

test('refresh preserves the same guest uid', () => {
  const now = Date.now();
  const first = issueGuestToken(undefined, now);
  const refreshed = issueOrRefreshGuestToken(first.token, now + 1000);
  assert.equal(refreshed.uid, first.uid);
  assert.notEqual(refreshed.token, first.token);
});

test('expired guest tokens are rejected', () => {
  const now = Date.now();
  const issued = issueGuestToken(undefined, now);
  assert.equal(verifyGuestToken(issued.token, now + tokenTtlMs() + 2000), null);
});
