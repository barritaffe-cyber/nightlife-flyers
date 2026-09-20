# YCEE Live and Spotlight Gold

`ycee-live` is available in Coco and the template gallery in Square and Story. It uses the supplied amber crowd backgrounds and a separate editable portrait. The faint portrait echo is another independent image. The Tipsy monogram is an SVG approximation; the sweeping Live subtitle uses Dear Script.

The 62 supplied A–Z, a–z and 0–9 glyphs are available as **Spotlight Gold** in PNG Lettering and the regular Luxury / Fashion Display font list, for either headline. Native source glyph PNGs, metrics, source hashes and kerning are in `public/generated-flyers/assets/png-glyphs/spotlight-gold/`. Build the font with `scripts/build-spotlight-gold-font.py`.

The editable master is `public/generated-flyers/ycee-live-master.html`. Run `node --experimental-strip-types scripts/build-ycee-live-master.mjs`, then `node --experimental-strip-types scripts/build-registered-recipe-templates.mjs`. The builder refuses to overwrite an accepted saved-source file. Each format has 27 compiled objects, including 18 independent text owners; compilation has no approximations or unsupported objects. The background, portrait and lettering remain separate.

## Portrait edges

`lib/coco/portraitEdgeFade.ts` defines the always-on portrait alpha fade. It follows the image's local bounds, including changes to position, scale and rotation. The bottom 28% fades out, sides feather over 7%, and the top feathers over 2%. This applies to subject cutouts, portrait echoes and brand portraits in the standard canvas, compiled canvas and personalized previews. Logos and background images are excluded. Original uploaded images are preserved.

Canvas/Pixi export paths use the same alpha ramps in a temporary texture. DOM export uses the live mask. Keep standard `maskComposite: intersect` **after** `WebkitMaskComposite: source-in`: Chromium otherwise serializes `source-in` into the standard mask shorthand and drops the entire mask in the exported SVG/PNG.

## Verification

- `node --test tests/portrait-edge-fade.test.ts tests/coco-ycee-live.test.ts tests/coco-catalog-coverage.test.ts`: 18 passing checks.
- `scripts/verify-ycee-live.mjs`: both original images, 36 actual text selections/edits, four label checks, both saved-project round trips and actual 2160×2160 / 2160×3840 exports. Environment `NF_YCEE_LIVE_EXPORT_ACCESS_FIXTURE=1` isolates access checks from real billing.
- `scripts/verify-spotlight-gold.mjs`: both headline pickers, mixed-case/digits, multiline and spacing/size/shadow controls, save/reopen, both PNG exports.
- `scripts/verify-ycee-live-discovery.mjs`: Coco / YCEE Live / Elegant reaches both personalized previews and the details form; all four portrait images have their fade.
- `scripts/verify-portrait-edge-fade.mjs`: DOM export pixel regression, mobile texture alpha regression, resized project, actual canvas dragging, exports and save/reopen.
- Artifacts: `/tmp/ycee-live`, `/tmp/spotlight-gold-check`, `/tmp/ycee-live-discovery`, `/tmp/portrait-edge-fade`. Final artwork exports were visually inspected after fixing mask serialization.
- TypeScript remains at the existing 298 diagnostics; no new errors from these changes. No production deployment or billing/database mutation.
