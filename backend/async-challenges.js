const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { GAME_CONFIG } = require('./config');
const PRESENTATION_MS = 2050,
  WINDOW_MS = 10000,
  ROUNDS = 6,
  MAX_RUNS = 5000;
function createAsyncChallenges({
  file = getStorePath('async-challenges.json'),
  now = Date.now,
  friends = require('./social').areFriends,
  getChallenge = (id) => require('./challenges').get(id),
  onComplete = recordCompleted,
} = {}) {
  const saved = readJsonFileSync(file, []);
  const runs = new Map(
    (Array.isArray(saved) ? saved : [])
      .filter(
        (r) =>
          r &&
          typeof r.id === 'string' &&
          Array.isArray(r.questions) &&
          r.questions.length === ROUNDS &&
          Array.isArray(r.players) &&
          r.players.length === 2,
      )
      .slice(-MAX_RUNS)
      .map((r) => [r.id, r]),
  );
  const persist = createJsonWriter(file, () => [...runs.values()]);
  function create(c, questions) {
    if (runs.has(c.id)) return;
    if (
      !Array.isArray(questions) ||
      questions.length !== ROUNDS ||
      questions.some(
        (q) =>
          !(q.text || q.question) ||
          !Array.isArray(q.answers) ||
          q.answers.length !== 4 ||
          !Number.isInteger(q.correct) ||
          q.correct < 0 ||
          q.correct > 3,
      )
    )
      throw Error('INVALID_QUESTIONS');
    const run = {
      id: c.id,
      category: c.category,
      expiresAt: c.expiresAt,
      questions: JSON.parse(JSON.stringify(questions)),
      players: [c.fromId, c.toId].map((id) => ({
        id,
        round: 0,
        score: 0,
        opensAt: null,
        feedback: [],
      })),
      recorded: false,
    };
    runs.set(c.id, run);
    while (runs.size > MAX_RUNS) runs.delete(runs.keys().next().value);
    persist();
  }
  function owned(uid, id) {
    const c = getChallenge(id),
      run = runs.get(id);
    if (!c || !run || c.mode !== 'async' || ![c.fromId, c.toId].includes(uid))
      throw Error('CHALLENGE_FORBIDDEN');
    if (!friends(c.fromId, c.toId)) throw Error('NOT_FRIENDS');
    if (
      ['declined', 'expired'].includes(c.status) ||
      (c.status !== 'completed' && c.expiresAt <= now())
    )
      throw Error('CHALLENGE_UNAVAILABLE');
    if (uid === c.toId && c.status === 'pending')
      throw Error('CHALLENGE_NOT_ACCEPTED');
    return { run, player: run.players.find((p) => p.id === uid) };
  }
  function finishRound(run, p, index) {
    const round = p.round,
      q = run.questions[round],
      elapsed = now() - p.opensAt;
    const correct = index === q.correct && elapsed >= 0 && elapsed < WINDOW_MS;
    let points = correct
      ? Math.round(
          GAME_CONFIG.MIN_POINTS +
            (GAME_CONFIG.BASE_POINTS - GAME_CONFIG.MIN_POINTS) *
              Math.max(0, 1 - elapsed / WINDOW_MS),
        )
      : 0;
    if (round === ROUNDS - 1) points *= GAME_CONFIG.BONUS_MULTIPLIER;
    const feedback = {
      round,
      correct,
      correctIndex: q.correct,
      pointsEarned: points,
    };
    p.feedback.push(feedback);
    p.score += points;
    p.round++;
    p.opensAt = null;
    persist();
    return feedback;
  }
  function state(run, p, feedback) {
    const completed = run.players.every((p) => p.round === ROUNDS);
    if (completed && !run.recorded) {
      onComplete(run);
      run.recorded = true;
      persist();
    }
    const response = {
      challengeId: run.id,
      status: completed
        ? 'completed'
        : p.round === ROUNDS
          ? 'waiting'
          : 'playing',
      round: p.round,
      score: p.score,
    };
    if (feedback) response.feedback = feedback;
    if (completed)
      response.result = {
        gameId: run.id,
        category: run.category,
        scores: run.players.map((p) => ({ id: p.id, score: p.score })),
      };
    if (p.round < ROUNDS) {
      if (p.opensAt === null) {
        p.opensAt = now() + PRESENTATION_MS;
        persist();
      }
      const q = run.questions[p.round];
      response.question = {
        question: q.text || q.question,
        answers: [...q.answers],
        ...(q.image ? { image: q.image } : {}),
        timeLimit: 10,
        remainingMs: Math.max(
          0,
          Math.min(WINDOW_MS, p.opensAt + WINDOW_MS - now()),
        ),
        opensInMs: Math.max(0, p.opensAt - now()),
        readingMs: 1500,
        answerStaggerMs: 100,
        answerEnterMs: 250,
        round: p.round,
        totalRounds: ROUNDS,
      };
    }
    return response;
  }
  function play(uid, id) {
    const { run, player: p } = owned(uid, id);
    let feedback;
    if (
      p.round < ROUNDS &&
      p.opensAt !== null &&
      now() >= p.opensAt + WINDOW_MS
    )
      feedback = finishRound(run, p, -1);
    return state(run, p, feedback);
  }
  function answer(uid, id, round, index) {
    const { run, player: p } = owned(uid, id);
    if (
      !Number.isInteger(round) ||
      round < 0 ||
      round >= ROUNDS ||
      !Number.isInteger(index) ||
      index < -1 ||
      index > 3
    )
      throw Error('INVALID_ANSWER');
    if (round < p.round) return state(run, p, p.feedback[round]);
    if (round !== p.round || p.opensAt === null) throw Error('INVALID_ROUND');
    if (now() < p.opensAt) throw Error('ANSWER_NOT_OPEN');
    if (index === -1 && now() < p.opensAt + WINDOW_MS)
      throw Error('ROUND_NOT_EXPIRED');
    return state(run, p, finishRound(run, p, index));
  }
  return { create, play, answer, flush: persist.flush };
}
function recordCompleted(run) {
  const social = require('./social'),
    history = require('./match-history');
  const game = {
    id: run.id,
    categoryKey: run.category,
    finishedAt: Date.now(),
    mode: 'multiplayer',
    players: run.players.map((p) => ({
      id: p.id,
      clientId: p.id,
      score: p.score,
      name: social.profileOf(p.id)?.name || 'Player',
      avatar: social.profileOf(p.id)?.avatar || 'robot',
    })),
  };
  const results = history.resultsFor(game);
  history.recordMatch(game, results);
  require('./messaging').recordMatchResults(game, results);
  require('./challenges').complete(run.id);
}
module.exports = { ...createAsyncChallenges(), createAsyncChallenges };
