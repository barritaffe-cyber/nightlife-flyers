import test from "node:test";
import assert from "node:assert/strict";

import { critiqueRenderedComposition } from "../components/coco/compositionDirector/critiqueRenderedComposition.ts";

const torsoCell = {
  column: 0,
  row: 0,
  xPct: 0,
  yPct: 0,
  widthPct: 10,
  heightPct: 10,
  subjectCoverage: 1,
  protection: 0.2,
  region: "torso" as const,
  canvasX: 40,
  canvasY: 50,
  canvasWidth: 20,
  canvasHeight: 20,
};

test("rendered critique passes separated fitted zones outside the face", () => {
  const result = critiqueRenderedComposition({
    faceRect: { x: 40, y: 18, width: 20, height: 24 },
    zones: [
      { candidateId: "headline-safe", role: "headline", rect: { x: 12, y: 58, width: 54, height: 16 }, overflowX: 0, overflowY: 0 },
      { candidateId: "accent-safe", role: "accent", rect: { x: 18, y: 48, width: 30, height: 7 }, overflowX: 0, overflowY: 0 },
      { candidateId: "venue-safe", role: "venue", rect: { x: 24, y: 88, width: 52, height: 7 }, overflowX: 0, overflowY: 0 },
    ],
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.rejectedCandidateIds, []);
});

test("rendered critique rejects overflow, face overlap, and the weaker colliding role", () => {
  const result = critiqueRenderedComposition({
    faceRect: { x: 40, y: 18, width: 20, height: 24 },
    zones: [
      { candidateId: "headline", role: "headline", rect: { x: 28, y: 50, width: 48, height: 18 }, overflowX: 0, overflowY: 0 },
      { candidateId: "accent-collision", role: "accent", rect: { x: 35, y: 54, width: 34, height: 8 }, overflowX: 0, overflowY: 0 },
      { candidateId: "details-face", role: "details", rect: { x: 42, y: 22, width: 18, height: 12 }, overflowX: 0, overflowY: 0 },
      { candidateId: "venue-overflow", role: "venue", rect: { x: 20, y: 88, width: 50, height: 8 }, overflowX: 12, overflowY: 0 },
    ],
  });

  assert.equal(result.passed, false);
  assert.ok(result.rejectedCandidateIds.includes("accent-collision"));
  assert.ok(result.rejectedCandidateIds.includes("details-face"));
  assert.ok(result.rejectedCandidateIds.includes("venue-overflow"));
  assert.ok(result.issues.some((issue) => issue.kind === "text-collision"));
  assert.ok(result.issues.some((issue) => issue.kind === "face-overlap"));
  assert.ok(result.issues.some((issue) => issue.kind === "text-overflow"));
});

test("rendered critique rejects a technically fitting but visually tiny headline", () => {
  const result = critiqueRenderedComposition({
    zones: [{
      allocatedRect: { x: 8, y: 52, width: 52, height: 22 },
      candidateId: "headline-underfilled",
      role: "headline",
      rect: { x: 20, y: 55, width: 21, height: 16 },
      overflowX: 0,
      overflowY: 0,
    }],
  });

  assert.equal(result.passed, false);
  assert.ok(result.rejectedCandidateIds.includes("headline-underfilled"));
  assert.equal(result.issues[0]?.kind, "headline-underfill");
});

test("rendered critique permits headline ink on clothing", () => {
  const result = critiqueRenderedComposition({
    subjectCells: [torsoCell],
    zones: [{
      allocatedRect: { x: 38, y: 48, width: 24, height: 24 },
      candidateId: "headline-on-torso",
      role: "headline",
      rect: { x: 40, y: 50, width: 20, height: 20 },
      overflowX: 0,
      overflowY: 0,
    }],
  });

  assert.equal(result.passed, true);
});

test("rendered critique rejects informational copy on clothing", () => {
  const result = critiqueRenderedComposition({
    subjectCells: [torsoCell],
    zones: [{
      allocatedRect: { x: 40, y: 50, width: 20, height: 12 },
      candidateId: "details-on-torso",
      role: "details",
      rect: { x: 40, y: 50, width: 20, height: 10 },
      overflowX: 0,
      overflowY: 0,
    }],
  });

  assert.equal(result.passed, false);
  assert.ok(result.rejectedCandidateIds.includes("details-on-torso"));
  assert.ok(result.issues.some((issue) => issue.kind === "subject-region-overlap"));
});
