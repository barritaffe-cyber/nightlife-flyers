import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCanvasSubjectModel,
  canvasRectToPercent,
} from "../components/coco/subjectGeometry/buildCanvasSubjectModel.ts";

const bounds = {
  width: 1000,
  height: 1000,
  alpha: { x: 200, y: 100, width: 600, height: 850 },
  face: { x: 400, y: 220, width: 200, height: 240 },
  maskDataUrl: "data:image/png;base64,test",
  maskWidth: 500,
  maskHeight: 500,
  maskThreshold: 18,
  maskSource: "imgly-segmentation",
};

test("cutout subject model maps source geometry directly from placement data", () => {
  const model = buildCanvasSubjectModel({
    bounds,
    canvas: { width: 540, height: 540 },
    transform: {
      kind: "cutout",
      centerXPct: 50,
      centerYPct: 50,
      scale: 0.5,
    },
  });

  assert.equal(model.transform.kind, "cutout");
  assert.deepEqual(model.silhouetteBounds, {
    x: 120,
    y: 70,
    width: 300,
    height: 425,
  });
  assert.deepEqual(model.faceBounds, {
    x: 220,
    y: 130,
    width: 100,
    height: 120,
  });
  assert.equal(model.source.maskDataUrl, bounds.maskDataUrl);
  assert.ok(model.regions.some((region) => region.kind === "eyes"));
});

test("background subject model applies cover, zoom, and background position", () => {
  const model = buildCanvasSubjectModel({
    bounds: {
      ...bounds,
      width: 1000,
      height: 500,
      alpha: { x: 250, y: 20, width: 500, height: 470 },
    },
    canvas: { width: 540, height: 960 },
    transform: {
      kind: "background",
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundScale: 1,
    },
  });

  // Cover scale is 960/500 = 1.92; the 1920px-wide image is centered,
  // placing its left edge at -690px.
  assert.equal(model.transform.a, 1.92);
  assert.equal(model.transform.e, -690);
  assert.equal(model.transform.f, 0);
  assert.deepEqual(model.silhouetteBounds, {
    x: -210,
    y: 38.4,
    width: 960,
    height: 902.4,
  });
});

test("background subject geometry follows live pan and zoom", () => {
  const centered = buildCanvasSubjectModel({
    bounds,
    canvas: { width: 540, height: 540 },
    transform: {
      kind: "background",
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundScale: 1,
    },
  });
  const moved = buildCanvasSubjectModel({
    bounds,
    canvas: { width: 540, height: 540 },
    transform: {
      kind: "background",
      backgroundPositionX: 80,
      backgroundPositionY: 20,
      backgroundScale: 1.4,
    },
  });

  assert.notDeepEqual(moved.faceBounds, centered.faceBounds);
  assert.notDeepEqual(moved.silhouetteBounds, centered.silhouetteBounds);
  assert.equal(moved.transform.a, centered.transform.a * 1.4);
  assert.ok(Math.abs(Number(moved.faceBounds?.x) - 129.6) < 0.000001);
  assert.ok(Math.abs(Number(moved.faceBounds?.y) - 123.12) < 0.000001);
});

test("background subject geometry follows rotation around the positioned image center", () => {
  const unrotated = buildCanvasSubjectModel({
    bounds,
    canvas: { width: 540, height: 540 },
    transform: {
      kind: "background",
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundScale: 1,
    },
  });
  const rotated = buildCanvasSubjectModel({
    bounds,
    canvas: { width: 540, height: 540 },
    transform: {
      kind: "background",
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundScale: 1,
      rotationDeg: 20,
    },
  });

  assert.notDeepEqual(rotated.faceBounds, unrotated.faceBounds);
  assert.notEqual(rotated.transform.b, 0);
  assert.notEqual(rotated.transform.c, 0);
  assert.ok(Number(rotated.faceBounds?.width) > Number(unrotated.faceBounds?.width));
  assert.ok(Number(rotated.faceBounds?.height) > Number(unrotated.faceBounds?.height));
});

test("rotated background uses the positioned image center, not the canvas center", () => {
  const model = buildCanvasSubjectModel({
    bounds: {
      ...bounds,
      width: 1000,
      height: 500,
    },
    canvas: { width: 540, height: 960 },
    transform: {
      kind: "background",
      backgroundPositionX: 80,
      backgroundPositionY: 25,
      backgroundScale: 1.1,
      rotationDeg: 40,
    },
  });
  const scale = Math.max(540 / 1000, 960 / 500) * 1.1;
  const drawnWidth = 1000 * scale;
  const drawnHeight = 500 * scale;
  const offsetX = (540 - drawnWidth) * 0.8;
  const offsetY = (960 - drawnHeight) * 0.25;
  const imageCenter = {
    x: offsetX + drawnWidth / 2,
    y: offsetY + drawnHeight / 2,
  };
  const sourceCenterMapped = {
    x: model.transform.a * 500 + model.transform.c * 250 + model.transform.e,
    y: model.transform.b * 500 + model.transform.d * 250 + model.transform.f,
  };

  assert.ok(Math.abs(sourceCenterMapped.x - imageCenter.x) < 0.000001);
  assert.ok(Math.abs(sourceCenterMapped.y - imageCenter.y) < 0.000001);
});

test("canvas rectangles normalize consistently for preview and export formats", () => {
  assert.deepEqual(
    canvasRectToPercent(
      { x: 54, y: 96, width: 270, height: 480 },
      { width: 540, height: 960 }
    ),
    { x: 10, y: 10, width: 50, height: 50 }
  );
});
