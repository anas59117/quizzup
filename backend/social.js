// Friends graph and online presence. Friend edges persist to a local JSON
// file (same pattern as reports.js); presence is always in-memory since it
// can't outlive a live WebSocket connection anyway.

const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, 'social.json');
const MAX_FRIENDS = 200;

let profiles = {}; // clientId -> { name, avatar }
let friends = {}; // clientId -> [clientId, ...]
let requests = {}; // clientId -> [fromClientId, ...] (incoming pending requests)

try {
  const saved = JSON.parse(fs.readFileSync(STORE, 'utf8'));
  profiles = saved.profiles || {};
  friends = saved.friends || {};
  requests = saved.requests || {};
} catch {
  /* no store yet or unreadable — start fresh */
}

let writeScheduled = false;
function persist() {
  if (writeScheduled) return;
  writeScheduled = true;
  setTimeout(() => {
    writeScheduled = false;
    try {
      fs.writeFileSync(STORE, JSON.stringify({ profiles, friends, requests }));
    } catch {
      /* disk may be read-only/full — social features still work in memory */
    }
  }, 1000);
}

const online = new Map(); // clientId -> ws

function setOnline(clientId, ws, name, avatar) {
  if (!clientId) return;
  online.set(clientId, ws);
  profiles[clientId] = { name, avatar };
  persist();
}

function setOffline(clientId) {
  if (clientId) online.delete(clientId);
}

function isOnline(clientId) {
  const ws = online.get(clientId);
  return !!ws && ws.readyState === 1;
}

function getWs(clientId) {
  return online.get(clientId) || null;
}

function profileOf(clientId) {
  const p = profiles[clientId];
  return p ? { id: clientId, name: p.name, avatar: p.avatar, online: isOnline(clientId) } : null;
}

function areFriends(a, b) {
  return !!(friends[a] && friends[a].includes(b));
}

function sendRequest(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return { ok: false };
  if (areFriends(fromId, toId)) return { ok: false, reason: 'already_friends' };
  requests[toId] = requests[toId] || [];
  if (requests[toId].includes(fromId)) return { ok: false, reason: 'already_sent' };
  if ((friends[toId] || []).length >= MAX_FRIENDS) return { ok: false, reason: 'friend_list_full' };
  requests[toId].push(fromId);
  persist();
  return { ok: true };
}

function acceptRequest(id, fromId) {
  requests[id] = (requests[id] || []).filter((r) => r !== fromId);
  friends[id] = friends[id] || [];
  friends[fromId] = friends[fromId] || [];
  if (!friends[id].includes(fromId)) friends[id].push(fromId);
  if (!friends[fromId].includes(id)) friends[fromId].push(id);
  persist();
}

function declineRequest(id, fromId) {
  requests[id] = (requests[id] || []).filter((r) => r !== fromId);
  persist();
}

function removeFriend(id, otherId) {
  friends[id] = (friends[id] || []).filter((f) => f !== otherId);
  friends[otherId] = (friends[otherId] || []).filter((f) => f !== id);
  persist();
}

function getFriendsList(clientId) {
  return (friends[clientId] || []).map((id) => profileOf(id)).filter(Boolean);
}

function getPendingRequests(clientId) {
  return (requests[clientId] || []).map((id) => profileOf(id)).filter(Boolean);
}

module.exports = {
  setOnline, setOffline, isOnline, getWs, areFriends,
  sendRequest, acceptRequest, declineRequest, removeFriend,
  getFriendsList, getPendingRequests, profileOf,
};
