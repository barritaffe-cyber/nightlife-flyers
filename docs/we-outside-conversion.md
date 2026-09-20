# We Outside Saturday

Conversation image 1 is the visual target. Image 2 is the supplied square/story
art sheet: `public/generated-flyers/purple-square-story.png`.

- CSS: `public/generated-flyers/we-outside-master.html`, with `?format=square` or `?format=story`.
- Coco project: `public/generated-flyers/we-outside.nflyer` (both sessions).
- Build: `node scripts/build-we-outside-master.mjs`.
- Browser check: `node scripts/verify-we-outside-import.mjs`.
- Tests: `node --test tests/coco-we-outside-compile.test.ts`.

The build extracts the square artwork from (5,113,894,874) and story artwork
from (912,0,624,1024), excluding the sheet's white margins, then center-crops
to 1080×1080 / 1080×1920. It preserves the original sheet and embeds WebP
backgrounds into the saved project.

Twelve editable text objects use the existing controls, including bubble wording
through Subtag and OUTSIDE through Headline. The blank speech bubble is a true
vector SVG (`assets/we-outside-speech-bubble.svg`) with a pink gradient, shaded
edge and pointed tail. It contains no text or embedded raster image. Its wording
is a separate rotated text object, so “We OUTSIDE” can become “Hi FIVE”.
The SVG is embedded as SVG in the portable project, retaining its vector path.
There are eighteen compiled objects in each format. The former raster badge
asset remains on disk for reference but is no longer used by the flyer.

Fonts are local Anton, Dear Script, Bebas Neue, and LEMONMILK-Bold. The stylized
reference logo is approximated with editable DC initials; the corner hardware
is absent from the supplied assets and is not included. The supplied background
portrait crop differs from the target, so each layout is adapted around it.
The former fine print is replaced by an editable 21+ age notice. The updated editor save is registered as recipe version 2. Do not run the
original CSS build script over this accepted master.

Both compile tests pass. All twelve original text objects were selected through painted
glyphs in square and story without a desktop floating editor or page errors.

The arrow divider is a selectable SVG graphic in the compiled layers, with
no text-panel binding. Its vector chevrons are stored in
`assets/we-outside-arrow-divider.svg`.

Footer update: replaced the long rights notice with `21+` in both formats,
using the existing compliance field.

Accepted-save registration: `lib/recipes/weOutside.ts`. Portable runtime and
art/concept directions load the saved project without recompiling its design.
Preview files end in `we-outside-square-v2.png` and `we-outside-story-v2.png`.
Master checksum: `docs/we-outside-accepted-save.json`.
