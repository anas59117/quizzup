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
test('corrupt authoritative revocation snapshot never falls back to a stale valid backup', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-stale-revocation-'));
  try {
    fs.writeFileSync(path.join(dir, 'deleted-identities.json'), '{corrupt-latest-tombstone');
    fs.writeFileSync(path.join(dir, 'deleted-identities.json.bak'), JSON.stringify({ identities: {}, receipts: {} }));
    const child = spawnSync(process.execPath, ['-e', "require('./deleted-identities')"], { cwd: __dirname, env: { ...process.env, DATA_DIR: dir, STORAGE_BACKEND: 'json' }, encoding: 'utf8', windowsHide: true });
    assert.notEqual(child.status, 0, 'A stale backup must not restore access to revoked identities');
    assert.match(child.stderr, /INVALID_REVOCATION_STORE/);
  } finally { for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir); }
});
test('missing primary recovers committed tombstones from the interrupted-rename backup', () => {
  const crypto = require('node:crypto');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-recover-revocation-'));
  const uid = 'review-recovered-account', receipt = 'b'.repeat(64);
  const identity = crypto.createHash('sha256').update(uid).digest('hex');
  try {
    fs.writeFileSync(path.join(dir, 'deleted-identities.json.bak'), JSON.stringify({ identities: { [identity]: receipt }, receipts: { [receipt]: { done: true, at: 123 } } }));
    const child = spawnSync(process.execPath, ['-e', `if (!require('./deleted-identities').isDeleted('${uid}')) process.exit(2)`], { cwd: __dirname, env: { ...process.env, DATA_DIR: dir, STORAGE_BACKEND: 'json' }, encoding: 'utf8', windowsHide: true });
    assert.equal(child.status, 0, child.stderr);
  } finally { for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir); }
});
