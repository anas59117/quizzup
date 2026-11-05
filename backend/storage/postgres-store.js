const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');
const { STORE_NAMES, ADDITIVE_STORES, definition, emptyStore, normalizeDataset } = require('./catalog');
const { encodeSnapshot, decodeSnapshot, canonicalHash, canonical } = require('./codec');
const error = code => Object.assign(new Error(code), { code });
const keyHash = key => crypto.createHash('sha256').update(key).digest('hex');

class PostgresStore {
  static async open({ connectionString, create = false, readOnly = false, runtime = false, onFatal = () => {} }) {
    if (!connectionString) throw error('DATABASE_URL_REQUIRED');
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000, query_timeout: 15000,
      statement_timeout: 15000, application_name: 'quizzup-storage-v1' });
    const store = new PostgresStore(client, { readOnly, runtime, onFatal });
    try {
      await client.connect();
      const encoding = await client.query('SHOW server_encoding');
      if (encoding.rows[0].server_encoding !== 'UTF8') throw error('DATABASE_MUST_USE_UTF8');
      if (!readOnly) {
        const lock = await client.query('SELECT pg_try_advisory_lock(1364548170, 1) AS acquired');
        if (!lock.rows[0].acquired) throw error('STORAGE_WRITER_BUSY');
      }
      if (create) {
        store.writable();
        await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      }
      return store;
    } catch (cause) { await store.close(); throw cause; }
  }

  constructor(client, { readOnly, runtime, onFatal }) {
    this.client = client; this.readOnly = readOnly; this.runtime = runtime;
    this.onFatal = onFatal; this.failed = false; this.closing = false;
    this.queue = Promise.resolve(); this.heads = new Map(); this.snapshots = new Map();
    client.on('error', () => this.fail());
    client.on('end', () => { if (!this.closing) this.fail(); });
  }
  fail() {
    if (this.failed || this.closing) return;
    this.failed = true;
    this.onFatal(error('STORAGE_CONNECTION_LOST'));
  }
  active() { if (this.failed || this.closing) throw error('STORAGE_UNAVAILABLE'); }
  writable() { this.active(); if (this.readOnly) throw error('STORAGE_READ_ONLY'); }

  transaction(operation, readOnly = false, onCommit = () => {}) {
    if (this.closePromise) return Promise.reject(error('STORAGE_UNAVAILABLE'));
    const result = this.queue.then(async () => {
      this.active();
      try {
        await this.client.query(readOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
        const value = await operation();
        await this.client.query('COMMIT');
        onCommit(value);
        return value;
      } catch (cause) {
        try { await this.client.query('ROLLBACK'); } catch { this.fail(); }
        if (this.runtime && !readOnly) this.fail();
        throw cause;
      }
    });
    this.queue = result.catch(() => {});
    return result;
  }

  async readDataset() {
    const exists = await this.client.query("SELECT to_regclass('public.quizzup_storage_meta') AS name");
    if (!exists.rows[0].name) throw error('DATASET_NOT_IMPORTED');
    const metadata = await this.client.query("SELECT value FROM public.quizzup_storage_meta WHERE key='dataset'");
    if (!metadata.rowCount) throw error('DATASET_NOT_IMPORTED');
    if (metadata.rows[0].value.version !== 1) throw error('UNSUPPORTED_STORAGE_VERSION');
    const heads = (await this.client.query('SELECT * FROM public.quizzup_storage_stores ORDER BY name')).rows;
    const existingNames = new Set(heads.map(head => head.name));
    if (heads.some(h => !STORE_NAMES.includes(h.name))
      || STORE_NAMES.some(name => !existingNames.has(name) && !ADDITIVE_STORES.includes(name))) throw error('INCOMPLETE_DATASET');
    const rows = (await this.client.query('SELECT * FROM public.quizzup_storage_entities ORDER BY store_name, key_hash')).rows;
    const byStore = new Map(STORE_NAMES.map(name => [name, []]));
    for (const row of rows) {
      if (!existingNames.has(row.store_name) || row.key_hash !== keyHash(row.entity_key)) throw error('CORRUPT_STORE');
      const payload = row.encoded ? JSON.parse(row.payload.json) : row.payload;
      byStore.get(row.store_name).push({ key: row.entity_key, payload, digest: row.digest });
    }
    const data = {}, versions = new Map();
    for (const head of heads) {
      const records = byStore.get(head.name);
      const value = decodeSnapshot(head.name, JSON.parse(head.layout), records);
      if (canonicalHash(value) !== head.hash) throw error('CORRUPT_STORE');
      data[head.name] = value;
      versions.set(head.name, { revision: String(head.revision), hash: head.hash, digests: new Map(records.map(r => [r.key, r.digest])) });
    }
    for (const name of ADDITIVE_STORES) if (!existingNames.has(name)) data[name] = emptyStore(name);
    return { data, versions };
  }

  async load() {
    const loaded = await this.transaction(async () => {
      const value = await this.readDataset();
      if (!this.readOnly) for (const name of ADDITIVE_STORES) {
        if (value.versions.has(name)) continue;
        const snapshot = encodeSnapshot(name, value.data[name]);
        await this.client.query('INSERT INTO public.quizzup_storage_stores (name,layout,hash) VALUES ($1,$2,$3)', [name, JSON.stringify(snapshot.layout), snapshot.hash]);
        value.versions.set(name, { revision: '1', hash: snapshot.hash, digests: new Map() });
      }
      return value;
    }, this.readOnly, value => {
      this.heads = value.versions;
      this.snapshots = new Map(STORE_NAMES.map(name => [name, JSON.stringify(value.data[name])]));
    });
    return loaded.data;
  }
  readSnapshot(name) {
    this.active(); definition(name);
    if (!this.snapshots.has(name)) throw error('STORE_NOT_LOADED');
    return JSON.parse(this.snapshots.get(name));
  }

  async upsertRows(name, records) {
    for (let offset = 0; offset < records.length; offset += 200) {
      const batch = records.slice(offset, offset + 200).map(row => {
        const json = canonical(row.payload);
        // JSON files allow NUL/lone-surrogate escapes, whereas JSONB does not.
        // Preserve these rare records as tagged JSON text instead of dropping
        // data or letting a user message break persistence.
        const encoded = /\\u(?:0000|d[89a-f][0-9a-f]{2})/i.test(json);
        return { key_hash: keyHash(row.key), entity_key: row.key, payload: encoded ? { json } : row.payload, encoded, digest: row.digest };
      });
      const result = await this.client.query(`INSERT INTO public.quizzup_storage_entities (store_name,key_hash,entity_key,payload,encoded,digest)
        SELECT $1, r.key_hash, r.entity_key, COALESCE(r.payload, 'null'::jsonb), r.encoded, r.digest FROM jsonb_to_recordset($2::jsonb)
        AS r(key_hash text,entity_key text,payload jsonb,encoded boolean,digest text)
        ON CONFLICT (store_name,key_hash) DO UPDATE SET payload=EXCLUDED.payload,encoded=EXCLUDED.encoded,digest=EXCLUDED.digest
        WHERE quizzup_storage_entities.entity_key=EXCLUDED.entity_key`, [name, JSON.stringify(batch)]);
      if (result.rowCount !== batch.length) throw error('STORAGE_KEY_COLLISION');
    }
  }

  async importDataset(data) {
    this.writable();
    const captured = JSON.parse(JSON.stringify(normalizeDataset(data)));
    const encoded = new Map(STORE_NAMES.map(name => [name, encodeSnapshot(name, captured[name])]));
    return this.transaction(async () => {
      const existing = await this.client.query("SELECT value FROM public.quizzup_storage_meta WHERE key='dataset'");
      if (existing.rowCount) {
        const current = await this.readDataset();
        if (canonicalHash(current.data) !== canonicalHash(captured)) throw error('IMPORT_WOULD_OVERWRITE');
        return { alreadyImported: true };
      }
      const occupied = await this.client.query('SELECT count(*)::int AS count FROM public.quizzup_storage_stores');
      if (occupied.rows[0].count) throw error('IMPORT_WOULD_OVERWRITE');
      for (const name of STORE_NAMES) {
        const snapshot = encoded.get(name);
        await this.client.query('INSERT INTO public.quizzup_storage_stores (name,layout,hash) VALUES ($1,$2,$3)', [name, JSON.stringify(snapshot.layout), snapshot.hash]);
        await this.upsertRows(name, snapshot.records);
      }
      await this.client.query("INSERT INTO public.quizzup_storage_meta (key,value) VALUES ('dataset',$1::jsonb)",
        [JSON.stringify({ version: 1, importedAt: new Date().toISOString(), sourceHash: canonicalHash(captured) })]);
      return { alreadyImported: false };
    });
  }

  async writeSnapshot(name, payload) {
    this.writable();
    const value = JSON.parse(payload), snapshot = encodeSnapshot(name, value);
    let next;
    return this.transaction(async () => {
      this.writable();
      const old = this.heads.get(name);
      if (!old) throw error('STORE_NOT_LOADED');
      const head = (await this.client.query('SELECT revision FROM public.quizzup_storage_stores WHERE name=$1 FOR UPDATE', [name])).rows[0];
      if (!head || String(head.revision) !== old.revision) throw error('STORAGE_REVISION_CONFLICT');
      if (snapshot.hash === old.hash) return { updated: 0, removed: 0 };
      const digests = new Map(snapshot.records.map(row => [row.key, row.digest]));
      const changed = snapshot.records.filter(row => old.digests.get(row.key) !== row.digest);
      const removed = [...old.digests.keys()].filter(key => !digests.has(key));
      await this.upsertRows(name, changed);
      if (removed.length) await this.client.query('DELETE FROM public.quizzup_storage_entities WHERE store_name=$1 AND key_hash=ANY($2::text[])', [name, removed.map(keyHash)]);
      const updated = await this.client.query('UPDATE public.quizzup_storage_stores SET layout=$2,hash=$3,revision=revision+1,updated_at=now() WHERE name=$1 RETURNING revision', [name, JSON.stringify(snapshot.layout), snapshot.hash]);
      next = { revision: String(updated.rows[0].revision), hash: snapshot.hash, digests };
      return { updated: changed.length, removed: removed.length };
    }, false, () => {
      if (next) { this.heads.set(name, next); this.snapshots.set(name, payload); }
    });
  }

  close() {
    if (!this.closePromise) this.closePromise = (async () => {
      await this.queue;
      this.closing = true;
      await this.client.end().catch(() => {});
    })();
    return this.closePromise;
  }
}
module.exports = { PostgresStore };
