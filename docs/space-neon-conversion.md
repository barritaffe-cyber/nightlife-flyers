# Space Neon conversion

Image 1 in the conversation is the visual target. Image 2 is the supplied asset
sheet, saved as `public/generated-flyers/assets/space-assets.png`.

- CSS master: `public/generated-flyers/space-neon-master.html` (`?format=square` or `?format=story`).
- Portable project: `public/generated-flyers/space-neon.nflyer`.
- Build: `node scripts/build-space-neon-master.mjs`.
- Browser verification: `node scripts/verify-space-neon-import.mjs`.
- Tests: `node --test tests/coco-space-neon-compile.test.ts`.

The supplied flattened sheet labels its panels square/story, but their actual
pixel proportions differ from those output formats. The build extracts the
artwork excluding sheet labels/dividers and center-crops it to 1080×1080 and
1080×1920. Original sheet is preserved. No target watermark or stock logos are
included in the new composition.

The guitar astronaut was isolated using the built-in imagegen tool with the
sheet as input, saved to `public/generated-flyers/assets/space-neon-astronaut.png`.
Prompt: extract only the first guitar astronaut thumbnail, preserve its white
spacesuit, purple visor, pink rim light, complete pose/guitar, and produce an
isolated transparent-background cutout without labels, frames, or other assets.
The generated cutout is an interpretation of that thumbnail, not a pixel-exact
extraction. Both background images and the astronaut are embedded in the project.

There are 15 objects per format: background, shade, astronaut, and 12 editable
text objects. Text maps to existing presenter, date, headlines, details, lineup,
price, contact rails, subtag, and address controls. No desktop editor is added.
Fonts: Brigends Expanded (letters), LEMONMILK-Bold (date and guest), Dear Script,
and Bebas Neue. Brigends' demo numeral placeholders are avoided by using
LEMONMILK for the date. Outline strokes are retained on the day and headline.

The updated editor save is now registered as version 2. It is authoritative; do
not rebuild over it with the original CSS compile script. Recipe previews use
the `-v2.png` files under `public/coco-references/recipe-exports`.

Validation: both compile tests pass; all 24 text-selection checks (12 per format)
pass without page errors or a desktop floating inspector. Final clean preview
run also passed. Previews: `public/generated-flyers/space-neon-square-preview.png`
and `public/generated-flyers/space-neon-story-preview.png`.
