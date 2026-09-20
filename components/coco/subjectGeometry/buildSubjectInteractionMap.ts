import type {
  SubjectRegionKind,
  SubjectSemanticRegion,
} from "./buildSubjectSemanticRegions";

export type SubjectCopyRole =
  | "headline"
  | "accent"
  | "presenter"
  | "details"
  | "date"
  | "price"
  | "venue"
  | "compliance";

export type SubjectInteractionCell = {
  column: number;
  row: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  subjectCoverage: number;
  protection: number;
  region: SubjectRegionKind | "background";
};

export type SubjectInteractionMap = {
  columns: number;
  rows: number;
  cells: SubjectInteractionCell[];
};

export type SubjectInteractionMode = "forbid" | "avoid" | "allow" | "encourage";

export type SubjectRegionCoverage = Partial<Record<SubjectRegionKind, number>>;

type SubjectRegionPolicy = {
  mode: SubjectInteractionMode;
  /** Fraction of the copy zone that may contain visible pixels from this region. */
  maxCoverage: number;
  /** Desired coverage for intentional interactions. Zero means no overlap is preferred. */
  targetCoverage: number;
  weight: number;
};

const policy = (
  mode: SubjectInteractionMode,
  maxCoverage: number,
  targetCoverage = 0,
  weight = 18
): SubjectRegionPolicy => ({ mode, maxCoverage, targetCoverage, weight });

// Text does not have one relationship with "the subject". Hero type can be
// integrated with clothing, while informational copy should remain in quiet
// background space. Face features stay protected for every role.
export const SUBJECT_REGION_COPY_POLICIES: Record<
  SubjectCopyRole,
  Record<SubjectRegionKind, SubjectRegionPolicy>
> = {
  headline: {
    eyes: policy("forbid", 0.002),
    "face-core": policy("forbid", 0.004),
    "face-perimeter": policy("forbid", 0.012),
    hands: policy("forbid", 0.008),
    prop: policy("forbid", 0.012),
    hair: policy("allow", 0.12, 0.04, 8),
    shoulders: policy("allow", 0.18, 0.08, 10),
    torso: policy("encourage", 1, 0.28, 24),
    "lower-body": policy("encourage", 1, 0.24, 20),
  },
  accent: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.003),
    "face-perimeter": policy("forbid", 0.008),
    hands: policy("forbid", 0.006),
    prop: policy("forbid", 0.01),
    hair: policy("encourage", 0.14, 0.06, 16),
    shoulders: policy("allow", 0.12, 0.04, 8),
    torso: policy("allow", 0.16, 0.05, 7),
    "lower-body": policy("allow", 0.14, 0.04, 6),
  },
  presenter: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.002),
    "face-perimeter": policy("forbid", 0.005),
    hands: policy("forbid", 0.004),
    prop: policy("forbid", 0.006),
    hair: policy("avoid", 0.035, 0, 18),
    shoulders: policy("avoid", 0.05, 0, 20),
    torso: policy("avoid", 0.055, 0, 20),
    "lower-body": policy("avoid", 0.06, 0, 18),
  },
  details: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.002),
    "face-perimeter": policy("forbid", 0.004),
    hands: policy("forbid", 0.003),
    prop: policy("forbid", 0.005),
    hair: policy("avoid", 0.025, 0, 22),
    shoulders: policy("avoid", 0.03, 0, 24),
    torso: policy("avoid", 0.035, 0, 24),
    "lower-body": policy("avoid", 0.04, 0, 20),
  },
  date: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.002),
    "face-perimeter": policy("forbid", 0.004),
    hands: policy("forbid", 0.003),
    prop: policy("forbid", 0.005),
    hair: policy("avoid", 0.03, 0, 20),
    shoulders: policy("avoid", 0.045, 0, 20),
    torso: policy("avoid", 0.05, 0, 20),
    "lower-body": policy("allow", 0.08, 0.025, 5),
  },
  price: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.002),
    "face-perimeter": policy("forbid", 0.004),
    hands: policy("forbid", 0.003),
    prop: policy("forbid", 0.005),
    hair: policy("avoid", 0.025, 0, 20),
    shoulders: policy("avoid", 0.035, 0, 22),
    torso: policy("avoid", 0.04, 0, 22),
    "lower-body": policy("avoid", 0.05, 0, 18),
  },
  venue: {
    eyes: policy("forbid", 0.001),
    "face-core": policy("forbid", 0.002),
    "face-perimeter": policy("forbid", 0.004),
    hands: policy("forbid", 0.003),
    prop: policy("forbid", 0.005),
    hair: policy("avoid", 0.02, 0, 22),
    shoulders: policy("avoid", 0.03, 0, 22),
    torso: policy("avoid", 0.04, 0, 22),
    "lower-body": policy("avoid", 0.055, 0, 18),
  },
  compliance: {
    eyes: policy("forbid", 0),
    "face-core": policy("forbid", 0.001),
    "face-perimeter": policy("forbid", 0.002),
    hands: policy("forbid", 0.002),
    prop: policy("forbid", 0.003),
    hair: policy("avoid", 0.01, 0, 28),
    shoulders: policy("avoid", 0.015, 0, 28),
    torso: policy("avoid", 0.02, 0, 28),
    "lower-body": policy("avoid", 0.025, 0, 24),
  },
};

export const SUBJECT_COPY_POLICIES: Record<
  SubjectCopyRole,
  { maxProtection: number; maxSubjectOverlap: number }
> = {
  headline: { maxProtection: 0.45, maxSubjectOverlap: 1 },
  accent: { maxProtection: 0.45, maxSubjectOverlap: 0.3 },
  presenter: { maxProtection: 0.28, maxSubjectOverlap: 0.08 },
  details: { maxProtection: 0.18, maxSubjectOverlap: 0.05 },
  date: { maxProtection: 0.25, maxSubjectOverlap: 0.08 },
  price: { maxProtection: 0.2, maxSubjectOverlap: 0.05 },
  venue: { maxProtection: 0.2, maxSubjectOverlap: 0.06 },
  compliance: { maxProtection: 0.08, maxSubjectOverlap: 0.01 },
};

export function scoreSubjectRegionInteraction(input: {
  role: SubjectCopyRole;
  regionCoverage: SubjectRegionCoverage;
  subjectOverlap: number;
  maximumProtection: number;
}) {
  const broadPolicy = SUBJECT_COPY_POLICIES[input.role];
  const regionPolicies = SUBJECT_REGION_COPY_POLICIES[input.role];
  let score = 0;
  let reason: string | undefined;
  let strongestMode: SubjectInteractionMode | "background" = "background";
  let strongestCoverage = 0;

  for (const [kind, rawCoverage] of Object.entries(input.regionCoverage) as Array<
    [SubjectRegionKind, number]
  >) {
    const coverage = Math.max(0, rawCoverage ?? 0);
    if (coverage <= 0) continue;
    const regionPolicy = regionPolicies[kind];
    if (coverage > strongestCoverage) {
      strongestCoverage = coverage;
      strongestMode = regionPolicy.mode;
    }
    if (coverage > regionPolicy.maxCoverage) {
      reason = `${regionPolicy.mode === "forbid" ? "protected" : "excessive"} ${kind} overlap`;
      break;
    }
    if (regionPolicy.mode === "avoid") {
      score -= coverage / Math.max(0.005, regionPolicy.maxCoverage) * regionPolicy.weight;
    } else if (regionPolicy.mode === "allow") {
      score += Math.min(1, coverage / Math.max(0.01, regionPolicy.targetCoverage)) * regionPolicy.weight;
    } else if (regionPolicy.mode === "encourage") {
      const target = Math.max(0.01, regionPolicy.targetCoverage);
      score += Math.min(1, coverage / target) * regionPolicy.weight;
      if (coverage > target) {
        score -= (coverage - target) / Math.max(0.01, regionPolicy.maxCoverage - target) * 8;
      }
    }
  }

  if (!reason && input.subjectOverlap > broadPolicy.maxSubjectOverlap) {
    reason = "too much subject overlap";
  }

  return {
    allowed: !reason,
    mode: strongestMode,
    reason,
    score: Math.max(-60, Math.min(28, score)),
  };
}

function pointInRegion(xPct: number, yPct: number, region: SubjectSemanticRegion) {
  const rect = region.rectPct;
  return (
    xPct >= rect.x &&
    xPct <= rect.x + rect.width &&
    yPct >= rect.y &&
    yPct <= rect.y + rect.height
  );
}

export function buildSubjectInteractionMap(input: {
  alpha: Uint8ClampedArray;
  width: number;
  height: number;
  regions: SubjectSemanticRegion[];
  columns?: number;
  rows?: number;
  alphaThreshold?: number;
}): SubjectInteractionMap {
  const width = Math.max(1, Math.floor(input.width));
  const height = Math.max(1, Math.floor(input.height));
  const columns = Math.max(8, Math.floor(input.columns ?? 24));
  const rows = Math.max(8, Math.floor(input.rows ?? Math.round(columns * height / width)));
  const alphaThreshold = Math.max(0, Math.min(255, input.alphaThreshold ?? 18));
  const cells: SubjectInteractionCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = Math.floor(column * width / columns);
      const right = Math.max(left + 1, Math.floor((column + 1) * width / columns));
      const top = Math.floor(row * height / rows);
      const bottom = Math.max(top + 1, Math.floor((row + 1) * height / rows));
      let occupied = 0;
      let samples = 0;
      const regionMass = new Map<SubjectRegionKind, number>();
      let maximumProtection = 0;

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const alpha = input.alpha[y * width + x] ?? 0;
          samples += 1;
          const xPct = ((x + 0.5) / width) * 100;
          const yPct = ((y + 0.5) / height) * 100;
          const independentRegions = input.regions.filter(
            (region) =>
              (region.kind === "hands" || region.kind === "prop") &&
              pointInRegion(xPct, yPct, region)
          );
          const mass = alpha > alphaThreshold ? alpha / 255 : independentRegions.length ? 1 : 0;
          if (mass <= 0) continue;
          occupied += mass;
          for (const region of input.regions) {
            if (!pointInRegion(xPct, yPct, region)) continue;
            regionMass.set(region.kind, (regionMass.get(region.kind) ?? 0) + mass);
            maximumProtection = Math.max(maximumProtection, region.protection);
          }
        }
      }

      // Semantic rectangles intentionally overlap (eyes sit inside face,
      // face inside perimeter). The strictest matching region must win;
      // choosing only by pixel mass mislabeled protected face cells as the
      // larger, lower-protection perimeter.
      const dominant = [...regionMass.entries()].sort((a, b) => {
        const aProtection =
          input.regions.find((region) => region.kind === a[0])?.protection ?? 0;
        const bProtection =
          input.regions.find((region) => region.kind === b[0])?.protection ?? 0;
        return bProtection - aProtection || b[1] - a[1];
      })[0]?.[0];
      const subjectCoverage = samples > 0 ? occupied / samples : 0;
      cells.push({
        column,
        row,
        xPct: column * 100 / columns,
        yPct: row * 100 / rows,
        widthPct: 100 / columns,
        heightPct: 100 / rows,
        subjectCoverage,
        protection: subjectCoverage > 0.01 ? maximumProtection : 0,
        region: subjectCoverage > 0.01 ? dominant ?? "background" : "background",
      });
    }
  }

  return { columns, rows, cells };
}

export function scoreInteractionCellsForRole(
  cells: SubjectInteractionCell[],
  role: SubjectCopyRole
) {
  const subjectOverlap =
    cells.length > 0
      ? cells.reduce((sum, cell) => sum + cell.subjectCoverage, 0) / cells.length
      : 0;
  const maximumProtection = cells.reduce(
    (maximum, cell) => Math.max(maximum, cell.protection),
    0
  );
  const regionCoverage: SubjectRegionCoverage = {};
  for (const cell of cells) {
    if (cell.region === "background") continue;
    regionCoverage[cell.region] =
      (regionCoverage[cell.region] ?? 0) + cell.subjectCoverage / Math.max(1, cells.length);
  }
  const interaction = scoreSubjectRegionInteraction({
    role,
    regionCoverage,
    subjectOverlap,
    maximumProtection,
  });
  return {
    allowed: interaction.allowed,
    maximumProtection,
    mode: interaction.mode,
    reason: interaction.reason,
    regionCoverage,
    score: Math.max(0, Math.min(100, 72 + interaction.score)),
    subjectOverlap,
  };
}
