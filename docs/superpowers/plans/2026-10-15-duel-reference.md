# Reference Duel Implementation Plan

> **For agentic workers:** Use subagent-driven-development for isolated tasks and requesting-code-review before publication.

**Goal:** Implement the approved world-map search, vertical face-off, question-first round sequence, score rails, and unobstructed, correct result summary.

**Architecture:** Keep existing React screens and websocket lifecycle. Add server-authoritative presentation timing, a focused MatchPresentation component, and a small client timing adapter. Use confirmed cumulative scores for side rails. Record the server's won/tie/solo outcome in the existing local league once per game; display awards inline rather than as overlapping result notifications.

**Tech Stack:** React 18, plain CSS, Node websocket backend; no new dependencies.

**Spec:** User-approved discussion and reference videos in this chat, particularly 1:55 onward in Presentation App Quiz Up, and the five findings from the Oct 15 recording.

## Global Constraints
- Existing avatar atlas, four navigation tabs and central play action stay consistent.
- Full response time begins after a 1500ms reading pause plus answer entrance; server rejects early answers, bots and reconnect respect same schedule.
- Mobile 320–430px, short/tall viewport, images, long text, groups and reduced motion remain usable.
- Existing data volumes, catalog and player identity are preserved; no live load test or fabricated player locations.
- Build with CI=true; no preview output or local backend statistics in commits. Existing authorization covers publishing verified changes.

## Task 1 — Authoritative round timing
Owner: backend/game.js, backend/config.js, backend/game.test.js. Add presentation fields on question: readingMs=1500, answerStaggerMs=100, answerEnterMs=250, presentationElapsedMs, answerOpensInMs, remainingMs. Answer opening delay is readingMs+(answers.length-1)*stagger+enter. Keep phase question, set monotonic questionStart in future, and extend timeout by preparation delay. Reconnect preserves original timeLimit and reports elapsed presentation and remaining answer time. Bots start from opening. Tests cover early rejection, fresh opening, timeout, reconnect during/after presentation and scoring. Do not change outcome schema.
- [x] Write failing behavior tests, implement, run backend suite, report.

## Task 2 — Map search and face-off
Owner: new frontend/src/MatchPresentation.js, match-presentation.css and dedicated tests. Export WorldMatchSearch with current WaitingContent props, and DuelRoundIntro with RoundIntroContent props. Map is a decorative recognizable world silhouette, radar/search lights, and own avatar; it must not imply invented real users or geolocations. Cancellation, reconnect, pending, elapsed and solo fallback remain operational. First 1v1 round uses two vertical player panels divided by central bolt; other rounds and group/solo keep clear round intro. CSS imported from component, reduced-motion and small-height variants. Parent wires screen exports.
- [x] Implement and verify component interactions, mobile layout, report.

## Task 3 — Round UX, score rails and outcomes
Owner: parent, frontend/src/App.js, enhanced-QuestionContent.js, multiplayer.js, duel-premium.css, screens.js, LeagueSystem.js and focused tests/helpers.
- [x] Test server won/tie/solo classification and once-per-game local league recording. Persist deduplication for reconnect, don't penalize solo/tie; use actual bounded LP delta inline.
- [x] Add question timing hook based on monotonic receipt anchor and protocol fields; don't restart when ack arrives. Hide/disable all choices until scheduled entrance, enable all together at opening. Keep full chrono through presentation, calculate remaining time rather than interval drift. Reconnect skips elapsed stages.
- [x] Compact HUD and metadata, stable question/answer slots; text choices full width, photo 2x2, no clipping. Use actual cumulative own score immediately after ack and opponents only after full reveal in accessible side rails; ceiling normal rounds20, final40.
- [x] Integrate match components and inline result LP/streak information, suppress result-generated floating banners that obscure headline. Preserve other notification uses.
- [x] Focused unit tests, backend tests, browser matrix and two-player real websocket flow including early input/reconnect/rematch; CI production build.

## Final review and release
- [x] Independent code review of complete diff; fix important findings, scoped re-review.
- [ ] Fetch main; stage exact files, commit and push only after tests/build. Check Vercel and Railway, production smoke. Do not claim real iOS device testing.

## Preflight interface review
Task1 produces timing fields consumed by Task3; no shared files. Task2 produces standalone components imported by Task3; parent alone changes screens.js. Backend schema and outcome booleans remain compatible. Presentation timing defaults to immediate for old servers. Rule: world map is animated decoration, not invented opponent positions. Rule: client local league remains local, this change repairs outcomes without pretending to implement server-wide ranked competition.

## Verification evidence
127 backend tests pass;72 React tests pass;90 browser modes across320x480,375x550,390x664,430x760,1440x900 pass. Additional map/faceoff visual inspection390x844/320x480/430x760 including12s fallback. Real isolated backend two-player6-round duel +rematch pass, reading stage allhidden/disabled, full countdown, steady question position and outcome LP verified. CI=true production build compiledsuccessfully. Independent whole-diff review closed with no important findings after capability negotiation and legacy reconnect countdown correction. Native iPhone Safari not directly exercised.
