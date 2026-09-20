import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSubjectInteractionMap,
  scoreInteractionCellsForRole,
  scoreSubjectRegionInteraction,
} from "../components/coco/subjectGeometry/buildSubjectInteractionMap.ts";
import {
  buildSubjectSemanticRegions,
} from "../components/coco/subjectGeometry/buildSubjectSemanticRegions.ts";

test("interaction map measures real alpha coverage and semantic protection", () => {
  const width = 100;
  const height = 100;
  const alpha = new Uint8ClampedArray(width * height);
  for (let y = 10; y < 90; y += 1) {
    for (let x = 25; x < 75; x += 1) alpha[y * width + x] = 255;
  }
  const regions = buildSubjectSemanticRegions({
    width,
    height,
    alpha: { x: 25, y: 10, width: 50, height: 80 },
    face: { x: 40, y: 20, width: 20, height: 24 },
  });
  const map = buildSubjectInteractionMap({
    alpha,
    width,
    height,
    regions,
    columns: 10,
    rows: 10,
  });

  const background = map.cells.find((cell) => cell.column === 0 && cell.row === 0);
  const face = map.cells.find(
    (cell) => cell.region === "face-core" || cell.region === "eyes"
  );
  const torso = map.cells.find((cell) => cell.region === "torso");

  assert.equal(background?.subjectCoverage, 0);
  assert.ok(face);
  assert.equal(face.protection, 1);
  assert.ok(torso);
  assert.equal(torso.protection, 0.2);
  assert.equal(scoreInteractionCellsForRole([face], "headline").allowed, false);
  assert.equal(scoreInteractionCellsForRole([torso], "headline").allowed, true);
  assert.equal(scoreInteractionCellsForRole([torso], "details").allowed, false);
});

test("copy roles interpret the same torso overlap differently", () => {
  const regionCoverage = { torso: 0.2 } as const;
  const headline = scoreSubjectRegionInteraction({
    role: "headline",
    regionCoverage,
    subjectOverlap: 0.2,
    maximumProtection: 0.2,
  });
  const details = scoreSubjectRegionInteraction({
    role: "details",
    regionCoverage,
    subjectOverlap: 0.2,
    maximumProtection: 0.2,
  });

  assert.equal(headline.allowed, true);
  assert.equal(headline.mode, "encourage");
  assert.ok(headline.score > 0);
  assert.equal(details.allowed, false);
  assert.match(details.reason ?? "", /torso/);
});

test("face features stay forbidden even for hero and decorative copy", () => {
  for (const role of ["headline", "accent"] as const) {
    const result = scoreSubjectRegionInteraction({
      role,
      regionCoverage: { eyes: 0.02 },
      subjectOverlap: 0.02,
      maximumProtection: 1,
    });
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /protected eyes/);
  }
});

test("detected props remain protected even outside the person alpha mask", () => {
  const width = 100;
  const height = 100;
  const alpha = new Uint8ClampedArray(width * height);
  for (let y = 10; y < 70; y += 1) {
    for (let x = 15; x < 55; x += 1) alpha[y * width + x] = 255;
  }
  const regions = buildSubjectSemanticRegions({
    width,
    height,
    alpha: { x: 15, y: 10, width: 40, height: 60 },
    props: [{ x: 80, y: 70, width: 10, height: 20, kind: "drink" }],
  });
  const map = buildSubjectInteractionMap({ alpha, width, height, regions, columns: 10, rows: 10 });
  const propCell = map.cells.find((cell) => cell.region === "prop");

  assert.ok(propCell);
  assert.ok(propCell.subjectCoverage > 0.9);
  assert.equal(scoreInteractionCellsForRole([propCell], "headline").allowed, false);
  assert.equal(scoreInteractionCellsForRole([propCell], "details").allowed, false);
});

test("detected hands are forbidden while nearby torso remains headline-compatible", () => {
  const hand = scoreSubjectRegionInteraction({
    role: "headline",
    regionCoverage: { hands: 0.04 },
    subjectOverlap: 0.04,
    maximumProtection: 0.98,
  });
  const torso = scoreSubjectRegionInteraction({
    role: "headline",
    regionCoverage: { torso: 0.4 },
    subjectOverlap: 0.4,
    maximumProtection: 0.2,
  });

  assert.equal(hand.allowed, false);
  assert.match(hand.reason ?? "", /protected hands/);
  assert.equal(torso.allowed, true);
});
