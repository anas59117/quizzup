const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'topicstats-'));
const topicStats = require('./topic-stats');

test('records per-theme xp and ranks a theme leaderboard', () => {
  topicStats.record('alice', 'psg', { won: true, xp: 900 });
  topicStats.record('alice', 'golf', { won: false, xp: 100 });
  topicStats.record('bob', 'psg', { won: false, xp: 300 });
  topicStats.record('bob', 'psg', { won: true, xp: 300 });

  const alice = topicStats.getPlayerTopics('alice');
  assert.deepStrictEqual(alice.map((t) => t.key), ['psg', 'golf']);
  assert.strictEqual(alice[0].level, 3); // 900 xp: levels 1 (200) + 2 (400) done

  const board = topicStats.getTopicLeaderboard('psg', 10, 'bob');
  assert.strictEqual(board.total, 2);
  assert.strictEqual(board.entries[0].clientId, 'alice');
  assert.strictEqual(board.yourRank, 2);
  assert.strictEqual(board.entries[1].winRate, 50);
  assert.strictEqual(topicStats.getTopicLeaderboard('nobody-plays-this').total, 0);
});

test('ignores invalid input', () => {
  topicStats.record(null, 'psg', { xp: 10 });
  topicStats.record('carol', '../evil', { xp: 10 });
  topicStats.record('carol', 'psg', { xp: -50 });
  assert.strictEqual(topicStats.getTopic('carol', 'psg').xp, 0);
  assert.strictEqual(topicStats.getTopic('carol', 'psg').games, 1);
  assert.strictEqual(topicStats.getTopic('dave', 'zelda').level, 1);
});

test('normalize drops garbage', () => {
  const n = topicStats.normalize({ a: { psg: { games: 2, wins: 9, xp: -1 }, 'bad key!': { games: 1 } }, b: 7 });
  assert.deepStrictEqual({ ...n.a.psg }, { games: 2, wins: 2, xp: 0 });
  assert.ok(!n.a['bad key!']);
  assert.ok(!n.b);
});
