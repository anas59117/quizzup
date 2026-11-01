const test = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const run = require('node:util').promisify(execFile);
const path = require('node:path');

test('DATABASE_URL alone does not activate PostgreSQL', async () => {
  const { stdout } = await run(process.execPath, ['-e', "require('./storage/runtime').initialize().then(()=>console.log(JSON.stringify(require('./storage/runtime').info())))"], {
    cwd: __dirname, env: { ...process.env, STORAGE_BACKEND: '', DATABASE_URL: 'postgresql://unreachable.invalid/test' },
  });
  assert.equal(JSON.parse(stdout).backend, 'json');
});

test('PostgreSQL must be initialized and never falls back to local JSON', async () => {
  await assert.rejects(run(process.execPath, ['-e', "require('./json-writer').readJsonFileSync('./stats.json', {})"], {
    cwd: __dirname, env: { ...process.env, STORAGE_BACKEND: 'postgres', DATABASE_URL: '' },
  }), error => /STORAGE_NOT_READY/.test(error.stderr));
});

for (const [backend, code] of [['postgres', 'DATABASE_URL_REQUIRED'], ['typo', 'UNKNOWN_STORAGE_BACKEND']]) {
  test(`bootstrap refuses ${backend} configuration before starting a server`, async () => {
    await assert.rejects(run(process.execPath, [path.join(__dirname, 'start.js')], {
      cwd: __dirname, env: { ...process.env, STORAGE_BACKEND: backend, DATABASE_URL: '' }, timeout: 5000,
    }), error => error.code === 1 && error.stderr.includes(code) && !error.stdout.includes('backend on'));
  });
}
