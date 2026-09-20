import type { CapacityCheckedCandidate } from "./chooseCanvasComposition.ts";
import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";

export type CompositionLockupId = "hero" | "support" | "facts" | "footer";
export type CompositionGuide = "left" | "center" | "right";

export type CompositionLockupPlan = {
  id: CompositionLockupId;
  roles: SubjectCopyRole[];
  guide: CompositionGuide;
  guidePosition: number;
  cohesionScore: number;
  rect: { x: number; y: number; width: number; height: number };
};

export type CompositionAssemblyPlan = {
  lockups: CompositionLockupPlan[];
  score: number;
  cohesionScore: number;
  sharedGuideScore: number;
  isolationPenalty: number;
};

const LOCKUP_ROLES: Record<CompositionLockupId, SubjectCopyRole[]> = {
  hero: ["headline", "accent"],
  support: ["presenter", "details"],
  facts: ["date", "price"],
  footer: ["venue", "compliance"],
};

const rectCenter = (rect: CapacityCheckedCandidate["rect"]) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

function edgeGap(a: CapacityCheckedCandidate["rect"], b: CapacityCheckedCandidate["rect"]) {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0);
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0);
  return Math.hypot(dx, dy);
}

function unionRect(candidates: CapacityCheckedCandidate[]) {
  const left = Math.min(...candidates.map((candidate) => candidate.rect.x));
  const top = Math.min(...candidates.map((candidate) => candidate.rect.y));
  const right = Math.max(...candidates.map((candidate) => candidate.rect.x + candidate.rect.width));
  const bottom = Math.max(...candidates.map((candidate) => candidate.rect.y + candidate.rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function bestGuide(candidates: CapacityCheckedCandidate[]) {
  const options: Array<{ guide: CompositionGuide; values: number[] }> = [
    { guide: "left", values: candidates.map((candidate) => candidate.rect.x) },
    {
      guide: "center",
      values: candidates.map((candidate) => candidate.rect.x + candidate.rect.width / 2),
    },
    {
      guide: "right",
      values: candidates.map((candidate) => candidate.rect.x + candidate.rect.width),
    },
  ];
  return options
    .map((option) => {
      const position = option.values.reduce((sum, value) => sum + value, 0) / option.values.length;
      const variance = option.values.reduce((sum, value) => sum + Math.abs(value - position), 0);
      return { guide: option.guide, position, variance };
    })
    .sort((a, b) => a.variance - b.variance)[0];
}

export function evaluateCompositionAssembly(
  placements: CapacityCheckedCandidate[]
): CompositionAssemblyPlan {
  const lockups = (Object.entries(LOCKUP_ROLES) as Array<
    [CompositionLockupId, SubjectCopyRole[]]
  >).flatMap(([id, roles]) => {
    const members = roles.flatMap((role) => {
      const candidate = placements.find((placement) => placement.role === role);
      return candidate ? [candidate] : [];
    });
    if (!members.length) return [];
    const guide = bestGuide(members);
    let cohesionScore = members.length === 1 ? 0 : 0;
    if (members.length > 1) {
      const gap = edgeGap(members[0].rect, members[1].rect);
      cohesionScore += Math.max(-22, 18 - gap * 1.25);
      cohesionScore += Math.max(-8, 10 - guide.variance * 1.5);
      if (id === "facts") {
        cohesionScore += Math.max(
          -8,
          7 - Math.abs(rectCenter(members[0].rect).y - rectCenter(members[1].rect).y) * 0.55
        );
      }
      if (id === "footer") {
        cohesionScore += Math.max(0, (rectCenter(unionRect(members)).y - 72) * 0.5);
      }
    }
    return [{
      id,
      roles: members.map((member) => member.role),
      guide: guide.guide,
      guidePosition: guide.position,
      cohesionScore,
      rect: unionRect(members),
    }];
  });

  const completeLockups = lockups.filter((lockup) => lockup.roles.length > 1);
  const incompleteLockups = lockups.filter((lockup) => lockup.roles.length === 1);
  const cohesionScore = lockups.reduce((sum, lockup) => sum + lockup.cohesionScore, 0);
  let sharedGuideScore = 0;
  for (let first = 0; first < completeLockups.length; first += 1) {
    for (let second = first + 1; second < completeLockups.length; second += 1) {
      const a = completeLockups[first];
      const b = completeLockups[second];
      if (a.guide !== b.guide) continue;
      sharedGuideScore += Math.max(0, 6 - Math.abs(a.guidePosition - b.guidePosition) * 0.45);
    }
  }
  const isolationPenalty = incompleteLockups.length * 2.5;
  return {
    lockups,
    cohesionScore,
    sharedGuideScore,
    isolationPenalty,
    score: cohesionScore + sharedGuideScore - isolationPenalty,
  };
}

export function canCandidateJoinAssembly(
  arrangement: CapacityCheckedCandidate[],
  candidate: CapacityCheckedCandidate
) {
  const parentByRole: Partial<Record<SubjectCopyRole, SubjectCopyRole>> = {
    accent: "headline",
    details: "presenter",
    price: "date",
    compliance: "venue",
  };
  const parentRole = parentByRole[candidate.role];
  if (!parentRole) return true;
  const parent = arrangement.find((placement) => placement.role === parentRole);
  if (!parent) return true;
  const gap = edgeGap(parent.rect, candidate.rect);
  const verticalDifference = Math.abs(rectCenter(parent.rect).y - rectCenter(candidate.rect).y);
  if (candidate.role === "accent") return gap <= 24;
  if (candidate.role === "details") return gap <= 32;
  if (candidate.role === "price") return gap <= 35 || verticalDifference <= 25;
  if (candidate.role === "compliance") return gap <= 30;
  return true;
}
