// User report & block — App Store Guideline 1.2 compliance.
// Players can report offensive usernames/behaviour and block opponents.
// Persistence: local JSON (same pattern as reports.js / social.js).

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('user-reports.json');
const REPORT_THRESHOLD = 5; // flags before a username is auto-hidden
const MAX_REPORTS = 10000;

const saved = readJsonFileSync(
  STORE,
  { reports: [], blocks: {}, flaggedNames: {} },
  (v) => !!v && typeof v === 'object' && !Array.isArray(v)
);

// reports: [{ reporterId, targetId, targetName, reason, ts }]
const reports = Array.isArray(saved.reports) ? saved.reports : [];
// blocks: { playerId: Set<blockedId> }
const blocks = {};
if (saved.blocks && typeof saved.blocks === 'object') {
  for (const [k, v] of Object.entries(saved.blocks)) {
    blocks[k] = new Set(Array.isArray(v) ? v : []);
  }
}
// flaggedNames: { name_lower: count }
const flaggedNames = (saved.flaggedNames && typeof saved.flaggedNames === 'object')
  ? { ...saved.flaggedNames } : {};

const persist = createJsonWriter(STORE, () => ({
  reports: reports.slice(-MAX_REPORTS),
  blocks: Object.fromEntries(
    Object.entries(blocks).map(([k, v]) => [k, [...v]])
  ),
  flaggedNames,
}));

function reportUser(reporterId, targetId, targetName, reason) {
  if (!reporterId || !targetId || reporterId === targetId) return false;
  // Deduplicate: same reporter can't flag same target twice
  const exists = reports.some(
    (r) => r.reporterId === reporterId && r.targetId === targetId
  );
  if (exists) return true; // already reported

  reports.push({
    reporterId,
    targetId,
    targetName: String(targetName || '').slice(0, 50),
    reason: String(reason || 'offensive').slice(0, 200),
    ts: Date.now(),
  });

  // Track name flags for auto-hide
  if (targetName) {
    const key = String(targetName).toLowerCase().trim();
    if (key) {
      flaggedNames[key] = (flaggedNames[key] || 0) + 1;
    }
  }

  persist();
  return true;
}

function blockUser(playerId, blockedId) {
  if (!playerId || !blockedId || playerId === blockedId) return false;
  if (!blocks[playerId]) blocks[playerId] = new Set();
  blocks[playerId].add(blockedId);
  persist();
  return true;
}

function unblockUser(playerId, blockedId) {
  if (!blocks[playerId]) return false;
  blocks[playerId].delete(blockedId);
  if (blocks[playerId].size === 0) delete blocks[playerId];
  persist();
  return true;
}

function isBlocked(playerId, otherId) {
  return !!(blocks[playerId] && blocks[playerId].has(otherId));
}

function getBlockList(playerId) {
  return blocks[playerId] ? [...blocks[playerId]] : [];
}

function isNameFlagged(name) {
  if (!name) return false;
  const key = String(name).toLowerCase().trim();
  return (flaggedNames[key] || 0) >= REPORT_THRESHOLD;
}

function stats() {
  return {
    totalReports: reports.length,
    uniqueBlocks: Object.keys(blocks).length,
    flaggedNames: Object.keys(flaggedNames).filter(
      (k) => flaggedNames[k] >= REPORT_THRESHOLD
    ).length,
  };
}

module.exports = {
  reportUser,
  blockUser,
  unblockUser,
  isBlocked,
  getBlockList,
  isNameFlagged,
  stats,
};
