const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeStatsStore,
  normalizeRecentMatches,
  normalizeSocialStore,
  normalizePostsStore,
  normalizeReportsStore,
} = require('./store-normalize');

test('stats normalization prevents string concatenation and invalid counters', () => {
  const stats = normalizeStatsStore({
    user: { games: '12', wins: 20, streak: -4, xp: '450' },
    bad: 'oops',
  });
  assert.deepEqual(
    { ...stats.user },
    { games: 12, wins: 12, streak: 0, xp: 450, coins: 0, recent: [] }
  );
  assert.equal(stats.bad, undefined);
  assert.equal(Object.getPrototypeOf(stats), null);
});

test('social normalization deduplicates ids and repairs ghost edges', () => {
  const social = normalizeSocialStore({
    profiles: {
      u1: { name: ' Alice ', avatar: 'A' },
      u2: { name: 'Bob', avatar: 'B' },
      u3: { name: 'Cara', avatar: 'C' },
    },
    friends: {
      u1: ['u1', 'u2', 'u2', 'ghost'],
      u2: ['u1'],
      u3: ['u1'],
    },
    requests: { u1: ['u1', 'u3', 'u3', 'ghost'] },
  });
  assert.deepEqual(social.friends.u1, ['u2']);
  assert.deepEqual(social.friends.u2, ['u1']);
  assert.deepEqual(social.friends.u3, []);
  assert.deepEqual(social.requests.u1, ['u3']);
  assert.equal(social.profiles.u1.name, 'Alice');
});

test('post normalization drops malformed rows and repairs missing arrays', () => {
  const posts = normalizePostsStore({
    posts: [
      { id: 'p1', text: ' hello ', reactedBy: null, reportedBy: ['u1', 'u1'] },
      { id: 'p1', text: 'duplicate id' },
      { id: 'p2', text: '' },
    ],
  });
  assert.equal(posts.length, 1);
  assert.equal(posts[0].text, 'hello');
  assert.deepEqual(posts[0].reactedBy, []);
  assert.deepEqual(posts[0].reportedBy, ['u1']);
});

test('report normalization uses null-prototype keys and quarantines threshold hits', () => {
  const reports = normalizeReportsStore({
    counts: JSON.parse('{"normal":2,"danger":3,"__proto__":2}'),
    quarantined: [],
  }, { threshold: 3 });

  assert.equal(Object.getPrototypeOf(reports.counts), null);
  assert.equal(reports.counts.normal, 2);
  assert.equal(reports.counts.danger, undefined);
  assert.equal(reports.quarantined.has('danger'), true);
  assert.equal(reports.counts.__proto__, 2);
});


test('recent match normalization bounds and sanitizes persisted history', () => {
  const recent = normalizeRecentMatches([
    {
      playedAt: '1234',
      mode: 'multiplayer',
      outcome: 'win',
      score: '420',
      xp: 560,
      coins: 50,
      categoryKey: ' tennis ',
      opponents: [
        { name: ' Alice ', avatar: '🦊', score: '300' },
        { name: '', avatar: '', score: -4 },
      ],
    },
    { mode: 'invalid', outcome: 'win' },
  ]);

  assert.deepEqual(recent, [{
    playedAt: 1234,
    mode: 'multiplayer',
    outcome: 'win',
    score: 420,
    xp: 560,
    coins: 50,
    categoryKey: 'tennis',
    opponents: [
      { name: 'Alice', avatar: '🦊', score: 300 },
      { name: 'Player', avatar: '🐺', score: 0 },
    ],
    leftEarly: false,
  }]);
});

test('recent match history is capped', () => {
  const recent = normalizeRecentMatches(
    Array.from({ length: 20 }, (_, index) => ({
      playedAt: index,
      mode: 'solo',
      outcome: 'solo',
      score: index,
    })),
    10
  );
  assert.equal(recent.length, 10);
  assert.equal(recent[0].score, 0);
  assert.equal(recent[9].score, 9);
});
