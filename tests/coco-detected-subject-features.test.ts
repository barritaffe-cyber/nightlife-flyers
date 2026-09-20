import test from "node:test";
import assert from "node:assert/strict";

import { handRectFromNormalizedLandmarks } from "../components/coco/subjectGeometry/buildDetectedSubjectFeatures.ts";

test("hand landmark bounds preserve real landmark position with safety padding", () => {
  const rect = handRectFromNormalizedLandmarks({
    imageWidth: 1000,
    imageHeight: 800,
    confidence: 0.93,
    landmarks: [
      { x: 0.2, y: 0.3 },
      { x: 0.24, y: 0.22 },
      { x: 0.28, y: 0.18 },
      { x: 0.32, y: 0.21 },
      { x: 0.35, y: 0.28 },
      { x: 0.3, y: 0.36 },
    ],
  });

  assert.ok(rect);
  assert.equal(rect.source, "mediapipe-hand-landmarker");
  assert.equal(rect.confidence, 0.93);
  assert.ok(rect.x < 200);
  assert.ok(rect.y < 144);
  assert.ok(rect.x + rect.width > 350);
  assert.ok(rect.y + rect.height > 288);
});

test("hand landmark bounds reject incomplete detections and clamp image edges", () => {
  assert.equal(
    handRectFromNormalizedLandmarks({
      imageWidth: 100,
      imageHeight: 100,
      landmarks: [{ x: 0.2, y: 0.2 }],
    }),
    null
  );
  const edge = handRectFromNormalizedLandmarks({
    imageWidth: 100,
    imageHeight: 100,
    landmarks: [
      { x: 0, y: 0 },
      { x: 0.01, y: 0 },
      { x: 0, y: 0.01 },
      { x: 0.02, y: 0.02 },
      { x: 0.03, y: 0.01 },
    ],
  });
  assert.ok(edge);
  assert.equal(edge.x, 0);
  assert.equal(edge.y, 0);
});
