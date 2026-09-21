// Crash-resistant JSON persistence for the current single-instance MVP.
//
// Writes are debounced + serialized, then committed through a temp file. The
// previous complete snapshot is kept as ".bak" so a process/filesystem crash
// cannot silently turn a partially-written JSON file into a total data reset.

const fs = require('fs');

function atomicWriteFile(filePath, payload, callback) {
  const tempPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;

  fs.writeFile(tempPath, payload, (writeErr) => {
    if (writeErr) {
      callback(writeErr);
      return;
    }

    // Replace the previous backup with the last complete primary snapshot.
    fs.rm(backupPath, { force: true }, () => {
      fs.rename(filePath, backupPath, (backupErr) => {
        if (backupErr && backupErr.code !== 'ENOENT') {
          // A backup failure should not prevent the newer durable snapshot
          // from being committed; keep going and report only commit failure.
          console.error(`Failed to rotate JSON backup ${backupPath}:`, backupErr);
        }

        fs.rename(tempPath, filePath, (commitErr) => {
          if (!commitErr) {
            callback(null);
            return;
          }

          // Best-effort rollback if the new snapshot could not be committed.
          fs.rename(backupPath, filePath, () => callback(commitErr));
        });
      });
    });
  });
}

function readJsonFileSync(filePath, fallback, validate = () => true) {
  const candidates = [filePath, `${filePath}.bak`];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (!validate(parsed)) throw new Error('JSON store failed validation');
      return parsed;
    } catch (err) {
      if (err && err.code === 'ENOENT') continue;
      console.error(`Failed to read JSON store ${candidate}:`, err);
    }
  }

  return fallback;
}

function createJsonWriter(filePath, getSnapshot, delayMs = 1000, writeFile = atomicWriteFile) {
  let timer = null;
  let writing = false;
  let dirty = false;

  function arm() {
    if (timer || writing || !dirty) return;
    timer = setTimeout(flush, delayMs);
  }

  function flush() {
    timer = null;
    if (writing || !dirty) return;

    let payload;
    try {
      payload = JSON.stringify(getSnapshot());
    } catch (err) {
      console.error(`Failed to serialize JSON store ${filePath}:`, err);
      return;
    }

    dirty = false;
    writing = true;
    writeFile(filePath, payload, (err) => {
      writing = false;
      if (err) {
        // Keep state dirty. The next mutation schedules another attempt,
        // avoiding a tight retry loop if the filesystem is unavailable.
        dirty = true;
        console.error(`Failed to persist JSON store ${filePath}:`, err);
        return;
      }
      if (dirty) arm();
    });
  }

  return function persist() {
    dirty = true;
    arm();
  };
}

module.exports = { createJsonWriter, readJsonFileSync, atomicWriteFile };
