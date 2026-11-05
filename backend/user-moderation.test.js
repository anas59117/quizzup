const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const WebSocket = require('ws');
const { isolatedServer } = require('./test-support/isolated-server.cjs');
const aliceId = 'guest_AAAAAAAAAAAAAAAAAAAAAAAA', bobId = 'guest_BBBBBBBBBBBBBBBBBBBBBBBB';
const firebaseToken = 'firebase-linked-review-token';
const pause = ms => new Promise(r => setTimeout(r, ms));
async function connect(port, token, name) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`), events = [];
  ws.on('message', raw => events.push(JSON.parse(raw)));
  const wait = async type => {
    for (let i = 0; i < 150; i++) {
      const index = events.findIndex(event => event.type === type);
      if (index >= 0) return events.splice(index, 1)[0];
      await pause(20);
    }
    throw new Error(`Missing ${type}: ${events.map(e => e.type).join(',')}`);
  };
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const send = payload => ws.send(JSON.stringify(payload));
  send({ type: 'identify', idToken: token, name, avatar: 'robot', presentationVersion: 1 });
  await wait('identified');
  return { ws, events, wait, send };
}
test('canonical moderation identity, validation, blocking contacts/matchmaking and restart', { timeout: 30000 }, async () => {
  const secret = crypto.randomBytes(32).toString('hex');
  const previous = process.env.GUEST_AUTH_SECRET; process.env.GUEST_AUTH_SECRET = secret;
  const bobToken = require('./guest-auth').issueGuestToken(bobId).token;
  if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  const preload = path.join(__dirname, 'test-support/canonical-auth.cjs');
  let server = await isolatedServer({ GUEST_AUTH_SECRET: secret }, { social: {
    profiles: { [aliceId]: { name: 'Alice', avatar: 'robot' }, [bobId]: { name: 'Bob', avatar: 'fox' } },
    friends: { [aliceId]: [bobId], [bobId]: [aliceId] }, requests: {},
  } }, false, [preload]);
  const clients = [];
  const post = (route, token, body) => fetch(`http://127.0.0.1:${server.port}/users/${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post('report', null, { targetId: bobId })).status, 401);
    assert.equal((await post('report', 'invalid-token', { targetId: bobId })).status, 401);
    for (const route of ['report', 'block']) for (const targetId of [null, {}, [], aliceId, 'x'.repeat(201)])
      assert.equal((await post(route, firebaseToken, { targetId })).status, 400);
    const reported = await post('report', firebaseToken, { targetId: bobId, targetName: 'Bob', reason: 'insultes' });
    assert.deepEqual(await reported.json(), { ok: true });
    const persisted = JSON.parse(fs.readFileSync(path.join(server.dir, 'user-reports.json'), 'utf8'));
    assert.equal(persisted.reports[0].reporterId, aliceId, 'Use canonical UID rather than raw Firebase UID');
    const alice = await connect(server.port, firebaseToken, 'Alice'), bob = await connect(server.port, bobToken, 'Bob');
    clients.push(alice, bob);
    assert.equal((await alice.wait('friends_list')).friends.length, 1);
    alice.send({ type: 'challenge_create', targetId: bobId, category: 'harry_potter' });
    const invitation = await bob.wait('dm');
    bob.send({ type: 'follow', targetId: aliceId });
    await alice.wait('new_follower'); await bob.wait('follow_updated');
    alice.send({ type: 'create_room', category: 'harry_potter' });
    const waitingRoom = await alice.wait('room_created');
    bob.send({ type: 'join_room', code: waitingRoom.code }); await bob.wait('room_update');
    const blocked = await post('block', firebaseToken, { targetId: bobId });
    assert.deepEqual(await blocked.json(), { ok: true });
    await bob.wait('friend_removed'); await alice.wait('friend_removed');
    alice.send({ type: 'start_room', code: waitingRoom.code });
    await alice.wait('match_aborted'); await bob.wait('match_aborted');
    assert(!clients.some(client => client.events.some(event => event.type === 'error')));
    bob.send({ type: 'follow', targetId: aliceId });
    const follow = await bob.wait('follow_updated');
    assert.equal(follow.isFollowing, false); assert.equal(follow.reason, 'blocked');
    bob.send({ type: 'dm', targetId: aliceId, text: 'Unwanted message', clientMessageId: 'blocked' });
    assert.equal((await bob.wait('social_error')).code, 'NOT_FRIENDS');
    bob.send({ type: 'challenge_create', targetId: aliceId, category: 'harry_potter' });
    assert.equal((await bob.wait('social_error')).code, 'NOT_FRIENDS');
    bob.send({ type: 'challenge_respond', challengeId: invitation.message.challenge.id, accept: true });
    assert.equal((await bob.wait('social_error')).code, 'NOT_FRIENDS');
    for (const [client, targetId] of [[alice, bobId], [bob, aliceId]]) {
      client.send({ type: 'friend_request', targetId });
      assert.equal((await client.wait('friend_request_rejected')).reason, 'blocked');
      client.send({ type: 'join', category: 'harry_potter', presentationVersion: 1 });
      await client.wait('waiting');
    }
    await pause(200);
    assert(!clients.some(client => client.events.some(event => event.type === 'game_start')));
    for (const client of clients) client.send({ type: 'cancel_queue' });
    await pause(50);
    alice.send({ type: 'create_room', category: 'harry_potter' });
    const room = await alice.wait('room_created');
    bob.send({ type: 'join_room', code: room.code });
    await bob.wait('room_unavailable');
    clients.forEach(client => client.ws.terminate());
    const dir = server.dir; await server.close();
    server = await isolatedServer({ GUEST_AUTH_SECRET: secret, DATA_DIR: dir }, {}, false, [preload]);
    const recovered = await connect(server.port, bobToken, 'Bob'); clients.push(recovered);
    assert.equal((await recovered.wait('friends_list')).friends.length, 0);
    recovered.send({ type: 'friend_request', targetId: aliceId });
    assert.equal((await recovered.wait('friend_request_rejected')).reason, 'blocked');
  } finally { clients.forEach(client => client.ws.terminate()); await server.close(); }
});

test('moderation resolves a legacy opponent transport ID only within the requester match', { timeout: 15000 }, async () => {
  const secret = crypto.randomBytes(32).toString('hex');
  const previous = process.env.GUEST_AUTH_SECRET; process.env.GUEST_AUTH_SECRET = secret;
  const bobToken = require('./guest-auth').issueGuestToken(bobId).token;
  if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  const server = await isolatedServer({ GUEST_AUTH_SECRET: secret }, {}, false, [path.join(__dirname, 'test-support/canonical-auth.cjs')]);
  const clients = [];
  try {
    const alice = await connect(server.port, firebaseToken, 'Alice'), bob = await connect(server.port, bobToken, 'Bob'); clients.push(alice, bob);
    for (const client of clients) client.send({ type: 'join', category: 'harry_potter', presentationVersion: 1 });
    const start = await alice.wait('game_start'); await bob.wait('game_start');
    const targetId = start.opponents[0].id;
    assert.notEqual(targetId, bobId);
    const request = target => fetch(`http://127.0.0.1:${server.port}/users/block`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${firebaseToken}` }, body: JSON.stringify({ targetId: target }) });
    assert.equal((await request('player_unrelated')).status, 400);
    assert.deepEqual(await (await request(targetId)).json(), { ok: true });
    const stored = JSON.parse(fs.readFileSync(path.join(server.dir, 'user-reports.json'), 'utf8'));
    assert.deepEqual(stored.blocks[aliceId], [bobId]);
    bob.send({ type: 'game_chat', text: 'Must not arrive' });
    await bob.wait('game_chat_sent'); await pause(100);
    assert(!alice.events.some(event => event.type === 'game_chat'));
  } finally { clients.forEach(client => client.ws.terminate()); await server.close(); }
});

test('repeated moderation requests are rate limited before forcing more storage flushes', { timeout: 15000 }, async () => {
  const server = await isolatedServer({}, {}, false, [path.join(__dirname, 'test-support/canonical-auth.cjs')]);
  try {
    const statuses = [];
    for (let i = 0; i < 40; i++) {
      const response = await fetch(`http://127.0.0.1:${server.port}/users/report`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${firebaseToken}` }, body: JSON.stringify({ targetId: bobId }) });
      statuses.push(response.status); await response.arrayBuffer();
    }
    assert(statuses.includes(200)); assert(statuses.includes(429));
    assert.equal(JSON.parse(fs.readFileSync(path.join(server.dir, 'user-reports.json'), 'utf8')).reports.length, 1);
  } finally { await server.close(); }
});
