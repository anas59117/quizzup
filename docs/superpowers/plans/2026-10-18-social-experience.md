# Social Experience Implementation Plan

> For agentic workers: use subagent-driven-development and dispatching-parallel-agents for disjoint ownership. No worker may spawn helpers or reviewers. Root coordinates reviews.

**Goal:** Deliver the approved friend-centered social experience without changing navigation or duel mechanics.
**Architecture:** Extend current authenticated WS actions and bounded JSON persistence. Dedicated messenger UI consumes canonical messages; progression/history and community remain separate modules. Integrate existing App stages after component contracts stabilize.
**Tech Stack:** React18 CRA, pure CSS, Node/Express/ws, existing node:test/Jest/Playwright.
**Spec:** docs/superpowers/specs/2026-10-18-social-design.md

## Global Constraints

- Existing linked worktree C:/Users/User/Desktop/quizzup-mobile, base a0a5abf. Never revert unrelated edits; stage only owned files. Do not push until final review and build.
- Preserve4tabs+centralplay, theme backgrounds, personal photos, confirmed score and timing, WS16KiB cap, persistent /data volume.
- No dependencies, fake activity, unsafe image URLs, unbounded histories, score trust or cross-user reads.
- Shared wire contract documented below; notify root of necessary changes before changing it. All errors use feature-specific replies rather than global fatal error.

## Wire contract

Client actions: conversations_list; dm_history {targetId,before?}; dm_read {targetId}; dm {targetId,text,clientMessageId?}; challenge_create {targetId,category}; challenge_respond {challengeId,accept}; theme_follow {category,following}; match_history; existing feed_list/post_create/post_react plus post_comments {postId}, post_comment {postId,text}, post_question_answer {postId,answerIndex}.

Server: conversations_list {conversations:[{peer,lastMessage,unread}],unreadCount}; dm_history {targetId,messages,hasMore}; dm/dm_sent includes {message}; dm_read {targetId}; social_error {action,code,targetId?}; challenge_updated {challenge}; match_history {matches}; stats adds followedThemes and topics; post_created/post_commented/post_comments/post_question_result for community.

Canonical message: {id,fromId,toId,kind:'text'|'challenge'|'result',text,createdAt,challenge?,result?}. Canonical challenge: {id,fromId,toId,category,status:'pending'|'accepted'|'declined'|'expired'|'completed',createdAt,expiresAt}. Canonical match: {id,category,createdAt,score,opponentScore,outcome:'win'|'loss'|'tie'|'solo',opponents:[{id,name,avatar,score}]}. Determine direction from authenticated clientId, never from display name. Server identifies peers from social.profileOf. For live challenge acceptance reuse existing startGameGuarded and normal game events.

### Task 1: Persistent messaging, challenges and community backend

Ownership: backend/server.js; new backend/messaging.js, backend/challenges.js, backend/community-media.js; backend/posts.js/store-normalize.js only relevant posts normalization; corresponding tests. Do not edit game.js/topic-stats.js.

- [ ] Read current authentication, rooms, social membership, JSON writer and posts tests. Write failing node:test coverage for persistent offline DM, per-user history/read cursor, stranger refusal, bounds, challenge duplicate/ownership/busy guards, post comments and question answer disclosure.
- [ ] Implement messaging module with injectible store or isolated DATA_DIR tests,100messages/thread, bounded conversations, stable message IDs, server timestamps and read cursors. Reconnect identify sends conversation summaries. Reject nonfriends; check membership on each action. Message send success only after store accepted.
- [ ] Implement persisted challenge cards. Accept only recipient, pending, unexpired, friends, online/free participants; reserve atomically before async start, reuse startGameGuarded and restore pending on failed startup. Send game joined events needed by existing App. Export result recording entrypoint used by task3: messaging.recordMatchResults(game, results) and challenge completion if applicable. Agree exact export before integration. Offline pending challenges remain usable on return.
- [ ] Extend community storage with bounded comments, optional safe media and playable questions. HTTP media uses existing authenticated JPEG conventions,≤256KiB validated JPEG, generated opaque paths, no filesystem disclosure; frontend uploads compressed JPEG with token. Export route/API contract in report. Plain post text≤240, comment≤300, question4answers and hidden correct index until answer. Persist all normalized fields. Remove fabricated seed posts.
- [ ] Add theme following action persisted per authenticated user; export getter so fullStats includes followedThemes. Reply latest stats. Restrict to real category keys. Match history action calls task3 module.
- [ ] Run targeted tests then backend suite. Stage owned files only, commit. Write report at .superpowers/sdd/2026-10-18-social-experience/task-1-report.md with API details, actual tests/output and risks.

### Task 2: Premium messenger UI and social hook

Ownership: frontend/src/social.js; new Messenger.js, messenger.css, social-data helpers/tests. Do not edit App.js/screens.js/players.js/i18n.js. Component uses inline FR/EN locale dictionary or separate social-copy.js owned here. No server changes.

- [ ] Test reducer/history merging: IDs dedupe, reconnect replacement, unread based on server, correct own direction, offline pending send, feature error recovery. Preserve existing friends and GameChat APIs.
- [ ] Extend useSocial(wsRef, clientId) with canonical messages/conversations, requestConversations(), openConversation(targetId), markRead(targetId), createChallenge(targetId,category), respondChallenge(id,accept). Expose social.activeConversationId and closeConversation(); keep useSocial usable when clientId omitted in old fixtures. Send dm_read only when visible active thread, never mark received unread solely because selected when hidden. Handle reconnect identified by requesting data. Return booleans for disconnected sends; retain draft on failure.
- [ ] Export Messenger({social,onBack,onOpenPlayer,onInviteFriend,onJoinFriend,pending,initialPeerId?}). List friends/conversations with search, real unread counts, photo, last message/presence; requests discoverable. Thread with sticky safe-area header,44px back/profile/challenge actions, scrollable bubbles, dates, composer and keyboard support, drafts per peer. Challenge theme chooser uses CATEGORIES; cards accept/decline, statuses, result/rematch actions. Escape/back returns to list before leaving screen. No fake sample messages; explicit empty/loading/error.
- [ ] Art direction: QuizzUp red shell, warm ivory surfaces, charcoal text, gold challenge action, restrained shadow/20px cards. Real typography hierarchy, no neon/cliché visuals. Reduced-motion and focus-visible,320px/desktop, no bottom-nav/composer overlap. Styles self-imported plus tell integration to include CSS in preview builder list.
- [ ] Run tests/build syntax check. Commit owned files only, report exact component/hook contract and tests at task-2-report.md in same ledger folder.

### Task 3: Real progression, theme personalization and match history backend

Ownership: backend/game.js, backend/topic-stats.js, new backend/match-history.js and tests; optional frontend/src/theme-personalization.js pure helper/test only. No server.js or messaging files.

- [ ] Write failing tests for bounded deduplicated persisted match history owner reads, win/loss/tie/solo, bot opponent fallback, actual correct-question completion and streak, legacy normalization and recent themes.
- [ ] Record completed authoritative results exactly once in endGame without changing scores/timing/reward behavior. Capture opponent identities including fallback bots. Expose history.list(clientId,limit=30) and recordMatch(game) or documented equivalent. Record after results are calculated. Also invoke messaging.recordMatchResults(game, results) if task1 export available, or agree equivalent and wire once task1 ready. Never expose history of supplied other user.
- [ ] Topic stats retain xp/games/wins; add updatedAt, bestStreak and bounded correctlyAnswered question keys derived from bank questionKey. Completion denominator actual distinct bank questions, not fabricated progress; expose completion only where meaningful and track best streak across answers/reset errors. Existing tests retain shape expectations where required with deliberate updated tests.
- [ ] Optional pure helper selects followed/recent played categories for Home then sensible featured discovery fallback; no duplicate keys. Do not touch screens integration.
- [ ] Run targeted tests then report, commit owned files only. Report task-3-report.md including exact exports/fields used by integration.

### Task 4: App integration, community, history and duel exits

Ownership assigned after1-3 contracts: frontend/src/App.js/screens.js/players.js/feed.js, new community/history UI CSS/helpers, mobile-preview scripts and relevant tests; no other agents' files unless explicitly handed over.

- [ ] Integrate Messenger stage and browser back, visible Home Messages/unread, Friends access, profile/history/community entries; preserve navbar and home header fit320px. Open messages/challenge from PlayerSheet only friends, expose Addfriend otherwise. Finished results link to friend conversation. No global social error replaces game screen.
- [ ] Personalize My themes from actual played/followed data; separate discovery heading when no personal themes, real levels. Theme detail follow, community and rankings reachable, completion missing legacy honest label.
- [ ] History screen loads on entry/reconnect, clear empty/error/loading, opponent portraits/result, profile/challenge actions; own data only.
- [ ] Community refines current feed to responsive premium cards and composer: text/image/question, actual comments, reaction state, reporting, share via native then clipboard awaited with feedback; safe tokenized HTTP photo upload contract from task1. Form stays on failure, question answer feedback only on server, duplicate submission pending guards. Real empty feed. Scoped filters discard late replies; community refresh on reentry.
- [ ] Duel exit fades incorrect choices briefly while correct remains; preserve live question timing and cards sizes, reduced motion. Keep score rails palette and all input guards.
- [ ] Meaningful component tests plus real two-client Playwright friend request/accept, offline DM/reconnect/unread, challenge accept/decline, result thread/history and community text/image/question/comment. Mobile widths320/375/390/430 with keyboard/composer and dark duel framing.
- [ ] Full frontend/backend suites, CI=true build, independent final code review with fixes, staged exact files. Deployment follows existing authorized release workflow after verification; verify backend health and public frontend bundle.

### Task 5: Asynchronous friend challenges

**Backend ownership:** backend/server.js, challenges.js, new async-challenges.js and tests. No game.js edits needed; current live engine remains unchanged.
**Frontend ownership:** social.js/social-data.js/Messenger.js/messenger.css/social-copy.js and new AsyncChallenge.js/helper/tests; no App/screens edits. Existing Messenger hosts an asynchronous duel sheet. Task4 can proceed independently.

Interfaces: challenge_create accepts mode:'async' (default remains live). Persist mode in challenge cards and preserve through normalization. New actions async_challenge_play {challengeId}, async_challenge_answer {challengeId,round,answerIndex}; replies async_challenge_state {challengeId,status,round,score,question?,feedback?,result?}, social_error feature errors. question shape {question,answers:[4],image?,timeLimit:10,remainingMs,round,totalRounds:6}; feedback {correct,correctIndex,pointsEarned}; result only when both participants finished {scores:[{id,score}],category,gameId}. Scores for unfinished opponent hidden. Server owns all question sets, start timestamps and scores.

- [ ] Backend creates fixed6question bank set when creating async invitation, stores it server-side (no correct indexes exposed). Friend owner checks every operation; recipient explicitly accepts async without requiring sender online. Sender can play after creation; recipient after acceptance. Decline prevents further play.24h expiry and bounded retained challenges/runs.
- [ ] Per-user/per-challenge round with server start timestamp,10s deadline, one accepted answer/round, integer0..3 or-1 timeout only, no client duration/score trust. Play/resume same round; expired round automatically scores0 and advances without replay; frontend timeout sends-1. Answer response returns prior feedback plus next playable question, or waiting/complete. Idempotent duplicate answers do not advance another round. No fabricated opponent scores before completed. Both complete persists result thread and authoritative history once; partial run never gets multiplayer win reward. Same bank for both. Do not alter existing live scoring/rewards; async can explicitly have noXP/coinaward for initial rollout.
- [ ] Frontend adds clear Live / Chacun son tour choice in theme chooser, defaultlive. Async cards show play/accept/decline/waiting/completed accurately. AsyncChallenge component insideMessenger uses dark/glacier/copper approved duel styling, question first1500ms then answers; starts server10sec deadline after agreed reading phase, at least44px answers, photo2x2/textstack, visible timer/score and correct feedback. Readstate/disconnect drafts unaffected; close returns conversation without losing server run; show no fake presence. Form request IDs/pending prevents duplicate and stale responses. Handle reconnect/resume and timerexpiry, reducedmotion,320pxkeyboard layout.
- [ ] Isolated backend tests fixed questions, privacy, early/late/duplicate answers, resume, friend removal, completion/result/history dedupe. Frontend tests timing/stale events/status controls. Real two-client browser test friends playing sequentially with second offline then reconnect; result thread must match server history. Include task5 in final review and build.

## Verification record — 2026-10-19

Implementation commits: b9d1aeb,00522d3,934e67a,2b7cec8,00db6be,879f651,843605f,2c54b53,fd40f2f. Independent initial review findings concerning forfeit progression, interrupted live invitations, nested browser Back and reachable friendship removal are all addressed; final scoped review approved fd40f2f with no outstanding P1/P2.

Full backend suite:150/150 passed, including a clean sequential execution to avoid shared Windows test-store contention. Full frontend CI suite:122/122 passed across19 suites. CI production build compiled successfully. Real two-client browser checks cover offline messaging/unread/reconnect, live six-round duel/result/history, sequential asynchronous six-round runs with fixed questions and canonical scores, community images/questions/comments, shared post links, device Back/draft retention and confirmed friend removal. Responsive checks cover320/375/390/430 widths and320x500 keyboard layout.

Release integration preserves subsequent origin/main quiz additions; rerun affected content/progression tests and build after merge. Runtime data volume remains unchanged. Generated previews/test artifacts are excluded from the release changes. Async friendly challenges intentionally award no XP/coins, disclosed in the waiting/completed screen.
