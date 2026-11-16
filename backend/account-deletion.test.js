const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { isolatedServer } = require('./test-support/isolated-server.cjs');
const uid = 'deletion-review-user';
function token(age = 0, lifetime = 3600) {
  const now = Math.floor(Date.now() / 1000);
  return `e30.${Buffer.from(JSON.stringify({ sub: uid, exp: now + lifetime, auth_time: now - age })).toString('base64url')}.test-signature`;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function connect(port, idToken) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`), events = [];
  ws.on('message', raw => events.push(JSON.parse(raw)));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const wait = async type => { for (let i = 0; i < 100; i++) { const index = events.findIndex(e => e.type === type); if (index >= 0) return events.splice(index, 1)[0]; await pause(20); } throw Error(`Missing ${type}: ${events.map(e => e.type)}`); };
  const send = data => ws.send(JSON.stringify(data));
  send({ type: 'identify', idToken, name: 'Review Author', avatar: 'robot', presentationVersion: 1 });
  return { ws, events, wait, send };
}
test('deletion erases author data, closes sockets, persists revocation and is idempotent after restart', { timeout: 30000 }, async () => {
  const jwt = token();
  const preload = path.join(__dirname, 'test-support/deletion-auth.cjs');
  let server = await isolatedServer({ FIREBASE_API_KEY: 'local-test-only' }, {
    social: { profiles: { [uid]: { name: 'Review Author', avatar: 'robot' } }, friends: {}, requests: {} },
    'topic-stats': { [uid]: { harry_potter: { games: 1, wins: 1, xp: 100 } } },
  }, false, [preload]);
  const clients = [];
  const remove = idToken => fetch(`http://127.0.0.1:${server.port}/auth/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
  try {
    const author = await connect(server.port, jwt); clients.push(author); await author.wait('identified');
    author.send({ type: 'post_create', category: 'harry_potter', text: 'A personal public post' });
    const post = (await author.wait('post_created')).post;
    assert.equal((await remove(token(0, -1))).status, 401, 'Expired credentials cannot initiate deletion');
    const old = await remove(token(3600)); assert.equal(old.status, 401); assert.equal((await old.json()).code, 'RECENT_LOGIN_REQUIRED');
    const result = await remove(jwt); assert.equal(result.status, 200); assert.deepEqual(await result.json(), { ok: true });
    await pause(80); assert.notEqual(author.ws.readyState, WebSocket.OPEN, 'Deleted socket cannot recreate its profile');
    const storedPosts = JSON.parse(fs.readFileSync(path.join(server.dir, 'posts.json')));
    assert(!storedPosts.posts.some(p => p.id === post.id));
    assert(!JSON.parse(fs.readFileSync(path.join(server.dir, 'topic-stats.json')))[uid]);
    assert.equal((await remove(jwt)).status, 200);
    const originalDir = server.dir; await server.close();
    server = await isolatedServer({ FIREBASE_API_KEY: 'local-test-only', DATA_DIR: originalDir }, {}, false, [preload]);
    assert.equal((await remove(jwt)).status, 200, 'Original deletion bearer is safe to retry after restart');
    const replay = await connect(server.port, jwt); clients.push(replay); assert.equal((await replay.wait('auth_required')).code, 'ACCOUNT_DELETED');
    assert(!replay.events.some(e => e.type === 'identified'));
  } finally { clients.forEach(c => c.ws.terminate()); await server.close(); }
});
test('failed revocation flush returns 503 and retry completes without delayed-game resurrection', { timeout: 20000 }, async () => {
  const jwt = token(), preload = path.join(__dirname, 'test-support/deletion-auth.cjs');
  const server = await isolatedServer({ FIREBASE_API_KEY: 'local-test-only', TEST_DELETE_FLUSH_FAILURE: '1', TEST_SLOW_QUESTIONS: '1' }, {}, false, [preload]);
  let author;
  try {
    author = await connect(server.port, jwt); await author.wait('identified');
    const pending = new Promise(resolve => { const listen = m => { if (m.type === 'test-questions-pending') { server.child.off('message', listen); resolve(); } }; server.child.on('message', listen); });
    author.send({ type: 'solo', category: 'harry_potter', presentationVersion: 1 }); await pending;
    const remove = () => fetch(`http://127.0.0.1:${server.port}/auth/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${jwt}` } });
    assert.equal((await remove()).status, 503, 'Never claim success before revocation is durable');
    assert.equal((await remove()).status, 200);
    await pause(600);
    assert(!author.events.some(e => e.type === 'game_start'));
    assert(!JSON.parse(fs.readFileSync(path.join(server.dir, 'stats.json')))[uid]);
    assert(!JSON.parse(fs.readFileSync(path.join(server.dir, 'social.json'))).profiles[uid]);
    const health = await (await fetch(`http://127.0.0.1:${server.port}/health`)).json(); assert.equal(health.activeGames, 0);
  } finally { author?.ws.terminate(); await server.close(); }
});
test('linked guest deletion removes cross-user references and owned uploads, and revokes guest refresh', { timeout: 20000 }, async () => {
  const crypto = require('node:crypto');
  const guest = 'guest_AAAAAAAAAAAAAAAAAAAAAAAA', peer = 'review-peer', jwt = token();
  const prefix = crypto.createHash('sha256').update(guest).digest('hex').slice(0, 24);
  const secret = 'local-deletion-review-secret-32-characters';
  const server = await isolatedServer({ FIREBASE_API_KEY: 'local-test-only', GUEST_AUTH_SECRET: secret }, {
    'account-links': { firebaseToCanonical: { [uid]: guest } },
    social: { profiles: { [guest]: { name: 'Delete me', avatar: 'robot' }, [peer]: { name: 'Peer', avatar: 'fox' } }, friends: { [guest]: [peer], [peer]: [guest] }, requests: {} },
    messages: { threads: [{ members: [guest, peer], messages: [{ id: 'm-review', fromId: guest, toId: peer, text: 'private content' }], read: {} }], themes: { [guest]: ['harry_potter'] } },
    posts: { posts: [{ id: 'peer-post', authorId: peer, authorName: 'Peer', authorAvatar: 'fox', text: 'A public discussion', reactedBy: [guest], reportedBy: [guest], createdAt: Date.now(), comments: [{ id: 'review-comment', authorId: guest, authorName: 'Delete me', authorAvatar: 'robot', text: 'My personal comment', parentId: null, reactedBy: [], createdAt: Date.now() }] }] },
    challenges: [{ id: 'challenge-review', fromId: guest, toId: peer, status: 'pending', mode: 'live', expiresAt: Date.now() + 60000 }],
    'async-challenges': [{ id: 'async-review', questions: Array.from({ length: 6 }, () => ({ text: 'A local question?', answers: ['A', 'B', 'C', 'D'], correct: 0 })), players: [{ id: guest }, { id: peer }] }],
    'match-history': { [peer]: [{ id: 'old-game', outcome: 'win', opponents: [{ id: guest, name: 'Delete me', avatar: 'robot', score: 1 }] }] },
    notifications: { [peer]: [{ type: 'friend_overtook', fromId: guest, fromName: 'Delete me', fromAvatar: 'robot', category: 'harry_potter', at: Date.now() }] },
    'user-reports': { reports: [{ reporterId: guest, targetId: peer, targetName: 'Peer' }], blocks: { [guest]: [peer], [peer]: [guest] }, flaggedNames: { peer: 1 } },
  }, false, [path.join(__dirname, 'test-support/deletion-auth.cjs')]);
  try {
    for (const directory of ['profile-photos', 'community-media']) { const dir = path.join(server.dir, directory); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, `${prefix}-${'b'.repeat(32)}.jpg`), 'local fixture'); }
    const guestToken = require('./guest-auth').issueGuestToken;
    const oldSecret = process.env.GUEST_AUTH_SECRET; process.env.GUEST_AUTH_SECRET = secret;
    const bearer = guestToken(guest).token;
    if (oldSecret === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = oldSecret;
    const result = await fetch(`http://127.0.0.1:${server.port}/auth/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${jwt}` } }); assert.equal(result.status, 200);
    for (const file of fs.readdirSync(server.dir).filter(f => f.endsWith('.json') || f.endsWith('.bak'))) { const content = fs.readFileSync(path.join(server.dir, file), 'utf8'); assert(!content.includes(guest), `Personal ID retained in ${file}`); }
    for (const directory of ['profile-photos', 'community-media']) assert.equal(fs.readdirSync(path.join(server.dir, directory)).length, 0);
    const refreshed = await (await fetch(`http://127.0.0.1:${server.port}/auth/guest`, { method: 'POST', headers: { Authorization: `Bearer ${bearer}` } })).json(); assert.notEqual(refreshed.uid, guest);
    assert.equal((await fetch(`http://127.0.0.1:${server.port}/auth/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${token(1)}` } })).status, 200, 'New verified token can retry the deleted linked account');
  } finally { await server.close(); }
});
