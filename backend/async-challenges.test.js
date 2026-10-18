const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  os = require('os'),
  path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'async-quizz-'));
const { createAsyncChallenges } = require('./async-challenges');
const questions = Array.from({ length: 6 }, (_, i) => ({
  text: `Q${i}`,
  answers: ['a', 'b', 'c', 'd'],
  correct: 2,
}));
function setup() {
  let clock = 1000,
    friendly = true,
    completed = 0;
  const challenge = {
    id: 'challenge_test',
    fromId: 'a',
    toId: 'b',
    mode: 'async',
    status: 'pending',
    category: 'nba',
    expiresAt: 999999,
  };
  const file = path.join(process.env.DATA_DIR, Math.random() + '.json');
  const options = {
    file,
    now: () => clock,
    friends: () => friendly,
    getChallenge: () => challenge,
    onComplete: () => completed++,
  };
  const store = createAsyncChallenges(options);
  store.create(challenge, questions);
  return {
    store,
    challenge,
    options,
    time: (n) => (clock += n),
    unfriend: () => (friendly = false),
    completed: () => completed,
  };
}
test('fixed questions private resumable timed rounds reject early, forged and duplicate input', async () => {
  const x = setup(),
    s = x.store;
  const first = s.play('a', x.challenge.id);
  assert.equal(first.question.opensInMs, 2050);
  assert.equal(first.question.correct, undefined);
  assert.equal(s.play('a', x.challenge.id).round, 0);
  assert.throws(() => s.play('b', x.challenge.id), /NOT_ACCEPTED/);
  assert.throws(() => s.play('outsider', x.challenge.id), /FORBIDDEN/);
  assert.throws(() => s.answer('a', x.challenge.id, 0, 2), /NOT_OPEN/);
  x.time(2050);
  assert.throws(() => s.answer('a', x.challenge.id, 0, -1), /NOT_EXPIRED/);
  const next = s.answer('a', x.challenge.id, 0, 2);
  assert.equal(next.score, 20);
  assert.equal(next.round, 1);
  assert.equal(s.answer('a', x.challenge.id, 0, 0).score, 20);
  assert.throws(() => s.answer('a', x.challenge.id, 5, 2), /INVALID_ROUND/);
  await s.flush();
  const restored = createAsyncChallenges(x.options);
  assert.equal(restored.play('a', x.challenge.id).round, 1);
  x.unfriend();
  assert.throws(() => restored.play('a', x.challenge.id), /NOT_FRIENDS/);
});
test('expired round advances once; both completions produce safe result exactly once', () => {
  const x = setup(),
    s = x.store;
  s.play('a', x.challenge.id);
  x.time(12051);
  const skipped = s.play('a', x.challenge.id);
  assert.equal(skipped.round, 1);
  assert.equal(skipped.score, 0);
  for (let i = 1; i < 6; i++) {
    x.time(2050);
    s.answer('a', x.challenge.id, i, 2);
  }
  assert.equal(s.play('a', x.challenge.id).status, 'waiting');
  assert.equal(s.play('a', x.challenge.id).result, undefined);
  assert.equal(x.completed(), 0);
  x.challenge.status = 'accepted';
  assert.equal(s.play('b', x.challenge.id).question.question, 'Q0');
  for (let i = 0; i < 6; i++) {
    x.time(2050);
    s.answer('b', x.challenge.id, i, 2);
  }
  const final = s.play('a', x.challenge.id);
  assert.equal(final.status, 'completed');
  assert.equal(final.result.scores.length, 2);
  assert.equal(x.completed(), 1);
  s.play('b', x.challenge.id);
  assert.equal(x.completed(), 1);
});

test('late answers score zero, elapsed scoring is authoritative, and terminal invitations reject play', () => {
  const x = setup();
  x.store.play('a', x.challenge.id);
  x.time(7050);
  const halfway = x.store.answer('a', x.challenge.id, 0, 2);
  assert.equal(halfway.feedback.pointsEarned, 13);
  x.time(12050);
  const late = x.store.answer('a', x.challenge.id, 1, 2);
  assert.equal(late.feedback.correct, false);
  assert.equal(late.feedback.pointsEarned, 0);
  assert.equal(late.round, 2);
  for (const index of [1.5, 4, -2, '2', null]) {
    assert.throws(() => x.store.answer('a', x.challenge.id, 2, index), /INVALID_ANSWER/);
  }
  x.challenge.status = 'declined';
  assert.throws(() => x.store.play('a', x.challenge.id), /UNAVAILABLE/);
  x.challenge.status = 'accepted';
  x.challenge.expiresAt = 0;
  assert.throws(() => x.store.play('a', x.challenge.id), /UNAVAILABLE/);
});

test('actual async completion persists one result and history per player across reload without rewards', async () => {
  const social = require('./social');
  const challenges = require('./challenges');
  const messages = require('./messaging');
  const history = require('./match-history');
  const { flushAllJsonWriters } = require('./json-writer');
  social.updateProfile('async-a', 'Alice', 'robot');
  social.updateProfile('async-b', 'Bob', 'robot');
  social.sendRequest('async-a', 'async-b');
  social.acceptRequest('async-b', 'async-a');
  const c = challenges.create('async-a', 'async-b', 'nba', 'async');
  messages.send(c.fromId, c.toId, '', { kind: 'challenge', challenge: c });
  let clock = Date.now();
  const options = { file: path.join(process.env.DATA_DIR, 'actual-run.json'), now: () => clock };
  let store = createAsyncChallenges(options);
  store.create(c, questions);
  async function finish(uid) {
    store.play(uid, c.id);
    for (let round = 0; round < 6; round++) {
      clock += 2050;
      store.answer(uid, c.id, round, 2);
    }
    await flushAllJsonWriters();
  }
  await finish(c.fromId);
  assert.equal(history.list(c.fromId).length, 0);
  await challenges.respond(c.toId, c.id, true, {
    available: () => true,
    start: () => { throw Error('Async must never start live game'); },
  });
  store = createAsyncChallenges(options);
  await finish(c.toId);
  assert.equal(history.list(c.fromId).length, 1);
  assert.equal(history.list(c.toId).length, 1);
  assert.equal(history.list(c.fromId)[0].outcome, 'tie');
  const before = messages.history(c.fromId, c.toId).messages;
  assert.equal(before.filter(m => m.kind === 'result').length, 1);
  assert.deepEqual(before.find(m => m.kind === 'result').result.outcomes,
    [{ id: c.fromId, outcome: 'tie' }, { id: c.toId, outcome: 'tie' }]);
  assert.equal(before.find(m => m.kind === 'challenge').challenge.status, 'completed');
  store = createAsyncChallenges(options);
  clock += 86400000;
  assert.equal(store.play(c.fromId, c.id).status, 'completed');
  store.answer(c.toId, c.id, 5, 0);
  assert.equal(history.list(c.fromId).length, 1);
  assert.equal(messages.history(c.fromId, c.toId).messages.filter(m => m.kind === 'result').length, 1);
  assert.equal(require('./topic-stats').getTopic(c.fromId, 'nba').xp, 0);
});

test('forfeiting retains observed wrong answers without theme XP and restart expires live cards only', async () => {
  const topics = require('./topic-stats'),
    { CATEGORIES } = require('./questions'),
    lifecycle = require('./game');
  const key = Object.keys(CATEGORIES)[0],
    q = CATEGORIES[key].questions[0];
  topics.record('forfeit-user', key, {
    answers: [{ question: q, correct: true }],
  });
  const g = {
    id: 'forfeit-streak',
    status: 'active',
    mode: 'multiplayer',
    categoryKey: key,
    phase: 'question',
    currentRound: 0,
    questions: [q],
    roundAnswers: { left: { correct: false } },
    players: [
      { id: 'left', clientId: 'forfeit-user', score: 0 },
      { id: 'other1', score: 0 },
      { id: 'other2', score: 0 },
    ],
  };
  lifecycle.removePlayer(g, 'left');
  lifecycle.removePlayer(g, 'left');
  assert.equal(topics.getTopic('forfeit-user', key).xp, 0);
  topics.record('forfeit-user', key, {
    answers: [{ question: q, correct: true }],
  });
  assert.equal(topics.getTopic('forfeit-user', key).bestStreak, 1);
  const { createChallenges } = require('./challenges');
  const file = path.join(process.env.DATA_DIR, 'restart-cards.json');
  fs.writeFileSync(
    file,
    JSON.stringify([
      {
        id: 'live',
        fromId: 'a',
        toId: 'b',
        status: 'accepted',
        gameId: 'gone',
        expiresAt: Date.now() + 10000,
      },
      {
        id: 'async',
        mode: 'async',
        fromId: 'a',
        toId: 'b',
        status: 'accepted',
        expiresAt: Date.now() + 10000,
      },
    ]),
  );
  const updates = [];
  const { createMessaging } = require('./messaging');
  const messageFile = path.join(process.env.DATA_DIR, 'restart-messages.json');
  const messages = createMessaging({ file: messageFile, friends: () => true });
  messages.send('a', 'b', '', { kind: 'challenge', challenge: { id: 'live', status: 'accepted' } });
  const cards = createChallenges({ file, notify: (c) => {
    updates.push(c);
    messages.updateChallenge(c);
  } });
  assert.equal(cards.get('live').status, 'expired');
  assert.equal(cards.get('async').status, 'accepted');
  await cards.flush();
  await messages.flush();
  assert.equal(JSON.parse(fs.readFileSync(file))[0].status, 'expired');
  assert.equal(updates[0].id, 'live');
  const restoredMessages = createMessaging({ file: messageFile, friends: () => true });
  assert.equal(restoredMessages.history('a', 'b').messages[0].challenge.status, 'expired');
});

test('revealed forfeit answers are recorded once and higher-scoring forfeits retain outcome in result DM', () => {
  const topics = require('./topic-stats');
  const social = require('./social');
  const lifecycle = require('./game');
  const messaging = require('./messaging');
  const history = require('./match-history');
  const q = require('./questions').CATEGORIES.nba.questions[0];
  social.updateProfile('forfeit-high', 'High', 'robot');
  social.updateProfile('forfeit-low', 'Low', 'robot');
  social.sendRequest('forfeit-high', 'forfeit-low');
  social.acceptRequest('forfeit-low', 'forfeit-high');
  topics.record('forfeit-high', 'nba', { answers: [{question:q, correct:true}] });
  const game = {
    id:'high-forfeit', status:'active', mode:'multiplayer', categoryKey:'nba',
    phase:'reveal', currentRound:0, questions:[q],
    players:[{id:'high', clientId:'forfeit-high', score:100}, {id:'low',clientId:'forfeit-low',score:10}, {id:'third',score:0}],
    roundAnswers:{high:{correct:false}},
    roundResults:[[{clientId:'forfeit-high', question:q, correct:false}]],
  };
  lifecycle.removePlayer(game,'high');
  lifecycle.removePlayer(game,'high');
  topics.record('forfeit-high','nba',{answers:[{question:q,correct:true}]});
  assert.equal(topics.getTopic('forfeit-high','nba').bestStreak,1);
  assert.equal(topics.getTopic('forfeit-high','nba').games,3);
  messaging.recordMatchResults(game,history.resultsFor(game));
  const result = messaging.history('forfeit-high','forfeit-low').messages[0].result;
  assert.equal(result.outcomes.find(r=>r.id==='forfeit-high').outcome,'loss');
  assert.equal(result.outcomes.find(r=>r.id==='forfeit-low').outcome,'win');
});
