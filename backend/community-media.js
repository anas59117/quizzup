const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const { resolveDataDir } = require('./store-path');
const { validJpeg, MAX_PHOTO_BYTES } = require('./profile-photos');
const isMediaPath = (v) =>
  typeof v === 'string' &&
  /^\/community-media\/[a-f0-9]{24}-[a-f0-9]{32}\.jpg$/.test(v);
function mountMediaRoutes(app, { verifyIdToken, limiter, getClientIp }) {
  const dir = path.join(resolveDataDir(), 'community-media');
  const owner = (uid) =>
    crypto.createHash('sha256').update(uid).digest('hex').slice(0, 24);
  const file = (ref) =>
    isMediaPath(ref) ? path.join(dir, path.basename(ref)) : null;
  const owns = (uid, ref) =>
    !!uid &&
    isMediaPath(ref) &&
    path.basename(ref).startsWith(owner(uid) + '-') &&
    fs.existsSync(file(ref));
  const busy = new Set();
  app.post('/community-media', async (req, res) => {
    const uid = await verifyIdToken(
      /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1],
    );
    if (!uid) return res.status(401).json({ code: 'AUTH_REQUIRED' });
    if (
      busy.has(uid) ||
      !limiter.check('media:' + uid) ||
      !limiter.check('media-ip:' + getClientIp(req))
    )
      return res.status(429).json({ code: 'MEDIA_RATE_LIMITED' });
    if (req.headers['content-type']?.split(';')[0] !== 'image/jpeg')
      return res.status(415).json({ code: 'JPEG_REQUIRED' });
    busy.add(uid);
    res.once('close', () => busy.delete(uid));
    require('express').raw({ type: 'image/jpeg', limit: MAX_PHOTO_BYTES })(
      req,
      res,
      async (err) => {
        try {
          if (err) return res.status(413).json({ code: 'MEDIA_TOO_LARGE' });
          if (!validJpeg(req.body))
            return res.status(400).json({ code: 'INVALID_MEDIA' });
          await fs.promises.mkdir(dir, { recursive: true });
          const names = await fs.promises.readdir(dir);
          if (names.filter((n) => n.startsWith(owner(uid) + '-')).length >= 100)
            return res.status(409).json({ code: 'MEDIA_LIMIT' });
          const mediaUrl = `/community-media/${owner(uid)}-${crypto.randomBytes(16).toString('hex')}.jpg`;
          await fs.promises.writeFile(file(mediaUrl), req.body, {
            flag: 'wx',
            mode: 0o600,
          });
          res.json({ mediaUrl });
        } catch {
          res.status(500).json({ code: 'MEDIA_SAVE_FAILED' });
        } finally {
          busy.delete(uid);
        }
      },
    );
  });
  app.get('/community-media/:filename', (req, res) => {
    const target = file('/community-media/' + req.params.filename);
    if (!target || !fs.existsSync(target)) return res.sendStatus(404);
    res
      .set({
        'Content-Type': 'image/jpeg',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400',
      })
      .sendFile(target);
  });
  return { owns };
}
module.exports = { isMediaPath, mountMediaRoutes };
