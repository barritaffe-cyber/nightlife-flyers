const MIN_VISIBLE_ALPHA = 12 / 255;
const MIN_SCREEN_CONTRIBUTION = 9 / 255;

export type VisiblePixelInput = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
  opacity?: number;
  blendMode?: string;
};

export type VisiblePixelEnvelopeInput = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  x: number;
  y: number;
  opacity?: number;
  blendMode?: string;
};

const clampByte = (value: number) => Math.max(0, Math.min(255, Number(value) || 0));
const clampUnit = (value: number) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Decides whether an image pixel contributes enough visible paint to be a
 * canvas selection target. Screen/additive assets need luminance as well as
 * alpha because their opaque black pixels are visually transparent.
 */
export function isVisibleAssetPixel({
  red,
  green,
  blue,
  alpha,
  opacity = 1,
  blendMode = "normal",
}: VisiblePixelInput): boolean {
  const effectiveAlpha = (clampByte(alpha) / 255) * clampUnit(opacity);
  if (effectiveAlpha < MIN_VISIBLE_ALPHA) return false;

  const mode = String(blendMode || "normal").toLowerCase();
  if (
    mode === "screen" ||
    mode === "lighten" ||
    mode === "color-dodge" ||
    mode === "plus-lighter"
  ) {
    const luminance = Math.max(clampByte(red), clampByte(green), clampByte(blue)) / 255;
    return effectiveAlpha * luminance >= MIN_SCREEN_CONTRIBUTION;
  }

  if (mode === "multiply" || mode === "darken" || mode === "color-burn") {
    const darkness = 1 - Math.min(clampByte(red), clampByte(green), clampByte(blue)) / 255;
    return effectiveAlpha * darkness >= MIN_SCREEN_CONTRIBUTION;
  }

  return true;
}

/**
 * Treats transparent pixels inside the tight outer perimeter of visible
 * paint as part of the same selection target. This is intended for hollow
 * frames, rings, and sparse logos: transparent margins outside the artwork's
 * visible-pixel bounds remain click-through, while the enclosed center stays
 * easy to select.
 */
export function isInsideVisiblePixelEnvelope({
  data,
  width,
  height,
  x,
  y,
  opacity = 1,
  blendMode = "normal",
}: VisiblePixelEnvelopeInput): boolean {
  const pixelWidth = Math.max(0, Math.floor(width));
  const pixelHeight = Math.max(0, Math.floor(height));
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (
    pixelWidth < 1 ||
    pixelHeight < 1 ||
    px < 0 ||
    px >= pixelWidth ||
    py < 0 ||
    py >= pixelHeight ||
    data.length < pixelWidth * pixelHeight * 4
  ) {
    return false;
  }

  const visibleAt = (sampleX: number, sampleY: number) => {
    const index = (sampleY * pixelWidth + sampleX) * 4;
    return isVisibleAssetPixel({
      red: data[index],
      green: data[index + 1],
      blue: data[index + 2],
      alpha: data[index + 3],
      opacity,
      blendMode,
    });
  };

  if (visibleAt(px, py)) return true;

  let minX = pixelWidth;
  let maxX = -1;
  let minY = pixelHeight;
  let maxY = -1;
  for (let sampleY = 0; sampleY < pixelHeight; sampleY += 1) {
    for (let sampleX = 0; sampleX < pixelWidth; sampleX += 1) {
      if (!visibleAt(sampleX, sampleY)) continue;
      minX = Math.min(minX, sampleX);
      maxX = Math.max(maxX, sampleX);
      minY = Math.min(minY, sampleY);
      maxY = Math.max(maxY, sampleY);
    }
  }
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}
