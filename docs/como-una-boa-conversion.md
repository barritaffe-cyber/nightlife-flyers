# Accepted Como Una Boa save — v2

The updated `assets/como-una-boa.nflyer` is registered byte-for-byte as
`public/generated-flyers/como-una-boa-updated.nflyer`. User changed the headline
to Eaden, retaining the Latin jungle/snake/cocktail theme. Preserve the saved
copy and all 11 Square / 10 Story object overrides. Source checksum is recorded
in `docs/como-una-boa-accepted-save.json`.

Registered in visual recipes, art directions, concept directions, portable
runtime, cache revision and preview exports. Fourteen focused tests pass,
including Latin selection, blank-brief preservation, style preservation and
venue-name routing to the saved line above the address. Active recipe count: 19.

The initial preview capture incorrectly showed the startup Nocturne template;
the preview script now waits for startup and asserts the saved Eaden headline
and Boa-specific objects before capturing. Both corrected previews passed and
were visually inspected. This did not alter the saved file.

## Historical initial conversion


User supplied image 1 as the target, image 2 as the Square background, and
image 3 as the Story background. Inputs: `public/generated-flyers/assets/boa-square.jpg`
and `public/generated-flyers/assets/boa-story.png`. Both originals are preserved.

- CSS master: `public/generated-flyers/como-una-boa-master.html` (`?format=square` or `?format=story`).
- Editable project: `public/generated-flyers/como-una-boa.nflyer`.
- CSS previews: `como-una-boa-{square,story}-css-preview.png` under generated-flyers.
- Editor previews: `como-una-boa-{square,story}-preview.png` under generated-flyers.
- Builder: `scripts/build-como-una-boa-master.mjs`.
- CSS renderer: `scripts/render-como-una-boa.mjs`.
- Editor check: `scripts/verify-como-una-boa-import.mjs`.

Both formats have 16 compiled objects: background, shade, and 14 editable text
objects mapped to existing sidebar controls. Each supplied background is embedded
as WebP. Snake and cocktail belong to that background, not separate cutouts.
The cocktail is intentionally retained from the supplied assets rather than
replacing it with the bottle in the target. Backgrounds are shifted down with
a shaded header/footer to fit the target hierarchy in both formats.

BOA uses native editable Anton text with gold gradient, outline and shadow depth;
its width/height and rotation are authored. The exact warped scale-textured
reference lettering is not reproduced. Supporting copy uses LEMONMILK-Bold/Arial.
Sponsor logos are represented by one editable typographic name strip because
separate logo artwork was not supplied. Reference event copy is preserved.

Both compiler reports have zero warnings/unsupported objects. CSS previews
were visually inspected. All 28 actual-pointer text selections passed across both
formats, opening existing panels without a floating inspector or browser errors.
Three focused compile tests pass (`tests/coco-como-una-boa-compile.test.ts`).
The title sits below other text in layer order so its SVG hit area cannot block
selection of the presenter and subtitle. Final Story subtitle spacing was refined
after selection verification; clean editor previews were then recaptured.
Initial conversion is superseded by the accepted v2 save above.
