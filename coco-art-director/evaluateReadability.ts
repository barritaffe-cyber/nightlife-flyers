import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluateReadability(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];

  for (const element of metrics.textElements) {
    const critical = ["headline", "identity", "metadata", "logistics", "venue"].includes(element.role);
    const minimum =
      element.role === "headline" || element.role === "identity" ? 4.5 :
      element.role === "metadata" || element.role === "logistics" ? 4 :
      element.role === "venue" ? 3.6 :
      3;

    const ratio = element.contrastRatio ?? 0;
    if (critical && ratio > 0 && ratio < minimum) {
      findings.push({
        id: `readability:contrast:${element.id}`,
        category: "readability",
        severity: ratio < 2.5 ? "critical" : "high",
        confidence: 0.97,
        observation: `${label(element.role)} is getting lost in the image.`,
        cause: "Local text-to-background contrast is below the required threshold.",
        evidence: [
          `Observed contrast: ${ratio.toFixed(2)}.`,
          `Required contrast: ${minimum.toFixed(2)}.`,
        ],
        targetIds: [element.id],
        contractIds: ["accessibility", "headline-wins"],
        scorePenalty: ratio < 2.5 ? 22 : 14,
        blocker: ratio < 2.5,
        userFacingMessage: `${label(element.role)} is getting lost. I would strengthen the contrast.`,
      });
    }

    if ((element.lineCount ?? 1) > 4 && !["footer"].includes(element.role)) {
      findings.push({
        id: `readability:too-many-lines:${element.id}`,
        category: "readability",
        severity: "medium",
        confidence: 0.9,
        observation: `${label(element.role)} has too many lines.`,
        cause: "The copy block exceeds the reading rhythm expected for a flyer.",
        evidence: [`Rendered lines: ${element.lineCount}.`],
        targetIds: [element.id],
        contractIds: ["body-is-metadata"],
        scorePenalty: 8,
        blocker: false,
        userFacingMessage: `${label(element.role)} needs to be shortened or recomposed.`,
      });
    }

    if ((element.opacity ?? 1) < 0.62 && critical) {
      findings.push({
        id: `readability:opacity:${element.id}`,
        category: "readability",
        severity: "high",
        confidence: 0.92,
        observation: `${label(element.role)} is too faint.`,
        cause: "Opacity is too low for an important information role.",
        evidence: [`Opacity: ${element.opacity.toFixed(2)}.`],
        targetIds: [element.id],
        contractIds: [],
        scorePenalty: 12,
        blocker: false,
        userFacingMessage: `${label(element.role)} is too faint to read quickly.`,
      });
    }
  }

  return findings;
}

function label(role: string): string {
  return role.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
