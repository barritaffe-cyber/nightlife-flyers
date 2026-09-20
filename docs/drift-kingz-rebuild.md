# Miami — Drift Kingz

Replaces the existing `miami_heat` (Miami Heat) gallery slot, as requested.
The displaced registry is archived byte-for-byte, with SHA-256, in
`recipe-file-backups/drift-kingz-rebuild/`.

The supplied clean backgrounds are `assets/drift-kingz-square.jpg` and
`assets/drift-kingz-story.jpg`. The target is a visual reference only.
The explicit 1080×1080 and 1080×1920 master is
`public/generated-flyers/drift-kingz-master.html`; compile it with
`node --experimental-strip-types scripts/build-drift-kingz-master.mjs`.
The builder preserves accepted saved sources and uses the established semantic
compiler/materializer with editor text scale 0.5. The portable project is
`public/generated-flyers/drift-kingz.nflyer`; gallery data is
`lib/template-data/drift-kingz-v2.json`.

MIAMI uses editable Anton, skewed −17°, with a red palm/sunset image fill.
The texture reuses the existing supplied Miami sunset background through a
self-contained SVG color filter. Its runtime URL is portable and its size is
explicit in pixels so the per-letter renderer paints one continuous texture.
DRIFT KINGZ uses the new vector family below, with an explicit wide text box
that keeps the authored phrase on one line. Supporting texts remain separate,
including date parts, venue/services, mood, entry, live DJs and genres.
The compiled result contains 26 objects and 16 independently bound editable
texts in each format, including an explicitly authored empty details label.
No QR is present in this target.

## Drift Brush SVG

Source: `public/generated-flyers/assets/png-glyphs/paint01.png`, the final brush
alphabet attached with this request. `bold-paint.png` is a different sheet and
was not used. Source pixels are unchanged; SHA-256 and per-glyph source bounds
are recorded in `assets/drift-brush-svg/manifest.json`.

Run `scripts/build-drift-brush-font.py` with Pillow, fontTools and Brotli.
It thresholds the monochrome source, traces the actual silhouette boundaries,
retains counters and detached brush marks, separates the touching R/S tails,
and writes 36 independent SVG path glyphs. These are genuine vectors without
embedded raster images. FontBuilder packages those outlines into
`public/fonts/DriftBrushSVG.woff2`, with normalized 720-unit caps, sidebearings
and lowercase mappings to uppercase. The supplied sheet covers A–Z and 0–9;
there are no lowercase-specific designs or punctuation designs.

Registered in `lib/localFontMap.ts`, `app/globals.css`, and the Club / Poster
Headlines category in `lib/fonts.ts`. Both headline pickers expose the family
with an actual-font sample, usable across templates. It is an outline font,
not a PNG/sbix collection. SVGs, manifest and WOFF2 are also bundled as
`public/generated-flyers/drift-brush-svg.zip`.
Alphabet proof: `drift-brush-preview.html` and `drift-brush-preview.png`.

## Verification

- Both source and actual-editor Square/Story previews rendered and inspected.
- Zero compiler warnings or unsupported objects; two structural tests cover
  backgrounds, independent bindings, editable vector subtitle, portable
  texture mapping, gallery identity and portable-project equality.
- Actual text selection/editing, label clearing/retyping, alignment, format
  changes and save/reopen: `scripts/verify-drift-kingz-import.mjs`.
- Typography, shadows, layers and independent format roundtrips:
  `scripts/verify-drift-kingz-effects.mjs`.
- On the separate Ladies template, select Drift Brush SVG in both headline
  pickers, type multiline text, adjust size/spacing/leading, save/reopen:
  `scripts/verify-drift-brush-ui.mjs`.
- Font inspection confirms all supplied characters and real `glyf` outlines,
  with no embedded raster tables. All 36 SVGs contain paths and no images.
- Focused ESLint and structural tests; full paid export is not verified.

No shared renderer changes, commit or deployment. Preserve unrelated work.
