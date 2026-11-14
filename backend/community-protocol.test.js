const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizz-community-ws-'));
let child, port, output = '';
const sockets = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

before(async () => {
  const probe = net.createServer().listen(0, '127.0.0.1');
  await new Promise(resolve => probe.once('listening', resolve));
  port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname, windowsHide: true,
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, CORS_ORIGIN: '*',
      GUEST_AUTH_SECRET: 'community-protocol-secret-at-least-32-characters' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error(output)), 12000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); reject(Error(`Exit ${code}: ${output}`)); });
    child.stderr.on('data', data => output += data);
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/backend on http:\/\/localhost:(\d+)/);
      if (match) { port = Number(match[1]); clearTimeout(timeout); resolve(); }
    });
  });
});
after(async () => {
  sockets.forEach(ws => ws.terminate());
  if (child && child.exitCode === null) {
    await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
  }
});

async function connect(authenticated = true) {
  const identity = authenticated ? await (await fetch(`http://127.0.0.1:${port}/auth/guest`, { method: 'POST' })).json() : null;
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  sockets.push(ws);
  const messages = [];
  ws.on('message', data => messages.push(JSON.parse(data)));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const wait = async (type, predicate = () => true) => {
    const deadline = Date.now() + 3500;
    while (Date.now() < deadline) {
      const i = messages.findIndex(m => m.type === type && predicate(m));
      if (i >= 0) return messages.splice(i, 1)[0];
      await pause(10);
    }
    throw Error(`Missing ${type}: ${JSON.stringify(messages)}`);
  };
  const send = data => ws.send(JSON.stringify(data));
  if (identity) {
    send({ type: 'identify', idToken: identity.token, name: 'Reader', avatar: 'robot' });
    await wait('identified');
    await wait('feed_list');
  }
  return { ws, send, wait, messages, uid: identity?.uid, token: identity?.token };
}

test('server boot seeds demo content and topics responses echo canonical validated selections', async () => {
  const c = await connect();
  c.send({ type: 'feed_list', scope: 'topics', categories: ['marvel', 'invalid', 'harry_potter', 'marvel'] });
  const feed = await c.wait('feed_list');
  assert.equal(feed.scope, 'topics');
  assert.deepEqual(feed.categories, ['harry_potter', 'marvel']);
  assert.equal(feed.category, null);
  assert.ok(feed.posts.length > 0);
  assert.ok(feed.posts.every(p => p.isDemo && !p.reactions && !p.commentsCount && ['marvel', 'harry_potter'].includes(p.category)));
  c.send({ type: 'feed_list', scope: 'topics', categories: [] });
  assert.deepEqual((await c.wait('feed_list')).posts, []);
  c.send({ type: 'feed_list', scope: 'topics', categories: 'marvel' });
  assert.deepEqual((await c.wait('feed_list')).posts, []);
  c.send({ type: 'feed_list', scope: 'all' });
  assert.equal((await c.wait('feed_list')).posts.filter(p => p.isDemo).length, 8);
});

test('authenticated replies and comment likes broadcast confirmed identity, survive refresh and respect blocks', async () => {
  const a = await connect(), b = await connect();
  a.send({ type: 'post_create', text: 'Protocol thread', category: 'marvel', isDemo: true, demoAvatar: 'https://evil.test/fake.jpg' });
  const p = (await a.wait('post_created')).post;
  assert.equal(!!p.isDemo, false);
  assert.equal(!!p.demoAvatar, false);
  a.send({ type: 'post_comment', postId: p.id, text: 'Root' });
  const root = (await a.wait('post_commented')).comment;
  assert.equal(root.parentId, null);
  b.send({ type: 'post_comment', postId: p.id, text: 'Reply', parentId: root.id });
  const reply = (await b.wait('post_commented', m => m.comment.text === 'Reply')).comment;
  assert.equal(reply.parentId, root.id);
  a.send({ type: 'comment_react', postId: p.id, commentId: reply.id, actorId: 'spoofed' });
  const reaction = await a.wait('post_comment_reacted');
  assert.deepEqual(reaction, { type: 'post_comment_reacted', postId: p.id, commentId: reply.id, actorId: a.uid, reactions: 1, reacted: true });
  assert.equal((await b.wait('post_comment_reacted')).actorId, a.uid);
  a.send({ type: 'post_comments', postId: p.id });
  assert.equal((await a.wait('post_comments')).comments.find(c => c.id === reply.id).reacted, true);
  b.send({ type: 'post_comments', postId: p.id });
  assert.equal((await b.wait('post_comments')).comments.find(c => c.id === reply.id).reacted, false);
  a.send({ type: 'post_comment', postId: p.id, text: 'Nested', parentId: reply.id });
  assert.equal((await a.wait('community_error')).code, 'INVALID_POST_ACTION');
  const blocked = await fetch(`http://127.0.0.1:${port}/users/block`, {
    method: 'POST', headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetId: b.uid }),
  });
  assert.equal(blocked.status, 200);
  b.send({ type: 'post_comment', postId: p.id, text: 'Blocked interaction' });
  assert.equal((await b.wait('community_error')).code, 'INVALID_POST_ACTION');
});

test('comment reactions reject anonymous, missing targets and rate-limited authenticated actions', async () => {
  const anonymous = await connect(false);
  anonymous.send({ type: 'comment_react', postId: 'missing', commentId: 'missing' });
  assert.equal((await anonymous.wait('community_error')).code, 'AUTH_REQUIRED');
  const a = await connect();
  // Space requests so the action quota, rather than the socket burst guard, is exercised.
  for (let i = 0; i < 31; i++) {
    a.send({ type: 'comment_react', postId: 'missing', commentId: 'missing' });
    assert.equal((await a.wait('community_error')).code, i < 30 ? 'INVALID_POST_ACTION' : 'COMMUNITY_RATE_LIMITED');
    await pause(145);
  }
});
