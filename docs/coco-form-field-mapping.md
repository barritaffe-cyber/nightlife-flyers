# Create with Coco: event facts → recipe → editor

The new Create with Coco flow uses `fieldMappingVersion: 1`. Each materialized
Square/Story variant persists `cocoFormMappingVersion`, `cocoEventBrief`,
`cocoEventName`, and `cocoFormMappingReport`. Existing saved designs and direct
recipe imports keep their previous behavior until created through this flow.

## One form contract

`lib/coco/eventBriefFields.ts` defines the text fields, labels and optional arrays.
`components/coco/CocoEventBriefFields.tsx` renders that same contract in both the
guided details step and Quick Edit. The editor reads the saved brief, not formatted
canvas text. Changes rematerialize both formats with their own authored layouts.

Prices, currencies, decimal separators, free-entry wording, contacts, addresses,
line breaks and age wording remain user text. Dates retain the original draft;
calendar objects use the appropriate day/month/weekday/year display. Start and
end times remain separate editable facts. A multi-slot DJ layout retains the
remaining acts in the final slot instead of discarding excess names.

## Authored text owners

Reviewed exceptions live in `lib/coco/formObjectContracts.ts`: an object can
override its historical role, question label, guidance, or group. These contracts
must target actual saved text objects. Never infer a question solely from a
generic ID such as `details`, `genres`, or `footer`. Complete admission-price
copy can map to entry price; combined entry/service text needs its own question.
Bound headings name their actual text owner so they appear with the right answer.

Space Neon's Special Guest heading is automatic canvas copy. The guest name and
promoter name are form questions. Existing Presents wording remains on the
canvas without its own form question; do not add it if absent. Headings remain
editable in the editor. Its entry price, social/website line, and four-line DJ
lineup have independent questions.

## Editor text additions and labels

`withCompiledEditorText` in `compiledTextSelection.ts` supplies empty editor
companions for missing DJ/details labels and venue/address fields when the
other part of that panel already exists. An address must not suppress a newly
typed venue name; a lineup must not suppress its label. These companions do
not enter the recipe form or alter the authored document. They use current
object positions and independent style controls, appear only after an explicit
editor text override, and render through the same canvas/preview/export path.
Legacy placeholder values must never make them appear on untouched designs.

Panel controls resolve each field to its own object, including when a sibling
is selected. `cocoCompiledTextEdit` marks explicit text edits with
`cocoEditorText`; automatic headings retain those edits across later form
materialization. Normal form answers still update their intended text owners.

Venue name size/color and address size/color resolve their own objects even
when a sibling is selected, including editor companions. Label background
controls persist `backgroundColor` with the label's compiled override; the
shared renderer paints it in canvas, preview, and export. Test these controls
with real input, then verify saved overrides and visually inspect both PNGs.
Wait for the new artboard dimensions after switching formats before typing.

`lib/coco/formRecipeMapping.ts` maps facts using each compiled object's meaning.
Historical field names alone are insufficient: `details` is genres in some
recipes, hosts in others, and an offer in others. Reggae's object named `year`
actually displays the month. Both binding values and per-object text overrides
are updated, retaining authored placement/paint and explicit Fine Tune overrides.
Rush Night uses its legacy native text slots through an explicit adapter.

New generations clear unused sample text and labels, including native slots
outside the compiled document. Blank edits cannot resurrect a master's venue,
contact, date or promotion. The cached recipe is never mutated.

New guided builds persist an explicit `theme` in the brief and preserve authored
font sizes, families, styling and multiline title structure. Native size controls
are synchronized to compiled typography so stale controls cannot enlarge a preview.
Explicit Fine Tune overrides remain authoritative. Legacy briefs without a theme
retain their previous conservative fitting behavior. New forms limit copy to the
selected design’s capacity instead of shrinking it automatically.
Supporting facts prefer wider information areas over narrow decorative mottos.

## Guided build; only supported fields

The user rejected the generic details panel and requested that Coco never ask
for details it cannot fulfill. Startup begins with "Let us begin": event name,
and a required theme. There is no automatic theme or description question. Next
asks about a portrait and background.
Users explicitly choose portrait Yes/No and can upload or use the library.
Backgrounds are optional; no selection preserves each design's authored scene.

Coco then offers up to five matching directions. The user explicitly chose to
show fewer matches instead of filling the list with unsuitable designs. Theme,
portrait eligibility and authored headline word count must match in both formats.
Event-name keywords rank the eligible set. Actual loaded-font measurements reject
titles that would exceed the original available width at the authored size. Choosing one opens `CocoBuildDetails`
BEFORE the canvas: only dedicated authored text slots supported in BOTH Square
and Story are offered. Next validates and materializes the details into both
formats, then loads the editor. Back to the directions preserves entered details.
Quick Edit continues using the same supported-field contract after completion.

`cocoRecipeFormCapabilities` derives the intersection of fields and conservative
character/line limits from the loaded authored objects. It does not expose every
possible offer/contact/entertainment field through a shared catch-all slot. Empty
groups are hidden. QR fields require a reserved, nonremoved authored QR area.
`cocoFormQrWasRemoved` distinguishes a removed authored QR from hiding sample
artwork during binding, so fields remain stable after edits.

`completeRecipeDetails.ts` no longer inserts a panel, relocates facts or reflows
titles. It only places QR utilities in authored/vacant space. New themed builds
preserve font, paint, size and box geometry. Single-field slots do not gain generic field-name prefixes.

Old briefs remain saved with missing-field warnings; they are not silently
cleared. Quick Edit detects the old automatic panel and rebinds both formats,
removing generated panel objects and restoring recorded authored title layout.
Five-choice generation still validates actual submitted facts; new startup no
longer collects an oversized brief before template selection.

The subject-free pool is now eight visually audited recipes: Summer Sunset,
Eaden, Brunch Saturday, Brunch Vibes, Dodge Night Rides, City Nights, Mojito Monday
and Yacht Escape. The last two reuse existing registered masters. Ranking uses
both formats' capacity, then favors different palettes, alignments and typography.
Subject eligibility remains a hard boundary, including downloaded recipe content.
Portrait requests require an actual replaceable asset in both formats; a model
baked into the scene does not qualify. Black Gold Party, Baddies N Bundles,
Reggae Jams, RNB Thursdays, Space Neon and Elite Monday currently provide both
portrait replacement and usable guided forms. Directions without supported form
fields are rejected and replaced before being offered.

## Less form work and direct editing

Creative direction is optional. Style buttons offer Let Coco choose, Elegant,
Neon, Tropical and Urban. Blank style notes use the event name and image to inform style inference. The chooser can display Square + Story together, or each
format at a larger size. Guided choices now render the materialized event name
and selected images through the same compiled object renderer as the editor.
Masks, PNG glyph families, shadows, textures, transforms and layer order remain
authoritative. Each composition renders at native editor size and scales as a
whole, with fonts/images loaded before display. SVG IDs are isolated per preview.
Preview rendering does not mutate the editor session. The former simplified
preview builder has been removed from this flow; static authored exports remain
available to other callers without a personalized variant.

The UI calls them directions; the recipe system stays behind the scenes. Choosing
one opens "Let's add the finishing details" before the editor opens. A background
is optional; leaving it blank preserves the scene, while an uploaded or selected
background is shown in all personalized choices.

Text overrides record `cocoFormFields`. Clicking a compiled text owner in Quick
Edit opens the relevant accordion and focuses its corresponding form field.
QR labels retain this mapping. Edits rebind both formats and synchronize their live asset stacks.

## QR codes and selected features

`qrCode.ts` uses qrcode-generator locally, with UTF-8, medium error correction,
an opaque white background and a four-module quiet zone. An explicit QR link
wins; otherwise a ticket link or an HTTP(S) RSVP link supplies the destination.
The form displays a QR preview and validates malformed links before generation.
Codes are editable SVG image assets named `coco-form-qr`; the label is a separate
text owner. Editing the link regenerates the code, while manual placement/scale
survive. Clearing all source links removes generated QR artwork. Existing uploaded
QR assets are retained. The legacy native `qrEnabled` remains independent.

A saved QR label without any source link or uploaded native QR is inactive:
it stays in the brief but is excluded from missing-field reports and ranking
costs. It must never prevent Coco from producing five choices. Adding a link
activates the caption; clearing all links removes it along with generated QR
artwork. Invalid links still produce validation errors. Repeated candidate failure
messages are deduplicated, with each distinct cause retained.

The unrestricted experience-feature form is no longer offered. Existing saved
feature selections remain in the brief. Social icon controls require a supported
social handle slot in the selected template.

## Social icons

`lib/coco/socialRecipeAssets.ts` materializes selected Instagram, TikTok, X and
WhatsApp marks as separate editable SVG assets after text binding. It uses the
existing Library artwork in `socialGraphics.ts`, preserving a recolorable SVG
template. Compiled recipes get one image owner per icon; native Rush uses the
existing portrait stack. Both asset keys and the live editor stack stay in sync.

The handle sits below the icon group. Groups in the left third use left alignment,
groups in the middle third use center alignment, and groups in the right third
use right alignment. The handle follows icon movement and resizing. Existing text
owners are reused; where none exists, a compact group is added in an available
footer band, avoiding visible text where possible. The handle
uses the exact supplied text; icons can also appear without a handle. No selected
platforms means no generated icons. Authored sample social strips are hidden so
unselected platforms do not appear. Unsupported saved platform values remain
explicitly reported as unplaced.

IDs are stable across edits. Automatic rows reflow when membership changes;
manual icon movement, size, colour and rotation are preserved. Hydration retains
social metadata, and legacy generic layout passes do not reposition form-owned
icons. Recipe masters and unrelated manually inserted artwork are preserved.
Social handles are visual text; these icons do not create clickable links in PNGs.

## Verification

- `node --test tests/coco-form-recipe-mapping.test.ts`: 130 passing checks,
  including both formats of all 61 registered recipes, exact fact retention,
  clearing, immutable masters, multiple contacts, prices, date parts and fitting.
- `node --test tests/coco-social-recipe-assets.test.ts tests/coco-social-icon-controls.test.ts`:
  seven passing checks, including all 61 recipes in both formats, clearing/toggling,
  aliases, immutable masters, preservation of manually styled assets, and all
  three handle alignments for compiled and native recipes in both formats.
- `node scripts/verify-coco-form-mapping.mjs`: real local browser flow with stubbed
  copy/style responses. Checks 17 entered facts, editor values, immediate icon toggles, square SVG
  proportions, handles below the icons with matching side alignment, edits across both formats, and saving/reopening
  `.nflyer` drafts with editable icon metadata. Also verifies that a Fine Tune
  drag survives adding/removing a platform in Quick Edit. Artifacts are under `/tmp/coco-form-*`.
  It does not test or bypass gated PNG export.
- Focused ESLint passes. Full TypeScript checking still reports unrelated existing
  errors in `ladiesCssEditorialAssets.ts` and archived `recipe-file-backups` files;
  none are reported in the changed form/mapping files.
- Older portable-runtime/quick-edit suites have six failing expectations involving
  registry/master revisions and prior renderer source patterns. Those historical
  assertions were not rewritten as part of the new form contract.

No commit or deployment was performed. Preserve the user's other workspace edits.

- Seamless-flow suite: 160 checks pass across mapping, socials, QR decoding,
  subject authority, recipe eligibility and art-direction contracts. Six new
  behavior tests in `tests/coco-seamless-flow.test.ts` cover actual decoded links,
  all eight subject-free recipes, preserved edits, clearing and capacity errors.
- `node scripts/verify-coco-seamless.mjs` passed with mocked copy/style APIs:
  blank description, style selection, five complete choices, larger format
  comparisons, canvas-to-field focus, QR decoding from both real canvases,
  feature toggles, manual social position, link changes and save/reopen.
  It checks editing and local QR rendering; it does not bypass the paid export
  gate or claim a verified 4K flyer export.

## Headline structure and theme matching

`recipeCompatibility.ts` owns explicit theme eligibility and title assignment.
A two-word name cannot select one-word artwork. Event-name slots are excluded
from subtitle fields, so supporting copy cannot overwrite the second title word.
Known structures include Summer’s split single word, Eaden’s single title, Elite’s
separate DJ slot, Space Neon’s reading order and Baddies/Glow connector words.
`rankCocoMatchingDirections` ranks all eligible recipes; it never appends unrelated
recipes to reach five. Empty results explain how to change the theme or event name.

## Visual-fidelity contract (2026-09-15)

Results should retain at least 9/10 visual similarity after expected copy/image
changes. The shared mapper preserves source casing, styled calendar stacks,
time prefixes and zero-padded date displays. Source text-run typography remains
authoritative; raw form values are saved separately. Previews apply the same
Master Grade formula and film curves as the editor.

A deliberately removed supporting brush/banner disables its dependent form
slot. An empty slot hides its supporting artwork with `cocoFormBackdropHidden`,
which can be restored on later input without undoing author removals. These rules
apply across registered recipes. Never repair positions globally from approximate
bounding boxes; valid overlaps and saved compositions must remain intact.

See [the side-by-side audit](qa/coco-form-canvas-comparison.html). Structural
checks cover 61 recipes in two formats; full browser visual review currently
covers City Nights and Reggae Jams. Pixel comparisons isolate unchanged areas
and complement visual inspection rather than replacing it.
