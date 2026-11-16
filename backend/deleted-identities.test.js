const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
test('corrupt revocation store fails closed including an interrupted-write backup', () => {
  for (const suffix of ['', '.bak']) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-revocation-'));
    try {
      fs.writeFileSync(path.join(dir, `deleted-identities.json${suffix}`), '{broken');
      const child = spawnSync(process.execPath, ['-e', "require('./deleted-identities')"], { cwd: __dirname, env: { ...process.env, DATA_DIR: dir, STORAGE_BACKEND: 'json' }, encoding: 'utf8', windowsHide: true });
      assert.notEqual(child.status, 0);
      assert.match(child.stderr, /INVALID_REVOCATION_STORE/);
    } finally { for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir); }
  }
});
