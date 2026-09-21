const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('./game');

function fakeWs() {
  return {
    readyState: 1,
    messages: [],
    send(value) { this.messages.push(JSON.parse(value)); },
  };
}

test('ignores answers outside the question phase', () => {
  const ws = fakeWs();
  const g = {
    status: 'active',
    phase: 'intro',
    currentRound: 0,
    questionStart: Date.now(),
    questions: [{ correct: 0 }],
    players: [{ id: 'p1', ws, connected: true, score: 0 }],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  assert.deepEqual(g.roundAnswers, {});
  assert.equal(g.players[0].score, 0);
});

test('accepts only the first answer from a player', () => {
  const ws = fakeWs();
  const g = {
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: Date.now(),
    questions: [{ correct: 0 }],
    players: [{ id: 'p1', ws, connected: true, score: 0 }, { id: 'p2', ws: fakeWs(), connected: true, score: 0 }],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  const first = g.roundAnswers.p1;
  game.recordAnswer(g, 'p1', 1);

  assert.deepEqual(g.roundAnswers.p1, first);
  assert.equal(g.roundAnswers.p1.answerIndex, 0);
});

test('rejects answers from disconnected players', () => {
  const ws = fakeWs();
  const g = {
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: Date.now(),
    questions: [{ correct: 0 }],
    players: [{ id: 'p1', ws, connected: false, score: 0 }],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  assert.deepEqual(g.roundAnswers, {});
});
