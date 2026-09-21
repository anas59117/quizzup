# QuizzUp Design System

QuizzUp's visual direction is **editorial gaming**, not generic glassmorphism.

## Principles

- **One brand accent.** Rose is for primary actions, active state and identity.
- **Photography over decoration.** Featured topics should use real quiz imagery when available.
- **Flat poster palette.** Topic fallback art uses a small set of solid colours, not rainbow gradients.
- **Sharp hierarchy.** Large type for moments that matter (quick play, round, result); compact labels elsewhere.
- **Fewer pills.** Use 10–14px radii for controls/cards. Reserve circles for status indicators only.
- **Restrained motion.** Motion confirms an interaction; it should not decorate every element.
- **Mobile first, desktop intentional.** Mobile stays thumb-friendly; desktop uses a true wide composition rather than a stretched phone layout.
- **Server state stays visually honest.** Do not optimistically show sent/accepted states before the server confirms them.

## Brand

- Primary dark background: `#0b0b0c`
- Brand accent: `#e41d61`
- Light-surface accent: `#d92f51`
- Brand mark: asymmetric rounded **Q** tile
- Font: Outfit 400–900
- Main navigation icons: custom line SVGs, not emoji

## Shape language

- Inputs / normal buttons: 10–11px
- Small cards / rows: 11–14px
- Hero surfaces: 18–22px with an occasional asymmetric corner
- Avatars used as UI controls: rounded square, not generic circular bubbles

## Topic art

Home's featured rail is intentionally photo-led. Full category browsing can use emoji fallback art when no owned/cleared photo exists.

Do not reintroduce `linear-gradient(...)` category backgrounds as a default. Cover-photo overlays are allowed only for legibility.

## Accessibility

- Interactive targets should stay around 44px minimum.
- Primary CTA colours must keep readable white-text contrast.
- Every icon-only button needs an accessible label.
- Respect `prefers-reduced-motion`.
- Maintain visible keyboard focus states.

## Review checklist

Before merging visual work, verify:

1. Mobile width around 360–390px.
2. Desktop width around 1440px.
3. Both dark and light themes.
4. Join, Home, Themes, Feed, Profile, Lobby, Question and Result screens.
5. No new emoji-only navigation controls.
6. No optimistic success state for network-backed actions.
7. Production frontend build passes.
