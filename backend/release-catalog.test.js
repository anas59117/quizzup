const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'release-catalog-'));
const excluded = require('../frontend/src/releaseExcludedTopics.json');
const { CATEGORIES, listCategories, getQuestions, getMixedQuestions, categoryPool } = require('./questions');
const { createAsyncChallenges } = require('./async-challenges');

test('release lists and random pools exclude every blocked bank while raw banks remain intact', async () => {
  assert.equal(excluded.length, 33);
  const listed = new Set(listCategories().map(c => c.key));
  for (const key of excluded) {
    assert.ok(CATEGORIES[key], key);
    assert.ok(!listed.has(key), key);
    assert.throws(() => getQuestions(6, key), /CATEGORY_UNAVAILABLE/, key);
    await assert.rejects(getMixedQuestions(6, key), /CATEGORY_UNAVAILABLE/, key);
  }
  // Inspect the complete fallback pool, including categories omitted by callers.
  const randomPool = categoryPool(null);
  assert.ok(randomPool.length > 0);
  assert.ok(randomPool.every(q => !excluded.includes(q._categoryKey)));
  assert.equal(randomPool.length, listCategories().reduce((n, c) => n + c.count, 0));
  assert.equal(getQuestions(6, 'nba').length, 6);
});

test('persisted async runs reject blocked challenge and run categories on play and answer', async () => {
  for (const blockedRecord of ['challenge', 'run']) {
    const challenge = { id: 'old', fromId: 'a', toId: 'b', mode: 'async', status: 'accepted', category: blockedRecord === 'challenge' ? 'got' : 'nba', expiresAt: Date.now() + 60000 };
    const run = { ...challenge, category: blockedRecord === 'run' ? 'got' : 'nba', questions: getQuestions(6, 'nba'), players: [{id:'a', round:0, score:0, opensAt:null, feedback:[]}, {id:'b', round:0, score:0, opensAt:null, feedback:[]}] };
    const file = path.join(process.env.DATA_DIR, blockedRecord + '.json');
    fs.writeFileSync(file, JSON.stringify([run]));
    const store = createAsyncChallenges({ file, friends: () => true, getChallenge: () => challenge });
    assert.throws(() => store.play('a', 'old'), /CATEGORY_UNAVAILABLE/);
    assert.throws(() => store.answer('a', 'old', 0, 0), /CATEGORY_UNAVAILABLE/);
    assert.throws(() => store.play('outsider', 'old'), /CHALLENGE_FORBIDDEN/);
    await store.flush();
  }
});
const WebSocket = require('ws');
const { isolatedServer } = require('./test-support/isolated-server.cjs');

test('authenticated direct gameplay and old challenge requests cannot serve excluded topics', { timeout: 20000 }, async () => {
  const secret = 'release-catalog-secret-with-at-least-32-characters';
  const previous = process.env.GUEST_AUTH_SECRET;
  process.env.GUEST_AUTH_SECRET = secret;
  const { issueGuestToken } = require('./guest-auth');
  const a = issueGuestToken(), b = issueGuestToken();
  if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  const challenges = ['live', 'async'].map(mode => ({ id: 'old_' + mode, fromId: a.uid, toId: b.uid, mode, status: 'pending', category: 'got', expiresAt: Date.now() + 60000 }));
  const server = await isolatedServer({ GUEST_AUTH_SECRET: secret }, { challenges, social: { profiles: {}, friends: { [a.uid]: [b.uid], [b.uid]: [a.uid] }, requests: {} } });
  let ws;
  try {
    ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
    const messages = [];
    ws.on('message', raw => messages.push(JSON.parse(raw)));
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    const wait = async type => {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const index = messages.findIndex(m => m.type === type);
        if (index !== -1) return messages.splice(index, 1)[0];
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw Error(`Missing ${type}: ${JSON.stringify(messages)}`);
    };
    ws.send(JSON.stringify({ type: 'identify', idToken: b.token, name: 'Release test', avatar: 'robot' }));
    await wait('identified');
    const listed = await (await fetch(`http://127.0.0.1:${server.port}/categories`)).json();
    assert.ok(listed.every(c => !excluded.includes(c.key)));
    for (const type of ['solo', 'join', 'create_room']) {
      for (const category of ['got']) {
        ws.send(JSON.stringify({ type, category, name: 'Release test' }));
        assert.equal((await wait('error')).code, 'CATEGORY_UNAVAILABLE');
      }
    }
    for (const mode of ['live', 'async']) {
      ws.send(JSON.stringify({ type: 'challenge_respond', challengeId: 'old_' + mode, accept: true }));
      assert.equal((await wait('social_error')).code, 'CATEGORY_UNAVAILABLE');
      ws.send(JSON.stringify({ type: 'challenge_create', targetId: a.uid, category: 'got', mode }));
      assert.equal((await wait('social_error')).code, 'INVALID_CATEGORY');
    }
    assert.ok(!messages.some(m => ['joined', 'waiting', 'room_created', 'question', 'game_start'].includes(m.type)));
  } finally {
    if (ws) ws.terminate();
    await server.close();
  }
});
