// Persistent player stats (games/wins/streak), keyed by clientId. Same
// debounced-JSON-file pattern as reports.js/social.js — good enough for a
// single instance; move to a real DB if this ever needs to scale out.

const path = require('path');
const { createJsonWriter, readJsonFileSync } = require('./json-writer');

const STORE = path.join(__dirname, 'stats.json');

const stats = readJsonFileSync(
  STORE,
  {},
  (value) => !!value && typeof value === 'object' && !Array.isArray(value)
); // clientId -> { games, wins, streak, xp }

const persist = createJsonWriter(STORE, () => stats);

// Linear level curve: reaching level N costs N*200 cumulative XP. Returns
// the player's current level plus progress within it, for a level-up ring.
function levelFromXp(xp) {
  let level = 1;
  let consumed = 0;
  while (xp - consumed >= level * 200) {
    consumed += level * 200;
    level += 1;
  }
  return { level, xpIntoLevel: xp - consumed, xpForLevel: level * 200 };
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

module.exports = { getStats, recordResult };
