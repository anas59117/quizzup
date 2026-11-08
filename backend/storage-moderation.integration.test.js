const test = require('node:test');
const assert = require('node:assert/strict');
const { STORE_NAMES, emptyStore } = require('./storage/catalog');
const { canonicalHash } = require('./storage/codec');

test('legacy PostgreSQL moderation upgrade is additive, atomic and preserves reports across restart', { skip: !process.env.PG_TEST_URL, timeout: 30000 }, async () => {
  const { Client } = require('pg');
  const { PostgresStore } = require('./storage/postgres-store');
  const url = new URL(process.env.PG_TEST_URL);
  assert.equal(url.hostname, '127.0.0.1');
  assert.match(url.pathname, /^\/quizzup_test/);
  const admin = new Client({ connectionString: url.href });
  await admin.connect();
  try { await admin.query('CREATE DATABASE quizzup_test_moderation'); } finally { await admin.end(); }
  url.pathname = '/quizzup_test_moderation';
  let writer = await PostgresStore.open({ connectionString: url.href, create: true }), reader;
  const legacy = Object.fromEntries(STORE_NAMES.filter(name => name !== 'user-reports').map(name => [name, emptyStore(name)]));
  legacy.stats = { alice: { xp: 200, games: 2 } };
  try {
    await writer.importDataset(legacy);
    await writer.client.query("DELETE FROM public.quizzup_storage_stores WHERE name='user-reports'");
    const heads = (await writer.client.query('SELECT * FROM public.quizzup_storage_stores ORDER BY name')).rows;
    const meta = (await writer.client.query('SELECT * FROM public.quizzup_storage_meta')).rows;
    await writer.close();
    reader = await PostgresStore.open({ connectionString: url.href, readOnly: true });
    assert.deepEqual((await reader.load())['user-reports'], { reports: [], blocks: {}, flaggedNames: {} });
    assert.equal((await reader.client.query('SELECT count(*)::int AS n FROM public.quizzup_storage_stores')).rows[0].n, 13);
    await reader.close(); reader = null;
    writer = await PostgresStore.open({ connectionString: url.href });
    await writer.client.query(`CREATE FUNCTION public.reject_moderation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.name='user-reports' THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_moderation BEFORE INSERT ON public.quizzup_storage_stores FOR EACH ROW EXECUTE FUNCTION public.reject_moderation()`);
    await assert.rejects(writer.load());
    assert.equal((await writer.client.query('SELECT count(*)::int AS n FROM public.quizzup_storage_stores')).rows[0].n, 13);
    await writer.client.query('DROP TRIGGER reject_moderation ON public.quizzup_storage_stores; DROP FUNCTION public.reject_moderation()');
    const loaded = await writer.load();
    assert.deepEqual(loaded.stats, legacy.stats);
    assert.deepEqual((await writer.client.query("SELECT * FROM public.quizzup_storage_stores WHERE name<>'user-reports' ORDER BY name")).rows, heads);
    assert.deepEqual((await writer.client.query('SELECT * FROM public.quizzup_storage_meta')).rows, meta);
    assert.equal((await writer.importDataset(legacy)).alreadyImported, true);
    await writer.load();
    const reports = { reports: [{ reporterId: 'alice', targetId: 'bob' }], blocks: { alice: ['bob'] }, flaggedNames: { bob: 1 } };
    await writer.writeSnapshot('user-reports', JSON.stringify(reports));
    await assert.rejects(writer.importDataset(legacy), { code: 'IMPORT_WOULD_OVERWRITE' });
    await writer.close(); writer = await PostgresStore.open({ connectionString: url.href });
    assert.equal(canonicalHash((await writer.load())['user-reports']), canonicalHash(reports));
    await writer.client.query("DELETE FROM public.quizzup_storage_stores WHERE name='messages'");
    await assert.rejects(writer.load(), { code: 'INCOMPLETE_DATASET' });
  } finally { await writer.close(); await reader?.close(); }
});
