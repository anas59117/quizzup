// Per-category play analytics: how often each quiz theme is started and
// finished, split by "chosen by the player" vs "random quick play", with a
// rolling 30-day daily history for trends. Same debounced-JSON-file pattern
// as stats.js — anonymous counters only, no player identifiers stored.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');

const STORE = getStorePath('category-stats.json');
const HISTORY_DAYS = 30;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const toCount = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);

function emptyEntry() {
  return { starts: 0, chosen: 0, random: 0, completed: 0, abandoned: 0, players: 0, lastPlayedAt: null };
}

function normalize(raw) {
  const out = { totals: {}, daily: {} };
  if (!isPlainObject(raw)) return out;
  if (isPlainObject(raw.totals)) {
    for (const [key, v] of Object.entries(raw.totals)) {
      if (!isPlainObject(v)) continue;
      const e = emptyEntry();
      for (const f of ['starts', 'chosen', 'random', 'completed', 'abandoned', 'players']) e[f] = toCount(v[f]);
      e.lastPlayedAt = typeof v.lastPlayedAt === 'string' ? v.lastPlayedAt : null;
      out.totals[key] = e;
    }
  }
  if (isPlainObject(raw.daily)) {
    for (const [day, counts] of Object.entries(raw.daily)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isPlainObject(counts)) continue;
      out.daily[day] = {};
      for (const [key, n] of Object.entries(counts)) {
        const c = toCount(n);
        if (c) out.daily[day][key] = c;
      }
    }
  }
  return out;
}

const store = normalize(readJsonFileSync(STORE, {}, isPlainObject));
const persist = createJsonWriter(STORE, () => store);

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

function pruneHistory(now = new Date()) {
  const cutoff = new Date(now.getTime() - HISTORY_DAYS * 86400000).toISOString().slice(0, 10);
  for (const day of Object.keys(store.daily)) {
    if (day < cutoff) delete store.daily[day];
  }
}

function entry(categoryKey) {
  const key = String(categoryKey || 'unknown');
  if (!store.totals[key]) store.totals[key] = emptyEntry();
  return store.totals[key];
}

// Called once when a game actually starts (questions loaded, players live).
function recordStart(categoryKey, { players = 1, chosen = true, now = new Date() } = {}) {
  const key = String(categoryKey || 'unknown');
  const e = entry(key);
  e.starts += 1;
  if (chosen) e.chosen += 1; else e.random += 1;
  e.players += Math.max(1, toCount(players));
  e.lastPlayedAt = now.toISOString();
  const day = dayKey(now);
  store.daily[day] = store.daily[day] || {};
  store.daily[day][key] = (store.daily[day][key] || 0) + 1;
  pruneHistory(now);
  persist();
}

// Called once when a game ends. "complete" = all rounds played.
function recordFinish(categoryKey, reason = 'complete') {
  const e = entry(categoryKey);
  if (reason === 'complete') e.completed += 1; else e.abandoned += 1;
  persist();
}

// Ranked report. `labels` maps categoryKey -> display label so categories
// that were never played still show up at the bottom (dead-content signal).
function getReport({ days = 0, labels = {}, now = new Date() } = {}) {
  const windowDays = Math.max(0, Math.min(HISTORY_DAYS, Math.floor(Number(days) || 0)));
  let windowCounts = null;
  if (windowDays) {
    windowCounts = {};
    for (let i = 0; i < windowDays; i++) {
      const day = dayKey(new Date(now.getTime() - i * 86400000));
      for (const [key, n] of Object.entries(store.daily[day] || {})) {
        windowCounts[key] = (windowCounts[key] || 0) + n;
      }
    }
  }

  const keys = new Set([...Object.keys(labels), ...Object.keys(store.totals)]);
  const rows = [...keys].map((key) => {
    const e = store.totals[key] || emptyEntry();
    const finished = e.completed + e.abandoned;
    return {
      key,
      label: labels[key] || key,
      starts: e.starts,
      startsInWindow: windowCounts ? (windowCounts[key] || 0) : undefined,
      chosen: e.chosen,
      random: e.random,
      completed: e.completed,
      completionRate: finished ? Math.round((e.completed / finished) * 100) : null,
      players: e.players,
      lastPlayedAt: e.lastPlayedAt,
    };
  });

  const sortKey = windowCounts ? 'startsInWindow' : 'chosen';
  rows.sort((a, b) => (b[sortKey] - a[sortKey]) || (b.starts - a.starts) || a.label.localeCompare(b.label));
  rows.forEach((r, i) => { r.rank = i + 1; });

  const totalStarts = rows.reduce((s, r) => s + r.starts, 0);
  return {
    generatedAt: now.toISOString(),
    windowDays: windowDays || null,
    sortedBy: sortKey === 'chosen' ? 'chosen (times players picked this theme)' : `starts in last ${windowDays} days`,
    totalStarts,
    categoriesTracked: rows.length,
    neverPlayed: rows.filter((r) => r.starts === 0).length,
    categories: rows,
  };
}

module.exports = { recordStart, recordFinish, getReport, normalize, _store: store };
