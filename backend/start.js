require('dotenv').config();
const storage = require('./storage/runtime');
storage.initialize({ onFatal: () => {
  // A lost owner must not continue accepting actions against stale caches.
  console.error('STORAGE_CONNECTION_LOST: stopping this writer');
  process.exit(1);
} }).then(() => require('./server')).catch(error => {
  // Do not log database URLs, query parameters or persisted user data.
  console.error(`Storage startup rejected: ${error.code || 'STORAGE_STARTUP_FAILED'}`);
  process.exitCode = 1;
});
