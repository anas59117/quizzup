const test = require('node:test');
const assert = require('node:assert/strict');
const { levelFromXp, rankLeaderboard, appendRecentMatch } = require('./stats');

test('level curve matches exact triangular XP boundaries', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
  assert.deepEqual(levelFromXp(199), { level: 1, xpIntoLevel: 199, xpForLevel: 200 });
  assert.deepEqual(levelFromXp(200), { level: 2, xpIntoLevel: 0, xpForLevel: 400 });
  assert.deepEqual(levelFromXp(599), { level: 2, xpIntoLevel: 399, xpForLevel: 400 });
  assert.deepEqual(levelFromXp(600), { level: 3, xpIntoLevel: 0, xpForLevel: 600 });
});

test('level calculation stays finite for very large persisted XP', () => {
  const result = levelFromXp(Number.MAX_SAFE_INTEGER);
  assert.equal(Number.isFinite(result.level), true);
  assert.equal(result.xpIntoLevel >= 0, true);
  assert.equal(result.xpIntoLevel < result.xpForLevel, true);
});

test('invalid XP is treated as zero', () => {
  assert.deepEqual(levelFromXp(-10), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
  assert.deepEqual(levelFromXp('nope'), { level: 1, xpIntoLevel: 0, xpForLevel: 200 });
});


test('ranks leaderboard by XP with deterministic tie-breakers', () => {
  const result = rankLeaderboard({
    alpha: { games: 10, wins: 5, streak: 2, xp: 1000, coins: 20 },
    bravo: { games: 8, wins: 6, streak: 1, xp: 1000, coins: 30 },
    charlie: { games: 4, wins: 2, streak: 3, xp: 700, coins: 10 },
    idle: { games: 0, wins: 0, streak: 0, xp: 9999, coins: 0 },
  }, 10, 'charlie');

  assert.equal(result.total, 3);
  assert.equal(result.yourRank, 3);
  assert.deepEqual(result.entries.map((row) => row.clientId), ['bravo', 'alpha', 'charlie']);
  assert.deepEqual(result.entries.map((row) => row.rank), [1, 2, 3]);
  assert.equal(result.entries[0].winRate, 75);
});

test('leaderboard limit is clamped and current rank can be outside the page', () => {
  const source = {};
  for (let i = 0; i < 120; i += 1) {
    source[`p${String(i).padStart(3, '0')}`] = {
      games: 1,
      wins: 1,
      streak: 1,
      xp: 120 - i,
      coins: 0,
    };
  }

  const result = rankLeaderboard(source, 500, 'p119');
  assert.equal(result.entries.length, 100);
  assert.equal(result.yourRank, 120);
  assert.equal(result.entries[0].rank, 1);
  assert.equal(result.entries[99].rank, 100);
});


test('new recent matches are prepended without mutating existing history', () => {
  const existing = [{
    playedAt: 1,
    mode: 'solo',
    outcome: 'solo',
    score: 10,
    xp: 10,
    coins: 1,
    categoryKey: 'science',
    opponents: [],
    leftEarly: false,
  }];

  const next = appendRecentMatch(existing, {
    playedAt: 2,
    mode: 'multiplayer',
    outcome: 'win',
    score: 200,
    xp: 340,
    coins: 50,
    categoryKey: 'tennis',
    opponents: [{ name: 'Rival', avatar: '🦁', score: 150 }],
  });

  assert.equal(existing.length, 1);
  assert.equal(next.length, 2);
  assert.equal(next[0].playedAt, 2);
  assert.equal(next[0].outcome, 'win');
  assert.equal(next[1].playedAt, 1);
});
