# Template editor acceptance

Apply these requirements when creating templates, accepting updated `.nflyer`
files, or modifying shared editor behavior. Fix the binding or lifecycle cause,
then keep a regression check; do not rely on repairing only a template preview.

## Required visual review before acceptance

The user explicitly requires a visual render before any template/editor change is
declared verified. Generate and open the actual Square and Story renders and PNG
exports. Inspect full layouts and relevant close-ups for text proportions,
clipping, materials, shadows, effects, image loading, and field placement. Inspect
edited and reopened results too. Automated test passes, DOM/state equality, and
successfully written image files support this review; they cannot replace it.

Retry export verification in the current environment instead of inheriting an
old quota-blocked result. An isolated browser access/quota fixture may be used to
test the real local PNG renderer without consuming account quota. Document the
fixture; it does not verify entitlement or quota enforcement. Keep product
access policy unchanged and never label a JPG file as a verified PNG.

## Preserve the accepted source

- Archive each user-supplied save byte for byte and record its hash and savedAt.
- Promote its actual Square and Story sessions to the gallery. Do not rebuild
  an accepted layout from an older construction HTML or adapter.
- Use supplied clean backgrounds for their intended formats. Keep the finished
  target as a reference, never as a second visible background.

## Editing contract

- Every editable object has a stable identity and its own text binding. Labels,
  body copy, venue, address, and individual DJ objects remain independent.
- Every displayed text field must have a renderable canvas owner, including
  optional labels initially saved as empty. New templates author label objects
  explicitly; the Disco missing-label compatibility helper is for older saves.
- Read and write the same effective object state: saved object override first,
  then changed bound state, then authored fallback. A legacy field update must
  not be silently hidden by an existing override.
- Sidebar controls outside field wrappers must resolve the selected object too.
  Check L/C/R, font, size, color, leading, rotation, and positioning on companion
  objects. Active control indicators must reflect the rendered value.
- Type, clear, and retype each label from both canvas selection and the sidebar.
  Confirm the label renders and body/sibling text remains unchanged.
- Click actual visible glyphs, including text near large decorative headlines.
  Invisible font ascent areas must not intercept another object's selection.

## Format and persistence contract

- Repeat Square → Story → Square with shadows enabled on headline and subtitle.
- Test intentionally different on/off settings per format. Hydrating incoming
  state must not autosave it under the outgoing format key.
- Save and reopen the tested layout. Verify text, labels, alignment, positions,
  effects and per-format values against the state before saving.
- Prefer canonical saved `bodyTracking` over its legacy `detailsTracking` alias
  when restoring details spacing. Verify actual rendered spacing before and
  after a format switch and save/reopen, not only the serialized field.
- Never modify the accepted source file while running a browser regression.

## Fonts and finish

- For reference-based textured lettering, follow the saved
  [texture-preservation process](complex-text-materials.md#default-texture-preservation-process--soft-life-pattern).
  Preserve the image material inside live text, its continuous word coordinates
  and permanent asset URL through edits, format changes, save/reopen and export.
  Inspect the entire word; do not hide required letters with foreground masks.
- Register new font files in the runtime map, font-face declarations, picker
  categories, and relevant font handling sets. Verify actual browser loading.
- Wait for the chosen font before measuring glyphs. Glints anchor to painted
  glyph edges and remeasure after font, text, size, weight, style or spacing edits.
- Verify the glint with serif, script, and heavy display fonts in both formats.
- Specular reflections and edge glow follow the requested reference; do not add
  bevels as a substitute. Keep reflection streaks softly blurred when requested.
- Inspect the rendered result and exported image; a DOM or state assertion alone
  does not establish the quality of lighting, text visibility, or placement.

## Repeatable checks

With the local editor running, run:

```bash
npm run coco:verify-editor
```

Use `NF_BASE_URL` for a different server. `npm run coco:verify-editor -- --list`
lists the suites without launching browsers. The command fails immediately on
a failed suite and covers accepted-file integrity, labels, companion alignment,
label styling, font-aware glints, and per-format shadows using Disco, plus
tracking restoration and project round-trip using Black Tie. Extend the
fixture coverage when fixing another shared behavior; also run the new template's
own selection, editing, round-trip and export checks. Do not infer coverage of
all templates from this one fixture.

Day Party adds shared companion-label ownership and differing Square/Story
tracking after save/reopen. Verify textured titles use permanent public asset
URLs, not a compiler's temporary origin, and remain on one line. Wait for import
and format hydration before evaluating final typography. Regression screenshots
must go to temporary output directories rather than replacing accepted previews.

Browser checks must fail on runtime errors, unhandled rejections, and React
update loops. Exercise initial load, import, edits, format switches and reload.
For `[object Event]`, capture the triggering action and failing resource when
reproducible. Refresh recovery is not proof of a root-cause fix. The September 9
transient report remains unconfirmed; do not suppress global errors or describe
it as fixed. Record unrelated typecheck failures separately from changed-file
errors, and disclose any acceptance checks that remain unverified.
