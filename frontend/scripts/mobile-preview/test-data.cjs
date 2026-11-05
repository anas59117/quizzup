const fs = require('node:fs');
const path = require('node:path');

// A new DATA_DIR otherwise imports the developer's legacy stores on first use.
// Seed each store before starting the backend so QA starts with empty accounts.
function createQaData(root, prefix) {
  fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, prefix));
  for (const name of ['account-links', 'async-challenges', 'category-stats', 'challenges', 'follows', 'match-history', 'messages', 'notifications', 'posts', 'reports', 'social', 'stats', 'topic-stats', 'user-reports']) {
    fs.writeFileSync(path.join(dir, `${name}.json`), '{}');
  }
  return dir;
}
module.exports = { createQaData };
