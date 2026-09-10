// Game lifecycle: creation, rounds, scoring, and end-game. Pure game logic
// separated from transport so it can be tested independently.

const { getMixedQuestions, listCategories } = require('./questions');
const { GAME_CONFIG } = require('./config');

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

async function startGame(p1, p2, categoryKey) {
  const gameId = rid('game_');
  const resolvedCategory = categoryKey || pickRandomCategory();
  const questions = await getMixedQuestions(GAME_CONFIG.ROUNDS, resolvedCategory);
  const game = {
    id: gameId,
    players: [p1, p2].map((p) => ({
      ws: p.ws, id: p.id, clientId: p.clientId || null,
      name: p.name, avatar: p.avatar || '\u{1F43A}',
      score: 0, connected: true,
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

  game.players.forEach((p, idx) => {
    send(p.ws, {
      type: 'game_start', gameId,
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

  game.players.forEach((p, idx) => {
    const mine = game.roundAnswers[p.id];
    const theirs = game.roundAnswers[game.players[1 - idx].id];
    send(p.ws, {
      type: 'round_result', round: game.currentRound + 1,
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
      type: 'game_end', finalScore: p.score,
      opponentScore: game.players[1 - idx].score,
      won: winnerIdx === idx, tie: winnerIdx === -1,
      leaderboard: board, reason: reason || 'complete',
      coins: winnerIdx === idx ? 50 : 20,
      xp: 40 + p.score,
    });
  });

  setTimeout(() => {
    game.players.forEach((p) => playerSessions.delete(p.id));
    activeGames.delete(game.id);
  }, 5000);
}

module.exports = {
  activeGames, playerSessions, rid, send,
  startGame, recordAnswer, endGame,
};
