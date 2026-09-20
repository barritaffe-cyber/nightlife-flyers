import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseCanvasComposition,
  type CapacityCheckedCandidate,
} from "../components/coco/compositionDirector/chooseCanvasComposition.ts";
import { resolveCompositionLockups } from "../components/coco/compositionDirector/resolveCompositionLockups.ts";

function candidate(
  role: CapacityCheckedCandidate["role"],
  x: number,
  y: number,
  width = role === "headline" ? 44 : 22
): CapacityCheckedCandidate {
  return {
    id: role,
    role,
    rect: { x, y, width, height: 12 },
    score: 90,
    subjectOverlap: 0,
    maximumProtection: 0,
    rejected: false,
    capacity: {
      role,
      fits: true,
      fontSize: role === "headline" ? 64 : 18,
      lines: [role],
      lineCount: 1,
      textWidth: 80,
      textHeight: 20,
      occupancy: 0.6,
      breathingRoom: 0.3,
    },
  };
}

const refit = (value: CapacityCheckedCandidate) => ({
  ...value.capacity,
  fontSize: value.capacity.fontSize - 1,
});

test("lockup resolver makes hero members a compact aligned column", () => {
  const composition = chooseCanvasComposition({
    candidates: [
      candidate("headline", 22, 35),
      candidate("accent", 8, 12),
    ],
    requiredRoles: ["headline", "accent"],
  });
  const resolved = resolveCompositionLockups({ composition, refit });
  const headline = resolved.placements.find((item) => item.role === "headline")!;
  const accent = resolved.placements.find((item) => item.role === "accent")!;

  assert.equal(resolved.changed, true);
  assert.equal(resolved.lockups.find((lockup) => lockup.id === "hero")?.mode, "column");
  assert.ok(Math.abs(headline.rect.x - accent.rect.x) < 0.01);
  assert.ok(headline.rect.y > accent.rect.y + accent.rect.height);
  assert.equal(headline.capacity.fontSize, 63);
});

test("lockup resolver balances widely separated facts into a row", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("date", 5, 78), candidate("price", 70, 80)],
    requiredRoles: ["date", "price"],
  });
  const resolved = resolveCompositionLockups({ composition, refit });
  const date = resolved.placements.find((item) => item.role === "date")!;
  const price = resolved.placements.find((item) => item.role === "price")!;

  assert.equal(resolved.lockups.find((lockup) => lockup.id === "facts")?.mode, "row");
  assert.ok(Math.abs(
    date.rect.y + date.rect.height / 2 - price.rect.y - price.rect.height / 2
  ) < 0.01);
  assert.ok(price.rect.x - date.rect.x - date.rect.width < 3);
});

test("lockup resolver preserves selected geometry when reflow is unsafe", () => {
  const composition = chooseCanvasComposition({
    candidates: [candidate("presenter", 6, 8), candidate("details", 6, 28)],
    requiredRoles: ["presenter", "details"],
  });
  const original = composition.placements.map((item) => ({ ...item.rect }));
  const resolved = resolveCompositionLockups({
    composition,
    refit,
    validate: () => false,
  });

  assert.equal(resolved.changed, false);
  assert.deepEqual(resolved.placements.map((item) => item.rect), original);
});
