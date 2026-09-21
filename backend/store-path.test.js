const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveDataDir, getStorePath, persistenceInfo } = require('./store-path');

test('defaults to the backend directory when DATA_DIR is unset', () => {
  const original = process.env.DATA_DIR;
  delete process.env.DATA_DIR;
  try {
    assert.equal(resolveDataDir(), __dirname);
    assert.equal(persistenceInfo().mode, 'backend-directory');
  } finally {
    if (original === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = original;
  }
});

test('resolves a configured absolute data directory and creates it on demand', () => {
  const original = process.env.DATA_DIR;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-data-'));
  const targetDir = path.join(root, 'persistent');

  process.env.DATA_DIR = targetDir;
  try {
    const store = getStorePath('unit-test-store.json');
    assert.equal(store, path.join(targetDir, 'unit-test-store.json'));
    assert.equal(fs.existsSync(targetDir), true);
    assert.equal(persistenceInfo().mode, 'configured-directory');
  } finally {
    if (original === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = original;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolves a relative DATA_DIR from the backend directory', () => {
  assert.equal(
    resolveDataDir('./runtime-data'),
    path.resolve(__dirname, './runtime-data')
  );
});
