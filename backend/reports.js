// Player-driven question moderation. Players flag a suspicious question; once
// a question reaches REPORT_THRESHOLD flags it is quarantined and never served
// again. This lets the community clean the (large, imperfect) OpenTDB pool.
//
// Persistence is a local JSON file — best-effort, good enough for a single
// instance. For multi-instance/durable moderation, move this to Firebase
// (same interface: report / isQuarantined / stats).

const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, 'reports.json');
const REPORT_THRESHOLD = 3; // flags before a question is quarantined
const MAX_TRACKED = 5000; // cap the counts map so it can't grow unbounded

let counts = {}; // question text -> flag count
const quarantined = new Set();

try {
  const saved = JSON.parse(fs.readFileSync(STORE, 'utf8'));
  counts = saved.counts || {};
  (saved.quarantined || []).forEach((t) => quarantined.add(t));
} catch {
  /* no store yet or unreadable — start fresh */
}

let writeScheduled = false;
function persist() {
  // Debounce writes so a burst of reports doesn't hammer the disk.
  if (writeScheduled) return;
  writeScheduled = true;
  setTimeout(() => {
    writeScheduled = false;
    try {
      fs.writeFileSync(STORE, JSON.stringify({ counts, quarantined: [...quarantined] }));
    } catch {
      /* disk may be read-only/full — moderation still works in memory */
    }
  }, 1000);
}

function report(text) {
  if (!text || typeof text !== 'string') return false;
  if (quarantined.has(text)) return true; // already gone
  if (!(text in counts) && Object.keys(counts).length >= MAX_TRACKED) return false;
  counts[text] = (counts[text] || 0) + 1;
  if (counts[text] >= REPORT_THRESHOLD) {
    quarantined.add(text);
    delete counts[text];
  }
  persist();
  return true;
}

function isQuarantined(text) {
  return quarantined.has(text);
}

function stats() {
  return { pending: Object.keys(counts).length, quarantined: quarantined.size, threshold: REPORT_THRESHOLD };
}

module.exports = { report, isQuarantined, stats };
