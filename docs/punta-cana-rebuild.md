# Cana warm metallic material update (version 6)

User rejected the procedural version as weak and asked for warm metallic gold, subtle grain, golden yellow through amber to soft burnt orange, and gentle highlights. Replaced the active procedural streak layers with a generated natural pressed-metal surface inside the existing editable SVG glyph masks. Actual before/after close-ups were inspected. The material is a reference-based recreation, not an exact extraction of the raster lettering.

Asset: `public/generated-flyers/assets/cana-metallic-surface-v6.png`. Built-in image-generation prompt, input reference and original saved path: `docs/cana-metallic-material-v6-generation.md`.

`sunset-foil-mask-v2` fits one continuous image over the measured letter faces, mixes it at 70% over a matching warm gradient, and uses a much thinner directional edge/depth than version 5. It bypasses the prior coarse/fine/diffuse overlay stack. The older `sunset-foil-mask-v1` renderer behavior remains available for prior saves. Family, text, size, spacing, leading, opaque fill override, per-letter shadows and layers remain editable. The material palette itself is fixed; general Grad A/B controls do not change it. See [the reusable texture and gradient process](complex-text-materials.md).

Recipe, both portable sessions, gallery and cache revision are version 6. Before-change component/project/gallery snapshot and SHA256 manifest: `recipe-file-backups/punta-cana-material-v6/`. Only Punta's gallery entry changed; the other 24 and the original accepted version 2 Punta project are unchanged.

Validation: compiler reports 22 objects in each format with zero unsupported objects/warnings. Eight focused replacement/gallery/shadow tests pass. Lint has zero errors and the three existing app warnings. Actual high-resolution Coco Square/Story and material close-ups are refreshed after visual review. Final browser acceptance passed in Square and Story: all visible text selection, live title/mask edits, material image decoding, Details label clear/retype, alignment, tracking, full save/reopen, both titles’ typography/shadows/layer ordering and format persistence. PNG export remains unverified; no commit/deployment.

---

# Historical Cana SVG-mask material update (version 5)

User requested greater texture accuracy, explicitly requested an SVG mask, and supplied SVG material code. The normalized supplied source is `public/generated-flyers/assets/cana-gold-orange-texture.svg`. `cana-gold-orange-texture-compatible.svg` preserves its material layers with isolated CSS soft-light/overlay blending for the source fallback.

Version 5 used `sunset-foil-mask-v1`, dispatched only for opted-in textured text; version 6 above supersedes this material. `components/text/SunsetFoilMaskText.tsx` uses live font glyphs as individual SVG masks over a continuous six-stop gold/orange/coral material. It retains the supplied sheen, vignette, noise seeds 19/41 and alpha values .24/.10. Frequencies scale with material dimensions; relief scales with text size. Actual ink bounds drive material placement, excluding empty line-box space. A restrained specular edge and warm depth accompany each letter. Existing per-letter shadow controls remain live.

A transparent compiled text color was incorrectly treated as a solid-color override during development; fixed before completion. Browser checks now assert the material face remains a gradient paint rather than transparent, and that mask lettering follows live title edits. Color overrides remain available for actual opaque selected colors.

Version 5 is saved in both format sessions, gallery, and portable cache. Original version 2 accepted project remains unchanged. Before-material project backup: `recipe-file-backups/punta-cana-texture-v4/punta-cana.nflyer`.

Validation: eight focused replacement/gallery/shadow tests passed; lint zero errors, three existing app warnings. Both format previews and high-resolution material close-ups rendered in actual Coco. Typography, per-letter shadows, layer ordering and independent-format save/reopen passed. Final complete mask-edit/selection/save-reopen regression passed in both formats, including transparent-fill and live mask-lettering assertions. Export still unverified; no commit/deployment. The supplied material is implemented, but its procedural surface and the current font are not an exact reproduction of the raster reference.

Close-ups: `public/generated-flyers/cana-square-material-detail.png`, `cana-story-material-detail.png`.

---

# Punta Cana Sundays replacement

The supplied target and clean Square/Story backgrounds replace the existing `punta-cana-sundays` gallery entry, version 3. Portable project: `public/generated-flyers/punta-cana.nflyer`; variants: `lib/template-data/punta-cana-v2.json`; authored source: `public/generated-flyers/punta-cana-master.html`; builder: `scripts/build-punta-cana-master.mjs`.

The background uses the supplied `assets/punta-cana-square.jpg` or `assets/punta-cana-story.jpg`. The target `redesigns/punta-cana.png` is reference only. Each format contains 22 compiled objects: background, eight rules/dividers, twelve visible editable text owners, and an empty Details label. Avigea Punta/Cana use ivory and orange SVG textures; Sundays uses existing Dear Script; DJ names use Georgia. Supporting copy uses existing LEMONMILK and Bebas Neue. All lettering remains editable through semantic sidebar bindings, with explicit format geometry and manual wrapping. No new UI or font collection was introduced.

The prior accepted `punta-cana-sundays.nflyer` remains byte-for-byte unchanged, SHA256 `d611ee901fbd37c2e4c78b9279d78a6777c0e8607c68089246ea0ec7d81a772a`. Source/gallery/recipe backups and hash manifest are under `recipe-file-backups/punta-cana-rebuild/`. The older builder retains its version 2 descriptor and original summary. Other 24 gallery entries were verified unchanged. No shared renderer modifications were needed.

Validation:
- Both format compiler reports: 22 objects, zero unsupported objects and warnings.
- Actual Coco Square and Story previews rendered and visually inspected; final DJ spacing corrected and previews refreshed.
- All twelve visible text owners selected in both formats; title edits, Details label clear/retype, Details/venue L/C/R alignment, tracking and complete project save/reopen passed (`scripts/verify-punta-cana-import.mjs`).
- Both textured titles passed size, spacing, leading, shadows, layer ordering and independent-format save/reopen (`scripts/verify-punta-cana-effects.mjs`).
- Replacement and gallery tests all pass. Combined legacy/replacement/gallery run: 8 passed, 2 legacy failures. The old saved file's layout snapshots differ from its active sessions, and fresh compilation differs from the accepted edited file. These failures concern the preserved version 2 project; do not overwrite accepted edits to force deterministic equality.
- Focused lint passed without warnings or errors.

The title fonts and texture depth approximate the raster target rather than reproducing its exact dimensional lettering. Story is an adaptation using the supplied Story background. PNG export remains unverified in the guest flow. No commit/deployment.
