# Eaden — The Garden Lounge

## Cleaner supplied glyphs — 2026-09-15

The current font uses the four updated transparent sheets
`assets/png-glyphs/gold-eden01.png` through `gold-eden04.png`, not the original
single `eden.png` sheet described below. All62 characters are re-extracted from
the new files, retaining their source RGB and native-resolution PNG crops.
Connected ink is assigned to each glyph (including detached i/j dots); wide
source haze is excluded without cropping at cell boundaries.

`scripts/build-eaden-font.py eaden-gold` builds EadenGoldPNG version2 using a
600ppem bitmap strike. It asserts that no source glyph is downsampled, verifies
all four paint bounds against the font outline, and records all four source
hashes and crop metrics. `scripts/eaden-glyph-layout-v1.json` preserves the old
family's reference heights/baselines while keeping each new glyph proportional.
The existing recipe layout and editable objects are unchanged. Font remains
template-only. Runtime/CSS/source specimen URLs now use `?v=2`.

Verification: glyph specimen, source previews, actual editor and PNG exports
through `scripts/verify-eaden-glyph-update.mjs`, with
`NF_EADEN_EXPORT_CHECK=1 NF_EADEN_EXPORT_ACCESS_FIXTURE=1` and
`NF_EADEN_AUDIT_DIR=/tmp/eaden-glyph-update/final`. The fixture changes only local
browser quota responses; actual renderer/downloads are exercised. Font asset is
external to the portable project, so recompiling the saved layout is unnecessary.
Final verification passed for19 text owners in each format, with no page errors.
The full62-character specimen and both actual PNG exports were visually inspected
(2160×2160 Square,2160×3840 Story). Both accepted editor previews were refreshed.
The two focused recipe tests pass, including source hashes for the new sheets.

The original build notes below are historical; the four-sheet source and new
visual/export verification supersede their source and unverified-export notes.

User explicitly requested replacing Como Una Boa, using the supplied target,
Square/Story artwork and lettering sheet, with the font excluded from the UI.
Existing `como-una-boa` ID is retained; the other 24 gallery recipes are unchanged.
The old accepted `.nflyer` remains untouched. Prior recipe metadata, gallery and
project are archived with hashes in `recipe-file-backups/eaden-rebuild/manifest.json`.

Inputs: `public/generated-flyers/redesigns/eden.png` (target),
`public/generated-flyers/assets/eden-square.jpg`, `eden-story.jpg`, and
`public/generated-flyers/assets/png-glyphs/eden.png`. The lettering source has
actual alpha despite its brown RGB background. Supplied source pixels are retained;
no image generation or font substitution was used for the headline.

`Eaden Gold PNG` has 62 distinct uppercase/lowercase/digit glyphs, including the
disconnected i/j dots. Connected components preserve overlapping swashes without
rectangular cell cuts. Source-row baseline normalization, sbix WOFF2 and contour
kerning reuse the existing font pipeline. Source hash and metrics are recorded in
`assets/png-glyphs/eaden-gold/metrics.json` under generated-flyers. Font registration
is in `lib/localFontMap.ts`, `lib/pngGlyphCollections.ts`, `app/globals.css`.
It is in TEMPLATE_ONLY_FONT_FAMILIES and absent from PNG_GLYPH_COLLECTIONS, so
both regular font menus and both PNG lettering pickers exclude it.

Font build: `/tmp/offshore-font-build/bin/python scripts/build-eaden-font.py eaden-gold`.
Font specimen: `public/generated-flyers/eaden-font-preview.html` and `.png`.
The full uppercase/lowercase/digit specimen was visually inspected; coverage,
distinct lowercase, transparency, right paint bounds and original source hash passed.

Master: `public/generated-flyers/eaden-master.html`.
Build: `node --experimental-strip-types scripts/build-eaden-master.mjs`.
Source render: `node scripts/render-eaden-study.mjs`.
Portable project: `public/generated-flyers/eaden.nflyer`.
Gallery source sessions: `lib/template-data/eaden-v2.json`; recipe version 3.
The portable loader and preview registry point to Eaden, and the registered-recipe
builder uses its preview alias. Existing Como Una Boa accepted saves are preserved.

Each format has 32 objects, including 19 independent text owners (18 visible plus
an empty details label), its own clean background, a lower contrast shade and
native rules/dividers. No QR. Gold headline, Didot support, Dear Script Night and
Lemon Milk utility copy. Source artwork does not include the reference's separate
leaves around the title; no fabricated leaf overlay was added. Font proportions
are adapted to keep the snake clear; this is not an exact raster match.

The presenter uses the native Presenter panel. Supporting text sits above the
large title to prevent its bitmap hit area intercepting those smaller owners.
This was a template layer correction, not a shared renderer change.

Validation: four template/gallery tests pass, including font-menu exclusion.
Focused lint passed. Typography, shadow, layer controls and independent Square/Story
save/reopen passed in `scripts/verify-eaden-effects.mjs`. Initial actual editor
inspection caught and corrected a wrong script font alias and an empty address
binding before final checks. Final text-selection and preview check results follow.
Paid PNG export remains unverified. No commit or deployment.

Final acceptance passed: all 18 visible text owners were selected in Square and
Story; title edits, details-label clear/retype, details/address L/C/R alignment,
authored tracking, format switching and project save/reopen passed. Both final
clean editor previews were inspected against the target/source layouts. No page
errors or React update-loop errors were reported. Logs/check output used
`/tmp/eaden-final`; accepted preview outputs use the stable eaden prefix.
