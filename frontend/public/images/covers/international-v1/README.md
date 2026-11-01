# International editorial covers

21 existing illustrations were retouched with the built-in image tool to remove their integrated French headings. React renders translated French/English titles separately, with matching gold editorial typography. Flags, team emblems and scenery remain part of the image. Club and franchise wordmarks elsewhere are unchanged.

The user explicitly deferred five cinema illustrations: Disney Classics, Disney Renaissance, Horror, Science Fiction and 2000s Cult Movies. Their original approved-v2 images remain active. No sourced photo substitutions for those five are published.

The active collection contains 63 WebP files (320/640/1024px), totaling 8,160,414 bytes. Median 320px variant: 37,418 bytes; maximum: 52,242 bytes. `credits.json` records edited-original checksums and preparation information; public credits include this collection. Prior images remain available at their original paths.

Title translations and placement are in `src/internationalTopicTitles.json`. Active cover metadata is in `src/internationalCoverSources.json`. Adding a language requires translating title data rather than regenerating the illustration. This release supports the application's existing French and English languages; quiz question content is outside this change.

Manual preparation: `node frontend/scripts/prepare-international-covers.cjs <local-manifest.json>`, with Sharp installed or SHARP_PATH set. The manifest lists exactly the non-pending keys, each with key, path, kind, credit, and optional source/license metadata. The script resizes edited originals and updates credits; it does not perform image generation or run during the build.

France correction: the active Foot français illustration now carries exactly two gold stars. Versioned foot_fr-two-stars filenames bypass older cached images; three previous variants remain for older cached application bundles. Prompt: change only the three-star group to exactly two symmetric gold stars above the rooster, preserving all other details, with no text or watermark. Built-in image tool used; inspected before publishing.
