// Game lifecycle: creation, rounds, scoring, and end-game. Supports 2-4
// players uniformly (quick match always pairs exactly 2; private rooms can
// gather up to 4 before the host starts). Pure game logic, separated from
// transport so it can be tested independently.

const { getMixedQuestions, listCategories } = require('./questions');
const { GAME_CONFIG } = require('./config');
const stats = require('./stats');

const activeGames = new Map();
const playerSessions = new Map();
const startingClients = new Set();

const RECONNECT_GRACE_MS = 15000;
const rid = (p) => p + Math.random().toString(36).slice(2, 11);
const send = (ws, obj) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
};

function pickRandomCategory() {
  const cats = listCategories();
  return cats.length ? cats[Math.floor(Math.random() * cats.length)].key : null;
}

function scoreAnswer(elapsedMs, isFinalRound) {
  const t = GAME_CONFIG.TIME_PER_QUESTION * 1000;
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

async function startGame(rawPlayers, categoryKey) {
  if (!rawPlayers.length) throw new Error('NO_PLAYERS');

  // Gameplay and persistent progression require a verified identity.
  if (rawPlayers.some((p) => !p.clientId)) throw new Error('AUTH_REQUIRED');

  // Reject the same Firebase account twice in the batch itself (possible in
  // a private room before either socket has entered an active game).
  const clientIds = rawPlayers.map((p) => p.clientId);
  if (new Set(clientIds).size !== clientIds.length) throw new Error('CLIENT_ALREADY_PLAYING');

  // A verified Firebase identity may only own one active or starting game.
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
      stillOpen.forEach((p) => send(p.ws, { type: 'error', code: 'PLAYER_DISCONNECTED' }));
      return;
    }

    const game = {
      id: gameId,
      players: rawPlayers.map((p) => ({
        ws: p.ws, id: p.id, clientId: p.clientId,
        name: p.name, avatar: p.avatar || '\u{1F43A}',
        score: 0, connected: true, reconnectTimer: null,
      })),
      questions,
      currentRound: -1,
      questionStart: 0,
      roundAnswers: {},
      reported: new Set(),
      roundTimer: null,
      phase: 'idle',
      status: 'active',
    };
    activeGames.set(gameId, game);
    game.players.forEach((p) => playerSessions.set(p.id, gameId));

    game.players.forEach((p) => {
      send(p.ws, {
        type: 'game_start', gameId,
        you: { name: p.name, avatar: p.avatar },
        opponents: othersOf(game, p.id, (o) => ({ id: o.id, name: o.name, avatar: o.avatar, clientId: o.clientId })),
        totalRounds: game.questions.length,
      });
    });

    nextQuestion(game);
  } finally {
    clientIds.forEach((id) => startingClients.delete(id));
  }
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
      category: q.category, icon: q.icon, isBonus: isFinal,
    });
  });

  game.roundTimer = setTimeout(() => {
    if (game.status !== 'active') return;
    game.phase = 'question';
    game.questionStart = Date.now();
    activePlayers(game).forEach((p) => {
      send(p.ws, {
        type: 'question', round: nextRound + 1,
        totalRounds: game.questions.length,
        question: q.text, category: q.category, icon: q.icon,
        answers: q.answers, timeLimit: GAME_CONFIG.TIME_PER_QUESTION,
        isBonus: isFinal,
        image: q.image || null, credit: q.credit || null,
      });
    });
    game.roundTimer = setTimeout(
      () => revealRound(game, true),
      GAME_CONFIG.TIME_PER_QUESTION * 1000 + 500
    );
  }, GAME_CONFIG.INTRO_MS);
}

function revealRound(game, timedOut) {
  if (game.status !== 'active' || game.phase !== 'question') return;
  if (game.roundTimer) clearTimeout(game.roundTimer);
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

  const elapsedMs = Date.now() - game.questionStart;
  if (elapsedMs < 0 || elapsedMs > GAME_CONFIG.TIME_PER_QUESTION * 1000 + 500) return;

  const q = game.questions[game.currentRound];
  const isCorrect = answerIndex === q.correct;
  const isFinal = game.currentRound === game.questions.length - 1;
  const points = isCorrect ? scoreAnswer(elapsedMs, isFinal) : 0;
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
  // disappear from endGame() without a loss ever being persisted.
  stats.recordResult(left.clientId, false, false, 0);

  if (game.players.length < 2) {
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
    you: { name: player.name, avatar: player.avatar },
    opponents: othersOf(game, player.id, (o) => ({
      id: o.id, name: o.name, avatar: o.avatar, clientId: o.clientId,
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
    });
  } else if (game.phase === 'question') {
    const elapsed = Date.now() - game.questionStart;
    const remainingMs = Math.max(0, GAME_CONFIG.TIME_PER_QUESTION * 1000 - elapsed);
    const mine = game.roundAnswers[player.id];
    send(player.ws, {
      type: 'question', round: game.currentRound + 1,
      totalRounds: game.questions.length,
      question: q.text, category: q.category, icon: q.icon,
      answers: q.answers, timeLimit: Math.max(1, Math.ceil(remainingMs / 1000)),
      isBonus: game.currentRound === game.questions.length - 1,
      image: q.image || null, credit: q.credit || null,
      reconnect: true,
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
      question: q.text, category: q.category, icon: q.icon,
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

function reconnectPlayer(clientId, ws, newPlayerId) {
  const found = findActiveSessionByClientId(clientId) || findFinishedSessionByClientId(clientId);
  if (!found) return false;

  const { game, player } = found;
  if (game.status === 'active' && player.connected) return false;
  if (game.status === 'finished' && player.ws && player.ws.readyState === 1) return false;
  if (player.reconnectTimer) clearTimeout(player.reconnectTimer);
  player.reconnectTimer = null;
  player.connected = true;
  player.ws = ws;

  // The transport-level playerId changes with every WebSocket connection.
  // Move any per-round answer to the new key so a reconnect cannot answer
  // twice or lose its already-earned score/result state.
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

  sendCurrentState(game, player);
  activePlayers(game).filter((p) => p.id !== newPlayerId).forEach((p) => {
    send(p.ws, { type: 'player_reconnected', name: player.name, playerId: newPlayerId });
  });
  return true;
}

function endGame(game, reason) {
  if (game.status === 'finished') return;
  game.status = 'finished';
  game.phase = 'finished';
  game.finishedAt = Date.now();
  if (game.roundTimer) clearTimeout(game.roundTimer);
  game.players.forEach((p) => { if (p.reconnectTimer) clearTimeout(p.reconnectTimer); });

  const topScore = Math.max(...game.players.map((p) => p.score));
  const winners = game.players.filter((p) => p.score === topScore);
  const isTie = winners.length > 1;
  const board = game.players
    .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
    .sort((x, y) => y.score - x.score);

  game.players.forEach((p) => {
    const won = !isTie && p.score === topScore;
    const finishBonus = 40;
    const winBonus = won ? 100 : isTie ? 50 : 0;
    const xpTotal = p.score + finishBonus + winBonus;
    stats.recordResult(p.clientId, won, isTie, xpTotal);
    const finalResult = {
      type: 'game_end', finalScore: p.score,
      won, tie: isTie,
      others: othersOf(game, p.id, (o) => ({ id: o.id, name: o.name, avatar: o.avatar, score: o.score, clientId: o.clientId })),
      leaderboard: board, reason: reason || 'complete',
      coins: won ? 50 : isTie ? 35 : 20,
      xp: xpTotal,
      xpBreakdown: { matchScore: p.score, finishBonus, winBonus, xpTotal },
      stats: stats.getStats(p.clientId),
    };
    p.finalResult = finalResult;
    send(p.ws, finalResult);
  });

  setTimeout(() => {
    // A player can start a new match on the same socket before this old
    // game's delayed cleanup runs. Only delete the session if it still
    // points at THIS game, otherwise we'd silently break the new match's
    // answer/chat routing a few seconds after it started.
    game.players.forEach((p) => {
      if (playerSessions.get(p.id) === game.id) playerSessions.delete(p.id);
    });
    activeGames.delete(game.id);
  }, RECONNECT_GRACE_MS);
}

module.exports = {
  activeGames, playerSessions, startingClients, rid, send,
  startGame, recordAnswer, endGame, removePlayer,
  disconnectPlayer, reconnectPlayer, findActiveSessionByClientId, findFinishedSessionByClientId,
};
