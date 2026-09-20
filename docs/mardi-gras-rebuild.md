# Mardi Gras — Carnival of Colors

Replacement for gallery ID `mardi_gras`, from the supplied target and unchanged
`public/generated-flyers/mardi-gras-square.jpg` / `mardi-gras-story.jpg`.
Displaced gallery source and saved JSON are archived with SHA-256 under
`recipe-file-backups/mardi-gras-rebuild/provenance.json`.

Source/project: `public/generated-flyers/mardi-gras-master.html` and
`mardi-gras.nflyer`. Builder: `scripts/build-mardi-gras-master.mjs`.
Gallery sessions: `lib/template-data/mardi-gras-v2.json`.

Both explicit layouts use the semantic compiler/materializer at editorTextScale
.5. Each has 28 compiled objects, including 18 editable texts (17 visible and an
empty music-list label), plus the native runtime QR overlay. Date parts, venue,
address, description, script, tagline and each offer caption remain separate.
Compilation reports zero warnings, approximations or unsupported objects; this
does not imply a pixel-identical reference match.

Local Didot, bundled Dear Script and Lemon Milk Light adapt the target fonts.
The geometric patterned gold SVG is clipped into editable two-line text. Fixed
full-word pixel texture sizing supports the editor's per-glyph renderer. Gold
ornament and line icons are code-native approximations, not traced target artwork.
Didot is not bundled and cross-platform font fidelity is unverified. No AI image
generation was used.

The user explicitly requested the existing UI QR placeholder so each user can
upload their own QR. The builder enables native QR with qrImageUrl null and
removes the CSS study placeholder from compiled objects. A small generic renderer
change suppresses the native SCAN HERE label when a compiled text object owns
semanticRole qrCaption, avoiding duplicate labels. Upload/replace/reset uses the
existing Template QR panel. No destination URL has been assigned.

The first editor check exposed inherited rightRail disabling the description;
the builder now preserves that field and enables it. Structural checks assert
all bound initial text values and enabled flags, avoiding silent missing copy.

Validation commands:

```sh
node scripts/build-mardi-gras-master.mjs
node scripts/render-mardi-gras-study.mjs
node --experimental-strip-types --test tests/coco-mardi-gras-rebuild.test.ts
NF_OUTPUT_DIR=/tmp/mardi-gras-final node scripts/verify-mardi-gras-import.mjs
NF_OUTPUT_DIR=/tmp/mardi-gras-effects node scripts/verify-mardi-gras-effects.mjs
```

Two structural tests pass. CSS layouts visually inspected. Effects verification
passed title/subtitle size, spacing, leading, shadows and headline layer movement
in both formats. Save/reopen and subsequent switches retained Square shadows on
with subtitle spacing .03, and Story shadows off with spacing .06.
Log: `/tmp/mardi-gras-effects.log`. Test edits are not master sessions.

Full paid PNG export, cross-platform rendering and the complete multi-template
regression runner remain unverified. No commit/deployment. Preserve next accepted
user save. Durable previews are clean editor screenshots, not paid PNG exports.

The native QR interaction check also exposed a duplicate materialized placeholder
in portraits/emojiList after removing its compiled object. The builder now removes
that placeholder from all three representations; structural tests cover this.
Eleven focused template/import-authority/shadow tests pass. Typecheck retains
unrelated existing errors with none in app/page.tsx or Mardi files
(`/tmp/mardi-tsc.log`).

Final editor acceptance passed 34 visible-text selections, headline/script edits,
music-list and address alignment, label type/clear/retype, QR upload and Use
Default in both formats, and project save/reopen with authored tracking.
No captured runtime errors. Log: `/tmp/mardi-gras-final.log`.
Both final editor previews were visually inspected and promoted to gallery under
**Mardi Gras — Carnival of Colors**. Old saved JSON remains for compatibility.
