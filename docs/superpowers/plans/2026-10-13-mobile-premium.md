# QuizzUp mobile polish implementation plan

**Goal:** Correct the iPhone layout defects and make player identities and the duel experience coherent with the approved QuizUp video reference.
**Architecture:** Keep React 18 and the current server-authoritative protocol. Shared PlayerAvatar renders the existing ten illustrated sprites. Scope new styles after mobile-comfort; no dependencies or backend changes.
**Spec:** User-approved conversation and videos, Oct 13 2026. Preserve red/yellow brand, four destinations plus center play, ten avatars, 33 catalogue items and their server prices.

## Task 1: Shop artwork and presentation
- Replace emoji-based previews with the shared illustrated PlayerAvatar. Old lion emoji and rank frames must never appear in shop effects.
- Rebuild entry/reaction artwork with layered vector effects, deliberate motion, readable static thumbnails, a preview inside duel context and reduced-motion support. Keep all item IDs/prices and callbacks.
- Files: shop-art.js, shop-art.css; only the shop section/imports of screens.js. Leave other screens to coordinator.
- Verify modal keyboard/focus, replay, purchases and pending state. Reuse existing sprite sheet, no asset generation needed.

## Task 2: Duel presentation and truthful feedback
- Files: enhanced-QuestionContent.js, multiplayer.js, duel-premium.css and focused duel tests.
- Shared PlayerAvatar replaces emoji/rank decorations. HUD shows explicit waiting/answered state without false correctness before a full result.
- Use pointsEarned/yourScore from answer_ack; never fabricate scores. Smooth score/gauge update, large mobile answers, staggered question/answer entrances keyed per round, reduced-motion fallback.
- Preserve no correct-answer leak to unanswered choices, group/solo/reconnect/timeout behavior, report/chat. Coordinator adds App.js message handling and intro.

## Task 3: Root layout, profile and quiz detail integration
- Files: App.js, ui.js, screens.js outside shop, mobile-comfort.css; shared PlayerAvatar files.
- Full-height continuous shop background, one page scroll, safe insets once, navigation bottom reserve. Reset scroll when entering browse screens; quiz detail must start with reachable header and scroll to last content.
- Profile uses opaque dark surfaces and legible foregrounds; verify actual rendered contrast. Starter/profile editor uses free robot or owned collection avatars only, preserving server ownership authority.
- Waiting and first-round VS use avatars/name/level, no IdentityCard/frames. Later rounds retain short intro.
- App handles valid answer_ack and opponent_answered scoped to current round; full result remains final authority. Keep score and effect handling once per question.

## Task 4: Verification and final code review
- Extend real-component preview with quiz-detail and intro, modern equipment, waiting/ack/full-result states; test widths 320,375,390,430,1440 and short/tall viewports.
- Run meaningful regression tests, CI=true production build, browser interaction/overflow/contrast checks and two-player local six-question duel including waiting feedback and rematch.
- Dispatch independent reviewer against full diff from 1af61b4; resolve important findings, re-test changed paths. Do not publish until review and checks pass.

## Progress
- Baseline: isolated worktree codex/mobile-comfort-20261012, remote main 1af61b4, clean.
- Ruflo tools searched in registry; unavailable. Use the installed subagent-driven-development and requesting-code-review workflows.
- Ruling: old lion emoji maps to free robot in display; purchased illustrated lion remains one of the ten collection characters. No destructive profile migration.
- Ruling: point gauge represents confirmed points after acknowledgment, not an invented pending score. Pending answer stays neutral until acknowledged.
- Task 1 complete: 33 catalogue items preserved; layered SVG effects and context preview, finite motion, pending/focus/replay verified at five widths.
- Task 2 complete: confirmed-points ring, waiting/answered states, neutral opponent feedback, large adaptive answers, round entrances and reduced motion.
- Task 3 complete: continuous shop canvas and one bottom reserve, profile text contrast >=4.5:1 in rendered checks, quiz header/last content reachable, shared public avatars across all consumers.
- Task 4 complete: 54 frontend tests; 90 viewport/screen variants; isolated real two-player six-round duel and rematch; CI=true production build compiled successfully.
- Independent code review found two P2 defects (public IDs rendered as text; duplicate outcome sound). Both fixed with regressions; scoped final review found no remaining important findings. Report in ignored frontend/.mobile-preview/final-review.md.
- Verification limitation: responsive Chromium/Edge plus source review, not an actual iPhone Safari device run. User should verify the final phone video before launch.
