// Persistent player stats (games/wins/streak), keyed by clientId. Same
// debounced-JSON-file pattern as reports.js/social.js — good enough for a
// single instance; move to a real DB if this ever needs to scale out.

const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, 'stats.json');

let stats = {}; // clientId -> { games, wins, streak }

try {
  stats = JSON.parse(fs.readFileSync(STORE, 'utf8'));
} catch {
  /* no store yet or unreadable — start fresh */
}

let writeScheduled = false;
function persist() {
  if (writeScheduled) return;
  writeScheduled = true;
  setTimeout(() => {
    writeScheduled = false;
    try {
      fs.writeFileSync(STORE, JSON.stringify(stats));
    } catch {
      /* disk may be read-only/full — stats still work in memory */
    }
  }, 1000);
}

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
