import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSubjectSemanticRegions,
} from "../components/coco/subjectGeometry/buildSubjectSemanticRegions.ts";

test("subject regions are derived from the detected face and retained silhouette", () => {
  const regions = buildSubjectSemanticRegions({
    width: 1000,
    height: 1400,
    alpha: { x: 120, y: 40, width: 760, height: 1320 },
    face: { x: 360, y: 250, width: 280, height: 330 },
  });

  const eyes = regions.find((region) => region.kind === "eyes");
  const face = regions.find((region) => region.kind === "face-core");
  const shoulders = regions.find((region) => region.kind === "shoulders");
  const torso = regions.find((region) => region.kind === "torso");

  assert.ok(eyes);
  assert.ok(face);
  assert.ok(shoulders);
  assert.ok(torso);
  assert.equal(eyes.protection, 1);
  assert.equal(face.protection, 1);
  assert.ok(shoulders.protection < face.protection);
  assert.ok(torso.protection < shoulders.protection);
  assert.ok(eyes.rectPct.y >= face.rectPct.y);
  assert.ok(eyes.rectPct.y + eyes.rectPct.height <= face.rectPct.y + face.rectPct.height);
  assert.ok(shoulders.rectPct.y < torso.rectPct.y);

  for (const region of regions) {
    assert.ok(region.rectPct.x >= 0);
    assert.ok(region.rectPct.y >= 0);
    assert.ok(region.rectPct.x + region.rectPct.width <= 100.001);
    assert.ok(region.rectPct.y + region.rectPct.height <= 100.001);
  }
});

test("subject regions still provide coarse body bands when face detection is absent", () => {
  const regions = buildSubjectSemanticRegions({
    width: 800,
    height: 800,
    alpha: { x: 100, y: 80, width: 600, height: 700 },
  });

  assert.deepEqual(
    regions.map((region) => region.kind),
    ["hair", "shoulders", "torso", "lower-body"]
  );
});

test("real hand and prop detections become high-protection semantic regions", () => {
  const regions = buildSubjectSemanticRegions({
    width: 1000,
    height: 1000,
    alpha: { x: 180, y: 50, width: 640, height: 900 },
    face: { x: 390, y: 150, width: 220, height: 260 },
    hands: [{ x: 120, y: 430, width: 150, height: 210, confidence: 0.91 }],
    props: [{ x: 720, y: 500, width: 120, height: 240, confidence: 0.88, kind: "drink" }],
  });
  const hand = regions.find((region) => region.kind === "hands");
  const prop = regions.find((region) => region.kind === "prop");

  assert.ok(hand);
  assert.ok(prop);
  assert.ok(hand.protection > 0.95);
  assert.ok(prop.protection > 0.9);
  assert.deepEqual(hand.rectPct, { x: 12, y: 43, width: 15, height: 21 });
  assert.deepEqual(prop.rectPct, { x: 72, y: 50, width: 12, height: 24 });
});
