import {
  scoreSubjectRegionInteraction,
  type SubjectCopyRole,
  type SubjectRegionCoverage,
} from "../subjectGeometry/buildSubjectInteractionMap.ts";
import type { CanvasInteractionCell } from "../subjectGeometry/buildCanvasTextCandidates.ts";

export type RenderedCompositionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RenderedZoneEvidence = {
  allocatedRect?: RenderedCompositionRect;
  candidateId: string;
  role: SubjectCopyRole;
  rect: RenderedCompositionRect;
  overflowX: number;
  overflowY: number;
};

export type RenderedCompositionCritique = {
  passed: boolean;
  rejectedCandidateIds: string[];
  issues: Array<{
    candidateIds: string[];
    kind:
      | "face-overlap"
      | "headline-underfill"
      | "subject-region-overlap"
      | "text-collision"
      | "text-overflow";
    severity: number;
  }>;
};

function intersectionArea(a: RenderedCompositionRect, b: RenderedCompositionRect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function overlapRatio(a: RenderedCompositionRect, b: RenderedCompositionRect) {
  return intersectionArea(a, b) / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

export function critiqueRenderedComposition(input: {
  zones: RenderedZoneEvidence[];
  faceRect?: RenderedCompositionRect | null;
  subjectCells?: CanvasInteractionCell[];
  overflowTolerancePx?: number;
}): RenderedCompositionCritique {
  const issues: RenderedCompositionCritique["issues"] = [];
  const rejected = new Set<string>();
  const overflowTolerance = Math.max(0, input.overflowTolerancePx ?? 1.5);

  for (const zone of input.zones) {
    const overflow = Math.max(zone.overflowX, zone.overflowY);
    if (overflow > overflowTolerance) {
      issues.push({ candidateIds: [zone.candidateId], kind: "text-overflow", severity: overflow });
      rejected.add(zone.candidateId);
    }
    if (zone.role === "headline" && zone.allocatedRect) {
      const widthOccupancy = zone.rect.width / Math.max(1, zone.allocatedRect.width);
      if (widthOccupancy < 0.58) {
        issues.push({
          candidateIds: [zone.candidateId],
          kind: "headline-underfill",
          severity: 1 - widthOccupancy,
        });
        rejected.add(zone.candidateId);
      }
    }
    if (input.faceRect) {
      const faceOverlap = overlapRatio(zone.rect, input.faceRect);
      if (faceOverlap > 0.035) {
        issues.push({
          candidateIds: [zone.candidateId],
          kind: "face-overlap",
          severity: faceOverlap,
        });
        rejected.add(zone.candidateId);
      }
    }
    if (input.subjectCells?.length) {
      const policyRect = zone.allocatedRect ?? zone.rect;
      const policyArea = Math.max(1, policyRect.width * policyRect.height);
      const regionCoverage: SubjectRegionCoverage = {};
      let subjectOverlap = 0;
      let maximumProtection = 0;
      for (const cell of input.subjectCells) {
        if (cell.region === "background") continue;
        const intersection = intersectionArea(zone.rect, {
          x: cell.canvasX,
          y: cell.canvasY,
          width: cell.canvasWidth,
          height: cell.canvasHeight,
        });
        if (intersection <= 0) continue;
        const coverage = intersection * cell.subjectCoverage / policyArea;
        regionCoverage[cell.region] = (regionCoverage[cell.region] ?? 0) + coverage;
        subjectOverlap += coverage;
        maximumProtection = Math.max(maximumProtection, cell.protection);
      }
      const interaction = scoreSubjectRegionInteraction({
        role: zone.role,
        regionCoverage,
        subjectOverlap,
        maximumProtection,
      });
      if (!interaction.allowed) {
        issues.push({
          candidateIds: [zone.candidateId],
          kind: "subject-region-overlap",
          severity: subjectOverlap,
        });
        rejected.add(zone.candidateId);
      }
    }
  }

  for (let first = 0; first < input.zones.length; first += 1) {
    for (let second = first + 1; second < input.zones.length; second += 1) {
      const a = input.zones[first];
      const b = input.zones[second];
      const overlap = overlapRatio(a.rect, b.rect);
      if (overlap <= 0.025) continue;
      issues.push({
        candidateIds: [a.candidateId, b.candidateId],
        kind: "text-collision",
        severity: overlap,
      });
      // Preserve the higher-hierarchy role and reject the weaker member.
      const priority: Record<SubjectCopyRole, number> = {
        headline: 8,
        accent: 7,
        details: 6,
        presenter: 5,
        date: 4,
        price: 4,
        venue: 3,
        compliance: 2,
      };
      rejected.add(priority[a.role] >= priority[b.role] ? b.candidateId : a.candidateId);
    }
  }

  return {
    issues,
    passed: issues.length === 0,
    rejectedCandidateIds: [...rejected],
  };
}
