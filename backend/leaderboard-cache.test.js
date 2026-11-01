const test = require('node:test');
const assert = require('node:assert/strict');
const { createLeaderboardCache } = require('./leaderboard-cache');

test('many viewers share a ranking while keeping their own rank and page size', () => {
  let builds = 0;
  const cache = createLeaderboardCache(() => {
    builds++;
    return Array.from({ length: 200 }, (_, i) => ({ clientId: `p${i}`, rank: i + 1, xp: 200 - i }));
  });
  assert.equal(cache.get('global', 2, 'p199').yourRank, 200);
  assert.equal(cache.get('global', 1000, 'p0').entries.length, 100);
  assert.equal(cache.get('global', 10, 'missing').yourRank, null);
  assert.equal(builds, 1);
});

test('returned data cannot corrupt another viewer and invalidation refreshes immediately', () => {
  let xp = 10;
  const cache = createLeaderboardCache(() => [{ clientId: 'p', rank: 1, xp }]);
  cache.get('global').entries[0].xp = -100;
  assert.equal(cache.get('global').entries[0].xp, 10);
  xp = 20; cache.invalidate('global');
  assert.equal(cache.get('global').entries[0].xp, 20);
});

test('topic caches are bounded and least recently used data is rebuilt when evicted', () => {
  const builds = [];
  const cache = createLeaderboardCache(key => { builds.push(key); return []; }, 2);
  cache.get('a'); cache.get('b'); cache.get('a'); cache.get('c'); cache.get('b');
  assert.deepEqual(builds, ['a', 'b', 'c', 'b']);
  cache.invalidate(); cache.get('a');
  assert.equal(builds.at(-1), 'a');
});
