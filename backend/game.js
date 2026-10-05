// Game lifecycle: creation, rounds, scoring, and end-game. Supports 2-4
// players uniformly (quick match always pairs exactly 2; private rooms can
// gather up to 4 before the host starts). Pure game logic, separated from
// transport so it can be tested independently.

const { performance } = require('node:perf_hooks');
const { getMixedQuestions, listCategories } = require('./questions');
const { GAME_CONFIG } = require('./config');
const stats = require('./stats');
const categoryStats = require('./category-stats');
const topicStats = require('./topic-stats');
const { randomId } = require('./ids');

// Optional hook (set by server.js) told when a player gains XP in a theme,
// so friends they overtake can be notified.
let topicProgressListener = null;
function setTopicProgressListener(fn) {
  topicProgressListener = typeof fn === 'function' ? fn : null;
}

const activeGames = new Map();
const playerSessions = new Map();
const startingClients = new Set();

const RECONNECT_GRACE_MS = 15000;
const FINISHED_RETENTION_MS = 60 * 1000;
const rid = (prefix) => randomId(prefix);
const send = (ws, obj) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
};

function pickRandomCategory() {
  const cats = listCategories();
  return cats.length ? cats[Math.floor(Math.random() * cats.length)].key : null;
}

// Long questions get a few extra seconds so players have time to read them.
function timeLimitFor(question) {
  const len = question && typeof question.text === 'string' ? question.text.length : 0;
  if (len > 150) return GAME_CONFIG.TIME_PER_QUESTION + 5;
  if (len > 100) return GAME_CONFIG.TIME_PER_QUESTION + 3;
  return GAME_CONFIG.TIME_PER_QUESTION;
}

function scoreAnswer(elapsedMs, isFinalRound, timeLimitSec = GAME_CONFIG.TIME_PER_QUESTION) {
  const t = timeLimitSec * 1000;
  const frac = Math.max(0, Math.min(1, 1 - elapsedMs / t));
  const range = GAME_CONFIG.BASE_POINTS - GAME_CONFIG.MIN_POINTS;
  let pts = Math.round(GAME_CONFIG.MIN_POINTS + range * frac);
  if (isFinalRound) pts *= GAME_CONFIG.BONUS_MULTIPLIER;
  return pts;
}

function othersOf(game, selfId, mapper) {
  return game.players.filter((p) => p.id !== selfId).map(mapper);
}

function activePlayers(game) {
  return game.players.filter((p) => p.connected && p.ws && p.ws.readyState === 1);
}

function allPlayersAnswered(game) {
  // A temporarily disconnected player still belongs to the round. Do not
  // fast-forward just because only the connected players have answered;
  // that would make a short reconnect skip questions. Removal after the
  // grace period shrinks game.players and then this condition can pass.
  return game.players.length > 0 && game.players.every((p) => game.roundAnswers[p.id]);
}

// A bot fills in when nobody else is in the queue. It looks like an ordinary
// guest player (same name pattern and avatars as the client), never has a
// clientId and is skipped by every stats/progress path.
const BOT_FRAMES = ['bronze', 'bronze', 'argent', 'argent', 'or', 'neon'];
const BOT_AVATARS = ['\u{1F43A}', '\u{1F981}', '\u{1F98A}', '\u{1F43C}', '\u{1F989}', '\u{1F438}', '\u{1F42F}', '\u{1F984}'];
// Average success rate per difficulty; each bot gets a skill offset so some
// opponents are weaker and some stronger, like real players.
const BOT_ACCURACY = { easy: 0.8, medium: 0.65, hard: 0.5, expert: 0.35 };
const BOT_PROFILES = [
  { weight: 0.3, skill: -0.15, speed: 1.25 }, // casual player
  { weight: 0.5, skill: 0, speed: 1 }, // regular player
  { weight: 0.2, skill: 0.12, speed: 0.8 }, // strong player
];
// Like a person, a bot sometimes lets the timer run out.
const BOT_NO_ANSWER_RATE = 0.05;

// Pseudo pieces in the style of real French players (krimo, juju75, aubam88).
const PSEUDO_BASES = [
  'krimo', 'juju', 'aubam', 'nono', 'yanis', 'rayan', 'mehdi', 'sofiane', 'ilyes', 'sami',
  'kenzo', 'enzo', 'lucas', 'theo', 'hugo', 'noah', 'nathan', 'adam', 'ryan', 'bilal',
  'lea', 'ines', 'jade', 'manon', 'sarah', 'nina', 'lina', 'emma', 'chloe', 'yasmine',
  'maxou', 'titi', 'loulou', 'clem', 'lulu', 'momo', 'dodo', 'fafa', 'zizou', 'kiki',
  'mika', 'tom', 'alex', 'nico', 'seb', 'kev', 'jojo', 'bebou', 'ptitlu', 'bastos',
  'sniper', 'shadow', 'ghost', 'kaiser', 'neo', 'zed', 'flash', 'tiger', 'wolf', 'panda',
];
const PSEUDO_SUFFIXES = [
  '75', '93', '13', '69', '59', '94', '92', '77', '31', '06', '33', '34', '67', '44',
  '88', '99', '98', '01', '02', '03', '04', '05', '07', '10', '12', '22', '2k4', '2k6',
  '_off', '_tv', '_pro', 'du93', 'du13', 'x', '_', '7', '9',
];

function botPseudo(random) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  const base = pick(PSEUDO_BASES);
  const roll = random();
  let name;
  if (roll < 0.15) name = base; // plain "krimo"
  else if (roll < 0.25) name = base + pick(PSEUDO_BASES).slice(0, 3); // "jujumeh"
  else name = base + pick(PSEUDO_SUFFIXES); // "juju75", "aubam88"
  if (random() < 0.12) name = name.charAt(0).toUpperCase() + name.slice(1);
  return name;
}

function pickProfile(random) {
  let r = random();
  for (const profile of BOT_PROFILES) {
    if (r < profile.weight) return profile;
    r -= profile.weight;
  }
  return BOT_PROFILES[1];
}

function createBot(random = Math.random) {
  const profile = pickProfile(random);
  return {
    ws: null, id: rid('player_'), clientId: null,
    name: botPseudo(random),
    avatar: BOT_AVATARS[Math.floor(random() * BOT_AVATARS.length)],
    // Some real players wear a shop frame, so some bots do too.
    frame: random() < 0.3 ? BOT_FRAMES[Math.floor(random() * BOT_FRAMES.length)] : 'none',
    score: 0, connected: true, reconnectTimer: null, isBot: true,
    skill: profile.skill, speed: profile.speed,
  };
}

function clearBotTimers(game) {
  (game.botTimers || []).forEach((t) => clearTimeout(t));
  game.botTimers = [];
}

function scheduleBotAnswers(game, random = Math.random) {
  clearBotTimers(game);
  const q = game.questions[game.currentRound];
  if (!q) return;
  const round = game.currentRound;
  const limitMs = (game.timeLimit || GAME_CONFIG.TIME_PER_QUESTION) * 1000;
  game.players.filter((p) => p.isBot).forEach((bot) => {
    if (random() < BOT_NO_ANSWER_RATE) return;
    const base = BOT_ACCURACY[q.difficulty] ?? 0.6;
    const accuracy = Math.max(0.15, Math.min(0.95, base + (bot.skill || 0)));
    const correct = random() < accuracy;
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.correct);
    const answerIndex = correct ? q.correct : wrong[Math.floor(random() * wrong.length)];
    // Human-like timing: time to read the question, then think. Sure answers
    // come faster, doubtful (often wrong) ones later.
    const readMs = Math.min(4000, 900 + (q.text ? q.text.length : 60) * 18);
    const thinkMs = (correct ? 600 + random() * 2600 : 1500 + random() * 4000) * (bot.speed || 1);
    const delay = Math.round(Math.min(limitMs - 400, readMs + thinkMs));
    game.botTimers.push(setTimeout(() => {
      if (game.status !== 'active' || game.phase !== 'question' || game.currentRound !== round) return;
      recordAnswer(game, bot.id, answerIndex);
    }, delay));
  });
}

async function startGame(rawPlayers, categoryKey, { withBot = false } = {}) {
  if (!rawPlayers.length) throw new Error('NO_PLAYERS');

  // Gameplay and persistent progression require a verified identity.
  if (rawPlayers.some((p) => !p.clientId)) throw new Error('AUTH_REQUIRED');

  // Reject the same verified account twice in the batch itself (possible in
  // a private room before either socket has entered an active game).
  const clientIds = rawPlayers.map((p) => p.clientId);
  if (new Set(clientIds).size !== clientIds.length) throw new Error('CLIENT_ALREADY_PLAYING');

  // A verified QuizzUp identity may only own one active or starting game.
  const duplicate = rawPlayers.find((p) => findActiveSessionByClientId(p.clientId));
  if (duplicate || clientIds.some((id) => startingClients.has(id))) {
    throw new Error('CLIENT_ALREADY_PLAYING');
  }

  clientIds.forEach((id) => startingClients.add(id));
  try {
    const gameId = rid('game_');
    const resolvedCategory = categoryKey || pickRandomCategory();
    const questions = await getMixedQuestions(GAME_CONFIG.ROUNDS, resolvedCategory);

    // Re-check after the await as a defensive invariant in case another code
    // path created a session while questions were loading.
    const becameBusy = rawPlayers.find((p) => findActiveSessionByClientId(p.clientId));
    if (becameBusy) throw new Error('CLIENT_ALREADY_PLAYING');

    const stillOpen = rawPlayers.filter((p) => p.ws.readyState === 1);
    if (stillOpen.length !== rawPlayers.length) {
      // The match never became active, so this is not a fatal game error for
      // the players whose sockets are still healthy. Let them return to the
      // lobby/home and queue again instead of throwing the whole app onto the
      // connection-error screen.
      stillOpen.forEach((p) => send(p.ws, {
        type: 'match_aborted',
        code: 'PLAYER_DISCONNECTED_BEFORE_START',
      }));
      return;
    }

    const game = {
      id: gameId,
      players: [
        ...rawPlayers.map((p) => ({
          ws: p.ws, id: p.id, clientId: p.clientId,
          name: p.name, avatar: p.avatar || '\u{1F43A}',
          frame: stats.getFrame(p.clientId),
          score: 0, connected: true, reconnectTimer: null,
        })),
        ...(withBot ? [createBot()] : []),
      ],
      questions,
      currentRound: -1,
      questionStart: 0,
      roundAnswers: {},
      reported: new Set(),
      roundTimer: null,
      phase: 'idle',
      status: 'active',
      mode: withBot ? 'bot' : rawPlayers.length === 1 ? 'solo' : 'multiplayer',
      botTimers: [],
      categoryKey: resolvedCategory,
      rematchRequests: new Set(),
    };
    activeGames.set(gameId, game);
    try {
      categoryStats.recordStart(resolvedCategory, { players: game.players.length, chosen: !!categoryKey });
    } catch (err) {
      console.error('category-stats recordStart failed:', err);
    }
    game.players.filter((p) => !p.isBot).forEach((p) => playerSessions.set(p.id, gameId));

    game.players.filter((p) => !p.isBot).forEach((p) => {
      send(p.ws, {
        type: 'game_start', gameId,
        you: { name: p.name, avatar: p.avatar, frame: p.frame },
        opponents: othersOf(game, p.id, (o) => ({ id: o.id, name: o.name, avatar: o.avatar, frame: o.frame, clientId: o.clientId })),
        totalRounds: game.questions.length,
      });
    });

    nextQuestion(game);
  } finally {
    clientIds.forEach((id) => startingClients.delete(id));
  }
}

// Photos of this round and the next one, sent with the round intro so the
// browser downloads them before the question appears.
function upcomingImages(game, round) {
  return [game.questions[round], game.questions[round + 1]]
    .map((q) => (q && q.image) || null)
    .filter(Boolean);
}

function nextQuestion(game) {
  if (game.status !== 'active') return;
  if (game.roundTimer) clearTimeout(game.roundTimer);
  const nextRound = game.currentRound + 1;
  if (nextRound >= game.questions.length) return endGame(game);

  game.currentRound = nextRound;
  game.roundAnswers = {};
  game.phase = 'intro';
  const q = game.questions[nextRound];
  const isFinal = nextRound === game.questions.length - 1;

  activePlayers(game).forEach((p) => {
    send(p.ws, {
      type: 'round_intro', round: nextRound + 1,
      totalRounds: game.questions.length,
      category: q.category, icon: q.icon, difficulty: q.difficulty, isBonus: isFinal,
      preloadImages: upcomingImages(game, nextRound),
    });
  });

  game.roundTimer = setTimeout(() => {
    if (game.status !== 'active') return;
    game.phase = 'question';
    game.questionStart = performance.now();
    game.timeLimit = timeLimitFor(q);
    activePlayers(game).forEach((p) => {
      send(p.ws, {
        type: 'question', round: nextRound + 1,
        totalRounds: game.questions.length,
        question: q.text, category: q.category, icon: q.icon, difficulty: q.difficulty,
        answers: q.answers, timeLimit: game.timeLimit,
        isBonus: isFinal,
        image: q.image || null, credit: q.credit || null,
      });
    });
    game.roundTimer = setTimeout(
      () => revealRound(game, true),
      game.timeLimit * 1000 + 500
    );
    scheduleBotAnswers(game);
  }, GAME_CONFIG.INTRO_MS);
}

function revealRound(game, timedOut) {
  if (game.status !== 'active' || game.phase !== 'question') return;
  if (game.roundTimer) clearTimeout(game.roundTimer);
  clearBotTimers(game);
  game.phase = 'revealed';
  const q = game.questions[game.currentRound];

  activePlayers(game).forEach((p) => {
    const mine = game.roundAnswers[p.id];
    send(p.ws, {
      type: 'round_result', round: game.currentRound + 1,
      correctIndex: q.correct,
      yourAnswer: mine ? mine.answerIndex : null,
      yourCorrect: mine ? mine.correct : false,
      pointsEarned: mine ? mine.points : 0,
      yourScore: p.score,
      others: othersOf(game, p.id, (o) => {
        const ans = game.roundAnswers[o.id];
        return {
          id: o.id, name: o.name, avatar: o.avatar, score: o.score,
          answered: !!ans, correct: ans ? ans.correct : false,
        };
      }),
      timedOut: !!timedOut,
    });
  });

  game.roundTimer = setTimeout(() => {
    if (game.status === 'active') nextQuestion(game);
  }, 2500);
}

function recordAnswer(game, playerId, answerIndex) {
  if (game.status !== 'active' || game.phase !== 'question') return;
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1 || !game.players[idx].connected) return;
  if (game.roundAnswers[playerId]) return;

  const elapsedMs = performance.now() - game.questionStart;
  const limitSec = game.timeLimit || GAME_CONFIG.TIME_PER_QUESTION;
  if (elapsedMs < 0 || elapsedMs > limitSec * 1000) return;

  const q = game.questions[game.currentRound];
  const isCorrect = answerIndex === q.correct;
  const isFinal = game.currentRound === game.questions.length - 1;
  const points = isCorrect ? scoreAnswer(elapsedMs, isFinal, limitSec) : 0;
  if (isCorrect) game.players[idx].score += points;

  game.roundAnswers[playerId] = { answerIndex, correct: isCorrect, elapsedMs, points };

  if (allPlayersAnswered(game)) revealRound(game, false);
}

// A deliberate leave is immediate. Transport disconnects must call
// disconnectPlayer() so they get a grace period before this removal path.
function removePlayer(game, playerId) {
  if (game.status !== 'active') return;
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;

  const [left] = game.players.splice(idx, 1);
  if (left.reconnectTimer) clearTimeout(left.reconnectTimer);
  playerSessions.delete(playerId);

  // A permanent leave/expired reconnect window is a forfeit. Record it now
  // because this player is removed from game.players and would otherwise
  // disappear from endGame() without an outcome ever being persisted. Solo
  // abandonment must not break a PvP win streak.
  stats.recordResult(left.clientId, false, game.mode === 'solo', 0);

  if (game.players.length < 2 || game.players.every((p) => p.isBot)) {
    endGame(game, 'opponent_disconnected');
    return;
  }

  activePlayers(game).forEach((p) => send(p.ws, { type: 'player_left', name: left.name }));

  if (game.phase === 'question' && allPlayersAnswered(game)) {
    revealRound(game, false);
  }
}

function disconnectPlayer(game, playerId) {
  if (game.status !== 'active') return;
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.connected) return;

  player.connected = false;
  player.ws = null;
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);

  activePlayers(game).forEach((p) => send(p.ws, { type: 'player_disconnected', name: player.name }));

  player.reconnectTimer = setTimeout(() => {
    if (game.status !== 'active') return;
    const stillMissing = game.players.find((p) => p.id === playerId && !p.connected);
    if (stillMissing) removePlayer(game, playerId);
  }, RECONNECT_GRACE_MS);

  if (game.phase === 'question' && allPlayersAnswered(game)) {
    revealRound(game, false);
  }
}

function findActiveSessionByClientId(clientId) {
  if (!clientId) return null;
  for (const g of activeGames.values()) {
    if (g.status !== 'active') continue;
    const player = g.players.find((p) => p.clientId === clientId);
    if (player) return { game: g, player };
  }
  return null;
}

function findFinishedSessionByClientId(clientId) {
  if (!clientId) return null;
  let latest = null;
  for (const g of activeGames.values()) {
    if (g.status !== 'finished') continue;
    const player = g.players.find((p) => p.clientId === clientId);
    if (!player) continue;
    if (!latest || (g.finishedAt || 0) > (latest.game.finishedAt || 0)) {
      latest = { game: g, player };
    }
  }
  return latest;
}

function sendCurrentState(game, player) {
  if (!player.ws || player.ws.readyState !== 1) return;
  send(player.ws, {
    type: 'game_reconnected',
    gameId: game.id,
    round: Math.max(0, game.currentRound + 1),
    totalRounds: game.questions.length,
    phase: game.phase,
    score: player.score,
    you: { name: player.name, avatar: player.avatar, frame: player.frame },
    opponents: othersOf(game, player.id, (o) => ({
      id: o.id, name: o.name, avatar: o.avatar, frame: o.frame, clientId: o.clientId,
      score: o.score, answered: !!game.roundAnswers[o.id],
      correct: game.roundAnswers[o.id] ? game.roundAnswers[o.id].correct : false,
      connected: !!o.connected,
    })),
  });

  if (game.status === 'finished') {
    if (player.finalResult) send(player.ws, player.finalResult);
    return;
  }

  const q = game.questions[game.currentRound];
  if (!q || game.currentRound < 0) return;

  if (game.phase === 'intro') {
    send(player.ws, {
      type: 'round_intro', round: game.currentRound + 1,
      totalRounds: game.questions.length,
      category: q.category, icon: q.icon,
      isBonus: game.currentRound === game.questions.length - 1,
      preloadImages: upcomingImages(game, game.currentRound),
    });
  } else if (game.phase === 'question') {
    const elapsed = performance.now() - game.questionStart;
    const remainingMs = Math.max(0, (game.timeLimit || GAME_CONFIG.TIME_PER_QUESTION) * 1000 - elapsed);
    const expired = remainingMs <= 0;
    const mine = game.roundAnswers[player.id];
    send(player.ws, {
      type: 'question', round: game.currentRound + 1,
      totalRounds: game.questions.length,
      question: q.text, category: q.category, icon: q.icon, difficulty: q.difficulty,
      answers: q.answers, timeLimit: Math.max(1, Math.ceil(remainingMs / 1000)),
      isBonus: game.currentRound === game.questions.length - 1,
      image: q.image || null, credit: q.credit || null,
      reconnect: true,
      expired,
      answered: !!mine,
      yourAnswer: mine ? mine.answerIndex : null,
    });
  } else if (game.phase === 'revealed') {
    const mine = game.roundAnswers[player.id];
    // A full page refresh has no local question state. Rehydrate the
    // question first, then immediately overlay the already-computed result.
    send(player.ws, {
      type: 'question', round: game.currentRound + 1,
      totalRounds: game.questions.length,
      question: q.text, category: q.category, icon: q.icon, difficulty: q.difficulty,
      answers: q.answers, timeLimit: 1,
      isBonus: game.currentRound === game.questions.length - 1,
      image: q.image || null, credit: q.credit || null,
      reconnect: true,
      answered: !!mine,
      yourAnswer: mine ? mine.answerIndex : null,
    });
    send(player.ws, {
      type: 'round_result', round: game.currentRound + 1,
      correctIndex: q.correct,
      yourAnswer: mine ? mine.answerIndex : null,
      yourCorrect: mine ? mine.correct : false,
      pointsEarned: mine ? mine.points : 0,
      yourScore: player.score,
      others: othersOf(game, player.id, (o) => ({
        id: o.id, name: o.name, avatar: o.avatar, score: o.score,
        answered: !!game.roundAnswers[o.id],
        correct: game.roundAnswers[o.id] ? game.roundAnswers[o.id].correct : false,
      })),
      timedOut: false,
      reconnect: true,
    });
  }
}

function movePlayerTransport(game, player, ws, newPlayerId) {
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);
  player.reconnectTimer = null;
  player.connected = true;
  player.ws = ws;

  const oldPlayerId = player.id;
  if (player.finalResult?.leaderboard) {
    player.finalResult = {
      ...player.finalResult,
      leaderboard: player.finalResult.leaderboard.map((entry) =>
        entry.id === oldPlayerId ? { ...entry, id: newPlayerId } : entry
      ),
    };
  }
  if (game.roundAnswers[oldPlayerId]) {
    game.roundAnswers[newPlayerId] = game.roundAnswers[oldPlayerId];
    delete game.roundAnswers[oldPlayerId];
  }
  playerSessions.delete(oldPlayerId);
  player.id = newPlayerId;
  playerSessions.set(newPlayerId, game.id);
  return oldPlayerId;
}

function reconnectPlayer(clientId, ws, newPlayerId) {
  const found = findActiveSessionByClientId(clientId) || findFinishedSessionByClientId(clientId);
  if (!found) return false;

  const { game, player } = found;
  if (game.status === 'active' && player.connected) return false;
  if (game.status === 'finished' && player.ws && player.ws.readyState === 1) return false;
  // The transport-level playerId changes with every WebSocket connection.
  // Move per-round/final-result state to the new key before resyncing.
  movePlayerTransport(game, player, ws, newPlayerId);

  sendCurrentState(game, player);
  activePlayers(game).filter((p) => p.id !== newPlayerId).forEach((p) => {
    send(p.ws, { type: 'player_reconnected', name: player.name, playerId: newPlayerId });
  });
  return true;
}

function reattachFinishedPlayer(clientId, ws, newPlayerId) {
  const found = findFinishedSessionByClientId(clientId);
  if (!found) return false;

  const { game, player } = found;
  if (player.ws && player.ws.readyState === 1) {
    return player.ws === ws;
  }

  movePlayerTransport(game, player, ws, newPlayerId);
  return true;
}

function requestRematch(clientId) {
  const found = findFinishedSessionByClientId(clientId);
  if (!found) return { status: 'unavailable' };

  const { game } = found;
  game.rematchRequests = game.rematchRequests || new Set();

  // If somebody already moved into a new active match, the old group can no
  // longer be resurrected underneath that newer session.
  if (game.players.some((p) => findActiveSessionByClientId(p.clientId))) {
    game.rematchRequests.clear();
    return { status: 'unavailable' };
  }

  game.rematchRequests.add(clientId);
  const humans = game.players.filter((p) => !p.isBot);
  const allRequested = humans.every((p) => game.rematchRequests.has(p.clientId));
  const allConnected = humans.every((p) => p.ws && p.ws.readyState === 1);

  if (!allRequested || !allConnected) {
    return { status: 'waiting', game };
  }

  const players = humans.map((p) => ({
    ws: p.ws,
    id: p.id,
    clientId: p.clientId,
    name: p.name,
    avatar: p.avatar,
  }));
  game.rematchRequests.clear();
  return {
    status: 'ready',
    game,
    players,
    categoryKey: game.categoryKey || null,
    withBot: game.mode === 'bot',
  };
}

function cancelRematch(clientId) {
  const found = findFinishedSessionByClientId(clientId);
  if (!found?.game?.rematchRequests) return false;
  return found.game.rematchRequests.delete(clientId);
}

function endGame(game, reason) {
  if (game.status === 'finished') return;
  game.status = 'finished';
  game.phase = 'finished';
  game.finishedAt = Date.now();
  if (game.roundTimer) clearTimeout(game.roundTimer);
  clearBotTimers(game);
  try {
    // Real games always have identified players (startGame enforces it);
    // skip anonymous/test sessions so they don't pollute the analytics.
    if (game.players.some((p) => p.clientId)) {
      categoryStats.recordFinish(game.categoryKey, reason || 'complete');
    }
  } catch (err) {
    console.error('category-stats recordFinish failed:', err);
  }
  game.players.forEach((p) => { if (p.reconnectTimer) clearTimeout(p.reconnectTimer); });

  const isSolo = game.mode === 'solo';
  // Bot matches are presented and rewarded exactly like a normal 1v1, so the
  // result screen never differs from a match against a human.
  const topScore = Math.max(...game.players.map((p) => p.score));
  const winners = game.players.filter((p) => p.score === topScore);
  const isTie = !isSolo && winners.length > 1;
  const board = game.players
    .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
    .sort((x, y) => y.score - x.score);

  game.players.filter((p) => !p.isBot).forEach((p) => {
    const won = !isSolo && !isTie && p.score === topScore;
    const finishBonus = 40;
    const winBonus = isSolo ? 0 : won ? 100 : isTie ? 50 : 0;
    const xpTotal = p.score + finishBonus + winBonus;
    const coinsEarned = isSolo ? 20 : won ? 50 : isTie ? 35 : 20;
    // Solo sessions count as games played but neither extend nor break a PvP
    // win streak, and they cannot farm the multiplayer win bonus.
    stats.recordResult(p.clientId, won, isSolo || isTie, xpTotal, coinsEarned);
    stats.setLastReward(p.clientId, game.id, coinsEarned);
    let day = { dayStreak: 0, increased: false };
    try {
      day = stats.recordPlayDay(p.clientId);
    } catch (err) {
      console.error('day streak record failed:', err);
    }
    try {
      const beforeXp = p.clientId && game.categoryKey ? topicStats.getTopic(p.clientId, game.categoryKey).xp : 0;
      topicStats.record(p.clientId, game.categoryKey, { won, xp: xpTotal });
      if (topicProgressListener && p.clientId && game.categoryKey) {
        const afterXp = topicStats.getTopic(p.clientId, game.categoryKey).xp;
        if (afterXp > beforeXp) {
          topicProgressListener({ clientId: p.clientId, categoryKey: game.categoryKey, beforeXp, afterXp });
        }
      }
    } catch (err) {
      console.error('topic-stats record failed:', err);
    }
    const finalResult = {
      type: 'game_end', gameId: game.id, finalScore: p.score,
      solo: isSolo,
      won, tie: isTie,
      others: othersOf(game, p.id, (o) => ({ id: o.id, name: o.name, avatar: o.avatar, frame: o.frame, score: o.score, clientId: o.clientId })),
      leaderboard: board, reason: reason || 'complete',
      coins: coinsEarned,
      xp: xpTotal,
      xpBreakdown: { matchScore: p.score, finishBonus, winBonus, xpTotal },
      stats: { ...stats.getStats(p.clientId), topics: topicStats.getPlayerTopics(p.clientId, 12) },
      topic: game.categoryKey ? topicStats.getTopic(p.clientId, game.categoryKey) : null,
      dayStreak: day.dayStreak,
      dayStreakUp: day.increased,
    };
    p.finalResult = finalResult;
    send(p.ws, finalResult);
  });

  setTimeout(() => {
    // Wake any result screen still waiting for a rematch before dropping the
    // retained match state. Otherwise its button could stay in "waiting"
    // forever after the 60-second retention window expires.
    if (game.rematchRequests?.size) {
      game.players.forEach((p) => {
        if (game.rematchRequests.has(p.clientId)) {
          send(p.ws, { type: 'rematch_unavailable' });
        }
      });
      game.rematchRequests.clear();
    }

    // A player can start a new match on the same socket before this old
    // game's delayed cleanup runs. Only delete the session if it still
    // points at THIS game, otherwise we'd silently break the new match's
    // answer/chat routing after it started.
    game.players.forEach((p) => {
      if (playerSessions.get(p.id) === game.id) playerSessions.delete(p.id);
    });
    activeGames.delete(game.id);
  }, FINISHED_RETENTION_MS);
}

module.exports = {
  activeGames, playerSessions, startingClients, rid, send,
  startGame, recordAnswer, endGame, removePlayer,
  disconnectPlayer, reconnectPlayer, reattachFinishedPlayer,
  findActiveSessionByClientId, findFinishedSessionByClientId,
  requestRematch, cancelRematch, setTopicProgressListener,
  timeLimitFor, scheduleBotAnswers, createBot,
};
