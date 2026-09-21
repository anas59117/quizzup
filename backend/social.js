// Friends graph and online presence. Friend edges persist to a local JSON
// file (same pattern as reports.js); presence is always in-memory since it
// can't outlive a live WebSocket connection anyway.

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizeSocialStore } = require('./store-normalize');

const STORE = getStorePath('social.json');
const MAX_FRIENDS = 200;
const MAX_PENDING_REQUESTS = 100;

const savedSocial = normalizeSocialStore(
  readJsonFileSync(
    STORE,
    { profiles: {}, friends: {}, requests: {} },
    (value) => !!value && typeof value === 'object' && !Array.isArray(value)
  ),
  { maxFriends: MAX_FRIENDS, maxRequests: MAX_PENDING_REQUESTS }
);
let profiles = savedSocial.profiles; // clientId -> { name, avatar }
let friends = savedSocial.friends; // clientId -> [clientId, ...]
let requests = savedSocial.requests; // clientId -> incoming requester ids

const persist = createJsonWriter(
  STORE,
  () => ({ profiles, friends, requests })
);

const online = new Map(); // clientId -> ws

function setOnline(clientId, ws, name, avatar) {
  if (!clientId) return;
  online.set(clientId, ws);
  profiles[clientId] = { name, avatar };
  persist();
}

function setOffline(clientId, ws = null) {
  if (!clientId) return;
  // Do not let a late close event from an old socket erase a newer
  // connection that has already registered for the same account.
  if (!ws || online.get(clientId) === ws) online.delete(clientId);
}

function isOnline(clientId) {
  const ws = online.get(clientId);
  return !!ws && ws.readyState === 1;
}

function getWs(clientId) {
  return online.get(clientId) || null;
}

// All currently-connected sockets — used for feed broadcasts, which (unlike
// friend requests/DMs) go out to everyone rather than one target.
function getAllOnline() {
  return [...online.values()];
}

function profileOf(clientId) {
  const p = profiles[clientId];
  return p ? { id: clientId, name: p.name, avatar: p.avatar, online: isOnline(clientId) } : null;
}

function areFriends(a, b) {
  return !!(
    friends[a] && friends[a].includes(b)
    && friends[b] && friends[b].includes(a)
  );
}

function sendRequest(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return { ok: false };
  if (!profiles[toId]) return { ok: false, reason: 'unknown_user' };
  if (areFriends(fromId, toId)) return { ok: false, reason: 'already_friends' };
  requests[toId] = requests[toId] || [];
  if (requests[toId].includes(fromId)) return { ok: false, reason: 'already_sent' };
  if (requests[toId].length >= MAX_PENDING_REQUESTS) return { ok: false, reason: 'request_inbox_full' };
  if ((friends[toId] || []).length >= MAX_FRIENDS) return { ok: false, reason: 'friend_list_full' };
  if ((friends[fromId] || []).length >= MAX_FRIENDS) return { ok: false, reason: 'friend_list_full' };
  requests[toId].push(fromId);
  persist();
  return { ok: true };
}

// Only creates the friendship if `fromId` is actually a pending requester of
// `id` — without this check, any authenticated client could send
// { type: 'friend_accept', requesterId: '<anyone>' } and force a mutual
// friendship (and therefore DM access, gated by areFriends()) with a victim
// who never sent a request.
function acceptRequest(id, fromId) {
  if (!(requests[id] || []).includes(fromId)) return false;
  friends[id] = friends[id] || [];
  friends[fromId] = friends[fromId] || [];
  if (friends[id].length >= MAX_FRIENDS || friends[fromId].length >= MAX_FRIENDS) return false;
  requests[id] = requests[id].filter((r) => r !== fromId);
  if (!friends[id].includes(fromId)) friends[id].push(fromId);
  if (!friends[fromId].includes(id)) friends[fromId].push(id);
  persist();
  return true;
}

function declineRequest(id, fromId) {
  const current = requests[id] || [];
  if (!current.includes(fromId)) return false;
  requests[id] = current.filter((r) => r !== fromId);
  persist();
  return true;
}

function removeFriend(id, otherId) {
  if (!areFriends(id, otherId)) return false;
  friends[id] = (friends[id] || []).filter((f) => f !== otherId);
  friends[otherId] = (friends[otherId] || []).filter((f) => f !== id);
  persist();
  return true;
}

function getFriendsList(clientId) {
  return (friends[clientId] || [])
    .filter((id) => areFriends(clientId, id))
    .map((id) => profileOf(id))
    .filter(Boolean);
}

function getPendingRequests(clientId) {
  return (requests[clientId] || []).map((id) => profileOf(id)).filter(Boolean);
}

module.exports = {
  setOnline, setOffline, isOnline, getWs, getAllOnline, areFriends,
  sendRequest, acceptRequest, declineRequest, removeFriend,
  getFriendsList, getPendingRequests, profileOf,
};
