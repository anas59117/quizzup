const path = require('node:path');
const CATALOG = {
  'account-links': { root: 'object', groups: { firebaseToCanonical: 'map' }, empty: { firebaseToCanonical: {} } },
  'async-challenges': { root: 'array', empty: [] },
  'category-stats': { root: 'map', empty: {} },
  challenges: { root: 'array', empty: [] },
  follows: { root: 'object', groups: { following: 'map' }, empty: { following: {} } },
  'match-history': { root: 'map', empty: {} },
  messages: { root: 'object', groups: { threads: 'array', themes: 'map' }, empty: { threads: [], themes: {} } },
  notifications: { root: 'map', empty: {} },
  posts: { root: 'object', groups: { posts: 'array' }, required: ['posts'], empty: { posts: [] } },
  reports: { root: 'object', groups: { counts: 'map', quarantined: 'array' }, empty: { counts: {}, quarantined: [] } },
  social: { root: 'object', groups: { profiles: 'map', friends: 'map', requests: 'map' }, empty: { profiles: {}, friends: {}, requests: {} } },
  stats: { root: 'map', empty: {} },
  'topic-stats': { root: 'map', empty: {} },
  'user-reports': { root: 'object', groups: { reports: 'array', blocks: 'map', flaggedNames: 'map' }, empty: { reports: [], blocks: {}, flaggedNames: {} } },
};
const STORE_NAMES = Object.freeze(Object.keys(CATALOG));
// Only stores introduced after the initial dataset may be initialized empty.
const ADDITIVE_STORES = Object.freeze(['user-reports']);
function definition(name) {
  if (!Object.hasOwn(CATALOG, name)) throw Object.assign(new Error('UNKNOWN_STORE'), { code: 'UNKNOWN_STORE' });
  return CATALOG[name];
}
function storeName(file) {
  const name = path.basename(file, '.json');
  definition(name);
  return name;
}
function emptyStore(name) { return structuredClone(definition(name).empty); }
function normalizeDataset(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || Object.keys(data).some(name => !STORE_NAMES.includes(name))
    || STORE_NAMES.some(name => !Object.hasOwn(data, name) && !ADDITIVE_STORES.includes(name))) {
    throw Object.assign(new Error('INCOMPLETE_DATASET'), { code: 'INCOMPLETE_DATASET' });
  }
  return Object.fromEntries(STORE_NAMES.map(name => [name, Object.hasOwn(data, name) ? data[name] : emptyStore(name)]));
}
module.exports = { STORE_NAMES, ADDITIVE_STORES, definition, storeName, emptyStore, normalizeDataset };
