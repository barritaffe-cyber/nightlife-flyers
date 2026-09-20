import {
  hexToHsl,
  hslToHex,
  normalizeHex,
  relativeLuminance,
} from "../../coco-color-director/colorMath.ts";
import type { CanvasEnvironmentCell } from "./subjectGeometry/buildCanvasEnvironmentMap.ts";

export type ZoneTextRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ZoneTextTone = "light" | "dark";

export type ZoneTextColorDecision = {
  /** An exact color supplied by paletteCandidates or currentColor. */
  fill: string;
  tone: ZoneTextTone;
  needsScrim: boolean;
  /** Palette-derived, nearly neutral separation color. Null when no scrim is needed. */
  scrimColor: string | null;
  scrimOpacity: number;
  localLuminance: number;
  localComplexity: number;
  luminanceRange: number;
  lowPercentileContrast: number;
  complexityAdjustedContrast: number;
  contrastThreshold: number;
  sampledArea: number;
  sampledCellCount: number;
};

export type ResolveZoneTextColorInput = {
  environmentCells: CanvasEnvironmentCell[];
  rect: ZoneTextRect;
  paletteCandidates: string[];
  currentColor: string;
  role: string;
  minimumContrast?: number;
  /** Defaults to the area-weighted twentieth percentile. */
  contrastPercentile?: number;
};

type WeightedValue = { value: number; weight: number };

type LocalCellSample = {
  cell: CanvasEnvironmentCell;
  weight: number;
};

type CandidateScore = {
  fill: string;
  tone: ZoneTextTone;
  lowPercentileContrast: number;
  complexityAdjustedContrast: number;
  averageContrast: number;
  score: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const finite = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

function isHexColor(value: string) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value ?? "").trim());
}

function uniqueCandidateColors(currentColor: string, paletteCandidates: string[]) {
  const colors: string[] = [];
  const seen = new Set<string>();
  for (const candidate of [currentColor, ...paletteCandidates]) {
    if (!isHexColor(candidate)) continue;
    const normalized = normalizeHex(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    colors.push(normalized);
  }
  return colors;
}

/**
 * Add restrained ink/paper companions from the image palette itself. This
 * guarantees a usable dark option on pale photography and a usable light
 * option on dark photography without falling back to unrelated black/white.
 */
export function buildZoneTextPaletteCandidates(paletteCandidates: string[]) {
  const originals = uniqueCandidateColors("", paletteCandidates);
  if (!originals.length) return [];
  const byLuminance = [...originals].sort(
    (left, right) => relativeLuminance(left) - relativeLuminance(right)
  );
  const darkest = hexToHsl(byLuminance[0]);
  const lightest = hexToHsl(byLuminance[byLuminance.length - 1]);
  const darkCompanion = hslToHex({
    h: darkest.h,
    s: Math.min(darkest.s, 0.34),
    l: Math.min(darkest.l, 0.085),
  });
  const lightCompanion = hslToHex({
    h: lightest.h,
    s: Math.min(lightest.s, 0.22),
    l: Math.max(lightest.l, 0.935),
  });
  return uniqueCandidateColors("", [...originals, darkCompanion, lightCompanion]);
}

function normalizedRect(rect: ZoneTextRect): ZoneTextRect {
  const left = Math.min(finite(rect.x), finite(rect.x) + finite(rect.width));
  const top = Math.min(finite(rect.y), finite(rect.y) + finite(rect.height));
  const right = Math.max(finite(rect.x), finite(rect.x) + finite(rect.width));
  const bottom = Math.max(finite(rect.y), finite(rect.y) + finite(rect.height));
  return {
    x: clamp(left, 0, 100),
    y: clamp(top, 0, 100),
    width: Math.max(0, clamp(right, 0, 100) - clamp(left, 0, 100)),
    height: Math.max(0, clamp(bottom, 0, 100) - clamp(top, 0, 100)),
  };
}

function overlapArea(a: ZoneTextRect, b: ZoneTextRect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function localSamples(environmentCells: CanvasEnvironmentCell[], rect: ZoneTextRect) {
  const normalized = normalizedRect(rect);
  if (normalized.width <= 0 || normalized.height <= 0) return [];
  return environmentCells.flatMap((cell): LocalCellSample[] => {
    const cellRect = {
      x: finite(cell.x),
      y: finite(cell.y),
      width: Math.max(0, finite(cell.width)),
      height: Math.max(0, finite(cell.height)),
    };
    const weight = overlapArea(normalized, cellRect);
    return weight > 0 ? [{ cell, weight }] : [];
  });
}

function weightedAverage(values: WeightedValue[], fallback: number) {
  const totalWeight = values.reduce((sum, sample) => sum + Math.max(0, sample.weight), 0);
  if (totalWeight <= 0) return fallback;
  return values.reduce(
    (sum, sample) => sum + finite(sample.value, fallback) * Math.max(0, sample.weight),
    0
  ) / totalWeight;
}

function weightedPercentile(values: WeightedValue[], percentile: number, fallback: number) {
  const sorted = values
    .filter((sample) => sample.weight > 0 && Number.isFinite(sample.value))
    .sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, sample) => sum + sample.weight, 0);
  if (!sorted.length || totalWeight <= 0) return fallback;
  const targetWeight = clamp(percentile, 0, 1) * totalWeight;
  let cumulativeWeight = 0;
  for (const sample of sorted) {
    cumulativeWeight += sample.weight;
    if (cumulativeWeight >= targetWeight) return sample.value;
  }
  return sorted[sorted.length - 1]?.value ?? fallback;
}

/**
 * Environment-map luminance is stored as display-encoded luma. Mapping it back
 * to linear light makes the contrast calculation track visual contrast much
 * more closely than comparing the encoded values directly.
 */
function environmentLuminanceToLinear(value: number) {
  const encoded = clamp(finite(value, 0.5), 0, 1);
  return encoded <= 0.03928
    ? encoded / 12.92
    : Math.pow((encoded + 0.055) / 1.055, 2.4);
}

function contrastAgainstLuminance(fillLuminance: number, backgroundLuminance: number) {
  const high = Math.max(fillLuminance, backgroundLuminance);
  const low = Math.min(fillLuminance, backgroundLuminance);
  return (high + 0.05) / (low + 0.05);
}

function contrastThresholdForRole(role: string) {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (/headline|hero|display|title/.test(normalized)) return 3.6;
  if (/price|entry|badge|compliance|date/.test(normalized)) return 4.1;
  return 4.5;
}

function toneForColor(color: string): ZoneTextTone {
  return relativeLuminance(color) >= 0.48 ? "light" : "dark";
}

function scoreCandidate(input: {
  fill: string;
  samples: LocalCellSample[];
  percentile: number;
  currentColor: string;
}): CandidateScore {
  const fillLuminance = relativeLuminance(input.fill);
  const rawContrasts: WeightedValue[] = [];
  const adjustedContrasts: WeightedValue[] = [];

  for (const sample of input.samples) {
    const backgroundLuminance = environmentLuminanceToLinear(sample.cell.luminance);
    const rawContrast = contrastAgainstLuminance(fillLuminance, backgroundLuminance);
    const complexity = clamp(finite(sample.cell.complexity, 1), 0, 1);
    const edgeDensity = clamp(finite(sample.cell.edgeDensity, complexity), 0, 1);
    const reliability = clamp(1 - complexity * 0.2 - edgeDensity * 0.08, 0.7, 1);
    rawContrasts.push({ value: rawContrast, weight: sample.weight });
    adjustedContrasts.push({ value: rawContrast * reliability, weight: sample.weight });
  }

  const lowPercentileContrast = weightedPercentile(rawContrasts, input.percentile, 1);
  const complexityAdjustedContrast = weightedPercentile(adjustedContrasts, input.percentile, 1);
  const averageContrast = weightedAverage(adjustedContrasts, 1);
  const currentBonus = normalizeHex(input.currentColor) === input.fill ? 0.01 : 0;
  const score = complexityAdjustedContrast * 0.78 + averageContrast * 0.22 + currentBonus;

  return {
    fill: input.fill,
    tone: toneForColor(input.fill),
    lowPercentileContrast,
    complexityAdjustedContrast,
    averageContrast,
    score,
  };
}

function buildPaletteDerivedScrim(
  tone: ZoneTextTone,
  paletteColors: string[]
) {
  const base = [...paletteColors].sort((a, b) => relativeLuminance(a) - relativeLuminance(b))[
    tone === "light" ? 0 : Math.max(0, paletteColors.length - 1)
  ];
  const hsl = hexToHsl(base);
  return hslToHex({
    h: hsl.h,
    s: Math.min(hsl.s, 0.18),
    l: tone === "light" ? 0.055 : 0.945,
  });
}

/**
 * Resolve a text fill after a role has reached its final position.
 *
 * The selected fill is always one of the supplied palette colors (including
 * currentColor), so this pass cannot introduce an unrelated accent. Busy or
 * mixed image regions that defeat every candidate request a subtle,
 * palette-derived scrim; this resolver never recommends a text stroke.
 */
export function resolveZoneTextColor(
  input: ResolveZoneTextColorInput
): ZoneTextColorDecision {
  const colors = uniqueCandidateColors(input.currentColor, input.paletteCandidates);
  if (!colors.length) {
    throw new Error("resolveZoneTextColor requires at least one valid palette or current color");
  }

  const samples = localSamples(input.environmentCells, input.rect);
  const contrastThreshold = clamp(
    finite(input.minimumContrast ?? contrastThresholdForRole(input.role), 4.5),
    1,
    21
  );
  const percentile = clamp(finite(input.contrastPercentile ?? 0.2, 0.2), 0.05, 0.5);
  const sampledArea = samples.reduce((sum, sample) => sum + sample.weight, 0);
  const localLuminance = weightedAverage(
    samples.map((sample) => ({ value: sample.cell.luminance, weight: sample.weight })),
    0.5
  );
  const localComplexity = weightedAverage(
    samples.map((sample) => ({ value: sample.cell.complexity, weight: sample.weight })),
    0
  );
  const luminances = samples.map((sample) => ({
    value: clamp(finite(sample.cell.luminance, 0.5), 0, 1),
    weight: sample.weight,
  }));
  const luminanceRange = Math.max(
    0,
    weightedPercentile(luminances, 0.9, localLuminance) -
      weightedPercentile(luminances, 0.1, localLuminance)
  );

  if (!samples.length) {
    const fill = colors[0];
    return {
      fill,
      tone: toneForColor(fill),
      needsScrim: false,
      scrimColor: null,
      scrimOpacity: 0,
      localLuminance,
      localComplexity,
      luminanceRange,
      lowPercentileContrast: 1,
      complexityAdjustedContrast: 1,
      contrastThreshold,
      sampledArea,
      sampledCellCount: 0,
    };
  }

  const candidates = colors
    .map((fill) => scoreCandidate({
      fill,
      samples,
      percentile,
      currentColor: input.currentColor,
    }))
    .sort((a, b) => b.score - a.score);
  const chosen = candidates[0];
  const needsScrim = chosen.complexityAdjustedContrast < contrastThreshold;
  const contrastShortfall = clamp(
    (contrastThreshold - chosen.complexityAdjustedContrast) / contrastThreshold,
    0,
    1
  );
  const mixedness = clamp(luminanceRange / 0.62, 0, 1);
  const scrimOpacity = needsScrim
    ? Number(clamp(
        0.14 + contrastShortfall * 0.22 + localComplexity * 0.08 + mixedness * 0.06,
        0.16,
        0.5
      ).toFixed(3))
    : 0;

  return {
    fill: chosen.fill,
    tone: chosen.tone,
    needsScrim,
    scrimColor: needsScrim ? buildPaletteDerivedScrim(chosen.tone, colors) : null,
    scrimOpacity,
    localLuminance,
    localComplexity,
    luminanceRange,
    lowPercentileContrast: chosen.lowPercentileContrast,
    complexityAdjustedContrast: chosen.complexityAdjustedContrast,
    contrastThreshold,
    sampledArea,
    sampledCellCount: samples.length,
  };
}
