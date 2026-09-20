# Coco conversation

Create with Coco uses an orb-led sequence: event name and mood, recommended
designs, one question at a time with a live preview, adjustments, readiness,
color grading, and Square + Story export. Inputs and response buttons drive
existing deterministic template actions; no language model or chat service is
required. The editor remains an explicit optional action.

The review UI uses a 76px orb (64px on phones), smaller type and quiet rectangular
responses. Coco rotates continuously over 48 seconds and gently hovers over 10
seconds; reduced-motion preferences disable these animations. Programmatically
focused headings have no outline, while interactive controls retain keyboard
focus indicators. Open editor sits directly above Looks good.

Color palette links every compiled object to a background, primary, secondary,
accent or neutral role. The existing canvas Background → Colors controls use
the same linked palette path for compiled templates. Solid copy, fills and
strokes receive their role colors; gradients retain their lighting variation.
PNG lettering keeps its texture and uses a hue shift, without desaturation.

`paletteBindings.ts` samples the main chromatic ranges of each raster image.
Only pixels near those ranges are blended toward their palette colors. Neutral
pixels, unrelated color ranges and alpha stay intact. Hue blending preserves
source luminosity/saturation; the Soft Light option is luminosity corrected to
preserve the original lighting. Image color strength defaults to 30% and can
be adjusted or set to zero. There is no color-foil overlay or scene/material
sepia/grayscale wash. A person baked into a background shares that photo's color
ranges; this is color-range selection, not subject segmentation.

`linkedPalette.ts` prepares images before committing one palette action. Source
assets and compiled masters remain unchanged. Roles, original properties,
processed image outputs and selected settings persist in the composition
system. Preview, canvas and export read those same outputs, including native
uploaded Story backgrounds. Original colors and Undo restore previous colors
without discarding later wording/layout changes. Format scope still controls
current-only versus both. Source checks avoid applying an old palette image to
a newly replaced scene. The original manual background Hue control also reaches
compiled backgrounds; the final global grading step stays independent.

The Coco canvas toolbar offers Add text and, for selected added text, Remove
text. `editorTextObjects.ts` stores independent objects in
`cocoCompositionSystem.editorTextObjects`. `withCompiledEditorText` includes them
in the editor, live preview and export. Selected additions open their own
`CocoAddedTextControls` in both the simple canvas and full editor, rather than
the authored Event Details fields. The section is named **More details**. New
objects start with empty text; “Your text” is an input placeholder, never saved
content. Typing, multiline input and clearing use the normal details edit path.
Untouched prompts in older saves also appear as placeholders in the controls.
In the advanced editor it uses the same
Collapsible, alignment chips, FontPicker, Stepper controls and formatting buttons
as neighbouring text panels. Size, letter spacing, leading, rotation, fill,
uppercase, bold, italic, shadow strength and opacity target the selected added
object. The simple editor keeps its compact controls; mobile exposes appearance
controls under More. `cocoStyleAddedText` stores paint/typography on the added
object and tracking in its own override, so all existing renderers and exports
read the same values. Shadow enablement/strength persist independently.

The closed FontPicker shows only the font name. Inside the menu,
`previewMode="text"` shows the user's wording in each font at a readable size,
with a plain font-name label. Added text uses this in both editor
modes and mobile. The existing categories and local fonts remain in use; Escape
closes the menu and returns focus to the picker. Add text focuses the visible
wording input, and style changes persist immediately during adjustment. Form capabilities ignore them,
so later event answers cannot repurpose their wording. Added objects belong to
the current format and persist in project JSON; removal uses an object override.

`lib/coco/conversation.ts` builds questions from the selected recipe's actual
form capabilities. Unsupported questions are omitted; format-specific fields
retain their labels and routing. A social handle and platform choices share a
question where available; icon-only templates keep their platform question.
Structured lines, character limits, date/year behavior, and QR inputs reuse the
existing field implementation.

Back and Review answers preserve the current brief. Skip deliberately clears the
current answer. A question validates before advancing; finishing validates all
answers, including those reached using Review answers. The initial live preview
uses the existing deferred recipe materialization. After creation, wording and
style changes use the existing session and compiled object overrides.

Live previews also render a saved native background (`bgUploadUrl`/`bgUrl`)
when the compiled background is absent, removed or hidden. This is needed by
Brunch Saturday Story, whose accepted save replaced the original compiled
background. `CocoPreviewBackground` preserves the editor's contain/cover fit,
scale, pan, rotation, hue and blur; the existing preview grade covers the whole
composition. Visible compiled backgrounds, including this template's Square,
keep their original rendering. Saved masters are not modified.

The question action row reads Back → Skip → Continue (or Create my flyer).
Taglines are explicitly named and explained with an example. Single-box genre
fields explain that users should include `•` or `|` separators; split genre
fields ask for one genre per box.

Square social rows keep a stable outside edge and grow inward: left rows grow
right, right rows grow left, and centered rows keep their center. Story social
rows use a centered bottom treatment, with the handle centered beneath the
icons (or alone at the bottom). Story clears old inline anchors while retaining
authored icon sizes and deliberate icon moves. The footer reserves the handle’s
height and prefers nudging neighbouring copy upward. Alignment remains stable
when platform counts change, including zero icons.

`contentAwareLayout.ts` checks compiled foreground content during form
materialization and Quick Edit resizing. Expanding social rows or text can nudge
nearby copy and small decorations, propagate through a column, or use a nearby
vacant band when a pinned object blocks a move. In Afro Sunset, the footer rule
and slogan move together to make room for all six platforms. Both formats use
their own geometry and save the resulting offsets for preview/editor/export.

Automatic offsets and reference geometry live in
`cocoCompositionSystem.cocoContentLayout`. Recalculation restores only offsets
that still match the last automatic placement, so shrinking content restores
space without accumulating drift. Dragging or locking an automatically moved
object pins it. User paint, wording, master bounds and manually placed icons
remain authoritative. Quick Edit Undo includes spacing and synchronizes the
runtime asset arrays as well as saved sessions. Unchanged blur commits do not
create duplicate size-history entries; one Undo restores the typed adjustment.

This is bounded foreground reflow, using saved boxes, explicit font-size changes
and line counts. Full scenes/portraits and existing intentional intersections
are excluded. It is not a pixel-level collision solver for every font effect,
rotation, arbitrary drag, or overfilled layout; manual canvas placement remains
available when no nearby space fits.

The conversation offers headline, details, photos, and completion responses.
Sizes and supported solid colors reuse guided Quick Edit's explicit format scope
and property-scoped Undo. Textured and PNG lettering retain their materials.
Portrait replacement is offered only when an editable portrait is present.
Phone layouts keep the preview above the current answer; only that answer's
content scrolls when necessary.

Original, Golden, Electric, and Noir show actual rendered thumbnail previews.
Choosing a finish applies the editor's persisted grading controls to both
formats. Original restores the per-format grading captured before the first
choice. That original snapshot and current conversation step are transient;
project files save the resulting artwork settings, not conversation history.
Opening a project establishes its saved grade as the new Original.

Export reuses the existing two-format renderer, quota checks, and finish review.
The finish review can flag a supported blank date or saved text outside a canvas;
users can fix it or explicitly keep it. It is not a full collision/legibility
audit. The previous `CocoGuide` panel remains only for the legacy noncompiled
Quick Edit fallback. Its older UI verifiers are historical, not the current
conversation acceptance test.

Main files:

- `components/coco/CocoOrb.tsx`
- `components/coco/CocoBuildDetails.tsx`
- `components/coco/CocoConversation.tsx`
- `components/coco/CocoEventBriefFields.tsx`
- `components/coco/CocoDirectionChooser.tsx`
- `components/ui/StartupTemplates.tsx`
- `app/page.tsx` and `app/globals.css`

Validation:

- `node --test tests/coco-conversation.test.ts tests/coco-guided-quick-edit.test.ts tests/coco-social-form-choices.test.ts`
- `node scripts/verify-coco-conversation.mjs`
- `NF_DEVICE=mobile node scripts/verify-coco-conversation.mjs`
- `node --test tests/coco-conversation-refinements.test.ts`
- `NF_MOTION=1 node scripts/verify-coco-refinements.mjs`
- `NF_DEVICE=mobile node scripts/verify-coco-refinements.mjs`
- `node --test tests/coco-content-spacing.test.ts tests/coco-social-footer.test.ts tests/coco-quick-text-sizes.test.ts`
- `NF_RESIZE=1 node scripts/verify-coco-spacing.mjs`
- `NF_DEVICE=mobile node scripts/verify-coco-spacing.mjs`

The browser verifier follows actual Create with Coco interactions, checks live
answers and Back, headline resizing and Undo, editing an earlier answer,
two-format grading and Original restoration, and downloads both PNGs. It uses
an isolated export-quota fixture and does not verify account entitlements.

Full-editor added-text and Story-footer browser regression:
`scripts/verify-coco-added-text-story.mjs` (also `NF_DEVICE=mobile`).

Advanced text/font preview regression: `scripts/verify-coco-advanced-text.mjs`
(`NF_DEVICE=mobile`, optional `NF_SKIP_EXPORT=1`). Exercises live font previews,
name-only closed selectors, empty initial fields, direct multiline typing and
clearing, formatting/spacing/shadow/opacity, separate text objects, form
preservation and both format exports.

Saved Story background regression: `scripts/verify-coco-story-background.mjs`.
Follows Brunch Saturday through first-question preview, review, editor and both
PNG exports; compares background source and geometry with the editor. Focused
coverage: `tests/coco-preview-background.test.ts` and
`tests/coco-recipe-background.test.ts`.

Linked-palette regression: `node scripts/verify-coco-linked-palette.mjs`.
Default recipe is Afro Sunset; `NF_RECIPE=brunch-saturday` covers textured
lettering, separate image elements and the uploaded Story background.
`NF_DEVICE=mobile` checks the phone layout; `NF_CANVAS=1` verifies the original
Scene Builder palette choices and Reset. `NF_SKIP_EXPORT=1` skips downloads.
The verifier exercises automatic mapping, all object roles, zero image strength,
Soft Light, Original, both format scope, editor parity and both PNG exports.
`tests/coco-linked-palette.test.ts` checks pixel lighting/alpha/color-range
preservation, registry-wide role coverage, reset/merge and source replacement.
