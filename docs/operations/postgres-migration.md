# PostgreSQL foundation: controlled migration and rollback

## Scope and activation gate

This release adds an **inactive, explicit opt-in** persistence backend. JSON
remains the default. Merely adding `DATABASE_URL` does not select PostgreSQL.
It does not make QuizzUp a multi-instance application: game sessions,
matchmaking, presence, domain caches and uploaded files still live on one host.

Do not activate PostgreSQL until an operator can inspect the actual Railway
service, its persistent volume, start command and database. The Railway connector
was unauthenticated during implementation; no production database or source
dataset was accessed, created or migrated.

The writer holds a PostgreSQL advisory lock on the same dedicated connection as
all writes. Only one backend process can serve this dataset. A replacement
started before the old writer stops will refuse to start with
`STORAGE_WRITER_BUSY`. This stage therefore requires a maintenance window and a
controlled stop/start, rather than overlapping deployments or replicas.

## Before the maintenance window

1. Restore Railway access. Confirm the backend service and persistent volume
   mount. Confirm `DATA_DIR` points to the real user data, not a clean checkout.
2. Provision an UTF-8 PostgreSQL database and a restricted service credential.
   Keep credentials in Railway variables or a private shell environment. Never
   put them in commands, screenshots, logs or Git. Keep `STORAGE_BACKEND=json`.
3. Confirm the service starts with `npm start` in `backend/` (or
   `node start.js`), rather than directly with `node server.js`.
4. Keep the existing `GUEST_AUTH_SECRET`, Firebase configuration, CORS origins,
   data volume and media directories. Changing the guest secret logs out guests.
5. Download a separate complete backup of the existing volume, including
   `profile-photos/` and `community-media/`, before any cutover. Store it securely.
6. Run the inspect command against a read-only copy and review all 13 stores.
   Investigate every `missing-default` or `backup` source. The codec verifies
   JSON structure and lossless transport, not the semantics of every old record.
   Existing domain normalizers still repair/drop malformed legacy entries just
   as in JSON mode. Review anomalous records on a staging copy before activation.

Examples below use Linux paths **inside the service's mounted volume**. Replace
them with verified locations; these are not commands already run in production.
The parent `/data/migration` must exist. Each backup/export target must be new.

```sh
cd /app/backend
npm run storage -- inspect --source /data
```

## Controlled cutover

1. Put the app in maintenance and stop accepting new games. Allow current games
   to finish; a process restart does not migrate live duels.
2. Stop the sole JSON backend gracefully. Require exit code 0 and successful
   persistence flush. Verify it is stopped, and disable automated restarts while
   using the volume offline. A CLI flag is an operator acknowledgement, not a
   mechanism that stops another process.
3. In an operator environment with the stopped volume and private `DATABASE_URL`,
   capture a verified backup and import in a single database transaction:

```sh
npm run storage -- import --source /data --backup /data/migration/before-postgres-UNIQUE --source-is-stopped
npm run storage -- verify --source /data/migration/before-postgres-UNIQUE
npm run storage -- status
npm run storage -- export --target /data/migration/postgres-first-export-UNIQUE
```

4. Compare the manifest hashes/counts, and verify exported data against the
   frozen backup. Import refuses an existing different dataset. Repeating the
   exact same import is idempotent. `--allow-empty` is only for a deliberately
   empty staging database, never a shortcut around missing production files.
5. Set `STORAGE_BACKEND=postgres`, retain the existing volume and `DATA_DIR`,
   and start exactly one backend with `npm start`. Confirm `/health` contains
   `storage.backend: "postgres"` and `storage.ready: true`.
6. With test accounts, verify authentication, six-round duel, scores, friends,
   messages, profile photo and community image. Restart once with no active game
   and confirm identities, scores and messages survive. Reopen traffic only then.
7. Check metrics, database backups and operational alerts before increasing
   admission limits. Never run the local load harness against production.

## Rollback without discarding PostgreSQL-era progress

If no traffic has been accepted after import, the frozen JSON backup can be
restored into a new data directory. Once PostgreSQL has accepted actions, use
a fresh export of **the current database**, not the original JSON files:

1. Enter maintenance and gracefully stop the PostgreSQL writer; require exit 0.
2. Export to a brand-new directory. Export takes the same exclusive writer lock
   and fails while the application writer is running.

```sh
npm run storage -- export --target /data/migration/rollback-CURRENT-UNIQUE
npm run storage -- verify --source /data/migration/rollback-CURRENT-UNIQUE
```

3. Preserve/copy the current `profile-photos/` and `community-media/` directories
   into that new `DATA_DIR`. The JSON export does not contain their binary files.
4. Set `STORAGE_BACKEND=json` and point `DATA_DIR` at the verified current export
   with those media directories. Keep the old directory and database intact.
5. Start one backend, verify `/health`, accounts, scores, messages and media,
   then reopen traffic. Never run JSON and PostgreSQL writers concurrently.

## Guarantees and remaining limitations

- All 13 persisted store shapes are covered, including identity aliases,
  challenges, notifications, moderation and array order. Unknown JSON fields,
  JSON null, Unicode, NUL and lone surrogate escapes survive migration/export.
- Entity changes and their store revision/hash commit together. Import commits
  all stores together. Read/export uses one consistent database snapshot.
- A missing/unimported/unavailable database blocks startup. There is no fallback
  to stale local JSON. A lost database connection stops the owning process;
  it does not silently reconnect with an old in-memory cache.
- Existing writes are debounced. A completed match still updates several stores
  independently. Cross-store exactly-once rewards/history after a hard crash are
  **not** guaranteed by this foundation. Graceful shutdown drains accepted HTTP
  and WebSocket work and flushes stores, with a bounded 25-second deadline.
- Domain hydration, snapshot serialization and hashing still scale with account
  history. The local load report records this limit. Next stages: targeted
  entity-oriented domain APIs, atomic match finalization, shared matchmaking and
  presence, durable game ownership, shared media, then multi-instance load tests.
- Do not enable replicas or promise 10,000/100,000 simultaneous players on the
  evidence of this release.

## Reproducible local validation

```sh
cd backend
npm test
npm run test:postgres
npm run test:postgres -- --load 200 10000
```

`test:postgres` starts a real isolated PostgreSQL cluster on loopback using the
optional local-only `embedded-postgres@18.6.0-beta.19` tooling. Its default module
path is `.mobile-preview/postgres-tools/node_modules/embedded-postgres/dist/index.js`
at repository root. Install the pinned tooling there using `npm install --prefix
.mobile-preview/postgres-tools --no-save --no-package-lock
embedded-postgres@18.6.0-beta.19`, or provide an absolute
`EMBEDDED_POSTGRES_MODULE` path. It is not a production dependency. The runner
creates a fresh `quizzup_test` database, stops its cluster on completion and never
accepts a remote load target. Cluster artifacts stay in local `.mobile-preview/`.
