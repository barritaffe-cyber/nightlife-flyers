# Ladies Night — Rose Gold

Active recipe/project/cache revision: **v3**. This recipe is separate from Ladies
Night — Neon Chrome. Square and Story use the user's independent lounge photos;
the three subjects remain part of those photographs.

## Supplied lettering

The primary headline uses `Ladies Rose Gold PNG`, rebuilt from the four supplied
A–P, Q–f, g–v and w–9 sheets in
`public/generated-flyers/assets/ladies-night-rose/replacement-sheets/`.
Each received sheet is 1254×1254 RGBA. This is the source resolution, not native 4K.

`scripts/build-ladies-night-rose-font.py` follows connected visible ink instead
of slicing letters at fixed cell boundaries. It retains separate dots and
complete descenders, removes near-transparent background residue, and preserves
antialiasing immediately around the glyph. The 62 isolated native PNGs and source
bounds/hashes are under `public/generated-flyers/assets/png-glyphs/ladies-night-rose/`.
Their unscaled source sizes are recorded in `metrics.json`. The font normalizes
cap height, lowercase height, ascenders and descenders, then applies contour
kerning. Inspect `public/generated-flyers/ladies-night-rose-glyph-proof.png` for
all 62 glyphs. Rebuild that proof with `scripts/render-ladies-rose-glyph-proof.mjs`.

`Night` uses the supplied pink bitmap script, packaged as `Ladies Night Pink PNG`
by `scripts/build-ladies-night-pink-font.py`. Both families are registered for
saved-project loading and bitmap text rendering, but excluded from shared font
menus and the public PNG collection. Supporting script uses Dear Script; narrow
information copy uses Bebas Neue and the date uses a serif face.

## Composition and effects

The editable rose-gold headline rises across the upper composition, with the pink
Night script crossing beneath it. The proportions are authored independently
for Square and Story, leaving the date rail and faces clear. Both formats contain
21 compiled objects: the background, localized contrast shading, decorative SVG
accents, and 18 editable text owners. The circular offer has a dark fill, pink
rim, lips and a restrained glint.

Shadows follow individual headline glyphs. Their intensity control changes
opacity while keeping blur and offset fixed; do not restore full-word halos or
make intensity move a black duplicate. `rose-gold-glints-v1` opts the primary
headline into two small SVG glints anchored to measured glyph ink. These follow
live text rather than remaining fixed to the canvas. Legacy subtag, right-rail,
venue and price overlays are suppressed to prevent duplicate painted content.

The old rejected v1 project and previews are archived in
`recipe-file-backups/ladies-night-rose-v1/`. Do not restore that alphabet's cuts.

## Build and verify

- `scripts/build-ladies-night-rose-master.mjs`: compile both formats into
  `public/generated-flyers/ladies-night-rose.nflyer` and the template data module.
- `scripts/build-registered-recipe-templates.mjs`: refresh the 61-recipe gallery.
- `scripts/verify-ladies-night-rose-import.mjs`: live editor previews, all 36 text
  selections, headline and subheadline edits, per-letter shadows, and save/reopen.
  Set `NF_EXPORT_CHECKS=1` to check PNG export as well.
- Focused tests: `tests/coco-ladies-night-rose-recipe.test.ts`,
  `tests/registered-recipe-templates.test.ts`, and
  `tests/coco-compiled-shadow-controls.test.ts`.

The recipe is editable; it is not a flattened copy of the target. Large exports
retain the detail available in the supplied raster glyphs, not invented detail
from a nominally larger output size.

Validation for v3: both formats compile 21 objects with zero warnings or unsupported
features; all 36 text-owner selections, both headline edits, per-letter shadows,
and project save/reopen pass. Thirteen focused checks pass. ESLint reports no
errors (three existing unused-variable warnings in app/page.tsx). The final
registry matches all authored text objects in both formats.

PNG export was attempted through the real editor after save/reopen, but its
Export control was disabled in the guest session. Full PNG export, including 4K
output, remains unverified; the delivered preview PNGs are live editor captures.
