const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('account-links.json');

function normalizeLinks(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw.firebaseToCanonical
    : null;
  const clean = {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return clean;

  for (const [firebaseUid, canonicalUid] of Object.entries(source)) {
    if (
      typeof firebaseUid === 'string'
      && firebaseUid.length > 0
      && firebaseUid.length <= 256
      && typeof canonicalUid === 'string'
      && /^guest_[A-Za-z0-9_-]{20,64}$/.test(canonicalUid)
    ) {
      clean[firebaseUid] = canonicalUid;
    }
  }
  return clean;
}

const firebaseToCanonical = normalizeLinks(readJsonFileSync(
  STORE,
  { firebaseToCanonical: {} },
  (value) => !!value && typeof value === 'object' && !Array.isArray(value)
));

const persist = createJsonWriter(STORE, () => ({ firebaseToCanonical }));

function canonicalForFirebase(firebaseUid) {
  if (!firebaseUid || typeof firebaseUid !== 'string') return null;
  return firebaseToCanonical[firebaseUid] || firebaseUid;
}

function linkFirebaseIdentity(firebaseUid, canonicalUid) {
  if (
    !firebaseUid
    || typeof firebaseUid !== 'string'
    || firebaseUid.length > 256
    || !/^guest_[A-Za-z0-9_-]{20,64}$/.test(String(canonicalUid || ''))
  ) {
    return { ok: false, reason: 'invalid_identity' };
  }

  const current = firebaseToCanonical[firebaseUid];
  if (current && current !== canonicalUid) {
    return { ok: false, reason: 'firebase_already_linked' };
  }

  const conflictingFirebaseUid = Object.keys(firebaseToCanonical)
    .find((uid) => uid !== firebaseUid && firebaseToCanonical[uid] === canonicalUid);
  if (conflictingFirebaseUid) {
    return { ok: false, reason: 'guest_already_linked' };
  }

  firebaseToCanonical[firebaseUid] = canonicalUid;
  persist();
  return { ok: true, canonicalUid };
}

function isFirebaseLinkedTo(firebaseUid, canonicalUid) {
  return !!firebaseUid && firebaseToCanonical[firebaseUid] === canonicalUid;
}

module.exports = {
  canonicalForFirebase,
  linkFirebaseIdentity,
  isFirebaseLinkedTo,
  normalizeLinks,
};
