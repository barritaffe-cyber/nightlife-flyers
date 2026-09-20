# Miami Sunset Sessions

Replacement for gallery ID `miami2`, using the supplied target and unchanged
`public/generated-flyers/assets/miami-nights-square.jpg` and
`miami-nights-story.jpg`. The displaced gallery source and saved data are archived
with SHA-256 in `recipe-file-backups/miami-nights-rebuild/provenance.json`.

Source: `public/generated-flyers/miami-nights-master.html`.
Builder: `scripts/build-miami-nights-master.mjs`.
Project: `public/generated-flyers/miami-nights.nflyer`.
Gallery sessions: `lib/template-data/miami-nights-v2.json`.

Both explicit layouts use the semantic compiler/materializer with editorTextScale
.5. Each has 15 objects, including 10 independent editable texts (nine visible
and one empty genre label). Date parts, music list, mood, venue and address remain
separate. Unused inherited fields are disabled. Compilation reports zero warnings,
approximated objects or unsupported objects; this does not mean pixel equality
with the target.

Local Didot and bundled Lemon Milk Light adapt the reference typography. The
editable headline clips a warm crop of the supplied Square photograph via
`assets/miami-nights-title-texture.svg`. Fixed full-word pixel background sizing
preserves the image across per-glyph spans. No AI image generation was used.
Didot is not bundled, and cross-platform fidelity is unverified.

Subtitle tracking binds to `head2Tracking`, added during the preceding Afrobeat
work. The builder initializes head2Fx.tracking from authored typography (.5 Square,
.55 Story), preventing default tracking from overriding the imported spacing.

Validation:

```sh
node scripts/build-miami-nights-master.mjs
node scripts/render-miami-nights-study.mjs
node --experimental-strip-types --test tests/coco-miami-nights-rebuild.test.ts tests/coco-compiled-import-authority.test.ts tests/coco-compiled-shadow-controls.test.ts
NF_OUTPUT_DIR=/tmp/miami-nights-check node scripts/verify-miami-nights-import.mjs
NF_OUTPUT_DIR=/tmp/miami-effects node scripts/verify-miami-effects.mjs
```

Eleven focused tests pass. CSS and editor previews were visually inspected in
both formats. Editor acceptance passed 18 visible-text selections,
headline/subtitle edits, genre/address alignment, label type/clear/retype, authored
genre tracking and project save/reopen, with no captured runtime errors.
Log: `/tmp/miami-nights-check.log`.

Durable previews are clean editor screenshots, not paid PNG exports. Full paid
PNG export, cross-platform rendering and the complete multi-template regression
runner remain unverified. No commit or deployment. Preserve the next accepted
user save; test edits must not replace the master sessions.

Final effects verification passed headline/subtitle size, spacing, leading,
shadows and headline layer movement in both formats. Save/reopen and
Square→Story→Square retained independent shadow states and subtitle spacing
(.03 Square, .06 Story). No captured runtime errors; log `/tmp/miami-effects.log`.
Earlier harness attempts needed explicit control expansion and real glyph clicks,
plus a wait for canvas remount after layer changes. The passing runner includes
those corrections. These temporary edits were not promoted to the template.

Gallery label is **Miami Nights — Sunset Sessions**, using the new sessions and
`public/generated-flyers/miami-nights-square-preview.png`; Story preview is
`miami-nights-story-preview.png` in the same directory. Original Miami data remains
available for compatibility. Miami Heat is unchanged.
