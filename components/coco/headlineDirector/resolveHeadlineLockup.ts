export type HeadlineSafeZone = {
  width: number;
  height: number;
  /** Width of the selected analyzer zone in canvas-percent space. */
  widthPct?: number;
};

export type HeadlinePaintBounds = {
  width: number;
  height: number;
  lineWidths?: number[];
};

export type HeadlineLockupReason =
  | "explicit-break"
  | "single-line-fit"
  | "split-to-preserve-scale"
  | "split-required-to-fit"
  | "unavoidable-under-minimum";

export type ResolvedHeadlineLockup = {
  text: string;
  lines: string[];
  lineCount: number;
  fontSize: number;
  bounds: HeadlinePaintBounds;
  split: boolean;
  fits: boolean;
  reason: HeadlineLockupReason;
  zoneWidthPct?: number;
};

export type ResolveHeadlineLockupInput = {
  text: string;
  safeZone: HeadlineSafeZone;
  minFontSize: number;
  maxFontSize: number;
  measurePaintBounds: (text: string, fontSize: number) => HeadlinePaintBounds | null;
  /** Headline zones smaller than this are not allowed to make a lockup decision. */
  minimumZoneWidthPct?: number;
  /** Required point-size improvement before a measured two-line option can win. */
  materialSplitGain?: number;
  /** If one line already uses this much zone height, it is comfortably large. */
  comfortableSingleLineHeightUse?: number;
};

type FittedCandidate = {
  text: string;
  lines: string[];
  fontSize: number;
  bounds: HeadlinePaintBounds;
  fits: boolean;
  balance: number;
  weakBreakPenalty: number;
};

const WEAK_LINE_START = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function normalizeHeadline(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * One line is always the first candidate. Two-line alternatives are language
 * boundaries only; geometry decides whether any of them are actually used.
 */
export function headlineLineBreakVariants(value: unknown) {
  const normalized = normalizeHeadline(value);
  if (!normalized) return [];
  if (normalized.includes("\n")) return [normalized];

  const words = normalized.split(" ").filter(Boolean);
  if (words.length <= 1) return [normalized];
  const variants = [normalized];
  for (let split = 1; split < words.length; split += 1) {
    const first = words.slice(0, split).join(" ");
    const second = words.slice(split).join(" ");
    // A one-character orphan never creates an intentional display line.
    if (first.replace(/[^\p{L}\p{N}]/gu, "").length <= 1) continue;
    if (second.replace(/[^\p{L}\p{N}]/gu, "").length <= 1) continue;
    variants.push(`${first}\n${second}`);
  }
  return variants;
}

function lineWidthsForBounds(bounds: HeadlinePaintBounds, lines: string[]) {
  if (bounds.lineWidths?.length === lines.length) return bounds.lineWidths;
  // The browser caller normally provides measured line widths. This fallback
  // is only a deterministic tie-breaker; it never determines whether text fits.
  return lines.map((line) => Math.max(1, Array.from(line).length));
}

function lineBalance(bounds: HeadlinePaintBounds, lines: string[]) {
  if (lines.length <= 1) return 1;
  const widths = lineWidthsForBounds(bounds, lines);
  return Math.min(...widths) / Math.max(1, Math.max(...widths));
}

function weakBreakPenalty(lines: string[]) {
  if (lines.length <= 1) return 0;
  const firstWord = lines[1]?.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return firstWord && WEAK_LINE_START.has(firstWord) ? 1 : 0;
}

function fitCandidate(input: ResolveHeadlineLockupInput, text: string): FittedCandidate | null {
  const minFontSize = Math.max(1, Number(input.minFontSize) || 1);
  const maxFontSize = Math.max(minFontSize, Number(input.maxFontSize) || minFontSize);
  const fitsBounds = (bounds: HeadlinePaintBounds | null) =>
    Boolean(
      bounds &&
        Number.isFinite(bounds.width) &&
        Number.isFinite(bounds.height) &&
        bounds.width > 0 &&
        bounds.height > 0 &&
        bounds.width <= input.safeZone.width + 0.5 &&
        bounds.height <= input.safeZone.height + 0.5
    );

  const minimumBounds = input.measurePaintBounds(text, minFontSize);
  if (!minimumBounds) return null;
  const minimumFits = fitsBounds(minimumBounds);
  if (!minimumFits) {
    const lines = text.split("\n").filter(Boolean);
    return {
      text,
      lines,
      fontSize: minFontSize,
      bounds: minimumBounds,
      fits: false,
      balance: lineBalance(minimumBounds, lines),
      weakBreakPenalty: weakBreakPenalty(lines),
    };
  }

  let low = minFontSize;
  let high = maxFontSize;
  let bestSize = minFontSize;
  let bestBounds = minimumBounds;
  for (let iteration = 0; iteration < 20 && high - low > 0.2; iteration += 1) {
    const size = (low + high) / 2;
    const bounds = input.measurePaintBounds(text, size);
    if (!bounds) return null;
    if (fitsBounds(bounds)) {
      low = size;
      bestSize = size;
      bestBounds = bounds;
    } else {
      high = size;
    }
  }

  const fontSize = Math.floor(bestSize * 10) / 10;
  const bounds = input.measurePaintBounds(text, fontSize) ?? bestBounds;
  const lines = text.split("\n").filter(Boolean);
  return {
    text,
    lines,
    fontSize,
    bounds,
    fits: fitsBounds(bounds),
    balance: lineBalance(bounds, lines),
    weakBreakPenalty: weakBreakPenalty(lines),
  };
}

function bestTwoLineCandidate(candidates: FittedCandidate[]) {
  return candidates
    .filter((candidate) => candidate.lines.length === 2 && candidate.fits)
    .sort((a, b) => {
      const sizeDifference = b.fontSize - a.fontSize;
      if (Math.abs(sizeDifference) > 0.5) return sizeDifference;
      if (a.weakBreakPenalty !== b.weakBreakPenalty) {
        return a.weakBreakPenalty - b.weakBreakPenalty;
      }
      const balanceDifference = b.balance - a.balance;
      if (Math.abs(balanceDifference) > 0.01) return balanceDifference;
      // A slightly longer first line gives a stable poster silhouette.
      const aTopBias = a.lines[0].length - a.lines[1].length;
      const bTopBias = b.lines[0].length - b.lines[1].length;
      return bTopBias - aTopBias;
    })[0];
}

function resolved(candidate: FittedCandidate, reason: HeadlineLockupReason, widthPct?: number) {
  return {
    text: candidate.text,
    lines: candidate.lines,
    lineCount: candidate.lines.length,
    fontSize: candidate.fontSize,
    bounds: candidate.bounds,
    split: candidate.lines.length > 1,
    fits: candidate.fits,
    reason,
    zoneWidthPct: widthPct,
  } satisfies ResolvedHeadlineLockup;
}

/**
 * Resolves text only after composition has supplied a safe zone. One line is
 * retained unless it is width-limited, leaves substantial unused vertical
 * space, and a real two-line measurement produces a material scale gain.
 */
export function resolveHeadlineLockup(
  input: ResolveHeadlineLockupInput
): ResolvedHeadlineLockup | null {
  const normalized = normalizeHeadline(input.text);
  if (!normalized || input.safeZone.width <= 0 || input.safeZone.height <= 0) return null;

  const minimumZoneWidthPct = Math.max(0, input.minimumZoneWidthPct ?? 70);
  if (
    Number.isFinite(input.safeZone.widthPct) &&
    Number(input.safeZone.widthPct) + 0.01 < minimumZoneWidthPct
  ) {
    return null;
  }

  const variants = headlineLineBreakVariants(normalized);
  const candidates = variants
    .map((variant) => fitCandidate(input, variant))
    .filter((candidate): candidate is FittedCandidate => Boolean(candidate));
  if (!candidates.length) return null;

  const explicitBreak = normalized.includes("\n");
  if (explicitBreak) {
    return resolved(
      candidates[0],
      candidates[0].fits ? "explicit-break" : "unavoidable-under-minimum",
      input.safeZone.widthPct
    );
  }

  const oneLine = candidates.find((candidate) => candidate.lines.length === 1);
  const twoLine = bestTwoLineCandidate(candidates);
  if (!oneLine) {
    return twoLine
      ? resolved(twoLine, "split-required-to-fit", input.safeZone.widthPct)
      : null;
  }
  if (!oneLine.fits) {
    return twoLine
      ? resolved(twoLine, "split-required-to-fit", input.safeZone.widthPct)
      : resolved(oneLine, "unavoidable-under-minimum", input.safeZone.widthPct);
  }
  if (!twoLine) {
    return resolved(oneLine, "single-line-fit", input.safeZone.widthPct);
  }

  const materialSplitGain = Math.max(1, input.materialSplitGain ?? 1.18);
  const comfortableHeightUse = Math.max(
    0.25,
    Math.min(0.95, input.comfortableSingleLineHeightUse ?? 0.72)
  );
  const oneLineHeightUse = oneLine.bounds.height / Math.max(1, input.safeZone.height);
  const splitGain = twoLine.fontSize / Math.max(1, oneLine.fontSize);
  const splitIsMeaningfullyLarger = splitGain >= materialSplitGain;
  const oneLineIsVisuallySmallInZone = oneLineHeightUse < comfortableHeightUse;
  const splitHasAUsableSilhouette = twoLine.balance >= 0.42 && twoLine.weakBreakPenalty === 0;

  if (
    splitIsMeaningfullyLarger &&
    oneLineIsVisuallySmallInZone &&
    splitHasAUsableSilhouette
  ) {
    return resolved(twoLine, "split-to-preserve-scale", input.safeZone.widthPct);
  }
  return resolved(oneLine, "single-line-fit", input.safeZone.widthPct);
}
