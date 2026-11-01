# PostgreSQL foundation verification — 2026-11-01

## Release scope

Optional PostgreSQL persistence, explicit `STORAGE_BACKEND=postgres`, with JSON
remaining the production default. No production database was provisioned or
migrated: the Railway connector returned `UNAUTHORIZED` during this work.

The implementation is a compatibility foundation with one fenced writer. It is
not a completed horizontal scaling architecture or a production capacity claim.

## Real database checks

`npm run test:postgres` runs against an actual local UTF-8 PostgreSQL 18 cluster.
Both integration cases pass:

- All 13 stores preserve identities, order, metadata, Unicode, null, NUL and
  lone-surrogate text through import/load/export. A forced trigger failure
  rolls the entire import back; no partial store heads remain.
- Identical import is idempotent. Different data cannot overwrite an existing
  dataset. A second writer is refused; consistent read-only inspection works.
- Only changed entities are upserted; deletions and store revisions commit
  together. Lost database connections fence the writer.
- The actual migration CLI creates a verified backup, verifies data, exports
  rollback files, refuses existing directories and refuses export while live.
- Two real guest WebSocket clients become friends, send a durable message,
  complete six rounds and receive scores. A restart recovers friendship,
  messages and results. PostgreSQL mode leaves legacy JSON files unchanged.
- An unresponsive WebSocket close handshake cannot prevent the final flush.

Separate bootstrap tests confirm that a missing URL, misspelled backend or
uninitialized PostgreSQL runtime cannot silently fall back to JSON. A URL alone
does not change JSON mode. HTTP shutdown tests delay Firebase authentication,
stop the server, and verify a late account link is refused rather than lost.

## Local running-service load

`npm run test:postgres -- --load 200 10000` seeds a fresh loopback-only database
with 10,000 historical accounts, then runs 200 actual guest clients through
100 simultaneous six-round duels. The runtime probe resets after hydration,
before opening load clients. This machine also ran browser QA during the sample;
these figures are diagnostic and not a controlled comparison with older runs.

| Measurement | Observed |
|---|---:|
| Completed player results | 200 / 200 |
| Answer acknowledgements | 1,200 / 1,200 |
| Answer ACK p95 / p99 | 6.01 / 19.15 ms |
| Health p95 | 24.91 ms |
| Identify / leaderboard p95 | 211.25 / 374.14 ms |
| Peak backend RSS | 239 MiB |
| Maximum observed event-loop delay | 681.57 ms |
| Workload duration | 43 seconds |
| Protocol/transport errors | 0 |

All completed games were verified in PostgreSQL after graceful shutdown with
exactly one recorded game per guest. These are synthetic local clients, not
200 real users over mobile networks and not a Railway benchmark.

The event-loop spike is a material limitation: compatibility snapshots still
serialize and hash account-sized maps. This release does not establish 5,000 or
10,000 concurrent-player capacity. Targeted domain reads/writes and atomic match
finalization are the next persistence work, followed by shared game ownership,
matchmaking/presence, media and controlled multi-instance load testing.

## Existing behavior and review

- Full backend suite: 188 passed, zero failures, two PostgreSQL-only cases
  skipped by the generic suite and run separately against the real database.
- Browser live journey passes: two guest identities, reconnect during a round,
  six questions, result and rematch.
- Browser social journey passes: friendship, messages/unread/offline recovery,
  live challenge, two complete duels, community text/photo/comments/deep link,
  remove friend, 320/375/390/430-pixel layouts and zero runtime errors.
- `CI=true npm run build`: compiled successfully.
- `npm audit --omit=dev`: zero vulnerabilities.
- Independent read-only review found JSON-null import and shutdown races;
  fixes were tested and re-reviewed. No concrete remaining defect was reported.

Operational cutover and current-data rollback are documented in
`docs/operations/postgres-migration.md`. Keep the media volume and guest secret.
The production switch remains a separate controlled maintenance operation.
