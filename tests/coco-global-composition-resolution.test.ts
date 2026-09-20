import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseCanvasComposition,
  type CapacityCheckedCandidate,
} from "../components/coco/compositionDirector/chooseCanvasComposition.ts";
import { resolveGlobalComposition } from "../components/coco/compositionDirector/resolveGlobalComposition.ts";

function candidate(
  role: CapacityCheckedCandidate["role"],
  x: number,
  y: number,
  width = role === "headline" ? 44 : 22
): CapacityCheckedCandidate {
  return {
    id: role,
    role,
    rect: { x, y, width, height: role === "headline" ? 18 : 9 },
    score: 90,
    subjectOverlap: 0,
    maximumProtection: 0,
    rejected: false,
    environmentReadability: 0.6,
    environmentComplexity: 0.2,
    capacity: {
      role,
      fits: true,
      fontSize: role === "headline" ? 62 : 18,
      lines: [role],
      lineCount: 1,
      textWidth: 80,
      textHeight: 20,
      occupancy: 0.6,
      breathingRoom: 0.3,
    },
  };
}

test("global resolver moves a footer lockup below the other composition groups", () => {
  const composition = chooseCanvasComposition({
    candidates: [
      candidate("headline", 28, 34),
      candidate("venue", 28, 64),
      candidate("compliance", 52, 64, 16),
    ],
    requiredRoles: ["headline", "venue", "compliance"],
  });
  const originalVenue = composition.placements.find((item) => item.role === "venue")!;
  const originalCompliance = composition.placements.find((item) => item.role === "compliance")!;
  const resolved = resolveGlobalComposition({ composition });
  const venue = resolved.composition.placements.find((item) => item.role === "venue")!;
  const compliance = resolved.composition.placements.find((item) => item.role === "compliance")!;

  assert.equal(resolved.changed, true);
  assert.ok(venue.rect.y > originalVenue.rect.y);
  assert.equal(
    Math.round((venue.rect.y - originalVenue.rect.y) * 100),
    Math.round((compliance.rect.y - originalCompliance.rect.y) * 100)
  );
  assert.equal(
    Math.round((compliance.rect.x - venue.rect.x) * 100),
    Math.round((originalCompliance.rect.x - originalVenue.rect.x) * 100)
  );
});

test("global resolver preserves every child offset while moving a hero lockup", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("headline", 34, 45), candidate("accent", 34, 34, 28)],
    requiredRoles: ["headline", "accent"],
  });
  const originalHeadline = composition.placements.find((item) => item.role === "headline")!;
  const originalAccent = composition.placements.find((item) => item.role === "accent")!;
  const resolved = resolveGlobalComposition({
    composition,
    subjectCenterX: 78,
    quality: (_candidate, rect) => rect.x < 34 ? 1 : 0,
  });
  const headline = resolved.composition.placements.find((item) => item.role === "headline")!;
  const accent = resolved.composition.placements.find((item) => item.role === "accent")!;

  assert.equal(resolved.changed, true);
  assert.equal(
    Math.round((headline.rect.x - accent.rect.x) * 100),
    Math.round((originalHeadline.rect.x - originalAccent.rect.x) * 100)
  );
  assert.equal(
    Math.round((headline.rect.y - accent.rect.y) * 100),
    Math.round((originalHeadline.rect.y - originalAccent.rect.y) * 100)
  );
});

test("global resolver retains the original composition when every move is unsafe", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("headline", 28, 40), candidate("venue", 30, 84)],
    requiredRoles: ["headline", "venue"],
  });
  const originals = new Map(composition.placements.map((item) => [item.id, item.rect]));
  const resolved = resolveGlobalComposition({
    composition,
    validate: (candidate, rect) => {
      const original = originals.get(candidate.id)!;
      return Math.abs(rect.x - original.x) < 0.01 && Math.abs(rect.y - original.y) < 0.01;
    },
    quality: () => 1,
  });

  assert.equal(resolved.changed, false);
  assert.deepEqual(resolved.composition.placements.map((item) => item.rect),
    composition.placements.map((item) => item.rect));
});
