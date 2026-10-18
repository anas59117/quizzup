# Task 5 backend report

Implemented persistent sequential friend duels and both backend-review fixes. Backend tests pass; independent final review and browser integration remain root-owned. No push performed.

## Work product

- `backend/async-challenges.js`: fixed six-question server bank, per-player persisted rounds, 2050 ms presentation followed by a full 10000 ms answer window, existing 20-to-5 elapsed scoring and final-round multiplier. Integer answers only; early answers rejected, late answers score zero, early timeout claims rejected. Resume expires an elapsed round once. Repeated answers return original feedback without advancing another round. Sender can play pending; recipient must accept. Current friendship/ownership checked on every action. Opponent score remains absent until both finish. Completed result remains readable after invitation expiry. Runs bounded to 5000. No async XP/coins awarded.
- `backend/challenges.js`: persisted async mode, accepted async expiry, interrupted accepted live cards expire on startup and update stored messages.
- `backend/game.js`: forfeits record observed/revealed answers once with zero theme XP, preventing wrong-answer/leave streak preservation. Human opponents carry canonical clientId in game_start.
- `backend/messaging.js`: result DM preserves authoritative `{outcomes:[{id,outcome}]}`, including higher-scoring forfeits.
- `backend/posts.js` / `server.js`: personalized feed reaction state and actor reaction acknowledgments; async WS dispatch flushes stores before state response.
- `backend/async-challenges.test.js` / `social-protocol.test.js`: engine, actual store, restart, and authenticated two-client WS coverage.

## Wire

`challenge_create {targetId,category,mode:'async'}`; omitted mode stays live. `challenge_respond {challengeId,accept}` can accept async while sender offline.

`async_challenge_play {challengeId,requestId?}` and `async_challenge_answer {challengeId,round,answerIndex,requestId?}` return `async_challenge_state {challengeId,status,round,score,question?,feedback?,result?,requestId?}`. Round is zero-based; status playing/waiting/completed. question contains `{question,answers,image?,timeLimit:10,remainingMs,opensInMs,readingMs:1500,answerStaggerMs:100,answerEnterMs:250,round,totalRounds:6}`. Initial opensInMs is 2050. feedback is `{round,correct,correctIndex,pointsEarned}`. result appears only when both finished: `{gameId,category,scores:[{id,score}]}`. Social errors echo action, challengeId and requestId (bounded to 80 characters).

`feed_list.posts[].reacted` is viewer-specific. `post_reacted` includes `{id,reactions,actorId,reacted}`; reacted describes actorId, so other viewers update only count. `game_start.opponents[].clientId` identifies human opponents.

## Verification

From `C:/Users/User/Desktop/quizzup-mobile`, PowerShell:

```powershell
node --test backend/async-challenges.test.js
$env:DATA_DIR = Join-Path ([System.IO.Path]::GetTempPath()) ('quizzup-backend-final-' + [guid]::NewGuid()); npm test --prefix backend
git diff --check -- backend
```

Actual unit result: tests 6, pass 6, fail 0, duration 2117.1689 ms. Final full result: tests 149, pass 149, fail 0, duration 38039.759 ms. Whitespace check exit 0 (Git CRLF conversion warnings only).

Authenticated WS integration exercises sender finishing with recipient offline, process restart, recipient acceptance with sender offline, identical first question, both six-round runs, hidden opponent scores until complete, early answer rejection with requestId, replay dedupe, authoritative persisted history/result equality, live game start, viewer-specific reactions, and canonical opponent IDs. Engine tests additionally cover exact-deadline answers, elapsed score, malformed/forged input, unauthorized player, friendship removal, decline, expiry, reload, repeated completion, no XP, both revealed and unrevealed forfeit progression, and persisted interrupted-live DM status.

The first real WS test exposed and fixed an inherited mismatch: actual bank records use `text`, while synthetic fixtures had used `question`. Final tests use the real bank shape.

## Limits

Single-instance JSON persistence remains. Stores are individually atomic, not a multi-file transaction; abrupt storage failure during completion remains subject to the existing persistence model. No async rewards in this rollout. Browser UX, deployment, and independent review are not claimed by this backend report.
