require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const { listCategories, warmCache } = require('./questions');
const reports = require('./reports');
const social = require('./social');
const game = require('./game');
const RateLimiter = require('./rate-limit');
const { verifyIdToken, sweepCache } = require('./auth');
const { ROOM_TTL_MS, CODE_ALPHABET } = require('./config');

const app = express();
const server = http.createServer(app);
// maxPayload caps a single WebSocket frame (ws defaults to 100MiB, which lets
// one client force multi-MB JSON.parse calls on the server for free).
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- State shared across handlers ----------------------------------------
const waitingPlayers = [];
const privateRooms = new Map();
// Two limiters: per-connection (playerId resets on reconnect, so it alone is
// trivially bypassed) and per-IP (survives reconnects, catches the abuse
// case reconnecting is meant to dodge).
const limiter = new RateLimiter();
const ipLimiter = new RateLimiter(2000, 40);

function newRoomCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () =>
      CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  } while (privateRooms.has(code));
  return code;
}

// --- Social helpers -------------------------------------------------------
function notifyPresence(clientId, isOnline) {
  social.getFriendsList(clientId).forEach((f) => {
    const fws = social.getWs(f.id);
    if (fws) game.send(fws, { type: 'presence', id: clientId, online: isOnline });
  });
}

// --- WebSocket handlers ---------------------------------------------------
// clientId is never trusted from the client directly — a raw client-supplied
// id would let anyone identify as anyone else (hijacking their presence,
// friend requests, and DMs; the game even hands opponents each other's id
// in game_start). It is only ever set here, from a Firebase ID token this
// server verifies itself, so a client can never forge someone else's uid.
async function handleIdentify(ws, data, state) {
  if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
  const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';

  const uid = await verifyIdToken(data.idToken);
  if (!uid) return; // unverifiable — proceed without social features rather than trusting the claim

  state.clientId = uid;
  social.setOnline(state.clientId, ws, state.name, avatar);
  game.send(ws, { type: 'friends_list', friends: social.getFriendsList(state.clientId) });
  game.send(ws, { type: 'friend_requests', requests: social.getPendingRequests(state.clientId) });
  notifyPresence(state.clientId, true);
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
    if (clientId && fromId) {
      social.acceptRequest(clientId, fromId);
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
    if (clientId && targetId) {
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

function handleGameplay(ws, data, state) {
  const { playerId } = state;

  if (data.type === 'game_chat') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    const text = typeof data.text === 'string' ? data.text.trim().slice(0, 200) : '';
    if (g && g.status === 'active' && text) {
      const opponent = g.players.find((p) => p.id !== playerId);
      if (opponent) game.send(opponent.ws, { type: 'game_chat', text });
    }
    return true;
  }

  if (data.type === 'join') {
    if (game.playerSessions.has(playerId)) return true;
    if (waitingPlayers.some((w) => w.id === playerId)) return true;
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    game.send(ws, { type: 'joined', playerId, name: state.name });
    const oppIdx = waitingPlayers.findIndex(
      (w) => w.categoryKey === categoryKey && w.ws.readyState === 1
    );
    if (oppIdx !== -1) {
      const opp = waitingPlayers.splice(oppIdx, 1)[0];
      game.startGame(opp, { ws, id: playerId, clientId: state.clientId, name: state.name, avatar }, categoryKey)
        .catch(() => { game.send(opp.ws, { type: 'error' }); game.send(ws, { type: 'error' }); });
    } else {
      waitingPlayers.push({ ws, id: playerId, clientId: state.clientId, name: state.name, avatar, categoryKey });
      game.send(ws, { type: 'waiting' });
    }
    return true;
  }

  if (data.type === 'answer') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active' && Number.isInteger(data.answerIndex)
        && data.answerIndex >= 0 && data.answerIndex <= 3) {
      game.recordAnswer(g, playerId, data.answerIndex);
    }
    return true;
  }

  if (data.type === 'create_room') {
    if (game.playerSessions.has(playerId)) return true;
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F43A}';
    const categoryKey = typeof data.category === 'string' ? data.category : null;
    const code = newRoomCode();
    privateRooms.set(code, {
      host: { ws, id: playerId, clientId: state.clientId, name: state.name, avatar },
      categoryKey, createdAt: Date.now(),
    });
    game.send(ws, { type: 'room_created', code });
    return true;
  }

  if (data.type === 'join_room') {
    const code = String(data.code || '').toUpperCase().trim();
    const room = privateRooms.get(code);
    if (!room || room.host.ws.readyState !== 1) {
      if (room) privateRooms.delete(code);
      game.send(ws, { type: 'room_not_found' });
      return true;
    }
    if (room.host.id === playerId) { game.send(ws, { type: 'room_not_found' }); return true; }
    privateRooms.delete(code);
    if (typeof data.name === 'string' && data.name.trim()) state.name = data.name.trim().slice(0, 20);
    const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '\u{1F981}';
    game.startGame(room.host, { ws, id: playerId, clientId: state.clientId, name: state.name, avatar }, room.categoryKey)
      .catch(() => { game.send(room.host.ws, { type: 'error' }); game.send(ws, { type: 'error' }); });
    return true;
  }

  if (data.type === 'report') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.currentRound >= 0) {
      const key = `${playerId}:${g.currentRound}`;
      if (!g.reported.has(key)) {
        g.reported.add(key);
        const q = g.questions[g.currentRound];
        if (q) reports.report(q.text);
        game.send(ws, { type: 'report_ack' });
      }
    }
    return true;
  }

  if (data.type === 'leave') {
    const gameId = game.playerSessions.get(playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g) game.endGame(g, 'opponent_left');
    return true;
  }

  return false;
}

// --- WebSocket connection -------------------------------------------------
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || 'unknown';
  const state = {
    playerId: game.rid('player_'),
    name: 'Player' + Math.floor(1000 + Math.random() * 9000),
    clientId: null,
  };

  ws.on('message', async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (!data || typeof data.type !== 'string') return;

    // Rate-limit: per-connection AND per-IP, so reconnecting with a fresh
    // playerId can't reset the limit (the per-connection bucket alone can).
    if (!limiter.check(state.playerId) || !ipLimiter.check(ip)) return;

    if (data.type === 'identify') { await handleIdentify(ws, data, state); return; }
    if (handleSocial(ws, data, state)) return;
    handleGameplay(ws, data, state);
  });

  ws.on('close', () => {
    limiter.remove(state.playerId);
    if (state.clientId) {
      social.setOffline(state.clientId);
      notifyPresence(state.clientId, false);
    }
    const wi = waitingPlayers.findIndex((w) => w.id === state.playerId);
    if (wi !== -1) waitingPlayers.splice(wi, 1);

    for (const [code, room] of privateRooms) {
      if (room.host.id === state.playerId) privateRooms.delete(code);
    }

    const gameId = game.playerSessions.get(state.playerId);
    const g = gameId && game.activeGames.get(gameId);
    if (g && g.status === 'active') game.endGame(g, 'opponent_disconnected');
  });
});

// --- HTTP -----------------------------------------------------------------
app.get('/health', (req, res) =>
  res.json({ status: 'ok', activeGames: game.activeGames.size, waiting: waitingPlayers.length })
);
app.get('/categories', (req, res) => res.json(listCategories()));
app.get('/reports/stats', (req, res) => res.json(reports.stats()));

// Sweep expired private rooms + stale rate-limit buckets + verified-token cache.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of privateRooms) {
    if (now - room.createdAt > ROOM_TTL_MS || room.host.ws.readyState !== 1) {
      privateRooms.delete(code);
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
