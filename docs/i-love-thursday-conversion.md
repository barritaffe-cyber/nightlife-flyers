# I Love Thursday conversion

User designated image 1 as the target, image 2 as the Square background, and
image 3 as the Story background. Local supplied assets are
`public/generated-flyers/assets/teddy-square.png` (1024×1024) and
`public/generated-flyers/assets/teddy-story.jpg` (1080×1920).

- CSS: `public/generated-flyers/i-love-thursday-master.html`, with `?format=square` or `?format=story`.
- Editable project: `public/generated-flyers/i-love-thursday.nflyer`.
- CSS previews: `public/generated-flyers/i-love-thursday-{square,story}-css-preview.png`.
- Editor previews: `public/generated-flyers/i-love-thursday-{square,story}-preview.png`.
- Build: `node scripts/build-i-love-thursday-master.mjs`.
- CSS render: `node scripts/render-i-love-thursday.mjs`.
- Editor verification: `node scripts/verify-i-love-thursday-import.mjs`.

Both formats have 18 compiled objects: the supplied background, a footer shade,
the orange banner, dotted rule, and 14 separately editable texts. Existing sidebar
panels are used; the date ordinal maps to Date. No new editor UI. Background art
is embedded as WebP; the original input files are unchanged. The bear and couch
are part of each supplied background, not separately editable cutouts.

Story retains the supplied artwork's full aspect; Square shifts its square art
down 10% to make room for the header, with a dark footer overlay for legibility.
The 4:5 target is adapted to explicit 1:1 and 9:16 layouts. Reference copy,
including `22 th`, is retained. Brush type and the Grodify brand treatment are
approximations using existing fonts, not exact reference lettering. The target's
repeated watermark pattern is not part of the supplied backgrounds or the layout.

Both compiler reports: 18 compiled, zero unsupported objects and zero warnings.
Structural checks passed in both formats for all 14 editable text bindings,
correct artboard dimensions, and embedded backgrounds. CSS previews were rendered
and visually inspected. All 28 actual-pointer text-selection checks passed
in Coco, activating the existing sidebar panels without floating text inspectors
or page errors. Three focused compilation tests pass, including runtime font
mapping and distinct format backgrounds. Final clean editor previews were refreshed without selection outlines and
visually inspected. The original conversion is superseded by the accepted save below.

## Accepted editor save registered as v2

The updated file `public/generated-flyers/assets/i-love-thursday.nflyer` was
copied byte-for-byte to `public/generated-flyers/i-love-thursday-updated.nflyer`
and registered as v2. This accepted save owns the recipe, preserving all 14 Square
and 12 Story overrides. Do not rebuild over it with the initial CSS builder.
Provenance: `docs/i-love-thursday-accepted-save.json`. Recipe previews use
`i-love-thursday-{square,story}-v2.png` under the recipe-exports directory.

Validation: twelve focused tests pass. Both updated recipe previews rendered
without page errors and were visually inspected. Source and registered master
checksums remain identical.
