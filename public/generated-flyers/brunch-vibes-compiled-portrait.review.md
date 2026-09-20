# Brunch compilation — NOT APPROVED

CSS source: `brunch-vibes-studio-final.html`

## Actual browser verification

The source HTML was freshly rendered in Chromium and visually compared with the
user's matching Brunch reference. It matches that reference.

The compiled `.nflyer` was loaded through Project import in an isolated guest
editor, then viewed in Square and Story. The Coco visual comparison **fails**.
Do not register this diagnostic compilation as a ready-to-use recipe.

Observed fixes during verification:

- Source-pixel text sizes are now scaled to the 540-pixel editor width.
- CSS matrix translations are preserved in compiled object positions.
- Compiled imports block generic center-footer reflow, including stale callbacks.
  The latest rendered footer no longer moves Rooftop Lounge under the headline.

Remaining failures:

- The 1024 × 1536 source is not an authored Square or Story adaptation. Reusing
  its percentage geometry on these different aspect ratios does not preserve
  its composition.
- Coco's SVG gradient text uses an estimated baseline rather than the source
  CSS baseline; BRUNCH sits too high and overlaps the date area.
- The renderer does not yet preserve the source script's skew transform.

A prior three-minute editor observation retained Brunch with no page errors.
That observation preceded the latest translation/footer fixes; it does not
constitute a three-minute stability pass for the latest revision.

Latest local screenshots: `/private/tmp/brunch-import-verification/css-source.png`
and `/private/tmp/brunch-import-verification/story.png`.

Reproduce with `NF_VERIFY_INTERVALS=6 node scripts/verify-brunch-import.mjs`.
The automated checks test ownership, translation, and sizing only. They are not
visual approval. Recipe registration and final release export remain blocked
until the Coco comparison passes.
