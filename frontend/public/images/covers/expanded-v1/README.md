# Catalogue expansion: 55 covers

This collection contains 23 real photographs, 13 sourced game/series promotional artworks, and 19 illustrations generated for QuizzUp. Generated images are not official posters. The previous approved cover collection is unchanged.

See `credits.json` and `/image-credits.html` for each image's original source, author, stated license, and preparation information. Promotional artwork credits describe its source rather than claiming a free-content license.

The 161 WebP files provide 320px, 640px and up-to-1024px variants without enlarging originals. Total image size is 14,011,194 bytes. The median 320px thumbnail is 19,628 bytes; the largest is 50,442 bytes. Browser requests select an appropriate size through srcset.

The manual preparation command is `node frontend/scripts/prepare-expanded-covers.cjs <local-source-manifest.json>`. It requires Sharp (or SHARP_PATH), validates all 55 catalogue keys, and emits images, metadata and credits. Its input records use key, kind, url (or a local path), source, credit, license and licenseUrl; optional focal, fit and embeddedTitle fields control presentation. Source originals are cached outside the published collection with a hash of the source URL. The script does not run during builds, and clients do not depend on third-party image servers.
