const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readSource, writeDirectory } = require('./storage/migration-files');
const { canonicalHash } = require('./storage/codec');

test('source capture, verified backup and export preserve identities and order without overwriting files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-migration-'));
  fs.writeFileSync(path.join(root, 'stats.json'), JSON.stringify({ alice: { xp: 100 } }));
  fs.writeFileSync(path.join(root, 'posts.json'), JSON.stringify({ posts: [{ id: 'z' }, { id: 'a' }] }));
  const source = readSource(root);
  assert.equal(source.manifest.stores.length, 13);
  assert.equal(source.manifest.stores.find(s => s.name === 'messages').source, 'missing-default');
  const target = path.join(root, 'backup');
  writeDirectory(target, source.data);
  assert.equal(canonicalHash(readSource(target).data), canonicalHash(source.data));
  assert.throws(() => writeDirectory(target, source.data));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'stats.json'), 'utf8')), { alice: { xp: 100 } });
});

test('corrupted source uses only a valid backup and never silently resets an existing corrupt store', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-migration-corrupt-'));
  fs.writeFileSync(path.join(root, 'stats.json'), '{broken');
  assert.throws(() => readSource(root), { code: 'INVALID_SOURCE_STORE' });
  fs.writeFileSync(path.join(root, 'stats.json.bak'), '{"alice":{"xp":50}}');
  const source = readSource(root);
  assert.equal(source.data.stats.alice.xp, 50);
  assert.equal(source.manifest.stores.find(s => s.name === 'stats').source, 'backup');
});
