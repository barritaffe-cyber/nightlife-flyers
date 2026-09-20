import test from "node:test";
import assert from "node:assert/strict";

import {
  generateCanvasTextCandidates,
  headlineShapesForText,
  headlineLineBreakVariants,
  type CanvasInteractionCell,
} from "../components/coco/subjectGeometry/buildCanvasTextCandidates.ts";

test("headline candidate geometry adapts to copy structure", () => {
  const short = headlineShapesForText("VIP");
  const balanced = headlineShapesForText("BEACH BUMS");
  const long = headlineShapesForText("THE ULTIMATE SUMMER TAKEOVER EXPERIENCE");

  // A headline is always allocated a true hero band. Short titles use the
  // extra room to become larger; they must not be assigned a small label box.
  assert.ok([...short, ...balanced, ...long].every((shape) => shape.width >= 70));
  assert.ok(short.every((shape) => shape.height >= 20 && shape.height <= 24));
  assert.ok(balanced.every((shape) => shape.height >= 24 && shape.height <= 28));
  assert.ok(long.every((shape) => shape.height >= 28));
  assert.ok(Math.min(...long.map((shape) => shape.height)) > Math.min(...short.map((shape) => shape.height)));
});

test("headline line-break candidates include single-line and balanced alternatives", () => {
  const variants = headlineLineBreakVariants("ULTIMATE SUMMER TAKEOVER");
  assert.ok(variants.includes("ULTIMATE SUMMER TAKEOVER"));
  assert.ok(variants.includes("ULTIMATE\nSUMMER TAKEOVER"));
  assert.ok(variants.includes("ULTIMATE SUMMER\nTAKEOVER"));
  assert.deepEqual(headlineLineBreakVariants("BEACH\nBUMS"), ["BEACH\nBUMS"]);
});

test("canvas candidates reject protected face cells while permitting role-appropriate space", () => {
  const faceCell: CanvasInteractionCell = {
    column: 0,
    row: 0,
    xPct: 0,
    yPct: 0,
    widthPct: 10,
    heightPct: 10,
    subjectCoverage: 1,
    protection: 1,
    region: "face-core",
    canvasX: 42,
    canvasY: 18,
    canvasWidth: 16,
    canvasHeight: 24,
  };
  const torsoCell: CanvasInteractionCell = {
    ...faceCell,
    protection: 0.2,
    region: "torso",
    canvasX: 34,
    canvasY: 48,
    canvasWidth: 32,
    canvasHeight: 34,
  };

  const candidates = generateCanvasTextCandidates({
    cells: [faceCell, torsoCell],
    roles: ["headline", "details", "compliance"],
    maxPerRole: 2,
  });

  assert.ok(candidates.some((candidate) => candidate.role === "headline"));
  assert.ok(candidates.some((candidate) => candidate.role === "details"));
  assert.ok(candidates.some((candidate) => candidate.role === "compliance"));
  for (const candidate of candidates) {
    assert.equal(candidate.rejected, false);
    assert.ok(candidate.maximumProtection <= 0.45);
  }
});

test("candidate roles form a coordinated hierarchy around the subject", () => {
  const cells: CanvasInteractionCell[] = [
    {
      column: 0,
      row: 0,
      xPct: 0,
      yPct: 0,
      widthPct: 10,
      heightPct: 10,
      subjectCoverage: 1,
      protection: 1,
      region: "face-core",
      canvasX: 40,
      canvasY: 18,
      canvasWidth: 20,
      canvasHeight: 22,
    },
    {
      column: 0,
      row: 1,
      xPct: 0,
      yPct: 0,
      widthPct: 10,
      heightPct: 10,
      subjectCoverage: 1,
      protection: 0.2,
      region: "torso",
      canvasX: 28,
      canvasY: 44,
      canvasWidth: 44,
      canvasHeight: 38,
    },
  ];
  const candidates = generateCanvasTextCandidates({
    cells,
    roles: ["headline", "presenter", "details", "venue", "compliance"],
    maxPerRole: 1,
  });
  const headline = candidates.find((candidate) => candidate.role === "headline");
  const presenter = candidates.find((candidate) => candidate.role === "presenter");
  const venue = candidates.find((candidate) => candidate.role === "venue");

  assert.ok(headline);
  assert.ok(presenter);
  assert.ok(venue);
  assert.ok(presenter.rect.y < headline.rect.y);
  assert.ok(venue.rect.y > headline.rect.y);

  for (let a = 0; a < candidates.length; a += 1) {
    for (let b = a + 1; b < candidates.length; b += 1) {
      const first = candidates[a].rect;
      const second = candidates[b].rect;
      const overlapWidth = Math.max(
        0,
        Math.min(first.x + first.width, second.x + second.width) -
          Math.max(first.x, second.x)
      );
      const overlapHeight = Math.max(
        0,
        Math.min(first.y + first.height, second.y + second.height) -
          Math.max(first.y, second.y)
      );
      const ratio =
        overlapWidth * overlapHeight /
        Math.min(first.width * first.height, second.width * second.height);
      assert.ok(ratio <= 0.081);
    }
  }
});

test("headline candidates receive intentional torso interaction evidence", () => {
  const torsoCell: CanvasInteractionCell = {
    column: 0,
    row: 0,
    xPct: 0,
    yPct: 0,
    widthPct: 10,
    heightPct: 10,
    subjectCoverage: 1,
    protection: 0.2,
    region: "torso",
    canvasX: 42,
    canvasY: 54,
    canvasWidth: 16,
    canvasHeight: 18,
  };
  const [headline] = generateCanvasTextCandidates({
    cells: [torsoCell],
    copyTextByRole: { headline: "BEACH BUMS" },
    roles: ["headline"],
    maxPerRole: 1,
    coordinated: false,
  });

  assert.ok(headline);
  assert.equal(headline.interactionMode, "encourage");
  assert.ok((headline.regionCoverage?.torso ?? 0) > 0);
  assert.ok((headline.interactionScore ?? 0) > 0);
});
