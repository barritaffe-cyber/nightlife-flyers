# Grills & Groove

Added as a new template, using the supplied `assets/bar-b-q-square.jpg` and
`assets/bar-b-q-story.jpg`. The finished image supplied in chat is the layout
reference, not a visible background. Square keeps the right-hand information
column; Story uses a large title above the central grill and a lower details
section. The user explicitly requested the spelling **GRILLS** and the existing
**Textured Gold Serif PNG** family. GROOVE uses Another Danger Slanted in ivory;
the separate gold ampersand uses the bundled Avigea face.

- Recipe: `grills-and-groove`, gallery ID `recipe_grills_and_groove`.
- Themes: Elegant, R&B / Lounge, Brunch. No added portrait required.
- Authoring source: `public/generated-flyers/grills-and-groove-master.html`.
- Build adapter: `scripts/build-grills-and-groove-master.mjs`.
- Portable Square/Story project: `public/generated-flyers/grills-and-groove.nflyer`.
- Initial session cache: `lib/template-data/grills-and-groove-v1.json`.
- Actual editor previews: `public/generated-flyers/grills-and-groove-{square,story}-preview.png`.

Each format has 26 objects, including 19 independently editable text owners.
The initially empty Event Details label and authored MUSIC BY label have their
own bindings. The two DJs, date parts, venue, address, specials and reservations
are separate. All photo assets remain unchanged. No text is baked into them.

The ampersand is an optional title connector. `Grills & Groove` maps to GRILLS,
&, and GROOVE; a two-word name clears the connector. Existing Glow / IN THE /
Dark behavior is covered by regression tests. The connector uses its own Event
Details control binding: assigning it the native Sub Headline panel caused an
ampersand edit to also change GROOVE, which the browser editing check caught.

Compile with `node --experimental-strip-types scripts/build-grills-and-groove-master.mjs`.
The adapter refuses to overwrite a future accepted source guarded by
`grills-and-groove-saved-source.json`. Preserve future user saves over this initial
construction source.

Verification tools:

- `scripts/verify-grills-and-groove.mjs`: exact saved text and glyph loading in
  both editor formats. `NF_GRILLS_GROOVE_EXPORT_CHECK=1` exercises PNG export;
  `NF_GRILLS_GROOVE_EXPORT_ACCESS_FIXTURE=1` supplies isolated browser quota
  responses. This tests the actual renderer without consuming quota; it does
  not verify account entitlement. `NF_GRILLS_GROOVE_IMPORT` selects a saved file,
  and `NF_GRILLS_GROOVE_AUDIT_DIR` controls evidence output. Set
  `NF_GRILLS_GROOVE_PUBLISH_PREVIEWS=1` only for the unedited template.
- `scripts/verify-grills-and-groove-controls.mjs`: actual glyph selection, each
  text field, sibling preservation, independent labels, alignment, distinct
  per-format shadows, saving and reopening. Uses a disposable copy.
- `scripts/verify-grills-and-groove-discovery.mjs`: Grills & Groove / Elegant
  through both personalized previews to the details form.
- `tests/coco-grills-and-groove.test.ts`: title/connector assignment, independent
  artwork and text bindings, form materialization, unchanged Glow behavior.

Structural recipe audit passed. The complete registered gallery contains 64
recipes; its 77 focused registration/provenance checks passed. The later
17-test title/choice run passed, including the added Glow regression. Both
original editor renders, both actual PNG exports (2160×2160 / 2160×3840), and
both personalized chooser previews were opened and visually inspected.

The final controls run passed all 36 visible text selections/edits, label
clear/retype, sibling preservation, alignment and independent Square/Story
shadow settings. The saved test project reopens with CLUB NOVA in Square and
CLUB EMBER in Story, with SOUNDS BY and SPECIALS retained. The initial edited
Story screenshot was captured during a visual transition and is not acceptance
evidence; the later stable reopened editor captures are in
`/tmp/grills-and-groove-reopened/`. The untouched template remains CLUB WOODS.

After the ampersand binding correction, all seven final template/registration
tests passed, and changed/new-file ESLint is clean. No shared renderer changes,
commits or deployment were made for this template.

Final reopened-project verification also passed both actual PNG exports,
2160×2160 and 2160×3840, with no captured browser page errors. Both exports were
opened and visually inspected; labels, separate venue edits and the gold PNG
lettering survived. Evidence: `/tmp/grills-and-groove-reopened/`. Export quota
responses were isolated browser fixtures as described above.
