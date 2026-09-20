import test from "node:test";
import assert from "node:assert/strict";

import { analyzeSubjectPose } from "../components/coco/subjectGeometry/analyzeSubjectPose.ts";

function paintedMask(
  width: number,
  height: number,
  paint: (x: number, y: number) => boolean
) {
  const alpha = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (paint(x, y)) alpha[y * width + x] = 255;
    }
  }
  return alpha;
}

test("pose evidence finds shoulder expansion and body lean from mask pixels", () => {
  const width = 100;
  const height = 140;
  const alpha = paintedMask(width, height, (x, y) => {
    if (y >= 15 && y < 52) return x >= 39 && x <= 61;
    if (y >= 52 && y < 72) return x >= 27 && x <= 78;
    if (y >= 72) return x >= 38 && x <= 88;
    return false;
  });
  const pose = analyzeSubjectPose({
    alpha,
    maskWidth: width,
    maskHeight: height,
    sourceWidth: width,
    sourceHeight: height,
    face: { x: 40, y: 20, width: 20, height: 28 },
  });

  assert.ok(pose.shoulderY != null);
  assert.ok(pose.shoulderY! >= 34 && pose.shoulderY! <= 44);
  assert.equal(pose.bodyLean, "right");
  assert.equal(pose.openSide, "left");
  assert.ok(pose.confidence > 0.7);
});

test("pose evidence reports lower confidence without a detected face", () => {
  const alpha = paintedMask(80, 100, (x, y) => y > 20 && x > 20 && x < 60);
  const pose = analyzeSubjectPose({
    alpha,
    maskWidth: 80,
    maskHeight: 100,
    sourceWidth: 80,
    sourceHeight: 100,
  });

  assert.equal(pose.faceCenterX, null);
  assert.ok(pose.confidence < 0.65);
});
