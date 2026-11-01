const { storeName } = require('./catalog');
let active = null;
function backend() {
  const value = process.env.STORAGE_BACKEND || 'json';
  if (!['json', 'postgres'].includes(value)) throw Object.assign(new Error('UNKNOWN_STORAGE_BACKEND'), { code: 'UNKNOWN_STORAGE_BACKEND' });
  return value;
}
function postgres() { return backend() === 'postgres'; }
function assertReady() {
  if (postgres() && (!active || active.failed || active.closing)) throw Object.assign(new Error('STORAGE_NOT_READY'), { code: 'STORAGE_NOT_READY' });
}
async function initialize({ onFatal } = {}) {
  if (!postgres()) return;
  const { PostgresStore } = require('./postgres-store');
  const store = await PostgresStore.open({ connectionString: process.env.DATABASE_URL, runtime: true, onFatal });
  try { await store.load(); active = store; }
  catch (error) { await store.close(); throw error; }
}
function read(file, validate) {
  assertReady();
  const value = active.readSnapshot(storeName(file));
  if (!validate(value)) throw Object.assign(new Error('INVALID_DATABASE_STORE'), { code: 'INVALID_DATABASE_STORE' });
  return value;
}
function write(file, payload, callback) {
  try { assertReady(); active.writeSnapshot(storeName(file), payload).then(() => callback(null), callback); }
  catch (error) { callback(error); }
}
async function close() { if (active) { await active.close(); active = null; } }
function info() { return { backend: backend(), ready: !postgres() || !!active && !active.failed && !active.closing, singleWriter: true }; }
module.exports = { backend, postgres, assertReady, initialize, read, write, close, info };
