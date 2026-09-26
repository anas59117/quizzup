// Small persisted inbox for players who were offline when something
// happened to them (e.g. a friend overtook them in a theme). Delivered and
// cleared on their next identify.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('notifications.json');
const MAX_PER_PLAYER = 20;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const TYPES = new Set(['friend_overtook']);
const KEY_RE = /^[A-Za-z0-9_-]{1,64}$/;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const validId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 128;
const cleanText = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

function cleanNotification(n, now = Date.now()) {
  if (!isPlainObject(n) || !TYPES.has(n.type) || !validId(n.fromId)) return null;
  const at = Number(n.at);
  if (!Number.isFinite(at) || now - at > MAX_AGE_MS) return null;
  const category = typeof n.category === 'string' && KEY_RE.test(n.category) ? n.category : null;
  if (!category) return null;
  return {
    type: n.type,
    fromId: n.fromId,
    fromName: cleanText(n.fromName, 40),
    fromAvatar: cleanText(n.fromAvatar, 16),
    category,
    at,
  };
}

function normalize(raw, now = Date.now()) {
  const out = Object.create(null);
  if (!isPlainObject(raw)) return out;
  for (const [id, list] of Object.entries(raw)) {
    if (!validId(id) || !Array.isArray(list)) continue;
    const clean = list.map((n) => cleanNotification(n, now)).filter(Boolean).slice(-MAX_PER_PLAYER);
    if (clean.length) out[id] = clean;
  }
  return out;
}

const inbox = normalize(readJsonFileSync(STORE, {}, isPlainObject));
const persist = createJsonWriter(STORE, () => inbox);

function push(clientId, notification, now = Date.now()) {
  if (!validId(clientId)) return false;
  const n = cleanNotification({ at: now, ...notification }, now);
  if (!n) return false;
  // One entry per friend+theme: a newer overtake replaces the older one.
  const list = (inbox[clientId] || []).filter((x) => !(x.type === n.type && x.fromId === n.fromId && x.category === n.category));
  list.push(n);
  inbox[clientId] = list.slice(-MAX_PER_PLAYER);
  persist();
  return true;
}

function take(clientId, now = Date.now()) {
  const list = inbox[clientId];
  if (!list) return [];
  delete inbox[clientId];
  persist();
  return list.filter((n) => now - n.at <= MAX_AGE_MS);
}

module.exports = { push, take, normalize };
