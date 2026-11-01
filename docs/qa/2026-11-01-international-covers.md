# International cover titles

## Authorized scope

Initially identified 26 integrated French titles. The image tool rejected the five-cover cinema batch. The user then explicitly chose to keep those five original posters temporarily rather than substitute sourced images. Shipped scope is therefore 21 edited illustrations with independent FR/EN text titles; the five pending entries remain explicitly marked imagePending.

Deferred images: disney, disney_renaissance, films_d_horreur, science_fiction, films_cultes_2000s. Their original artwork remains active. Photos sourced while evaluating an alternative are not part of the published collection.

## Implementation and review

- Built-in image tool used for 21 retouches; existing source illustrations were viewed first. No source artwork was overwritten.
- Active international covers take precedence over previous approved illustrations; unrelated covers and the RDC flag are unchanged.
- Title text, accessible button labels and quiz-detail headings follow the existing live language context. Search accepts English translated titles as well as existing French labels.
- Static cards outside I18nProvider retain a French fallback.
- Gold Cinzel display typography is positioned independently from the art. Long words use a smaller scale and remain unbroken. No broad dark overlay was introduced.
- Local source manifest was checked against the 21 edited images by inspecting a contact sheet. Public credit metadata records original checksums.
- Independent read-only code review found no remaining concrete defects before the final typography adjustment.

## Validation

- Red test run: 27 failures/1 pass before implementation, correctly exposing baked images and untranslated titles.
- Full frontend suite: 279 tests passed in 26 suites.
- CI=true production build compiled successfully.
- Dedicated Chromium/WebKit checks cover all 21 titles in French/English at 320/390/430px, live language switching, image decoding, title/card bounds, long-word overflow, preservation of the five original cinema posters, detail titles and reachable Play controls, plus English search -> quiz navigation.
- Browser-engine tests do not claim physical iPhone/Safari testing or translation of question content.

Final checks are recorded in the local international-browser-final.log, international-webkit-final.log, international-tests-final.log and international-build-final.log. The fixture gallery is `?new-covers&international`, with `&en` for English and a live language toggle. It is not a production navigation item.

## Image prompt set

The built-in tool was used for edits, not CLI/API generation. Input targets are the previous approved-v2 or expanded-v1 1024px WebP files. Every successful prompt requested one square image and preservation of all scenery, composition, light and color, with no replacement text, watermark or border.

1. Champions League: remove only “LIGUE DES CHAMPIONS”; reconstruct dark blue open sky; retain golden star-ball, stadium, lights and spectators.
2. Flags and the three Maghreb history covers: remove large gold French headings and their title plaques; reconstruct the natural scene; retain flags, landmarks, objects and decorative motifs.
3. French football, women's football, Spain, legendary goalkeepers and Germany: remove the large French gold heading and underline; reconstruct sky/stadium; preserve team faces, uniforms, jersey numbers, flags and symbolic emblem.
4. England, Senegal, transfers, mathematics and computing: remove only the gold French heading; retain people, architecture, national flags, emblems, technical diagrams and other illustration details.
5. Economics, psychology, law, tech entrepreneurs, world records and currencies: remove only the superimposed French heading; preserve objects and incidental marks such as coins, banknotes, clock numerals and diagrams; reconstruct uncluttered scene behind the heading.

The cinema batch was not retried after refusal; its original images remain per the user's decision.
