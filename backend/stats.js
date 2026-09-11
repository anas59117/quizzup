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

function getStats(clientId) {
  const s = clientId && stats[clientId];
  return s ? { games: s.games, wins: s.wins, streak: s.streak } : { games: 0, wins: 0, streak: 0 };
}

// Records one finished game's outcome. A tie neither extends nor breaks streak.
function recordResult(clientId, won, tie) {
  if (!clientId) return;
  const s = stats[clientId] || { games: 0, wins: 0, streak: 0 };
  s.games += 1;
  if (won) { s.wins += 1; s.streak += 1; }
  else if (!tie) { s.streak = 0; }
  stats[clientId] = s;
  persist();
}

module.exports = { getStats, recordResult };
