# Task 4 — App integration, community, history and duel exits

Completed 2026-10-19 in C:/Users/User/Desktop/quizzup-mobile. No push or deployment performed; root owns final full CI, review and release.

## Delivered

- Home Messages/unread, Community and History entries; Messenger routes from Friends, profile and completed friend duels. Four navigation tabs and central Play preserved.
- Browser/device Back consumes async sheet, challenge chooser and thread before leaving Messenger. Thread drafts survive closing/reopening the thread. Header/Escape behavior stays aligned.
- Reachable PlayerSheet Remove friend with explicit second confirmation, cancel, pending state, connection error and recoverable timeout; canonical membership removes Message/Challenge access.
- Personal themes combine followed + actual recent themes, use actual available levels and show unknown levels honestly. Theme follow, community and rankings entries; legacy missing completion is unavailable.
- Own match history screen refreshes on entry/reconnect with loading, empty/error/retry, scores/results/opponent portraits and friend conversation entry.
- Community text, raw authenticated HTTP JPEG photo upload (shared preparation enforces <=256KiB), server-scored question cards, actual comments, canonical reaction state, reporting and awaited native/clipboard sharing. Pending guards/timeouts retain failed drafts; comment/post drafts clear on own canonical acknowledgement. Late filter/detail replies are guarded.
- Shared #post-ID links open Community after authenticated startup and load a sanitized post beyond the current feed window; missing/hidden posts show unavailable. Backend post_get -> post_detail is authenticated and feed-rate-limited; correct question answer never leaks.
- Warm paper community surfaces, readable scoped text inputs overriding old global important rules, clear question placeholders, reset composer to text after acknowledgement, unwrapped comment Send, strong correct-answer feedback. Profile header remains first.
- Incorrect duel options exit only on canonical full round reveal; correct answer and answer box geometry remain, including reduced motion.

## Verification performed

All commands use PowerShell; run from the stated directory.

1. Frontend C:/Users/User/Desktop/quizzup-mobile/frontend:
   `$env:CI='true'; node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --testPathPattern='community-integration|Messenger|duel-feedback|mobile-comfort'`
   Actual final result: 4 suites PASS, 32 tests PASS, 0 failures (11.412s). Includes scoped feed late replies, duplicate create/timeouts/draft preservation, viewer reaction isolation, history timeout recovery, safe media/awaited share, shared missing post feedback and confirmed removal/offline retry/canonical membership.

2. Repository C:/Users/User/Desktop/quizzup-mobile:
   `node --test backend/post-detail.test.js backend/social-protocol.test.js`
   Actual result: 2 PASS, 0 failures (32.254s). Detail test covers viewer reaction, no correct-index leak and hidden/missing null. Existing live WS test covers offline DM/privacy/community/photo/live challenge.

3. Repository:
   `node frontend/scripts/mobile-preview/build.cjs`
   Actual result: Mobile preview built.
   `node frontend/scripts/mobile-preview/social-check.cjs`
   Actual final result: all PASS, zero runtime errors. Isolated test backend port3003/data directory; actual App in two authenticated browser contexts via port4330. Friend request setup uses the authenticated app socket; acceptance and subsequent interactions use real UI. Checks friend accept, persisted DM/unread, offline reconnect, Back chooser/thread/draft preservation, 320x500 composer fit, six-round live challenge, finished conversation/result/history, community text/JPEG/question/comment, real shared-link startup +missing post, Back async sheet and confirmed reachable Remove friend. Tests respect the existing WS burst limiter with a 2.2s pause before final removal.

Earlier full integration snapshot also passed frontend 19 suites/120 tests and CI build. These predate the final focused review fixes; root must run final full CI/build on the final commit.

## Visual evidence

Untracked generated evidence under C:/Users/User/Desktop/quizzup-mobile/frontend/.mobile-preview/:
- social-home-320.png / social-home-390.png
- social-inbox-320.png / social-inbox-390.png
- social-thread-320.png / social-thread-390.png
- social-history-320.png / social-history-390.png
- social-community-320.png / social-community-375.png / social-community-390.png / social-community-430.png

The final actual browser run asserts no document horizontal overflow at all requested widths. Earlier failure screenshots are stale diagnostics, not final evidence. Browser startup was made deterministic using navigation commit plus explicit visible App readiness; external resource load completion is not treated as UI readiness.

## Remaining release gates

Root final source review, full frontend CI/build, authorized deployment and live frontend/backend verification. Actual sequential async completion has separate worker evidence; this script covers live duel plus async-sheet navigation without duplicating that full journey. No dependency was added; formatting used one-off Prettier.
