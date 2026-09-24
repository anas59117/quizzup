function nullDict() {
  return Object.create(null);
}

function asNonNegativeInt(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.floor(n));
}

function cleanId(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return id && id.length <= maxLength ? id : null;
}

function uniqueStringList(value, { limit = 1000, maxLength = 160, exclude = null } = {}) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();

  for (const item of value) {
    const id = cleanId(item, maxLength);
    if (!id || id === exclude || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}


const MATCH_OUTCOMES = new Set(['win', 'loss', 'tie', 'solo']);
const MATCH_MODES = new Set(['solo', 'multiplayer']);

function normalizeRecentMatches(value, limit = 10) {
  if (!Array.isArray(value)) return [];
  const safeLimit = Math.max(1, Math.min(25, Math.floor(Number(limit) || 10)));
  const out = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const outcome = MATCH_OUTCOMES.has(raw.outcome) ? raw.outcome : null;
    const mode = MATCH_MODES.has(raw.mode) ? raw.mode : null;
    if (!outcome || !mode) continue;
    if (mode === 'solo' && outcome !== 'solo') continue;
    if (mode === 'multiplayer' && outcome === 'solo') continue;

    const opponents = Array.isArray(raw.opponents)
      ? raw.opponents.slice(0, 3).map((opponent) => ({
        name: String(opponent?.name || 'Player').trim().slice(0, 20) || 'Player',
        avatar: String(opponent?.avatar || '\u{1F43A}').slice(0, 16),
        score: asNonNegativeInt(opponent?.score, 0, 1_000_000_000),
      }))
      : [];

    out.push({
      playedAt: asNonNegativeInt(raw.playedAt, 0, Number.MAX_SAFE_INTEGER),
      mode,
      outcome,
      score: asNonNegativeInt(raw.score, 0, 1_000_000_000),
      xp: asNonNegativeInt(raw.xp, 0, Number.MAX_SAFE_INTEGER),
      coins: asNonNegativeInt(raw.coins, 0, Number.MAX_SAFE_INTEGER),
      categoryKey: typeof raw.categoryKey === 'string'
        ? raw.categoryKey.trim().slice(0, 80) || null
        : null,
      opponents,
      leftEarly: raw.leftEarly === true,
    });

    if (out.length >= safeLimit) break;
  }

  return out;
}

function normalizeStatsStore(value) {
  const out = nullDict();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;

  for (const [rawId, raw] of Object.entries(value)) {
    const id = cleanId(rawId);
    if (!id || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

    const games = asNonNegativeInt(raw.games, 0, 1_000_000_000);
    const wins = Math.min(games, asNonNegativeInt(raw.wins, 0, 1_000_000_000));
    out[id] = {
      games,
      wins,
      streak: asNonNegativeInt(raw.streak, 0, 1_000_000_000),
      xp: asNonNegativeInt(raw.xp, 0, Number.MAX_SAFE_INTEGER),
      coins: asNonNegativeInt(raw.coins, 0, Number.MAX_SAFE_INTEGER),
      recent: normalizeRecentMatches(raw.recent, 10),
    };
  }
  return out;
}

function normalizeSocialStore(value, { maxFriends = 200, maxRequests = 100 } = {}) {
  const profiles = nullDict();
  const friends = nullDict();
  const requests = nullDict();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { profiles, friends, requests };
  }

  if (value.profiles && typeof value.profiles === 'object' && !Array.isArray(value.profiles)) {
    for (const [rawId, raw] of Object.entries(value.profiles)) {
      const id = cleanId(rawId);
      if (!id || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      profiles[id] = {
        name: String(raw.name || 'Player').trim().slice(0, 20) || 'Player',
        avatar: String(raw.avatar || '\u{1F43A}').slice(0, 16),
      };
    }
  }

  if (value.friends && typeof value.friends === 'object' && !Array.isArray(value.friends)) {
    for (const [rawId, list] of Object.entries(value.friends)) {
      const id = cleanId(rawId);
      if (!id) continue;
      friends[id] = uniqueStringList(list, { limit: maxFriends, exclude: id });
    }
  }

  if (value.requests && typeof value.requests === 'object' && !Array.isArray(value.requests)) {
    for (const [rawId, list] of Object.entries(value.requests)) {
      const id = cleanId(rawId);
      if (!id) continue;
      requests[id] = uniqueStringList(list, { limit: maxRequests, exclude: id });
    }
  }

  // Persisted social data can be left half-written by old versions or manual
  // edits. Only keep mutual friendship edges between known profiles, and only
  // keep pending requests from known users. This prevents invisible "ghost"
  // edges from consuming friend/request limits forever.
  for (const [id, list] of Object.entries(friends)) {
    friends[id] = list.filter(
      (otherId) => (
        !!profiles[id]
        && !!profiles[otherId]
        && Array.isArray(friends[otherId])
        && friends[otherId].includes(id)
      )
    );
  }
  for (const [id, list] of Object.entries(requests)) {
    requests[id] = list.filter(
      (fromId) => !!profiles[id] && !!profiles[fromId] && fromId !== id
    );
  }

  return { profiles, friends, requests };
}

function normalizePostsStore(value, { maxPosts = 500, maxTextLen = 240 } = {}) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.posts)) return [];

  const out = [];
  const seenIds = new Set();

  for (const raw of value.posts) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const id = cleanId(raw.id, 200);
    if (!id || seenIds.has(id)) continue;

    const text = String(raw.text || '').trim().slice(0, maxTextLen);
    if (!text) continue;

    seenIds.add(id);
    out.push({
      id,
      authorId: cleanId(raw.authorId) || null,
      authorName: String(raw.authorName || 'Player').trim().slice(0, 20) || 'Player',
      authorAvatar: String(raw.authorAvatar || '\u{1F43A}').slice(0, 16),
      category: typeof raw.category === 'string' ? raw.category.slice(0, 40) : null,
      text,
      reactedBy: uniqueStringList(raw.reactedBy, { limit: 10_000 }),
      reportedBy: uniqueStringList(raw.reportedBy, { limit: 10_000 }),
      createdAt: asNonNegativeInt(raw.createdAt, 0, Number.MAX_SAFE_INTEGER),
    });

    if (out.length >= maxPosts) break;
  }

  return out;
}

function normalizeReportsStore(
  value,
  { threshold = 3, maxTracked = 5000, maxKeyLength = 2000 } = {}
) {
  const counts = nullDict();
  const quarantined = new Set(
    uniqueStringList(value?.quarantined, { limit: maxTracked, maxLength: maxKeyLength })
  );

  if (value?.counts && typeof value.counts === 'object' && !Array.isArray(value.counts)) {
    for (const [rawKey, rawCount] of Object.entries(value.counts)) {
      if (Object.keys(counts).length >= maxTracked) break;
      const key = cleanId(rawKey, maxKeyLength);
      if (!key || quarantined.has(key)) continue;
      const count = asNonNegativeInt(rawCount, 0, threshold);
      if (count >= threshold) quarantined.add(key);
      else if (count > 0) counts[key] = count;
    }
  }

  return { counts, quarantined };
}

module.exports = {
  nullDict,
  asNonNegativeInt,
  uniqueStringList,
  normalizeStatsStore,
  normalizeRecentMatches,
  normalizeSocialStore,
  normalizePostsStore,
  normalizeReportsStore,
};
