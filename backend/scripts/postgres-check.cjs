// Deliberately not named test-*.cjs: node --test must not discover this runner.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

(async () => {
  const moduleFile = process.env.EMBEDDED_POSTGRES_MODULE || path.resolve(__dirname, '../../.mobile-preview/postgres-tools/node_modules/embedded-postgres/dist/index.js');
  const { default: EmbeddedPostgres } = await import(pathToFileURL(moduleFile).href);
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const dir = path.resolve(__dirname, '../../.mobile-preview/postgres-clusters');
  fs.mkdirSync(dir, { recursive: true });
  const clusterDir = fs.mkdtempSync(path.join(dir, 'qa-'));
  const password = require('node:crypto').randomBytes(24).toString('hex');
  const cluster = new EmbeddedPostgres({ databaseDir: clusterDir, user: 'postgres', password, port,
    persistent: true, autoRehydrateSymlinks: true, initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {}, onError: () => {} });
  try {
    await cluster.initialise(); await cluster.start();
    await cluster.createDatabase('quizzup_test');
    const url = `postgresql://postgres:${password}@127.0.0.1:${port}/quizzup_test`;
    const files = process.argv.slice(2);
    const load = files[0] === '--load';
    const child = spawn(process.execPath, load ? ['scripts/load-check.cjs', ...(files.slice(1).length ? files.slice(1) : ['200'])] : ['--test', ...(files.length ? files : ['storage-postgres.integration.test.js'])], {
      cwd: path.resolve(__dirname, '..'), windowsHide: true, stdio: 'inherit',
      env: { ...process.env, PG_TEST_URL: url, ...(load ? { LOAD_POSTGRES_URL: url } : {}) },
    });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    process.exitCode = code || 0;
  } finally { await cluster.stop(); }
})().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
