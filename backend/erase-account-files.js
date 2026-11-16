const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { resolveDataDir } = require('./store-path');
async function eraseUploads(uid) {
  const prefix = crypto.createHash('sha256').update(uid).digest('hex').slice(0, 24) + '-';
  for (const name of ['profile-photos', 'community-media']) {
    const dir = path.join(resolveDataDir(), name);
    const entries = await fs.readdir(dir).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    for (const file of entries) if (file.startsWith(prefix) && /^[a-f0-9]{24}-[a-f0-9]{32}\.jpg$/.test(file)) await fs.rm(path.join(dir, file), { force: true });
  }
}
async function eraseStoreBackups() {
  if (require('./storage/runtime').postgres()) return;
  for (const name of require('./storage/catalog').STORE_NAMES) await fs.rm(path.join(resolveDataDir(), `${name}.json.bak`), { force: true });
}
module.exports = { eraseUploads, eraseStoreBackups };
