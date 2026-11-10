const test = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const { isolatedServer } = require('./test-support/isolated-server.cjs');

function connect(port, sockets, options) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, options);
    sockets.push(ws); ws.on('error', reject); ws.once('open', () => resolve(ws));
  });
}

test('a native socket can connect with browser origins restricted, and still has to identify', { timeout: 15000 }, async () => {
  const origin = 'https://quizzup.example';
  const server = await isolatedServer({ CORS_ORIGIN: origin });
  const sockets = [];
  try {
    const native = await connect(server.port, sockets);
    const authRequired = new Promise(resolve => native.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.type === 'auth_required') resolve(message.code);
    }));
    native.send(JSON.stringify({ type: 'solo', category: 'sports' }));
    assert.equal(await authRequired, 'IDENTIFY_FIRST');
    await connect(server.port, sockets, { origin });
    for (const blockedOrigin of ['https://foreign.example', 'null']) {
      const blocked = new WebSocket(`ws://127.0.0.1:${server.port}/ws`, { origin: blockedOrigin });
      sockets.push(blocked);
      const status = await new Promise((resolve, reject) => {
        blocked.on('error', () => {});
        blocked.once('open', () => reject(new Error(`Unexpected allowed origin: ${blockedOrigin}`)));
        blocked.once('unexpected-response', (_, response) => {
          response.resume(); blocked.terminate(); resolve(response.statusCode);
        });
      });
      assert.equal(status, 403);
    }
  } finally { sockets.forEach(ws => ws.terminate()); await server.close(); }
});

test('shutdown drains HTTP authentication and refuses late account mutations', { timeout: 15000 }, async () => {
  const server = await isolatedServer({}, {}, false, [path.join(__dirname, 'test-support/slow-firebase.cjs')]);
  const previous = process.env.GUEST_AUTH_SECRET;
  try {
    process.env.GUEST_AUTH_SECRET = server.secret;
    const auth = require('./guest-auth').issueGuestToken();
    const started = new Promise(resolve => server.child.on('message', message => { if (message.type === 'test-firebase-started') resolve(); }));
    const request = fetch(`http://127.0.0.1:${server.port}/auth/link-google`, {
      method: 'POST', headers: { authorization: `Bearer ${auth.token}`, 'x-firebase-id-token': 'isolated-test-token' },
    });
    await started;
    const stopping = server.close();
    assert.equal((await request).status, 503);
    await stopping;
    assert.equal(server.child.exitCode, 0, server.logs());
    const links = JSON.parse(fs.readFileSync(path.join(server.dir, 'account-links.json'), 'utf8'));
    assert.equal(links.firebaseToCanonical?.['shutdown-test-firebase'], undefined);
  } finally {
    await server.close();
    if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  }
});

test('a late authentication result cannot register a closed socket or recover its game', { timeout: 15000 }, async () => {
  const server = await isolatedServer({ WS_IDENTIFY_TIMEOUT_MS: '250' }, {}, false, [path.join(__dirname, 'test-support/slow-auth.cjs')]);
  const sockets = [];
  const previous = process.env.GUEST_AUTH_SECRET;
  try {
    process.env.GUEST_AUTH_SECRET = server.secret;
    const auth = require('./guest-auth').issueGuestToken();
    const verification = new Promise(resolve => server.child.on('message', message => { if (message.type === 'test-auth-complete') resolve(message.verified); }));
    const ws = await connect(server.port, sockets);
    const closed = new Promise(resolve => ws.once('close', resolve));
    ws.send(JSON.stringify({ type: 'identify', idToken: auth.token, name: 'Too late', avatar: 'robot' }));
    assert.equal(await closed, 1008);
    assert.equal(await verification, true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await server.close();
    const saved = JSON.parse(fs.readFileSync(path.join(server.dir, 'social.json'), 'utf8'));
    assert.equal(saved.profiles?.[auth.uid], undefined, 'no presence/profile mutations after the transport closed');
  } finally {
    sockets.forEach(ws => ws.terminate()); await server.close();
    if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  }
});

test('runtime metrics require the admin token and expose no session or account data', { timeout: 15000 }, async () => {
  const token = 'isolated-admin-token-for-runtime-metrics';
  const server = await isolatedServer({ ADMIN_STATS_TOKEN: token });
  try {
    const endpoint = `http://127.0.0.1:${server.port}/admin/runtime`;
    assert.equal((await fetch(endpoint)).status, 401);
    const response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const metrics = await response.json();
    assert.equal(metrics.connections, 0);
    assert.equal(metrics.connectionLimit, 1000);
    assert(metrics.memory.rssMB > 0);
    assert.equal(metrics.eventLoopDelay.windowSeconds, 5);
    assert(!JSON.stringify(metrics).includes(token));
    assert(!('profiles' in metrics));
  } finally { await server.close(); }
});

test('connection admission rejects excess upgrades while established players stay connected', { timeout: 15000 }, async () => {
  const server = await isolatedServer({ MAX_WS_CONNECTIONS: '2' });
  const sockets = [];
  try {
    const first = await connect(server.port, sockets);
    const second = await connect(server.port, sockets);
    const rejected = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
    sockets.push(rejected);
    const status = await new Promise((resolve, reject) => {
      rejected.on('error', () => {});
      rejected.once('open', () => reject(new Error('Excess socket was accepted')));
      rejected.once('unexpected-response', (_, response) => { response.resume(); rejected.terminate(); resolve(response.statusCode); });
    });
    assert.equal(status, 503);
    assert.equal(first.readyState, WebSocket.OPEN);
    assert.equal(second.readyState, WebSocket.OPEN);
    const closed = new Promise(resolve => first.once('close', resolve)); first.close(); await closed;
    await connect(server.port, sockets);
  } finally { sockets.forEach(ws => ws.terminate()); await server.close(); }
});

test('unidentified sockets expire while a verified player remains connected', { timeout: 15000 }, async () => {
  const server = await isolatedServer({ WS_IDENTIFY_TIMEOUT_MS: '500' });
  const sockets = [];
  const previous = process.env.GUEST_AUTH_SECRET;
  try {
    process.env.GUEST_AUTH_SECRET = server.secret;
    const auth = require('./guest-auth').issueGuestToken();
    const idle = await connect(server.port, sockets);
    const idleClosed = new Promise(resolve => idle.once('close', resolve));
    const healthy = await connect(server.port, sockets);
    const identified = new Promise(resolve => healthy.on('message', raw => { if (JSON.parse(raw).type === 'identified') resolve(); }));
    healthy.send(JSON.stringify({ type: 'identify', idToken: auth.token, name: 'Healthy', avatar: 'robot' }));
    await identified;
    assert.equal(await idleClosed, 1008);
    assert.equal(healthy.readyState, WebSocket.OPEN);
  } finally {
    sockets.forEach(ws => ws.terminate()); await server.close();
    if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  }
});

test('an oversized WebSocket frame closes only its sender and leaves HTTP and other players alive', { timeout: 20000 }, async () => {
  const server = await isolatedServer();
  const sockets = [];
  try {
    const connect = () => new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
      sockets.push(ws);
      ws.on('error', reject);
      ws.once('open', () => resolve(ws));
    });
    const healthy = await connect();
    const oversized = await connect();
    const closed = new Promise(resolve => oversized.once('close', resolve));
    oversized.send('x'.repeat(20 * 1024));
    await closed;
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(server.child.exitCode, null, server.logs());
    assert.equal(healthy.readyState, WebSocket.OPEN, 'other players remain connected');
    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    assert.equal(response.status, 200);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server stopped processing other players')), 2000);
      healthy.once('pong', () => { clearTimeout(timeout); resolve(); });
      healthy.ping();
    });
  } finally { sockets.forEach(ws => ws.terminate()); await server.close(); }
});
