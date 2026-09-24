// Persistent player stats (games/wins/streak), keyed by clientId. Same
// debounced-JSON-file pattern as reports.js/social.js — good enough for a
// single instance; move to a real DB if this ever needs to scale out.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizeStatsStore, normalizeRecentMatches } = require('./store-normalize');

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

function rankLeaderboard(source, limit = 50, clientId = null) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));
  const rows = Object.entries(source || {})
    .map(([id, value]) => {
      const games = Math.max(0, Math.floor(Number(value?.games) || 0));
      const wins = Math.max(0, Math.min(games, Math.floor(Number(value?.wins) || 0)));
      const streak = Math.max(0, Math.floor(Number(value?.streak) || 0));
      const xp = Math.max(0, Math.floor(Number(value?.xp) || 0));
      const coins = Math.max(0, Math.floor(Number(value?.coins) || 0));
      const level = levelFromXp(xp).level;
      return {
        clientId: id,
        games,
        wins,
        streak,
        xp,
        coins,
        level,
        winRate: games ? Math.round((wins / games) * 100) : 0,
      };
    })
    .filter((row) => row.games > 0)
    .sort((a, b) => (
      b.xp - a.xp
      || b.wins - a.wins
      || b.streak - a.streak
      || a.games - b.games
      || a.clientId.localeCompare(b.clientId)
    ))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const yourRank = clientId
    ? (rows.find((row) => row.clientId === clientId)?.rank || null)
    : null;

  return {
    total: rows.length,
    yourRank,
    entries: rows.slice(0, safeLimit),
  };
}

function getLeaderboard(limit = 50, clientId = null) {
  return rankLeaderboard(stats, limit, clientId);
}

function appendRecentMatch(existing, match) {
  if (!match) return Array.isArray(existing) ? existing.slice(0, 10) : [];
  return normalizeRecentMatches([match, ...(Array.isArray(existing) ? existing : [])], 10);
}

function getStats(clientId) {
  const s = clientId && stats[clientId];
  const xp = s ? s.xp || 0 : 0;
  const { level, xpIntoLevel, xpForLevel } = levelFromXp(xp);
  return {
    games: s ? s.games : 0,
    wins: s ? s.wins : 0,
    streak: s ? s.streak : 0,
    xp,
    coins: s ? s.coins || 0 : 0,
    level,
    xpIntoLevel,
    xpForLevel,
    recent: s?.recent || [],
  };
}

// Records one finished game's outcome. A tie neither extends nor breaks
// streak. `xpEarned` accumulates toward the player's persistent level.
function recordResult(clientId, won, tie, xpEarned, coinsEarned = 0, match = null) {
  if (!clientId) return;
  const s = stats[clientId] || {
    games: 0, wins: 0, streak: 0, xp: 0, coins: 0, recent: [],
  };
  s.games += 1;
  if (won) { s.wins += 1; s.streak += 1; }
  else if (!tie) { s.streak = 0; }
  s.xp = Math.min(
    Number.MAX_SAFE_INTEGER,
    (s.xp || 0) + Math.max(0, Math.floor(Number(xpEarned) || 0))
  );
  s.coins = Math.min(
    Number.MAX_SAFE_INTEGER,
    (s.coins || 0) + Math.max(0, Math.floor(Number(coinsEarned) || 0))
  );
  s.recent = appendRecentMatch(s.recent, match);
  stats[clientId] = s;
  persist();
}

module.exports = {
  getStats,
  getLeaderboard,
  rankLeaderboard,
  recordResult,
  levelFromXp,
  appendRecentMatch,
};
