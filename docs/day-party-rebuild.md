# Day Party — Offshore

The `day_party` gallery entry uses `lib/template-data/day-party-v2.json`, matching
the Square and Story sessions in `public/generated-flyers/day-party.nflyer`.
Construction source: `public/generated-flyers/day-party-master.html`.
Rebuild with `node scripts/build-day-party-master.mjs` only before a user save
has been accepted. The builder checks for accepted-save provenance.

The target is the first supplied image. The tall supplied image is used for
Story and the square image for Square, with independent compositions. Assets
are `assets/day party-square.png` and `assets/day party-story.jpg`; the target
flyer is not used as a background. Each format contains 19 editable text objects,
six rules, and one background. The empty event-details label has its own owner.
All three DJ objects map their label control to MUSIC BY while retaining
independent body copy. Details and venue address retain object-level alignment.

OFFSHORE uses the supplied SVG outlines packaged as the local `Offshore SVG`
display font, with the supplied photograph embedded in
`assets/day-party-title-texture.svg`. Its permanent public URL replaces the
compiler's temporary localhost URL. A single-line layout and horizontal scale
keep the title within the composition. Offshore SVG, LEMON MILK and Avigea are
bundled. `scripts/build-offshore-font.py` builds the WOFF2 with fonttools and
brotli from `assets/offshore-ai-traced-svg-glyphs`. The source SVGs are preserved.
Two adjacent-letter remnants in the palm-O crop are excluded during packaging.

Both cases display uppercase letterforms. Lowercase `o` maps to the plain O;
uppercase `O` (Shift+O) maps to the palm O. Default copy `oFFSHORE` selects only
the second O's palm. Do not uppercase the stored text or CSS for this family.
The palm is part of the glyph outline, so texture, sizing, movement and shadows
follow it. Other fonts retain their ordinary behavior. A–Z, a–z, 0–9, spaces,
periods and hyphens are included; other punctuation is not supplied.
`scripts/offshore-headline-config.mjs` applies this setup to both formats and
the builder, keeping the gallery and portable project consistent.

Validation commands (local editor running):

```bash
node --experimental-strip-types --test tests/coco-day-party-rebuild.test.ts
node scripts/verify-day-party-import.mjs
NF_PROJECT_FILE=public/generated-flyers/day-party.nflyer node scripts/verify-disco-shadow-toggle.mjs
npm run coco:verify-editor
```

The browser check covers text selection, shared MUSIC BY labels, empty details
labels, independent alignment, one-line textured glyphs, and project save/reopen.
Square tracking is .08em and Story .12em; the round-trip check deliberately
asserts both independently. Allow import and format hydration to settle before
asserting typography. Earlier short waits inspected transitional Square styles
on Story; the longer settled check passed without a runtime tracking change.

Square and Story previews were visually checked. Independent headline/subheadline
shadow toggles passed. The existing shared editor regressions passed. PNG export
verification was attempted with `NF_EXPORT_CHECKS=1` but blocked by the test
account's render limit; export output remains unverified. Existing unrelated
repository TypeScript diagnostics remain; no diagnostics were reported for
the changed page/template registration files.

Refresh exact source previews without editor mutations:

```bash
NF_PREVIEW_ONLY=1 NF_ACCEPTED_PREVIEW=1 node scripts/verify-day-party-import.mjs
```

Shared regression screenshots go to `/tmp/nightlife-editor-regressions` so
interaction checks cannot overwrite accepted template previews.
