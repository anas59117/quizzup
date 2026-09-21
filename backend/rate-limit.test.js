const test = require('node:test');
const assert = require('node:assert/strict');
const RateLimiter = require('./rate-limit');

test('allows up to the configured limit and rejects the next message', () => {
  const limiter = new RateLimiter(1000, 3);
  assert.equal(limiter.check('u1'), true);
  assert.equal(limiter.check('u1'), true);
  assert.equal(limiter.check('u1'), true);
  assert.equal(limiter.check('u1'), false);
});

test('uses independent buckets per identity', () => {
  const limiter = new RateLimiter(1000, 1);
  assert.equal(limiter.check('u1'), true);
  assert.equal(limiter.check('u1'), false);
  assert.equal(limiter.check('u2'), true);
});

test('resets exactly when the configured window expires', () => {
  const originalNow = Date.now;
  let now = 1000;
  Date.now = () => now;

  try {
    const limiter = new RateLimiter(100, 1);
    assert.equal(limiter.check('u1'), true);
    assert.equal(limiter.check('u1'), false);

    now = 1099;
    assert.equal(limiter.check('u1'), false);

    now = 1100;
    assert.equal(limiter.check('u1'), true);
  } finally {
    Date.now = originalNow;
  }
});

test('remove and sweep release stale buckets', () => {
  const originalNow = Date.now;
  let now = 1000;
  Date.now = () => now;

  try {
    const limiter = new RateLimiter(100, 1);
    limiter.check('remove-me');
    limiter.remove('remove-me');
    assert.equal(limiter.clients.has('remove-me'), false);

    limiter.check('stale');
    now = 1201;
    limiter.sweep();
    assert.equal(limiter.clients.has('stale'), false);
  } finally {
    Date.now = originalNow;
  }
});
