# Flyer → CSS Studio

Open `/tools/flyer-css` on the local development server.

The first AI call inventories separate reference text blocks and CSS shapes
with normalized x/y/width/height, font size, weight and alignment. Estimated
reference bounds are advisory across repairs: the original image wins when an
estimate is wrong. Chromium measures actual CSS without rewriting positions,
spans, font sizes, line breaks or transforms. Missing/duplicate IDs, hidden blocks,
missing copy and canvas clipping prevent a pass. Additional IDs can restore copy
missed by the initial inventory. The UI lists per-object results separately from
visual similarity checks. These are browser line bounds,
plus per-text transparent-background raster probes whose alpha bounds measure
the actual visible lettering. Brush-font line-box whitespace must not be treated
as visible ink. Probes are removed before the final screenshot/HTML is returned;
unmatched and ornamental reference detection remains AI estimated.
On macOS with Swift/Vision available, the tool first performs on-device OCR.
Exact recognized utility text uses those measured positions instead of guessed
coordinates; split words can be reunited, and repeated venue names are matched
by location. Uncertain/incomplete recognition and decorative headlines stay
under visual review. This does not replace copy with OCR transcription. Other
platforms, unavailable OCR, or a 45-second OCR timeout fall back to visual
estimation; blocks marked `measurementSource: on-device-ocr` identify anchors
actually obtained from OCR. OCR itself makes no network requests.
Generation/composition rendering explicitly fits direct-child OCR-anchored
utility text using its measured ink: a uniform scale and translation preserve
the selected face, spans, line grouping and aspect ratio. It re-renders and
remeasures the fitted result before review. Plain preview/measurement and
typography-only refinement do not enable this fitting. Nested transformed
objects and uncertain/decorative text are left to visual repair.
Composition fitting also checks single-line text against its real scroll width
before ink measurement. An overflowing gradient headline is reduced to expose
its final characters; the gradient is retained and the result is reviewed again.
Tight gradient line boxes are expanded to avoid clipping glyph tops. Generated
inline fits retain their original inline values and are released before later
AI corrections, so a previous fit cannot silently override a new CSS repair.
Review and repair also receive paired detail crops for small text and shapes:
original on the left, current render on the right, using exactly the same canvas
coordinates and scale. Crops include both estimated and actual bounds plus
context; they are not independently fitted, which would hide size/position errors.
These diagnostic crops are sent to the configured AI service along with the
reference and draft overview; they never become flyer assets.
The original aspect ratio is restored for refinements and new generations.

Generation and refinement use a bounded visual-review loop: generate, render
with Chromium, visually review against the reference, repair reported failures,
then render and review again. The checklist covers copy, readability, hierarchy,
typography, decorations and imagery. Stop when all checks pass or after three
repairs (up to nine logical AI calls, with up to two transport retries per call). Unrenderable drafts can be repaired
inside the same bounded budget before review.
Every retained candidate is rendered
and reviewed; a failed/regressing repair retains the best reviewed draft. The
repair step uses scoped CSS patches when copy/objects are already present,
preserving passing markup and geometry. Re-measured IDs are matched to existing
copy (or nearby shape geometry) so renamed objects do not falsely fail as missing.
The reviewer treats small position/scale deviations as polish under the user's
close-enough goal, but never waives missing copy, clipping, lost gradients,
wrong font categories, flattened brush lettering, or missing decorations.
The
UI shows the checklist, review history and unresolved failures. AI assessment
does not replace manual approval. `OPENAI_CSS_REVIEW_MODEL` optionally selects
the reviewer; by default it uses `OPENAI_CSS_AUTHOR_MODEL` (default `gpt-5.4`,
medium reasoning for GPT-5 models). This tool no longer inherits the older generic
layout-analysis model. Requests have a 240-second per-call timeout. Local Didot may be selected when
installed for high-contrast serif references; it is explicitly flagged as a
non-portable font dependency, not copied or embedded from the system.

1. Select the finished reference image and up to six separate background/cutout assets (PNG, JPEG, WebP).
2. Enter font choices and reproduction instructions. Generate sends these images to the configured OpenAI service using `OPENAI_API_KEY` and `OPENAI_CSS_AUTHOR_MODEL`.
3. Inspect the original and scriptless rendered draft side by side. Read generation notes for missing assets and uncertain fonts.
4. Edit the HTML/CSS and click Render edits. Set preview dimensions to match your authored canvas if pasting a different master.
   **Compare & improve composition** captures the current CSS with scriptless,
   network-blocked Chromium and sends that actual render alongside the reference
   for a repair pass. It targets missing rules/frames/shapes and readability,
   not pixel-perfect matching. Proposed repairs and remaining compromises are
   shown separately; no AI response automatically approves a draft. Restore
   previous source reverts a repair. This requires installed Playwright Chromium.
5. Approve only after visual comparison. Export downloads the HTML master; generated images and referenced local fonts are embedded.

This tool does not call the Coco compiler, register recipes, alter the main editor, or export `.nflyer` files. It does not automatically certify visual similarity. Approval is explicitly manual. HTML structure checks are basic preflight checks, not compiler validation.

AI generation is development-only; public deployment needs authentication, quota accounting and durable rate limiting before enabling the endpoint. It accepts one concurrent request per server process. Image limits: 8 MB each, 24 MB total, six assets plus reference. Images normalize within 1600 × 1600 while preserving aspect ratio: JPEG for the vision-only reference, PNG for compositing assets.

Preview uses an opaque-origin sandbox and restrictive CSP. Generated scripts, forms, embeds and remote image resources are unsupported. Manually pasted local font paths may require embedding for preview/export portability.

Drafts are held in tab memory, not persisted. Generation replaces the current source; export approved work before generating another version or leaving the page.

Verification: `node --test tests/coco-css-studio.test.ts tests/coco-css-review-loop.test.ts`.
Local Brunch CSS preservation regression: `node --test tests/coco-css-renderer.test.ts`.
Full paid Brunch generation/review test: `node --experimental-strip-types scripts/test-brunch-studio.mjs`.
The latter sends the original and background to OpenAI and saves HTML, screenshot,
measurements and review history under `/private/tmp/brunch-studio-verification`.
It does not use the hand-authored HTML as an input or a fallback.
Behavioral tests cover final-render review, regression retention, request failure,
repair budget, malformed reviews and early success. Browser-tested checklist
display, manual approval and review invalidation after source edits. A live AI
review of synthetic renders detected a deliberately clipped headline and missing
divider. Comparable output quality on real uploaded flyers still requires broader
evaluation; the checklist is AI judgment, not a guarantee of visual equivalence.
