const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { resolveDataDir } = require('./store-path');
const { isPhotoPath } = require('./sanitize');

const MAX_PHOTO_BYTES = 256 * 1024;
// Parse JPEG headers before storing: bounded raster, a frame and a scan, and no
// trailing payload. Photos are served only as inert image/jpeg with nosniff.
function validJpeg(body) {
  if (!Buffer.isBuffer(body) || body.length < 20 || body.length > MAX_PHOTO_BYTES
    || body.readUInt16BE(0) !== 0xffd8 || body.readUInt16BE(body.length - 2) !== 0xffd9) return false;
  let offset = 2, frame = false;
  while (offset < body.length - 2) {
    if (body[offset++] !== 0xff) return false;
    while (body[offset] === 0xff) offset++;
    const marker = body[offset++];
    if (offset + 2 > body.length) return false;
    const length = body.readUInt16BE(offset);
    if (length < 2 || offset + length > body.length - 2) return false;
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) return false;
      const height = body.readUInt16BE(offset + 3), width = body.readUInt16BE(offset + 5);
      if (width < 16 || height < 16 || width > 1024 || height > 1024) return false;
      frame = true;
    }
    if (marker === 0xda) return frame && length >= 6;
    offset += length;
  }
  return false;
}

function createPhotoStore(dataDir = resolveDataDir()) {
  const dir = path.join(dataDir, 'profile-photos');
  const owner = uid => crypto.createHash('sha256').update(uid).digest('hex').slice(0, 24);
  const file = reference => isPhotoPath(reference) ? path.join(dir, path.basename(reference)) : null;
  const owns = (uid, reference) => !!uid && isPhotoPath(reference)
    && path.basename(reference).startsWith(`${owner(uid)}-`) && fs.existsSync(file(reference));
  async function save(uid, body, keep = null) {
    if (!uid || !validJpeg(body)) throw new Error('INVALID_PHOTO');
    await fs.promises.mkdir(dir, { recursive: true });
    const prefix = `${owner(uid)}-`;
    const reference = `/profile-photos/${prefix}${crypto.randomBytes(16).toString('hex')}.jpg`;
    await fs.promises.writeFile(file(reference), body, { flag: 'wx', mode: 0o600 });
    const files = (await fs.promises.readdir(dir)).filter(name => name.startsWith(prefix) && isPhotoPath(`/profile-photos/${name}`));
    const candidates = await Promise.all(files.map(async name => ({ name, time: (await fs.promises.stat(path.join(dir, name))).mtimeMs })));
    const retained = new Set([path.basename(reference), owns(uid, keep) ? path.basename(keep) : null]);
    for (const entry of candidates.sort((a, b) => b.time - a.time)) {
      if (retained.has(entry.name)) continue;
      if (retained.size < 3) retained.add(entry.name);
      else await fs.promises.unlink(path.join(dir, entry.name));
    }
    return reference;
  }
  return { save, owns, file };
}

function mountPhotoRoutes(app, { verifyIdToken, social, limiter, getClientIp }) {
  const express = require('express');
  const store = createPhotoStore();
  const busy = new Set();
  app.post('/profile-photo', async (req, res, next) => {
    try {
      const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
      const uid = token && await verifyIdToken(token);
      if (!uid) return res.status(401).json({ code: 'AUTH_REQUIRED' });
      if (!limiter.check(`uid:${uid}`) || !limiter.check(`ip:${getClientIp(req)}`) || busy.has(uid)) return res.status(429).json({ code: 'PHOTO_RATE_LIMITED' });
      if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'image/jpeg') return res.status(415).json({ code: 'JPEG_REQUIRED' });
      busy.add(uid);
      const clear = () => busy.delete(uid);
      res.once('close', clear);
      express.raw({ type: 'image/jpeg', limit: MAX_PHOTO_BYTES })(req, res, async err => {
        try {
          if (err) return res.status(err.type === 'entity.too.large' ? 413 : 400).json({ code: 'PHOTO_TOO_LARGE' });
          if (!validJpeg(req.body)) return res.status(400).json({ code: 'INVALID_PHOTO' });
          const avatar = await store.save(uid, req.body, social.profileOf(uid)?.avatar);
          res.set('Cache-Control', 'no-store').json({ avatar });
        } catch (error) { next(error); } finally { clear(); }
      });
    } catch (error) { next(error); }
  });
  app.get('/profile-photos/:filename', (req, res) => {
    const target = store.file(`/profile-photos/${req.params.filename}`);
    if (!target || !fs.existsSync(target)) return res.sendStatus(404);
    res.set({ 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' });
    res.sendFile(target);
  });
  return store;
}
module.exports = { createPhotoStore, validJpeg, MAX_PHOTO_BYTES, mountPhotoRoutes };
