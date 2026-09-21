const crypto = require('crypto');

const TOKEN_PREFIX = 'qg1';
const DEFAULT_TTL_DAYS = 90;
const MIN_SECRET_LENGTH = 32;
const GUEST_UID_RE = /^guest_[A-Za-z0-9_-]{20,64}$/;

function getSecret() {
  const secret = String(process.env.GUEST_AUTH_SECRET || '');
  return secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

function tokenTtlMs() {
  const rawText = String(process.env.GUEST_AUTH_TTL_DAYS || '').trim();
  const raw = rawText ? Number(rawText) : Number.NaN;
  const days = Number.isFinite(raw) ? Math.max(1, Math.min(365, raw)) : DEFAULT_TTL_DAYS;
  return Math.floor(days * 24 * 60 * 60 * 1000);
}

function newGuestUid() {
  return `guest_${crypto.randomBytes(18).toString('base64url')}`;
}

function signPart(payloadPart, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${TOKEN_PREFIX}.${payloadPart}`)
    .digest('base64url');
}

function issueGuestToken(uid = newGuestUid(), now = Date.now()) {
  const secret = getSecret();
  if (!secret) return null;
  if (!GUEST_UID_RE.test(String(uid))) return null;

  const expiresAt = now + tokenTtlMs();
  const payload = {
    v: 1,
    sub: String(uid),
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPart(payloadPart, secret);

  return {
    uid: payload.sub,
    token: `${TOKEN_PREFIX}.${payloadPart}.${signature}`,
    expiresAt,
  };
}

function verifyGuestToken(token, now = Date.now()) {
  const secret = getSecret();
  if (!secret || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
  const [, payloadPart, signaturePart] = parts;

  const expected = signPart(payloadPart, secret);
  const actualBuffer = Buffer.from(signaturePart, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (
    actualBuffer.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    const nowSeconds = Math.floor(now / 1000);
    if (payload?.v !== 1) return null;
    if (!GUEST_UID_RE.test(String(payload?.sub || ''))) return null;
    if (!Number.isFinite(payload?.iat) || !Number.isFinite(payload?.exp)) return null;
    if (payload.iat > nowSeconds + 60) return null;
    if (payload.exp <= nowSeconds) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function issueOrRefreshGuestToken(existingToken, now = Date.now()) {
  const existingUid = verifyGuestToken(existingToken, now);
  return issueGuestToken(existingUid || newGuestUid(), now);
}

function isGuestToken(token) {
  return typeof token === 'string' && token.startsWith(`${TOKEN_PREFIX}.`);
}

module.exports = {
  issueGuestToken,
  issueOrRefreshGuestToken,
  verifyGuestToken,
  isGuestToken,
  newGuestUid,
  tokenTtlMs,
};
