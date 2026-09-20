# Brunch Saturday — handoff, 2026-09-06

## Current task and outcome

The user first asked to locate the latest CSS flyer and the existing CSS-to-Coco compiler, then requested: “convert bruch saturday to coco.” The conversion was delivered. The latest request is to save handoff context. There is no pending request to redesign, register, publish, or deploy the flyer.

The IDE still showed `grey-rave-reference-master.html`, but the requested conversion was **Brunch Saturday**, not Grey Rave or Brunch Vibes.

Delivered file: `public/generated-flyers/brunch-saturday.nflyer` (about 15 MB). Open through **Project → Load Project File** in Coco. It contains Square and Story sessions, 22 compiled objects per format, and 16 editable text bindings. The QR is a replaceable placeholder, not a working ticket code.

## Authoritative inputs and outputs

- Original source, preserved: `public/generated-flyers/brunch-saturday-master.html` (1000 × 1000).
- Prepared compiler input: `public/generated-flyers/brunch-saturday-coco-master.html` (generated; edit the original or build script rather than treating this as a separate approved design).
- Output: `public/generated-flyers/brunch-saturday.nflyer`.
- Reproducible build: `scripts/build-brunch-saturday-master.mjs`.
- Browser verification: `scripts/verify-brunch-saturday-import.mjs`.
- Short conversion documentation: `docs/brunch-saturday-conversion.md`.
- Source screenshot: `public/generated-flyers/brunch-saturday-css-preview.png`.
- Source artwork: `public/generated-flyers/assets/brunch-saturday-scene.png`, `brunch-saturday-foreground.png`, and `brunch-saturday-gold-texture.svg`.
- Generated transparent layers: `public/generated-flyers/assets/brunch-saturday-coco-{cocktail-foreground,kiwi-foreground,orange-foreground,qr-placeholder}.png`.

**Brunch Vibes is a different flyer.** Preserve its user-edited `public/generated-flyers/brunch-vibes-compiled-portrait-updated.nflyer`. Do not overwrite it or substitute it for Saturday.

## Build process

```bash
node scripts/build-brunch-saturday-master.mjs
```

The build starts a temporary loopback static server and Chromium, renders the existing CSS masks into separate transparent foreground layers, makes a conversion HTML with stable asset URLs, then calls `compileCssMaster`. It embeds image assets as WebP data URLs and the headline texture as SVG data so extracted URLs do not depend on the compiler's temporary server. Event text remains editable; the flyer is not flattened into one image.

Square retains the source composition. `editorTextScale: 540 / 1000` reconciles CSS pixels with the editor artboard. Story centers the full square composition in a 9:16 canvas with background space above and below; it is an explicit fit, not a redesigned vertical layout. The adapter uses a 1000 × 1778 Story canvas (integer dimensions are required for the extractor viewport).

Use this specific build script. The generic `npm run coco:compile-recipe -- brunch-saturday` can load the adapter but **does not perform layer preparation or final asset embedding**, and would overwrite the packaged output with a less portable build.

Shared compiler modules:

- `scripts/lib/coco-css-master-compiler.mjs`: orchestration and validation.
- `scripts/lib/coco-css-browser-extractor.mjs`: rendered geometry/style extraction.
- `scripts/lib/coco-semantic-binder.mjs`: role and font mappings.
- `scripts/lib/coco-materializer.mjs`: editable state and portable project assembly.

No shared compiler module was edited in this conversion. The new adapter recipe is inline in the build script; it was not added to the public recipe chooser/registry.

## Narrow changes to app/page.tsx

The existing worktree already contained a very large ongoing implementation. Do not attribute the full diff to this task or reset unrelated changes. Locate these additions by their identifiers/comments:

1. `cocoCompiledDocument` type now includes optional canvas dimensions.
2. `compiledTextTextureImage` handles URL-based text textures through native CSS background clipping. Previously URL textures entered the SVG gradient branch, produced no gradient stops, and made BRUNCH disappear. Texture tile pixel sizes are scaled by `540 / sourceCanvas.width`. The authored filter remains active. Solid color changes can replace the visible texture fill; full texture control behavior was not exercised in this session.
3. `rawCompiledFamily` and the styled-run font-family assignment quote family names containing parentheses. This fixes `Dear Script (Demo_Font)` being rejected as invalid unquoted CSS and falling back to a sans-serif font.
4. `restoreCocoSupportFont` skips generic font sanitization when `hasCocoCompiledCanvas(data)` is true.
5. The support-font sanitization effect near the comment “Imported CSS owns its font choices as well as its geometry” returns early for a compiled session. Without this, Arial presenter/body text changed to Bebas Neue after import, despite the initial import guard.

Fonts: Anton for BRUNCH, Dear Script (Demo_Font) for Saturday, Arial for supporting copy. Fonts are supplied by the application, not embedded in the project.

## Verification and evidence

```bash
# App must be running; verification defaults to port 3001.
node scripts/verify-brunch-saturday-import.mjs
# Override if needed:
NF_VERIFY_URL='http://localhost:3000/?guest=1' node scripts/verify-brunch-saturday-import.mjs

node --test tests/coco-compiled-shadow-controls.test.ts tests/coco-compiled-text-runs.test.ts tests/coco-compiled-import-authority.test.ts
```

Final browser run passed with no page errors. It imported the exact packaged file into an isolated guest browser, inspected Square and Story, switched back to Square, and opened Headline controls. Assertions confirmed Arial for presenter/body and Dear Script for Saturday in both formats. Both final screenshots were visually inspected.

Evidence under `/private/tmp/brunch-saturday-verification/`:

- `square.png`, `story.png`: final successful editor renders.
- `square.json`, `story.json`: object geometry and computed font details.
- `failure.png`: **stale evidence from an earlier failed run**, not the final result.

Structural checks passed: 22 objects and 16 editable bindings in each session, no compiler warnings, matching compiler IR/composition documents, and embedded image sources. All 14 tests in the three commands above passed. Test output: `/private/tmp/brunch-saturday-tests.txt`.

Repository-wide `npx tsc --noEmit --incremental false` still fails on pre-existing issues in other files, including the Emoji type in `components/coco/ladiesCssEditorialAssets.ts` and several tests. The last recorded check reported no `app/page.tsx` errors; it preceded the final simple support-font-effect guard. Details: `/private/tmp/brunch-saturday-types.txt`.

## Verification pitfalls and remaining limits

- The editor displays a transient loading canvas during format switching. Waiting only for a headline selector can capture the previous format; waiting for text can still race with the preloader. The final verification waits for `[aria-label="Preparing flyer canvas"]` to disappear and then settles before screenshots.
- Wait for the starter template to settle before importing; importing immediately after opening it can race with startup work.
- Earlier large embedding produced a 70 MB file. The current WebP packaging reduced it to about 15 MB. Do not restore the bloated intermediate file.
- Preview screenshots include editor lock badges. They are not clean export artifacts.
- No claim of pixel-perfect equivalence: slight native text baseline/inline currency differences remain visible against the original CSS. This session did not perform quantitative pixel comparison.
- All 16 text objects have editable bindings. The final browser test opened Headline controls but did **not** change/save/reload every text field, test texture color/shadow controls, or run clean export verification. Do not describe those as tested.
- No user visual approval of the converted design was obtained; it was delivered for use. No publication/deployment/recipe promotion happened.

## Environment and continuation

Workspace: `/Users/thepartyrocker/nightlife-flyers`. The worktree has many existing modified/untracked files. Use narrow patches; do not clean, reset, mass-format, or commit unrelated work.

This session started `npm run dev`; port 3000 was already occupied, so Next used **3001**. Recheck live server state rather than starting another server based on historical port notes. The in-app browser execution tool was unavailable in this tool set, so local Playwright scripts were used. Compiler/browser commands needed sandbox escalation for loopback listening/Chromium, and were approved through automatic review.

Read `docs/css-to-coco-fidelity.md` before further conversion work. If the user requests refinement, start from the delivered Saturday project and the original Saturday CSS, preserve any subsequent user-edited save, and address the specific reported difference. Do not restart an unrelated Brunch Vibes conversion.

## Follow-up: existing desktop UI mappings (supersedes the rejected popup)

The user explicitly rejected the desktop floating inspector added in the first selection fix. **Desktop text must map into the established sidebar UI. Do not add another desktop text editor.** Mobile retains its existing floating controls.

`lib/coco/compiledTextSelection.ts` routes date parts to Date & Time, time fragments to Time, presenter labels to Presenter, offer prices/copy to Entry Price/Label, and addresses to Venue/Address. This follows the semantic fields in the saved Brunch Vibes project. `app/page.tsx` projects each selected fragment's values into those existing controls while storing edits by object ID in `compiledObjectOverrides`; sibling fields retain their values. Paired offer descriptions support line breaks in the existing Label field. The dedicated Saturday build adapter now persists these mappings on future builds. Existing saved files work without a rebuild and were not overwritten.

The desktop portal, desktop-only floating inspector styling, and callback enabling it were removed. The floating text UI is explicitly gated by `isMobileView`. There is no new desktop panel.

Validation: `scripts/verify-brunch-saturday-selection.mjs` imported the delivered project on port 3000, selected all 16 objects, confirmed their text in the existing left sidebar, edited/restored all custom fields and address, and asserted that no floating text editor exists. Final full run passed with no page errors. The saved user-edited Brunch Vibes project was inspected read-only and all its text objects also have established-panel routes. Eighteen mapping/import/text-run/shadow regression tests passed. Existing unrelated repository TypeScript failures remain; no `app/page.tsx` errors were reported in the checked version. A subsequent narrow Venue projection adjustment clears a stale starter venue name when the compiled document has no venue object and binds the existing Address Size/Color controls to saved address overrides.

Evidence: `/private/tmp/brunch-saturday-verification/selection.png`; test logs `/private/tmp/sidebar-map-tests.txt`; type log `/private/tmp/sidebar-map-types.txt`. `NF_SELECTION_IDS` can limit the browser verifier to specified comma-separated object IDs. Browser testing here covered desktop Square; do not describe Story/mobile or save/reload of every field as tested by this follow-up.

The final targeted Address sidebar rerun also passed after the narrow Venue projection adjustment, and its screenshot was visually checked. The final type check reported no `app/page.tsx` errors (unrelated repository errors remain).

## Follow-up: maximum update depth

Moved `CocoCanvasCandidateDebug` and its candidate helpers out of `Page` to module scope. Parent commits now preserve the component identity, font readiness, and composition/critique guards instead of remounting them. Compiled CSS ownership blocks both generic candidate scheduling and delayed composition commits. No saved flyer was rebuilt.

Validation: 20 focused tests passed, including component-scope and compiled-ownership guards. The desktop browser verifier selected all 16 Saturday text objects and edited/restored custom fields with no page errors or React update-depth console warnings; no desktop popup appeared. TypeScript reported no `app/page.tsx` errors, with unrelated repository failures remaining. Logs: `/private/tmp/coco-loop-browser.txt`, `/private/tmp/coco-loop-tests.txt`, `/private/tmp/coco-loop-types.txt`.

## Follow-up: textured headline shadow

The CSS URL-texture path skipped the solid-glyph and SVG shadow renderers. Its visible background-clipped text spans now receive `liveHeadlineGlyphFilter`, preserving the continuous texture placement. `scripts/verify-brunch-saturday-shadow.mjs` verifies the existing sidebar Shadow toggle on/off, unchanged texture and dimensions, no desktop popup, and no page errors/render-loop warnings. Browser check and 10 focused shadow/text-run tests passed; on/off screenshots in `/private/tmp/brunch-saturday-verification/texture-shadow-{on,off}.png` were visually inspected.

### Correction: shadow must be per glyph

User requires per-glyph shadows. The whole-texture filter above is superseded. `TexturedGlyphShadowText` paints a separate shadow mask for each non-whitespace character, retaining the full line for placement, then paints the continuous texture once above the shadows. The texture itself has no drop-shadow filter. The browser verifier passed with six individually filtered BRUNCH masks, exactly one visible glyph per mask, working sidebar toggle, and unchanged texture/dimensions. Ten focused tests passed; no errors in changed files during typecheck (existing unrelated repository errors remain).

### Superseding correction: match Brunch Vibes paint order

Separate shadow masks beneath one full-word texture were insufficient: the full-word repaint concealed shadows cast across neighboring letters. `TexturedGlyphShadowText` now paints each textured glyph with its own filter in DOM order, matching the gradient headline compositing order. Texture offsets align each glyph back to the word origin. The browser verifier now requires each of six visible glyphs to own both its texture and shadow, and rejects any separate whole-word texture repaint. Browser check and 10 focused tests passed; screenshot inspected. No changed-file TypeScript errors; unrelated repository failures remain.

### Spacing correction

Negative CSS letter-spacing shrank each textured glyph paint box and clipped its right edge. Textured glyphs now use zero internal letter-spacing and an external margin for the requested tracking. Texture alignment refreshes when tracking or glyph dimensions change. Browser verification exercised -0.08 and +0.08 through the existing Spacing field, checked unchanged glyph paint widths and changed advances, and retained all shadow toggle checks. Negative-spacing screenshot visually inspected. Ten focused tests passed; no changed-file TypeScript errors (unrelated repository errors remain).

## Registered recipes from accepted saved projects

User requested updating and registering both Brunch recipes. The active portable registry now loads these accepted editor saves directly:

- `brunch-saturday`: `public/generated-flyers/brunch-saturday-updated.nflyer` (version 1).
- `brunch-vibes`: `public/generated-flyers/brunch-vibes-compiled-portrait-updated.nflyer` (version 2).

Both saves were preserved without recompiling or replacing them. Recipe metadata modules, authoritative registry, art-direction types/library, Brunch defaults, event-name matching, concept directions, and Square/Story preview entries are registered. The default Brunch choices include both. Earlier statements that these flyers are unregistered are superseded.

The portable materializer has explicit Brunch text handling, retaining saved fields absent from the new brief instead of using the Baddies title rules. Explicit text replacements update the corresponding compiled object override; all saved style overrides and compiled geometry remain intact. Date fragments and Saturday meridiem are mapped independently.

Ten focused registration/authority tests passed. The broader portable suite passed 13 of 14 tests; the unrelated existing City Nights Story geometry assertion still fails. Full TypeScript reports existing unrelated repository errors and no errors in the changed files. `scripts/verify-brunch-recipe-previews.mjs` renders library previews from the actual saved projects, hides editor-only lock buttons, and waits for format preparation before capture. No deployment or publication was performed.

Final preview run completed for both recipes in both formats with no browser errors. The Story loading-screen capture was replaced after adding a format-readiness assertion; the final Saturday Story and both recipe designs were visually inspected. Evidence: `/private/tmp/brunch-preview-verified.txt` and `public/coco-references/recipe-exports/brunch-{saturday,vibes}-{square,story}.png`.

## Selected background precedence

Explicit user-selected backgrounds now replace recipe background fields and compiled/asset-backed background images. The shared helper runs for portable recipes and the common direction path in both formats. Startup distinguishes user selections/uploads from its automatic default; static recipe preview exports are bypassed for a chosen background. The uploaded-photo-to-cutout fallback no longer clears a separately selected background. Recipe masters and unrelated text/subject objects stay intact. Fourteen focused tests passed; browser checks confirmed the selected image on Saturday and Vibes Square/Story, with no page errors. Vibes Story was visually inspected. Full TypeScript still has unrelated repository failures, with no errors in the changed implementation files.

## Story background in Coco live preview — 2026-09-17

The accepted Saturday Story save removes its compiled `background` and uses a
native uploaded bar/palms/table background. Coco's question/review preview now
renders this saved image with the editor's fit, pan, scale, rotation, hue and
blur. Square keeps its compiled background. No saved master was rebuilt.

69 background regression tests pass. `scripts/verify-coco-story-background.mjs`
passed the real desktop question/review/editor flow, matched background source
and geometry between preview and editor, and downloaded both PNGs with zero
page errors. UI and exported images were visually inspected; evidence is in
`/tmp/coco-story-background/`. TypeScript retains existing unrelated errors.
