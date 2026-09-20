import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluateEffects(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];
  const policy = input.effects?.policy ??
    input.creativeDirection?.effects?.policy ??
    input.scene?.creativeDecisions?.effectPolicy?.policy ??
    "moderate";

  const glowing = metrics.textElements.filter((element) => (element.effects?.glow ?? 0) > 0.08);
  const blurred = metrics.textElements.filter((element) => (element.effects?.blur ?? 0) > 0.08);
  const stroked = metrics.textElements.filter((element) => (element.effects?.stroke ?? 0) > 0.08);

  if ((policy === "restrained" || policy === "none") && glowing.length > 1) {
    findings.push({
      id: "effects:too-many-glows",
      category: "effects",
      severity: "high",
      confidence: 0.95,
      observation: "Too many text layers are glowing.",
      cause: "The design is using effects as hierarchy instead of scale, spacing, and contrast.",
      evidence: [`Glowing roles: ${glowing.map((element) => element.role).join(", ")}.`],
      targetIds: glowing.map((element) => element.id),
      contractIds: ["restrained-effects", "one-signature-move"],
      scorePenalty: 12,
      blocker: false,
      userFacingMessage: "The poster will feel more premium with one restrained effect.",
    });
  }

  if (blurred.some((element) => ["metadata", "venue", "logistics"].includes(element.role))) {
    findings.push({
      id: "effects:blurred-information",
      category: "effects",
      severity: "high",
      confidence: 0.96,
      observation: "Important information is being softened by blur.",
      cause: "Blur is applied to functional copy.",
      evidence: [`Affected roles: ${blurred.map((element) => element.role).join(", ")}.`],
      targetIds: blurred.map((element) => element.id),
      contractIds: [],
      scorePenalty: 14,
      blocker: false,
      userFacingMessage: "The information copy needs to stay crisp.",
    });
  }

  if (stroked.length > 2) {
    findings.push({
      id: "effects:too-many-strokes",
      category: "effects",
      severity: "medium",
      confidence: 0.9,
      observation: "The typography is over-outlined.",
      cause: "Multiple roles use visible strokes, flattening the hierarchy.",
      evidence: [`Stroked roles: ${stroked.map((element) => element.role).join(", ")}.`],
      targetIds: stroked.map((element) => element.id),
      contractIds: ["one-signature-move"],
      scorePenalty: 8,
      blocker: false,
      userFacingMessage: "Keep the stroke on one role, not the whole flyer.",
    });
  }

  return findings;
}
