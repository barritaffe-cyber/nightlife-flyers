# Throwback Saturdays v2

Reference rebuild of the existing `throwback_cassette` gallery entry. Uses the
finished `/generated-flyers/assets/throwback-bg.png` supplied in the latest revision,
and the earlier text-layout reference. Duplicate CSS paper strips, crowns,
halftone dots, side slogans and corner accents have been removed: these are
already in the supplied artwork. Square uses it edge to edge. Story uses the dedicated `/generated-flyers/assets/throwback-bg-story.jpg`
edge to edge, with dark DJ and venue text on its white torn-paper footer.
Only event typography, rules and the headline underline are added.

Source: `public/generated-flyers/throwback-saturdays-master.html`.
Builder: `scripts/build-throwback-saturdays-master.mjs`.
Outputs: `lib/template-data/throwback-v2.json` and
`public/generated-flyers/throwback-saturdays.nflyer`.

20 compiled objects in each format, including editable text. Square and story
have separately authored placement. Road Rage is the title face; Good Brush
handles supporting accents. The ink/purple/pink/paper palette is the recipe's
core palette. Paper, texture and cassette come from the supplied finished background.

The existing gallery ID uses the new data and preview. Older Throwback JSON
files are untouched. This does not add a new entry to the Coco recipe registry.

Validation: compiler has zero unsupported objects or warnings in both formats;
`tests/coco-throwback-rebuild.test.ts` checks event bindings, separate format
geometry, existing background, and native decoration shapes. Browser preview
script: `scripts/render-throwback-study.mjs`. Import verification:
`NF_PREVIEW_ONLY=1 node scripts/verify-throwback-import.mjs`.

Verified actual editor imports in square and story after correcting all object-ID
font mappings. Both previews rendered without page errors. Full TypeScript still
has existing unrelated diagnostics; none in the changed template/editor files.

Portrait correction: removed the square-background extension. Date strip and
genre text align with portrait panels. Story regression assertions check the
dedicated image path, full-height coverage, and dark footer text.

Text mapping correction: all 15 text objects now have unique backing fields.
PRESENTS maps to Presenter; weekday/month to Date; motto/genres to Details;
MUSIC BY to the DJ label control; NIGHTCLUB to Venue’s companion-text control.
Companion labels use compiled-object overrides, so editing one does not replace
the main presenter, date, lineup or venue. Genres enable the Details field.
Three focused tests cover bindings, unique fields, geometry and assets.

## Authoritative saved revision

The user save dated 2026-09-09T03:03:20.160Z supersedes the CSS baseline.
SHA-256: `038152338bca2c04be59188ee0fb77b9415a82a82d352f2270669194aa291137`.
`throwback-saturdays-updated.nflyer` preserves its exact bytes; gallery JSON
preserves both sessions exactly, including all overrides and story QR.
Run `node scripts/sync-throwback-saved.mjs` to promote future user saves.
The CSS builder refuses to overwrite an authoritative save. The master HTML
and its direct renders are historical construction references, not the current
authority. Gallery uses the saved editor preview.
