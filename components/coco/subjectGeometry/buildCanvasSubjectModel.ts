import {
  buildSubjectSemanticRegions,
  type SubjectSemanticRegion,
  type SubjectPixelRect,
} from "./buildSubjectSemanticRegions.ts";

export type CanvasSize = { width: number; height: number };

export type CanvasSubjectTransform =
  | {
      kind: "cutout";
      centerXPct: number;
      centerYPct: number;
      scale: number;
      rotationDeg?: number;
    }
  | {
      kind: "background";
      backgroundPositionX: number;
      backgroundPositionY: number;
      backgroundScale: number;
      rotationDeg?: number;
    };

export type CanvasSubjectBoundsInput = {
  width: number;
  height: number;
  alpha: SubjectPixelRect;
  face?: SubjectPixelRect;
  hands?: Array<SubjectPixelRect & { confidence?: number }>;
  props?: Array<SubjectPixelRect & { confidence?: number; kind?: string }>;
  maskDataUrl?: string;
  maskWidth?: number;
  maskHeight?: number;
  maskThreshold?: number;
  maskSource?: string;
};

export type CanvasSubjectModel = {
  version: 1;
  canvas: CanvasSize;
  source: {
    width: number;
    height: number;
    maskDataUrl?: string;
    maskWidth?: number;
    maskHeight?: number;
    maskThreshold: number;
    maskSource?: string;
  };
  transform: {
    kind: CanvasSubjectTransform["kind"];
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  };
  silhouetteBounds: SubjectPixelRect;
  faceBounds: SubjectPixelRect | null;
  regions: Array<SubjectSemanticRegion & { canvasRect: SubjectPixelRect }>;
};

function transformPoint(
  transform: CanvasSubjectModel["transform"],
  x: number,
  y: number
) {
  return {
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  };
}

function transformRect(
  transform: CanvasSubjectModel["transform"],
  rect: SubjectPixelRect
): SubjectPixelRect {
  const points = [
    transformPoint(transform, rect.x, rect.y),
    transformPoint(transform, rect.x + rect.width, rect.y),
    transformPoint(transform, rect.x, rect.y + rect.height),
    transformPoint(transform, rect.x + rect.width, rect.y + rect.height),
  ];
  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x));
  const bottom = Math.max(...points.map((point) => point.y));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function percentageRectToSource(
  rect: SubjectPixelRect,
  sourceWidth: number,
  sourceHeight: number
) {
  return {
    x: rect.x / 100 * sourceWidth,
    y: rect.y / 100 * sourceHeight,
    width: rect.width / 100 * sourceWidth,
    height: rect.height / 100 * sourceHeight,
  };
}

export function buildCanvasSubjectModel(input: {
  bounds: CanvasSubjectBoundsInput;
  canvas: CanvasSize;
  transform: CanvasSubjectTransform;
}): CanvasSubjectModel {
  const sourceWidth = Math.max(1, Number(input.bounds.width));
  const sourceHeight = Math.max(1, Number(input.bounds.height));
  const canvasWidth = Math.max(1, Number(input.canvas.width));
  const canvasHeight = Math.max(1, Number(input.canvas.height));
  let transform: CanvasSubjectModel["transform"];

  if (input.transform.kind === "background") {
    const coverScale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
    const scale = coverScale * Math.max(0.01, input.transform.backgroundScale);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    const offsetX =
      (canvasWidth - drawnWidth) * (input.transform.backgroundPositionX / 100);
    const offsetY =
      (canvasHeight - drawnHeight) * (input.transform.backgroundPositionY / 100);
    const radians = (Number(input.transform.rotationDeg ?? 0) * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    // CSS rotates the absolutely positioned image around its own center,
    // after pan has positioned it. This is not necessarily the canvas
    // center when the image is panned or uses a non-square cover crop.
    const centerX = offsetX + drawnWidth / 2;
    const centerY = offsetY + drawnHeight / 2;
    transform = {
      kind: "background",
      a: cosine * scale,
      b: sine * scale,
      c: -sine * scale,
      d: cosine * scale,
      e:
        cosine * offsetX -
        sine * offsetY +
        centerX -
        cosine * centerX +
        sine * centerY,
      f:
        sine * offsetX +
        cosine * offsetY +
        centerY -
        sine * centerX -
        cosine * centerY,
    };
  } else {
    const scale = Math.max(0.001, input.transform.scale);
    const radians = (Number(input.transform.rotationDeg ?? 0) * Math.PI) / 180;
    const cosine = Math.cos(radians) * scale;
    const sine = Math.sin(radians) * scale;
    const centerX = input.transform.centerXPct / 100 * canvasWidth;
    const centerY = input.transform.centerYPct / 100 * canvasHeight;
    const sourceCenterX = sourceWidth / 2;
    const sourceCenterY = sourceHeight / 2;
    transform = {
      kind: "cutout",
      a: cosine,
      b: sine,
      c: -sine,
      d: cosine,
      e: centerX - cosine * sourceCenterX + sine * sourceCenterY,
      f: centerY - sine * sourceCenterX - cosine * sourceCenterY,
    };
  }

  const semanticRegions = buildSubjectSemanticRegions(input.bounds);
  return {
    version: 1,
    canvas: { width: canvasWidth, height: canvasHeight },
    source: {
      width: sourceWidth,
      height: sourceHeight,
      maskDataUrl: input.bounds.maskDataUrl,
      maskWidth: input.bounds.maskWidth,
      maskHeight: input.bounds.maskHeight,
      maskThreshold: input.bounds.maskThreshold ?? 18,
      maskSource: input.bounds.maskSource,
    },
    transform,
    silhouetteBounds: transformRect(transform, input.bounds.alpha),
    faceBounds: input.bounds.face ? transformRect(transform, input.bounds.face) : null,
    regions: semanticRegions.map((region) => ({
      ...region,
      canvasRect: transformRect(
        transform,
        percentageRectToSource(region.rectPct, sourceWidth, sourceHeight)
      ),
    })),
  };
}

export function canvasRectToPercent(rect: SubjectPixelRect, canvas: CanvasSize) {
  return {
    x: rect.x / canvas.width * 100,
    y: rect.y / canvas.height * 100,
    width: rect.width / canvas.width * 100,
    height: rect.height / canvas.height * 100,
  };
}

export function transformCanvasSubjectRect(
  model: CanvasSubjectModel,
  sourceRect: SubjectPixelRect
) {
  return transformRect(model.transform, sourceRect);
}
