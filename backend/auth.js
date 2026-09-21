// Verifies a Firebase ID token server-side so a client can never claim to be
// someone else's clientId. Uses the Identity Toolkit REST "lookup" endpoint
// with the project's public Web API key — no service-account credentials
// needed, since this only reads back the uid bound to a signed token.
//
// A previous version trusted a client-supplied `clientId` string outright:
// any connection could `identify` as another player's id and hijack their
// presence, friend requests, and DMs. Every verified uid now comes from a
// token Firebase itself signed, which a client cannot forge.

const crypto = require('crypto');

const API_KEY = process.env.FIREBASE_API_KEY;
const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

// Small in-memory cache so we don't re-verify the same token on every
// message — a token is valid for its own lifetime (~1h), so caching for a
// few minutes is safe and cuts the network round-trip on the hot path.
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const cache = new Map(); // sha256(idToken) -> { uid, expiresAt }
const pending = new Map(); // sha256(idToken) -> Promise<uid|null>

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

async function verifyRemote(idToken, cacheKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${LOOKUP_URL}?key=${API_KEY}`, {
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
    return null; // network error / timeout / bad response — fail closed
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;
  if (!API_KEY) return null; // misconfigured server — fail closed, not open

  const cacheKey = tokenCacheKey(idToken);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.uid;

  // A burst of reconnects for the same token should share one Firebase
  // lookup instead of multiplying outbound verification requests.
  const inFlight = pending.get(cacheKey);
  if (inFlight) return inFlight;

  const verification = verifyRemote(idToken, cacheKey);
  pending.set(cacheKey, verification);
  try {
    return await verification;
  } finally {
    if (pending.get(cacheKey) === verification) pending.delete(cacheKey);
  }
}

async function diagnoseFirebaseAuth(origin = '') {
  if (!API_KEY) return { ok: false, stage: 'config', code: 'MISSING_API_KEY' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const headers = { 'Content-Type': 'application/json' };
  if (origin) {
    headers.Origin = origin;
    headers.Referer = `${origin.replace(/\/$/, '')}/`;
  }

  let idToken = null;
  try {
    const projectResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(API_KEY)}`,
      { headers, signal: controller.signal }
    );
    const projectData = await projectResp.json().catch(() => ({}));
    if (!projectResp.ok) {
      return {
        ok: false,
        stage: 'project_config',
        status: projectResp.status,
        code: projectData?.error?.message || 'PROJECT_CONFIG_FAILED',
      };
    }

    let originAuthorized = null;
    try {
      const hostname = origin ? new URL(origin).hostname : '';
      originAuthorized = hostname
        ? (projectData.authorizedDomains || []).includes(hostname)
        : null;
    } catch {
      originAuthorized = null;
    }

    const signUpResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(API_KEY)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ returnSecureToken: true }),
        signal: controller.signal,
      }
    );
    const signUpData = await signUpResp.json().catch(() => ({}));
    if (!signUpResp.ok) {
      return {
        ok: false,
        stage: 'anonymous_sign_in',
        status: signUpResp.status,
        code: signUpData?.error?.message || 'ANONYMOUS_SIGN_IN_FAILED',
        projectId: projectData.projectId || null,
        originAuthorized,
      };
    }

    idToken = signUpData.idToken || null;
    if (!idToken) {
      return {
        ok: false,
        stage: 'anonymous_sign_in',
        code: 'MISSING_ID_TOKEN',
        projectId: projectData.projectId || null,
        originAuthorized,
      };
    }

    const lookupResp = await fetch(
      `${LOOKUP_URL}?key=${encodeURIComponent(API_KEY)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );
    const lookupData = await lookupResp.json().catch(() => ({}));
    const lookupOk = (
      lookupResp.ok
      && lookupData?.users?.[0]?.localId
      && lookupData.users[0].localId === signUpData.localId
    );

    if (!lookupOk) {
      return {
        ok: false,
        stage: 'token_lookup',
        status: lookupResp.status,
        code: lookupData?.error?.message || 'TOKEN_LOOKUP_FAILED',
        projectId: projectData.projectId || null,
        originAuthorized,
      };
    }

    return {
      ok: true,
      stage: 'complete',
      projectId: projectData.projectId || null,
      originAuthorized,
      anonymousSignIn: true,
      tokenLookup: true,
    };
  } catch (err) {
    return {
      ok: false,
      stage: 'network',
      code: err?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    };
  } finally {
    clearTimeout(timeout);
    if (idToken) {
      // Best-effort cleanup: the diagnostic should not leave a test
      // anonymous account behind in Firebase Authentication.
      fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(API_KEY)}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ idToken }),
        }
      ).catch(() => {});
    }
  }
}

// Periodic cleanup so the cache can't grow unbounded with one-shot tokens.
function sweepCache() {
  const now = Date.now();
  for (const [token, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(token);
  }
}

module.exports = { verifyIdToken, sweepCache, tokenExpiryMs, diagnoseFirebaseAuth };
