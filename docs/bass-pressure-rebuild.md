# Bass Pressure — Concrete

Replaces `dnb_bunker` / DNB — Concrete Bunker, as explicitly requested.
The prior registry and both existing Bass Pressure saved-layout JSON files were
archived byte-for-byte with SHA-256 in `recipe-file-backups/bass-pressure-rebuild/`.
The original saved-layout files remain untouched.

Sources are the supplied `assets/bass-square.jpg`, `assets/bass-story.jpg`,
and `assets/png-glyphs/bass.png`. Backgrounds are used as supplied, including
their dark lower area. The target image guides the layout, not a baked flyer.

Master: `public/generated-flyers/bass-pressure-master.html`.
Builder: `scripts/build-bass-pressure-master.mjs`, using the established
CSS extractor → semantic binder → materializer at editor text scale 0.5.
Outputs: `public/generated-flyers/bass-pressure.nflyer` and
`lib/template-data/bass-pressure-v2.json`.
Explicit 1080×1080 / 1080×1920 designs preserve the face and mirrored helmet.
BASS is the supplied metallic lettering. PRESSURE uses the existing Drift Brush
SVG outline with an icy color and subtle glow; its size, spacing and shadow
controls remain editable. All 16 text fields have independent bindings,
including date parts, mood, genres, BPM, venue, age and parking. The QR uses the
native editor upload/default controls. An empty details label is explicitly
authored so typing or clearing labels remains supported.

## Template-exclusive lettering

Family: **Bass Pressure Blue PNG**.
`scripts/build-bass-pressure-font.py bass-blue` reuses the established sbix
extraction/packaging workflow. The source PNG has genuine alpha, despite blue
RGB data in transparent pixels. Its transparency and material appearance are
preserved. Explicit source cells separate all 36 A–Z/0–9 glyphs, with row-based
cap/baseline normalization and kerning. The S cell excludes a neighboring R tip.
Source SHA-256, bitmap metrics and origins are recorded in
`assets/png-glyphs/bass-blue/metrics.json`.
Font: `public/fonts/BassPressureBluePNG.woff2`.
Proof: `public/generated-flyers/bass-pressure-font-preview.html` / `.png`.

The font is loadable via `lib/localFontMap.ts` for this template and saved files,
but excluded from general headline font lists by `TEMPLATE_ONLY_FONT_FAMILIES`.
It is recognized by the PNG renderer without being added to
`PNG_GLYPH_COLLECTIONS`, so it is absent from the shared PNG lettering picker.
The existing Drift Brush family remains globally available as before.

## Validation

- Actual Square/Story editor previews inspected; compiler reports no warnings
  or unsupported objects, 25 compiled objects plus native QR.
- `tests/coco-bass-pressure-rebuild.test.ts`: backgrounds, independent bindings,
  family, native QR, gallery replacement and portable session equality.
- `scripts/verify-bass-pressure-import.mjs`: actual text edits/selection,
  label clear/retype, alignment, shared-menu exclusion, QR upload/default,
  format switching, save/reopen.
- `scripts/verify-bass-pressure-effects.mjs`: size/spacing/leading, shadows,
  layers and independent format persistence.
- Focused ESLint and font coverage/alpha checks.

Full paid export is unverified. No commit or deployment. Preserve unrelated work.
