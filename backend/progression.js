// Lifetime XP remains the ranking/reward currency. A separate offset moves
// legacy progress onto the slower curve without removing levels or fractions.
const VERSION = 2;
const MAX_XP = Number.MAX_SAFE_INTEGER;
const MAX_OFFSET = BigInt(MAX_XP) * 2n;

function safeXp(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(MAX_XP, Math.floor(n)) : 0;
}

function offsetOf(value) {
  // Bound length before parsing: corrupted snapshots cannot allocate huge ints.
  if (typeof value !== 'string' || !/^\d{1,17}$/.test(value)) return 0n;
  const offset = BigInt(value);
  return offset <= MAX_OFFSET ? offset : 0n;
}

function normalizeProgression(raw = {}, xp = raw.xp) {
  const version = Number(raw.progressionVersion);
  if (Number.isSafeInteger(version) && version >= VERSION) {
    // Retain future version markers; never apply the legacy bonus twice.
    return { progressionVersion: version, progressionOffset: offsetOf(raw.progressionOffset).toString() };
  }
  return { progressionVersion: VERSION, progressionOffset: (BigInt(safeXp(xp)) * 2n).toString() };
}

function newProgression() {
  return { progressionVersion: VERSION, progressionOffset: '0' };
}

function levelFromXp(rawXp, metadata) {
  const xp = safeXp(rawXp);
  const total = BigInt(xp) + (metadata ? offsetOf(normalizeProgression(metadata, xp).progressionOffset) : 0n);
  // N*600 per level => 300*N*(N+1) cumulative. The floating-point
  // estimate is corrected with exact bounded arithmetic at large boundaries.
  let completed = BigInt(Math.max(0, Math.floor((Math.sqrt(1 + Number(total) / 75) - 1) / 2)));
  const consumed = n => 300n * n * (n + 1n);
  while (completed > 0n && consumed(completed) > total) completed -= 1n;
  while (consumed(completed + 1n) <= total) completed += 1n;
  const level = Number(completed + 1n);
  return { level, xpIntoLevel: Number(total - consumed(completed)), xpForLevel: level * 600 };
}

module.exports = { normalizeProgression, newProgression, levelFromXp };
