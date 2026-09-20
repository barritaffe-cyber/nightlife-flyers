export const COCO_PRICE_BADGE_INNER_RATIO = 0.62;

type CocoPriceBadgeFitInput = {
  diameterPx: number;
  fontFamily?: string;
  lineHeight?: number;
  measureLineWidth?: (line: string, fontSize: number) => number;
  requestedSize: number;
  text: string;
};

function fallbackLineWidthUnits(line: string, fontFamily: string): number {
  const familyScale = /bebas|antonio|condensed/i.test(fontFamily) ? 0.88 : 1;
  const units = Array.from(line || " ").reduce((sum, character) => {
    if (/\s/.test(character)) return sum + 0.32;
    if (/[ilI1|!]/.test(character)) return sum + 0.34;
    if (/[mwMW@%&#]/.test(character)) return sum + 0.9;
    if (/[A-Z0-9$]/.test(character)) return sum + 0.64;
    return sum + 0.58;
  }, 0);
  return Math.max(0.5, units * familyScale);
}

/**
 * Caps the badge copy to the circle's inner safe area. The function never
 * enlarges a user-selected size; it only supplies a final rendered maximum.
 */
export function fitCocoPriceBadgeFontSize({
  diameterPx,
  fontFamily = "LEMONMILK-Medium",
  lineHeight = 0.8,
  measureLineWidth,
  requestedSize,
  text,
}: CocoPriceBadgeFitInput): number {
  const safeRequestedSize = Math.max(1, Number(requestedSize) || 1);
  const safeDiameter = Math.max(1, Number(diameterPx) || 1);
  const lines = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return safeRequestedSize;

  const innerDiameter = safeDiameter * COCO_PRICE_BADGE_INNER_RATIO;
  const measuredWidthUnits = lines.reduce((widest, line) => {
    const measuredAt100 = measureLineWidth?.(line, 100);
    const units = Number.isFinite(measuredAt100) && Number(measuredAt100) > 0
      ? Number(measuredAt100) / 100
      : fallbackLineWidthUnits(line, fontFamily);
    return Math.max(widest, units);
  }, 0.5);
  const safeLineHeight = Math.max(0.55, Math.min(1.4, Number(lineHeight) || 0.8));
  // First-line glyph height plus the CSS baseline advance for later lines.
  const blockHeightUnits = 0.9 + Math.max(0, lines.length - 1) * safeLineHeight;
  const opticalReserve = 0.94;
  const widthCap = innerDiameter / measuredWidthUnits * opticalReserve;
  const heightCap = innerDiameter / blockHeightUnits * opticalReserve;
  const fitted = Math.min(safeRequestedSize, widthCap, heightCap);

  return Math.max(1, Math.floor(fitted * 100) / 100);
}
