import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseCanvasComposition,
  type CapacityCheckedCandidate,
} from "../components/coco/compositionDirector/chooseCanvasComposition.ts";
import { repairRenderedComposition } from "../components/coco/compositionDirector/repairRenderedComposition.ts";
import type { RenderedCompositionCritique } from "../components/coco/compositionDirector/critiqueRenderedComposition.ts";

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
    capacity: {
      role,
      fits: true,
      fontSize: role === "headline" ? 62 : 20,
      lines: [role],
      lineCount: 1,
      textWidth: 80,
      textHeight: 20,
      occupancy: 0.6,
      breathingRoom: 0.3,
    },
  };
}

function critique(
  candidateIds: string[],
  kind: RenderedCompositionCritique["issues"][number]["kind"],
  severity: number
): RenderedCompositionCritique {
  return {
    passed: false,
    rejectedCandidateIds: [candidateIds[candidateIds.length - 1]],
    issues: [{ candidateIds, kind, severity }],
  };
}

test("rendered overflow reduces font size without deleting its footer role", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("headline", 28, 35), candidate("venue", 28, 86), candidate("compliance", 52, 86, 16)],
    requiredRoles: ["headline", "venue", "compliance"],
  });
  const venue = composition.placements.find((item) => item.role === "venue")!;
  const result = repairRenderedComposition({
    composition,
    critique: critique([venue.id], "text-overflow", 14),
  });
  const repairedVenue = result.composition.placements.find((item) => item.role === "venue")!;

  assert.equal(result.changed, true);
  assert.equal(result.composition.placements.length, composition.placements.length);
  assert.ok(repairedVenue.capacity.fontSize < venue.capacity.fontSize);
  assert.deepEqual(repairedVenue.rect, venue.rect);
});

test("protected-region repair translates the complete hero lockup", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("headline", 28, 52), candidate("accent", 34, 40, 28)],
    requiredRoles: ["headline", "accent"],
  });
  const headline = composition.placements.find((item) => item.role === "headline")!;
  const accent = composition.placements.find((item) => item.role === "accent")!;
  const result = repairRenderedComposition({
    composition,
    critique: critique([accent.id], "face-overlap", 0.2),
    validate: () => true,
  });
  const repairedHeadline = result.composition.placements.find((item) => item.role === "headline")!;
  const repairedAccent = result.composition.placements.find((item) => item.role === "accent")!;

  assert.equal(result.changed, true);
  assert.equal(repairedHeadline.rect.x - headline.rect.x, repairedAccent.rect.x - accent.rect.x);
  assert.equal(repairedHeadline.rect.y - headline.rect.y, repairedAccent.rect.y - accent.rect.y);
  assert.equal(result.composition.placements.some((item) => item.role === "accent"), true);
});

test("underfilled headline grows while retaining every lockup member", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("headline", 28, 52), candidate("accent", 34, 40, 28)],
    requiredRoles: ["headline", "accent"],
  });
  const headline = composition.placements.find((item) => item.role === "headline")!;
  const result = repairRenderedComposition({
    composition,
    critique: critique([headline.id], "headline-underfill", 0.45),
  });
  const repairedHeadline = result.composition.placements.find((item) => item.role === "headline")!;

  assert.ok(repairedHeadline.capacity.fontSize > headline.capacity.fontSize);
  assert.deepEqual(
    result.composition.placements.map((item) => item.role).sort(),
    composition.placements.map((item) => item.role).sort()
  );
});
