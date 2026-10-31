# Accessibility structure and keyboard navigation — 2026-10-31

Scope: add named main landmarks and one focusable primary heading to browse screens;
complete profile section headings; provide a French/English keyboard skip link.
Keep the existing covers and visual design. Timed gameplay and modal focus traps
do not expose the skip link. Activating it focuses the content heading without
changing the URL or browser history.

Verification completed:

- 24 frontend suites / 195 tests passed; the 11 accessibility cases were rerun
  after the final Safari keyboard adjustment.
- CI=true production build: Compiled successfully.
- accessibility-check.cjs: Chromium and WebKit, 320/390/430 px, light/dark,
  five screens (60 combinations); first Tab reveals the link, Enter focuses
  the heading, subsequent Tab enters content, no horizontal overflow or runtime
  errors. Conversation heading, modal exclusion and timed-screen exclusion passed.
- WebKit required explicit tabindex=0 for the skip anchor to participate in its
  default keyboard navigation. Verified in the browser, not just jsdom.
- Before/after 390 px captures retain identical page dimensions. Home, themes
  and profile compare pixel-identically at the comparison threshold. Messages
  and quiz show under 0.1% changed pixels in captures with animated decorations.
- Existing actual-App social-check.cjs passed: real onboarding, profile/friend
  requests, persistent/offline messages, six-round duel, full rematch, history,
  community uploads/comments/deep links and friend removal; mobile widths
  320/375/390/430 and zero runtime errors.
- Independent read-only code review: missing accessibility CSS in the async test
  harness fixed; no remaining concrete product findings.

Commands (frontend directory):

    CI=true node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand
    CI=true npm run build
    node scripts/mobile-preview/build.cjs
    node scripts/mobile-preview/accessibility-check.cjs
    node scripts/mobile-preview/social-check.cjs

This is targeted remediation, not a WCAG certification. Physical iPhone and
VoiceOver/NVDA testing were not performed.
