const test = require('node:test');
const assert = require('node:assert/strict');
const { STORE_NAMES, emptyStore } = require('./storage/catalog');
const { canonicalHash } = require('./storage/codec');

test('real PostgreSQL import, exclusive ownership, incremental writes, export and connection-loss fencing', { skip: !process.env.PG_TEST_URL, timeout: 30000 }, async () => {
  const { PostgresStore } = require('./storage/postgres-store');
  const url = new URL(process.env.PG_TEST_URL);
  assert.equal(url.hostname, '127.0.0.1');
  assert.match(url.pathname, /^\/quizzup_test/);
  const connectionString = process.env.PG_TEST_URL;
  const data = Object.fromEntries(STORE_NAMES.map(name => [name, emptyStore(name)]));
  data.stats = { alice: { games: 2, xp: 500 }, bob: { games: 1, xp: 100 } };
  data.posts = { posts: [{ id: 'z', text: 'Dernier 🦊\u0000\ud800' }, { id: 'a', text: 'Premier' }], legacy: '\u0000' };
  data.challenges = [null];
  data.notifications = { legacyNull: null };
  const store = await PostgresStore.open({ connectionString, create: true });
  let reader, replacement;
  try {
    await assert.rejects(store.load(), { code: 'DATASET_NOT_IMPORTED' });
    await store.client.query(`CREATE FUNCTION public.quizzup_test_reject() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.store_name='stats' THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER quizzup_test_reject BEFORE INSERT ON public.quizzup_storage_entities
      FOR EACH ROW EXECUTE FUNCTION public.quizzup_test_reject()`);
    await assert.rejects(store.importDataset(data));
    assert.equal((await store.client.query('SELECT count(*)::int AS count FROM public.quizzup_storage_stores')).rows[0].count, 0, 'failed import rolls back every store');
    await store.client.query('DROP TRIGGER quizzup_test_reject ON public.quizzup_storage_entities; DROP FUNCTION public.quizzup_test_reject()');
    await store.importDataset(data);
    const imported = await store.load();
    assert.equal(canonicalHash(imported), canonicalHash(data));
    assert.equal((await store.importDataset(data)).alreadyImported, true);
    await assert.rejects(PostgresStore.open({ connectionString }), { code: 'STORAGE_WRITER_BUSY' });
    const changed = { alice: { games: 3, xp: 700 }, bob: { games: 1, xp: 100 } };
    const result = await store.writeSnapshot('stats', JSON.stringify(changed));
    assert.equal(result.updated, 1);
    assert.equal((await store.writeSnapshot('stats', JSON.stringify(changed))).updated, 0);
    const [statsWrite, socialWrite] = await Promise.all([
      store.writeSnapshot('stats', JSON.stringify({ alice: changed.alice })),
      store.writeSnapshot('social', JSON.stringify({ profiles: { alice: { name: 'Élodie 漢' } }, friends: {}, requests: {} })),
    ]);
    assert.equal(statsWrite.removed, 1);
    assert.equal(socialWrite.updated, 1);
    delete changed.bob;
    reader = await PostgresStore.open({ connectionString, readOnly: true });
    assert.deepEqual((await reader.load()).stats, changed);
    await assert.rejects(store.importDataset(data), { code: 'IMPORT_WOULD_OVERWRITE' });
    await store.close();
    let lost = false;
    replacement = await PostgresStore.open({ connectionString, onFatal: () => { lost = true; } });
    await replacement.load();
    assert.deepEqual(replacement.readSnapshot('stats'), changed);
    await reader.client.query('SELECT pg_terminate_backend($1)', [replacement.client.processID]);
    for (let i = 0; i < 20 && !lost; i++) await new Promise(resolve => setTimeout(resolve, 25));
    assert(lost);
    await assert.rejects(replacement.writeSnapshot('stats', '{}'));
  } finally { await store.close(); await reader?.close(); await replacement?.close(); }
});

test('real PostgreSQL CLI backup/rollback and app friends, messages, six rounds, restart', { skip: !process.env.PG_TEST_URL, timeout: 120000 }, async () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const { Client } = require('pg');
  const { execFile } = require('node:child_process');
  const exec = require('node:util').promisify(execFile);
  const WebSocket = require('ws');
  const { isolatedServer } = require('./test-support/isolated-server.cjs');
  const { writeDirectory, readSource } = require('./storage/migration-files');
  const { PostgresStore } = require('./storage/postgres-store');
  const connection = new URL(process.env.PG_TEST_URL);
  assert.equal(connection.hostname, '127.0.0.1');
  assert.match(connection.pathname, /^\/quizzup_test/);
  const admin = new Client({ connectionString: connection.href });
  await admin.connect();
  try { await admin.query('CREATE DATABASE quizzup_test_app'); } finally { await admin.end(); }
  connection.pathname = '/quizzup_test_app';
  const databaseUrl = connection.href;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-pg-workflow-'));
  const data = Object.fromEntries(STORE_NAMES.map(name => [name, emptyStore(name)]));
  data.stats.historical = { games: 4, wins: 2, xp: 500, coins: 80 };
  const source = path.join(dir, 'source');
  writeDirectory(source, data);
  const cli = args => exec(process.execPath, ['scripts/migrate-postgres.cjs', ...args], {
    cwd: __dirname, windowsHide: true, env: { ...process.env, DATABASE_URL: databaseUrl }, timeout: 15000,
  });
  await assert.rejects(cli(['import', '--source', source, '--backup', path.join(dir, 'forbidden')]), error => /STOP_AND_FLUSH_SOURCE_FIRST/.test(error.stderr));
  assert(!fs.existsSync(path.join(dir, 'forbidden')));
  const imported = JSON.parse((await cli(['import', '--source', source, '--backup', path.join(dir, 'backup'), '--source-is-stopped'])).stdout);
  assert.equal(imported.verified, true);
  assert.equal(readSource(path.join(dir, 'backup')).manifest.datasetHash, canonicalHash(data));
  assert.equal(JSON.parse((await cli(['verify', '--source', source])).stdout).verified, true);
  await cli(['export', '--target', path.join(dir, 'rollback')]);
  assert.equal(readSource(path.join(dir, 'rollback')).manifest.datasetHash, canonicalHash(data));
  await assert.rejects(cli(['export', '--target', path.join(dir, 'rollback')]), error => /EEXIST/.test(error.stderr));

  let server, restarted, reader;
  const sockets = [], previous = process.env.GUEST_AUTH_SECRET;
  const connect = async (port, token, name, play = false) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`), messages = [];
    sockets.push(ws);
    const wait = async (type, predicate = () => true) => {
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const index = messages.findIndex(m => m.type === type && predicate(m));
        if (index >= 0) return messages.splice(index, 1)[0];
        if (ws.readyState === WebSocket.CLOSED) throw Error(`Socket closed waiting for ${type}`);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw Error(`Timed out waiting for ${type}: ${messages.map(m => m.type).join(',')}`);
    };
    ws.on('message', raw => {
      const message = JSON.parse(raw); messages.push(message);
      if (play && message.type === 'question') setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'answer', answerIndex: 0 }));
      }, (message.answerOpensInMs || 0) + 100);
    });
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.on('error', reject); });
    const send = value => ws.send(JSON.stringify(value));
    send({ type: 'identify', idToken: token, name, avatar: 'robot', presentationVersion: 1 });
    await wait('identified');
    return { ws, send, wait, messages };
  };
  try {
    server = await isolatedServer({ STORAGE_BACKEND: 'postgres', DATABASE_URL: databaseUrl });
    const beforeFiles = fs.readdirSync(server.dir).filter(f => f.endsWith('.json')).map(f => [f, fs.readFileSync(path.join(server.dir, f), 'utf8')]);
    assert.equal((await (await fetch(`http://127.0.0.1:${server.port}/health`)).json()).storage.backend, 'postgres');
    await assert.rejects(cli(['export', '--target', path.join(dir, 'while-live')]), error => /STORAGE_WRITER_BUSY/.test(error.stderr));
    assert(!fs.existsSync(path.join(dir, 'while-live')));
    await assert.rejects(isolatedServer({ STORAGE_BACKEND: 'postgres', DATABASE_URL: databaseUrl }), /STORAGE_WRITER_BUSY/);
    process.env.GUEST_AUTH_SECRET = server.secret;
    const alice = require('./guest-auth').issueGuestToken(), bob = require('./guest-auth').issueGuestToken();
    const a = await connect(server.port, alice.token, 'Alice', true), b = await connect(server.port, bob.token, 'Bob', true);
    a.send({ type: 'friend_request', targetId: bob.uid }); await b.wait('friend_request_received');
    b.send({ type: 'friend_accept', requesterId: alice.uid }); await a.wait('friend_added');
    const text = 'Salut 🦊\u0000\ud800';
    a.send({ type: 'dm', targetId: bob.uid, text, clientMessageId: 'pg-durable-message' });
    assert.equal((await a.wait('dm_sent')).message.text, text);
    assert.equal((await b.wait('dm')).message.text, text);
    for (const player of [a, b]) player.send({ type: 'join', category: 'harry_potter', presentationVersion: 1 });
    const results = await Promise.all([a.wait('game_end'), b.wait('game_end')]);
    assert(results.every(m => m.stats.games === 1));
    assert.equal(a.messages.filter(m => m.type === 'answer_ack').length, 6);
    // A peer that ignores the close handshake must not block the final flush.
    a.ws._socket.pause();
    await server.close();
    assert.equal(server.child.exitCode, 0, server.logs());
    for (const [file, bytes] of beforeFiles) assert.equal(fs.readFileSync(path.join(server.dir, file), 'utf8'), bytes, 'PG runtime never writes legacy JSON');
    reader = await PostgresStore.open({ connectionString: databaseUrl, readOnly: true });
    const persisted = await reader.load();
    assert.equal(persisted.stats[alice.uid].games, 1);
    assert.equal(persisted.stats[bob.uid].games, 1);
    assert.equal(persisted['match-history'][alice.uid].length, 1);
    await reader.close(); reader = null;
    restarted = await isolatedServer({ STORAGE_BACKEND: 'postgres', DATABASE_URL: databaseUrl, GUEST_AUTH_SECRET: server.secret });
    const recovered = await connect(restarted.port, alice.token, 'Alice');
    assert.equal((await recovered.wait('stats')).stats.games, 1);
    recovered.send({ type: 'dm_history', targetId: bob.uid });
    assert.equal((await recovered.wait('dm_history')).messages[0].text, text);
    assert.equal((await recovered.wait('friends_list')).friends[0].id, bob.uid);
    reader = await PostgresStore.open({ connectionString: databaseUrl, readOnly: true });
    const owners = await reader.client.query("SELECT pid FROM pg_stat_activity WHERE datname=current_database() AND application_name='quizzup-storage-v1' AND pid<>pg_backend_pid()");
    assert.equal(owners.rowCount, 1);
    const exited = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Lost writer kept serving')), 5000);
      restarted.child.once('exit', code => { clearTimeout(timeout); resolve(code); });
    });
    await reader.client.query('SELECT pg_terminate_backend($1)', [owners.rows[0].pid]);
    assert.equal(await exited, 1, 'runtime stops rather than serving stale caches');
    await assert.rejects(fetch(`http://127.0.0.1:${restarted.port}/health`));
    await reader.close(); reader = null;
    await assert.rejects(cli(['import', '--source', source, '--backup', path.join(dir, 'stale-backup'), '--source-is-stopped']), error => /IMPORT_WOULD_OVERWRITE/.test(error.stderr));
    await cli(['export', '--target', path.join(dir, 'final-rollback')]);
    assert.equal(readSource(path.join(dir, 'final-rollback')).data.stats[alice.uid].games, 1);
  } finally {
    sockets.forEach(ws => ws.terminate()); await server?.close(); await restarted?.close(); await reader?.close();
    if (previous === undefined) delete process.env.GUEST_AUTH_SECRET; else process.env.GUEST_AUTH_SECRET = previous;
  }
});
