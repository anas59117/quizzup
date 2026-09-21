require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const { listCategories, warmCache, questionKey, CATEGORIES } = require('./questions');
const reports = require('./reports');
const social = require('./social');
const posts = require('./posts');
const game = require('./game');
const RateLimiter = require('./rate-limit');
const { getClientIp } = require('./client-ip');
const { flushAllJsonWriters } = require('./json-writer');
const { verifyIdToken, sweepCache } = require('./auth');
const stats = require('./stats');
const { ROOM_TTL_MS, CODE_ALPHABET, MAX_ROOM_PLAYERS } = require('./config');
const { randomRoomCode } = require('./ids');

const app = express();
const server = http.createServer(app);

function normalizeOrigin(origin) {
  if (!origin) return '';
  return String(origin).trim().replace(/\/$/, '');
}

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes('*');

function isAllowedOrigin(origin) {
  if (!allowedOrigins.length || allowAnyOrigin) return true;
  return !!origin && allowedOrigins.includes(normalizeOrigin(origin));
}

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 16 * 1024,
  verifyClient: ({ origin }) => isAllowedOrigin(origin),
});

app.use(cors(
  !allowedOrigins.length || allowAnyOrigin
    ? {}
    : { origin: allowedOrigins }
));

const PORT = process.env.PORT || 3001;
const configuredConnectionCap = Number(process.env.MAX_WS_CONNECTIONS_PER_IP);
const MAX_WS_CONNECTIONS_PER_IP = Number.isFinite(configuredConnectionCap)
  ? Math.max(0, Math.min(1000, configuredConnectionCap))
  : 100;
const WS_HEARTBEAT_MS = 30 * 1000;
const ROOM_RECONNECT_GRACE_MS = 15 * 1000;

if (process.env.NODE_ENV === 'production' && !allowedOrigins.length) {
  console.warn('CORS_ORIGIN is not configured; WebSocket origin checks are open.');
}
if (process.env.NODE_ENV === 'production' && !process.env.DATA_DIR) {
  console.warn('DATA_DIR is not configured; JSON persistence may be ephemeral on this host.');
}

const waitingPlayers = [];
const privateRooms = new Map();
const connectionsByIp = new Map();
const roomByClient = new Map();
const pendingPlayers = new Set();
const pendingClients = new Set();
const limiter = new RateLimiter();
const ipLimiter = new RateLimiter(2000, 40);

const actionLimiters = {
  identifySocket: new RateLimiter(60 * 1000, 6),
  identifyIp: new RateLimiter(60 * 1000, 30),
  friendRequest: new RateLimiter(60 * 1000, 10),
  friendMutation: new RateLimiter(60 * 1000, 30),
  dm: new RateLimiter(10 * 1000, 20),
  gameChat: new RateLimiter(10 * 1000, 12),
  roomJoin: new RateLimiter(30 * 1000, 10),
  roomJoinIp: new RateLimiter(30 * 1000, 30),
  feedList: new RateLimiter(10 * 1000, 10),
  postCreate: new RateLimiter(60 * 1000, 5),
  postReact: new RateLimiter(10 * 1000, 30),
  postReport: new RateLimiter(60 * 1000, 20),
};

function allowAction(limiterInstance, key, ws, code = 'RATE_LIMITED') {
  if (!key || limiterInstance.check(key)) return true;
  // Rate limiting is a recoverable action-level condition, not a fatal
  // transport/game error. Keep it out of the generic "error" message type
  // because the frontend intentionally sends those to the full error screen.
  game.send(ws, { type: 'rate_limited', code });
  return false;
}

function newRoomCode() {
  let code;
  do {
    code = randomRoomCode(CODE_ALPHABET, 5);
  } while (privateRooms.has(code));
  return code;
}

function notifyPresence(clientId, isOnline) {
  if (!clientId) return;
  social.getFriendsList(clientId).forEach((f) => {
    const fws = social.getWs(f.id);
    if (fws) game.send(fws, { type: 'presence', id: clientId, online: isOnline });
  });
}

async function handleIdentify(ws, data, state) {
  const requestedName = (
    typeof data.name === 'string' && data.name.trim()
      ? data.name.trim().slice(0, 20)
      : state.name
  );
  const requestedAvatar = typeof data.avatar === 'string'
    ? data.avatar.slice(0, 4)
    : state.avatar;

  const uid = await verifyIdToken(data.idToken);
  if (!uid) {
    game.send(ws, { type: 'auth_required', code: 'INVALID_TOKEN' });
    return;
  }

  // A live WebSocket is bound to one verified Firebase identity. Account
  // switching on the same transport creates ambiguous game/social ownership
  // and can bypass account-keyed abuse limits. Open a fresh socket instead.
  if (state.clientId && state.clientId !== uid) {
    game.send(ws, { type: 'auth_required', code: 'IDENTITY_SWITCH_NOT_ALLOWED' });
    ws.close(1008, 'Identity switch is not allowed on an authenticated socket');
    return;
  }

  state.name = requestedName;
  state.avatar = requestedAvatar;

  // Check the target identity before attaching it to this socket. This
  // prevents a rejected duplicate socket from marking the legitimate one
  // offline when its close event fires.
  let activeSession = game.findActiveSessionByClientId(uid);
  if (activeSession && activeSession.player.connected && activeSession.player.ws !== ws) {
    game.send(ws, { type: 'already_connected' });
    ws.close(1008, 'Account already connected to an active game');
    return;
  }

  let roomSession = findRoomSessionByClientId(uid);
  if (
    roomSession
    && roomSession.player.connected !== false
    && roomSession.player.ws
    && roomSession.player.ws !== ws
  ) {
    game.send(ws, { type: 'already_connected' });
    ws.close(1008, 'Account already connected to a private room');
    return;
  }

  if (data.recoverRoom === false && roomSession && roomSession.player.connected === false) {
    leaveRoomByClientId(uid);
    roomSession = null;
  }

  state.clientId = uid;
  const finishedSession = data.recoverGame === false
    ? null
    : game.findFinishedSessionByClientId(uid);
  const recoverySession = activeSession || finishedSession;
  const reconnected = !!(
    recoverySession
    && game.reconnectPlayer(uid, ws, state.playerId)
  );
  const roomReconnected = (
    !reconnected
    && data.recoverRoom !== false
    && reconnectRoomPlayer(uid, ws, state.playerId)
  );

  // On recovery, keep the identity already attached to the match/lobby
  // instead of overwriting it with a fresh tab's temporary defaults.
  if (reconnected && recoverySession) {
    state.name = recoverySession.player.name;
    state.avatar = recoverySession.player.avatar;
  } else if (roomReconnected && roomSession) {
    state.name = roomSession.player.name;
    state.avatar = roomSession.player.avatar;
  }

  social.setOnline(state.clientId, ws, state.name, state.avatar);
  game.send(ws, { type: 'identified', reconnected, roomReconnected });
  game.send(ws, { type: 'friends_list', friends: social.getFriendsList(state.clientId) });
  game.send(ws, { type: 'friend_requests', requests: social.getPendingRequests(state.clientId) });
  game.send(ws, { type: 'stats', stats: stats.getStats(state.clientId) });
  game.send(ws, { type: 'feed_list', posts: posts.getFeed() });
  notifyPresence(state.clientId, true);
}

function handleFeed(ws, data, state) {
  const { clientId } = state;
  if (data.type === 'feed_list') {
    const feedKey = clientId || state.ip;
    if (!allowAction(actionLimiters.feedList, feedKey, ws, 'FEED_RATE_LIMITED')) return true;
    game.send(ws, { type: 'feed_list', posts: posts.getFeed() });
    return true;
  }
  if (data.type === 'post_create') {
    if (!clientId) { game.send(ws, { type: 'auth_required' }); return true; }
    if (!allowAction(actionLimiters.postCreate, clientId, ws, 'POST_RATE_LIMITED')) return true;
    const category = typeof data.category === 'string' && Object.prototype.hasOwnProperty.call(CATEGORIES, data.category) ? data.category : null;
    const post = posts.addPost(clientId, state.name, state.avatar, category, data.text);
    if (post) social.getAllOnline().forEach((peer) => game.send(peer, { type: 'post_created', post }));
    return true;
  }
  if (data.type === 'post_react') {
    if (!clientId) return true;
    if (!allowAction(actionLimiters.postReact, clientId, ws, 'REACTION_RATE_LIMITED')) return true;
    const result = posts.toggleReaction(String(data.postId || ''), clientId);
    if (result) social.getAllOnline().forEach((peer) => game.send(peer, { type: 'post_reacted', ...result }));
    return true;
  }
  if (data.type === 'post_report') {
    if (!clientId) return true;
    if (!allowAction(actionLimiters.postReport, clientId, ws, 'REPORT_RATE_LIMITED')) return true;
    const result = posts.reportPost(String(data.postId || ''), clientId);
    if (result && result.hidden) social.getAllOnline().forEach((peer) => game.send(peer, { type: 'post_hidden', id: result.id }));
    return true;
  }
  return false;
}

function handleSocial(ws, data, state) {
  const { clientId } = state;
  if (data.type === 'friend_request') {
    const targetId = String(data.targetId || '');
    if (clientId && targetId) {
      if (!allowAction(actionLimiters.friendRequest, clientId, ws, 'FRIEND_REQUEST_RATE_LIMITED')) return true;
      const result = social.sendRequest(clientId, targetId);
      const me = result.ok && social.profileOf(clientId);
      const targetWs = result.ok && social.getWs(targetId);
      if (targetWs && me) game.send(targetWs, { type: 'friend_request_received', from: me });
    }
    return true;
  }
  if (data.type === 'friend_accept') {
    if (clientId && !allowAction(actionLimiters.friendMutation, clientId, ws, 'FRIEND_ACTION_RATE_LIMITED')) return true;
    const fromId = String(data.requesterId || '');
    if (clientId && fromId && social.acceptRequest(clientId, fromId)) {
      const them = social.profileOf(fromId);
      const me = social.profileOf(clientId);
      if (them) game.send(ws, { type: 'friend_added', friend: them });
      const fromWs = social.getWs(fromId);
      if (fromWs && me) game.send(fromWs, { type: 'friend_added', friend: me });
    }
    return true;
  }
  if (data.type === 'friend_decline') {
    if (clientId && !allowAction(actionLimiters.friendMutation, clientId, ws, 'FRIEND_ACTION_RATE_LIMITED')) return true;
    const fromId = String(data.requesterId || '');
    if (clientId && fromId) social.declineRequest(clientId, fromId);
    return true;
  }
  if (data.type === 'friend_remove') {
    if (clientId && !allowAction(actionLimiters.friendMutation, clientId, ws, 'FRIEND_ACTION_RATE_LIMITED')) return true;
    const targetId = String(data.targetId || '');
    if (clientId && targetId && social.areFriends(clientId, targetId)) {
      social.removeFriend(clientId, targetId);
      game.send(ws, { type: 'friend_removed', id: targetId });
      const targetWs = social.getWs(targetId);
      if (targetWs) game.send(targetWs, { type: 'friend_removed', id: clientId });
    }
    return true;
  }
  if (data.type === 'dm') {
    const targetId = String(data.targetId || '');
    const text = typeof data.text === 'string' ? data.text.trim().slice(0, 300) : '';
    if (clientId && targetId && text && social.areFriends(clientId, targetId)) {
      if (!allowAction(actionLimiters.dm, clientId, ws, 'DM_RATE_LIMITED')) return true;
      const targetWs = social.getWs(targetId);
      if (targetWs) {
        game.send(targetWs, { type: 'dm', from: clientId, text });
        game.send(ws, { type: 'dm_sent', targetId, text });
      } else {
        game.send(ws, { type: 'dm_unavailable', targetId });
      }
    }
    return true;
  }
  return false;
}

function roomView(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    connected: p.connected !== false,
  }));
}

function roomCanStart(room) {
  return room.players.length >= 2
    && room.players.every((p) => p.connected !== false && p.ws && p.ws.readyState === 1);
}

function findRoomSessionByClientId(clientId) {
  const code = clientId && roomByClient.get(clientId);
  const room = code && privateRooms.get(code);
  if (!room) {
    if (clientId && code) roomByClient.delete(clientId);
    return null;
  }
  const index = room.players.findIndex((p) => p.clientId === clientId);
  if (index === -1) {
    roomByClient.delete(clientId);
    return null;
  }
  return { code, room, player: room.players[index], index };
}

function removeRoom(code, { notify = false, exceptPlayerId = null } = {}) {
  const room = privateRooms.get(code);
  if (!room) return null;

  privateRooms.delete(code);
  room.players.forEach((p) => {
    roomByClient.delete(p.clientId);
    if (p.reconnectTimer) {
      clearTimeout(p.reconnectTimer);
      p.reconnectTimer = null;
    }
  });

  if (notify) {
    room.players.forEach((p) => {
      if (p.id !== exceptPlayerId) game.send(p.ws, { type: 'room_closed' });
    });
  }
  return room;
}

function broadcastRoomUpdate(room) {
  if (!room.players.length) return;
  const view = roomView(room);
  const hostId = room.players[0].id;
  const canStart = roomCanStart(room);
  room.players.forEach((p) => {
    game.send(p.ws, {
      type: 'room_update', code: room.code, players: view,
      isHost: p.id === hostId, canStart,
    });
  });
}

function reconnectRoomPlayer(clientId, ws, newPlayerId) {
  const found = findRoomSessionByClientId(clientId);
  if (!found || found.player.connected !== false) return false;

  const { room, player } = found;
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);
  player.reconnectTimer = null;
  player.connected = true;
  player.ws = ws;
  player.id = newPlayerId;
  broadcastRoomUpdate(room);
  return true;
}

function disconnectRoomPlayer(clientId, ws) {
  const found = findRoomSessionByClientId(clientId);
  if (!found || found.player.ws !== ws || found.player.connected === false) return false;

  const { code, room, player, index } = found;
  player.connected = false;
  player.ws = null;
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);

  player.reconnectTimer = setTimeout(() => {
    const current = findRoomSessionByClientId(clientId);
    if (!current || current.player !== player || current.player.connected !== false) return;

    if (index === 0 || current.index === 0) {
      removeRoom(code, { notify: true });
      return;
    }

    current.room.players.splice(current.index, 1);
    roomByClient.delete(clientId);
    broadcastRoomUpdate(current.room);
  }, ROOM_RECONNECT_GRACE_MS);

  broadcastRoomUpdate(room);
  return true;
}

function leaveRoomByClientId(clientId, exceptPlayerId = null) {
  const found = findRoomSessionByClientId(clientId);
  if (!found) return false;

  const { code, room, player, index } = found;
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);

  if (index === 0) {
    removeRoom(code, { notify: true, exceptPlayerId });
  } else {
    room.players.splice(index, 1);
    roomByClient.delete(clientId);
    broadcastRoomUpdate(room);
  }
  return true;
}

function leaveRoom(clientId, playerId) {
  const found = findRoomSessionByClientId(clientId);
  if (!found || found.player.id !== playerId) return false;
  return leaveRoomByClientId(clientId, playerId);
}

function isInActiveGame(playerId) {
  const gameId = game.playerSessions.get(playerId);
  const g = gameId && game.activeGames.get(gameId);
  return !!(g && g.status === 'active');
}

function isGameBusy(playerId, clientId) {
  return isInActiveGame(playerId)
    || pendingPlayers.has(playerId)
    || (!!clientId && (
      pendingClients.has(clientId)
      || !!game.findActiveSessionByClientId(clientId)
      || game.startingClients.has(clientId)
    ));
}

function isWaiting(clientId) {
  return !!clientId && waitingPlayers.some((p) => p.clientId === clientId);
}

function isBusy(playerId, clientId) {
  return isGameBusy(playerId, clientId)
    || (!!clientId && roomByClient.has(clientId));
}

function requireAuth(ws, state) {
  if (state.clientId) return true;
  game.send(ws, { type: 'auth_required', code: 'IDENTIFY_FIRST' });
  return false;
}

function startGameGuarded(players, categoryKey) {
  players.forEach((p) => {
    pendingPlayers.add(p.id);
    if (p.clientId) pendingClients.add(p.clientId);
  });
  return game.startGame(players, categoryKey)
    .catch((err) => {
      const code = err && err.message ? err.message : 'GAME_START_FAILED';
      const recoverable = code === 'CLIENT_ALREADY_PLAYING';
      players.forEach((p) => game.send(
        p.ws,
        recoverable ? { type: 'already_playing' } : { type: 'error', code }
      ));
    })
    .finally(() => players.forEach((p) => {
      pendingPlayers.delete(p.id);
      if (p.clientId) pendingClients.delete(p.clientId);
    }));
}

function handleGameplay(ws, data, state) {
  const { playerId } = state;

  const gameplayTypes = new Set([
    'game_chat', 'solo', 'join', 'cancel_queue', 'answer', 'create_room', 'join_room',
    'start_room', 'leave_room', 'report', 'leave',
  ]);
  if (gameplayTypes.has(data.type) && !requireAuth(ws, state)) return true;

  if (data.type === 'game_chat') {
    if (!allowAction(actionLimiters.gameChat, state.clientId, ws, 'CHAT_RATE_LIMITED')) return true;
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    const text = typeof data.text === 'string' ? data.text.trim().slice(0, 200) : '';
    if (g && g.status === 'active' && text) {
      const sender = g.players.find((p) => p.id === playerId);
      g.players.filter((p) => p.id !== playerId).forEach((p) => game.send(p.ws, {
        type: 'game_chat', text, from: sender ? sender.name : 'Player',
      }));
      game.send(ws, { type: 'game_chat_sent', text });
    }
    return true;
  }

  if (data.type === 'solo') {
    if (isBusy(playerId, state.clientId) || isWaiting(state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    game.send(ws, { type: 'joined', playerId, name: state.name });
    startGameGuarded([{ ws, id: playerId, clientId: state.clientId, name: state.name, avatar }], categoryKey);
    return true;
  }

  if (data.type === 'join') {
    if (isBusy(playerId, state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (waitingPlayers.some((w) => w.id === playerId || w.clientId === state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    game.send(ws, { type: 'joined', playerId, name: state.name });
    const oppIdx = waitingPlayers.findIndex((w) =>
      w.categoryKey === categoryKey
      && w.clientId !== state.clientId
      && w.ws.readyState === 1
      && !isBusy(w.id, w.clientId)
    );
    if (oppIdx !== -1) {
      const opp = waitingPlayers.splice(oppIdx, 1)[0];
      startGameGuarded([opp, { ws, id: playerId, clientId: state.clientId, name: state.name, avatar }], categoryKey);
    } else {
      waitingPlayers.push({ ws, id: playerId, clientId: state.clientId, name: state.name, avatar, categoryKey });
      game.send(ws, { type: 'waiting' });
    }
    return true;
  }

  if (data.type === 'cancel_queue') {
    const index = waitingPlayers.findIndex(
      (p) => p.id === playerId || p.clientId === state.clientId
    );
    if (index !== -1) waitingPlayers.splice(index, 1);
    game.send(ws, { type: 'queue_cancelled' });
    return true;
  }

  if (data.type === 'answer') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active' && Number.isInteger(data.answerIndex) && data.answerIndex >= 0 && data.answerIndex <= 3) {
      game.recordAnswer(g, playerId, data.answerIndex);
    }
    return true;
  }

  if (data.type === 'create_room') {
    const existingCode = roomByClient.get(state.clientId);
    const existing = existingCode && privateRooms.get(existingCode);
    if (existingCode && !existing) roomByClient.delete(state.clientId);
    if (existing) {
      const host = existing.players[0];
      if (host && host.id === playerId) {
        game.send(ws, { type: 'room_created', code: existing.code, players: roomView(existing), isHost: true, canStart: roomCanStart(existing) });
      } else {
        game.send(ws, { type: 'already_playing' });
      }
      return true;
    }
    if (isBusy(playerId, state.clientId) || isWaiting(state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    const code = newRoomCode();
    const room = {
      code,
      players: [{
        ws, id: playerId, clientId: state.clientId, name: state.name, avatar,
        connected: true, reconnectTimer: null,
      }],
      categoryKey, createdAt: Date.now(),
    };
    privateRooms.set(code, room);
    roomByClient.set(state.clientId, code);
    game.send(ws, { type: 'room_created', code, players: roomView(room), isHost: true, canStart: false });
    return true;
  }

  if (data.type === 'join_room') {
    if (isBusy(playerId, state.clientId) || isWaiting(state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (!allowAction(actionLimiters.roomJoin, state.clientId, ws, 'ROOM_JOIN_RATE_LIMITED')) return true;
    if (!allowAction(actionLimiters.roomJoinIp, state.ip, ws, 'ROOM_JOIN_RATE_LIMITED')) return true;
    const code = String(data.code || '').toUpperCase().trim();
    const room = privateRooms.get(code);
    if (!room) {
      game.send(ws, { type: 'room_not_found' });
      return true;
    }
    if (room.players[0].connected === false || !room.players[0].ws || room.players[0].ws.readyState !== 1) {
      // Preserve the room during the host's reconnect grace period. A third
      // party trying the code should not be able to destroy that recovery.
      game.send(ws, { type: 'room_unavailable' });
      return true;
    }
    if (room.players.some((p) => p.id === playerId || p.clientId === state.clientId)) {
      game.send(ws, { type: 'already_playing' });
      return true;
    }
    if (room.players.length >= MAX_ROOM_PLAYERS) { game.send(ws, { type: 'room_full' }); return true; }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F981}';
    room.players.push({
      ws, id: playerId, clientId: state.clientId, name: state.name, avatar,
      connected: true, reconnectTimer: null,
    });
    roomByClient.set(state.clientId, code);
    broadcastRoomUpdate(room);
    return true;
  }

  if (data.type === 'start_room') {
    const code = String(data.code || '').toUpperCase().trim();
    const room = privateRooms.get(code);
    if (!room || room.players[0].id !== playerId) return true;
    if (!roomCanStart(room) || room.players.length > MAX_ROOM_PLAYERS) return true;
    if (room.players.some((p) => isGameBusy(p.id, p.clientId))) {
      room.players.forEach((p) => game.send(p.ws, { type: 'already_playing' }));
      return true;
    }
    removeRoom(code);
    startGameGuarded(room.players, room.categoryKey);
    return true;
  }

  if (data.type === 'leave_room') {
    if (leaveRoom(state.clientId, playerId)) {
      game.send(ws, { type: 'room_left' });
    }
    return true;
  }

  if (data.type === 'report') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    // Reporting is intentionally limited to the reveal window, when the
    // player has actually seen both the prompt and the authoritative answer.
    // A crafted client can no longer mass-flag unseen questions during play.
    if (g && g.status === 'active' && g.phase === 'revealed' && g.currentRound >= 0) {
      const key = `${state.clientId}:${g.currentRound}`;
      if (!g.reported.has(key)) {
        const q = g.questions[g.currentRound];
        const accepted = q && reports.report(questionKey(q));
        if (accepted) {
          g.reported.add(key);
          game.send(ws, { type: 'report_ack' });
        }
      }
    }
    return true;
  }

  if (data.type === 'leave') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active') game.removePlayer(g, playerId);
    return true;
  }

  return false;
}

wss.on('connection', (ws, req) => {
  const ip = getClientIp(req);
  const currentConnections = connectionsByIp.get(ip) || 0;
  if (MAX_WS_CONNECTIONS_PER_IP > 0 && currentConnections >= MAX_WS_CONNECTIONS_PER_IP) {
    ws.close(1008, 'Too many connections');
    return;
  }
  connectionsByIp.set(ip, currentConnections + 1);

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  const state = {
    playerId: game.rid('player_'),
    name: 'Player' + Math.floor(1000 + Math.random() * 9000),
    clientId: null,
    avatar: '\u{1F43A}',
    ip,
  };

  game.send(ws, { type: 'session', playerId: state.playerId });

  ws.on('message', async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (!data || typeof data.type !== 'string') return;
    if (!limiter.check(state.playerId) || !ipLimiter.check(ip)) return;

    if (data.type === 'identify') {
      if (
        !actionLimiters.identifySocket.check(state.playerId)
        || !actionLimiters.identifyIp.check(ip)
      ) {
        game.send(ws, { type: 'auth_required', code: 'AUTH_RATE_LIMITED' });
        return;
      }
      await handleIdentify(ws, data, state);
      return;
    }
    if (handleSocial(ws, data, state)) return;
    if (handleFeed(ws, data, state)) return;
    handleGameplay(ws, data, state);
  });

  ws.on('close', () => {
    const remainingConnections = Math.max(0, (connectionsByIp.get(ip) || 1) - 1);
    if (remainingConnections === 0) connectionsByIp.delete(ip);
    else connectionsByIp.set(ip, remainingConnections);

    limiter.remove(state.playerId);
    if (state.clientId) {
      social.setOffline(state.clientId, ws);
      if (!social.isOnline(state.clientId)) notifyPresence(state.clientId, false);
    }

    const wi = waitingPlayers.findIndex((w) => w.id === state.playerId);
    if (wi !== -1) waitingPlayers.splice(wi, 1);

    if (state.clientId) disconnectRoomPlayer(state.clientId, ws);

    const gameId = game.playerSessions.get(state.playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active') game.disconnectPlayer(g, state.playerId);
  });
});

app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    activeGames: game.activeGames.size,
    waiting: waitingPlayers.length,
    connections: wss.clients.size,
    persistentStorageConfigured: !!process.env.DATA_DIR,
  })
);
app.get('/categories', (req, res) => res.json(listCategories()));
app.get('/reports/stats', (req, res) => res.json(reports.stats()));

const heartbeatTimer = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch { ws.terminate(); }
  });
}, WS_HEARTBEAT_MS);

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of privateRooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      removeRoom(code, { notify: true });
    }
  }
  limiter.sweep();
  ipLimiter.sweep();
  Object.values(actionLimiters).forEach((rl) => rl.sweep());
  sweepCache();
}, 60 * 1000);

server.on('close', () => clearInterval(heartbeatTimer));

let shuttingDown = false;
async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; flushing persistent state before shutdown...`);

  // Ask clients to reconnect to the replacement instance instead of waiting
  // for the process to be killed underneath an apparently-open socket.
  wss.clients.forEach((ws) => {
    try { ws.close(1012, 'Server restart'); } catch {}
  });

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 5000);
  forceExit.unref();

  try {
    await flushAllJsonWriters();
    server.close(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to flush persistent state during shutdown:', err);
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`\u{1F3AE} QuizzUp backend on http://localhost:${PORT}`);
  warmCache();
});
