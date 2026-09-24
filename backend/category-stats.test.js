const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'catstats-'));
const categoryStats = require('./category-stats');

test('counts starts, chosen vs random, completion', () => {
  const now = new Date('2026-09-20T12:00:00Z');
  categoryStats.recordStart('psg', { players: 2, chosen: true, now });
  categoryStats.recordStart('psg', { players: 1, chosen: true, now });
  categoryStats.recordStart('golf', { players: 1, chosen: false, now });
  categoryStats.recordFinish('psg', 'complete');
  categoryStats.recordFinish('psg', 'opponent_disconnected');

  const report = categoryStats.getReport({ labels: { psg: 'PSG', golf: 'Golf', dead: 'Dead' }, now });
  const psg = report.categories.find((r) => r.key === 'psg');
  assert.strictEqual(psg.starts, 2);
  assert.strictEqual(psg.chosen, 2);
  assert.strictEqual(psg.players, 3);
  assert.strictEqual(psg.completionRate, 50);
  assert.strictEqual(report.categories[0].key, 'psg');
  assert.strictEqual(report.neverPlayed, 1);
  assert.strictEqual(report.categories.find((r) => r.key === 'golf').random, 1);
});

test('window report only counts recent days', () => {
  const now = new Date('2026-09-20T12:00:00Z');
  const old = new Date('2026-09-05T12:00:00Z');
  categoryStats.recordStart('zelda', { now: old });
  const report = categoryStats.getReport({ days: 7, now });
  assert.strictEqual(report.categories.find((r) => r.key === 'zelda').startsInWindow, 0);
  assert.strictEqual(report.categories.find((r) => r.key === 'psg').startsInWindow, 2);
});

test('normalize drops garbage', () => {
  const n = categoryStats.normalize({ totals: { a: { starts: -3, chosen: 'x' }, b: 5 }, daily: { bad: {}, '2026-01-01': { a: 2, c: -1 } } });
  assert.strictEqual(n.totals.a.starts, 0);
  assert.ok(!n.totals.b);
  assert.deepStrictEqual(n.daily, { '2026-01-01': { a: 2 } });
});
