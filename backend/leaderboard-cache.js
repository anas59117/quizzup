// Store only one top-100 page and an O(1) rank lookup per cached board.
// Invalidate on mutations; never cache a viewer-specific response.
function createLeaderboardCache(buildRows, maxEntries = 16) {
  const snapshots = new Map();
  return {
    get(key, limit = 50, clientId = null) {
      let snapshot = snapshots.get(key);
      if (!snapshot) {
        const rows = buildRows(key);
        snapshot = { total: rows.length, entries: rows.slice(0, 100), ranks: new Map(rows.map(row => [row.clientId, row.rank])) };
      }
      snapshots.delete(key);
      snapshots.set(key, snapshot);
      while (snapshots.size > maxEntries) snapshots.delete(snapshots.keys().next().value);
      const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));
      return { total: snapshot.total, yourRank: clientId ? snapshot.ranks.get(clientId) || null : null,
        entries: snapshot.entries.slice(0, safeLimit).map(row => ({ ...row })) };
    },
    invalidate(key) {
      if (key === undefined) snapshots.clear();
      else snapshots.delete(key);
    },
  };
}

module.exports = { createLeaderboardCache };
