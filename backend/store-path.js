const fs = require('fs');
const path = require('path');

const LEGACY_DIR = __dirname;

function resolveDataDir(raw = process.env.DATA_DIR) {
  if (!raw) return LEGACY_DIR;
  return path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(__dirname, raw);
}

function ensureDataDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getStorePath(filename) {
  const dataDir = ensureDataDir(resolveDataDir());
  const target = path.join(dataDir, filename);

  // Backward-compatible one-time migration: when DATA_DIR is introduced on
  // an existing single-instance deployment, preserve the old backend/*.json
  // data instead of appearing to reset every account/feed/friend graph.
  if (dataDir !== LEGACY_DIR && !fs.existsSync(target)) {
    const legacy = path.join(LEGACY_DIR, filename);
    if (fs.existsSync(legacy)) {
      try {
        fs.copyFileSync(legacy, target, fs.constants.COPYFILE_EXCL);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          console.error(`Failed to migrate legacy data store ${legacy} -> ${target}:`, err);
        }
      }
    }
  }

  return target;
}

function persistenceInfo() {
  const dataDir = resolveDataDir();
  return {
    mode: process.env.DATA_DIR ? 'configured-directory' : 'backend-directory',
    dataDir,
  };
}

module.exports = { resolveDataDir, getStorePath, persistenceInfo };
