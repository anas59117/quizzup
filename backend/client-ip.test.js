const test = require('node:test');
const assert = require('node:assert/strict');
const { getClientIp, parseTrustedHops } = require('./client-ip');

function request(forwarded, remote = '10.0.0.5') {
  return {
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
    socket: { remoteAddress: remote },
  };
}

test('ignores forwarded headers when proxy trust is disabled', () => {
  assert.equal(
    getClientIp(request('198.51.100.10'), { trustProxy: false, trustedHops: 1 }),
    '10.0.0.5'
  );
});

test('with one trusted proxy, uses the right-most forwarded address', () => {
  // A malicious client may inject the first value; the trusted edge proxy
  // appends the actual source address on the right.
  assert.equal(
    getClientIp(request('203.0.113.99, 198.51.100.10'), { trustProxy: true, trustedHops: 1 }),
    '198.51.100.10'
  );
});

test('supports multiple explicitly trusted proxy hops', () => {
  assert.equal(
    getClientIp(request('192.0.2.4, 198.51.100.20'), { trustProxy: true, trustedHops: 2 }),
    '192.0.2.4'
  );
});

test('falls back to the socket address when forwarded data is absent', () => {
  assert.equal(
    getClientIp(request(null), { trustProxy: true, trustedHops: 1 }),
    '10.0.0.5'
  );
});

test('trusted hop parsing is bounded and defaults to one', () => {
  assert.equal(parseTrustedHops('2'), 2);
  assert.equal(parseTrustedHops('0'), 1);
  assert.equal(parseTrustedHops('nope'), 1);
  assert.equal(parseTrustedHops('99'), 10);
});
