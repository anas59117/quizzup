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
};
const STORE_NAMES = Object.freeze(Object.keys(CATALOG));
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
module.exports = { STORE_NAMES, definition, storeName, emptyStore };
