# PNG headline controls and Quick Edit images

We Outside reproduced the failure through Create with Coco. Form mapping writes
`compiledObjectOverrides[id].size`; that value takes precedence over the native
headline size field. Manual size controls now write both through
`cocoCompiledTitleSizeEdit`, clearing the form-fitting markers so later form
changes keep the user's choice. Both title roles and their shared size bindings
are handled. The form's authored size is the initial value, not a permanent lock.

The shared compiled renderer now applies `textFx.alpha` and `head2Alpha` to their
respective title owners. This includes PNG letters, their shadows, personalized
previews and exports. Texture and glyph rendering are unchanged.

Quick Edit derives portrait availability from the same live assets and predicate
used by replacement. A design with a portrait baked into its scene has no separate
portrait to replace, so the button is disabled and dimmed with an explanation.

Scene replacement opens an independent file picker. It applies
`withCocoRecipeBackground` to both formats, updating the compiled document and
live background assets, while keeping other objects. Scene Builder uses the same
handler. The upload handler retains its input before awaiting, reports failures,
and clears busy state. Upload access restrictions remain unchanged.

## Verification

- `node --test tests/coco-title-size-edit.test.ts`: 3 pass. Covers both formats,
  JSON roundtrip, later guided form edits, and accepting a former auto-fit size
  as a manual choice.
- `node --test tests/coco-recipe-background.test.ts`: 66 pass.
- `node scripts/verify-png-headline-controls.mjs`: passes on localhost:3000.
  It uses an isolated local paid-account fixture and existing artwork as the
  replacement upload; no live account, entitlement or master is modified.
- Browser: Create with Coco / Urban / We Outside; both title roles converted to
  Neon Green PNG; typed sizes, pointer sliders, opacity sliders down to zero;
  both formats; disabled portrait action; scene replacement with text retained;
  saved project import; actual Square and Story PNG downloads. Zero page errors.
- Artifacts: `/tmp/png-quick-edit-fixed/`, including `roundtrip.nflyer`, canvas
  screenshots, and visually inspected `export-square.png` / `export-story.png`.
- Changed small-file ESLint passes. Full TypeScript check retains existing
  errors in assets, backups and other tests, with no errors in changed files.
  Page lint retains the pre-existing renderer display-name error and three
  unused-variable warnings. Existing worktree whitespace warnings are unrelated.

The browser verifier is desktop Chromium; physical mobile behavior was not
separately rechecked for this change. The shared floating size handler uses the
same corrected setter.
