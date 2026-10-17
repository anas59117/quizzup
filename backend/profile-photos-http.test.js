const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { mountPhotoRoutes, MAX_PHOTO_BYTES } = require('./profile-photos');
const { verifyIdToken } = require('./auth');
const { issueGuestToken } = require('./guest-auth');
const RateLimiter = require('./rate-limit');
const jpeg = Buffer.from('ffd8ffc00011080020002003011100021100031100ffda000c03010002000300003f00112233ffd9', 'hex');

test('HTTP uploads require verified identity and bounded JPEG; safe public JPEG fetch supports canvas CORS', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-photo-http-'));
  const previousDir = process.env.DATA_DIR; process.env.DATA_DIR = dir;
  process.env.GUEST_AUTH_SECRET = 'test-photo-secret-with-at-least-thirty-two-characters';
  const app = express(); app.use(cors());
  const store = mountPhotoRoutes(app, { verifyIdToken, social: { profileOf: () => null }, limiter: new RateLimiter(60000, 100), getClientIp: () => 'test' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const issued = issueGuestToken();
  const post = (body, type = 'image/jpeg', token = issued.token) => fetch(`${origin}/profile-photo`, {
    method: 'POST', headers: { 'Content-Type': type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body,
  });
  try {
    assert.equal((await post(jpeg, 'image/jpeg', '')).status, 401);
    assert.equal((await post(jpeg, 'image/jpeg', 'fake.token')).status, 401);
    assert.equal((await post(jpeg, 'image/png')).status, 415);
    assert.equal((await post(Buffer.from('<svg/>'))).status, 400);
    assert.equal((await post(Buffer.alloc(MAX_PHOTO_BYTES + 1))).status, 413);
    const upload = await post(jpeg);
    assert.equal(upload.status, 200);
    const { avatar } = await upload.json();
    assert.equal(store.owns(issued.uid, avatar), true);
    assert.equal(store.owns('other-player', avatar), false);
    const photo = await fetch(`${origin}${avatar}`, { headers: { Origin: 'https://example.test' } });
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get('content-type'), 'image/jpeg');
    assert.equal(photo.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(photo.headers.get('access-control-allow-origin'), '*');
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), jpeg);
    assert.equal((await fetch(`${origin}/profile-photos/%2e%2e%2fsecret.jpg`)).status, 404);
    assert.equal((await fetch(`${origin}/profile-photos/unknown.svg`)).status, 404);
    assert.equal(fs.readdirSync(path.join(dir, 'profile-photos')).length, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previousDir === undefined) delete process.env.DATA_DIR; else process.env.DATA_DIR = previousDir;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
