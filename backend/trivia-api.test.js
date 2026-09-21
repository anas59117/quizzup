const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimitedQueue } = require('./trivia-api');

test('serializes concurrent tasks and spaces their starts by the configured interval', async () => {
  let now = 0;
  const sleeps = [];
  const starts = [];

  const schedule = createRateLimitedQueue(
    100,
    () => now,
    async (ms) => {
      sleeps.push(ms);
      now += ms;
    }
  );

  const results = await Promise.all([
    schedule(async () => { starts.push(now); return 'a'; }),
    schedule(async () => { starts.push(now); return 'b'; }),
    schedule(async () => { starts.push(now); return 'c'; }),
  ]);

  assert.deepEqual(results, ['a', 'b', 'c']);
  assert.deepEqual(starts, [0, 100, 200]);
  assert.deepEqual(sleeps, [100, 100]);
});

test('a failed task does not break later queued tasks', async () => {
  let now = 0;
  const schedule = createRateLimitedQueue(
    50,
    () => now,
    async (ms) => { now += ms; }
  );

  const first = schedule(async () => { throw new Error('boom'); });
  const second = schedule(async () => 'ok');

  await assert.rejects(first, /boom/);
  assert.equal(await second, 'ok');
  assert.equal(now, 50);
});
