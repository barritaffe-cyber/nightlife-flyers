# CSS → Coco: closest-adaptation conversion rules

Saved 2026-09-06 at the user's request. The goal is to carry the CSS composition
into editable Coco objects, not redesign it with Coco's generic layout rules.
Prioritize text size, weight, placement, and proportions. Do not spend another
conversion rediscovering the unit mismatch or manually tuning around it.

## Start from the authoritative version

- Render the actual source HTML; a saved PNG alone is not proof of its current output.
- Measure after `document.fonts.ready` and image decoding. Use computed styles,
  including inline overrides, rather than the first matching CSS declaration.
- Keep the original master intact. Adaptations should be separate, explicit inputs.
- For Brunch, the user's latest edited project is
  `public/generated-flyers/brunch-vibes-compiled-portrait-updated.nflyer`.
  Preserve it. Rebuilding `brunch-vibes-studio-final.html` does NOT reproduce the
  user's subsequent editor changes. Do not replace that project with a rebuild.

## 1. Resolve coordinate units before adjusting any text

Record the source canvas width/height and actual editor artboard width/height.
For a matching-aspect conversion, use one scale:

```text
s = editorWidth / sourceWidth = editorHeight / sourceHeight
editorFontSize = computedCssFontSize × s
xPercent = sourceLeft / sourceWidth × 100
yPercent = sourceTop / sourceHeight × 100
widthPercent = sourceBoxWidth / sourceWidth × 100
heightPercent = sourceBoxHeight / sourceHeight × 100
```

The confirmed Brunch font-size correction is `editorTextScale: 540 / 1024`
in `scripts/build-brunch-vibes-master.mjs`. This fixes the source/editor pixel
mismatch; it is NOT a universal constant and does not solve aspect adaptation.
`scripts/lib/coco-materializer.mjs` applies this scale to both object typography
and text-run sizes before creating the initial bindings. Do not scale them again
in the renderer. Preserve authored scale transforms separately.

When aspect ratios differ, percentage mapping stretches the composition even if
font sizes are correct. Do not label a 1024×1536 master as both Square and Story.
Author explicit format adaptations, or choose a documented uniform fit/crop with
offsets. Apply the same coordinate mapping to text and decorations. Use cover
cropping rather than stretching a background. Recheck text-safe areas after crop.

## 2. Preserve typography, not merely the text string

Carry computed font family, numeric weight, style, font size, line height,
letter spacing, alignment, explicit line breaks, and text transformation.

- Map to the actual loaded font face. Preserve light/regular/medium/bold instead
  of applying a global bold/default font. A fallback font changes width and placement.
- Local-only fonts are not portable. Brunch's LocalDidot resolves through the
  machine's Didot; do not claim it is embedded or identical on other machines.
- Convert pixel line height to a ratio (`lineHeightPx / fontSizePx`), then let it
  scale with the font. Keep tracking in em; convert pixel tracking to em first.
- Preserve text-run size ratios and weights; a date numeral and weekday must not
  be collapsed into one uniformly styled field.
- Preserve box width and intentional line breaks. Unexpected word wrapping is
  usually a measurement/font/unit error, not a reason to shrink all text.

## 3. Preserve positions and transforms

Measure untransformed layout bounds separately from visible painted bounds.
Retain transform origin, rotation, scale, and skew. Include CSS matrix translation.

The extractor fix in `scripts/lib/coco-css-browser-extractor.mjs` folds `matrix.e`
and `matrix.f` into normalized bounds. Do not discard those offsets or apply them
twice. Compare visible glyph bounds/baselines, not just the enclosing text box.

Known remaining limitation: the compiled renderer has not yet preserved the
Brunch script's skew. Do not describe transform fidelity as fully solved.

## 4. Keep compiled layout authoritative

Imported compiled objects own their positions, even if the recipe is not registered.
Generic headline/footer layout, template search, and delayed callbacks must not
reposition or replace them. Registry admission and canvas ownership are different.

Saved fixes: `lib/coco/compiledCanvasAuthority.ts` and the import/layout guards in
`app/page.tsx`. The center-footer callback must check current canvas ownership
again when it runs, not only when its effect starts. This fixed Rooftop Lounge
moving from the footer into the middle of the flyer.

## 5. Preserve paint and connect controls to the visible layer

For natural metallic surfaces, complex texture maps and live glyph masks, also use
[Complex text textures and gradients](complex-text-materials.md). It distinguishes
the generic editable gradient path below from Cana's separately authored material.

Compiled CSS-gradient headlines currently paint through SVG masks. Changing the
hidden HTML text does not change the visible headline.

Saved renderer fixes in `app/page.tsx`:

- Solid Fill overrides the gradient for compiled headlines.
- Editing Grad A/B marks `textFx.compiledGradientEdited`; the visible gradient
  then reads the edited endpoints. Untouched imports retain authored CSS stops.
- Headline shadows apply to individual masked glyph groups, not the whole word.
  Each mask retains the full line's positioning so alignment/spacing stay stable.

Known remaining limitation: SVG gradient text uses an estimated baseline. A
different baseline from CSS can move the visible headline despite correct box
coordinates. Fix baseline fidelity at the renderer boundary, not by repeatedly
moving the recipe's other fields to accommodate it.

## Fast verification and fault isolation

1. Capture CSS at its native aspect and compare with the supplied reference.
2. Compile a diagnostic project and import that exact file into the actual editor.
3. Compare both renders at the same display scale. Check, in order: canvas/crop,
   fonts loaded, text size, weight, line breaks, visible glyph positions, paint.
4. If all text is oversized, inspect unit scaling first. If only one field differs,
   inspect its binding, run styles, transform, or live editor override.
5. If boxes match but letters do not, inspect font metrics/baselines. If text moves
   after import or format switching, inspect reflow/async ownership guards.
6. Test both formats, color/gradient, per-glyph shadow, editing, save/reload, and
   delayed stability. Keep evidence of failures separate from successful checks.
7. Only promote/register and release the final project after visual acceptance.

Brunch's reusable browser check is `scripts/verify-brunch-import.mjs`. It accepts
`NF_VERIFY_FILE`, `NF_VERIFY_OUT`, and `NF_VERIFY_INTERVALS` (30 seconds each).
`NF_VERIFY_CONTROLS=1` checks Square color/shadow; `NF_VERIFY_STORY_COLOR=1`
checks Story gradient/solid color. Run those control modes separately: they make
different assumptions about the currently expanded panel. These checks use an
isolated local browser, not the user's open canvas, and do not overwrite the input.

Regression coverage: `tests/coco-compiled-import-authority.test.ts` and
`tests/coco-compiled-shadow-controls.test.ts`. Compiler counts and unit tests are
not visual acceptance. The original portrait compilation's overall visual review
was failed; successful control tests do not retroactively approve that layout.

## What is saved versus automatic

The translation, ownership, color, gradient, and per-glyph shadow fixes are reusable
code. Font scaling remains adapter-configured. Exact baseline/skew and automatic
aspect adaptation are not solved by these notes. The user's refined project is a
separate authoritative artifact. This document records the working corrections
and the diagnosis method without claiming an automatic perfect conversion.
