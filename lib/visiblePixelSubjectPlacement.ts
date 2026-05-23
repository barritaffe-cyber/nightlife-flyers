export type CanvasSize = {
  width: number;
  height: number;
};

export type RectPx = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RectPct = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PointPx = {
  x: number;
  y: number;
};

export type PointNorm = {
  x: number;
  y: number;
};

export type AppPlacement = {
  x: number;
  y: number;
  scale: number;
};

export type RenderedSubjectBoundsPct = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type VisiblePixelAnalysis = {
  imageWidth: number;
  imageHeight: number;
  visibleBoundsPx: RectPx;
  visibleBoundsNorm: RectPx;
  visibleCenterPx: PointPx;
  visibleCenterNorm: PointNorm;
  visiblePixelCount: number;
  visiblePixelRatio: number;
  densityInsideVisibleBounds: number;
  transparentPaddingNorm: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};

export type ComputeVisiblePixelPatchInput = {
  imageUrl: string;
  desiredVisibleRectPct: RectPct;
  currentPlacement: AppPlacement;
  canvasSize: CanvasSize;
  placementMode?: "center" | "topLeft";
  currentRenderedFullImageRectPct?: RenderedSubjectBoundsPct | null;
  alphaThreshold?: number;
  fitPadding?: number;
  minScale?: number;
  maxScale?: number;
};

export type VisiblePixelPatch = {
  x: number;
  y: number;
  scale: number;
  debug: {
    analysis: VisiblePixelAnalysis;
    desiredVisibleRectPx: RectPx;
    currentFullImageRectPx: RectPx;
    currentVisibleRectPx: RectPx;
    nextFullImageRectPx: RectPx;
    nextVisibleRectPx: RectPx;
    widthRatio: number;
    heightRatio: number;
    scaleRatio: number;
  };
};

export function assertSubjectReady(input: {
  imageUrl?: string | null;
  currentPlacement?: AppPlacement | null;
  renderedBounds?: RenderedSubjectBoundsPct | null;
  visiblePixelAnalysis?: VisiblePixelAnalysis | null;
}): asserts input is {
  imageUrl: string;
  currentPlacement: AppPlacement;
  renderedBounds: RenderedSubjectBoundsPct;
  visiblePixelAnalysis: VisiblePixelAnalysis;
} {
  if (!String(input.imageUrl || "").trim()) {
    throw new Error("Missing subject imageUrl");
  }
  if (!isValidPlacement(input.currentPlacement)) {
    throw new Error("Missing current subject placement");
  }
  if (!isValidRenderedBounds(input.renderedBounds)) {
    throw new Error("Missing rendered subject bounds");
  }
  if (!input.visiblePixelAnalysis?.visiblePixelCount) {
    throw new Error("No visible pixels found");
  }
}

export async function computeVisiblePixelSubjectPatch(
  input: ComputeVisiblePixelPatchInput
): Promise<VisiblePixelPatch> {
  if (!String(input.imageUrl || "").trim()) {
    throw new Error("Missing subject imageUrl");
  }
  if (!isValidPlacement(input.currentPlacement)) {
    throw new Error("Missing current subject placement");
  }
  if (!isValidRenderedBounds(input.currentRenderedFullImageRectPct)) {
    throw new Error("Missing rendered subject bounds");
  }

  const image = await loadImage(input.imageUrl);
  const analysis = analyzeVisiblePixels(image, input.alphaThreshold ?? 28);
  const subject = {
    imageUrl: input.imageUrl,
    currentPlacement: input.currentPlacement,
    renderedBounds: input.currentRenderedFullImageRectPct,
    visiblePixelAnalysis: analysis,
  };
  assertSubjectReady(subject);

  const canvasSize = input.canvasSize;
  const placementMode = input.placementMode ?? "center";
  const fitPadding = input.fitPadding ?? 0.92;
  const minScale = input.minScale ?? 0.05;
  const maxScale = input.maxScale ?? 5;
  const desiredVisibleRectPx = pctRectToPx(input.desiredVisibleRectPct, canvasSize);
  const currentFullImageRectPx = renderedPctToFullImageRect(subject.renderedBounds, canvasSize);
  const currentVisibleRectPx = visibleNormRectToCanvasRect(currentFullImageRectPx, subject.visiblePixelAnalysis.visibleBoundsNorm);
  const widthRatio = desiredVisibleRectPx.width / Math.max(1, currentVisibleRectPx.width);
  const heightRatio = desiredVisibleRectPx.height / Math.max(1, currentVisibleRectPx.height);
  const scaleRatio = clamp(Math.min(widthRatio, heightRatio) * fitPadding, 0.05, 8);
  const nextScale = clamp(subject.currentPlacement.scale * scaleRatio, minScale, maxScale);
  const currentFullWidth = Math.max(1, currentFullImageRectPx.width);
  const currentFullHeight = Math.max(1, currentFullImageRectPx.height);
  const nextFullWidth = currentFullWidth * (nextScale / Math.max(0.001, subject.currentPlacement.scale));
  const nextFullHeight = currentFullHeight * (nextScale / Math.max(0.001, subject.currentPlacement.scale));
  const visibleCenterInFullImagePx = {
    x: subject.visiblePixelAnalysis.visibleCenterNorm.x * nextFullWidth,
    y: subject.visiblePixelAnalysis.visibleCenterNorm.y * nextFullHeight,
  };
  const desiredVisibleCenterPx = {
    x: desiredVisibleRectPx.x + desiredVisibleRectPx.width / 2,
    y: desiredVisibleRectPx.y + desiredVisibleRectPx.height / 2,
  };
  const nextFullImageTopLeftPx = {
    x: desiredVisibleCenterPx.x - visibleCenterInFullImagePx.x,
    y: desiredVisibleCenterPx.y - visibleCenterInFullImagePx.y,
  };
  const nextFullImageRectPx: RectPx = {
    x: nextFullImageTopLeftPx.x,
    y: nextFullImageTopLeftPx.y,
    width: nextFullWidth,
    height: nextFullHeight,
  };
  const nextVisibleRectPx = visibleNormRectToCanvasRect(nextFullImageRectPx, subject.visiblePixelAnalysis.visibleBoundsNorm);
  const appXY = fullImageRectToPlacementXY({
    fullImageRectPx: nextFullImageRectPx,
    canvasSize,
    placementMode,
  });

  return {
    x: clamp(appXY.x, 0, 100),
    y: clamp(appXY.y, 0, 100),
    scale: nextScale,
    debug: {
      analysis: subject.visiblePixelAnalysis,
      desiredVisibleRectPx,
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

export function analyzeVisiblePixels(image: HTMLImageElement, alphaThreshold = 28): VisiblePixelAnalysis {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) {
    throw new Error("No visible pixels found");
  }
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas context.");

  ctx.clearRect(0, 0, imageWidth, imageHeight);
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

  const data = ctx.getImageData(0, 0, imageWidth, imageHeight).data;
  let minX = imageWidth;
  let minY = imageHeight;
  let maxX = -1;
  let maxY = -1;
  let visiblePixelCount = 0;
  let sumX = 0;
  let sumY = 0;
  let totalAlphaWeight = 0;

  for (let y = 0; y < imageHeight; y += 1) {
    for (let x = 0; x < imageWidth; x += 1) {
      const index = (y * imageWidth + x) * 4;
      const alpha = data[index + 3];
      if (alpha <= alphaThreshold) continue;

      const weight = alpha / 255;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      visiblePixelCount += 1;
      sumX += x * weight;
      sumY += y * weight;
      totalAlphaWeight += weight;
    }
  }

  if (visiblePixelCount === 0 || maxX < minX || maxY < minY || totalAlphaWeight <= 0) {
    throw new Error("No visible pixels found");
  }

  const visibleBoundsPx: RectPx = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
  const visibleBoundsNorm: RectPx = {
    x: visibleBoundsPx.x / imageWidth,
    y: visibleBoundsPx.y / imageHeight,
    width: visibleBoundsPx.width / imageWidth,
    height: visibleBoundsPx.height / imageHeight,
  };
  const visibleCenterPx: PointPx = {
    x: sumX / totalAlphaWeight,
    y: sumY / totalAlphaWeight,
  };
  const visibleCenterNorm: PointNorm = {
    x: visibleCenterPx.x / imageWidth,
    y: visibleCenterPx.y / imageHeight,
  };
  const visiblePixelRatio = visiblePixelCount / (imageWidth * imageHeight);
  const visibleBoundsPixelArea = visibleBoundsPx.width * visibleBoundsPx.height;
  const densityInsideVisibleBounds = visiblePixelCount / Math.max(1, visibleBoundsPixelArea);

  return {
    imageWidth,
    imageHeight,
    visibleBoundsPx,
    visibleBoundsNorm,
    visibleCenterPx,
    visibleCenterNorm,
    visiblePixelCount,
    visiblePixelRatio,
    densityInsideVisibleBounds,
    transparentPaddingNorm: {
      left: visibleBoundsNorm.x,
      right: 1 - (visibleBoundsNorm.x + visibleBoundsNorm.width),
      top: visibleBoundsNorm.y,
      bottom: 1 - (visibleBoundsNorm.y + visibleBoundsNorm.height),
    },
  };
}

export function designerSubjectRectPct(input?: {
  style?: "red_only_center_hero" | "miami_luxe" | "neon_club" | "editorial" | "default";
  crop?: "closeup" | "half_body" | "three_quarter" | "full_body";
  side?: "center" | "left" | "right";
  solverRect?: {
    centerX?: number;
    centerY?: number;
    width?: number;
    height?: number;
  } | null;
}): RectPct {
  const style = input?.style ?? "red_only_center_hero";
  const crop = input?.crop ?? "three_quarter";
  const side = input?.side ?? "center";
  const solver = input?.solverRect;

  let rect: RectPct;
  if (style === "red_only_center_hero") {
    const width = crop === "closeup" ? 40 : crop === "half_body" ? 37 : crop === "full_body" ? 30 : 34;
    const height = crop === "closeup" ? 45 : crop === "half_body" ? 52 : crop === "full_body" ? 62 : 58;
    const centerX = side === "left" ? 44 : side === "right" ? 56 : 50;
    rect = { x: centerX - width / 2, y: 20, width, height };
  } else if (style === "miami_luxe") {
    const width = crop === "closeup" ? 37 : 33;
    const height = crop === "closeup" ? 44 : 54;
    const centerX = side === "left" ? 44 : side === "right" ? 56 : 50;
    rect = { x: centerX - width / 2, y: 22, width, height };
  } else if (style === "neon_club") {
    rect = { x: 27, y: 16, width: 46, height: 65 };
  } else if (style === "editorial") {
    rect = { x: side === "left" ? 12 : 55, y: 22, width: 32, height: 58 };
  } else {
    rect = { x: 30, y: 20, width: 40, height: 58 };
  }

  if (!solver) return rect;

  const solverCenterX = numberOr(solver.centerX, rect.x + rect.width / 2);
  const solverCenterY = numberOr(solver.centerY, rect.y + rect.height / 2);
  const width = Math.min(rect.width, numberOr(solver.width, rect.width));
  const height = Math.min(rect.height, numberOr(solver.height, rect.height));

  return {
    x: clamp(solverCenterX - width / 2, 0, 100 - width),
    y: clamp(solverCenterY - height / 2, 6, 100 - height),
    width,
    height,
  };
}

function renderedPctToFullImageRect(
  rect: RenderedSubjectBoundsPct,
  canvasSize: CanvasSize
): RectPx {
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isValidPlacement(value: AppPlacement | null | undefined): value is AppPlacement {
  return (
    !!value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.scale) &&
    value.scale > 0
  );
}

function isValidRenderedBounds(value: RenderedSubjectBoundsPct | null | undefined): value is RenderedSubjectBoundsPct {
  return (
    !!value &&
    Number.isFinite(value.centerX) &&
    Number.isFinite(value.centerY) &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  );
}
