# Editable PNG lettering

## Africa Gold clean-sheet update — 2026-09-15

Africa Gold PNG now uses `africa-gold01.png`–`04.png` at native resolution.
Build: `/tmp/offshore-font-build/bin/python scripts/build-africa-gold-font.py`.
The older `build-premium-png-fonts.py africa-gold` command delegates to it.
62 native glyph PNGs and source hashes are in `assets/png-glyphs/africa-gold`.
The 600ppem bitmap strike never downsamples the supplied glyphs; genuine lowercase,
i/j dots, and the Africa emblem inside O are retained. Font family stays
`Africa Gold PNG`, with `AfricaGoldPNG.woff2?v=2` for cache refresh.
Run `scripts/verify-premium-png-fonts.py` for source and paint checks, then
`node scripts/verify-africa-gold.mjs` for both editor pickers, formats,
save/reopen, and actual PNG exports. Visually inspect the generated artifacts
before passing. Verified both pickers, editing controls, save/reopen, Square
2160×2160 and Story 2160×3840 PNG exports; visually inspected all 62 glyphs and
both exports in `/tmp/africa-gold-check/`. Preview:
`/generated-flyers/africa-gold-font-preview.html`.

## Current PNG shadow rendering

When a saved or selected PNG font replaces an authored outline font, discard
that former font's compiled `paint.filter` and `paint.textShadow`, just as its
texture is already discarded. Afrobeat Rooftop uses Africa Gold PNG over an
original Didot object; retaining Didot's gold edge/glow applies lighting around
the entire word and its live shadows. Preserve lighting authored for an actual
PNG font, along with the source document and the saved per-format controls.

Afrobeat regression commands (outputs stay under `/tmp`):

```sh
NF_VERIFY_FILE=public/generated-flyers/afrobeat-rooftop.nflyer NF_KEEP_FONT=1 NF_HEADLINE_ONLY=1 NF_EXPECT_NO_WORD_FILTER=1 NF_OUTPUT_DIR=/tmp/afrobeat-shadow-fixed node scripts/verify-png-shadow-intensity.mjs
NF_VERIFY_FILE=public/generated-flyers/afrobeat-rooftop.nflyer NF_HEADLINE_ONLY=1 NF_EXPECT_NO_WORD_FILTER=1 NF_OUTPUT_DIR=/tmp/afrobeat-shadow-exports node scripts/verify-png-shadow-exports.mjs
```

The second command compares actual shadow-off/on pixels in both editor renders
and 4× PNG exports. It uses an isolated local guest-quota response fixture;
review the resulting PNGs before accepting the rendering.

Afrobeat's September 16 final run passed the controls and save/reopen check.
Both off/on exports were visually reviewed: Square 2160×2160 and Story
2160×3840. Increasing intensity darkened 32,476 and 40,618 exported pixels,
respectively, with zero brightened pixels. Evidence is in the two output
directories above; accepted masters and previews were not regenerated.

The Shadow control changes darkness only. `PngGlyphShadowText` maps its 0–8 value to black opacity with `.8 * sqrt(strength / 8)`: zero disables the filter, 1 is about 28%, 4 is about 57%, and 8 is 80%. Distance and softness never depend on intensity. An earlier implementation multiplied offset by strength and produced hard black duplicates; the user explicitly rejected it.

Apply the SVG filter separately to each glyph, leaving the word wrapper unfiltered. Each letter supplies its own SourceAlpha. Gamma exponent 1.6 gently suppresses faint bitmap glow while retaining antialiasing; Gaussian sigma is .012 × font size, dx is .012 × font size and dy is .028 × font size. Composite the black shadow beneath the untouched SourceGraphic. Shared definitions still receive independent letter inputs. Preserve per-letter transforms, overlap and kerning. Avoid a hard alpha threshold, nearly sharp displaced copies, or an additional live text-shadow stack over the bitmap.

Verify the actual editor with `NF_DEVICE_SCALE=2 node scripts/verify-png-shadow-intensity.mjs`. The Neon Green MIAMI case exercises both title panels at 0/1/4/8, physical slider dragging, fixed shadow geometry, increasing opacity and independent Square/Story save/reopen. These checks passed, including fixed geometry while the pointer is held down. Inspect the rendered crops as well as assertions. Current examples: [shadow off](../public/generated-flyers/miami-neon-green-shadow-off.png), [maximum intensity](../public/generated-flyers/miami-neon-green-shadow-max.png), [Story maximum](../public/generated-flyers/miami-neon-green-story-shadow-max.png). The old `glow-letter-shadow-preview.png` shows the rejected implementation. PNG export remains unverified.


## Latest — PNG lettering names and previews

Renamed the 12 older collections in the picker, CSS and font loader. Existing
saved projects retain their old family names; compatibility aliases preserve
bitmap rendering, editable lettering behavior and the picker selected state.
The five recent families keep their names. No source sheets or font binaries
were rebuilt. Purple neon remains excluded.

| Previous name | Current name |
|---|---|
| Future 02 | Future Outline |
| Chrome | Liquid Chrome |
| Future | Circuit Lines |
| Grunge | Distressed Ink |
| Afro | Tribal Pattern |
| Rainbow | Rainbow Gradient |
| Gold Whimsical | Whimsical Gold |
| Pink Fur | Rose Fur |
| Gold Script | Calligraphy Gold |
| Gold Serif | Classic Gold Serif |
| Gold | Block Gold |
| Red Neon | Crimson Neon |

Picker samples now show each family’s name in its actual bitmap font.
Full alphabet/digit specimens (plus lowercase where supplied) and picker PNGs:
`public/font-specimens/lettering-catalog.html` and adjacent named PNG files.
Regenerate and verify: `node scripts/render-lettering-catalog.mjs`.
All 12 aliases pass exact browser raster comparison with the original face and
are distinct from fallback fonts; old selected names map to the new picker entry.
Future Outline and Calligraphy Gold pass both editor panels, multiline controls,
per-glyph shadows, and save/reopen via `scripts/verify-png-glyphs.mjs`.



## Premium gold batch — four completed collections

Only the four supplied gold sheets were processed. `wakanda.png` (purple neon)
is explicitly excluded and unchanged.

| Menu name | Source sheet | Font file |
|---|---|---|
| Gold Flourish | `gold metal.png` | `GoldFlourishPNG.woff2` |
| Gold Filigree | `nordic.png` | `GoldFiligreePNG.woff2` |
| Africa Gold | `africa-gold01.png`–`04.png` | `AfricaGoldPNG.woff2` |
| Sunset Gold | `sunset.png` | `SunsetGoldPNG.woff2` |

Sources are under `public/generated-flyers/assets/png-glyphs/`; originals remain
unchanged with hashes recorded in each collection's metrics.json. Every font has
The original collections have 36 distinct capital/digit glyphs and lowercase aliases; Africa Gold now has 62 distinct uppercase, lowercase, and digit glyphs. No punctuation artwork
was fabricated. Africa Gold's O retains the supplied Africa emblem.

`build-premium-png-fonts.py` reuses the established fontTools sbix/GPOS pipeline.
Connected components preserve separated overhangs; explicit seams split touching
groups. Gold Flourish uses source-pixel stroke tracking where swashes cross other
letters. Those intersections are shared source artwork, not independent clean
layers; occluded underlying pixels cannot be recovered. No AI generation, SVG
redrawing or invented glyphs. Black matte removal is used only for Flourish and
Filigree; Africa/Sunset retain source alpha, dark metal and glow. Contour kerning
uses 1,165 pairs for Flourish and 1,296 each for the others. Source-row baselines
and cap heights define scale. Outline paint bounds include full swashes independently
of body advance widths, so tails can extend beyond a text selection box.

Build each key (`gold-flourish`, `gold-filigree`, `africa-gold`, `sunset-gold`):

```sh
/tmp/offshore-font-build/bin/python scripts/build-premium-png-fonts.py gold-flourish
/tmp/offshore-font-build/bin/python scripts/verify-premium-png-fonts.py
node scripts/render-premium-font-specimens.mjs
node scripts/verify-premium-font-picker.mjs
NF_PROJECT=ladies-css-coco.nflyer NF_GLYPH_FAMILY='Gold Flourish PNG' NF_OUTPUT_DIR=/tmp/gold-flourish-font-check node scripts/verify-png-glyphs.mjs
```

Verification passed source hashes, cmap coverage, aliases, alpha, bitmap offsets,
vertical/horizontal paint bounds, advances and GPOS for all four. Complete alphabet,
digit, dark/light word specimens were visually inspected. The actual shared picker
component was rendered independently; checks confirm loaded families and colored
bitmap pixels instead of fallback text. Both editor panels passed multiline typing,
size, spacing, leading, per-glyph shadows and save/reopen for all four. Screenshots
were inspected; logs are `/tmp/{collection}-font-check.log`. A final outline-only
padding adjustment was followed by bounds checks and refreshed specimens/picker
checks; it did not change bitmap artwork, advances or kerning.

Durable previews: `public/font-specimens/premium-gold.html`, and
`gold-flourish.png`, `gold-filigree.png`, `africa-gold.png`, `sunset-gold.png` in that
folder. Individual picker screenshots are also there. New fonts are registered in
PNG_GLYPH_COLLECTIONS, localFontMap and globals.css. No gallery template was changed.
No commit or deployment; full paid export and cross-browser output remain untested.

The shared picker now quotes every family via JSON.stringify. This corrects the
previous numeric-name CSS syntax defect, but Future 02's descriptive naming and
separate preview/delivery follow-up remain outside this batch. Earlier notes below
saying the picker still emits an unquoted family describe the prior state.

## Required process and current exception

The explicit reusable process and delivery gates are recorded at the top of
[NEXT_SESSION_CONTEXT.md](../NEXT_SESSION_CONTEXT.md), under “PNG sheet → editable
bitmap font”. Read that sequence before adding another collection. Inspect the
sheet, choose a descriptive name, reuse a builder, validate metrics/alpha,
produce a specimen, verify the picker, then run editor acceptance and deliver
the preview. Do not treat an agent-only `/tmp` screenshot as user delivery.

Future 02 (`future02.png`, `Future02PNG.woff2`, family `Future 02 PNG`) has a
verified 36-glyph uppercase/digit build with lowercase aliases. Its compiled
canvas passed editing/shadow/save checks, but the picker still uses an invalid
unquoted numeric font-family name and falls back. The proposed descriptive
name **Future Outline** has not been applied. Picker preview, naming and durable
preview delivery remain pending; preserve saved family compatibility when fixing.

## Existing collections and implementation

Collections are registered in `lib/pngGlyphCollections.ts`: Gold, Red Neon, Gold Serif, Gold Script, Rainbow, Gold Whimsical, Pink Fur, Afro, Grunge, Future and Chrome.
The shared picker passes the chosen family into either text panel. Bitmap paint
and per-glyph shadow routing use `isPngGlyphFamily`, so adding a collection does
not require separate rendering logic.

Red Neon source: `assets/png-glyphs/neon01.png`. Build with
`scripts/build-gold-png-font.py --collection neon01` using the same dependencies.
Its crop boundaries and source-row cap/baseline anchors are independent of Gold.
Output: `public/fonts/RedNeonPNG.woff2`, registered as `Red Neon PNG`.
Test with `NF_GLYPH_FAMILY='Red Neon PNG' node scripts/verify-png-glyphs.mjs`.

Gold Serif uses `assets/png-glyphs/gold02.png`, built with `--collection gold02`.
Its family is `Gold Serif PNG`, output `public/fonts/GoldSerifPNG.woff2`.
It has its own serif crop boundaries and cap/baseline anchors; it reuses the
same editable bitmap renderer and per-glyph shadows. Test by setting
`NF_GLYPH_FAMILY='Gold Serif PNG'` on the browser acceptance command.

Gold Script uses `assets/png-glyphs/gold03.png` and the dedicated builder
`scripts/build-gold-script-png-font.py` (same Python dependencies). Its family is
`Gold Script PNG`, output `public/fonts/GoldScriptPNG.woff2`. It contains 62
separate A–Z, a–z and digit glyphs. Gold components isolate adjacent swashes;
white matte is removed. Source-row baselines preserve lowercase proportions and
real descenders. Detached i/j dots are retained. Codepoint PNG filenames avoid
uppercase/lowercase collisions on case-insensitive filesystems. A larger outline
paint box plus compensated sbix origin prevents clipping script tails. Bounds
are asserted by the builder. Optical contour kerning is stored in GPOS.
Test with `NF_GLYPH_FAMILY='Gold Script PNG' node scripts/verify-png-glyphs.mjs`;
this exercises mixed-case `Party` / `Nights` in both panels.

Additional collections from the supplied folder:
- `rainbow.png` → **Rainbow** / `Rainbow PNG`, `RainbowPNG.woff2` (36 glyphs; lowercase maps to capitals).
- `gold-whimsical.png` → **Gold Whimsical** / `Gold Whimsical PNG`, `GoldWhimsicalPNG.woff2` (62 distinct glyphs).
- `fur.png` → **Pink Fur** / `Pink Fur PNG`, `PinkFurPNG.woff2` (62 distinct glyphs).

Build with `scripts/build-extra-png-fonts.py rainbow`, `gold-whimsical`, or `fur`
using the same Python dependencies. Each source remains unchanged. Connected
components separate overlapping bounding boxes; Whimsical K/L have an explicit
split at their baseline contact. Fur uses brighter seeds to separate touching
fibers, then retains edge pixels around those seeds. Black matte is removed,
with row scales/baselines, lowercase dots and tails, transparent codepoint PNGs,
GPOS pair adjustments and asserted bitmap bounds. Whimsical's tall L requires
an expanded ascent. No rendering changes or AI calls are required. All three passed both-panel
browser editing, per-glyph shadow, spacing/leading and save/reopen checks.

Afro uses `afro01.png` → **Afro** / `Afro PNG`, `public/fonts/AfroPNG.woff2`.
Build with `scripts/build-extra-png-fonts.py afro01`. This source has a genuine
alpha channel despite its yellow RGB background. Components use alpha, and
extracted pixels retain their supplied RGBA values—no black matte removal.
36 uppercase/digit glyphs; lowercase maps to capitals. Row cap heights/baselines,
GPOS spacing and the existing per-glyph shadows are reused. Test with
`NF_GLYPH_FAMILY='Afro PNG' node scripts/verify-png-glyphs.mjs`.

Grunge uses `grunge01.png` → **Grunge** / `Grunge PNG`, `GrungePNG.woff2`.
Build with `scripts/build-extra-png-fonts.py grunge01`. Its supplied alpha is
preserved, including black distressed details and outlines. The sheet omits
uppercase F; the user explicitly chose to derive it from E. The builder removes
E's bottom arm and restores the stem outline. The original sheet is unchanged.
62 distinct uppercase/lowercase/digit glyphs. Browser checks use `Fresh` / `Nights`
to exercise the reconstructed F in both panels; select `NF_GLYPH_FAMILY='Grunge PNG'`.

Future uses `future01.png` → **Future** / `Future PNG`, `FuturePNG.woff2`.
Build with `scripts/build-extra-png-fonts.py future01`. The source has true alpha.
Explicit cells group each letter's disconnected parallel strokes and dots;
selecting a single connected component would lose parts of this artwork.
62 distinct uppercase/lowercase/digit glyphs. Source alpha is preserved; common
row baselines/scales retain lowercase tails. All source pixels above the extraction
alpha threshold are covered by the cells. Test with `NF_GLYPH_FAMILY='Future PNG'`.

Chrome uses `chrome.png` → **Chrome** / `Chrome PNG`, `ChromePNG.woff2`.
Build with `scripts/build-extra-png-fonts.py chrome`. 62 distinct uppercase,
lowercase and numeric glyphs. Its black-backed RGB source uses a low matte
threshold to preserve dark metal reflections. Paint includes low-luminance
pixels inside glyph bounds, with independent i/j dots grouped into their letters.
Source-row cap heights/baselines and existing per-glyph shadow routing are reused.
Test with `NF_GLYPH_FAMILY='Chrome PNG' node scripts/verify-png-glyphs.mjs`.

`glass01.png` is explicitly ON HOLD. Keep the existing CSS glass treatment;
do not extract or register the cloudy-backed glass alphabet without a new request.

The user reports per-glyph shadows work on a recent recipe but fail on an older
template. That older-template investigation is explicitly deferred, not resolved.

PNG shadows are per glyph via `components/text/PngGlyphShadowText.tsx`. Each
letter paints its own shadow before the next letter. Canvas pair measurements
restore the font's kerning as span advance adjustments, with the user's tracking
added separately. Measurements refresh after font loading, resizing and renders;
multiline leading stays on the outer line. Parent shadows are suppressed to
avoid painting an additional whole-word shadow. Browser checks assert independent
glyph paints and active shadow styles in both text panels.

Metrics revision 2: glyphs share source-row cap height and baseline instead of
being independently scaled to their glow bounds. Solid-ink measurements define
advance widths and side bearings; bitmap offsets retain glow outside those
metrics. `gold01/metrics.json` records the measurements. Corrected numeric crop
boundaries exclude neighboring-digit fragments. Optical pair adjustments are
stored in GPOS, with minimum solid-ink clearance. The per-glyph shadow renderer
recovers those pair advances through Canvas measurements; it does not rely on
browser kerning across separate inline-block letters.
The font URL uses `?v=2` to invalidate cached revision 1. Existing user tracking
is preserved: use zero spacing to assess the new base metrics before adjusting.

Layer correction: compiled text steps through neighboring foreground objects,
swapping compiled neighbors and retaining the background as a floor. Runtime
portrait/graphic layers are included using their rendered z-index. Legacy text
uses single layer steps instead of the previous large jumps below graphic stacks.
Algorithm coverage is in `tests/coco-layer-step.test.ts`; this does not substitute
for inspecting a user's particular multi-layer project.

Headline and Sub Headline now contain a **PNG Lettering** disclosure. The first
sample is **Gold**, from `public/generated-flyers/assets/png-glyphs/gold01.png`.
The former Create Cinematic Text button has been removed. Choosing this style
makes no AI call and does not replace the user's text with a flattened image.

The original pixels are packaged into a local OpenType sbix bitmap font,
`public/fonts/GoldPNG.woff2`, registered as `Gold PNG`. This lets existing native
text metrics handle spacing, multiple lines, leading, alignment and saved font
selection. Individual transparent PNGs are also available in the `gold01/`
subdirectory. The source sheet remains untouched. A–Z and 0–9 are present;
**V is included** (the earlier discussion misread it). Both cases map to the
same capital artwork. Punctuation uses fallback fonts until supplied.

Build with `scripts/build-gold-png-font.py` using Python with fonttools, brotli
and pillow. The temporary `/tmp/offshore-font-build` environment has these.
The script crops the sheet and removes black matte from the surrounding areas
and counters. Genuine transparent source glyphs are preferable for future sets:
black-backed artwork cannot perfectly distinguish dark material from the matte.
This sample has approximately 150px artwork height per glyph, so very large
output may appear softer than high-resolution source glyphs.

`components/text/PngGlyphPicker.tsx` is shared by both panels. The compiled
renderer bypasses authored gradient/image clipping and saved rich-text runs
when Gold PNG is selected, preserving the bitmap finish and newly typed lines.
Selecting a normal font returns to normal lettering. Existing projects and
accepted gallery masters are not rewritten by selecting a style.

Local browser acceptance: `node scripts/verify-png-glyphs.mjs` imports Day Party,
checks both pickers, two-line text and save/reopen, and writes artifacts to
`/tmp/png-glyph-check`. Inspect screenshots as well as DOM assertions: font-family
alone does not prove an inherited transparent fill is not hiding the bitmap.
Full PNG export remains subject to the existing account render limit; preview
and project checks do not prove the export path or cross-browser compatibility.

## Arctic Metal

The next supplied sheet, `assets/png-glyphs/future-tech.png`, is registered as
**Arctic Metal** / `Arctic Metal PNG`, output `public/fonts/ArcticMetalPNG.woff2`.
It contains 36 distinct capitals/digits, with lowercase aliases. The original RGB
black-backed source is unchanged; its hash is recorded in
`assets/png-glyphs/arctic-metal/metrics.json` beside transparent codepoint PNGs.
Explicit row cells keep B and D's detached strokes together. Extraction uses blue
channel seeds, retains dark metal and cyan edge glow, and removes the black matte.
Row baselines/cap heights and 1,296 contour GPOS pairs preserve consistent geometry.
No missing artwork was invented, and no AI generation was used.

```sh
/tmp/offshore-font-build/bin/python scripts/build-premium-png-fonts.py arctic-metal
/tmp/offshore-font-build/bin/python scripts/verify-premium-png-fonts.py
NF_FONT_SET=arctic node scripts/render-premium-font-specimens.mjs
NF_FONT_SET=arctic node scripts/verify-premium-font-picker.mjs
NF_PROJECT=ladies-css-coco.nflyer NF_GLYPH_FAMILY='Arctic Metal PNG' NF_OUTPUT_DIR=/tmp/arctic-metal-font-check node scripts/verify-png-glyphs.mjs
```

Source hash, coverage, aliases, alpha, paint bounds, advances and GPOS pass.
The full alphabet/digits and dark/light word specimens were visually inspected.
The real picker component passes font loading and colored bitmap-paint assertions.
Durable preview: `public/font-specimens/arctic-metal.png`; browser specimen:
`public/font-specimens/arctic-metal.html`; picker: `arctic-metal-picker.png`.
Registered through existing collections/font map/CSS; no renderer change needed.
Full paid export and cross-browser behavior remain untested. No commit/deployment.

Arctic Metal editor acceptance passed both panels: multiline typing,
size/spacing/leading, per-glyph shadows, and project save/reopen. Screenshots were
visually inspected; no captured runtime errors. Log:
`/tmp/arctic-metal-font-check.log`.
