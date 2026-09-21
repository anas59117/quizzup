const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-social-'));
process.env.DATA_DIR = tempDir;
fs.writeFileSync(
  path.join(tempDir, 'social.json'),
  JSON.stringify({ profiles: {}, friends: {}, requests: {} })
);

const social = require('./social');
const { flushAllJsonWriters } = require('./json-writer');

test.after(async () => {
  await flushAllJsonWriters();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('updateProfile persists the authoritative display identity', async () => {
  const profile = social.updateProfile('guest_profile_test', 'Nova', '🦊');

  assert.deepEqual(profile, {
    id: 'guest_profile_test',
    name: 'Nova',
    avatar: '🦊',
    online: false,
  });

  await flushAllJsonWriters();
  const stored = JSON.parse(fs.readFileSync(path.join(tempDir, 'social.json'), 'utf8'));
  assert.deepEqual(stored.profiles.guest_profile_test, {
    name: 'Nova',
    avatar: '🦊',
  });
});

test('updating a connected profile keeps its online presence', () => {
  const ws = { readyState: 1 };
  social.setOnline('guest_online_test', ws, 'Before', '🐺');

  const profile = social.updateProfile('guest_online_test', 'After', '🦉');

  assert.equal(profile.online, true);
  assert.equal(profile.name, 'After');
  assert.equal(profile.avatar, '🦉');
  assert.equal(social.getWs('guest_online_test'), ws);

  social.setOffline('guest_online_test', ws);
});
