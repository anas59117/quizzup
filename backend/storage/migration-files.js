const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { STORE_NAMES, ADDITIVE_STORES, emptyStore } = require('./catalog');
const { encodeSnapshot, canonicalHash } = require('./codec');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const bytesHash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function readOptional(file) {
  try { return fs.readFileSync(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function manifest(data, sources = {}) {
  return { version: 1, datasetHash: canonicalHash(data), stores: STORE_NAMES.map(name => {
    const encoded = encodeSnapshot(name, data[name]);
    return { name, hash: encoded.hash, entities: encoded.records.length, source: sources[name] || 'verified-export' };
  }) };
}
function readSource(directory) {
  const root = fs.realpathSync(directory);
  const data = {}, sources = {}, fingerprints = new Map();
  for (const name of STORE_NAMES) {
    let selected = false, existing = false;
    for (const suffix of ['', '.bak']) {
      const file = path.join(root, `${name}.json${suffix}`), raw = readOptional(file);
      fingerprints.set(file, raw === null ? null : bytesHash(raw));
      if (raw === null) continue;
      existing = true;
      if (selected) continue;
      try {
        const value = JSON.parse(raw.toString('utf8'));
        encodeSnapshot(name, value);
        data[name] = value; sources[name] = suffix ? 'backup' : 'primary'; selected = true;
      } catch {}
    }
    if (!selected) {
      if (existing) fail('INVALID_SOURCE_STORE');
      data[name] = emptyStore(name); sources[name] = 'missing-default';
    }
  }
  for (const [file, hash] of fingerprints) {
    const raw = readOptional(file);
    if ((raw === null ? null : bytesHash(raw)) !== hash) fail('SOURCE_CHANGED_DURING_CAPTURE');
  }
  const result = manifest(data, sources);
  const seal = readOptional(path.join(root, 'migration-manifest.json'));
  if (seal) {
    const expected = JSON.parse(seal.toString('utf8'));
    const names = Array.isArray(expected.stores) ? expected.stores.map(store => store.name) : [];
    if (expected.version !== 1 || new Set(names).size !== names.length
      || names.some(name => !STORE_NAMES.includes(name))
      || STORE_NAMES.some(name => !names.includes(name) && !ADDITIVE_STORES.includes(name))
      || result.stores.some(store => store.source !== (names.includes(store.name) ? 'primary' : 'missing-default'))
      || expected.datasetHash !== canonicalHash(Object.fromEntries(names.map(name => [name, data[name]])))) fail('BACKUP_VERIFICATION_FAILED');
  }
  return { data, manifest: result };
}
function writeDirectory(directory, data) {
  const seal = manifest(data);
  const target = path.resolve(directory);
  // An existing directory is never reused, even when it appears empty.
  fs.mkdirSync(target, { mode: 0o700 });
  for (const name of STORE_NAMES) fs.writeFileSync(path.join(target, `${name}.json`), `${JSON.stringify(data[name])}\n`, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(path.join(target, 'migration-manifest.json'), JSON.stringify(seal, null, 2), { flag: 'wx', mode: 0o600 });
  if (readSource(target).manifest.datasetHash !== seal.datasetHash) fail('BACKUP_VERIFICATION_FAILED');
  return seal;
}
module.exports = { readSource, writeDirectory, manifest };
