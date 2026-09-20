import {
  scoreSubjectRegionInteraction,
  type SubjectCopyRole,
  type SubjectInteractionCell,
  type SubjectInteractionMode,
  type SubjectRegionCoverage,
} from "./buildSubjectInteractionMap.ts";
import {
  scoreEnvironmentCells,
  type CanvasEnvironmentCell,
} from "./buildCanvasEnvironmentMap.ts";
import {
  discoverCanvasTextZones,
  type DiscoveredCanvasTextZone,
} from "./discoverCanvasTextZones.ts";

export { headlineLineBreakVariants } from "../headlineDirector/resolveHeadlineLockup.ts";

export type CanvasInteractionCell = SubjectInteractionCell & {
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
};

export type CanvasTextCandidate = {
  id: string;
  role: SubjectCopyRole;
  rect: { x: number; y: number; width: number; height: number };
  score: number;
  subjectOverlap: number;
  maximumProtection: number;
  regionCoverage?: SubjectRegionCoverage;
  interactionMode?: SubjectInteractionMode | "background";
  interactionScore?: number;
  rejected: boolean;
  reason?: string;
  environmentReadability?: number;
  environmentComplexity?: number;
  textVariant?: string;
  discoveredZoneId?: string;
  discoveredZoneKind?: DiscoveredCanvasTextZone["kind"];
  referenceLayoutId?: string;
  referenceSourceUrl?: string;
  referenceFontFamily?: string;
  referenceFontSize?: number;
  referenceLineHeight?: number;
  referenceAlign?: "left" | "center" | "right";
  referenceLetterSpacing?: number;
  referenceFontWeight?: number | string;
  referenceMaxLines?: number;
  referenceRotation?: number;
  referenceUppercase?: boolean;
};

const ROLE_ZONE_LIMITS: Record<
  Exclude<SubjectCopyRole, "headline">,
  { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }
> = {
  accent: { minWidth: 24, minHeight: 7, maxWidth: 46, maxHeight: 12 },
  presenter: { minWidth: 20, minHeight: 7, maxWidth: 38, maxHeight: 11 },
  details: { minWidth: 24, minHeight: 14, maxWidth: 40, maxHeight: 24 },
  date: { minWidth: 16, minHeight: 8, maxWidth: 30, maxHeight: 14 },
  price: { minWidth: 14, minHeight: 9, maxWidth: 25, maxHeight: 15 },
  venue: { minWidth: 30, minHeight: 7, maxWidth: 58, maxHeight: 12 },
  compliance: { minWidth: 10, minHeight: 6, maxWidth: 22, maxHeight: 10 },
};

function limitsForRole(role: SubjectCopyRole, headlineText?: string) {
  if (role !== "headline") return ROLE_ZONE_LIMITS[role];
  const shapes = headlineShapesForText(headlineText);
  return {
    minWidth: Math.min(...shapes.map((shape) => shape.width)),
    minHeight: Math.min(...shapes.map((shape) => shape.height)),
    maxWidth: Math.max(...shapes.map((shape) => shape.width)),
    maxHeight: Math.max(...shapes.map((shape) => shape.height)),
  };
}

function roleWindowsInDiscoveredZone(
  role: SubjectCopyRole,
  zone: DiscoveredCanvasTextZone,
  headlineText?: string
) {
  const limits = limitsForRole(role, headlineText);
  if (zone.rect.width < limits.minWidth || zone.rect.height < limits.minHeight) return [];
  const large = {
    width: Math.min(zone.rect.width, limits.maxWidth),
    height: Math.min(zone.rect.height, limits.maxHeight),
  };
  const compact = {
    width: Math.max(limits.minWidth, large.width * 0.8),
    height: Math.max(limits.minHeight, large.height * 0.82),
  };
  const windows = [large, compact];
  const rects: Array<{ x: number; y: number; width: number; height: number }> = [];
  for (const size of windows) {
    const right = zone.rect.x + zone.rect.width - size.width;
    const bottom = zone.rect.y + zone.rect.height - size.height;
    const centerX = zone.rect.x + (zone.rect.width - size.width) / 2;
    const centerY = zone.rect.y + (zone.rect.height - size.height) / 2;
    for (const [x, y] of [
      [zone.rect.x, zone.rect.y],
      [right, zone.rect.y],
      [centerX, centerY],
      [zone.rect.x, bottom],
      [right, bottom],
    ]) {
      const rect = { x, y, width: size.width, height: size.height };
      if (
        !rects.some(
          (existing) =>
            Math.abs(existing.x - rect.x) < 0.1 &&
            Math.abs(existing.y - rect.y) < 0.1 &&
            Math.abs(existing.width - rect.width) < 0.1 &&
            Math.abs(existing.height - rect.height) < 0.1
        )
      ) rects.push(rect);
    }
  }
  return rects;
}

export function headlineShapesForText(text: string | null | undefined) {
  const normalized = String(text ?? "").trim().replace(/\s+/g, " ");
  const words = normalized ? normalized.split(" ") : [];
  const characters = words.join("").length;
  const longestWord = Math.max(0, ...words.map((word) => word.length));
  const explicitLines = String(text ?? "").split(/\r?\n/).filter((line) => line.trim()).length;

  if (explicitLines >= 3 || characters >= 24 || words.length >= 5) {
    return [
      { width: 92, height: 32 },
      { width: 82, height: 30 },
      { width: 72, height: 28 },
    ];
  }
  if (explicitLines === 2 || characters >= 11 || words.length >= 2 || longestWord >= 9) {
    return [
      { width: 92, height: 28 },
      { width: 82, height: 26 },
      { width: 72, height: 24 },
    ];
  }
  // The analyzer's headline allocation is always a true hero band. Short
  // names use that height to become large instead of inheriting a small box.
  return [
    { width: 92, height: 24 },
    { width: 82, height: 22 },
    { width: 72, height: 20 },
  ];
}

function overlapArea(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

export function evaluateCanvasRectInteraction(input: {
  role: SubjectCopyRole;
  rect: { x: number; y: number; width: number; height: number };
  cells: CanvasInteractionCell[];
}) {
  let weightedSubjectArea = 0;
  let maximumProtection = 0;
  const regionCoverage: SubjectRegionCoverage = {};
  for (const cell of input.cells) {
    const intersection = overlapArea(input.rect, {
      x: cell.canvasX,
      y: cell.canvasY,
      width: cell.canvasWidth,
      height: cell.canvasHeight,
    });
    if (intersection <= 0) continue;
    weightedSubjectArea += intersection * cell.subjectCoverage;
    maximumProtection = Math.max(maximumProtection, cell.protection);
    if (cell.region !== "background") {
      regionCoverage[cell.region] =
        (regionCoverage[cell.region] ?? 0) +
        intersection * cell.subjectCoverage / (input.rect.width * input.rect.height);
    }
  }
  const subjectOverlap = weightedSubjectArea / Math.max(1, input.rect.width * input.rect.height);
  const interaction = scoreSubjectRegionInteraction({
    role: input.role,
    regionCoverage,
    subjectOverlap,
    maximumProtection,
  });
  return { interaction, maximumProtection, regionCoverage, subjectOverlap };
}

function center(rect: { x: number; y: number; width: number; height: number }) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function subjectAnchors(cells: CanvasInteractionCell[]) {
  const occupied = cells.filter((cell) => cell.subjectCoverage > 0.08);
  const face = occupied.filter(
    (cell) =>
      cell.region === "eyes" ||
      cell.region === "face-core" ||
      cell.region === "face-perimeter"
  );
  const bounds = (source: CanvasInteractionCell[]) => {
    if (!source.length) return { x: 25, y: 15, width: 50, height: 70 };
    const left = Math.min(...source.map((cell) => cell.canvasX));
    const top = Math.min(...source.map((cell) => cell.canvasY));
    const right = Math.max(...source.map((cell) => cell.canvasX + cell.canvasWidth));
    const bottom = Math.max(...source.map((cell) => cell.canvasY + cell.canvasHeight));
    return { x: left, y: top, width: right - left, height: bottom - top };
  };
  const subject = bounds(occupied);
  const faceBounds = bounds(face);
  return { subject, face: faceBounds, subjectCenter: center(subject), faceCenter: center(faceBounds) };
}

function rolePlacementScore(
  role: SubjectCopyRole,
  rect: { x: number; y: number; width: number; height: number },
  cells: CanvasInteractionCell[],
  anchors: ReturnType<typeof subjectAnchors>
) {
  const faceLow = anchors.faceCenter.y > 48;
  const oppositeX = anchors.faceCenter.x >= 50 ? 18 : 82;
  const sameX = anchors.faceCenter.x >= 50 ? 82 : 18;
  const targets: Record<SubjectCopyRole, { x: number; y: number }> = {
    headline: faceLow
      ? { x: anchors.subjectCenter.x, y: 18 }
      : {
          x: anchors.subjectCenter.x,
          y: Math.min(74, Math.max(52, anchors.face.y + anchors.face.height + 18)),
        },
    accent: {
      x: anchors.subjectCenter.x,
      y: Math.min(82, Math.max(44, anchors.face.y + anchors.face.height + 9)),
    },
    presenter: { x: oppositeX, y: 11 },
    details: { x: oppositeX, y: Math.min(54, Math.max(30, anchors.faceCenter.y + 8)) },
    date: { x: oppositeX, y: 70 },
    price: { x: sameX, y: Math.min(58, Math.max(32, anchors.faceCenter.y + 10)) },
    venue: { x: 50, y: 88 },
    compliance: { x: sameX, y: 91 },
  };
  const candidateCenter = center(rect);
  const target = targets[role];
  const distance = Math.hypot(candidateCenter.x - target.x, candidateCenter.y - target.y);
  let score = Math.max(-28, 24 - distance * 0.72);

  if (role === "headline") {
    let torsoArea = 0;
    for (const cell of cells) {
      if (cell.region !== "torso" && cell.region !== "lower-body") continue;
      torsoArea += overlapArea(rect, {
        x: cell.canvasX,
        y: cell.canvasY,
        width: cell.canvasWidth,
        height: cell.canvasHeight,
      }) * cell.subjectCoverage;
    }
    // A protected face is still forbidden, but the torso is valuable hero
    // space. Give an intentional torso-crossing title enough weight to beat
    // an arbitrary empty strip when both are readable.
    score += Math.min(18, torsoArea / Math.max(1, rect.width * rect.height) * 80);
    // The references consistently preserve a footer information band even
    // when the hero title crosses the torso. A locally strong headline
    // must not consume the only viable venue/contact strip.
    score -= Math.max(0, rect.y + rect.height - 82) * 4;
  }
  if (role === "venue" || role === "compliance") {
    score += Math.max(0, (candidateCenter.y - 72) * 0.55);
  }
  return score;
}

function candidateCollisionRatio(a: CanvasTextCandidate, b: CanvasTextCandidate) {
  const overlap = overlapArea(a.rect, b.rect);
  return overlap / Math.max(1, Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height));
}

export function generateCanvasTextCandidates(input: {
  cells: CanvasInteractionCell[];
  copyTextByRole?: Partial<Record<SubjectCopyRole, string>>;
  environmentCells?: CanvasEnvironmentCell[];
  roles?: SubjectCopyRole[];
  maxPerRole?: number;
  coordinated?: boolean;
}): CanvasTextCandidate[] {
  const roles = input.roles ?? [
    "headline",
    "accent",
    "details",
    "date",
    "price",
    "venue",
    "presenter",
    "compliance",
  ];
  const maxPerRole = Math.max(1, input.maxPerRole ?? 2);
  const coordinated = input.coordinated !== false;
  const anchors = subjectAnchors(input.cells);
  const discoveredZones = discoverCanvasTextZones({
    subjectCells: input.cells,
    environmentCells: input.environmentCells,
  });
  const candidatesByRole = new Map<SubjectCopyRole, CanvasTextCandidate[]>();

  for (const role of roles) {
    const candidates: CanvasTextCandidate[] = [];
    const seenRoleRects = new Set<string>();
    const roleZones = discoveredZones.filter(
      (zone) =>
        zone.kind === "clear" || role === "headline" || role === "accent"
    );
    for (const zone of roleZones) {
      const windows = roleWindowsInDiscoveredZone(
        role,
        zone,
        input.copyTextByRole?.headline
      );
      for (let windowIndex = 0; windowIndex < windows.length; windowIndex += 1) {
          const rect = windows[windowIndex];
          const rectKey = [rect.x, rect.y, rect.width, rect.height]
            .map((value) => Math.round(value * 10))
            .join(":");
          if (seenRoleRects.has(rectKey)) continue;
          seenRoleRects.add(rectKey);
          const {
            interaction,
            maximumProtection,
            regionCoverage,
            subjectOverlap,
          } = evaluateCanvasRectInteraction({ role, rect, cells: input.cells });
          const rejected = !interaction.allowed;
          const edgeClearance = Math.min(
            rect.x,
            rect.y,
            100 - rect.x - rect.width,
            100 - rect.y - rect.height
          );
          const sizeFitness = Math.min(1, rect.width * rect.height / 900);
          const environmentCells = (input.environmentCells ?? []).filter(
            (cell) =>
              overlapArea(rect, {
                x: cell.x,
                y: cell.y,
                width: cell.width,
                height: cell.height,
              }) > 0
          );
          const environment = scoreEnvironmentCells(environmentCells);
          const score = Math.max(
            0,
            78 +
              Math.min(12, edgeClearance * 0.7) +
              sizeFitness * 10 -
              (role === "headline" || role === "accent" ? 0 : subjectOverlap * 18) +
              interaction.score +
              zone.quality * 0.28 +
              (environmentCells.length
                ? environment.readability * 18 +
                  environment.negativeSpace * 14 -
                  environment.complexity * 20 -
                  environment.edgePressure * 8
                : 0) +
              rolePlacementScore(role, rect, input.cells, anchors)
          );
          candidates.push({
            id: `${role}:${zone.id}:window-${windowIndex}`,
            role,
            rect,
            score,
            subjectOverlap,
            maximumProtection,
            regionCoverage,
            interactionMode: interaction.mode,
            interactionScore: interaction.score,
            environmentReadability: environmentCells.length
              ? environment.readability
              : undefined,
            environmentComplexity: environmentCells.length
              ? environment.complexity
              : undefined,
            discoveredZoneId: zone.id,
            discoveredZoneKind: zone.kind,
            rejected,
            reason: interaction.reason,
          });
      }
    }

    candidatesByRole.set(
      role,
      candidates
        .filter((candidate) => !candidate.rejected)
        .sort((a, b) => b.score - a.score)
    );
  }

  if (!coordinated) {
    return roles.flatMap((role) =>
      (candidatesByRole.get(role) ?? []).slice(0, maxPerRole)
    );
  }

  // Designers resolve the poster as one composition, not one independent
  // optimum per field. Select in hierarchy order and prevent secondary
  // roles from piling into the headline or each other.
  const hierarchy: SubjectCopyRole[] = [
    "headline",
    "accent",
    "presenter",
    "details",
    "price",
    "date",
    "venue",
    "compliance",
  ];
  const selected: CanvasTextCandidate[] = [];
  for (const role of hierarchy.filter((candidateRole) => roles.includes(candidateRole))) {
    let count = 0;
    for (const candidate of candidatesByRole.get(role) ?? []) {
      const collides = selected.some(
        (existing) => candidateCollisionRatio(candidate, existing) > 0.08
      );
      if (collides) continue;
      selected.push(candidate);
      count += 1;
      if (count >= maxPerRole) break;
    }
  }
  return selected;
}
