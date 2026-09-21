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
const { verifyIdToken, sweepCache } = require('./auth');
const stats = require('./stats');
const { ROOM_TTL_MS, CODE_ALPHABET, MAX_ROOM_PLAYERS } = require('./config');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));

const PORT = process.env.PORT || 3001;

function getClientIp(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

const waitingPlayers = [];
const privateRooms = new Map();
const openRoomByPlayer = new Map();
const pendingPlayers = new Set();
const limiter = new RateLimiter();
const ipLimiter = new RateLimiter(2000, 40);

function newRoomCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
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
  if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
  const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
  state.avatar = avatar;

  const uid = await verifyIdToken(data.idToken);
  if (!uid) {
    game.send(ws, { type: 'auth_required', code: 'INVALID_TOKEN' });
    return;
  }

  // Check the target identity before attaching it to this socket. This
  // prevents a rejected duplicate socket from marking the legitimate one
  // offline when its close event fires.
  const activeSession = game.findActiveSessionByClientId(uid);
  if (activeSession && activeSession.player.connected && activeSession.player.ws !== ws) {
    game.send(ws, { type: 'already_connected' });
    ws.close(1008, 'Account already connected to an active game');
    return;
  }

  if (state.clientId && state.clientId !== uid) {
    social.setOffline(state.clientId, ws);
    notifyPresence(state.clientId, false);
  }

  state.clientId = uid;
  const reconnected = !!(activeSession && !activeSession.player.connected
    && game.reconnectPlayer(uid, ws, state.playerId));

  social.setOnline(state.clientId, ws, state.name, avatar);
  game.send(ws, { type: 'identified', reconnected });
  game.send(ws, { type: 'friends_list', friends: social.getFriendsList(state.clientId) });
  game.send(ws, { type: 'friend_requests', requests: social.getPendingRequests(state.clientId) });
  game.send(ws, { type: 'stats', stats: stats.getStats(state.clientId) });
  game.send(ws, { type: 'feed_list', posts: posts.getFeed() });
  notifyPresence(state.clientId, true);
}

function handleFeed(ws, data, state) {
  const { clientId } = state;
  if (data.type === 'feed_list') {
    game.send(ws, { type: 'feed_list', posts: posts.getFeed() });
    return true;
  }
  if (data.type === 'post_create') {
    if (!clientId) { game.send(ws, { type: 'auth_required' }); return true; }
    const category = typeof data.category === 'string' && Object.prototype.hasOwnProperty.call(CATEGORIES, data.category) ? data.category : null;
    const post = posts.addPost(clientId, state.name, state.avatar, category, data.text);
    if (post) social.getAllOnline().forEach((peer) => game.send(peer, { type: 'post_created', post }));
    return true;
  }
  if (data.type === 'post_react') {
    if (!clientId) return true;
    const result = posts.toggleReaction(String(data.postId || ''), clientId);
    if (result) social.getAllOnline().forEach((peer) => game.send(peer, { type: 'post_reacted', ...result }));
    return true;
  }
  if (data.type === 'post_report') {
    if (!clientId) return true;
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
      const result = social.sendRequest(clientId, targetId);
      const me = result.ok && social.profileOf(clientId);
      const targetWs = result.ok && social.getWs(targetId);
      if (targetWs && me) game.send(targetWs, { type: 'friend_request_received', from: me });
    }
    return true;
  }
  if (data.type === 'friend_accept') {
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
    const fromId = String(data.requesterId || '');
    if (clientId && fromId) social.declineRequest(clientId, fromId);
    return true;
  }
  if (data.type === 'friend_remove') {
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
      const targetWs = social.getWs(targetId);
      if (targetWs) game.send(targetWs, { type: 'dm', from: clientId, text });
    }
    return true;
  }
  return false;
}

function roomView(room) {
  return room.players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }));
}

function broadcastRoomUpdate(room) {
  if (!room.players.length) return;
  const view = roomView(room);
  const hostId = room.players[0].id;
  room.players.forEach((p) => {
    game.send(p.ws, {
      type: 'room_update', code: room.code, players: view,
      isHost: p.id === hostId, canStart: room.players.length >= 2,
    });
  });
}

function isInActiveGame(playerId) {
  const gameId = game.playerSessions.get(playerId);
  const g = gameId && game.activeGames.get(gameId);
  return !!(g && g.status === 'active');
}

function isBusy(playerId) {
  return isInActiveGame(playerId) || pendingPlayers.has(playerId);
}

function requireAuth(ws, state) {
  if (state.clientId) return true;
  game.send(ws, { type: 'auth_required', code: 'IDENTIFY_FIRST' });
  return false;
}

function startGameGuarded(players, categoryKey) {
  players.forEach((p) => pendingPlayers.add(p.id));
  return game.startGame(players, categoryKey)
    .catch((err) => {
      const code = err && err.message ? err.message : 'GAME_START_FAILED';
      players.forEach((p) => game.send(p.ws, { type: 'error', code }));
    })
    .finally(() => players.forEach((p) => pendingPlayers.delete(p.id)));
}

function handleGameplay(ws, data, state) {
  const { playerId } = state;

  const gameplayTypes = new Set([
    'game_chat', 'solo', 'join', 'answer', 'create_room', 'join_room',
    'start_room', 'report', 'leave',
  ]);
  if (gameplayTypes.has(data.type) && !requireAuth(ws, state)) return true;

  if (data.type === 'game_chat') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    const text = typeof data.text === 'string' ? data.text.trim().slice(0, 200) : '';
    if (g && g.status === 'active' && text) {
      const sender = g.players.find((p) => p.id === playerId);
      g.players.filter((p) => p.id !== playerId).forEach((p) => game.send(p.ws, {
        type: 'game_chat', text, from: sender ? sender.name : 'Player',
      }));
    }
    return true;
  }

  if (data.type === 'solo') {
    if (isBusy(playerId)) return true;
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    game.send(ws, { type: 'joined', playerId, name: state.name });
    startGameGuarded([{ ws, id: playerId, clientId: state.clientId, name: state.name, avatar }], categoryKey);
    return true;
  }

  if (data.type === 'join') {
    if (isBusy(playerId)) return true;
    if (waitingPlayers.some((w) => w.id === playerId)) return true;
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    game.send(ws, { type: 'joined', playerId, name: state.name });
    const oppIdx = waitingPlayers.findIndex((w) =>
      w.categoryKey === categoryKey && w.ws.readyState === 1 && !isBusy(w.id)
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

  if (data.type === 'answer') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active' && Number.isInteger(data.answerIndex) && data.answerIndex >= 0 && data.answerIndex <= 3) {
      game.recordAnswer(g, playerId, data.answerIndex);
    }
    return true;
  }

  if (data.type === 'create_room') {
    if (isBusy(playerId)) return true;
    const existingCode = openRoomByPlayer.get(playerId);
    const existing = existingCode && privateRooms.get(existingCode);
    if (existing) {
      game.send(ws, { type: 'room_created', code: existing.code, players: roomView(existing), isHost: true, canStart: existing.players.length >= 2 });
      return true;
    }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    const code = newRoomCode();
    const room = {
      code,
      players: [{ ws, id: playerId, clientId: state.clientId, name: state.name, avatar }],
      categoryKey, createdAt: Date.now(),
    };
    privateRooms.set(code, room);
    openRoomByPlayer.set(playerId, code);
    game.send(ws, { type: 'room_created', code, players: roomView(room), isHost: true, canStart: false });
    return true;
  }

  if (data.type === 'join_room') {
    if (isBusy(playerId)) { game.send(ws, { type: 'already_playing' }); return true; }
    const code = String(data.code || '').toUpperCase().trim();
    const room = privateRooms.get(code);
    if (!room || room.players[0].ws.readyState !== 1) {
      if (room) privateRooms.delete(code);
      game.send(ws, { type: 'room_not_found' });
      return true;
    }
    if (room.players.some((p) => p.id === playerId)) { game.send(ws, { type: 'room_not_found' }); return true; }
    if (room.players.length >= MAX_ROOM_PLAYERS) { game.send(ws, { type: 'room_full' }); return true; }
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F981}';
    room.players.push({ ws, id: playerId, clientId: state.clientId, name: state.name, avatar });
    broadcastRoomUpdate(room);
    return true;
  }

  if (data.type === 'start_room') {
    const code = String(data.code || '').toUpperCase().trim();
    const room = privateRooms.get(code);
    if (!room || room.players[0].id !== playerId) return true;
    if (room.players.length < 2 || room.players.length > MAX_ROOM_PLAYERS) return true;
    if (room.players.some((p) => isBusy(p.id))) {
      room.players.forEach((p) => game.send(p.ws, { type: 'already_playing' }));
      return true;
    }
    privateRooms.delete(code);
    openRoomByPlayer.delete(playerId);
    startGameGuarded(room.players, room.categoryKey);
    return true;
  }

  if (data.type === 'report') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.currentRound >= 0) {
      const key = `${state.clientId}:${g.currentRound}`;
      if (!g.reported.has(key)) {
        g.reported.add(key);
        const q = g.questions[g.currentRound];
        if (q) reports.report(questionKey(q));
        game.send(ws, { type: 'report_ack' });
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
  const state = {
    playerId: game.rid('player_'),
    name: 'Player' + Math.floor(1000 + Math.random() * 9000),
    clientId: null,
    avatar: '\u{1F43A}',
  };

  game.send(ws, { type: 'session', playerId: state.playerId });

  ws.on('message', async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (!data || typeof data.type !== 'string') return;
    if (!limiter.check(state.playerId) || !ipLimiter.check(ip)) return;

    if (data.type === 'identify') {
      await handleIdentify(ws, data, state);
      return;
    }
    if (handleSocial(ws, data, state)) return;
    if (handleFeed(ws, data, state)) return;
    handleGameplay(ws, data, state);
  });

  ws.on('close', () => {
    limiter.remove(state.playerId);
    if (state.clientId) {
      social.setOffline(state.clientId, ws);
      notifyPresence(state.clientId, false);
    }

    const wi = waitingPlayers.findIndex((w) => w.id === state.playerId);
    if (wi !== -1) waitingPlayers.splice(wi, 1);

    for (const [code, room] of privateRooms) {
      const idx = room.players.findIndex((p) => p.id === state.playerId);
      if (idx === -1) continue;
      if (idx === 0) {
        privateRooms.delete(code);
        openRoomByPlayer.delete(state.playerId);
        room.players.forEach((p) => {
          if (p.id !== state.playerId) game.send(p.ws, { type: 'room_closed' });
        });
      } else {
        room.players.splice(idx, 1);
        broadcastRoomUpdate(room);
      }
    }

    const gameId = game.playerSessions.get(state.playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active') game.disconnectPlayer(g, state.playerId);
  });
});

app.get('/health', (req, res) =>
  res.json({ status: 'ok', activeGames: game.activeGames.size, waiting: waitingPlayers.length })
);
app.get('/categories', (req, res) => res.json(listCategories()));
app.get('/reports/stats', (req, res) => res.json(reports.stats()));

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of privateRooms) {
    if (now - room.createdAt > ROOM_TTL_MS || room.players[0].ws.readyState !== 1) {
      privateRooms.delete(code);
      openRoomByPlayer.delete(room.players[0].id);
    }
  }
  limiter.sweep();
  ipLimiter.sweep();
  sweepCache();
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`\u{1F3AE} QuizzUp backend on http://localhost:${PORT}`);
  warmCache();
});
