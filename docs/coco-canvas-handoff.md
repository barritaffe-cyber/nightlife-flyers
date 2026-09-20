# Coco form-to-canvas handoff

The primary path is event name/theme → design → details with live preview →
Quick Edit → optional canvas editing → Square + Story download.

## Behavior

- The details step has a live preview using the same materialized recipe and
  compiled renderer as the chooser. Desktop shows it beside the form; mobile
  switches between Details and Preview. Square and Story can both be reviewed.
  Back/Create and validation errors remain in a fixed footer outside the form's
  scrolling region.
- A campaign draft retains answers when choosing another design, including
  answers that an intermediate design cannot display. Only questions actually
  offered by a design update the draft. Explicitly clearing an offered answer
  stays cleared. Routing metadata belongs to each recipe, not the shared draft.
- Quick Edit's header cannot shrink under a long form. Format, save and download
  controls remain accessible while its fields scroll on desktop.
- The handoff says “Your flyer is ready.” “Edit on canvas” opens selected-text
  controls first; “More tools” exposes the existing editor. “Back to details”
  returns to Quick Edit. Desktop's basic controls edit wording, size and rotation;
  mobile uses the existing contextual text controls.
- Canvas guidance explains selection, unlocking/dragging and the active format.
  Quick Edit keeps its existing shared Square/Story behavior; direct canvas
  changes retain the editor's independent format behavior.
- Mobile has persistent Preview, Edit details and Download both navigation.
  The page reserves space for the navigation and device safe area.
- Save reminders are dismissible, ordinary page content on both desktop and
  mobile. They do not float over navigation, controls or the canvas.
- Clicking a compiled text object can locate structured fields such as the
  first DJ or address line in Quick Edit.

## Verification

Run `node --test tests/coco-event-draft.test.ts` for draft retention, explicit
clearing and routing isolation. Run
`node scripts/verify-coco-canvas-handoff.mjs` with the local server on port 3000
for the browser regression. `NF_DEVICE=desktop` or `NF_DEVICE=mobile` limits it;
`NF_OUTPUT_DIR` sets the screenshot/download directory (default:
`/tmp/coco-canvas-handoff-fixed`).

The browser check follows Soft Life / Elegant, switches to Grills & Groove and
back, checks live previews and both canvas formats, exercises canvas editing,
returns to details and downloads both rendered PNGs. It uses isolated guest
contexts and a local starter-render quota response to test rendering, not account
entitlements. Phone-size Chromium does not replace real iOS/Android testing with
an onscreen keyboard or a timed first-time-user study.

## Verified results (2026-09-16)

All three draft regression tests pass. Desktop (1500×1100) and phone-size
Chromium (390×844) pass the flow, text editing and both actual PNG downloads,
with zero page errors. Desktop size/rotation and mobile More tools/return paths
were exercised. The downloaded 1080×1080 and 1080×1920 images were visually
inspected on both runs. Stable mobile screenshots additionally wait for preview
measurement and smooth scrolling to finish; use `NF_SKIP_EXPORT=1` to omit a
repeat export when checking only the screen layout.

The mobile navigation is portaled outside the animated application container;
its filters and transforms would otherwise make fixed navigation scroll with
the page. Floating editor panels reserve room above the navigation.

Changed component/library/test/script lint passes. Page lint matches the
pre-change display-name error and three warnings. Repository-wide TypeScript
checking still reports existing errors in other assets/backups/tests, with no
diagnostics in the changed application/form/draft files.
