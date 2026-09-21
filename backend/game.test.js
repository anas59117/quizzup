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


test('reconnect after the answer deadline marks the question as expired', () => {
  const ws = fakeWs();
  const g = {
    id: 'expired-reconnect',
    status: 'active',
    phase: 'question',
    currentRound: 0,
    questionStart: performance.now() - 10001,
    questions: [{
      text: 'Q', category: 'Test', icon: 'T',
      answers: ['A', 'B', 'C', 'D'], correct: 0,
    }],
    players: [
      {
        id: 'old-expired', clientId: 'expired-user', ws: null, connected: false,
        score: 0, name: 'A', avatar: 'A', reconnectTimer: null,
      },
      {
        id: 'other-expired', clientId: 'other-user', ws: fakeWs(), connected: true,
        score: 0, name: 'B', avatar: 'B', reconnectTimer: null,
      },
    ],
    roundAnswers: {},
    roundTimer: null,
    reported: new Set(),
  };

  game.activeGames.set(g.id, g);
  game.playerSessions.set('old-expired', g.id);

  assert.equal(game.reconnectPlayer('expired-user', ws, 'new-expired'), true);
  const question = ws.messages.find((m) => m.type === 'question');
  assert.equal(question.expired, true);
  assert.equal(question.answered, false);
});


test('multiplayer rematch waits until every player requests it', () => {
  const g = {
    id: 'finished-rematch',
    status: 'finished',
    phase: 'finished',
    mode: 'multiplayer',
    categoryKey: 'sports',
    finishedAt: Date.now(),
    rematchRequests: new Set(),
    players: [
      { id: 'p1', clientId: 'u1', ws: fakeWs(), name: 'A', avatar: 'A', score: 10 },
      { id: 'p2', clientId: 'u2', ws: fakeWs(), name: 'B', avatar: 'B', score: 5 },
    ],
  };
  game.activeGames.set(g.id, g);

  const first = game.requestRematch('u1');
  assert.equal(first.status, 'waiting');
  assert.equal(g.rematchRequests.has('u1'), true);

  const second = game.requestRematch('u2');
  assert.equal(second.status, 'ready');
  assert.equal(second.categoryKey, 'sports');
  assert.deepEqual(second.players.map((p) => p.clientId), ['u1', 'u2']);
  assert.equal(g.rematchRequests.size, 0);
});

test('solo rematch is immediately ready on the same category', () => {
  const g = {
    id: 'finished-solo-rematch',
    status: 'finished',
    phase: 'finished',
    mode: 'solo',
    categoryKey: 'science',
    finishedAt: Date.now(),
    rematchRequests: new Set(),
    players: [
      { id: 'solo', clientId: 'solo-u', ws: fakeWs(), name: 'Solo', avatar: 'S', score: 42 },
    ],
  };
  game.activeGames.set(g.id, g);

  const request = game.requestRematch('solo-u');
  assert.equal(request.status, 'ready');
  assert.equal(request.categoryKey, 'science');
  assert.equal(request.players.length, 1);
});

test('rematch can be cancelled before the other player accepts', () => {
  const g = {
    id: 'finished-cancel-rematch',
    status: 'finished',
    phase: 'finished',
    mode: 'multiplayer',
    categoryKey: null,
    finishedAt: Date.now(),
    rematchRequests: new Set(),
    players: [
      { id: 'p1', clientId: 'u1', ws: fakeWs(), name: 'A', avatar: 'A', score: 1 },
      { id: 'p2', clientId: 'u2', ws: fakeWs(), name: 'B', avatar: 'B', score: 0 },
    ],
  };
  game.activeGames.set(g.id, g);

  assert.equal(game.requestRematch('u1').status, 'waiting');
  assert.equal(game.cancelRematch('u1'), true);
  assert.equal(g.rematchRequests.size, 0);
  assert.equal(game.requestRematch('u2').status, 'waiting');
});


test('disconnect grace remains 15 seconds while finished games retain rematch state for 60 seconds', () => {
  const originalSetTimeout = global.setTimeout;
  const delays = [];
  global.setTimeout = (fn, delay) => {
    delays.push(delay);
    return { unref() {} };
  };

  try {
    const disconnectGame = {
      id: 'grace-check',
      status: 'active',
      phase: 'intro',
      players: [
        {
          id: 'gone', clientId: 'u-gone', ws: fakeWs(), connected: true,
          score: 0, name: 'Gone', avatar: 'G', reconnectTimer: null,
        },
        {
          id: 'stay', clientId: 'u-stay', ws: fakeWs(), connected: true,
          score: 0, name: 'Stay', avatar: 'S', reconnectTimer: null,
        },
      ],
      roundAnswers: {},
      roundTimer: null,
    };
    game.disconnectPlayer(disconnectGame, 'gone');
    assert.equal(delays[0], 15000);

    const finishedGame = {
      id: 'retention-check',
      mode: 'multiplayer',
      status: 'active',
      phase: 'question',
      players: [{
        id: 'winner', clientId: null, ws: fakeWs(), connected: true,
        score: 1, name: 'Winner', avatar: 'W', reconnectTimer: null,
      }],
      roundTimer: null,
    };
    game.endGame(finishedGame);
    assert.equal(delays.at(-1), 60000);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});


test('finished game can silently reattach a new socket for rematch', () => {
  const oldWs = { readyState: 3, messages: [], send() {} };
  const newWs = fakeWs();
  const g = {
    id: 'silent-finished',
    status: 'finished',
    phase: 'finished',
    finishedAt: Date.now(),
    roundAnswers: {},
    players: [{
      id: 'old-silent',
      clientId: 'silent-user',
      ws: oldWs,
      connected: true,
      score: 12,
      name: 'A',
      avatar: 'A',
      reconnectTimer: null,
      finalResult: {
        type: 'game_end',
        leaderboard: [{ id: 'old-silent', name: 'A', avatar: 'A', score: 12 }],
      },
    }],
  };
  game.activeGames.set(g.id, g);
  game.playerSessions.set('old-silent', g.id);

  assert.equal(
    game.reattachFinishedPlayer('silent-user', newWs, 'new-silent'),
    true
  );
  assert.equal(newWs.messages.length, 0);
  assert.equal(g.players[0].ws, newWs);
  assert.equal(g.players[0].id, 'new-silent');
  assert.equal(g.players[0].finalResult.leaderboard[0].id, 'new-silent');
  assert.equal(game.playerSessions.get('new-silent'), g.id);
});


test('pending rematch request is released when finished-game retention expires', () => {
  const ws = fakeWs();
  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn, delay) => {
    scheduled.push({ fn, delay });
    return { unref() {} };
  };

  try {
    const g = {
      id: 'rematch-expiry',
      mode: 'multiplayer',
      status: 'active',
      phase: 'question',
      categoryKey: 'sports',
      rematchRequests: new Set(),
      players: [{
        id: 'p1', clientId: null, ws, connected: true,
        score: 5, name: 'A', avatar: 'A', reconnectTimer: null,
      }],
      roundTimer: null,
    };
    game.activeGames.set(g.id, g);
    game.playerSessions.set('p1', g.id);
    game.endGame(g);

    // Simulate a retained rematch request after game_end. This test uses a
    // null client id to avoid touching persistent stats.
    g.players[0].clientId = 'rematch-user';
    g.rematchRequests.add('rematch-user');

    const cleanup = scheduled.find((entry) => entry.delay === 60000);
    assert.ok(cleanup);
    cleanup.fn();

    assert.equal(
      ws.messages.some((m) => m.type === 'rematch_unavailable'),
      true
    );
    assert.equal(g.rematchRequests.size, 0);
    assert.equal(game.activeGames.has(g.id), false);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
