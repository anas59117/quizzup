// Player-driven question moderation. Players flag a suspicious question; once
// a question reaches REPORT_THRESHOLD flags it is quarantined and never served
// again. This lets the community clean the (large, imperfect) OpenTDB pool.
//
// Persistence is a local JSON file — best-effort, good enough for a single
// instance. For multi-instance/durable moderation, move this to Firebase
// (same interface: report / isQuarantined / stats).

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('reports.json');
const REPORT_THRESHOLD = 3; // flags before a question is quarantined
const MAX_TRACKED = 5000; // cap the counts map so it can't grow unbounded

const savedReports = readJsonFileSync(
  STORE,
  { counts: {}, quarantined: [] },
  (value) => (
    !!value
    && typeof value === 'object'
    && !!value.counts
    && typeof value.counts === 'object'
    && !Array.isArray(value.counts)
    && Array.isArray(value.quarantined)
  )
);
let counts = savedReports.counts; // question key -> flag count
const quarantined = new Set(savedReports.quarantined);

const persist = createJsonWriter(
  STORE,
  () => ({ counts, quarantined: [...quarantined] })
);

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
