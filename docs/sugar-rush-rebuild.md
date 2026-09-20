# Sugar Rush — Suite 5

Replaces the `sugar_rush` gallery entry previously labeled Birthday Bash Flyer, as explicitly requested. Uses the supplied clean Square and Story backgrounds (`assets/sugar-rush-square.jpg`, `assets/sugar-rush-story.jpg`) with separate 1080×1080 and 1080×1920 compositions. The target image is reference artwork only.

SUGAR uses **Ladies Neon Chrome PNG**, the same corrected family as the previous Ladies Night template. This extends its authorized use to these two templates; it remains absent from shared font menus. RUSH uses the existing editable **Drift Brush SVG** family in pink. No font source or Ladies Night layout changed for this replacement.

The construction source is `public/generated-flyers/sugar-rush-master.html`. The dedicated `scripts/build-sugar-rush-master.mjs` adapter uses the established browser extractor, semantic binder and Coco materializer to produce `sugar-rush.nflyer` and `lib/template-data/sugar-rush-v2.json`. It contains 20 independent text owners, including the initially empty details label. DJ names, offer and time, venue/address, reservations, and QR caption are independent. The QR is the native uploadable/replaceable UI placeholder.

Before replacement, the existing gallery registry and Sugar Rush layout 1/2 JSON files were archived byte for byte with SHA-256 under `recipe-file-backups/sugar-rush-rebuild/`. Preserve newer user saves rather than regenerating them from this master.

Both formats compiled with no warnings or unsupported objects. Structural coverage is in `tests/coco-sugar-rush-rebuild.test.ts`; browser verification uses `verify-sugar-rush-import.mjs` and `verify-sugar-rush-effects.mjs`. Previews are actual editor captures. Paid PNG export is not verified; no deployment performed.

Final acceptance passed: all visible text selection/editing, details-label type/clear/retype, QR upload/reset, font-menu exclusion, typography/shadows/layers, independent format sessions, and project save/reopen. Both actual previews were visually reviewed; two structural tests and focused lint passed.
