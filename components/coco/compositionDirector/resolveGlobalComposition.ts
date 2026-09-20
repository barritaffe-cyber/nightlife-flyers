import {
  rescoreCanvasComposition,
  type CanvasCompositionResult,
  type CapacityCheckedCandidate,
} from "./chooseCanvasComposition.ts";
import type {
  CompositionGuide,
  CompositionLockupId,
} from "./evaluateCompositionAssembly.ts";

type Rect = CapacityCheckedCandidate["rect"];

export type GlobalLockupMove = {
  id: CompositionLockupId;
  dx: number;
  dy: number;
  changed: boolean;
  rect: Rect;
};

export type GlobalCompositionResolution = {
  composition: CanvasCompositionResult;
  moves: GlobalLockupMove[];
  changed: boolean;
  improvement: number;
};

const LOCKUP_ORDER: CompositionLockupId[] = ["hero", "support", "facts", "footer"];
const ROLE_WEIGHT: Record<CapacityCheckedCandidate["role"], number> = {
  headline: 5,
  accent: 2.2,
  presenter: 1.4,
  details: 1.8,
  date: 1.7,
  price: 1.7,
  venue: 1.4,
  compliance: 0.7,
};

function unionRect(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x, y, width: right - x, height: bottom - y };
}

function guidePosition(rect: Rect, guide: CompositionGuide) {
  if (guide === "right") return rect.x + rect.width;
  if (guide === "center") return rect.x + rect.width / 2;
  return rect.x;
}

function overlapRatio(a: Rect, b: Rect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

function uniqueTranslations(values: Array<{ dx: number; dy: number }>) {
  const seen = new Set<string>();
  return values.filter(({ dx, dy }) => {
    const key = `${Math.round(dx * 10)}:${Math.round(dy * 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function translationOptions(input: {
  id: CompositionLockupId;
  rect: Rect;
  guide: CompositionGuide;
  globalGuide: number;
  centered: boolean;
}) {
  const guideDx = input.globalGuide - guidePosition(input.rect, input.guide);
  const centerDx = 50 - (input.rect.x + input.rect.width / 2);
  const footerDy = 96 - (input.rect.y + input.rect.height);
  const vertical = input.id === "footer"
    ? [0, footerDy, Math.max(-5, Math.min(5, footerDy))]
    : [0, -4, 4];
  const horizontal = [
    0,
    Math.max(-10, Math.min(10, guideDx)),
    ...(input.centered ? [Math.max(-10, Math.min(10, centerDx))] : []),
    -4,
    4,
  ];
  return uniqueTranslations(
    horizontal.flatMap((dx) => vertical.map((dy) => ({ dx, dy })))
  );
}

function translate(candidate: CapacityCheckedCandidate, dx: number, dy: number) {
  return {
    ...candidate,
    rect: { ...candidate.rect, x: candidate.rect.x + dx, y: candidate.rect.y + dy },
  };
}

function globalScore(input: {
  composition: CanvasCompositionResult;
  originalById: Map<string, CapacityCheckedCandidate>;
  subjectCenterX: number;
  quality?: (candidate: CapacityCheckedCandidate, rect: Rect) => number;
}) {
  const placements = input.composition.placements;
  let marginPenalty = 0;
  let movementPenalty = 0;
  let qualityScore = 0;
  let weightedX = input.subjectCenterX * 6;
  let totalWeight = 6;
  for (const candidate of placements) {
    const edge = Math.min(
      candidate.rect.x,
      candidate.rect.y,
      100 - candidate.rect.x - candidate.rect.width,
      100 - candidate.rect.y - candidate.rect.height
    );
    marginPenalty += Math.max(0, 3 - edge) * 5;
    const original = input.originalById.get(candidate.id);
    if (original) {
      movementPenalty += Math.hypot(
        candidate.rect.x - original.rect.x,
        candidate.rect.y - original.rect.y
      ) * 0.12;
    }
    qualityScore += (input.quality?.(candidate, candidate.rect) ?? 0.5) * ROLE_WEIGHT[candidate.role];
    const weight = ROLE_WEIGHT[candidate.role];
    weightedX += (candidate.rect.x + candidate.rect.width / 2) * weight;
    totalWeight += weight;
  }
  const opticalBalancePenalty = Math.abs(weightedX / totalWeight - 50) * 1.1;
  const footer = input.composition.assembly.lockups.find((lockup) => lockup.id === "footer");
  const otherBottom = Math.max(
    0,
    ...input.composition.assembly.lockups
      .filter((lockup) => lockup.id !== "footer")
      .map((lockup) => lockup.rect.y + lockup.rect.height)
  );
  const footerOrderPenalty = footer && footer.rect.y < otherBottom - 2
    ? (otherBottom - footer.rect.y) * 1.5
    : 0;
  return input.composition.score + qualityScore * 1.4 - marginPenalty -
    movementPenalty - opticalBalancePenalty - footerOrderPenalty;
}

/**
 * Searches whole-flyer alternatives by translating complete lockups. Child
 * offsets never change here; the lockup resolver remains their sole owner.
 */
export function resolveGlobalComposition(input: {
  composition: CanvasCompositionResult;
  subjectCenterX?: number;
  validate?: (candidate: CapacityCheckedCandidate, rect: Rect) => boolean;
  quality?: (candidate: CapacityCheckedCandidate, rect: Rect) => number;
  beamWidth?: number;
}): GlobalCompositionResolution {
  const originalById = new Map(
    input.composition.placements.map((candidate) => [candidate.id, candidate])
  );
  const grammar = input.composition.diagnostics.grammarId;
  const centered = grammar.startsWith("centered");
  const hero = input.composition.assembly.lockups.find((lockup) => lockup.id === "hero");
  const globalGuide = centered
    ? 50
    : hero?.guidePosition ?? (grammar === "left-editorial" ? 8 : 92);
  const groups = LOCKUP_ORDER.flatMap((id) => {
    const lockup = input.composition.assembly.lockups.find((candidate) => candidate.id === id);
    if (!lockup) return [];
    const members = input.composition.placements.filter((candidate) =>
      lockup.roles.includes(candidate.role)
    );
    return members.length ? [{ id, guide: lockup.guide, members }] : [];
  });
  const beamWidth = Math.max(12, input.beamWidth ?? 56);
  let beam: Array<{ placements: CapacityCheckedCandidate[]; moves: GlobalLockupMove[] }> = [
    { placements: [], moves: [] },
  ];

  for (const group of groups) {
    const rect = unionRect(group.members.map((member) => member.rect));
    const options = translationOptions({
      id: group.id,
      rect,
      guide: centered ? "center" : group.guide,
      globalGuide,
      centered,
    });
    const next = beam.flatMap((entry) => options.flatMap(({ dx, dy }) => {
      const moved = group.members.map((member) => translate(member, dx, dy));
      const inside = moved.every((candidate) =>
        candidate.rect.x >= 0 && candidate.rect.y >= 0 &&
        candidate.rect.x + candidate.rect.width <= 100 &&
        candidate.rect.y + candidate.rect.height <= 100
      );
      const safe = inside && moved.every((candidate) =>
        (input.validate?.(candidate, candidate.rect) ?? true) &&
        entry.placements.every((other) => overlapRatio(candidate.rect, other.rect) <= 0.08)
      );
      if (!safe) return [];
      return [{
        placements: [...entry.placements, ...moved],
        moves: [...entry.moves, {
          id: group.id,
          dx,
          dy,
          changed: Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05,
          rect: { ...rect, x: rect.x + dx, y: rect.y + dy },
        }],
      }];
    }));
    beam = next
      .map((entry) => {
        const composition = rescoreCanvasComposition({
          placements: entry.placements,
          rejectedCandidateCount: input.composition.rejectedCandidateCount,
        });
        return {
          entry,
          score: globalScore({
            composition,
            originalById,
            subjectCenterX: input.subjectCenterX ?? 50,
            quality: input.quality,
          }),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth)
      .map(({ entry }) => entry);
  }

  const baselineScore = globalScore({
    composition: input.composition,
    originalById,
    subjectCenterX: input.subjectCenterX ?? 50,
    quality: input.quality,
  });
  const winner = beam
    .map((entry) => {
      const composition = rescoreCanvasComposition({
        placements: entry.placements,
        rejectedCandidateCount: input.composition.rejectedCandidateCount,
      });
      return {
        ...entry,
        composition,
        score: globalScore({
          composition,
          originalById,
          subjectCenterX: input.subjectCenterX ?? 50,
          quality: input.quality,
        }),
      };
    })
    .sort((a, b) => b.score - a.score)[0];
  if (!winner || winner.score <= baselineScore + 0.25) {
    return { composition: input.composition, moves: [], changed: false, improvement: 0 };
  }
  return {
    composition: winner.composition,
    moves: winner.moves,
    changed: winner.moves.some((move) => move.changed),
    improvement: winner.score - baselineScore,
  };
}
