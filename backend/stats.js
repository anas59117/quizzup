// Persistent player stats (games/wins/streak), keyed by clientId. Same
// debounced-JSON-file pattern as reports.js/social.js — good enough for a
// single instance; move to a real DB if this ever needs to scale out.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizeStatsStore } = require('./store-normalize');

const STORE = getStorePath('stats.json');

const stats = normalizeStatsStore(readJsonFileSync(
  STORE,
  {},
  (value) => !!value && typeof value === 'object' && !Array.isArray(value)
)); // clientId -> { games, wins, streak, xp }

const persist = createJsonWriter(STORE, () => stats);

// Linear per-level cost (level N costs N*200 XP) has a triangular
// cumulative curve: completing n levels costs 100*n*(n+1). Solve the
// quadratic directly so a corrupted/very large XP value cannot force
// millions of loop iterations during profile rendering.
function levelFromXp(rawXp) {
  const xp = Number.isFinite(Number(rawXp)) && Number(rawXp) > 0
    ? Math.floor(Number(rawXp))
    : 0;
  const completedLevels = Math.max(
    0,
    Math.floor((-1 + Math.sqrt(1 + xp / 25)) / 2)
  );
  const level = completedLevels + 1;
  const consumed = 100 * completedLevels * (completedLevels + 1);
  return {
    level,
    xpIntoLevel: xp - consumed,
    xpForLevel: level * 200,
  };
}

function getStats(clientId) {
  const s = clientId && stats[clientId];
  const xp = s ? s.xp || 0 : 0;
  const { level, xpIntoLevel, xpForLevel } = levelFromXp(xp);
  return { games: s ? s.games : 0, wins: s ? s.wins : 0, streak: s ? s.streak : 0, xp, level, xpIntoLevel, xpForLevel };
}

// Records one finished game's outcome. A tie neither extends nor breaks
// streak. `xpEarned` accumulates toward the player's persistent level.
function recordResult(clientId, won, tie, xpEarned) {
  if (!clientId) return;
  const s = stats[clientId] || { games: 0, wins: 0, streak: 0, xp: 0 };
  s.games += 1;
  if (won) { s.wins += 1; s.streak += 1; }
  else if (!tie) { s.streak = 0; }
  s.xp = (s.xp || 0) + (xpEarned || 0);
  stats[clientId] = s;
  persist();
}

module.exports = { getStats, recordResult, levelFromXp };
