const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeStatsStore,
  normalizeSocialStore,
  normalizePostsStore,
  normalizeReportsStore,
} = require('./store-normalize');

test('stats normalization prevents string concatenation and invalid counters', () => {
  const stats = normalizeStatsStore({
    user: { games: '12', wins: 20, streak: -4, xp: '450' },
    bad: 'oops',
  });
  assert.deepEqual({ ...stats.user }, { games: 12, wins: 12, streak: 0, xp: 450 });
  assert.equal(stats.bad, undefined);
  assert.equal(Object.getPrototypeOf(stats), null);
});

test('social normalization deduplicates ids and removes self edges', () => {
  const social = normalizeSocialStore({
    profiles: { u1: { name: ' Alice ', avatar: 'A' } },
    friends: { u1: ['u1', 'u2', 'u2'] },
    requests: { u1: ['u1', 'u3', 'u3'] },
  });
  assert.deepEqual(social.friends.u1, ['u2']);
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
