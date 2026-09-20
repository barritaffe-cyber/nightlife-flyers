# Miami Street — Nights

Replacement for gallery ID `miami_st`, using the supplied target and unchanged
`public/generated-flyers/miami-skline-square.jpg` and `miami-skline-story.jpg`.
The supplied files are matched by aspect ratio. Displaced gallery source is
archived with SHA-256 in `recipe-file-backups/miami-street-rebuild/provenance.json`.

Source: `public/generated-flyers/miami-street-master.html`.
Builder: `scripts/build-miami-street-master.mjs`.
Project: `public/generated-flyers/miami-street.nflyer`.
Gallery sessions: `lib/template-data/miami-street-v2.json`.

Each explicit layout has 17 objects, including 11 editable texts (10 visible and
an empty music-list label). Date parts, mood, time, music list, venue and address
remain separate. Semantic compiler/materializer uses editorTextScale .5 and
reports zero warnings, approximations or unsupported objects. These counts do not
mean pixel equality with the reference.

Typography adapts the target using local Didot and bundled Lemon Milk Light.
The editable headline uses the established photograph-inside-text SVG technique,
with a warmer version of the preceding Miami sunset/palm texture. The texture
embeds the previously supplied Miami pool photograph; the street backgrounds are
unchanged. Fixed full-word pixel sizing preserves the image across glyph spans.
No AI image generation was used. Didot is not bundled, so cross-platform fidelity
remains unverified. Subtitle authored tracking 1.6 initializes head2Fx and binds
to head2Tracking; the master preserves this wide spacing on import.

Commands:

```sh
node scripts/build-miami-street-master.mjs
node scripts/render-miami-street-study.mjs
node --experimental-strip-types --test tests/coco-miami-street-rebuild.test.ts
NF_OUTPUT_DIR=/tmp/miami-street-check node scripts/verify-miami-street-import.mjs
NF_OUTPUT_DIR=/tmp/miami-street-effects node scripts/verify-miami-street-effects.mjs
```

Two structural tests pass, covering independent bindings, source backgrounds,
texture sizing, authored tracking and equality of portable/gallery sessions.
Full paid PNG export, cross-platform rendering and full multi-template regression
remain unverified. Preserve next accepted user save. No commit or deployment.

Editor acceptance passed all 20 visible-text selections, headline/subtitle edits,
music-list/address alignment, empty label type/clear/retype, and project
save/reopen, with no captured runtime errors. Effects checks passed both title
and subtitle size, spacing, leading and shadows, plus headline layer movement.
Saved/reopened Square retained shadows on and subtitle spacing .03; Story retained
shadows off and spacing .06, including subsequent format switches.
Logs: `/tmp/miami-street-check.log`, `/tmp/miami-street-effects.log`.

After those checks, only the NIGHTS x-position changed to compensate for the
trailing letter spacing. Recompiled with no warnings and structural tests passed
again. Final clean editor previews were captured separately; temporary effects
and label edits were not promoted to master data.

The final unedited master save/reopen check also passed after the centering
change (`/tmp/miami-street-final-roundtrip.log`). The preview-only harness now
expects the authored centered address, and format tracking verification waits
for stable canvas dimensions and computed typography to avoid reading a detached
node during a format remount. Gallery label **Miami Street — Nights** uses the
new sessions and clean editor previews (`miami-street-square-preview.png` and
`miami-street-story-preview.png`). These previews are not paid PNG exports.
