const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createJsonWriter, readJsonFileSync, atomicWriteFile } = require('./json-writer');

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


test('atomic writer keeps the previous complete snapshot as a backup', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-json-'));
  const store = path.join(dir, 'store.json');

  try {
    fs.writeFileSync(store, JSON.stringify({ value: 1 }));

    await new Promise((resolve, reject) => {
      atomicWriteFile(store, JSON.stringify({ value: 2 }), (err) => {
        if (err) reject(err); else resolve();
      });
    });

    assert.deepEqual(JSON.parse(fs.readFileSync(store, 'utf8')), { value: 2 });
    assert.deepEqual(JSON.parse(fs.readFileSync(`${store}.bak`, 'utf8')), { value: 1 });
    assert.equal(fs.existsSync(`${store}.tmp`), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('reader falls back to the backup when the primary JSON is corrupted', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-json-'));
  const store = path.join(dir, 'store.json');
  const originalError = console.error;

  try {
    fs.writeFileSync(store, '{"broken":');
    fs.writeFileSync(`${store}.bak`, JSON.stringify({ value: 7 }));
    console.error = () => {};

    const value = readJsonFileSync(
      store,
      { value: 0 },
      (candidate) => Number.isInteger(candidate?.value)
    );
    assert.deepEqual(value, { value: 7 });
  } finally {
    console.error = originalError;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('reader rejects structurally invalid primary data and uses a valid backup', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-json-'));
  const store = path.join(dir, 'store.json');
  const originalError = console.error;

  try {
    fs.writeFileSync(store, JSON.stringify({ value: 'bad' }));
    fs.writeFileSync(`${store}.bak`, JSON.stringify({ value: 9 }));
    console.error = () => {};

    const value = readJsonFileSync(
      store,
      { value: 0 },
      (candidate) => Number.isInteger(candidate?.value)
    );
    assert.deepEqual(value, { value: 9 });
  } finally {
    console.error = originalError;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
