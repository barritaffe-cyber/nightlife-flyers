import type { SubjectPixelRect } from "./buildSubjectSemanticRegions.ts";

export type EnvironmentRelativeRegion =
  | "above-subject"
  | "left-of-subject"
  | "right-of-subject"
  | "subject-overlay"
  | "footer"
  | "open-background";

export type CanvasEnvironmentCell = {
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  luminance: number;
  complexity: number;
  edgeDensity: number;
  negativeSpace: number;
  edgePressure: number;
  lightTextReadability: number;
  darkTextReadability: number;
  relativeRegion: EnvironmentRelativeRegion;
};

export type CanvasEnvironmentMap = {
  columns: number;
  rows: number;
  cells: CanvasEnvironmentCell[];
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function luminanceAt(rgba: Uint8ClampedArray, index: number) {
  const offset = index * 4;
  const red = (rgba[offset] ?? 0) / 255;
  const green = (rgba[offset + 1] ?? 0) / 255;
  const blue = (rgba[offset + 2] ?? 0) / 255;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function relativeRegion(
  x: number,
  y: number,
  subject: SubjectPixelRect | null
): EnvironmentRelativeRegion {
  if (y >= 84) return "footer";
  if (!subject) return "open-background";
  const centerX = x + 0.5;
  const centerY = y + 0.5;
  if (centerY < subject.y) return "above-subject";
  if (centerX < subject.x) return "left-of-subject";
  if (centerX > subject.x + subject.width) return "right-of-subject";
  if (centerY <= subject.y + subject.height) return "subject-overlay";
  return "open-background";
}

export function buildCanvasEnvironmentMap(input: {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  columns?: number;
  rows?: number;
  subjectBoundsPct?: SubjectPixelRect | null;
}): CanvasEnvironmentMap {
  const width = Math.max(1, Math.floor(input.width));
  const height = Math.max(1, Math.floor(input.height));
  const columns = Math.max(8, Math.floor(input.columns ?? 24));
  const rows = Math.max(8, Math.floor(input.rows ?? Math.round(columns * height / width)));
  const cells: CanvasEnvironmentCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = Math.floor(column * width / columns);
      const right = Math.max(left + 1, Math.floor((column + 1) * width / columns));
      const top = Math.floor(row * height / rows);
      const bottom = Math.max(top + 1, Math.floor((row + 1) * height / rows));
      let sum = 0;
      let sumSquared = 0;
      let edgeSum = 0;
      let samples = 0;

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const index = y * width + x;
          const value = luminanceAt(input.rgba, index);
          sum += value;
          sumSquared += value * value;
          if (x + 1 < width) {
            edgeSum += Math.abs(value - luminanceAt(input.rgba, index + 1));
          }
          if (y + 1 < height) {
            edgeSum += Math.abs(value - luminanceAt(input.rgba, index + width));
          }
          samples += 1;
        }
      }

      const luminance = samples ? sum / samples : 0;
      const variance = samples ? Math.max(0, sumSquared / samples - luminance * luminance) : 0;
      const edgeDensity = clamp01(edgeSum / Math.max(1, samples * 0.42));
      const complexity = clamp01(Math.sqrt(variance) * 2.8 + edgeDensity * 0.65);
      const xPct = column * 100 / columns;
      const yPct = row * 100 / rows;
      const widthPct = 100 / columns;
      const heightPct = 100 / rows;
      const clearance = Math.min(
        xPct,
        yPct,
        100 - xPct - widthPct,
        100 - yPct - heightPct
      );
      const edgePressure = clamp01(1 - clearance / 12);
      const calmness = 1 - complexity;
      cells.push({
        column,
        row,
        x: xPct,
        y: yPct,
        width: widthPct,
        height: heightPct,
        luminance,
        complexity,
        edgeDensity,
        negativeSpace: clamp01(calmness * (1 - edgePressure * 0.38)),
        edgePressure,
        lightTextReadability: clamp01((1 - luminance) * 0.72 + calmness * 0.28),
        darkTextReadability: clamp01(luminance * 0.72 + calmness * 0.28),
        relativeRegion: relativeRegion(
          xPct + widthPct / 2,
          yPct + heightPct / 2,
          input.subjectBoundsPct ?? null
        ),
      });
    }
  }
  return { columns, rows, cells };
}

export function scoreEnvironmentCells(
  cells: CanvasEnvironmentCell[],
  textTone: "light" | "dark" | "either" = "either"
) {
  if (!cells.length) {
    return { complexity: 1, negativeSpace: 0, readability: 0, edgePressure: 1 };
  }
  const average = (read: (cell: CanvasEnvironmentCell) => number) =>
    cells.reduce((sum, cell) => sum + read(cell), 0) / cells.length;
  return {
    complexity: average((cell) => cell.complexity),
    negativeSpace: average((cell) => cell.negativeSpace),
    readability: average((cell) =>
      textTone === "light"
        ? cell.lightTextReadability
        : textTone === "dark"
        ? cell.darkTextReadability
        : Math.max(cell.lightTextReadability, cell.darkTextReadability)
    ),
    edgePressure: average((cell) => cell.edgePressure),
  };
}
