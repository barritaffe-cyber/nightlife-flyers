/*
 * Strict Auto Layout Subject Pipeline
 *
 * Auto Layout should not quietly guess subject placement when subject identity,
 * current placement, rendered bounds, director coordinates, visible pixels, or
 * canvas size are missing. This module throws clear errors instead.
 */
import {
  analyzeVisiblePixels,
  type CanvasSize,
  type RectPct,
  type RectPx,
  type RenderedSubjectBoundsPct,
  type VisiblePixelAnalysis,
} from "./visiblePixelSubjectPlacement";

export type { CanvasSize, RectPct, RectPx, VisiblePixelAnalysis };

export type SubjectPlacement = {
  x: number;
  y: number;
  scale: number;
};

export type StrictSubjectInput = {
  imageUrl?: string | null;
  placement?: SubjectPlacement | null;
  renderedBounds?: RenderedSubjectBoundsPct | null;
  id?: string;
};

export type CoordinatePlanLike = {
  subjectVisibleRect?: RectPct | null;
  zones?: Record<string, RectPct | undefined>;
};

export type StrictAutoLayoutInput = {
  subject: StrictSubjectInput;
  coordinatePlan: CoordinatePlanLike;
  canvasSize: CanvasSize;
  placementMode?: "center" | "topLeft";
  baseScaleMode?: "canvasHeight" | "canvasWidth" | "naturalPixels";
  alphaThreshold?: number;
  fitPadding?: number;
  minScale?: number;
  maxScale?: number;
};

export type StrictSubjectPatch = {
  x: number;
  y: number;
  scale: number;
  debug: {
    subjectId?: string;
    desiredVisibleRectPct: RectPct;
    desiredVisibleRectPx: RectPx;
    visiblePixelAnalysis: VisiblePixelAnalysis;
    currentFullImageRectPx: RectPx;
    currentVisibleRectPx: RectPx;
    nextFullImageRectPx: RectPx;
    nextVisibleRectPx: RectPx;
    widthRatio: number;
    heightRatio: number;
    scaleRatio: number;
  };
};

export async function computeStrictSubjectAutoLayoutPatch(
  input: StrictAutoLayoutInput
): Promise<StrictSubjectPatch> {
  assertCanvasSize(input.canvasSize);
  assertSubjectReady(input.subject);
  assertCoordinatePlanReady(input.coordinatePlan);

  const image = await loadImageStrict(input.subject.imageUrl);
  const visiblePixelAnalysis = analyzeVisiblePixelsStrict(image, {
    alphaThreshold: input.alphaThreshold ?? 28,
  });
  assertVisiblePixelAnalysis(visiblePixelAnalysis);

  const patch = computePatchFromAnalysis({
    analysis: visiblePixelAnalysis,
    desiredVisibleRectPct: input.coordinatePlan.subjectVisibleRect,
    currentPlacement: input.subject.placement,
    renderedBounds: input.subject.renderedBounds,
    canvasSize: input.canvasSize,
    placementMode: input.placementMode ?? "center",
    fitPadding: input.fitPadding ?? 0.92,
    minScale: input.minScale ?? 0.05,
    maxScale: input.maxScale ?? 5,
  });

  return {
    ...patch,
    debug: {
      subjectId: input.subject.id,
      ...patch.debug,
    },
  };
}

export function assertSubjectReady(subject?: StrictSubjectInput | null): asserts subject is {
  imageUrl: string;
  placement: SubjectPlacement;
  renderedBounds: RenderedSubjectBoundsPct;
  id?: string;
} {
  if (!subject) {
    throw new Error("Auto Layout failed: missing subject object.");
  }

  if (!subject.imageUrl || typeof subject.imageUrl !== "string") {
    throw new Error("Auto Layout failed: subject.imageUrl is missing. Cannot analyze visible pixels.");
  }

  if (!subject.placement) {
    throw new Error("Auto Layout failed: subject.placement is missing. Cannot convert director coordinates to object x/y/scale.");
  }

  assertPlacement(subject.placement, "subject.placement");

  if (!subject.renderedBounds) {
    throw new Error("Auto Layout failed: subject.renderedBounds is missing. Cannot solve from current rendered bounds.");
  }

  assertRenderedBounds(subject.renderedBounds, "subject.renderedBounds");
}

export function assertCoordinatePlanReady(plan?: CoordinatePlanLike | null): asserts plan is {
  subjectVisibleRect: RectPct;
  zones?: Record<string, RectPct | undefined>;
} {
  if (!plan) {
    throw new Error("Auto Layout failed: coordinate plan is missing.");
  }

  if (!plan.subjectVisibleRect) {
    throw new Error("Auto Layout failed: coordinatePlan.subjectVisibleRect is missing. Coordinate Director did not provide subject coordinates.");
  }

  assertRectPct(plan.subjectVisibleRect, "coordinatePlan.subjectVisibleRect");
}

export function assertCanvasSize(size?: CanvasSize | null): asserts size is CanvasSize {
  if (!size) {
    throw new Error("Auto Layout failed: canvasSize is missing.");
  }

  if (!Number.isFinite(size.width) || size.width <= 0) {
    throw new Error(`Auto Layout failed: invalid canvas width '${String(size.width)}'.`);
  }

  if (!Number.isFinite(size.height) || size.height <= 0) {
    throw new Error(`Auto Layout failed: invalid canvas height '${String(size.height)}'.`);
  }
}

export function analyzeVisiblePixelsStrict(
  image: HTMLImageElement,
  options: { alphaThreshold?: number } = {}
): VisiblePixelAnalysis {
  try {
    return analyzeVisiblePixels(image, options.alphaThreshold ?? 28);
  } catch (error) {
    const alphaThreshold = options.alphaThreshold ?? 28;
    const message = error instanceof Error ? error.message : "";
    if (message === "No visible pixels found") {
      throw new Error(
        `Visible pixel analysis failed: no alpha pixels above threshold ${alphaThreshold}. Remove fallback. Check subject PNG transparency or lower alphaThreshold.`
      );
    }
    throw error;
  }
}

export function assertVisiblePixelAnalysis(analysis: VisiblePixelAnalysis): void {
  if (!analysis.visiblePixelCount || analysis.visiblePixelCount <= 0) {
    throw new Error("Auto Layout failed: visible pixel analysis found no visible subject pixels. Check PNG alpha or image URL.");
  }

  if (analysis.visibleBoundsNorm.width <= 0 || analysis.visibleBoundsNorm.height <= 0) {
    throw new Error("Auto Layout failed: visible subject bounds are empty.");
  }

  if (analysis.visiblePixelRatio < 0.002) {
    throw new Error(
      `Auto Layout failed: visible pixel ratio is too low (${analysis.visiblePixelRatio.toFixed(4)}). Subject cutout may be empty, too small, or alpha threshold is too high.`
    );
  }
}

export async function applyStrictAutoLayoutToStore(input: {
  subject: StrictSubjectInput;
  coordinatePlan: CoordinatePlanLike;
  canvasSize: CanvasSize;
  store: {
    updatePortrait: (format: string, targetId: string, patch: { x: number; y: number; scale: number }) => void;
  };
  format: string;
  targetId: string;
  placementMode?: "center" | "topLeft";
  baseScaleMode?: "canvasHeight" | "canvasWidth" | "naturalPixels";
}): Promise<StrictSubjectPatch> {
  const patch = await computeStrictSubjectAutoLayoutPatch({
    subject: input.subject,
    coordinatePlan: input.coordinatePlan,
    canvasSize: input.canvasSize,
    placementMode: input.placementMode ?? "center",
  });

  input.store.updatePortrait(input.format, input.targetId, {
    x: patch.x,
    y: patch.y,
    scale: patch.scale,
  });

  return patch;
}

function computePatchFromAnalysis(input: {
  analysis: VisiblePixelAnalysis;
  desiredVisibleRectPct: RectPct;
  currentPlacement: SubjectPlacement;
  renderedBounds: RenderedSubjectBoundsPct;
  canvasSize: CanvasSize;
  placementMode: "center" | "topLeft";
  fitPadding: number;
  minScale: number;
  maxScale: number;
}): StrictSubjectPatch {
  const desiredVisibleRectPx = pctRectToPx(input.desiredVisibleRectPct, input.canvasSize);
  const currentFullImageRectPx = renderedPctToFullImageRect(input.renderedBounds, input.canvasSize);
  const currentVisibleRectPx = visibleNormRectToCanvasRect(
    currentFullImageRectPx,
    input.analysis.visibleBoundsNorm
  );
  const widthRatio = desiredVisibleRectPx.width / Math.max(1, currentVisibleRectPx.width);
  const heightRatio = desiredVisibleRectPx.height / Math.max(1, currentVisibleRectPx.height);
  const scaleRatio = clamp(Math.min(widthRatio, heightRatio) * input.fitPadding, 0.05, 8);
  const nextScale = clamp(input.currentPlacement.scale * scaleRatio, input.minScale, input.maxScale);
  const sizeRatio = nextScale / Math.max(0.001, input.currentPlacement.scale);
  const nextFullWidth = Math.max(1, currentFullImageRectPx.width) * sizeRatio;
  const nextFullHeight = Math.max(1, currentFullImageRectPx.height) * sizeRatio;

  const visibleCenterInFullImage = {
    x: input.analysis.visibleCenterNorm.x * nextFullWidth,
    y: input.analysis.visibleCenterNorm.y * nextFullHeight,
  };
  const desiredVisibleCenter = {
    x: desiredVisibleRectPx.x + desiredVisibleRectPx.width / 2,
    y: desiredVisibleRectPx.y + desiredVisibleRectPx.height / 2,
  };
  const nextFullImageRectPx: RectPx = {
    x: desiredVisibleCenter.x - visibleCenterInFullImage.x,
    y: desiredVisibleCenter.y - visibleCenterInFullImage.y,
    width: nextFullWidth,
    height: nextFullHeight,
  };
  const nextVisibleRectPx = visibleNormRectToCanvasRect(
    nextFullImageRectPx,
    input.analysis.visibleBoundsNorm
  );
  const nextXY = fullImageRectToPlacementXY({
    fullImageRectPx: nextFullImageRectPx,
    canvasSize: input.canvasSize,
    placementMode: input.placementMode,
  });

  return {
    x: clamp(nextXY.x, 0, 100),
    y: clamp(nextXY.y, 0, 100),
    scale: nextScale,
    debug: {
      desiredVisibleRectPct: input.desiredVisibleRectPct,
      desiredVisibleRectPx,
      visiblePixelAnalysis: input.analysis,
      currentFullImageRectPx,
      currentVisibleRectPx,
      nextFullImageRectPx,
      nextVisibleRectPx,
      widthRatio,
      heightRatio,
      scaleRatio,
    },
  };
}

function assertPlacement(placement: SubjectPlacement, label: string): void {
  if (!Number.isFinite(placement.x)) {
    throw new Error(`Auto Layout failed: ${label}.x is invalid.`);
  }

  if (!Number.isFinite(placement.y)) {
    throw new Error(`Auto Layout failed: ${label}.y is invalid.`);
  }

  if (!Number.isFinite(placement.scale) || placement.scale <= 0) {
    throw new Error(`Auto Layout failed: ${label}.scale is invalid.`);
  }
}

function assertRenderedBounds(bounds: RenderedSubjectBoundsPct, label: string): void {
  if (![bounds.centerX, bounds.centerY, bounds.width, bounds.height].every(Number.isFinite)) {
    throw new Error(`Auto Layout failed: ${label} contains non-numeric values.`);
  }

  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error(`Auto Layout failed: ${label} must have positive width and height.`);
  }
}

function assertRectPct(rect: RectPct, label: string): void {
  const values = [rect.x, rect.y, rect.width, rect.height];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error(`Auto Layout failed: ${label} contains non-numeric values.`);
  }

  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error(`Auto Layout failed: ${label} must have positive width and height.`);
  }

  if (rect.width > 100 || rect.height > 100) {
    throw new Error(`Auto Layout failed: ${label} is too large. Width/height should be percentages from 0-100.`);
  }
}

function renderedPctToFullImageRect(rect: RenderedSubjectBoundsPct, canvasSize: CanvasSize): RectPx {
  return {
    x: ((rect.centerX - rect.width / 2) / 100) * canvasSize.width,
    y: ((rect.centerY - rect.height / 2) / 100) * canvasSize.height,
    width: (rect.width / 100) * canvasSize.width,
    height: (rect.height / 100) * canvasSize.height,
  };
}

function fullImageRectToPlacementXY(input: {
  fullImageRectPx: RectPx;
  canvasSize: CanvasSize;
  placementMode: "center" | "topLeft";
}): { x: number; y: number } {
  if (input.placementMode === "center") {
    return {
      x: ((input.fullImageRectPx.x + input.fullImageRectPx.width / 2) / input.canvasSize.width) * 100,
      y: ((input.fullImageRectPx.y + input.fullImageRectPx.height / 2) / input.canvasSize.height) * 100,
    };
  }

  return {
    x: (input.fullImageRectPx.x / input.canvasSize.width) * 100,
    y: (input.fullImageRectPx.y / input.canvasSize.height) * 100,
  };
}

function visibleNormRectToCanvasRect(fullImageRect: RectPx, visibleNorm: RectPx): RectPx {
  return {
    x: fullImageRect.x + visibleNorm.x * fullImageRect.width,
    y: fullImageRect.y + visibleNorm.y * fullImageRect.height,
    width: visibleNorm.width * fullImageRect.width,
    height: visibleNorm.height * fullImageRect.height,
  };
}

function pctRectToPx(rect: RectPct, canvasSize: CanvasSize): RectPx {
  return {
    x: (rect.x / 100) * canvasSize.width,
    y: (rect.y / 100) * canvasSize.height,
    width: (rect.width / 100) * canvasSize.width,
    height: (rect.height / 100) * canvasSize.height,
  };
}

function loadImageStrict(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) {
        reject(new Error(`Auto Layout failed: loaded image has invalid dimensions: ${src}`));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Auto Layout failed: could not load subject image: ${src}`));
    img.src = src;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
