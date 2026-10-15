const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const game = require('./game');
const categoryStats = require('./category-stats');

function socket() {
  return { readyState: 1, messages: [], send(value) { this.messages.push(JSON.parse(value)); } };
}

afterEach(() => {
  game.activeGames.clear();
  game.playerSessions.clear();
  game.startingClients.clear();
});

// Control only the clock and scheduled work. The game lifecycle, scoring,
// transport migration and question payloads all run through production code.
async function round(t, { answerCount = 4, text = 'Q', versions = [1, 1], withBot = false } = {}) {
  const clock = { now: 10000 };
  const timers = [];
  t.mock.method(performance, 'now', () => clock.now);
  t.mock.method(global, 'setTimeout', (fn, delay) => {
    const timer = { fn, delay, unref() {} };
    timers.push(timer);
    return timer;
  });
  t.mock.method(global, 'clearTimeout', () => {});
  // startGame records category analytics; keep tests out of persistent data.
  t.mock.method(categoryStats, 'recordStart', () => {});
  const ws = socket();
  const players = versions.map((version, i) => ({
    id: `p${i + 1}`, clientId: `timing-test-${i + 1}`,
    ws: Object.assign(i === 0 ? ws : socket(), { presentationVersion: version }), name: String(i),
  }));
  await game.startGame(players, 'sports', { withBot });
  const g = [...game.activeGames.values()][0];
  const question = { text, category: 'Test', icon: 'T', difficulty: 'easy',
    answers: Array.from({ length: answerCount }, (_, i) => String(i)), correct: 0 };
  Object.assign(g.questions[0], question);
  g.questions = [g.questions[0], question];
  const intro = timers[0];
  intro.fn();
  return { g, ws, clock, timers, intro, question: ws.messages.find((m) => m.type === 'question') };
}

test('reading and every answer entrance finish before the full scoring window opens', async (t) => {
  const { g, ws, clock, question } = await round(t);
  assert.equal(g.presentationVersion, 1);
  assert.equal(question.readingMs, 1500);
  assert.equal(question.answerStaggerMs, 100);
  assert.equal(question.answerEnterMs, 250);
  assert.equal(question.presentationElapsedMs, 0);
  assert.equal(question.answerOpensInMs, 2050);
  assert.equal(question.remainingMs, 10000);
  assert.equal(question.timeLimit, 10);
  assert.equal(g.phase, 'question');
  clock.now = 12049;
  game.recordAnswer(g, 'p1', 0);
  assert.deepEqual(g.roundAnswers, {});
  assert.equal(ws.messages.some((m) => m.type === 'answer_ack'), false);
  clock.now = 12050;
  game.recordAnswer(g, 'p1', 0);
  assert.equal(g.roundAnswers.p1.elapsedMs, 0);
  assert.equal(g.roundAnswers.p1.points, 20);
});

test('the selected opponent stays on screen at least one extra second before question one', async (t) => {
  const { timers } = await round(t);
  assert.equal(timers[0].delay, 3000);
});

test('solo starts retain the short round introduction', async (t) => {
  const { timers } = await round(t, { versions: [1] });
  assert.equal(timers[0].delay, 1600);
});

for (const versions of [[1, undefined], [undefined, undefined]]) {
  test(`legacy humans keep every participant on immediate timing (${versions.join(',')})`, async (t) => {
    const { g, question, timers } = await round(t, { versions });
    assert.equal(g.presentationVersion, 0);
    assert.equal(question.readingMs, 0);
    assert.equal(question.answerStaggerMs, 0);
    assert.equal(question.answerEnterMs, 0);
    assert.equal(question.answerOpensInMs, 0);
    assert.equal(timers[1].delay, 10500);
    const otherQuestion = g.players[1].ws.messages.find((m) => m.type === 'question');
    assert.equal(otherQuestion.answerOpensInMs, 0);
    game.recordAnswer(g, 'p1', 0);
    assert.equal(g.roundAnswers.p1.points, 20, 'an immediate legacy-era click counts');
  });
}

test('bots do not opt a capable human out of presentation timing', async (t) => {
  const { g, question } = await round(t, { versions: [1], withBot: true });
  assert.equal(g.presentationVersion, 1);
  assert.equal(question.answerOpensInMs, 2050);
  assert.ok(g.players.some((p) => p.isBot));
});

test('a legacy reconnect cannot enter an already timed match', async (t) => {
  const { g, clock } = await round(t);
  const start = g.questionStart;
  clock.now += 500;
  g.players[0].connected = false;
  g.players[0].ws = null;
  const ws = socket();
  assert.equal(game.reconnectPlayer('timing-test-1', ws, 'legacy-reconnect'), false);
  assert.equal(ws.messages.at(-1).type, 'error');
  assert.equal(ws.messages.at(-1).code, 'CLIENT_UPDATE_REQUIRED');
  assert.equal(g.players[0].connected, false);
  assert.equal(g.questionStart, start);
  assert.equal(g.presentationVersion, 1);
});

test('a capable reconnect does not change a legacy match schedule', async (t) => {
  const { g, clock } = await round(t, { versions: [undefined, 1] });
  const start = g.questionStart;
  clock.now += 500;
  g.players[0].connected = false;
  g.players[0].ws = null;
  const ws = Object.assign(socket(), { presentationVersion: 1 });
  assert.equal(game.reconnectPlayer('timing-test-1', ws, 'capable-reconnect'), true);
  const question = ws.messages.find((m) => m.type === 'question');
  assert.equal(question.readingMs, 0);
  assert.equal(question.timeLimit, 10);
  assert.equal(question.answerOpensInMs, 0);
  assert.equal(question.remainingMs, 9500);
  assert.equal(g.questionStart, start);
});

for (const [elapsed, seconds, remaining, points] of [[2500, 8, 7500, 16], [9001, 1, 999, 6], [10001, 1, 0, null]]) {
  test(`a legacy reconnect at ${elapsed}ms receives remaining seconds without changing the original answer budget`, async (t) => {
    const { g, clock } = await round(t, { versions: [undefined, 1] });
    const start = g.questionStart;
    clock.now += elapsed;
    g.players[0].connected = false;
    g.players[0].ws = null;
    const ws = socket();
    assert.equal(game.reconnectPlayer('timing-test-1', ws, 'legacy-reconnect'), true);
    const question = ws.messages.find((m) => m.type === 'question');
    assert.equal(question.timeLimit, seconds, 'older clients use timeLimit as their remaining timer');
    assert.equal(question.remainingMs, remaining);
    assert.equal(question.answerOpensInMs, 0);
    assert.equal(g.timeLimit, 10);
    assert.equal(g.questionStart, start);
    game.recordAnswer(g, 'legacy-reconnect', 0);
    assert.equal(g.roundAnswers['legacy-reconnect']?.points ?? null, points, 'scoring and rejection still use the original ten-second budget');
  });
}

test('opening follows the actual number of choices', async (t) => {
  const { question } = await round(t, { answerCount: 2 });
  assert.equal(question.answerOpensInMs, 1850);
});

test('round timeout includes presentation and the full answer window', async (t) => {
  const { g, clock, timers, ws } = await round(t);
  assert.equal(timers[1].delay, 12550);
  clock.now = 22051;
  game.recordAnswer(g, 'p1', 0);
  assert.deepEqual(g.roundAnswers, {}, 'answers after the authoritative deadline do not count');
  clock.now = 22550;
  timers[1].fn();
  assert.equal(g.phase, 'revealed');
  assert.equal(ws.messages.find((m) => m.type === 'round_result').timedOut, true);
});

for (const [elapsed, opensIn, remaining] of [[1000, 1050, 15000], [3050, 0, 14000], [18000, 0, 0]]) {
  test(`reconnect at ${elapsed}ms preserves the original long-question timeline`, async (t) => {
    const { g, clock } = await round(t, { text: 'x'.repeat(180) });
    const originalStart = g.questionStart;
    clock.now += elapsed;
    g.players[0].connected = false;
    g.players[0].ws = null;
    const ws = Object.assign(socket(), { presentationVersion: 1 });
    assert.equal(game.reconnectPlayer('timing-test-1', ws, 'reconnected'), true);
    const question = ws.messages.find((m) => m.type === 'question');
    assert.equal(question.timeLimit, 15);
    assert.equal(question.readingMs, 1500);
    assert.equal(question.presentationElapsedMs, elapsed);
    assert.equal(question.answerOpensInMs, opensIn);
    assert.equal(question.remainingMs, remaining);
    assert.equal(question.expired, remaining === 0);
    assert.equal(g.questionStart, originalStart);
  });
}

test('scoring starts at answer opening, including the final-round multiplier', async (t) => {
  const { g, clock } = await round(t);
  clock.now = 17050;
  game.recordAnswer(g, 'p1', 0);
  assert.equal(g.roundAnswers.p1.points, 13);
  g.currentRound = 1;
  game.recordAnswer(g, 'p2', 0);
  assert.equal(g.roundAnswers.p2.points, 26);
});

test('reconnecting after a reveal keeps choices closed and replays the confirmed result', async (t) => {
  const { g, clock } = await round(t);
  clock.now = 12050;
  game.recordAnswer(g, 'p1', 0);
  game.recordAnswer(g, 'p2', 1);
  assert.equal(g.phase, 'revealed');
  g.players[0].connected = false;
  g.players[0].ws = null;
  const ws = Object.assign(socket(), { presentationVersion: 1 });
  game.reconnectPlayer('timing-test-1', ws, 'reconnected');
  const question = ws.messages.find((m) => m.type === 'question');
  assert.equal(question.timeLimit, 10);
  assert.equal(question.answerOpensInMs, 0);
  assert.equal(question.remainingMs, 0);
  assert.equal(question.answered, true);
  assert.equal(ws.messages.at(-1).type, 'round_result');
  assert.equal(ws.messages.at(-1).yourScore, 20);
});

test('bot response timers start at answer opening and cannot leak into a later round', async (t) => {
  const { g, clock, timers } = await round(t);
  g.players.push({ id: 'bot', isBot: true, connected: true, score: 0, speed: 1 });
  const seq = [0.5, 0, 0];
  game.scheduleBotAnswers(g, () => seq.shift() ?? 0);
  const botTimer = timers.at(-1);
  assert.equal(botTimer.delay, 3568);
  clock.now = 13568;
  botTimer.fn();
  assert.equal(g.roundAnswers.bot.elapsedMs, 1518);
  assert.equal(g.roundAnswers.bot.correct, true);
  g.roundAnswers = {};
  g.currentRound = 1;
  botTimer.fn();
  assert.deepEqual(g.roundAnswers, {});
});

test('stale intro and timeout callbacks cannot mutate a different or finished round', async (t) => {
  const { g, timers, intro, ws } = await round(t);
  const timeout = timers[1];
  const originalStart = g.questionStart;
  const messages = ws.messages.length;
  g.currentRound = 1;
  intro.fn();
  assert.equal(g.questionStart, originalStart);
  assert.equal(ws.messages.length, messages);
  timeout.fn();
  assert.equal(g.phase, 'question');
  g.status = 'finished';
  intro.fn();
  timeout.fn();
  assert.equal(ws.messages.length, messages);
});
