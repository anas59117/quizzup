const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'daystreak-'));
const stats = require('./stats');
const { normalizeStatsStore } = require('./store-normalize');

const DAY = 86400000;
const base = Date.UTC(2026, 8, 20, 10); // 20 Sep 2026, 12:00 Paris

test('consecutive days extend the streak, same day does not, a gap resets it', () => {
  assert.deepStrictEqual(stats.recordPlayDay('p1', base), { dayStreak: 1, increased: true });
  assert.deepStrictEqual(stats.recordPlayDay('p1', base + 3600000), { dayStreak: 1, increased: false });
  assert.deepStrictEqual(stats.recordPlayDay('p1', base + DAY), { dayStreak: 2, increased: true });
  assert.strictEqual(stats.getStats('p1', base + 2 * DAY).dayStreak, 2); // still alive the next day
  assert.strictEqual(stats.getStats('p1', base + 3 * DAY).dayStreak, 0); // missed a day
  assert.deepStrictEqual(stats.recordPlayDay('p1', base + 3 * DAY), { dayStreak: 1, increased: true });
  assert.strictEqual(stats.getStats('p1', base + 3 * DAY).bestDayStreak, 2);
});

test('days follow Paris time', () => {
  assert.strictEqual(stats.dayKey(Date.UTC(2026, 8, 26, 22, 30)), '2026-09-27');
  assert.strictEqual(stats.dayKey(Date.UTC(2026, 8, 26, 21, 30)), '2026-09-26');
});

test('stored streak fields survive normalization and bad ones are dropped', () => {
  const out = normalizeStatsStore({
    a: { games: 1, dayStreak: 4, bestDayStreak: 2, lastPlayDay: '2026-09-20' },
    b: { games: 1, dayStreak: 4, lastPlayDay: 'nope' },
  });
  assert.strictEqual(out.a.dayStreak, 4);
  assert.strictEqual(out.a.bestDayStreak, 4);
  assert.strictEqual(out.b.lastPlayDay, undefined);
});
