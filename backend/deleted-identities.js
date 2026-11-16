// Minimal revocation records survive restarts. Completed receipts retain hashes,
// never profile data; pending jobs retain IDs only until erasure can be resumed.
const crypto = require('node:crypto');
const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const file = getStorePath('deleted-identities.json');
const empty = { identities: {}, receipts: {} };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const valid = value => object(value) && object(value.identities) && object(value.receipts)
  && Object.entries(value.identities).every(([key, receiptKey]) => hash(key) && hash(receiptKey) && Object.hasOwn(value.receipts, receiptKey))
  && Object.entries(value.receipts).every(([key, record]) => hash(key) && object(record) && Number.isFinite(record.at)
    && (record.done === true || record.done === false && typeof record.canonicalId === 'string' && Array.isArray(record.firebaseIds) && record.firebaseIds.every(id => typeof id === 'string')));
function readRevocations() {
  if (require('./storage/runtime').postgres()) return readJsonFileSync(file, empty, valid);
  // A corrupt primary may contain newer tombstones than its backup. Only a
  // missing primary (an interrupted atomic rename) permits backup recovery.
  for (const candidate of [file, `${file}.bak`]) {
    try {
      const value = JSON.parse(require('node:fs').readFileSync(candidate, 'utf8'));
      if (!valid(value)) throw Error('INVALID_REVOCATION_STORE');
      return value;
    } catch (error) {
      if (error.code !== 'ENOENT') throw Error('INVALID_REVOCATION_STORE');
    }
  }
  return empty;
}
const saved = readRevocations();
const identities = Object.assign(Object.create(null), saved.identities || {});
const receipts = Object.assign(Object.create(null), saved.receipts || {});
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const persist = createJsonWriter(getStorePath('deleted-identities.json'), () => ({ identities, receipts }));
function forIdentity(uid) { return uid ? receipts[identities[digest(uid)]] || null : null; }
function receipt(token) { return token ? receipts[digest(token)] || null : null; }
function begin(canonicalId, firebaseIds, token) {
  let record = forIdentity(canonicalId);
  if (!record) {
    record = { canonicalId, firebaseIds: [...new Set(firebaseIds)], done: false, at: Date.now() };
    const key = digest(token);
    for (const uid of [canonicalId, ...firebaseIds]) identities[digest(uid)] = key;
  }
  receipts[digest(token)] = record;
  persist();
  return record;
}
function complete(record) {
  // Replace every alias so no completed receipt preserves the pending raw IDs.
  const clean = { done: true, at: record.at };
  for (const [key, value] of Object.entries(receipts)) if (value === record || value.canonicalId === record.canonicalId && !value.done) receipts[key] = clean;
  persist();
}
module.exports = { isDeleted: uid => !!forIdentity(uid), forIdentity, receipt, begin, complete, flush: persist.flush };
