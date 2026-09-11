// Verifies a Firebase ID token server-side so a client can never claim to be
// someone else's clientId. Uses the Identity Toolkit REST "lookup" endpoint
// with the project's public Web API key — no service-account credentials
// needed, since this only reads back the uid bound to a signed token.
//
// A previous version trusted a client-supplied `clientId` string outright:
// any connection could `identify` as another player's id and hijack their
// presence, friend requests, and DMs. Every verified uid now comes from a
// token Firebase itself signed, which a client cannot forge.

const API_KEY = process.env.FIREBASE_API_KEY;
const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

// Small in-memory cache so we don't re-verify the same token on every
// message — a token is valid for its own lifetime (~1h), so caching for a
// few minutes is safe and cuts the network round-trip on the hot path.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // idToken -> { uid, expiresAt }

async function verifyIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;
  if (!API_KEY) return null; // misconfigured server — fail closed, not open

  const cached = cache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) return cached.uid;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${LOOKUP_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    const uid = data?.users?.[0]?.localId;
    if (!uid || typeof uid !== 'string') return null;
    cache.set(idToken, { uid, expiresAt: Date.now() + CACHE_TTL_MS });
    return uid;
  } catch {
    return null; // network error / timeout / bad response — fail closed
  }
}

// Periodic cleanup so the cache can't grow unbounded with one-shot tokens.
function sweepCache() {
  const now = Date.now();
  for (const [token, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(token);
  }
}

module.exports = { verifyIdToken, sweepCache };
