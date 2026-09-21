const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const game = require('./game');

afterEach(() => {
  for (const g of game.activeGames.values()) {
    if (g.roundTimer) clearTimeout(g.roundTimer);
    for (const p of g.players || []) {
      if (p.reconnectTimer) clearTimeout(p.reconnectTimer);
    }
  }
  game.activeGames.clear();
  game.playerSessions.clear();
  game.startingClients.clear();
});

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
    questionStart: performance.now(),
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
    questionStart: performance.now(),
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
    questionStart: performance.now(),
    questions: [{ correct: 0 }],
    players: [{ id: 'p1', ws, connected: false, score: 0 }],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  assert.deepEqual(g.roundAnswers, {});
});


test('a disconnected player keeps the round open until timeout or removal', () => {
  const g = {
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: performance.now(),
    questions: [{ correct: 0 }],
    players: [
      { id: 'p1', clientId: 'u1', ws: fakeWs(), connected: true, score: 0 },
      { id: 'p2', clientId: 'u2', ws: null, connected: false, score: 0 },
    ],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  assert.equal(g.phase, 'question');
  assert.equal(g.roundAnswers.p1.correct, true);
});

test('reconnect migrates an existing answer to the new transport player id', () => {
  const newWs = fakeWs();
  const g = {
    id: 'g1',
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: performance.now(),
    questions: [{
      text: 'Q', category: 'Test', icon: 'T',
      answers: ['A', 'B', 'C', 'D'], correct: 0,
    }],
    players: [
      {
        id: 'old-id', clientId: 'u1', ws: null, connected: false,
        score: 20, name: 'Alice', avatar: 'A', reconnectTimer: null,
      },
      {
        id: 'p2', clientId: 'u2', ws: fakeWs(), connected: true,
        score: 10, name: 'Bob', avatar: 'B', reconnectTimer: null,
      },
    ],
    roundAnswers: {
      'old-id': { answerIndex: 0, correct: true, elapsedMs: 100, points: 20 },
    },
    roundTimer: null,
    reported: new Set(),
  };

  game.activeGames.set(g.id, g);
  game.playerSessions.set('old-id', g.id);

  assert.equal(game.reconnectPlayer('u1', newWs, 'new-id'), true);
  assert.equal(g.players[0].id, 'new-id');
  assert.equal(game.playerSessions.has('old-id'), false);
  assert.equal(game.playerSessions.get('new-id'), 'g1');
  assert.equal(g.roundAnswers['old-id'], undefined);
  assert.equal(g.roundAnswers['new-id'].answerIndex, 0);

  const snapshot = newWs.messages.find((m) => m.type === 'game_reconnected');
  const question = newWs.messages.find((m) => m.type === 'question');
  assert.equal(snapshot.score, 20);
  assert.equal(snapshot.opponents[0].name, 'Bob');
  assert.equal(question.reconnect, true);
  assert.equal(question.answered, true);
  assert.equal(question.yourAnswer, 0);
});

test('removePlayer removes a disconnected player instead of restarting grace', () => {
  const g = {
    id: 'g2',
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: performance.now(),
    questions: [{ correct: 0 }],
    players: [
      { id: 'p1', clientId: 'u1', ws: null, connected: false, score: 0, name: 'A', reconnectTimer: null },
      { id: 'p2', clientId: 'u2', ws: fakeWs(), connected: true, score: 0, name: 'B', reconnectTimer: null },
      { id: 'p3', clientId: 'u3', ws: fakeWs(), connected: true, score: 0, name: 'C', reconnectTimer: null },
    ],
    roundAnswers: {},
    roundTimer: null,
  };

  game.removePlayer(g, 'p1');
  assert.equal(g.players.length, 2);
  assert.equal(g.players.some((p) => p.id === 'p1'), false);
});


test('reconnect during reveal rehydrates the question before the result', () => {
  const newWs = fakeWs();
  const g = {
    id: 'g-reveal',
    status: 'active',
    phase: 'revealed',
    currentRound: 0,
    questionStart: performance.now() - 1000,
    questions: [{
      text: 'Reveal Q', category: 'Test', icon: 'T',
      answers: ['A', 'B', 'C', 'D'], correct: 1,
    }],
    players: [
      {
        id: 'old-r', clientId: 'u-reveal', ws: null, connected: false,
        score: 15, name: 'Alice', avatar: 'A', reconnectTimer: null,
      },
      {
        id: 'other-r', clientId: 'u-other', ws: fakeWs(), connected: true,
        score: 10, name: 'Bob', avatar: 'B', reconnectTimer: null,
      },
    ],
    roundAnswers: {
      'old-r': { answerIndex: 1, correct: true, elapsedMs: 800, points: 15 },
    },
    roundTimer: null,
    reported: new Set(),
  };

  game.activeGames.set(g.id, g);
  game.playerSessions.set('old-r', g.id);

  assert.equal(game.reconnectPlayer('u-reveal', newWs, 'new-r'), true);
  const types = newWs.messages.map((m) => m.type);
  assert.deepEqual(types.slice(0, 3), ['game_reconnected', 'question', 'round_result']);
  assert.equal(newWs.messages[1].question, 'Reveal Q');
  assert.equal(newWs.messages[2].yourCorrect, true);
});

test('old game cleanup does not erase a newer session mapping', () => {
  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn) => {
    scheduled.push(fn);
    return { unref() {} };
  };

  try {
    const g = {
      id: 'old-game',
      status: 'active',
      phase: 'question',
      players: [{
        id: 'same-player', clientId: null, ws: fakeWs(), connected: true,
        score: 5, name: 'A', avatar: 'A', reconnectTimer: null,
      }],
      roundTimer: null,
    };

    game.activeGames.set(g.id, g);
    game.playerSessions.set('same-player', g.id);
    game.endGame(g);

    game.playerSessions.set('same-player', 'new-game');
    assert.equal(scheduled.length, 1);
    scheduled[0]();

    assert.equal(game.playerSessions.get('same-player'), 'new-game');
    assert.equal(game.activeGames.has('old-game'), false);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});


test('finished recovery chooses the newest retained match', () => {
  const oldGame = {
    id: 'finished-old', status: 'finished', finishedAt: 100,
    players: [{ id: 'old-p', clientId: 'same-user' }],
  };
  const newGame = {
    id: 'finished-new', status: 'finished', finishedAt: 200,
    players: [{ id: 'new-p', clientId: 'same-user' }],
  };
  game.activeGames.set(oldGame.id, oldGame);
  game.activeGames.set(newGame.id, newGame);

  const found = game.findFinishedSessionByClientId('same-user');
  assert.equal(found.game.id, 'finished-new');
  assert.equal(found.player.id, 'new-p');
});

test('finished match recovery resends result and updates leaderboard transport id', () => {
  const ws = fakeWs();
  const g = {
    id: 'finished-recover',
    status: 'finished',
    phase: 'finished',
    finishedAt: Date.now(),
    currentRound: 0,
    questions: [{ text: 'Q', answers: ['A', 'B', 'C', 'D'], correct: 0 }],
    roundAnswers: {},
    players: [{
      id: 'old-finished-id',
      clientId: 'finished-user',
      ws: null,
      connected: false,
      score: 123,
      name: 'Alice',
      avatar: 'A',
      reconnectTimer: null,
      finalResult: {
        type: 'game_end',
        finalScore: 123,
        won: true,
        tie: false,
        others: [],
        leaderboard: [{ id: 'old-finished-id', name: 'Alice', avatar: 'A', score: 123 }],
        reason: 'complete',
        coins: 50,
        xp: 263,
        xpBreakdown: { matchScore: 123, finishBonus: 40, winBonus: 100, xpTotal: 263 },
        stats: {},
      },
    }],
  };

  game.activeGames.set(g.id, g);
  game.playerSessions.set('old-finished-id', g.id);

  assert.equal(game.reconnectPlayer('finished-user', ws, 'fresh-finished-id'), true);

  const types = ws.messages.map((m) => m.type);
  assert.deepEqual(types.slice(0, 2), ['game_reconnected', 'game_end']);
  assert.equal(ws.messages[1].leaderboard[0].id, 'fresh-finished-id');
  assert.equal(game.playerSessions.get('fresh-finished-id'), g.id);
  assert.equal(game.playerSessions.has('old-finished-id'), false);
});


test('rejects a game start while the same account identity is already reserved', async () => {
  game.startingClients.add('u-reserved');
  await assert.rejects(
    game.startGame([
      {
        id: 'p-reserved',
        clientId: 'u-reserved',
        ws: fakeWs(),
        name: 'Alice',
        avatar: 'A',
      },
    ], null),
    /CLIENT_ALREADY_PLAYING/
  );
});

test('rejects duplicate Firebase identities inside the same game batch', async () => {
  await assert.rejects(
    game.startGame([
      { id: 'p1', clientId: 'same-uid', ws: fakeWs(), name: 'A', avatar: 'A' },
      { id: 'p2', clientId: 'same-uid', ws: fakeWs(), name: 'B', avatar: 'B' },
    ], null),
    /CLIENT_ALREADY_PLAYING/
  );
});


test('rejects an answer that arrives after the advertised question deadline', () => {
  const ws = fakeWs();
  const g = {
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: performance.now() - 10001,
    questions: [{ correct: 0 }],
    players: [
      { id: 'p1', ws, connected: true, score: 0 },
      { id: 'p2', ws: fakeWs(), connected: true, score: 0 },
    ],
    roundAnswers: {},
    roundTimer: null,
  };

  game.recordAnswer(g, 'p1', 0);
  assert.equal(g.roundAnswers.p1, undefined);
  assert.equal(g.players[0].score, 0);
});


test('solo completion does not count as a PvP win or grant a win bonus', () => {
  const ws = fakeWs();
  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn) => {
    scheduled.push(fn);
    return { unref() {} };
  };

  try {
    const g = {
      id: 'solo-result',
      mode: 'solo',
      status: 'active',
      phase: 'question',
      players: [{
        id: 'solo-player', clientId: null, ws, connected: true,
        score: 80, name: 'Solo', avatar: 'S', reconnectTimer: null,
      }],
      roundTimer: null,
    };

    game.activeGames.set(g.id, g);
    game.playerSessions.set('solo-player', g.id);
    game.endGame(g);

    const result = ws.messages.find((m) => m.type === 'game_end');
    assert.equal(result.solo, true);
    assert.equal(result.won, false);
    assert.equal(result.tie, false);
    assert.equal(result.xpBreakdown.winBonus, 0);
    assert.equal(result.xp, 120);
    assert.equal(result.coins, 20);

    scheduled[0]();
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});

test('a surviving player in a multiplayer forfeit still receives the win', () => {
  const ws = fakeWs();
  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn) => {
    scheduled.push(fn);
    return { unref() {} };
  };

  try {
    const g = {
      id: 'forfeit-result',
      mode: 'multiplayer',
      status: 'active',
      phase: 'question',
      players: [{
        id: 'survivor', clientId: null, ws, connected: true,
        score: 10, name: 'Winner', avatar: 'W', reconnectTimer: null,
      }],
      roundTimer: null,
    };

    game.activeGames.set(g.id, g);
    game.playerSessions.set('survivor', g.id);
    game.endGame(g, 'opponent_disconnected');

    const result = ws.messages.find((m) => m.type === 'game_end');
    assert.equal(result.solo, false);
    assert.equal(result.won, true);
    assert.equal(result.xpBreakdown.winBonus, 100);
    assert.equal(result.coins, 50);

    scheduled[0]();
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
