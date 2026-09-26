const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'notifications-'));
const notifications = require('./notifications');

test('stores, dedupes per friend+theme, and clears on take', () => {
  const n = { type: 'friend_overtook', fromId: 'bob', fromName: 'Bob', category: 'nba' };
  assert.ok(notifications.push('alice', n, 1000));
  assert.ok(notifications.push('alice', n, 2000));
  assert.ok(notifications.push('alice', { ...n, category: 'f1' }, 3000));
  assert.ok(!notifications.push('alice', { ...n, type: 'unknown' }));
  const list = notifications.take('alice', 4000);
  assert.deepStrictEqual(list.map((x) => [x.category, x.at]), [['nba', 2000], ['f1', 3000]]);
  assert.deepStrictEqual(notifications.take('alice', 4000), []);
});

test('drops expired notifications', () => {
  notifications.push('carl', { type: 'friend_overtook', fromId: 'bob', category: 'nba' }, 0);
  assert.deepStrictEqual(notifications.take('carl', 15 * 86400000), []);
});
