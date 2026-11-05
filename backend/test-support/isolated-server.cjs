const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { fork } = require('node:child_process');

async function isolatedServer(env = {}, seed = {}, probe = false, preloads = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-capacity-'));
  for (const name of ['account-links', 'async-challenges', 'category-stats', 'challenges', 'follows', 'match-history', 'messages', 'notifications', 'posts', 'reports', 'social', 'stats', 'topic-stats', 'user-reports']) {
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(seed[name] || (name === 'posts' ? { posts: [] } : {})));
  }
  const portProbe = net.createServer();
  await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const secret = env.GUEST_AUTH_SECRET || require('node:crypto').randomBytes(32).toString('hex');
  const child = fork(path.resolve(__dirname, env.STORAGE_BACKEND === 'postgres' ? '../start.js' : '../server.js'), [], {
    cwd: path.resolve(__dirname, '..'), windowsHide: true, silent: true,
    execArgv: [path.join(__dirname, 'shutdown.cjs'), ...(probe ? [path.join(__dirname, 'runtime-probe.cjs')] : []), ...preloads].flatMap(file => ['--require', file]),
    env: { ...process.env, NODE_ENV: 'test', DATA_DIR: dir, PORT: String(port), CORS_ORIGIN: '*', GUEST_AUTH_SECRET: secret, ...env },
  });
  let logs = '';
  child.stdout.on('data', chunk => { logs = (logs + chunk).slice(-10000); });
  child.stderr.on('data', chunk => { logs = (logs + chunk).slice(-10000); });
  const close = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise(resolve => {
      const timeout = setTimeout(() => child.kill('SIGKILL'), 28000);
      child.once('exit', () => { clearTimeout(timeout); resolve(); });
      if (child.connected) child.send({ type: 'test_shutdown' });
      else child.kill('SIGTERM');
    });
  };
  try {
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Backend exited: ${logs}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        if (response.ok) return { child, port, dir, secret, logs: () => logs, close };
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Backend did not start: ${logs}`);
  } catch (error) { await close(); throw error; }
}

module.exports = { isolatedServer };
