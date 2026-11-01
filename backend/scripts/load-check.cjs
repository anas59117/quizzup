// Local child process only: never accepts a remote target or uses real accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const WebSocket = require('ws');
const { isolatedServer } = require('../test-support/isolated-server.cjs');
const { issueGuestToken } = require('../guest-auth');

const players = Number(process.argv[2] || 200);
const historySize = Number(process.argv[3] || 10000);
assert(Number.isInteger(players) && players >= 2 && players <= 2000 && players % 2 === 0);
assert(Number.isInteger(historySize) && historySize >= 0 && historySize <= 100000);
const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round((sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] || 0) * 100) / 100;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const stats = {}, profiles = {}, topics = {};
  for (let i = 0; i < historySize; i++) {
    stats[`historical_${i}`] = { games: 10, wins: 5, streak: 1, xp: i * 10, coins: 100 };
    profiles[`historical_${i}`] = { name: `History ${i}`, avatar: 'robot' };
    topics[`historical_${i}`] = { harry_potter: { games: 10, wins: 5, xp: i * 10 } };
  }
  const server = await isolatedServer({ TRUST_PROXY: 'true', MAX_WS_CONNECTIONS_PER_IP: '0' },
    { stats, social: { profiles, friends: {}, requests: {} }, 'topic-stats': topics }, true);
  const previousSecret = process.env.GUEST_AUTH_SECRET;
  process.env.GUEST_AUTH_SECRET = server.secret;
  const sockets = [], errors = [], runtime = [], identificationMs = [], leaderboardMs = [], ackMs = [], healthMs = [];
  let completed = 0, answers = 0, healthy = true;
  const start = performance.now();
  server.child.on('message', message => { if (message.type === 'load_sample') runtime.push(message); });
  let probing = false;
  const health = setInterval(async () => {
    if (probing) return;
    probing = true;
    const sent = performance.now();
    try { const response = await fetch(`http://127.0.0.1:${server.port}/health`, { signal: AbortSignal.timeout(10000) }); healthy &&= response.ok; healthMs.push(performance.now() - sent); }
    catch { healthy = false; }
    finally { probing = false; }
  }, 500);
  try {
    for (let offset = 0; offset < players; offset += 20) {
      await Promise.all(Array.from({ length: Math.min(20, players - offset) }, (_, n) => new Promise((resolve, reject) => {
        const index = offset + n;
        const auth = issueGuestToken();
        const sent = performance.now();
        const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`, { headers: { 'x-forwarded-for': `198.18.${Math.floor(index / 250)}.${index % 250 + 1}` } });
        sockets.push(ws);
        let boardSent, answerSent, result = false;
        const timeout = setTimeout(() => reject(new Error(`Player ${index} could not identify`)), 20000);
        ws.on('error', error => { errors.push(error.message); reject(error); });
        ws.on('close', code => { if (!result) errors.push(`Player ${index} closed ${code}`); });
        ws.on('open', () => ws.send(JSON.stringify({ type: 'identify', idToken: auth.token, name: `Load ${index}`, avatar: 'robot', presentationVersion: 1 })));
        ws.on('message', raw => {
          const message = JSON.parse(raw);
          if (['error', 'auth_required', 'rate_limited'].includes(message.type)) errors.push(message);
          if (message.type === 'identified') {
            identificationMs.push(performance.now() - sent);
            boardSent = performance.now();
            ws.send(JSON.stringify({ type: 'leaderboard_list', category: index % 2 ? 'harry_potter' : null }));
            clearTimeout(timeout); resolve();
          }
          if (message.type === 'leaderboard_list') {
            leaderboardMs.push(performance.now() - boardSent);
            ws.send(JSON.stringify({ type: 'join', category: 'harry_potter', presentationVersion: 1 }));
          }
          if (message.type === 'question') {
            setTimeout(() => {
              if (ws.readyState !== WebSocket.OPEN) return;
              answerSent = performance.now();
              ws.send(JSON.stringify({ type: 'answer', answerIndex: index % 4 }));
              answers++;
            }, Math.ceil(message.answerOpensInMs || 0) + 100 + index % 50);
          }
          if (message.type === 'answer_ack') ackMs.push(performance.now() - answerSent);
          if (message.type === 'game_end') { result = true; completed++; }
        });
      })));
      await sleep(25);
    }
    const deadline = performance.now() + 90000;
    while (completed < players && performance.now() < deadline && server.child.exitCode === null) await sleep(250);
    assert.equal(server.child.exitCode, null, server.logs());
    assert.equal(completed, players, `Only ${completed}/${players} finished; ${JSON.stringify(errors.slice(0, 5))}`);
    assert.equal(ackMs.length, players * 6, 'Every accepted answer is acknowledged');
    assert.equal(leaderboardMs.length, players, 'Every leaderboard request completes');
    assert.deepEqual(errors, []);
    assert(healthy, 'Health endpoint stays responsive');
    sockets.forEach(ws => ws.close());
    await sleep(1500);
    clearInterval(health);
    const report = { localOnly: true, node: process.version, players, concurrentDuels: players / 2, historicalAccounts: historySize,
      completed, answers, acknowledgements: ackMs.length, durationSeconds: Math.round((performance.now() - start) / 1000),
      identifyP95Ms: percentile(identificationMs, .95), leaderboardP95Ms: percentile(leaderboardMs, .95),
      answerAckP95Ms: percentile(ackMs, .95), answerAckP99Ms: percentile(ackMs, .99), healthP95Ms: percentile(healthMs, .95),
      peakRssMB: percentile(runtime.map(s => s.rssMB), 1), eventLoopP99PeakMs: percentile(runtime.map(s => s.loopP99Ms), 1),
      eventLoopMaxMs: percentile(runtime.map(s => s.loopMaxMs), 1), peakCpuCores: percentile(runtime.map(s => s.cpuCores), 1), errors };
    await server.close();
    assert.equal(server.child.exitCode, 0, 'Graceful shutdown flushes all stores successfully');
    const persisted = JSON.parse(fs.readFileSync(path.join(server.dir, 'stats.json'), 'utf8'));
    assert.equal(Object.keys(persisted).filter(id => id.startsWith('guest_') && persisted[id].games === 1).length, players, 'Every finished game is persisted exactly once');
    const out = path.resolve(__dirname, '../../.mobile-preview');
    fs.mkdirSync(out, { recursive: true });
    const file = path.join(out, `load-${players}-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ ...report, reportFile: file }, null, 2));
  } finally {
    clearInterval(health); sockets.forEach(ws => ws.terminate()); await server.close();
    if (previousSecret === undefined) delete process.env.GUEST_AUTH_SECRET;
    else process.env.GUEST_AUTH_SECRET = previousSecret;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
