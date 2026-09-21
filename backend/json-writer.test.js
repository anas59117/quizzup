const test = require('node:test');
const assert = require('node:assert/strict');
const { createJsonWriter } = require('./json-writer');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('serializes writes and persists a newer snapshot after an in-flight write', async () => {
  let state = { value: 1 };
  const writes = [];
  const callbacks = [];

  const fakeWrite = (_path, payload, cb) => {
    writes.push(JSON.parse(payload));
    callbacks.push(cb);
  };

  const persist = createJsonWriter('/tmp/test.json', () => state, 1, fakeWrite);

  persist();
  await sleep(5);
  assert.deepEqual(writes, [{ value: 1 }]);

  // Mutate while the first write is still in flight. No overlapping write
  // should start until its callback completes.
  state = { value: 2 };
  persist();
  await sleep(5);
  assert.equal(writes.length, 1);

  callbacks.shift()(null);
  await sleep(5);
  assert.deepEqual(writes, [{ value: 1 }, { value: 2 }]);

  callbacks.shift()(null);
});

test('coalesces multiple mutations before the debounce fires', async () => {
  let state = { value: 1 };
  const writes = [];
  let callback;

  const fakeWrite = (_path, payload, cb) => {
    writes.push(JSON.parse(payload));
    callback = cb;
  };

  const persist = createJsonWriter('/tmp/test.json', () => state, 5, fakeWrite);

  persist();
  state = { value: 2 };
  persist();
  state = { value: 3 };
  persist();

  await sleep(10);
  assert.deepEqual(writes, [{ value: 3 }]);
  callback(null);
});
