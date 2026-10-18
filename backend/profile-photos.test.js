const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createPhotoStore, validJpeg, MAX_PHOTO_BYTES } = require('./profile-photos');
const { cleanAvatar } = require('./sanitize');
const { normalizeSocialStore, normalizePostsStore } = require('./store-normalize');

// A small structural JPEG fixture: SOI, SOF0, SOS, entropy bytes, EOI.
const jpeg = Buffer.from('ffd8ffc00011080020002003011100021100031100ffda000c03010002000300003f00112233ffd9', 'hex');
test('new feed posts preserve the full personal photo identity', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-photo-post-'));
  const prior = process.env.DATA_DIR; process.env.DATA_DIR = dir;
  const { addPost, getFeed } = require('./posts');
  const social = require('./social');
  const { flushAllJsonWriters } = require('./json-writer');
  try {
    const avatar = `/profile-photos/${'a'.repeat(24)}-${'b'.repeat(32)}.jpg`;
    assert.equal(addPost('a', 'Alex', avatar, null, 'Hello').authorAvatar, avatar);
    social.updateProfile('a', 'Alex', 'fox');
    assert.equal(getFeed()[0].authorAvatar, 'fox');
  } finally {
    await flushAllJsonWriters();
    if (prior === undefined) delete process.env.DATA_DIR; else process.env.DATA_DIR = prior;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('photo validation rejects non JPEG, oversized, truncated and oversized dimensions', () => {
  assert.equal(validJpeg(jpeg), true);
  assert.equal(validJpeg(Buffer.from('<svg/>')), false);
  assert.equal(validJpeg(jpeg.subarray(0, jpeg.length - 2)), false);
  assert.equal(validJpeg(Buffer.alloc(MAX_PHOTO_BYTES + 1)), false);
  const huge = Buffer.from(jpeg); huge.writeUInt16BE(65000, 7);
  assert.equal(validJpeg(huge), false);
});
test('photo store survives recreation, enforces ownership and bounds abandoned uploads', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-photo-'));
  try {
    const store = createPhotoStore(dir);
    const first = await store.save('alice', jpeg);
    assert.equal(store.owns('alice', first), true);
    assert.equal(store.owns('bob', first), false);
    assert.equal(store.owns('alice', '/profile-photos/../../secret.jpg'), false);
    for (let i = 0; i < 5; i++) await store.save('alice', jpeg, first);
    assert.ok(fs.readdirSync(path.join(dir, 'profile-photos')).length <= 3);
    assert.equal(createPhotoStore(dir).owns('alice', first), true);
    assert.deepEqual(fs.readFileSync(store.file(first)), jpeg);
    await assert.rejects(store.save('alice', Buffer.from('<svg/>')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('safe photo references survive sanitization and persisted social/feed normalization', () => {
  const photo = `/profile-photos/${'a'.repeat(24)}-${'b'.repeat(32)}.jpg`;
  assert.equal(cleanAvatar(photo), photo);
  for (const unsafe of ['https://evil/a.jpg', 'data:image/svg+xml,x', '/profile-photos/../x.jpg', '<svg onload=x>']) {
    assert.equal(cleanAvatar(unsafe, 'robot'), 'robot');
  }
  assert.equal(normalizeSocialStore({ profiles: { a: { name: 'A', avatar: photo } } }).profiles.a.avatar, photo);
  assert.equal(normalizePostsStore({ posts: [{ id: 'p', text: 'hi', authorAvatar: photo }] })[0].authorAvatar, photo);
});
