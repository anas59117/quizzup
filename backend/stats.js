// Persistent player stats (games/wins/streak), keyed by clientId. Same
// debounced-JSON-file pattern as reports.js/social.js — good enough for a
// single instance; move to a real DB if this ever needs to scale out.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizeStatsStore } = require('./store-normalize');
const shop = require('./shop');

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

// Days are counted on French time: the launch market is francophone, and a
// player finishing at 00:30 should see "a new day", not yesterday's.
const STREAK_TIME_ZONE = 'Europe/Paris';
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STREAK_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

function dayKey(now = Date.now()) {
  return dayFormatter.format(new Date(now)); // "YYYY-MM-DD"
}

function dayIndex(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

// A streak is still alive if the player played today or yesterday.
function currentDayStreak(s, now = Date.now()) {
  if (!s || !s.lastPlayDay) return 0;
  const gap = dayIndex(dayKey(now)) - dayIndex(s.lastPlayDay);
  return gap >= 0 && gap <= 1 ? (s.dayStreak || 0) : 0;
}

// Called once per finished game. Returns whether today's game extended the
// streak (only the first game of a day does).
function recordPlayDay(clientId, now = Date.now()) {
  if (!clientId) return { dayStreak: 0, increased: false };
  const s = stats[clientId] || (stats[clientId] = { games: 0, wins: 0, streak: 0, xp: 0, coins: 0 });
  const today = dayKey(now);
  if (s.lastPlayDay === today) return { dayStreak: s.dayStreak || 1, increased: false };
  const gap = s.lastPlayDay ? dayIndex(today) - dayIndex(s.lastPlayDay) : null;
  s.dayStreak = gap === 1 ? (s.dayStreak || 0) + 1 : 1;
  s.bestDayStreak = Math.max(s.bestDayStreak || 0, s.dayStreak);
  s.lastPlayDay = today;
  persist();
  return { dayStreak: s.dayStreak, increased: true };
}

function getStats(clientId, now = Date.now()) {
  const s = clientId && stats[clientId];
  const xp = s ? s.xp || 0 : 0;
  const { level, xpIntoLevel, xpForLevel } = levelFromXp(xp);
  return {
    games: s ? s.games : 0,
    wins: s ? s.wins : 0,
    streak: s ? s.streak : 0,
    xp,
    coins: s ? s.coins || 0 : 0,
    dayStreak: currentDayStreak(s, now),
    bestDayStreak: s ? s.bestDayStreak || 0 : 0,
    playedToday: !!(s && s.lastPlayDay === dayKey(now)),
    frame: s && s.frame ? s.frame : 'none',
    ownedFrames: ['none', ...((s && s.owned) || [])],
    adRewardsLeft: adRewardsLeft(s, now),
    level,
    xpIntoLevel,
    xpForLevel,
  };
}

// Records one finished game's outcome. A tie neither extends nor breaks
// streak. `xpEarned` accumulates toward the player's persistent level.
function recordResult(clientId, won, tie, xpEarned, coinsEarned = 0) {
  if (!clientId) return;
  const s = stats[clientId] || { games: 0, wins: 0, streak: 0, xp: 0, coins: 0 };
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
  stats[clientId] = s;
  persist();
}

function ensure(clientId) {
  return stats[clientId] || (stats[clientId] = { games: 0, wins: 0, streak: 0, xp: 0, coins: 0 });
}

function adRewardsLeft(s, now = Date.now()) {
  const used = s && s.adDay === dayKey(now) ? s.adCount || 0 : 0;
  return Math.max(0, shop.MAX_AD_REWARDS_PER_DAY - used);
}

// Equipped avatar frame, shown to opponents in game.
function getFrame(clientId) {
  const s = clientId && stats[clientId];
  return s && s.frame && shop.getFrame(s.frame) ? s.frame : 'none';
}

function buyFrame(clientId, frameId) {
  if (!clientId) return { ok: false, error: 'auth' };
  const item = shop.getFrame(frameId);
  if (!item || item.id === 'none') return { ok: false, error: 'unknown' };
  const s = ensure(clientId);
  s.owned = Array.isArray(s.owned) ? s.owned : [];
  if (s.owned.includes(item.id)) return { ok: false, error: 'owned' };
  if ((s.coins || 0) < item.price) return { ok: false, error: 'coins' };
  s.coins -= item.price;
  s.owned.push(item.id);
  s.frame = item.id; // a new purchase is equipped straight away
  persist();
  return { ok: true };
}

function equipFrame(clientId, frameId) {
  if (!clientId) return { ok: false, error: 'auth' };
  const item = shop.getFrame(frameId);
  if (!item) return { ok: false, error: 'unknown' };
  const s = ensure(clientId);
  if (item.id !== 'none' && !(s.owned || []).includes(item.id)) return { ok: false, error: 'not_owned' };
  s.frame = item.id;
  persist();
  return { ok: true };
}

// Remembers the coins of the player's last finished game so a rewarded ad
// can double them once.
function setLastReward(clientId, gameId, coins) {
  if (!clientId || typeof gameId !== 'string') return;
  const s = ensure(clientId);
  s.lastReward = { gameId: gameId.slice(0, 64), coins: Math.max(0, Math.min(1000, Math.floor(Number(coins) || 0))), claimed: false };
  persist();
}

function claimAdReward(clientId, gameId, now = Date.now()) {
  if (!clientId) return { ok: false, error: 'auth' };
  const s = stats[clientId];
  const last = s && s.lastReward;
  if (!last || last.gameId !== gameId || !last.coins) return { ok: false, error: 'no_game' };
  if (last.claimed) return { ok: false, error: 'claimed' };
  if (adRewardsLeft(s, now) <= 0) return { ok: false, error: 'limit' };
  const today = dayKey(now);
  s.adCount = s.adDay === today ? (s.adCount || 0) + 1 : 1;
  s.adDay = today;
  last.claimed = true;
  s.coins = Math.min(Number.MAX_SAFE_INTEGER, (s.coins || 0) + last.coins);
  persist();
  return { ok: true, coins: last.coins };
}

module.exports = { getStats, getLeaderboard, rankLeaderboard, recordResult, recordPlayDay, dayKey, levelFromXp,
  getFrame, buyFrame, equipFrame, setLastReward, claimAdReward };
