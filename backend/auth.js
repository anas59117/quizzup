// Verifies every identity before it becomes a backend clientId.
//
// QuizzUp now supports two token types:
// 1) Firebase ID tokens for Google-linked accounts.
// 2) QuizzUp guest tokens signed by this backend. Guest mode keeps gameplay
//    available even when Firebase Authentication is unavailable.
//
// The backend never trusts the client-supplied clientId string.

const crypto = require('crypto');
const { verifyGuestToken, isGuestToken } = require('./guest-auth');
const { canonicalForFirebase } = require('./account-links');

const API_KEY = process.env.FIREBASE_API_KEY;
const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const cache = new Map(); // sha256(firebaseIdToken) -> { uid: rawFirebaseUid, expiresAt }
const pending = new Map(); // sha256(firebaseIdToken) -> Promise<rawFirebaseUid|null>

function tokenCacheKey(idToken) {
  return crypto.createHash('sha256').update(idToken).digest('hex');
}

function tokenExpiryMs(idToken) {
  try {
    const parts = String(idToken).split('.');
    if (parts.length !== 3) return 0;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const expSeconds = Number(payload.exp);
    return Number.isFinite(expSeconds) && expSeconds > 0 ? expSeconds * 1000 : 0;
  } catch {
    return 0;
  }
}

async function verifyFirebaseRemote(idToken, cacheKey) {
  if (!API_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${LOOKUP_URL}?key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;

    const data = await resp.json();
    const uid = data?.users?.[0]?.localId;
    if (!uid || typeof uid !== 'string') return null;

    const now = Date.now();
    const jwtExpiry = tokenExpiryMs(idToken);
    if (jwtExpiry && jwtExpiry <= now) return null;
    const expiresAt = jwtExpiry
      ? Math.min(now + CACHE_TTL_MS, jwtExpiry)
      : now + CACHE_TTL_MS;

    if (cache.size >= MAX_CACHE_ENTRIES) {
      sweepCache();
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
    }
    cache.set(cacheKey, { uid, expiresAt });
    return uid;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string' || !API_KEY) return null;

  const cacheKey = tokenCacheKey(idToken);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.uid;

  const inFlight = pending.get(cacheKey);
  if (inFlight) return inFlight;

  const verification = verifyFirebaseRemote(idToken, cacheKey);
  pending.set(cacheKey, verification);
  try {
    return await verification;
  } finally {
    if (pending.get(cacheKey) === verification) pending.delete(cacheKey);
  }
}

async function verifyIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;

  if (isGuestToken(idToken)) {
    return verifyGuestToken(idToken);
  }

  const firebaseUid = await verifyFirebaseIdToken(idToken);
  return firebaseUid ? canonicalForFirebase(firebaseUid) : null;
}

function sweepCache() {
  const now = Date.now();
  for (const [token, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(token);
  }
}

module.exports = {
  verifyIdToken,
  verifyFirebaseIdToken,
  sweepCache,
  tokenExpiryMs,
};
