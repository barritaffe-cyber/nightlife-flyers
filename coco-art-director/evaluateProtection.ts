import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";
import { overlapRatio } from "./geometry.ts";

export function evaluateSubjectProtection(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];

  for (const zone of input.scene?.protectionZones ?? []) {
    for (const element of metrics.textElements) {
      const ratio = overlapRatio(element.rect, zone.rect, "b");
      if (ratio <= zone.allowOverlapRatio) continue;

      const critical = zone.importance === "critical";
      findings.push({
        id: `protection:${zone.target}:${element.id}`,
        category: "subjectProtection",
        severity: critical ? "critical" : zone.importance === "high" ? "high" : "medium",
        confidence: 0.98,
        observation: `${element.role} is covering the ${zone.target}.`,
        cause: "Typography exceeds the allowed overlap for a protected scene feature.",
        evidence: [
          `Overlap ratio: ${ratio.toFixed(3)}.`,
          `Allowed ratio: ${zone.allowOverlapRatio.toFixed(3)}.`,
        ],
        targetIds: [element.id],
        contractIds: ["protect-scene", "face-gaze-protection"],
        scorePenalty: critical ? 26 : 14,
        blocker: critical,
        userFacingMessage: `The ${zone.target} needs to stay clear.`,
      });
    }
  }

  return findings;
}
