// Debounced, serialized JSON persistence for the single-instance MVP.
//
// The old modules cleared their "write scheduled" flag before fs.writeFile
// completed. A second mutation could therefore start a second write while the
// first was still in flight; if the older write finished last it could
// overwrite newer state. This helper guarantees at most one write at a time
// and queues one follow-up snapshot when mutations happen during a write.

const fs = require('fs');

function createJsonWriter(filePath, getSnapshot, delayMs = 1000, writeFile = fs.writeFile) {
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
        // Keep the state marked dirty. We avoid a tight retry loop; the next
        // mutation will schedule another attempt.
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

module.exports = { createJsonWriter };
