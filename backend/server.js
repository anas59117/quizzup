const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const { getMixedQuestions, warmCache, listCategories } = require('./questions');
const reports = require('./reports');
const social = require('./social');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- Game state -----------------------------------------------------------
const waitingPlayers = []; // players looking for a match, per category key
const activeGames = new Map(); // gameId -> game
const playerSessions = new Map(); // playerId -> gameId
const privateRooms = new Map(); // code -> { host, categoryKey, createdAt }

const ROOM_TTL_MS = 10 * 60 * 1000; // private rooms expire after 10 min

// Room codes: unambiguous alphabet (no O/0, I/1) so they're easy to share.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newRoomCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  } while (privateRooms.has(code));
  return code;
}

const GAME_CONFIG = {
  ROUNDS: 6,
  TIME_PER_QUESTION: 10, // seconds
  BASE_POINTS: 20, // max points for an instant correct answer
  MIN_POINTS: 5, // floor for a correct-but-slow answer
  BONUS_MULTIPLIER: 2, // final round is worth double
  INTRO_MS: 1600, // "Round X — Get ready!" build-up before each question
};

const rid = (p) => p + Math.random().toString(36).slice(2, 11);
const send = (ws, obj) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
};

// Speed-based score: fast correct answers earn more. The server owns the
// clock, so the client cannot fake its answer time — anti-cheat by design.
function scoreAnswer(elapsedMs, isFinalRound) {
  const t = GAME_CONFIG.TIME_PER_QUESTION * 1000;
  const frac = Math.max(0, Math.min(1, 1 - elapsedMs / t));
  const range = GAME_CONFIG.BASE_POINTS - GAME_CONFIG.MIN_POINTS;
  let pts = Math.round(GAME_CONFIG.MIN_POINTS + range * frac);
  if (isFinalRound) pts *= GAME_CONFIG.BONUS_MULTIPLIER;
  return pts;
}

// --- Game lifecycle -------------------------------------------------------
function pickRandomCategory() {
  const cats = listCategories();
  return cats.length ? cats[Math.floor(Math.random() * cats.length)].key : null;
}

async function startGame(p1, p2, categoryKey) {
  const gameId = rid('game_');
  // Quick match / private room with no chosen category: pick one at random so
  // both players share it and the API question pool is used (not just local).
  const resolvedCategory = categoryKey || pickRandomCategory();
  const questions = await getMixedQuestions(GAME_CONFIG.ROUNDS, resolvedCategory);
  const game = {
    id: gameId,
    players: [p1, p2].map((p) => ({
      ws: p.ws, id: p.id, clientId: p.clientId || null, name: p.name, avatar: p.avatar || '🐺',
      score: 0, connected: true,
    })),
    questions,
    currentRound: -1,
    questionStart: 0,
    roundAnswers: {}, // playerId -> { answerIndex, correct, elapsedMs, points }
    reported: new Set(), // `${playerId}:${round}` — one report per player per question
    roundTimer: null,
    status: 'active',
  };
  activeGames.set(gameId, game);
  game.players.forEach((p) => playerSessions.set(p.id, gameId));

  game.players.forEach((p, idx) => {
    send(p.ws, {
      type: 'game_start',
      gameId,
      you: { name: p.name, avatar: p.avatar },
      opponent: {
        name: game.players[1 - idx].name,
        avatar: game.players[1 - idx].avatar,
        clientId: game.players[1 - idx].clientId,
      },
      totalRounds: game.questions.length,
    });
  });

  nextQuestion(game);
}

function nextQuestion(game) {
  if (game.roundTimer) clearTimeout(game.roundTimer);
  const nextRound = game.currentRound + 1;
  if (nextRound >= game.questions.length) return endGame(game);

  game.currentRound = nextRound;
  game.roundAnswers = {};
  const q = game.questions[nextRound];
  const isFinal = nextRound === game.questions.length - 1;

  // Phase 1 — "Round X, get ready!" build-up, synced to both players. The
  // clock does NOT run yet, so the intro never eats into answer time.
  game.players.forEach((p) => {
    send(p.ws, {
      type: 'round_intro',
      round: nextRound + 1,
      totalRounds: game.questions.length,
      category: q.category,
      icon: q.icon,
      isBonus: isFinal,
    });
  });

  // Phase 2 — after the intro, deliver the question and start the clock.
  game.roundTimer = setTimeout(() => {
    if (game.status !== 'active') return;
    game.questionStart = Date.now();
    game.players.forEach((p) => {
      send(p.ws, {
        type: 'question',
        round: nextRound + 1,
        totalRounds: game.questions.length,
        question: q.text,
        category: q.category,
        icon: q.icon,
        answers: q.answers,
        timeLimit: GAME_CONFIG.TIME_PER_QUESTION,
        isBonus: isFinal,
      });
    });
    // Server-authoritative timeout: reveal once time is up even if nobody
    // (or only one player) answered. +500ms grace for network latency.
    game.roundTimer = setTimeout(
      () => revealRound(game, true),
      GAME_CONFIG.TIME_PER_QUESTION * 1000 + 500
    );
  }, GAME_CONFIG.INTRO_MS);
}

function revealRound(game, timedOut) {
  if (game.status !== 'active') return;
  if (game.roundTimer) clearTimeout(game.roundTimer);
  const q = game.questions[game.currentRound];

  game.players.forEach((p, idx) => {
    const mine = game.roundAnswers[p.id];
    const theirs = game.roundAnswers[game.players[1 - idx].id];
    send(p.ws, {
      type: 'round_result',
      round: game.currentRound + 1,
      correctIndex: q.correct,
      yourAnswer: mine ? mine.answerIndex : null,
      yourCorrect: mine ? mine.correct : false,
      pointsEarned: mine ? mine.points : 0,
      yourScore: p.score,
      opponentAnswer: theirs ? theirs.answerIndex : null,
      opponentCorrect: theirs ? theirs.correct : false,
      opponentScore: game.players[1 - idx].score,
      timedOut: !!timedOut,
    });
  });

  // Brief pause so players see the reveal, then advance.
  setTimeout(() => {
    if (game.status === 'active') nextQuestion(game);
  }, 2500);
}

function recordAnswer(game, playerId, answerIndex) {
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  // Anti-cheat: one answer per round (ignore double-submits).
  if (game.roundAnswers[playerId]) return;

  const elapsedMs = Date.now() - game.questionStart;
  // Anti-cheat: reject answers that arrive after the server's window.
  if (elapsedMs > GAME_CONFIG.TIME_PER_QUESTION * 1000 + 500) return;

  const q = game.questions[game.currentRound];
  const isCorrect = answerIndex === q.correct;
  const isFinal = game.currentRound === game.questions.length - 1;
  const points = isCorrect ? scoreAnswer(elapsedMs, isFinal) : 0;
  if (isCorrect) game.players[idx].score += points;

  game.roundAnswers[playerId] = { answerIndex, correct: isCorrect, elapsedMs, points };

  // Both answered → reveal immediately instead of waiting out the clock.
  const bothAnswered = game.players.every((p) => game.roundAnswers[p.id]);
  if (bothAnswered) revealRound(game, false);
}

function endGame(game, reason) {
  if (game.status === 'finished') return;
  game.status = 'finished';
  if (game.roundTimer) clearTimeout(game.roundTimer);

  const [a, b] = game.players;
  const winnerIdx = a.score > b.score ? 0 : b.score > a.score ? 1 : -1;
  const board = game.players
    .map((p) => ({ name: p.name, avatar: p.avatar, score: p.score }))
    .sort((x, y) => y.score - x.score);

  game.players.forEach((p, idx) => {
    send(p.ws, {
      type: 'game_end',
      finalScore: p.score,
      opponentScore: game.players[1 - idx].score,
      won: winnerIdx === idx,
      tie: winnerIdx === -1,
      leaderboard: board,
      reason: reason || 'complete',
      coins: winnerIdx === idx ? 50 : 20,
      xp: 40 + p.score,
    });
  });

  setTimeout(() => {
    game.players.forEach((p) => playerSessions.delete(p.id));
    activeGames.delete(game.id);
  }, 5000);
}

// --- Social (friends & presence) ------------------------------------------
function notifyPresence(clientId, isOnline) {
  social.getFriendsList(clientId).forEach((f) => {
    const fws = social.getWs(f.id);
    if (fws) send(fws, { type: 'presence', id: clientId, online: isOnline });
  });
}

// --- WebSocket ------------------------------------------------------------
wss.on('connection', (ws) => {
  const playerId = rid('player_');
  let name = 'Player' + Math.floor(1000 + Math.random() * 9000);
  let clientId = null;

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return; // ignore malformed input at the boundary
    }
    if (!data || typeof data.type !== 'string') return;

    if (typeof data.clientId === 'string' && data.clientId) clientId = data.clientId.slice(0, 64);

    if (data.type === 'identify') {
      if (typeof data.name === 'string' && data.name.trim()) name = data.name.trim().slice(0, 20);
      const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '🐺';
      if (clientId) {
        social.setOnline(clientId, ws, name, avatar);
        send(ws, { type: 'friends_list', friends: social.getFriendsList(clientId) });
        send(ws, { type: 'friend_requests', requests: social.getPendingRequests(clientId) });
        notifyPresence(clientId, true);
      }
    }

    if (data.type === 'friend_request') {
      const targetId = String(data.targetId || '');
      if (clientId && targetId) {
        const result = social.sendRequest(clientId, targetId);
        const me = result.ok && social.profileOf(clientId);
        const targetWs = result.ok && social.getWs(targetId);
        if (targetWs && me) send(targetWs, { type: 'friend_request_received', from: me });
      }
    }

    if (data.type === 'friend_accept') {
      const fromId = String(data.requesterId || '');
      if (clientId && fromId) {
        social.acceptRequest(clientId, fromId);
        const them = social.profileOf(fromId);
        const me = social.profileOf(clientId);
        if (them) send(ws, { type: 'friend_added', friend: them });
        const fromWs = social.getWs(fromId);
        if (fromWs && me) send(fromWs, { type: 'friend_added', friend: me });
      }
    }

    if (data.type === 'friend_decline') {
      const fromId = String(data.requesterId || '');
      if (clientId && fromId) social.declineRequest(clientId, fromId);
    }

    if (data.type === 'friend_remove') {
      const targetId = String(data.targetId || '');
      if (clientId && targetId) {
        social.removeFriend(clientId, targetId);
        send(ws, { type: 'friend_removed', id: targetId });
        const targetWs = social.getWs(targetId);
        if (targetWs) send(targetWs, { type: 'friend_removed', id: clientId });
      }
    }

    if (data.type === 'dm') {
      const targetId = String(data.targetId || '');
      const text = typeof data.text === 'string' ? data.text.trim().slice(0, 300) : '';
      if (clientId && targetId && text && social.areFriends(clientId, targetId)) {
        const targetWs = social.getWs(targetId);
        if (targetWs) send(targetWs, { type: 'dm', from: clientId, text });
      }
    }

    if (data.type === 'game_chat') {
      const gameId = playerSessions.get(playerId);
      const game = gameId && activeGames.get(gameId);
      const text = typeof data.text === 'string' ? data.text.trim().slice(0, 200) : '';
      if (game && game.status === 'active' && text) {
        const opponent = game.players.find((p) => p.id !== playerId);
        if (opponent) send(opponent.ws, { type: 'game_chat', text });
      }
    }

    if (data.type === 'join') {
      // Prevent joining while already in a game or already waiting.
      if (playerSessions.has(playerId)) return;
      const alreadyWaiting = waitingPlayers.some((w) => w.id === playerId);
      if (alreadyWaiting) return;

      if (typeof data.name === 'string' && data.name.trim()) {
        name = data.name.trim().slice(0, 20);
      }
      const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '🐺';
      const categoryKey = typeof data.category === 'string' ? data.category : null;
      send(ws, { type: 'joined', playerId, name });

      // Match with someone waiting for the same category (or any).
      const oppIdx = waitingPlayers.findIndex(
        (w) => w.categoryKey === categoryKey && w.ws.readyState === 1
      );
      if (oppIdx !== -1) {
        const opp = waitingPlayers.splice(oppIdx, 1)[0];
        startGame(opp, { ws, id: playerId, clientId, name, avatar }, categoryKey).catch((err) => {
          console.error('startGame failed:', err);
          send(opp.ws, { type: 'error' });
          send(ws, { type: 'error' });
        });
      } else {
        waitingPlayers.push({ ws, id: playerId, clientId, name, avatar, categoryKey });
        send(ws, { type: 'waiting' });
      }
    }

    if (data.type === 'answer') {
      const gameId = playerSessions.get(playerId);
      const game = gameId && activeGames.get(gameId);
      if (game && game.status === 'active' && Number.isInteger(data.answerIndex)
          && data.answerIndex >= 0 && data.answerIndex <= 3) {
        recordAnswer(game, playerId, data.answerIndex);
      }
    }

    if (data.type === 'create_room') {
      if (playerSessions.has(playerId)) return;
      if (typeof data.name === 'string' && data.name.trim()) name = data.name.trim().slice(0, 20);
      const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '🐺';
      const categoryKey = typeof data.category === 'string' ? data.category : null;
      const code = newRoomCode();
      privateRooms.set(code, {
        host: { ws, id: playerId, clientId, name, avatar },
        categoryKey,
        createdAt: Date.now(),
      });
      send(ws, { type: 'room_created', code });
    }

    if (data.type === 'join_room') {
      const code = String(data.code || '').toUpperCase().trim();
      const room = privateRooms.get(code);
      if (!room || room.host.ws.readyState !== 1) {
        if (room) privateRooms.delete(code); // host already gone
        send(ws, { type: 'room_not_found' });
        return;
      }
      if (room.host.id === playerId) {
        send(ws, { type: 'room_not_found' }); // can't join your own room
        return;
      }
      privateRooms.delete(code);
      if (typeof data.name === 'string' && data.name.trim()) name = data.name.trim().slice(0, 20);
      const avatar = typeof data.avatar === 'string' ? data.avatar.slice(0, 4) : '🦁';
      startGame(room.host, { ws, id: playerId, clientId, name, avatar }, room.categoryKey).catch((err) => {
        console.error('startGame (room) failed:', err);
        send(room.host.ws, { type: 'error' });
        send(ws, { type: 'error' });
      });
    }

    if (data.type === 'report') {
      const gameId = playerSessions.get(playerId);
      const game = gameId && activeGames.get(gameId);
      if (game && game.currentRound >= 0) {
        const key = `${playerId}:${game.currentRound}`;
        if (!game.reported.has(key)) {
          game.reported.add(key);
          // Use the server's own current question text (not client-supplied)
          // so a report always targets the real question.
          const q = game.questions[game.currentRound];
          if (q) reports.report(q.text);
          send(ws, { type: 'report_ack' });
        }
      }
    }

    if (data.type === 'leave') {
      const gameId = playerSessions.get(playerId);
      const game = gameId && activeGames.get(gameId);
      if (game) endGame(game, 'opponent_left');
    }
  });

  ws.on('close', () => {
    if (clientId) {
      social.setOffline(clientId);
      notifyPresence(clientId, false);
    }
    const wi = waitingPlayers.findIndex((w) => w.id === playerId);
    if (wi !== -1) waitingPlayers.splice(wi, 1);

    // Drop any private room this player was hosting.
    for (const [code, room] of privateRooms) {
      if (room.host.id === playerId) privateRooms.delete(code);
    }

    const gameId = playerSessions.get(playerId);
    const game = gameId && activeGames.get(gameId);
    if (game && game.status === 'active') {
      // Opponent forfeits: end the game so the other player isn't stuck.
      endGame(game, 'opponent_disconnected');
    }
  });
});

// --- HTTP -----------------------------------------------------------------
app.get('/health', (req, res) =>
  res.json({ status: 'ok', activeGames: activeGames.size, waiting: waitingPlayers.length })
);
app.get('/categories', (req, res) => res.json(listCategories()));
app.get('/reports/stats', (req, res) => res.json(reports.stats()));

// Sweep expired private rooms so abandoned codes don't pile up.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of privateRooms) {
    if (now - room.createdAt > ROOM_TTL_MS || room.host.ws.readyState !== 1) {
      privateRooms.delete(code);
    }
  }
}, 60 * 1000);

server.listen(PORT, () => {
  console.log(`🎮 QuizzUp backend on http://localhost:${PORT}`);
  warmCache(); // best-effort prefetch of Open Trivia DB questions
});
