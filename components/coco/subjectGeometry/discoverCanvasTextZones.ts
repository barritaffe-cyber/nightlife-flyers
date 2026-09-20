import type { CanvasEnvironmentCell } from "./buildCanvasEnvironmentMap.ts";
import type { CanvasInteractionCell } from "./buildCanvasTextCandidates.ts";
import type { SubjectRegionCoverage } from "./buildSubjectInteractionMap.ts";

export type DiscoveredCanvasZoneKind = "clear" | "hero-interaction";

export type DiscoveredCanvasTextZone = {
  id: string;
  kind: DiscoveredCanvasZoneKind;
  quality: number;
  rect: { x: number; y: number; width: number; height: number };
  subjectOverlap: number;
  regionCoverage: SubjectRegionCoverage;
  environmentReadability: number;
  environmentComplexity: number;
};

type Rect = DiscoveredCanvasTextZone["rect"];

const overlapArea = (a: Rect, b: Rect) => {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
};

function evidenceForRect(
  rect: Rect,
  subjectCells: CanvasInteractionCell[],
  environmentCells: CanvasEnvironmentCell[]
) {
  const area = Math.max(0.01, rect.width * rect.height);
  const regionCoverage: SubjectRegionCoverage = {};
  let subjectOverlap = 0;
  for (const cell of subjectCells) {
    if (cell.region === "background") continue;
    const intersection = overlapArea(rect, {
      x: cell.canvasX,
      y: cell.canvasY,
      width: cell.canvasWidth,
      height: cell.canvasHeight,
    });
    if (intersection <= 0) continue;
    const coverage = intersection * cell.subjectCoverage / area;
    regionCoverage[cell.region] = (regionCoverage[cell.region] ?? 0) + coverage;
    subjectOverlap += coverage;
  }

  let environmentArea = 0;
  let readability = 0;
  let complexity = 0;
  for (const cell of environmentCells) {
    const intersection = overlapArea(rect, cell);
    if (intersection <= 0) continue;
    environmentArea += intersection;
    readability += intersection * Math.max(cell.lightTextReadability, cell.darkTextReadability);
    complexity += intersection * cell.complexity;
  }
  return {
    regionCoverage,
    subjectOverlap,
    environmentReadability: environmentArea > 0 ? readability / environmentArea : 0.5,
    environmentComplexity: environmentArea > 0 ? complexity / environmentArea : 0.5,
  };
}

function isUsable(kind: DiscoveredCanvasZoneKind, evidence: ReturnType<typeof evidenceForRect>) {
  const coverage = evidence.regionCoverage;
  const protectedCoverage =
    (coverage.eyes ?? 0) +
    (coverage["face-core"] ?? 0) +
    (coverage["face-perimeter"] ?? 0) +
    (coverage.hands ?? 0) +
    (coverage.prop ?? 0);
  if (protectedCoverage > 0.001) return false;
  if (kind === "clear") return evidence.subjectOverlap <= 0.025;
  return (
    (coverage.hair ?? 0) <= 0.16 &&
    (coverage.shoulders ?? 0) <= 0.28
  );
}

function intersectionOverUnion(a: Rect, b: Rect) {
  const intersection = overlapArea(a, b);
  return intersection / Math.max(0.01, a.width * a.height + b.width * b.height - intersection);
}

export function discoverCanvasTextZones(input: {
  subjectCells: CanvasInteractionCell[];
  environmentCells?: CanvasEnvironmentCell[];
  columns?: number;
  rows?: number;
  maxPerKind?: number;
}): DiscoveredCanvasTextZone[] {
  const columns = Math.max(12, Math.floor(input.columns ?? 24));
  const rows = Math.max(12, Math.floor(input.rows ?? 24));
  const cellWidth = 100 / columns;
  const cellHeight = 100 / rows;
  const environmentCells = input.environmentCells ?? [];
  const results: DiscoveredCanvasTextZone[] = [];

  for (const kind of ["clear", "hero-interaction"] as const) {
    const usable = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) => {
        if (row === 0 || column === 0 || row === rows - 1 || column === columns - 1) {
          return false;
        }
        const rect = {
          x: column * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        };
        return isUsable(kind, evidenceForRect(rect, input.subjectCells, environmentCells));
      })
    );

    // Enumerate every vertically contiguous band, then extract its horizontal
    // runs. The rectangles are born from connected usable cells—not canvas
    // presets—and retain narrow side lanes, footer bands, and torso-safe hero lanes.
    for (let top = 1; top < rows - 1; top += 1) {
      const validColumns = new Array(columns).fill(true);
      for (let bottom = top; bottom < rows - 1; bottom += 1) {
        for (let column = 1; column < columns - 1; column += 1) {
          validColumns[column] = validColumns[column] && usable[bottom][column];
        }
        let runStart = -1;
        for (let column = 1; column <= columns - 1; column += 1) {
          const valid = column < columns - 1 && validColumns[column];
          if (valid && runStart < 0) runStart = column;
          if (valid || runStart < 0) continue;
          const runEnd = column;
          const capturedRunStart = runStart;
          const rect = {
            x: capturedRunStart * cellWidth,
            y: top * cellHeight,
            width: (runEnd - runStart) * cellWidth,
            height: (bottom - top + 1) * cellHeight,
          };
          runStart = -1;
          if (rect.width < 12 || rect.height < 7) continue;
          const evidence = evidenceForRect(rect, input.subjectCells, environmentCells);
          const interactionCoverage =
            (evidence.regionCoverage.torso ?? 0) +
            (evidence.regionCoverage["lower-body"] ?? 0);
          const edgeClearance = Math.min(
            rect.x,
            rect.y,
            100 - rect.x - rect.width,
            100 - rect.y - rect.height
          );
          const quality =
            Math.min(34, Math.sqrt(rect.width * rect.height) * 1.25) +
            evidence.environmentReadability * 22 -
            evidence.environmentComplexity * 16 +
            Math.min(8, edgeClearance * 0.45) +
            (kind === "hero-interaction" ? Math.min(20, interactionCoverage * 58) : 6);
          results.push({
            id: `${kind}-${top}-${bottom}-${capturedRunStart}-${runEnd}`,
            kind,
            quality,
            rect,
            ...evidence,
          });
        }
      }
    }
  }

  const maxPerKind = Math.max(12, input.maxPerKind ?? 96);
  return (["clear", "hero-interaction"] as const).flatMap((kind) => {
    const kept: DiscoveredCanvasTextZone[] = [];
    const bucketCounts = new Map<string, number>();
    for (const zone of results
      .filter((candidate) => candidate.kind === kind)
      .sort((a, b) => b.quality - a.quality)) {
      if (kept.some((existing) => intersectionOverUnion(existing.rect, zone.rect) > 0.94)) continue;
      const centerX = zone.rect.x + zone.rect.width / 2;
      const centerY = zone.rect.y + zone.rect.height / 2;
      const bucket = `${Math.min(2, Math.floor(centerX / (100 / 3)))}:${Math.min(
        4,
        Math.floor(centerY / 20)
      )}`;
      if ((bucketCounts.get(bucket) ?? 0) >= 8) continue;
      kept.push(zone);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      if (kept.length >= maxPerKind) break;
    }
    return kept;
  });
}
