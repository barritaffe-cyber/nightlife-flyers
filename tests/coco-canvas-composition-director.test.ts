import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseCanvasComposition,
  type CapacityCheckedCandidate,
} from "../components/coco/compositionDirector/chooseCanvasComposition.ts";

function candidate(
  role: CapacityCheckedCandidate["role"],
  id: string,
  x: number,
  y: number,
  fits = true,
  score = 90
): CapacityCheckedCandidate {
  return {
    id,
    role,
    rect: { x, y, width: role === "headline" ? 44 : 22, height: 12 },
    score,
    subjectOverlap: 0,
    maximumProtection: 0,
    rejected: false,
    environmentReadability: 0.8,
    environmentComplexity: 0.15,
    capacity: {
      role,
      fits,
      fontSize: role === "headline" ? 64 : 18,
      lines: [id],
      lineCount: 1,
      textWidth: 100,
      textHeight: 30,
      occupancy: 0.6,
      breathingRoom: 0.3,
      reason: fits ? undefined : "below-minimum-size",
    },
  };
}

test("composition director rejects non-fitting and colliding arrangements", () => {
  const result = chooseCanvasComposition({
    candidates: [
      candidate("headline", "headline", 8, 55),
      candidate("details", "details-collision", 10, 56, true, 100),
      candidate("details", "details-safe", 70, 34, true, 82),
      candidate("date", "date-no-fit", 8, 82, false, 100),
      candidate("date", "date-safe", 8, 84, true, 80),
    ],
    requiredRoles: ["headline", "details", "date"],
  });

  assert.deepEqual(
    result.placements.map((placement) => placement.id).sort(),
    ["date-safe", "details-safe", "headline"]
  );
  assert.equal(result.rejectedCandidateCount, 1);
  assert.equal(result.diagnostics.collisionPenalty, 0);
});

test("composition director rewards a clear headline hierarchy", () => {
  const result = chooseCanvasComposition({
    candidates: [
      candidate("headline", "headline", 28, 52),
      candidate("presenter", "presenter", 8, 8),
      candidate("venue", "venue", 39, 88),
    ],
  });

  assert.equal(result.placements[0]?.role, "headline");
  assert.ok(result.diagnostics.hierarchyScore > 0);
  assert.ok(Number.isFinite(result.score));
});

test("composition director chooses one coherent poster over higher-scoring scattered labels", () => {
  const result = chooseCanvasComposition({
    candidates: [
      candidate("headline", "headline", 28, 52, true, 90),
      candidate("accent", "accent-lockup", 39, 40, true, 88),
      candidate("accent", "accent-scattered", 4, 8, true, 96),
      candidate("presenter", "presenter", 8, 8, true, 90),
      candidate("details", "details-grouped", 8, 21, true, 87),
      candidate("details", "details-scattered", 74, 68, true, 95),
      candidate("date", "date", 8, 82, true, 90),
      candidate("price", "price", 70, 82, true, 90),
      candidate("venue", "venue", 28, 88, true, 90),
      candidate("compliance", "compliance-footer", 50, 88, true, 87),
      candidate("compliance", "compliance-scattered", 76, 18, true, 96),
    ],
    requiredRoles: [
      "headline",
      "accent",
      "presenter",
      "details",
      "date",
      "price",
      "venue",
      "compliance",
    ],
  });

  const ids = new Set(result.placements.map((placement) => placement.id));
  assert.equal(ids.has("accent-lockup"), true);
  assert.equal(ids.has("details-grouped"), true);
  assert.equal(ids.has("compliance-footer"), true);
  assert.ok(result.diagnostics.groupingScore > 0);
  assert.ok(result.diagnostics.footerScore > 0);
  assert.ok(result.diagnostics.assemblyScore > 0);
  assert.ok(result.assembly.lockups.some(
    (lockup) => lockup.id === "hero" && lockup.roles.includes("headline") && lockup.roles.includes("accent")
  ));
  assert.ok(result.assembly.lockups.some(
    (lockup) => lockup.id === "support" && lockup.roles.includes("presenter") && lockup.roles.includes("details")
  ));
  assert.ok(result.assembly.lockups.some(
    (lockup) => lockup.id === "footer" && lockup.roles.includes("venue") && lockup.roles.includes("compliance")
  ));
});

test("composition assembly refuses an accent that cannot join the hero lockup", () => {
  const result = chooseCanvasComposition({
    candidates: [
      candidate("headline", "headline", 8, 58, true, 90),
      candidate("accent", "detached-accent", 70, 6, true, 120),
      candidate("venue", "footer", 30, 88, true, 80),
    ],
    requiredRoles: ["headline", "accent", "venue"],
  });

  assert.equal(result.placements.some((placement) => placement.id === "detached-accent"), false);
  assert.equal(
    result.assembly.lockups.find((lockup) => lockup.id === "hero")?.roles.includes("accent"),
    false
  );
});

test("composition director preserves intentional separation inside one reference grammar", () => {
  const headline = candidate("headline", "reference-headline", 20, 45, true, 90);
  const presenter = candidate("presenter", "reference-presenter", 30, 3, true, 90);
  const details = candidate("details", "reference-details", 18, 72, true, 90);
  for (const item of [headline, presenter, details]) {
    item.referenceLayoutId = "center-reference";
  }
  const result = chooseCanvasComposition({
    candidates: [headline, presenter, details],
    requiredRoles: ["headline", "presenter", "details"],
  });

  assert.deepEqual(
    result.placements.map((placement) => placement.role).sort(),
    ["details", "headline", "presenter"]
  );
});
