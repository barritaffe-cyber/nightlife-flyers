# Black Tie — Maison

## Accepted user update

The authoritative project is now the exact user save from
`2026-09-10T03:38:08.434Z`, archived as
`public/generated-flyers/black-tie-submitted-cec7aaa4324f.nflyer`.
`lib/template-data/black-tie-saved-source.json` records its SHA-256 and provenance;
the gallery uses its Square and Story sessions unchanged. The construction
builder is now guarded: do not rebuild this accepted layout from the older HTML.
The construction notes below describe its origin, not the latest user edits.

Gallery ID: `blk_tie`. Portable project: `public/generated-flyers/black-tie.nflyer`.
The first user image is the composition reference. The clean Square PNG and
Story JPG under `public/generated-flyers/assets/` are the sole background images.

The authored master is `public/generated-flyers/black-tie-master.html`; compile
with `node --experimental-strip-types scripts/build-black-tie-master.mjs`.
It creates 1080×1080 and 1080×1920 variants at a 0.5 editor text scale, with 15
independently editable text objects, five rules/borders and one background.
Story has its own title size/position to keep BLACK clear of the bright tie beam.

BLACK uses a silver reflection gradient; TIE uses a warm gold reflection gradient.
Soft glow comes from their authored CSS paint. No bevel or added star decoration.
Type uses Didot and the bundled LEMONMILK-Regular. Didot is a system font on the
current Mac, not an embedded portable font; identical cross-platform letterforms
are not guaranteed.

The optional Event Details label is explicitly authored as an empty text object,
with `labelObjectId` on its related panel objects. New binding metadata
`pixelHitBounds` opts these text objects into visible-ink hit bounds. Details
tracking is also stored under the legacy restore alias `detailsTracking`.
The editor now restores canonical `bodyTracking` first; the browser check asserts
the rendered 0.55em spacing before and after save/reopen in each format.
Project import explicitly restores that field (previously omitted), and format
session saves synchronize both the canonical field and its legacy alias.

Validation commands:

```bash
node --experimental-strip-types --test tests/coco-black-tie-rebuild.test.ts
NF_EXPORT_CHECKS=1 node scripts/verify-black-tie-import.mjs
npm run coco:verify-editor
NF_PROJECT_FILE=public/generated-flyers/black-tie.nflyer node scripts/verify-disco-shadow-toggle.mjs
```

Browser checks use a separate session and save a round-trip project only under
`/tmp`. Initial editor previews and export images are separate artifacts; they
do not replace the clean backgrounds. Once a user updates this project, archive
and promote their exact save and add `black-tie-saved-source.json`; the construction
builder refuses to overwrite a project once that accepted-save marker exists.

The first editor pass verified all 14 visible objects in both formats, optional
label typing/clearing, address/details alignment and project save/reopen.
Black Tie headline and subtitle shadow independence also passed. Actual export
verification was blocked by the test session's free-render limit; no successful
download/export assertion is claimed. Editor previews are available separately.

Final validation passed: Black Tie selection/editing, alignment, rendered tracking,
save/reopen, structural checks, and shared Disco label/alignment/font/glint/shadow
regressions. Changed TypeScript files have no typecheck errors; the repository's
pre-existing errors elsewhere remain. The tracking round-trip check is included
in `npm run coco:verify-editor` for subsequent shared-editor changes.
