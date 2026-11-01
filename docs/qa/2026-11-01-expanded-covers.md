# 55-topic cover expansion

## Scope

Added the 55 topics already present in the backend to the frontend catalogue, including family, translated display labels, descriptions and gradient fallbacks. Each now has a local responsive cover. Existing approved covers retain precedence.

Collection: 23 actual photographs, 13 sourced game/series promotional artworks, 19 generated illustrations. All sources and stated licenses are recorded in the public image credits. Generated artwork is explicitly described as generated, not official. The collection contains 161 WebP variants totaling 14,011,194 bytes; 320px thumbnail median 19,628 bytes, maximum 50,442 bytes.

No gameplay, backend persistence, infrastructure configuration or database activation was changed.

## Verification

- Frontend full suite: 251 tests passed across 25 suites.
- CI=true production build: Compiled successfully.
- Chromium and WebKit: all 55 cards decode at 320px, 390px and 430px viewport widths; no horizontal overflow or runtime JavaScript errors.
- Six real detail components checked at each width: Ariana Grande, Tottenham, Mathematics/Logic, The Mandalorian, Dark Souls and Surf. Play buttons remain reachable.
- Search for Kendrick -> category detail -> Play verified with the development fixture.
- Missing-image fallback verified without breaking the Play action.
- Catalogue expansion keys and labels checked against backend category inventory.
- Read-only independent code review: no remaining concrete findings after corrections.

WebKit coverage is browser-engine emulation, not a claim of physical iPhone/Safari testing. The preview uses fixtures and does not exercise a real multiplayer match or purchase flow.

## Corrections during verification

- Preserve full embedded TV-poster titles using contain, and avoid duplicate captions.
- Use a recognizable Kendrick photograph rather than a distant crowd image.
- Key original image cache by source URL hash so changing a source cannot silently retain the previous image.
- Cap portrait artwork height by the same mobile viewport budget as square art; this fixes a reproduced Play/navbar overlap at 320px.
- Translate the category-family fallback label on quiz details.

Reproducible browser check: build the mobile preview, then run `node frontend/scripts/mobile-preview/expanded-covers-check.cjs`; set COVERS_WEBKIT=1 for the WebKit pass. The preview gallery is available under `?new-covers` and is not a production navigation item.
