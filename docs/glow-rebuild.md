## Glow Chrome clean-sheet replacement — 2026-09-15

- Replaced Glow in the Dark’s chrome lettering with the four supplied
  `glow-neon01.png`–`04.png` sheets (each1254×1254 RGBA).
- `scripts/build-glow-chrome-font.py` now extracts62 native PNGs: uppercase,
  genuine lowercase (formerly uppercase aliases), and digits. Source RGB and
  aspect ratios retained, connected ink followed across cell boundaries, i/j
  dots preserved. A600ppem strike asserts no source downsampling and checks all
  four font paint bounds. Metrics record source hashes and extraction bounds.
- Existing command `scripts/build-glow-fonts.py glow-chrome` delegates to the new
  builder so future rebuilds cannot restore the old sheet. Neon Green is unchanged.
- Font family remains template-only `Glow Chrome PNG`; runtime/CSS/master/specimen
  load `GlowChromePNG.woff2?v=2`. Recipe documents and staggered G/L/O/W transforms
  are unchanged. Gallery/editor and master previews refreshed.
- `scripts/verify-glow-glyph-update.mjs` with `NF_GLOW_EXPORT_CHECK=1`,
  `NF_GLOW_EXPORT_ACCESS_FIXTURE=1`, `NF_GLOW_AUDIT_DIR=/tmp/glow-glyph-update`
  checked17 text owners and new font requests on both canvases. Actual Square
  2160×2160 and Story2160×3840 PNG exports plus all62 glyphs visually inspected;
  no page errors. Two glyph/layout regression tests pass. Source sheets and
  old `glow.png` retained; no generated replacement artwork.

## Per-letter refinement, version 12

G/L/O/W use separate scales **1 / .92 / .96 / 1.04**, reference Y offsets **0 / +28 / +8 / -12**, rotations **0 / -1 / +1 / +2 degrees**, and overlaps before L/O/W **-40 / -32 / -36**. L is deliberately smaller and lower than O. Reference pixels normalize to the bitmap font's cap height so they scale with typography. `lib/glowGlyphLayout.ts` is the source of truth; `glow-offset-v1` opts this template into per-glyph transforms while preserving kerning, editable text and shadows. Authored tracking is zero; live tracking remains available.

Both actual Coco formats and saved/reopened projects passed the letter-scale/rotation checks, title edits and controls. Updated clean previews are `glow-square-preview.png` and `glow-story-preview.png`. Older version 11 description follows; version 12 supersedes its uniform GLOW arrangement.

# Glow in the Dark — Club Woods replacement

Replaces the existing `glow-in-the-dark` gallery entry, recipe/session/cache version 11. The supplied clean backgrounds are `assets/glow-square.jpg` and `assets/glow-story.jpg`. The editable title families are built from `assets/png-glyphs/glow.png` and `glow-paint.png`; all paths are under `public/generated-flyers/`.

`Glow Chrome PNG` is template-only. `Neon Green PNG` is available in both public font pickers. Existing collections remain available. Both use 36 supplied uppercase/digit glyphs with lowercase aliases, source alpha, sbix bitmap packaging and contour kerning. The touching green G/H, K/L and Q/R groups require explicit separation; K/L follows source-stroke polygons and retains shared crossing pixels. The intersecting sheet is not independent layered artwork, so extraction is an approximation at those crossings. No replacement artwork was generated.

Builder: `scripts/build-glow-fonts.py`. Font metrics, source hashes and individual glyphs are under `assets/png-glyphs/glow-chrome/` and `neon-green/`. Durable full specimens: [Glow Chrome](../public/generated-flyers/glow-chrome-font-preview.png), [Neon Green](../public/generated-flyers/glow-green-font-preview.png), and [public picker sample](../public/generated-flyers/neon-green-picker-preview.png).

Master: `public/generated-flyers/glow-master.html`. Compiler: `scripts/build-glow-master.mjs`. Project: `public/generated-flyers/glow.nflyer`; variants: `lib/template-data/glow-v2.json`. Each format contains 24 objects, including 16 visible editable text owners and an empty Details label. Good Brush supplies IN THE; Bebas Neue supplies condensed supporting copy; Dear Script supplies the decorative bucket copy. Story is independently arranged to keep the main title above the face. The clean background lacks the target's wall-sign lettering. This is an editable adaptation, not a pixel-identical recreation.

The original `glow-in-the-dark.nflyer` is preserved byte-for-byte. Prior project, gallery and recipe metadata are archived with hashes in `recipe-file-backups/glow-rebuild/`. Do not rebuild the former master over a newer accepted user save. The new builder checks `lib/template-data/glow-saved-source.json` before rebuilding.

Validation commands:

```sh
/tmp/offshore-font-build/bin/python scripts/build-glow-fonts.py glow-chrome
/tmp/offshore-font-build/bin/python scripts/build-glow-fonts.py neon-green
node --experimental-strip-types scripts/build-glow-master.mjs
node scripts/render-glow-study.mjs
node scripts/verify-glow-font-picker.mjs
node scripts/verify-glow-editor.mjs
node --experimental-strip-types --test tests/coco-glow-replacement.test.ts tests/registered-recipe-templates.test.ts
```

Font coverage, unique glyphs, lowercase aliases, alpha, source hashes and kerning checks passed. Real picker component verification passed: only Neon Green from this pair is exposed, and it paints colored bitmap glyphs. Initial editor runs passed title editing, typography, shadow controls, layers and independent format save/reopen. The final verifier additionally waits for both canvas dimensions and all 16 text owners before preview capture and selection assertions. Final run passed all 16 text selections in each format, both title edits and controls, layers and independent format save/reopen. Clean 1080px-wide actual editor previews were inspected and installed in the existing gallery entry. Three replacement/gallery tests passed; focused lint clean. Other 24 gallery entries and the original project are unchanged. Final results are also recorded in NEXT_SESSION_CONTEXT.md. PNG export remains unverified. No commit or deployment.
