import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanvasEnvironmentMap,
  scoreEnvironmentCells,
} from "../components/coco/subjectGeometry/buildCanvasEnvironmentMap.ts";

function makeImage(width: number, height: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const calmLeft = x < width / 2;
      const value = calmLeft ? 24 : (x + y) % 2 ? 0 : 255;
      rgba[offset] = value;
      rgba[offset + 1] = value;
      rgba[offset + 2] = value;
      rgba[offset + 3] = 255;
    }
  }
  return rgba;
}

test("environment map distinguishes calm negative space from visual noise", () => {
  const map = buildCanvasEnvironmentMap({
    rgba: makeImage(80, 80),
    width: 80,
    height: 80,
    columns: 8,
    rows: 8,
  });
  const calm = map.cells.filter((cell) => cell.column >= 1 && cell.column <= 2);
  const noisy = map.cells.filter((cell) => cell.column >= 5 && cell.column <= 6);
  const calmScore = scoreEnvironmentCells(calm, "light");
  const noisyScore = scoreEnvironmentCells(noisy, "light");

  assert.ok(calmScore.complexity < noisyScore.complexity);
  assert.ok(calmScore.negativeSpace > noisyScore.negativeSpace);
  assert.ok(calmScore.readability > noisyScore.readability);
});

test("environment cells describe subject-relative space and edge pressure", () => {
  const map = buildCanvasEnvironmentMap({
    rgba: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100,
    columns: 10,
    rows: 10,
    subjectBoundsPct: { x: 35, y: 20, width: 30, height: 65 },
  });

  assert.equal(map.cells.find((cell) => cell.column === 1 && cell.row === 4)?.relativeRegion, "left-of-subject");
  assert.equal(map.cells.find((cell) => cell.column === 8 && cell.row === 4)?.relativeRegion, "right-of-subject");
  assert.equal(map.cells.find((cell) => cell.column === 4 && cell.row === 0)?.relativeRegion, "above-subject");
  assert.equal(map.cells.find((cell) => cell.column === 4 && cell.row === 9)?.relativeRegion, "footer");
  assert.ok(
    Number(map.cells.find((cell) => cell.column === 0 && cell.row === 0)?.edgePressure) >
      Number(map.cells.find((cell) => cell.column === 4 && cell.row === 4)?.edgePressure)
  );
});
