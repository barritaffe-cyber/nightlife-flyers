# Fashion Club Vertical — Friday Fever

Replacement target supplied September 12, 2026: red velvet fashion portrait,
mirrored disco ball, tall ivory FRIDAY / gold FEVER at left, date and DJs at right.
Only Fashion Club Vertical is replaced; the other 24 registered recipe designs
remain unchanged. The old project and gallery data are archived with SHA-256 in
`recipe-file-backups/friday-fever-rebuild/manifest.json`.

Sources: existing clean `public/generated-flyers/assets/friday-fever-background.png`
and `friday-fever-master.html`. The background and draft were already present at
session start. The draft title was too short and flat; the revised master uses
explicit rotation and axis scaling, editable Anton with reusable SVG foil textures,
Bebas Neue supporting display and Lemon Milk utility copy. The typography and
texture are adaptations, not exact matches to the supplied raster reference.
Story uses its own crop and title geometry; the reference supplied was Square.

Build: `node --experimental-strip-types scripts/build-friday-fever-master.mjs`.
Render source: `node scripts/render-friday-fever-study.mjs`.
Portable output: `public/generated-flyers/friday-fever.nflyer`.
Compiled sessions: `lib/template-data/friday-fever-v2.json` (recipe version 3).
There are 21 objects per format: background, four rules, 15 visible independently
bound texts, and an empty editable details label. No QR. DJ names are separate.

Integration: existing `fashion-club-vertical` ID; portable loader, recipe metadata,
recipe preview registry and registered-gallery builder point to Friday Fever.
Rebuild gallery using `node --experimental-strip-types scripts/build-registered-recipe-templates.mjs`.
Existing `fashion-club-vertical.nflyer` is preserved as historical source; the new
loader uses `friday-fever.nflyer`.

Validation commands:
- `node --experimental-strip-types --test tests/coco-friday-fever-rebuild.test.ts tests/registered-recipe-templates.test.ts`
- `NF_OUTPUT_DIR=/tmp/friday-fever-final node scripts/verify-friday-fever-import.mjs`
- `node scripts/verify-friday-fever-effects.mjs`
- `NF_PREVIEW_ONLY=1 NF_ACCEPTED_PREVIEW=1 node scripts/verify-friday-fever-import.mjs`

Both source layouts and actual editor Square/Story output were visually inspected.
Four structural tests and 27 shared shadow/glass/typography tests pass. Focused lint
passes; app lint reports zero errors and three existing unused-variable warnings.
A shared renderer fix routes textured subtitles through the existing per-letter
texture component, restoring live subtitle shadows. The effects checker inspects
SVG paint as well as spans.
The required full editor suite was attempted but stopped in its first Chrome PNG
picker check: the `Use Chrome PNG lettering` button was not found within 30s.
This unrelated picker failure is unresolved; the full suite is not green.
Paid PNG export is not verified.
No commit or deployment.

Final browser results: clean final Square and Story previews captured and inspected.
All 15 visible text owners selected in both formats; title editing, details label
clear/retype and details/address alignment exercised. The final effects suite
passed size, spacing, leading, visible per-letter shadows, layer controls, and
independent Square/Story save/reopen (including differing subtitle tracking).
Earlier full import run completed selection and first save/reopen but was interrupted
by a development reload during its final tracking loop. The isolated unchanged-layout
roundtrip checker treats authored CSS `start` alignment as the equivalent `left`.
The isolated unchanged-layout roundtrip retry timed out waiting for the download
at 30 seconds. This check is not marked passed. The separate final effects suite
successfully downloaded, reopened and validated both format sessions. No export
or blanket all-editor acceptance claim is made.

## Accepted user update

User replaced the public Friday Fever file in place (September 12). The exact
Square/Story sessions are now the gallery source. SHA-256 and byte-identical
archive recorded in `lib/template-data/friday-fever-saved-source.json`. The builder
guard is active; do not rebuild the CSS over this accepted save. Portable cache
revision is the first 12 hash characters. All four template/gallery tests passed.
Both updated actual editor previews refreshed and visually inspected. Preview run
passed without page errors. Exact source/archive bytes and every gallery session
field verified (accounting only for gallery image externalization and asset-list
normalization). Only Fashion Club Vertical changed among the 25 gallery entries.
