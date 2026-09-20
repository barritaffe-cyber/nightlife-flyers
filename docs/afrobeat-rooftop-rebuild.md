# Afrobeat Rooftop Sessions

Requested replacement for existing gallery ID `afrobeat_rooftop`, using the
supplied target and clean `assets/afro-square.png` (1080²) and `afro-story.jpg`
(1080×1920). Asset paths are relative to `public/generated-flyers/`.
The original gallery source and saved template JSON are archived, with SHA-256,
in `recipe-file-backups/afrobeat-rebuild/provenance.json`.

Source: `public/generated-flyers/afrobeat-rooftop-master.html`.
Builder: `node scripts/build-afrobeat-rooftop-master.mjs`.
Project: `public/generated-flyers/afrobeat-rooftop.nflyer`.
Gallery data: `lib/template-data/afrobeat-rooftop-v2.json`.

Reuses the semantic compiler, materializer, compiled-text selection and texture
workflow established by Sunset Yacht/Day Party. Both explicit layouts use
editorTextScale .5. There are 16 independent editable texts (15 visible, one empty
genre label) and 25 total objects per format. Labels, venue, address, date parts,
genres and side copy remain separate. Original backgrounds are unchanged.
The Africa emblem is a separate movable vector decoration; its initial position
is measured against the O after fonts load. It is not part of the font, so later
headline edits may require repositioning it. The silhouette is an approximation.

Typography adapts the target with local Didot, bundled Dear Script and Lemon Milk.
Didot is not bundled; cross-platform fidelity is not established. The target's
sculpted gold lettering is approximated by an editable pale gold foil texture and
edge light. It is not a traced reproduction. No AI image generation was used. Explicitly disables inherited presenter/left rail.

Commands:

```sh
node scripts/build-afrobeat-rooftop-master.mjs
node scripts/render-afrobeat-rooftop-study.mjs
node --experimental-strip-types --test tests/coco-afrobeat-rooftop-rebuild.test.ts
NF_OUTPUT_DIR=/tmp/afrobeat-rooftop-check node scripts/verify-afrobeat-rooftop-import.mjs
```

Both structural tests pass; compilation has no approximated/unsupported objects
or warnings. Those compiler counts do not imply an exact match to the reference.
CSS and actual editor previews in both formats were visually inspected.
Editor acceptance passed all 30 visible-text selections, headline/subtitle edits,
genre/address L/C/R, label type/clear/retype, authored tracking (.25) and
Square/Story project save/reopen, without captured runtime errors.
Log: `/tmp/afrobeat-rooftop-check.log`. Dedicated effects checks subsequently passed;
the first layer-control attempt was blocked by the save reminder, so the runner
now dismisses that notice before clicking the controls.
No commit or deployment. Preserve the user's next accepted editor save.

The focused effects pass exposed a missing compiled subtitle tracking binding.
`app/page.tsx` now exposes `head2Tracking: head2Fx.tracking` to the compiled
renderer, and this builder binds the subtitle tracking to that field. This is
additive: existing documents without that binding retain their previous behavior.
Eleven focused template/import-authority/shadow-control tests pass. The complete
multi-template editor regression runner has not been rerun; do not infer that
coverage from these focused checks.

Typecheck retains unrelated existing errors, with none in app/page.tsx or the
Afrobeat files (`/tmp/afrobeat-tsc.log`). Archived TypeScript snapshots use a
`.ts.txt` suffix so TypeScript does not compile backup copies with relocated
imports; archived bytes and recorded SHA-256 values are unchanged.

Final effects verification passed size, spacing, leading, live shadows and layer
movement for headline/subtitle in both formats. Saved/reopened Square retained
shadows on and subtitle spacing .03; Story retained shadows off and spacing .06.
The initial shadow assertion used a selector that missed the subtitle strength
field; the final runner explicitly finds that control and sets strength to 1.
No captured runtime errors. Runner: `scripts/verify-afrobeat-effects.mjs`;
log: `/tmp/afrobeat-effects.log`. These test edits were not promoted to the master.

The gallery now uses the new sessions and Square preview under the existing ID,
with label **Afrobeat — Rooftop Sessions**. Durable editor previews:
`public/generated-flyers/afrobeat-rooftop-square-preview.png` and
`afrobeat-rooftop-story-preview.png`. They are editor screenshots, not paid PNG
exports. Full paid PNG export and cross-platform rendering remain unverified.
