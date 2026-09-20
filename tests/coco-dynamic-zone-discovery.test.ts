import test from "node:test";
import assert from "node:assert/strict";

import { discoverCanvasTextZones } from "../components/coco/subjectGeometry/discoverCanvasTextZones.ts";
import type { CanvasInteractionCell } from "../components/coco/subjectGeometry/buildCanvasTextCandidates.ts";

function cell(
  region: CanvasInteractionCell["region"],
  x: number,
  y: number,
  width: number,
  height: number,
  protection: number
): CanvasInteractionCell {
  return {
    column: 0,
    row: 0,
    xPct: 0,
    yPct: 0,
    widthPct: 10,
    heightPct: 10,
    subjectCoverage: 1,
    protection,
    region,
    canvasX: x,
    canvasY: y,
    canvasWidth: width,
    canvasHeight: height,
  };
}

function overlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return (
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  );
}

test("dynamic clear lanes move to the open side when the subject moves", () => {
  const leftSubject = [
    cell("face-core", 18, 16, 18, 22, 1),
    cell("torso", 10, 40, 34, 42, 0.2),
  ];
  const rightSubject = [
    cell("face-core", 64, 16, 18, 22, 1),
    cell("torso", 56, 40, 34, 42, 0.2),
  ];
  const leftZones = discoverCanvasTextZones({ subjectCells: leftSubject });
  const rightZones = discoverCanvasTextZones({ subjectCells: rightSubject });

  assert.ok(
    leftZones.some(
      (zone) => zone.kind === "clear" && zone.rect.x >= 45 && zone.rect.width >= 30
    )
  );
  assert.ok(
    rightZones.some(
      (zone) =>
        zone.kind === "clear" &&
        zone.rect.x + zone.rect.width <= 55 &&
        zone.rect.width >= 30
    )
  );
});

test("hero lanes may use torso but never cross face, hand, or prop cells", () => {
  const face = cell("face-core", 40, 15, 20, 22, 1);
  const hand = cell("hands", 28, 48, 12, 16, 0.98);
  const prop = cell("prop", 68, 52, 10, 20, 0.94);
  const zones = discoverCanvasTextZones({
    subjectCells: [
      face,
      cell("torso", 24, 40, 52, 42, 0.2),
      hand,
      prop,
    ],
  });
  const integrated = zones.filter(
    (zone) =>
      zone.kind === "hero-interaction" &&
      (zone.regionCoverage.torso ?? 0) > 0.08
  );

  assert.ok(integrated.length > 0);
  for (const zone of integrated) {
    assert.equal(overlap(zone.rect, {
      x: face.canvasX,
      y: face.canvasY,
      width: face.canvasWidth,
      height: face.canvasHeight,
    }), 0);
    assert.equal(overlap(zone.rect, {
      x: hand.canvasX,
      y: hand.canvasY,
      width: hand.canvasWidth,
      height: hand.canvasHeight,
    }), 0);
    assert.equal(overlap(zone.rect, {
      x: prop.canvasX,
      y: prop.canvasY,
      width: prop.canvasWidth,
      height: prop.canvasHeight,
    }), 0);
  }
});

test("dynamic extraction retains a real footer lane below the subject", () => {
  const zones = discoverCanvasTextZones({
    subjectCells: [
      cell("face-core", 40, 15, 20, 22, 1),
      cell("torso", 28, 40, 44, 40, 0.2),
    ],
  });
  assert.ok(
    zones.some(
      (zone) =>
        zone.kind === "clear" && zone.rect.y >= 79 && zone.rect.width >= 70
    )
  );
});
