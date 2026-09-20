import {
  rescoreCanvasComposition,
  type CanvasCompositionResult,
  type CapacityCheckedCandidate,
} from "./chooseCanvasComposition.ts";
import type { CompositionLockupId } from "./evaluateCompositionAssembly.ts";
import type { RenderedCompositionCritique } from "./critiqueRenderedComposition.ts";

type Rect = CapacityCheckedCandidate["rect"];

export type RenderedLockupRepair = {
  id: CompositionLockupId;
  candidateIds: string[];
  dx: number;
  dy: number;
  fontAdjusted: boolean;
  moved: boolean;
};

export type RenderedCompositionRepairResult = {
  composition: CanvasCompositionResult;
  repairs: RenderedLockupRepair[];
  changed: boolean;
};

const TRANSLATIONS = [
  { dx: -4, dy: 0 },
  { dx: 4, dy: 0 },
  { dx: 0, dy: -4 },
  { dx: 0, dy: 4 },
  { dx: -4, dy: -4 },
  { dx: 4, dy: -4 },
  { dx: -4, dy: 4 },
  { dx: 4, dy: 4 },
  { dx: -8, dy: 0 },
  { dx: 8, dy: 0 },
  { dx: 0, dy: -8 },
  { dx: 0, dy: 8 },
];

function overlapRatio(a: Rect, b: Rect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

function translate(candidate: CapacityCheckedCandidate, dx: number, dy: number) {
  return {
    ...candidate,
    rect: { ...candidate.rect, x: candidate.rect.x + dx, y: candidate.rect.y + dy },
  };
}

function insideCanvas(rect: Rect) {
  return rect.x >= 0 && rect.y >= 0 &&
    rect.x + rect.width <= 100 && rect.y + rect.height <= 100;
}

function adjustedFontSize(
  candidate: CapacityCheckedCandidate,
  critique: RenderedCompositionCritique
) {
  let scale = 1;
  for (const issue of critique.issues) {
    if (!issue.candidateIds.includes(candidate.id)) continue;
    if (issue.kind === "text-overflow") {
      scale = Math.min(scale, Math.max(0.78, 0.94 - Math.min(0.12, issue.severity / 200)));
    } else if (issue.kind === "headline-underfill" && candidate.role === "headline") {
      scale = Math.max(scale, Math.min(1.18, 1 + issue.severity * 0.22));
    } else if (issue.kind === "text-collision") {
      scale = Math.min(scale, 0.94);
    }
  }
  if (Math.abs(scale - 1) < 0.005) return candidate;
  return {
    ...candidate,
    capacity: {
      ...candidate.capacity,
      fontSize: Math.max(8, Math.round(candidate.capacity.fontSize * scale * 10) / 10),
    },
  };
}

/**
 * Repairs actual rendered failures at lockup scope. No candidate is deleted:
 * spatial failures translate the complete owning group, while ink-size
 * failures tune its measured font treatment and preserve its allocated zone.
 */
export function repairRenderedComposition(input: {
  composition: CanvasCompositionResult;
  critique: RenderedCompositionCritique;
  validate?: (candidate: CapacityCheckedCandidate, rect: Rect) => boolean;
}): RenderedCompositionRepairResult {
  if (input.critique.passed) {
    return { composition: input.composition, repairs: [], changed: false };
  }
  let placements = input.composition.placements.map((candidate) => ({ ...candidate }));
  const affectedIds = new Set(input.critique.rejectedCandidateIds);
  const spatialIds = new Set(
    input.critique.issues
      .filter((issue) =>
        issue.kind === "face-overlap" ||
        issue.kind === "subject-region-overlap" ||
        issue.kind === "text-collision"
      )
      .flatMap((issue) =>
        issue.candidateIds.filter((candidateId) => affectedIds.has(candidateId))
      )
  );
  const repairs: RenderedLockupRepair[] = [];

  for (const lockup of input.composition.assembly.lockups) {
    const memberIds = new Set(
      placements
        .filter((candidate) => lockup.roles.includes(candidate.role))
        .map((candidate) => candidate.id)
    );
    const affectedMembers = [...memberIds].filter((id) => affectedIds.has(id));
    if (!affectedMembers.length) continue;
    const before = placements.filter((candidate) => memberIds.has(candidate.id));
    const fontAdjustedMembers = before.map((candidate) => adjustedFontSize(candidate, input.critique));
    const fontAdjusted = fontAdjustedMembers.some((candidate, index) =>
      candidate.capacity.fontSize !== before[index].capacity.fontSize
    );
    const needsMove = affectedMembers.some((id) => spatialIds.has(id));
    const outsiders = placements.filter((candidate) => !memberIds.has(candidate.id));
    let dx = 0;
    let dy = 0;
    let resolvedMembers = fontAdjustedMembers;

    if (needsMove) {
      const option = TRANSLATIONS.find((translation) => {
        const moved = fontAdjustedMembers.map((candidate) =>
          translate(candidate, translation.dx, translation.dy)
        );
        return moved.every((candidate) =>
          insideCanvas(candidate.rect) &&
          (input.validate?.(candidate, candidate.rect) ?? true) &&
          outsiders.every((other) => overlapRatio(candidate.rect, other.rect) <= 0.08)
        );
      });
      if (option) {
        dx = option.dx;
        dy = option.dy;
        resolvedMembers = fontAdjustedMembers.map((candidate) => translate(candidate, dx, dy));
      }
    }

    const byId = new Map(resolvedMembers.map((candidate) => [candidate.id, candidate]));
    placements = placements.map((candidate) => byId.get(candidate.id) ?? candidate);
    repairs.push({
      id: lockup.id,
      candidateIds: affectedMembers,
      dx,
      dy,
      fontAdjusted,
      moved: dx !== 0 || dy !== 0,
    });
  }

  const changed = repairs.some((repair) => repair.fontAdjusted || repair.moved);
  return {
    composition: changed
      ? rescoreCanvasComposition({
          placements,
          rejectedCandidateCount: input.composition.rejectedCandidateCount,
        })
      : input.composition,
    repairs,
    changed,
  };
}
