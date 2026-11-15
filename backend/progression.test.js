const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'progression-v2-'));
fs.writeFileSync(path.join(process.env.DATA_DIR, 'stats.json'), JSON.stringify({
  legacy: { games: 4, wins: 2, xp: 900, coins: 37 },
}));
fs.writeFileSync(path.join(process.env.DATA_DIR, 'topic-stats.json'), JSON.stringify({
  legacy: { psg: { games: 4, wins: 2, xp: 900 } },
}));
const stats = require('./stats');
const topics = require('./topic-stats');
const { normalizeStatsStore } = require('./store-normalize');

test('legacy global and theme levels and fractional progress survive migration and restart', async () => {
  for (const row of [stats.getStats('legacy'), topics.getTopic('legacy', 'psg')]) {
    assert.equal(row.xp, 900);
    assert.equal(row.level, 3);
    assert.equal(row.xpIntoLevel, 900);
    assert.equal(row.xpForLevel, 1800);
  }
  stats.recordResult('legacy', false, true, 100, 20);
  topics.record('legacy', 'psg', { xp: 100 });
  await require('./json-writer').flushAllJsonWriters();
  for (const file of ['stats.json', 'topic-stats.json']) {
    const disk = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, file)));
    const row = file === 'stats.json' ? disk.legacy : disk.legacy.psg;
    assert.equal(row.xp, 1000);
    assert.equal(row.progressionVersion, 2);
    assert.equal(row.progressionOffset, '1800');
  }
  delete require.cache[require.resolve('./stats')];
  delete require.cache[require.resolve('./topic-stats')];
  const global = require('./stats').getStats('legacy');
  const theme = require('./topic-stats').getTopic('legacy', 'psg');
  for (const row of [global, theme]) {
    assert.equal(row.level, 3);
    assert.equal(row.xpIntoLevel, 1000);
    assert.equal(row.xpForLevel, 1800);
  }
  assert.equal(global.coins, 57);
});

test('new global and theme records need multiple games with growing per-level cost', async () => {
  for (let i = 0; i < 2; i++) {
    stats.recordResult('new', true, false, 250);
    topics.record('new', 'psg', { xp: 250 });
  }
  assert.equal(stats.getStats('new').level, 1);
  assert.equal(topics.getTopic('new', 'psg').level, 1);
  stats.recordResult('new', true, false, 250);
  topics.record('new', 'psg', { xp: 250 });
  assert.equal(stats.getStats('new').level, 2);
  assert.equal(stats.getStats('new').xpIntoLevel, 150);
  assert.equal(stats.getStats('new').xpForLevel, 1200);
  await require('./json-writer').flushAllJsonWriters();
  const disk = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'stats.json')));
  assert.equal(disk.new.progressionOffset, '0');
});

test('normalization is idempotent, bounds metadata and preserves lifetime XP ranking', () => {
  const normalized = normalizeStatsStore({
    old: { games: 3, xp: 900 },
    newer: { games: 3, xp: 1000, progressionVersion: 2, progressionOffset: '0' },
    future: { games: 1, xp: 500, progressionVersion: 7, progressionOffset: '1000' },
    bad: { xp: -10, progressionVersion: 2, progressionOffset: 'Infinity' },
    extreme: { games: 1, xp: Number.MAX_SAFE_INTEGER },
  });
  assert.deepEqual(normalizeStatsStore(JSON.parse(JSON.stringify(normalized))), normalized);
  assert.equal(normalized.future.progressionVersion, 7);
  assert.equal(normalized.future.progressionOffset, '1000');
  assert.equal(normalized.bad.progressionOffset, '0');
  assert.equal(normalized.extreme.progressionOffset, '18014398509481982');
  const rows = stats.rankLeaderboard(normalized).entries;
  assert.deepEqual(rows.map(r => r.clientId), ['extreme', 'newer', 'old', 'future']);
  assert.equal(rows.find(r => r.clientId === 'old').level, 3);
  assert.equal(rows.find(r => r.clientId === 'newer').level, 2);
  const extreme = stats.levelFromXp(Number.MAX_SAFE_INTEGER, normalized.extreme);
  assert.ok(Number.isSafeInteger(extreme.level));
  assert.ok(extreme.xpIntoLevel >= 0 && extreme.xpIntoLevel < extreme.xpForLevel);
});

test('legacy fractions remain exact at level boundaries and maximum safe lifetime XP in both snapshot formats', () => {
  const { encodeSnapshot, decodeSnapshot } = require('./storage/codec');
  for (const [xp, level, into, cost] of [
    [0, 1, 0, 600], [199, 1, 597, 600], [200, 2, 0, 1200],
    [599, 2, 1197, 1200], [600, 3, 0, 1800],
    [2500000500000001, 5000001, 3, 3000000600],
    [Number.MAX_SAFE_INTEGER, 9490627, 355472373, 5694376200],
  ]) {
    for (const [name, source, normalize, rowOf] of [
      ['stats', { player: { xp } }, normalizeStatsStore, data => data.player],
      ['topic-stats', { player: { psg: { xp } } }, topics.normalize, data => data.player.psg],
    ]) {
      const normalized = normalize(source);
      const json = JSON.parse(JSON.stringify(normalized));
      const encoded = encodeSnapshot(name, json);
      const restored = normalize(decodeSnapshot(name, encoded.layout, encoded.records));
      assert.deepEqual(restored, normalized);
      const row = rowOf(restored);
      assert.equal(row.xp, xp);
      assert.deepEqual(stats.levelFromXp(row.xp, row), { level, xpIntoLevel: into, xpForLevel: cost });
    }
  }
});

test('invalid and future metadata never creates unbounded offsets or repeats legacy grants', () => {
  for (const progressionOffset of ['-1', '1e20', '999999999999999999999999', '18014398509481983', {}, null]) {
    const input = { player: { xp: 600, progressionVersion: 7, progressionOffset } };
    const normalized = normalizeStatsStore(input);
    assert.equal(normalized.player.progressionOffset, '0');
    assert.deepEqual(normalizeStatsStore(normalized), normalized);
    assert.deepEqual(stats.levelFromXp(600, normalized.player), { level: 2, xpIntoLevel: 0, xpForLevel: 1200 });
  }
  for (const xp of [Infinity, -1, 'invalid', null]) {
    assert.deepEqual(stats.levelFromXp(xp), { level: 1, xpIntoLevel: 0, xpForLevel: 600 });
  }
  const normalized = normalizeStatsStore({ player: { xp: 1e30 } });
  assert.equal(normalized.player.xp, Number.MAX_SAFE_INTEGER);
  assert.equal(normalized.player.progressionOffset, '18014398509481982');
});

test('game results carry authoritative before progress across several levels without changing rewards', () => {
  const currentStats = require('./stats');
  currentStats.recordResult('animation', false, true, 250);
  const ws = { readyState: 1, messages: [], send(raw) { this.messages.push(JSON.parse(raw)); } };
  const lifecycle = require('./game');
  const oldTimeout = global.setTimeout;
  global.setTimeout = () => ({ unref() {} });
  try {
    lifecycle.endGame({
      id: 'progression-animation', status: 'active', mode: 'multiplayer', categoryKey: 'psg',
      players: [
        { id: 'one', clientId: 'animation', name: 'One', score: 4000, ws },
        { id: 'two', clientId: 'animation-opponent', name: 'Two', score: 0 },
      ], roundResults: [],
    });
    const result = ws.messages.find(m => m.type === 'game_end');
    assert.deepEqual(result.progressionBefore, { level: 1, xpIntoLevel: 250, xpForLevel: 600 });
    assert.equal(result.stats.level, 4);
    assert.equal(result.stats.xpIntoLevel, 790);
    assert.equal(result.stats.xpForLevel, 2400);
    assert.equal(result.xp, 4140);
    assert.equal(result.stats.xp, 4390);
    assert.equal(result.coins, 50);
    assert.deepEqual(result.xpBreakdown, { matchScore: 4000, finishBonus: 40, winBonus: 100, xpTotal: 4140 });
  } finally {
    global.setTimeout = oldTimeout;
  }
});
