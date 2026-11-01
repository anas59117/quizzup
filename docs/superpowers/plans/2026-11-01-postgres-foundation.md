# PostgreSQL foundation implementation plan

**Goal:** implement a verified, reversible migration of all persisted stores.
**Architecture:** explicit backend selection, lossless per-entity JSONB storage,
one fenced writer session, compatibility hydration before server startup.
**Stack:** Node 24, pg 8.23.1, PostgreSQL, existing CommonJS domain modules.
**Spec:** ../specs/2026-11-01-postgres-foundation.md

1. [x] Add failing codec tests for all 13 store shapes, nested identity maps,
   array order, empty defaults, malformed input and prototype-like keys. Implement
   backend/storage/catalog.js and codec.js with canonical SHA256 validation.
2. [x] Add backend/storage/schema.sql and postgres-store.js. Use one dedicated
   client and a serialized transaction queue for advisory ownership, verified
   import/hydration, incremental commits and consistent export. Test on real PG.
3. [x] Add offline migration CLI with inspect/import/verify/export commands.
   Require a stopped-source acknowledgement for import and an empty target for
   export. Never print credentials or overwrite a populated database.
4. [x] Add storage bootstrap and opt-in integration at json-writer/store-path,
   start.js and server shutdown. Test unavailable/unimported DB, second writer,
   connection loss and recovery of persisted data after restart.
5. [ ] Run complete JSON regressions, actual PG-backed HTTP/WS workflows, a
   local PG-backed load check, browser duel recovery, CI build and independent
   read-only review. Publish only the inactive opt-in code while Railway access
   remains unavailable. Document exact cutover and rollback steps.
