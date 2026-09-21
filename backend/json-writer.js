// Crash-resistant JSON persistence for the current single-instance MVP.
//
// Writes are debounced + serialized, then committed through a temp file. The
// previous complete snapshot is kept as ".bak" so a process/filesystem crash
// cannot silently turn a partially-written JSON file into a total data reset.

const fs = require('fs');

const writerControllers = new Set();

function atomicWriteFile(filePath, payload, callback) {
  const tempPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.bak`;

  function commitTemp(movedPrimary) {
    fs.rename(tempPath, filePath, (commitErr) => {
      if (!commitErr) {
        callback(null);
        return;
      }

      // Best-effort rollback only when this write actually moved the primary.
      // If primary was already missing, an existing .bak may be the only valid
      // snapshot and must be left untouched.
      if (movedPrimary) {
        fs.rename(backupPath, filePath, () => callback(commitErr));
      } else {
        callback(commitErr);
      }
    });
  }

  fs.writeFile(tempPath, payload, (writeErr) => {
    if (writeErr) {
      callback(writeErr);
      return;
    }

    fs.stat(filePath, (statErr) => {
      if (statErr && statErr.code === 'ENOENT') {
        // This can happen after a crash between "primary -> backup" and
        // "temp -> primary". Preserve the backup and simply install the new
        // complete snapshot.
        commitTemp(false);
        return;
      }
      if (statErr) {
        callback(statErr);
        return;
      }

      // A complete primary exists. Rotate it to backup before installing the
      // new snapshot. Remove the older backup first for Windows compatibility.
      fs.rm(backupPath, { force: true }, (removeErr) => {
        if (removeErr) {
          callback(removeErr);
          return;
        }

        fs.rename(filePath, backupPath, (backupErr) => {
          if (backupErr) {
            callback(backupErr);
            return;
          }
          commitTemp(true);
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
  let waiters = [];

  function resolveWaiters() {
    if (writing || dirty || timer || waiters.length === 0) return;
    const current = waiters;
    waiters = [];
    current.forEach(({ resolve }) => resolve());
  }

  function rejectWaiters(err) {
    if (waiters.length === 0) return;
    const current = waiters;
    waiters = [];
    current.forEach(({ reject }) => reject(err));
  }

  function arm() {
    if (timer || writing || !dirty) return;
    timer = setTimeout(flush, delayMs);
  }

  function flush() {
    timer = null;
    if (writing || !dirty) {
      resolveWaiters();
      return;
    }

    let payload;
    try {
      payload = JSON.stringify(getSnapshot());
    } catch (err) {
      dirty = false;
      rejectWaiters(err);
      console.error(`Failed to serialize JSON store ${filePath}:`, err);
      return;
    }

    dirty = false;
    writing = true;
    writeFile(filePath, payload, (err) => {
      writing = false;
      if (err) {
        // Keep state dirty for a future mutation/retry, but reject explicit
        // flush callers so shutdown can detect that durability failed.
        dirty = true;
        rejectWaiters(err);
        console.error(`Failed to persist JSON store ${filePath}:`, err);
        return;
      }
      if (dirty) {
        // Mutations that happened during the write should be persisted next.
        if (waiters.length) flush();
        else arm();
      } else {
        resolveWaiters();
      }
    });
  }

  function persist() {
    dirty = true;
    arm();
  }

  persist.flush = function flushNow() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    return new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      if (!writing) {
        if (dirty) flush();
        else resolveWaiters();
      }
    });
  };

  const controller = { flush: persist.flush };
  writerControllers.add(controller);
  persist.dispose = () => writerControllers.delete(controller);

  return persist;
}

async function flushAllJsonWriters() {
  const writers = [...writerControllers];
  const results = await Promise.allSettled(writers.map((writer) => writer.flush()));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    const err = new Error(`Failed to flush ${failures.length} JSON store(s)`);
    err.causes = failures.map((failure) => failure.reason);
    throw err;
  }
}

module.exports = {
  createJsonWriter,
  readJsonFileSync,
  atomicWriteFile,
  flushAllJsonWriters,
};
