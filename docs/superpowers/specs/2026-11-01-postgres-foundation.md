# PostgreSQL migration foundation

The approved next step is moving persisted accounts, progression and messages
from local JSON to PostgreSQL without losing existing user data. This first
stage deliberately retains one game process. Its current synchronous domain
objects and local media still prevent safe multi-instance operation.

## Storage contract

- Keep the JSON backend as the explicit default. DATABASE_URL alone never
  changes the production backend. STORAGE_BACKEND=postgres selects PostgreSQL.
- Import all 13 known stores losslessly into entity JSONB rows and store layouts.
  Preserve unknown object fields, Unicode, identity keys and every array order.
  Missing files use documented empty defaults; corrupt existing data aborts.
- Bootstrap must load and verify the complete imported dataset before requiring
  domain modules or listening. No fallback to empty stores or stale local JSON.
- A dedicated PostgreSQL client owns an exclusive session advisory lock and
  executes all serialized write transactions on that same connection. No pool
  writes on a second session. A second writer must fail before serving traffic.
- Data writes update only changed entity rows and the corresponding store head
  in one transaction. A lost writer connection terminates the process without
  reconnecting an old cache. Existing per-store debounce semantics remain;
  cross-domain end-of-match atomicity is a separate follow-up.
- Import takes the same writer lock and one transaction into an empty namespace;
  repeat import succeeds only if the source and current data match exactly.
- Export/verification read every store under a single consistent transaction.
  Export for rollback requires the writer stopped and writes only a new target
  directory. Source JSON and profile/community media remain intact.

## Validation

Use an actual isolated PostgreSQL server, not only a SQL mock. Test record and
array round trips, atomic import refusal, idempotence, verified export, exclusive
writer admission, incremental updates, lost-connection failure, restart recovery
and an actual two-player game with persistent statistics/messages. Existing JSON
tests and browser journeys must still pass. Never load-test production.

## Verified library contract

pg 8.23.1 is pinned in backend/package-lock.json. Official node-postgres docs:
https://node-postgres.com/features/transactions

> You must use the same client instance for all statements within a transaction.

This also keeps the advisory lock and all writes on the same database session.
The local-only test runtime is embedded-postgres 18.6.0-beta.19; it is not a
production dependency or a replacement for the managed Railway database.

## Cutover boundary

Railway connector authentication is currently expired. No production database
has been created, no DATABASE_URL obtained, and no source data export inspected.
Ship and verify the opt-in migration tooling first; switch production only after
access is restored, the database is provisioned, the old process is frozen and
flushed, and import/verification/rollback checks succeed.
