# Pulse Sunday conversion

Sources: `public/generated-flyers/assets/pulse-target.png` and
`public/generated-flyers/assets/pulse-square-story-bg.png`. Both originals are preserved.

Deliverables:
- `public/generated-flyers/pulse-master.html`: authored CSS, `?format=square` or `?format=story`.
- `public/generated-flyers/pulse.nflyer`: portable compiled project, loaded through Project → Load Project File.
- `scripts/build-pulse-master.mjs`: reproducible extraction and compile.

The background sheet is 1536×1024. The adapter extracts Square from
(9,87,834,834), and Story from (950,0,576,1024), excluding white sheet margins.
These become 1080×1080 and 1080×1920 PNG backgrounds. It uses the supplied
compositions, not the reference screenshot as a flattened flyer.

Both formats have explicit CSS positions. Editor font scaling is 540/1080.
There are 15 compiled objects per format, including 10 independently editable
text fields. The two outline SUNDAY echoes read the headline field. Date parts
use existing Date controls; the offer uses Price, PULSE uses Headline 2,
reservations use the existing contact rail, and the address uses Venue/Address.
No extra desktop editor is added. The saved project embeds WebP backgrounds.
LEMONMILK Bold/Light are app fonts; Times New Roman and Arial are system fonts,
so exact serif rendering can vary across platforms. The supplied background
art differs from the target; typography is adapted over that supplied art.

Rebuild: `node scripts/build-pulse-master.mjs`.
Browser verification: `node scripts/verify-pulse-import.mjs`.
`NF_PREVIEW_ONLY=1` skips the repeated text-selection pass.
Evidence lives in `/private/tmp/pulse-verification/`.

Compiler results: 15 compiled, zero approximated or unsupported objects,
and no warnings in either format. Thirteen focused tests pass. All ten text
fields were selected in both formats without a desktop floating editor.
The renderer now supports compiled outline strokes and uses the text canvas
coordinates for SVG gradients, avoiding a compressed middle-color band. Compiled price objects also suppress
the native badge before recipe registration, preventing duplicate offer text.
Existing unrelated repository TypeScript failures remain; no app/page.tsx errors
were reported in the checked version. The updated editor save is now registered as version 2. It is authoritative;
do not rebuild over it with the original CSS compile script. Recipe previews
use the `-v2.png` files under `public/coco-references/recipe-exports`.

Final editor previews: `public/generated-flyers/pulse-square-preview.png` and
`public/generated-flyers/pulse-story-preview.png`. Final browser run passed
with no page/render-loop errors and no duplicate native price badge.
