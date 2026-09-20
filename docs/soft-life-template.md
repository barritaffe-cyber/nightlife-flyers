# Soft Life

New Square and Story template based on the finished target and the two clean
backgrounds supplied by the user. The target guides the editable typography;
it is never a visible background. Preserve the model, roses, cocktail, record
and cream field in the supplied artwork. The user subsequently requested the
entire **T** in **SOFT** remain visible. The title now paints in full in front of
the supplied photo; there is no subject cutout masking any part of the word.

Status: registered, editable and visually verified in both formats, including
the actual PNG exports and saved/reopened edits. Soft Life is the 65th gallery
recipe. The existing 64 gallery entries remain identical after rebuilding.
Acceptance follows [template-editor-acceptance.md](template-editor-acceptance.md).

- Recipe ID: `soft-life`; gallery ID: `recipe_soft_life`; name: Soft Life.
- Themes: Elegant and R&B / Lounge.
- The supplied photograph includes the model; no uploaded portrait is required.
- Square background: `public/generated-flyers/assets/soft-life-Sq.jpg`.
- Story background: `public/generated-flyers/assets/soft-life-St.jpg`.
- Authoring source: `public/generated-flyers/soft-life-master.html`.
- Build adapter: `scripts/build-soft-life-master.mjs`.
- Portable Square/Story project: `public/generated-flyers/soft-life.nflyer`.
- Initial session cache: `lib/template-data/soft-life-v1.json`.
- Final editor preview destinations:
  `public/generated-flyers/soft-life-{square,story}-preview.png`.

SOFT uses editable live serif type with an image texture clipped inside the
letters. The current authoring faces are Avigea for the large serif and Northwell
for Life and the handwritten accents, with LEMONMILK for support copy. The
crimson material is `public/generated-flyers/assets/soft-life-crimson-material-v2.png`:
deep ruby shadows, fine foil grain, faceted red reflections and narrow specular
glints. It was generated with the built-in image tool from the target's letter
finish. The exact prompt and original tool output are recorded in
[soft-life-crimson-material-generation.md](soft-life-crimson-material-generation.md).
No new photograph is generated for either format.

Each format has 24 independent editable text owners. The original title is
SOFT / Life, with no connector; replacement event names must preserve its two
word slots and saved sizes. The date parts, DJs, venue, address and labels all
keep their own bindings. The Event Details label is explicitly authored but
initially empty.

The DJ Lineup panel is enabled, with the legacy combined DJ text empty. This
keeps font and style controls available for the two independent DJ owners.
Earlier construction had disabled the panel, which also disabled those controls;
that template setting was corrected before final browser verification.

| Canvas owners | Coco form meaning |
| --- | --- |
| `headline`, `subtitle` | Two-part event name; no separate subtitle question |
| `presenter` | Presenter name |
| `day`, `month`, `date` | Date, preserving the separate weekday/month/day arrangement |
| `time` | Start time / hours |
| `genres` | Music policy |
| `dj1`, `dj2` | Two separate DJ owners |
| `experience` | Event experience |
| `entry` | Free-entry conditions |
| `dress` | Dress code |
| `venue`, `address` | Separate venue and address |
| `djLabel`, `dressLabel` | Bound labels that follow the corresponding fact |
| `presents`, `tagline`, `motto`, `badgeTitle`, `badgeCaption`, `signoff` | Authored decorative copy, editable on the canvas |
| `detailsLabel` | Initially empty editable Event Details label |

The recipe is integrated through `lib/recipes/softLife.ts`,
`lib/visualRecipes.ts`, `lib/coco/portableRecipeRuntime.ts`,
`lib/coco/recipeCatalog.ts`, `components/coco/artDirections/library.ts`,
`components/coco/artDirections/recipePreviewExports.ts` and
`lib/coco/formObjectContracts.ts`. The generated gallery bundle is updated by
`scripts/build-registered-recipe-templates.mjs` after final artwork acceptance;
do not regenerate it while typography is still being revised.

Compile the initial construction source with:

```bash
node --experimental-strip-types scripts/build-soft-life-master.mjs
```

The adapter refuses to overwrite a future accepted user save guarded by
`lib/template-data/soft-life-saved-source.json`. Preserve future user saves over
this construction source, and preserve all other accepted recipe masters.

Verification tools:

- `scripts/render-soft-life-study.mjs` captures the source HTML in both formats
  under `/tmp/soft-life/css-{square,story}.png`; `NF_OUTPUT_DIR` changes that
  location. These are authoring studies, not editor/export acceptance evidence.
- `scripts/verify-soft-life.mjs` imports the portable master into an isolated
  guest context and checks actual text selections and edits, sibling
  preservation, labels, per-format title shadows, save/reopen and actual PNG
  exports. The default evidence directory is `/tmp/soft-life`; use
  `NF_SOFT_LIFE_AUDIT_DIR` to separate final evidence from studies.
  `NF_SOFT_LIFE_IMPORT` selects a disposable saved project.
- `NF_SOFT_LIFE_EXPORT_ACCESS_FIXTURE=1` supplies isolated local
  `/api/auth/starter-render` responses for the real PNG renderer. This fixture
  does not verify entitlement or quota enforcement and does not alter product
  access policy.
- `NF_SOFT_LIFE_CONTROLS_CHECK=0` and `NF_SOFT_LIFE_EXPORT_CHECK=0` are for focused
  artwork iteration only. `NF_SOFT_LIFE_FORMATS=square` or `story` limits that
  iteration to one format. Final acceptance needs both formats and full checks.
- `NF_SOFT_LIFE_PUBLISH_PREVIEWS=1` writes the original editor captures to the
  public preview paths. Use only with the unedited final template.
- `tests/coco-soft-life.test.ts` covers registration, theme/portrait eligibility,
  two-word matching, backgrounds, all text bindings, semantic form destinations,
  document preservation and bound-label clear/repopulate.
- `scripts/verify-soft-life-controls.mjs` exercises an independent DJ companion's
  alignment, font, size, color, leading, rotation and position through the real
  UI, then compares rendered styles and active controls after save/reopen. Set
  `NF_SOFT_LIFE_CONTROLS_DIR` to an output directory separate from other runs.
- `scripts/verify-soft-life-discovery.mjs` checks Soft Life / Elegant through
  both personalized chooser previews to the details form. Default evidence is
  `/tmp/soft-life-discovery/`.

Completed checks during integration:

- The final adapter compiles 30 objects per format (24 text owners), with zero
  approximations, unsupported objects or compile warnings. The generic recipe
  audit passes; its 29-object count precedes the adapter's explicit empty label.
- Both original native-editor renders have been opened and inspected. The
  complete SOFT title is visible and the permanent public texture loads inside
  the live letters in both formats.
- Both original 4× PNG exports were rendered and opened for visual review:
  `/tmp/soft-life-complete/export-original-square.png` (2160×2160) and
  `/tmp/soft-life-complete/export-original-story.png` (2160×3840). The full
  headline and material survive the actual export. The local quota fixture was
  enabled. Final gallery captures have square corners in both formats.
- The companion control run passed in both formats: DJ ELEVATE changes preserve
  every sibling, active indicators match the rendered styles, format switches
  retain independent values, and save/reload/reopen reproduces them. Both
  reopened renders were inspected. Final evidence is archived in
  `/tmp/soft-life-typography/`; its results contain zero browser errors.
- All 46 visible wording edits/restores and eight label clear/retype checks
  passed with sibling preservation. The originally empty Details label appears
  and can be selected. Square-on / Story-off headline and subtitle shadows
  survive format switching and save/reopen. Edited venue names remain CLUB NOVA
  and CLUB EMBER respectively, with SOUNDS BY and DETAILS labels.
- Edited and reopened artwork plus both actual edited PNG exports were opened
  and inspected. Evidence: `/tmp/soft-life-text-roundtrip/`, including
  `roundtrip.nflyer`, `results.json` and `export-reopened-{square,story}.png`.
  No browser page errors occurred. The unedited public master was preserved.
- Soft Life / Elegant passes the actual Coco chooser through both personalized
  previews to details; both previews were inspected. No captured browser or
  direction-build errors. The supplied photo is used without a portrait upload.
- Final new-template, gallery and provenance run passes all 13 tests. Direct
  before/after comparison verifies all existing 64 gallery records are unchanged.
  These test counts overlap the earlier integration run and must not be added.
- All five Soft Life tests pass. The combined Soft Life, Grills & Groove and
  recipe-choice run passes all 22 tests; these counts overlap.
- All 65 visual recipe, catalog, portable loader and direction identities agree.
  Both Soft Life sessions resolve to current, materialized recipe provenance,
  and their compiled image paths exist.
- ESLint passes for the new recipe/test and all changed integration files.
- A separate provenance/portable run passes 14 of 19 tests. All five provenance
  tests pass. The portable suite retains stale expectations for its hard-coded
  10-recipe URL list, old Neon Night Shift/Glow/Punta Cana field counts, and
  City Nights Story geometry. Those existing templates and tests were not
  changed by the Soft Life integration.

Verification harness navigation was updated to select explicit 4× export size,
return to Design before editing and dismiss the normal startup chooser after a
reload. These were verifier corrections; product navigation and entitlement
policy were not changed. Final edited evidence and companion-style evidence are
in separate directories. No shared renderer change, commit or deployment was
needed. The local development server remains on port 3000.
