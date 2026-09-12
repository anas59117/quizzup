// Game lifecycle: creation, rounds, scoring, and end-game. Supports 2-4
// players uniformly (quick match always pairs exactly 2; private rooms can
// gather up to 4 before the host starts). Pure game logic, separated from
// transport so it can be tested independently.

const { getMixedQuestions, listCategories } = require('./questions');
const { GAME_CONFIG } = require('./config');
const stats = require('./stats');

const activeGames = new Map();
const playerSessions = new Map();

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

// `others` for a given player: every other player's public info, in the
// original seating order, for the client to render as opponents.
function othersOf(game, selfId, mapper) {
  return game.players.filter((p) => p.id !== selfId).map(mapper);
}

async function startGame(rawPlayers, categoryKey) {
  const gameId = rid('game_');
  const resolvedCategory = categoryKey || pickRandomCategory();
  const questions = await getMixedQuestions(GAME_CONFIG.ROUNDS, resolvedCategory);

  // Any player may have disconnected while questions were loading (the
  // OpenTDB fetch can take seconds). Starting anyway would leave everyone
  // else stuck playing against a dead socket. Bail and notify the living.
  const stillOpen = rawPlayers.filter((p) => p.ws.readyState === 1);
  if (stillOpen.length !== rawPlayers.length) {
    stillOpen.forEach((p) => send(p.ws, { type: 'error' }));
    return;
  }

  const game = {
    id: gameId,
    players: rawPlayers.map((p) => ({
      ws: p.ws, id: p.id, clientId: p.clientId || null,
      name: p.name, avatar: p.avatar || '\u{1F43A}',
      score: 0,
    })),
    questions,
    currentRound: -1,
    questionStart: 0,
    roundAnswers: {},
    reported: new Set(),
    roundTimer: null,
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
}

function nextQuestion(game) {
  if (game.roundTimer) clearTimeout(game.roundTimer);
  const nextRound = game.currentRound + 1;
  if (nextRound >= game.questions.length) return endGame(game);

  game.currentRound = nextRound;
  game.roundAnswers = {};
  const q = game.questions[nextRound];
  const isFinal = nextRound === game.questions.length - 1;

  game.players.forEach((p) => {
    send(p.ws, {
      type: 'round_intro', round: nextRound + 1,
      totalRounds: game.questions.length,
      category: q.category, icon: q.icon, isBonus: isFinal,
    });
  });

  game.roundTimer = setTimeout(() => {
    if (game.status !== 'active') return;
    game.questionStart = Date.now();
    game.players.forEach((p) => {
      send(p.ws, {
        type: 'question', round: nextRound + 1,
        totalRounds: game.questions.length,
        question: q.text, category: q.category, icon: q.icon,
        answers: q.answers, timeLimit: GAME_CONFIG.TIME_PER_QUESTION,
        isBonus: isFinal,
      });
    });
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

  game.players.forEach((p) => {
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

  setTimeout(() => {
    if (game.status === 'active') nextQuestion(game);
  }, 2500);
}

function recordAnswer(game, playerId, answerIndex) {
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  if (game.roundAnswers[playerId]) return;

  const elapsedMs = Date.now() - game.questionStart;
  if (elapsedMs > GAME_CONFIG.TIME_PER_QUESTION * 1000 + 500) return;

  const q = game.questions[game.currentRound];
  const isCorrect = answerIndex === q.correct;
  const isFinal = game.currentRound === game.questions.length - 1;
  const points = isCorrect ? scoreAnswer(elapsedMs, isFinal) : 0;
  if (isCorrect) game.players[idx].score += points;

  game.roundAnswers[playerId] = { answerIndex, correct: isCorrect, elapsedMs, points };

  if (game.players.every((p) => game.roundAnswers[p.id])) revealRound(game, false);
}

// A player disconnecting mid-match no longer ends it outright for everyone
// else — only when fewer than 2 players remain is a match unplayable.
function removePlayer(game, playerId) {
  if (game.status !== 'active') return;
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;

  const [left] = game.players.splice(idx, 1);
  playerSessions.delete(playerId);

  if (game.players.length < 2) {
    endGame(game, 'opponent_disconnected');
    return;
  }

  game.players.forEach((p) => send(p.ws, { type: 'player_left', name: left.name }));

  // The departed player can never answer now — if everyone still in the
  // match already has, reveal immediately instead of waiting out the clock.
  if (game.currentRound >= 0 && game.players.every((p) => game.roundAnswers[p.id])) {
    revealRound(game, false);
  }
}

function endGame(game, reason) {
  if (game.status === 'finished') return;
  game.status = 'finished';
  if (game.roundTimer) clearTimeout(game.roundTimer);

  const topScore = Math.max(...game.players.map((p) => p.score));
  const winners = game.players.filter((p) => p.score === topScore);
  const isTie = winners.length > 1;
  const board = game.players
    .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
    .sort((x, y) => y.score - x.score);

  game.players.forEach((p) => {
    const won = !isTie && p.score === topScore;
    stats.recordResult(p.clientId, won, isTie);
    send(p.ws, {
      type: 'game_end', finalScore: p.score,
      won, tie: isTie,
      others: othersOf(game, p.id, (o) => ({ id: o.id, name: o.name, avatar: o.avatar, score: o.score, clientId: o.clientId })),
      leaderboard: board, reason: reason || 'complete',
      coins: won ? 50 : 20,
      xp: 40 + p.score,
      stats: stats.getStats(p.clientId),
    });
  });

  setTimeout(() => {
    game.players.forEach((p) => playerSessions.delete(p.id));
    activeGames.delete(game.id);
  }, 5000);
}

module.exports = {
  activeGames, playerSessions, rid, send,
  startGame, recordAnswer, endGame, removePlayer,
};
