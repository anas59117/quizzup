// Per-theme progression, like the original QuizUp: every finished game adds
// XP to the player's level *in that theme*, and each theme has its own
// leaderboard. Stored separately from stats.json so the global stats format
// (and its normalizer) is untouched.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { levelFromXp } = require('./stats');

const STORE = getStorePath('topic-stats.json');
const MAX_TOPICS_PER_PLAYER = 400;
const KEY_RE = /^[A-Za-z0-9_-]{1,64}$/;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const toCount = (v, max = Number.MAX_SAFE_INTEGER) => (
  Number.isFinite(Number(v)) && Number(v) > 0 ? Math.min(max, Math.floor(Number(v))) : 0
);

function normalize(raw) {
  const out = Object.create(null);
  if (!isPlainObject(raw)) return out;
  for (const [clientId, topics] of Object.entries(raw)) {
    if (!clientId || clientId.length > 128) continue;
    if (!isPlainObject(topics)) continue;
    const clean = Object.create(null);
    let n = 0;
    for (const [key, t] of Object.entries(topics)) {
      if (!KEY_RE.test(key) || !isPlainObject(t) || n >= MAX_TOPICS_PER_PLAYER) continue;
      const games = toCount(t.games, 1e9);
      clean[key] = { games, wins: Math.min(games, toCount(t.wins, 1e9)), xp: toCount(t.xp) };
      n += 1;
    }
    out[clientId] = clean;
  }
  return out;
}

const store = normalize(readJsonFileSync(STORE, {}, isPlainObject));
const persist = createJsonWriter(STORE, () => store);

function record(clientId, categoryKey, { won = false, xp = 0 } = {}) {
  if (!clientId || typeof categoryKey !== 'string' || !KEY_RE.test(categoryKey)) return;
  const topics = store[clientId] || (store[clientId] = Object.create(null));
  if (!topics[categoryKey] && Object.keys(topics).length >= MAX_TOPICS_PER_PLAYER) return;
  const t = topics[categoryKey] || (topics[categoryKey] = { games: 0, wins: 0, xp: 0 });
  t.games += 1;
  if (won) t.wins += 1;
  t.xp = Math.min(Number.MAX_SAFE_INTEGER, t.xp + toCount(xp));
  persist();
}

function withLevel(key, t) {
  const { level, xpIntoLevel, xpForLevel } = levelFromXp(t.xp);
  return { key, games: t.games, wins: t.wins, xp: t.xp, level, xpIntoLevel, xpForLevel };
}

// A player's themes, best first.
function getPlayerTopics(clientId, limit = 12) {
  const topics = (clientId && store[clientId]) || {};
  return Object.entries(topics)
    .map(([key, t]) => withLevel(key, t))
    .sort((a, b) => b.xp - a.xp || b.games - a.games || a.key.localeCompare(b.key))
    .slice(0, Math.max(1, Math.min(50, Math.floor(Number(limit) || 12))));
}

function getTopic(clientId, categoryKey) {
  const t = clientId && store[clientId] && store[clientId][categoryKey];
  return withLevel(categoryKey, t || { games: 0, wins: 0, xp: 0 });
}

function getTopicLeaderboard(categoryKey, limit = 50, clientId = null) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));
  const rows = [];
  for (const [id, topics] of Object.entries(store)) {
    const t = topics[categoryKey];
    if (t && t.games > 0) rows.push({ clientId: id, ...withLevel(categoryKey, t) });
  }
  rows.sort((a, b) => b.xp - a.xp || b.wins - a.wins || a.games - b.games || a.clientId.localeCompare(b.clientId));
  rows.forEach((r, i) => {
    r.rank = i + 1;
    r.winRate = r.games ? Math.round((r.wins / r.games) * 100) : 0;
  });
  const yourRank = clientId ? (rows.find((r) => r.clientId === clientId)?.rank || null) : null;
  return { total: rows.length, yourRank, entries: rows.slice(0, safeLimit) };
}

module.exports = { record, getPlayerTopics, getTopic, getTopicLeaderboard, normalize };
