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
  assert.equal(source.manifest.stores.length, 14);
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

test('sealed legacy backups add only the new moderation default without weakening integrity', () => {
  const { STORE_NAMES, emptyStore } = require('./storage/catalog');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-legacy-moderation-'));
  const data = Object.fromEntries(STORE_NAMES.filter(name => name !== 'user-reports').map(name => [name, emptyStore(name)]));
  data.stats = { alice: { games: 3 } };
  for (const [name, value] of Object.entries(data)) fs.writeFileSync(path.join(root, `${name}.json`), JSON.stringify(value));
  fs.writeFileSync(path.join(root, 'migration-manifest.json'), JSON.stringify({ version: 1, datasetHash: canonicalHash(data), stores: Object.keys(data).map(name => ({ name })) }));
  const normalized = readSource(root);
  assert.deepEqual(normalized.data['user-reports'], { reports: [], blocks: {}, flaggedNames: {} });
  assert.deepEqual(normalized.data.stats, data.stats);
  const exported = path.join(root, 'new-backup');
  writeDirectory(exported, normalized.data);
  assert.deepEqual(readSource(exported).data, normalized.data);
  fs.writeFileSync(path.join(root, 'user-reports.json'), JSON.stringify({ reports: [], blocks: { alice: ['bob'] }, flaggedNames: {} }));
  assert.throws(() => readSource(root), { code: 'BACKUP_VERIFICATION_FAILED' });
  fs.unlinkSync(path.join(root, 'user-reports.json'));
  fs.writeFileSync(path.join(root, 'stats.json'), '{}');
  assert.throws(() => readSource(root), { code: 'BACKUP_VERIFICATION_FAILED' });
  fs.writeFileSync(path.join(root, 'stats.json'), JSON.stringify(data.stats));
  fs.unlinkSync(path.join(root, 'messages.json'));
  assert.throws(() => readSource(root), { code: 'BACKUP_VERIFICATION_FAILED' });
});
