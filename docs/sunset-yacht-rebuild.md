# Sunset Yacht / Sunset Sessions

Requested replacement for gallery ID `sunset_yacht`. Yacht Escape is a separate
accepted template and remains untouched. Supplied target is the finished square
flyer; supplied clean backgrounds are `assets/sunset-yacht-square.jpg` (1080²)
and `assets/sunset-yacht-story.jpg` (1080×1920), under `public/generated-flyers`.

Source: `public/generated-flyers/sunset-yacht-master.html`.
Builder: `node scripts/build-sunset-yacht-master.mjs`.
Project: `public/generated-flyers/sunset-yacht.nflyer`.
Gallery sessions: `lib/template-data/sunset-yacht-v2.json`.
Original gallery source archived byte-for-byte with SHA-256 in
`recipe-file-backups/sunset-yacht-rebuild/provenance.json`.

The existing semantic compiler/materializer uses editorTextScale .5 and explicit
Square/Story layouts. Sixteen independent text objects include an empty details
label authored explicitly during finalization because extraction omits empty
text. Twenty-four total objects per format, no compiler warnings. Gold texture
is a code-native SVG clipped inside editable text, using the existing texture
renderer and a permanent public URL. Original supplied backgrounds are unchanged.

Typography is an adaptation: Didot (local system font), bundled Dear Script,
LEMONMILK-Light and LEMONMILK-Bold. Didot is not bundled; identical rendering on
other operating systems is not established. No AI artwork generation was used.

Validation commands:

```sh
node --experimental-strip-types --test tests/coco-sunset-yacht.test.ts
node scripts/render-sunset-yacht-study.mjs
NF_OUTPUT_DIR=/tmp/sunset-yacht-check node scripts/verify-sunset-yacht-import.mjs
```

Two structural tests pass. CSS Square/Story previews were visually inspected.
Both final editor previews were visually inspected. The initial diagnostic
preview exposed percentage-sized SVG texture letterboxing and a default left
rail; the builder now uses shared full-word pixel texture dimensions and clears
the unused rail. Both formats passed all 30 visible-text selection checks, headline/subtitle
editing, mood/address L/C/R, empty label type/clear/retype and project save/reopen.
The final tracking assertion initially retained Black Tie's .55 expectation;
actual saved/restored tracking was correctly .28. That assertion was corrected;
the focused saved-project recheck passed with no captured runtime errors. Full paid export
and cross-browser rendering are not verified. This construction draft is not an accepted user-edited save.

Gallery replacement is connected under the existing `sunset_yacht` ID with label
**Sunset Yacht — Sunset Sessions**, final Square preview and both compiled sessions.
Durable editor previews: `public/generated-flyers/sunset-yacht-square-preview.png`
and `sunset-yacht-story-preview.png`. These are editor screenshots, not PNG exports.

Final browser logs: `/tmp/sunset-yacht-final.log` (30 selection checks, edits and
save/reopen; ends at the stale fixture assertion) and
`/tmp/sunset-yacht-roundtrip-check.log` (focused corrected round-trip PASS).
Focused command:

```sh
NF_ROUNDTRIP_ONLY=1 NF_VERIFY_FILE=/tmp/sunset-yacht-roundtrip.nflyer NF_OUTPUT_DIR=/tmp/sunset-yacht-roundtrip-check node scripts/verify-sunset-yacht-import.mjs
```

The existing dev server became unresponsive and was restarted on port 3000.
No shared runtime files were changed. Dedicated shadow toggling, size/leading
controls, layer movement and paid PNG export were not exercised in this template's
browser pass. Existing shared behavior is reused; do not claim those checks passed.
Nothing was committed or deployed. Preserve the user's next accepted editor save.

## Gold softness refinement

User requested softer headline gold. Added a 1.8-unit Gaussian blur to the foil
texture and reduced its overlay opacity from .38 to .30 in
`public/generated-flyers/assets/sunset-yacht-gold.svg`. This softens the material
inside the existing glyph clipping; letter edges and editable text stay intact.
Both formats share this asset, so no project rebuild or layout changes are needed.

Both editor previews were refreshed and visually inspected; preview-only browser
verification passed without captured runtime errors. Log: `/tmp/sunset-yacht-soft-gold.log`.
