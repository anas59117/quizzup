const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qz-shop-'));
const stats = require('./stats');
const shop = require('./shop');
const { normalizeStatsStore } = require('./store-normalize');

function give(clientId, coins) {
  stats.recordResult(clientId, false, true, 0, coins);
}

test('buying a frame spends coins, owns it and equips it', () => {
  give('buyer', 500);
  const res = stats.buyFrame('buyer', 'argent');
  assert.deepStrictEqual(res, { ok: true });
  const s = stats.getStats('buyer');
  assert.strictEqual(s.coins, 100);
  assert.strictEqual(s.frame, 'argent');
  assert.ok(s.ownedFrames.includes('argent'));
  assert.strictEqual(stats.getFrame('buyer'), 'argent');
});

test('cannot buy without enough coins, twice, or an unknown item', () => {
  give('poor', 100);
  assert.strictEqual(stats.buyFrame('poor', 'diamant').error, 'coins');
  assert.strictEqual(stats.getStats('poor').coins, 100);
  assert.strictEqual(stats.buyFrame('poor', 'nope').error, 'unknown');
  assert.strictEqual(stats.buyFrame('poor', 'none').error, 'unknown');
  give('poor', 100);
  assert.strictEqual(stats.buyFrame('poor', 'bronze').ok, true);
  assert.strictEqual(stats.buyFrame('poor', 'bronze').error, 'owned');
});

test('equip only owned frames; none is always allowed', () => {
  give('eq', 200);
  assert.strictEqual(stats.equipFrame('eq', 'or').error, 'not_owned');
  stats.buyFrame('eq', 'bronze');
  assert.strictEqual(stats.equipFrame('eq', 'none').ok, true);
  assert.strictEqual(stats.getFrame('eq'), 'none');
  assert.strictEqual(stats.equipFrame('eq', 'bronze').ok, true);
  assert.strictEqual(stats.getFrame('eq'), 'bronze');
});

test('rewarded ad doubles the last game once, for that game only', () => {
  give('ad', 50);
  stats.setLastReward('ad', 'game_1', 50);
  assert.strictEqual(stats.claimAdReward('ad', 'game_other').error, 'no_game');
  const res = stats.claimAdReward('ad', 'game_1');
  assert.deepStrictEqual(res, { ok: true, coins: 50 });
  assert.strictEqual(stats.getStats('ad').coins, 100);
  assert.strictEqual(stats.claimAdReward('ad', 'game_1').error, 'claimed');
});

test('rewarded ads are capped per day and reset the next day', () => {
  const day1 = Date.UTC(2026, 9, 5, 10);
  for (let i = 0; i < shop.MAX_AD_REWARDS_PER_DAY; i += 1) {
    stats.setLastReward('cap', `g${i}`, 20);
    assert.strictEqual(stats.claimAdReward('cap', `g${i}`, day1).ok, true);
  }
  stats.setLastReward('cap', 'gx', 20);
  assert.strictEqual(stats.claimAdReward('cap', 'gx', day1).error, 'limit');
  assert.strictEqual(stats.getStats('cap', day1).adRewardsLeft, 0);
  const day2 = day1 + 24 * 3600 * 1000;
  assert.strictEqual(stats.claimAdReward('cap', 'gx', day2).ok, true);
});

test('store normalization keeps shop fields and drops junk', () => {
  const out = normalizeStatsStore({
    a: {
      games: 1, coins: 10, owned: ['or', 'or', 5, 'neon'], frame: 'or',
      adDay: '2026-10-05', adCount: 3,
      lastReward: { gameId: 'game_x', coins: 40, claimed: true },
    },
    b: { games: 1, owned: 'x', frame: 7, adDay: 'bad', lastReward: { coins: 5 } },
  });
  assert.deepStrictEqual(out.a.owned, ['or', 'neon']);
  assert.strictEqual(out.a.frame, 'or');
  assert.strictEqual(out.a.adCount, 3);
  assert.deepStrictEqual(out.a.lastReward, { gameId: 'game_x', coins: 40, claimed: true });
  assert.strictEqual(out.b.owned, undefined);
  assert.strictEqual(out.b.frame, undefined);
  assert.strictEqual(out.b.adDay, undefined);
  assert.strictEqual(out.b.lastReward, undefined);
});
