// One-way "follow" graph, like the original QuizUp: follow any player without
// approval (friends stay the mutual, approval-based relation used for DMs).
// Persisted in its own JSON store; the reverse (followers) index is rebuilt
// in memory on load.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('follows.json');
const MAX_FOLLOWING = 1000;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const validId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 128;

function normalize(raw) {
  const following = Object.create(null);
  const src = isPlainObject(raw) && isPlainObject(raw.following) ? raw.following : {};
  for (const [id, list] of Object.entries(src)) {
    if (!validId(id) || !Array.isArray(list)) continue;
    const seen = new Set();
    for (const other of list) {
      if (validId(other) && other !== id && !seen.has(other) && seen.size < MAX_FOLLOWING) seen.add(other);
    }
    if (seen.size) following[id] = [...seen];
  }
  return following;
}

const following = normalize(readJsonFileSync(STORE, { following: {} }, isPlainObject));
const followers = new Map(); // id -> Set of follower ids
for (const [id, list] of Object.entries(following)) {
  list.forEach((other) => {
    if (!followers.has(other)) followers.set(other, new Set());
    followers.get(other).add(id);
  });
}

const persist = createJsonWriter(STORE, () => ({ following }));

function isFollowing(a, b) {
  return !!(following[a] && following[a].includes(b));
}

// Returns { ok, reason? }.
function follow(a, b) {
  if (!validId(a) || !validId(b) || a === b) return { ok: false, reason: 'invalid' };
  if (isFollowing(a, b)) return { ok: true, changed: false };
  const list = following[a] || (following[a] = []);
  if (list.length >= MAX_FOLLOWING) return { ok: false, reason: 'limit' };
  list.push(b);
  if (!followers.has(b)) followers.set(b, new Set());
  followers.get(b).add(a);
  persist();
  return { ok: true, changed: true };
}

function unfollow(a, b) {
  if (!isFollowing(a, b)) return { ok: true, changed: false };
  following[a] = following[a].filter((x) => x !== b);
  if (!following[a].length) delete following[a];
  followers.get(b)?.delete(a);
  persist();
  return { ok: true, changed: true };
}

function getFollowing(id) {
  return following[id] ? [...following[id]] : [];
}

function counts(id) {
  return { followers: followers.get(id)?.size || 0, following: following[id]?.length || 0 };
}

module.exports = { follow, unfollow, isFollowing, getFollowing, counts, normalize };
