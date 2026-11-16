const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { isolatedServer } = require('./test-support/isolated-server.cjs');

const pending = { version: 1, status: 'pending', rulesSeen: false, communitySeen: false, progressionSeen: false, profileComplete: false };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const firebaseToken = uid => `e30.${Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000) })).toString('base64url')}.test-signature`;

async function session(server, token) {
  const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`), messages = [], receivedTypes = [];
  ws.on('message', raw => { const message = JSON.parse(raw); messages.push(message); receivedTypes.push(message.type); });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const send = data => ws.send(JSON.stringify(data));
  const wait = async type => {
    for (let i = 0; i < 150; i++) {
      const index = messages.findIndex(message => message.type === type);
      if (index >= 0) return messages.splice(index, 1)[0];
      await pause(10);
    }
    throw Error(`Missing ${type}: ${messages.map(message => message.type)}`);
  };
  const client = { ws, send, wait, messages, receivedTypes };
  if (token) {
    send({ type: 'identify', idToken: token, name: 'Initial', avatar: 'robot' });
    client.identified = await wait('identified');
  }
  return client;
}
async function guest(server) {
  return (await fetch(`http://127.0.0.1:${server.port}/auth/guest`, { method: 'POST' })).json();
}
async function update(client, action, extra = {}) {
  client.send({ type: 'onboarding_update', action, ...extra });
  const ack = await client.wait('onboarding_updated');
  assert.equal(ack.clientId, client.identified.profile.id);
  return ack.onboarding;
}
async function fixture(t, env = {}, seed = {}, preloads = []) {
  const servers = [await isolatedServer(env, seed, false, preloads)], clients = [];
  t.after(async () => {
    clients.forEach(client => client.ws.terminate());
    for (const server of servers) await server.close();
    for (const server of servers) fs.rmSync(server.dir, { recursive: true, force: true });
  });
  return {
    get server() { return servers.at(-1); },
    async connect(token) { const client = await session(servers.at(-1), token); clients.push(client); return client; },
    async restart() {
      clients.forEach(client => client.ws.terminate());
      const current = servers.at(-1); await current.close();
      servers.push(await isolatedServer({ ...env, DATA_DIR: current.dir, GUEST_AUTH_SECRET: current.secret }, {}, false, preloads));
    },
  };
}

test('new identities receive private pending onboarding before stats; only successful profile acknowledgement completes profile', async t => {
  const f = await fixture(t), identity = await guest(f.server), client = await f.connect(identity.token);
  assert.deepEqual(client.identified.onboarding, pending);
  assert.equal(client.identified.profile.onboarding, undefined);
  const beforeStats = (await client.wait('stats')).stats;
  assert(client.receivedTypes.indexOf('identified') < client.receivedTypes.indexOf('stats'));
  client.send({ type: 'profile_update', name: 'sale connard', avatar: 'robot' });
  assert.equal((await client.wait('profile_update_failed')).code, 'CONTENT_NOT_ALLOWED');
  assert.equal((await update(client, 'rules')).profileComplete, false);
  client.send({ type: 'profile_update', name: 'Nova', avatar: 'fox' });
  const ack = await client.wait('profile_updated');
  assert.equal(ack.onboarding.profileComplete, true);
  assert.equal(ack.profile.onboarding, undefined);
  const fresh = await f.connect(identity.token);
  assert.equal(fresh.identified.onboarding.profileComplete, true);
  assert.equal(fresh.identified.profile.name, 'Nova');
  assert.deepEqual((await fresh.wait('stats')).stats, beforeStats);
});

test('skip is idempotent, never bypasses profile, dominates late completion and persists across sockets and restart', async t => {
  const f = await fixture(t), identity = await guest(f.server), client = await f.connect(identity.token);
  const skipped = await update(client, 'skip');
  assert.deepEqual(skipped, { ...pending, status: 'skipped' });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.server.dir, 'social.json'))).profiles[identity.uid].onboarding, skipped, 'ACK follows durable persistence');
  assert.deepEqual(await update(client, 'skip'), skipped);
  assert.deepEqual(await update(client, 'complete'), skipped);
  const otherSocket = await f.connect(identity.token);
  assert.deepEqual(otherSocket.identified.onboarding, skipped);
  await update(otherSocket, 'community');
  await update(client, 'rules');
  client.send({ type: 'profile_update', name: 'Saved', avatar: 'robot' });
  assert.equal((await client.wait('profile_updated')).onboarding.profileComplete, true);
  await f.restart();
  const restored = await f.connect(identity.token);
  assert.deepEqual(restored.identified.onboarding, { ...skipped, rulesSeen: true, communitySeen: true, profileComplete: true });
});

test('completion requires only an acknowledged profile and merges optional seen actions monotonically', async t => {
  const f = await fixture(t), identity = await guest(f.server), client = await f.connect(identity.token);
  client.send({ type: 'onboarding_update', action: 'complete' });
  assert.equal((await client.wait('onboarding_update_failed')).code, 'ONBOARDING_INCOMPLETE');
  client.send({ type: 'profile_update', name: 'Complete', avatar: 'robot' }); await client.wait('profile_updated');
  const completed = await update(client, 'complete');
  assert.deepEqual(completed, { ...pending, status: 'completed', profileComplete: true });
  assert.deepEqual(await update(client, 'complete'), completed);
  for (const action of ['rules', 'community', 'progression']) await update(client, action);
  await f.restart();
  assert.deepEqual((await f.connect(identity.token)).identified.onboarding, { ...completed, rulesSeen: true, communitySeen: true, progressionSeen: true });
});

test('old profiles migrate to legacy without a welcome and validated persisted state survives normalization', async t => {
  const uid = 'legacy-onboarding-user', savedUid = 'saved-onboarding-user';
  const saved = { ...pending, status: 'skipped', rulesSeen: true, profileComplete: true };
  const f = await fixture(t, { FIREBASE_API_KEY: 'local-test-only' }, { social: { profiles: {
    [uid]: { name: 'Existing', avatar: 'robot' }, [savedUid]: { name: 'Saved', avatar: 'robot', onboarding: saved },
  }, friends: {}, requests: {} } }, [path.join(__dirname, 'test-support/deletion-auth.cjs')]);
  const legacy = await f.connect(firebaseToken(uid));
  assert.deepEqual(legacy.identified.onboarding, { ...pending, status: 'legacy', profileComplete: true });
  assert.deepEqual((await f.connect(firebaseToken(savedUid))).identified.onboarding, saved);
  await update(legacy, 'rules');
  assert.equal((await update(legacy, 'complete')).status, 'legacy');
});

test('onboarding rejects anonymous, unknown and forged payloads; cannot mutate another account or publish private state', async t => {
  const f = await fixture(t), anonymous = await f.connect();
  anonymous.send({ type: 'onboarding_update', action: 'skip' });
  assert.equal((await anonymous.wait('onboarding_update_failed')).code, 'AUTH_REQUIRED');
  const firstId = await guest(f.server), secondId = await guest(f.server);
  const first = await f.connect(firstId.token), second = await f.connect(secondId.token);
  for (const action of ['reset', true, null, {}]) {
    first.send({ type: 'onboarding_update', action });
    assert.equal((await first.wait('onboarding_update_failed')).code, 'INVALID_ACTION');
  }
  for (const extra of [{ targetId: secondId.uid }, { uid: secondId.uid }, { profileComplete: true }, { onboarding: { ...pending, status: 'completed' } }]) {
    first.send({ type: 'onboarding_update', action: 'skip', ...extra });
    assert.equal((await first.wait('onboarding_update_failed')).code, 'INVALID_PAYLOAD');
  }
  first.send({ type: 'friend_request', targetId: secondId.uid }); await first.wait('friend_request_sent');
  const request = await second.wait('friend_request_received');
  assert.equal(request.from.onboarding, undefined);
  assert.deepEqual((await f.connect(secondId.token)).identified.onboarding, pending);
  assert.deepEqual((await f.connect(firstId.token)).identified.onboarding, pending);
});

test('linking Google retains the canonical guest onboarding; deletion erases it and revokes restoration', async t => {
  const f = await fixture(t, { FIREBASE_API_KEY: 'local-test-only' }, {}, [path.join(__dirname, 'test-support/deletion-auth.cjs')]);
  const identity = await guest(f.server), client = await f.connect(identity.token), bearer = firebaseToken('onboarding-linked-google');
  const skipped = await update(client, 'skip');
  const link = await fetch(`http://127.0.0.1:${f.server.port}/auth/link-google`, { method: 'POST', headers: { Authorization: `Bearer ${identity.token}`, 'X-Firebase-Id-Token': bearer } });
  assert.equal(link.status, 200);
  assert.deepEqual((await f.connect(bearer)).identified.onboarding, skipped);
  const deletion = await fetch(`http://127.0.0.1:${f.server.port}/auth/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${bearer}` } });
  assert.equal(deletion.status, 200);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.server.dir, 'social.json'))).profiles[identity.uid], undefined);
  await f.restart();
  const revoked = await session(f.server);
  try {
    revoked.send({ type: 'identify', idToken: identity.token });
    assert.equal((await revoked.wait('auth_required')).code, 'ACCOUNT_DELETED');
  } finally { revoked.ws.terminate(); }
  const replacement = await guest(f.server);
  assert.notEqual(replacement.uid, identity.uid);
  assert.deepEqual((await f.connect(replacement.token)).identified.onboarding, pending);
});

test('onboarding update rate limit is shared by new sockets for the same account', async t => {
  const f = await fixture(t), identity = await guest(f.server);
  const clients = [];
  for (let i = 0; i < 4; i++) clients.push(await f.connect(identity.token));
  for (let i = 0; i < 30; i++) await update(clients[i % 4], 'rules');
  const last = clients[3];
  last.send({ type: 'onboarding_update', action: 'skip' });
  const failed = await last.wait('onboarding_update_failed');
  assert.equal(failed.code, 'ONBOARDING_RATE_LIMITED');
  assert.equal(failed.clientId, identity.uid);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.server.dir, 'social.json'))).profiles[identity.uid].onboarding.status, 'pending');
});
