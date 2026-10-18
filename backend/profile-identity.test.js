const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const jpeg = Buffer.from('ffd8ffc00011080020002003011100021100031100ffda000c03010002000300003f00112233ffd9', 'hex');

test('personal identity survives stale joins, fresh sockets and server restart; another account cannot claim it', { timeout: 30000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-photo-identity-'));
  const probe = net.createServer().listen(0, '127.0.0.1');
  await new Promise(resolve => probe.once('listening', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  let child;
  const sockets = [];
  const start = async () => {
    child = spawn(process.execPath, ['server.js'], { cwd: __dirname, windowsHide: true,
      env: { ...process.env, PORT: String(port), DATA_DIR: dir, CORS_ORIGIN: '*', GUEST_AUTH_SECRET: 'photo-integration-secret-with-thirty-two-characters' }, stdio: ['ignore', 'pipe', 'pipe'] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Backend did not start')), 8000);
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Backend exited ${code}`)); });
      child.stdout.on('data', data => { if (String(data).includes('backend on http')) { clearTimeout(timer); resolve(); } });
    });
  };
  const stop = async () => {
    sockets.splice(0).forEach(ws => ws.terminate());
    if (!child || child.exitCode !== null) return;
    await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
  };
  const socket = async token => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`); sockets.push(ws);
    const messages = [];
    ws.on('message', data => messages.push(JSON.parse(data)));
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    const wait = type => new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const index = messages.findIndex(message => message.type === type);
        if (index !== -1) { clearInterval(timer); resolve(messages.splice(index, 1)[0]); }
        else if (Date.now() - started > 4000) { clearInterval(timer); reject(new Error(`Missing ${type}: ${JSON.stringify(messages)}`)); }
      }, 10);
    });
    ws.send(JSON.stringify({ type: 'identify', idToken: token, name: 'Stale', avatar: 'robot', presentationVersion: 1 }));
    return { ws, wait, identified: await wait('identified') };
  };
  try {
    await start();
    const identity = await (await fetch(`${origin}/auth/guest`, { method: 'POST' })).json();
    const first = await socket(identity.token);
    const { avatar } = await (await fetch(`${origin}/profile-photo`, { method: 'POST', headers: { Authorization: `Bearer ${identity.token}`, 'Content-Type': 'image/jpeg' }, body: jpeg })).json();
    first.ws.send(JSON.stringify({ type: 'profile_update', name: 'Alex', avatar }));
    assert.equal((await first.wait('profile_updated')).profile.avatar, avatar);
    first.ws.send(JSON.stringify({ type: 'create_room', avatar: 'robot' }));
    assert.equal((await first.wait('room_created')).players[0].avatar, avatar);
    const secondIdentity = await (await fetch(`${origin}/auth/guest`, { method: 'POST' })).json();
    const attacker = await socket(secondIdentity.token);
    attacker.ws.send(JSON.stringify({ type: 'profile_update', name: 'Other', avatar }));
    assert.equal((await attacker.wait('profile_update_failed')).code, 'INVALID_PHOTO');
    // Wait for the existing atomic writer, so the restart assertion tests disk.
    for (let i = 0; i < 100; i++) {
      try { if (JSON.parse(fs.readFileSync(path.join(dir, 'social.json'))).profiles[identity.uid]?.avatar === avatar) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    await stop(); await start();
    const reloaded = await socket(identity.token);
    assert.equal(reloaded.identified.profile.avatar, avatar);
    assert.equal(reloaded.identified.profile.name, 'Alex');
    assert.equal((await fetch(`${origin}${avatar}`)).status, 200);
  } finally { await stop(); fs.rmSync(dir, { recursive: true, force: true }); }
});
