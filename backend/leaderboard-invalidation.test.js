const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-rank-cache-'));
for (const store of ['stats', 'topic-stats']) fs.writeFileSync(path.join(process.env.DATA_DIR, `${store}.json`), '{}');
const stats = require('./stats');
const topics = require('./topic-stats');

test('cached global ranks refresh immediately after a completed game', () => {
  stats.recordResult('alice', true, false, 100);
  assert.equal(stats.getLeaderboard(50, 'alice').yourRank, 1);
  stats.recordResult('bob', true, false, 200);
  const board = stats.getLeaderboard(50, 'alice');
  assert.equal(board.yourRank, 2);
  assert.equal(board.entries[0].clientId, 'bob');
});

test('cached topic ranks refresh after progression and do not leak viewer identity', () => {
  topics.record('alice', 'harry_potter', { xp: 100 });
  assert.equal(topics.getTopicLeaderboard('harry_potter', 1, 'alice').yourRank, 1);
  topics.record('bob', 'harry_potter', { xp: 200 });
  assert.equal(topics.getTopicLeaderboard('harry_potter', 1, 'alice').yourRank, 2);
  assert.equal(topics.getTopicLeaderboard('harry_potter', 1, 'bob').yourRank, 1);
  assert.equal(topics.getTopicLeaderboard('minecraft', 1, 'bob').yourRank, null);
});
