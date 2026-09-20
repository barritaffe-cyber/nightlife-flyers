import type { CanvasTextCandidate } from "../subjectGeometry/buildCanvasTextCandidates.ts";
import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";
import type { CopyCapacityResult } from "../typographyStack/calculateCopyCapacity.ts";
import {
  evaluateCompositionGrammar,
  type CompositionGrammarId,
} from "./evaluateCompositionGrammar.ts";
import {
  canCandidateJoinAssembly,
  evaluateCompositionAssembly,
  type CompositionAssemblyPlan,
} from "./evaluateCompositionAssembly.ts";

export type CapacityCheckedCandidate = CanvasTextCandidate & {
  capacity: CopyCapacityResult;
};

export type CanvasCompositionResult = {
  placements: CapacityCheckedCandidate[];
  assembly: CompositionAssemblyPlan;
  score: number;
  rejectedCandidateCount: number;
  diagnostics: {
    archetypeScore: number;
    balancePenalty: number;
    collisionPenalty: number;
    fragmentationPenalty: number;
    groupingScore: number;
    hierarchyScore: number;
    subjectIntegrationScore: number;
    alignmentScore: number;
    assemblyScore: number;
    footerScore: number;
    grammarId: CompositionGrammarId;
    guideCount: number;
    guidePenalty: number;
    lockupScore: number;
    isolationPenalty: number;
    readabilityScore: number;
    rhythmScore: number;
    symmetryScore: number;
    sharedGuideScore: number;
  };
};

const ROLE_ORDER: SubjectCopyRole[] = [
  "headline",
  "accent",
  "presenter",
  "details",
  "date",
  "price",
  "venue",
  "compliance",
];

const ROLE_WEIGHT: Record<SubjectCopyRole, number> = {
  headline: 5,
  accent: 2.4,
  presenter: 1.4,
  details: 2,
  date: 1.8,
  price: 1.8,
  venue: 1.5,
  compliance: 0.7,
};

function overlapRatio(a: CanvasTextCandidate["rect"], b: CanvasTextCandidate["rect"]) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

function rectCenter(rect: CanvasTextCandidate["rect"]) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function edgeGap(a: CanvasTextCandidate["rect"], b: CanvasTextCandidate["rect"]) {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0);
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0);
  return Math.hypot(dx, dy);
}

function alignmentAffinity(a: CanvasTextCandidate["rect"], b: CanvasTextCandidate["rect"]) {
  const left = Math.abs(a.x - b.x);
  const right = Math.abs(a.x + a.width - b.x - b.width);
  const center = Math.abs(rectCenter(a).x - rectCenter(b).x);
  return Math.max(0, 1 - Math.min(left, right, center) / 8);
}

function role(placements: CapacityCheckedCandidate[], value: SubjectCopyRole) {
  return placements.find((candidate) => candidate.role === value);
}

function groupingDiagnostics(placements: CapacityCheckedCandidate[]) {
  const headline = role(placements, "headline");
  const accent = role(placements, "accent");
  const presenter = role(placements, "presenter");
  const details = role(placements, "details");
  const date = role(placements, "date");
  const price = role(placements, "price");
  const venue = role(placements, "venue");
  const compliance = role(placements, "compliance");
  let groupingScore = 0;

  // Related copy should read as lockups, not unrelated labels scattered
  // across otherwise valid negative-space cells.
  if (headline && accent) {
    const gap = edgeGap(headline.rect, accent.rect);
    groupingScore += Math.max(-18, 16 - gap * 1.7);
    groupingScore += alignmentAffinity(headline.rect, accent.rect) * 8;
  }
  if (presenter && details) {
    groupingScore += Math.max(-8, 8 - edgeGap(presenter.rect, details.rect) * 0.8);
    groupingScore += alignmentAffinity(presenter.rect, details.rect) * 5;
  }
  if (date && price) {
    const sameBand = Math.abs(rectCenter(date.rect).y - rectCenter(price.rect).y);
    groupingScore += Math.max(-6, 6 - sameBand * 0.45);
  }

  let footerScore = 0;
  if (venue) {
    footerScore += Math.max(-12, 10 - Math.abs(rectCenter(venue.rect).y - 90) * 0.8);
  }
  if (venue && compliance) {
    footerScore += Math.max(-8, 7 - edgeGap(venue.rect, compliance.rect) * 0.55);
    footerScore += Math.max(0, 4 - Math.abs(rectCenter(venue.rect).y - rectCenter(compliance.rect).y) * 0.3);
  }

  let isolated = 0;
  for (const candidate of placements) {
    if (candidate.role === "headline") continue;
    const nearest = Math.min(
      ...placements
        .filter((other) => other !== candidate)
        .map((other) => edgeGap(candidate.rect, other.rect))
    );
    if (Number.isFinite(nearest) && nearest > 14) isolated += 1;
  }
  const horizontalAnchors = new Set(
    placements.map((candidate) => Math.round(candidate.rect.x / 5) * 5)
  ).size;
  const fragmentationPenalty = isolated * 7 + Math.max(0, horizontalAnchors - 4) * 2.5;

  return { footerScore, fragmentationPenalty, groupingScore };
}

function arrangementDiagnostics(placements: CapacityCheckedCandidate[]) {
  let collisionPenalty = 0;
  let alignmentScore = 0;
  let leftWeight = 0;
  let rightWeight = 0;
  for (let first = 0; first < placements.length; first += 1) {
    const candidate = placements[first];
    const centerX = candidate.rect.x + candidate.rect.width / 2;
    const signedDistance = Math.abs(centerX - 50) / 50;
    const weight = ROLE_WEIGHT[candidate.role] * (0.45 + candidate.rect.width * candidate.rect.height / 900);
    if (centerX < 50) leftWeight += weight * signedDistance;
    else rightWeight += weight * signedDistance;
    for (let second = first + 1; second < placements.length; second += 1) {
      const other = placements[second];
      const overlap = overlapRatio(candidate.rect, other.rect);
      if (overlap > 0.02) collisionPenalty += overlap * 180;
      const leftAligned = Math.abs(candidate.rect.x - other.rect.x) <= 2.5;
      const rightAligned = Math.abs(
        candidate.rect.x + candidate.rect.width - other.rect.x - other.rect.width
      ) <= 2.5;
      const centerAligned = Math.abs(
        candidate.rect.x + candidate.rect.width / 2 - other.rect.x - other.rect.width / 2
      ) <= 2.5;
      if (leftAligned || rightAligned || centerAligned) alignmentScore += 2.5;
    }
  }
  const balancePenalty = Math.abs(leftWeight - rightWeight) * 1.8;
  const headline = placements.find((candidate) => candidate.role === "headline");
  const headlineLines = headline?.capacity.lines.filter(Boolean) ?? [];
  const lineBalance = headlineLines.length > 1
    ? Math.min(...headlineLines.map((line) => line.length)) /
      Math.max(1, Math.max(...headlineLines.map((line) => line.length)))
    : 1;
  const treatmentScore = headline
    ? Math.max(-12, 10 - Math.abs(headline.capacity.occupancy - 0.72) * 24) +
      (lineBalance >= 0.42 ? 5 : -12)
    : 0;
  const hierarchyScore = headline
    ? Math.min(24, headline.capacity.fontSize / 5) + treatmentScore +
      (placements.every(
        (candidate) =>
          candidate.role === "headline" ||
          candidate.capacity.fontSize <= headline.capacity.fontSize * 0.72
      )
        ? 8
        : -14)
    : -80;
  const readabilityScore = placements.reduce(
    (sum, candidate) =>
      sum +
      candidate.capacity.breathingRoom * 8 +
      Number(candidate.environmentReadability ?? 0.5) * 7 -
      Number(candidate.environmentComplexity ?? 0.5) * 5,
    0
  );
  const subjectIntegrationScore = placements.reduce((sum, candidate) => {
    const local = Number(candidate.interactionScore ?? 0);
    return sum + local * (candidate.role === "headline" ? 0.55 : 0.18);
  }, 0);
  const grouping = groupingDiagnostics(placements);
  const grammar = evaluateCompositionGrammar(placements);
  const assembly = evaluateCompositionAssembly(placements);
  return {
    archetypeScore: grammar.score,
    alignmentScore,
    assemblyScore: assembly.score,
    balancePenalty,
    collisionPenalty,
    ...grouping,
    grammarId: grammar.grammarId,
    guideCount: grammar.guideCount,
    guidePenalty: grammar.guidePenalty,
    hierarchyScore,
    lockupScore: grammar.lockupScore,
    isolationPenalty: assembly.isolationPenalty,
    readabilityScore,
    subjectIntegrationScore,
    rhythmScore: grammar.rhythmScore,
    symmetryScore: grammar.symmetryScore,
    sharedGuideScore: assembly.sharedGuideScore,
  };
}

function scoreArrangement(placements: CapacityCheckedCandidate[]) {
  const diagnostics = arrangementDiagnostics(placements);
  const assembly = evaluateCompositionAssembly(placements);
  const candidateScore = placements.reduce(
    (sum, candidate) =>
      sum + candidate.score * ROLE_WEIGHT[candidate.role] / 5,
    0
  );
  return {
    diagnostics,
    assembly,
    score:
      candidateScore +
      diagnostics.alignmentScore +
      diagnostics.assemblyScore +
      diagnostics.archetypeScore +
      diagnostics.groupingScore +
      diagnostics.footerScore +
      diagnostics.hierarchyScore +
      diagnostics.readabilityScore +
      diagnostics.subjectIntegrationScore -
      diagnostics.balancePenalty -
      diagnostics.collisionPenalty -
      diagnostics.fragmentationPenalty,
  };
}

/**
 * Rebuilds the composition score after a downstream geometry pass changes the
 * selected rectangles. This keeps the committed score, diagnostics, and
 * assembly guides tied to the geometry that is actually rendered.
 */
export function rescoreCanvasComposition(input: {
  placements: CapacityCheckedCandidate[];
  rejectedCandidateCount: number;
}): CanvasCompositionResult {
  return {
    placements: input.placements,
    ...scoreArrangement(input.placements),
    rejectedCandidateCount: input.rejectedCandidateCount,
  };
}

function isHeroLockupPair(a: CapacityCheckedCandidate, b: CapacityCheckedCandidate) {
  return (
    (a.role === "headline" && b.role === "accent") ||
    (a.role === "accent" && b.role === "headline")
  );
}

export function chooseCanvasComposition(input: {
  candidates: CapacityCheckedCandidate[];
  requiredRoles?: SubjectCopyRole[];
  beamWidth?: number;
}): CanvasCompositionResult {
  const usable = input.candidates.filter(
    (candidate) => candidate.capacity.fits && !candidate.rejected
  );
  const roleSet = new Set(usable.map((candidate) => candidate.role));
  const roles = ROLE_ORDER.filter((role) =>
    (input.requiredRoles ?? [...roleSet]).includes(role)
  );
  const beamWidth = Math.max(8, input.beamWidth ?? 48);
  let beam: CapacityCheckedCandidate[][] = [[]];

  for (const role of roles) {
    const pool = usable.filter((candidate) => candidate.role === role).slice(0, 10);
    if (!pool.length) continue;
    const next: CapacityCheckedCandidate[][] = [];
    for (const arrangement of beam) {
      for (const candidate of pool) {
        const arrangementReferenceIds = new Set(
          arrangement.flatMap((placement) =>
            placement.referenceLayoutId ? [placement.referenceLayoutId] : []
          )
        );
        if (
          candidate.referenceLayoutId &&
          arrangement.length > 0 &&
          arrangement.some(
            (placement) => placement.referenceLayoutId !== candidate.referenceLayoutId
          )
        ) continue;
        if (!candidate.referenceLayoutId && arrangementReferenceIds.size > 0) continue;
        const sharesReferenceGrammar = Boolean(
          candidate.referenceLayoutId &&
          (arrangement.length === 0 || arrangementReferenceIds.has(candidate.referenceLayoutId))
        );
        if (!sharesReferenceGrammar && !canCandidateJoinAssembly(arrangement, candidate)) continue;
        if (arrangement.some((placed) => {
          const overlap = overlapRatio(placed.rect, candidate.rect);
          return overlap > (isHeroLockupPair(placed, candidate) ? 0.24 : 0.08);
        })) {
          continue;
        }
        next.push([...arrangement, candidate]);
      }
    }
    if (!next.length) continue;
    beam = next
      .map((placements) => ({ placements, score: scoreArrangement(placements).score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth)
      .map((entry) => entry.placements);
  }

  const winner = beam
    .map((placements) => ({ placements, ...scoreArrangement(placements) }))
    .sort((a, b) => b.score - a.score)[0] ?? {
    placements: [],
    score: -Infinity,
    diagnostics: arrangementDiagnostics([]),
    assembly: evaluateCompositionAssembly([]),
  };
  return {
    ...winner,
    rejectedCandidateCount: input.candidates.length - usable.length,
  };
}
