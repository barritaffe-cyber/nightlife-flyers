import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluatePremiumPolish(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];
  const identity = input.creativeDirection?.posterIdentity ?? "";

  if (/luxury|editorial|fashion|lifestyle/.test(identity)) {
    const highEffectCount = metrics.textElements.filter((element) => {
      const effects = element.effects ?? {};
      return (effects.glow ?? 0) > 0.12 || (effects.stroke ?? 0) > 0.1 || (effects.blur ?? 0) > 0.08;
    }).length;

    if (highEffectCount > 1) {
      findings.push({
        id: "premium:too-many-effects",
        category: "premiumPolish",
        severity: "high",
        confidence: 0.92,
        observation: "The poster feels over-treated for its premium direction.",
        cause: "Multiple strong effects are competing with scale, spacing, and image quality.",
        evidence: [`Strongly treated text roles: ${highEffectCount}.`],
        targetIds: metrics.textElements.map((element) => element.id),
        contractIds: ["luxury-restraint", "no-cheap-decoration"],
        scorePenalty: 12,
        blocker: false,
        userFacingMessage: "The premium direction needs more restraint.",
      });
    }

    if (metrics.visibleGroupCount > 6) {
      findings.push({
        id: "premium:too-much-information",
        category: "premiumPolish",
        severity: "medium",
        confidence: 0.88,
        observation: "The poster has lost premium breathing room.",
        cause: "Too many groups are visible at once.",
        evidence: [`Visible groups: ${metrics.visibleGroupCount}.`],
        targetIds: metrics.textElements.map((element) => element.id),
        contractIds: ["low-density"],
        scorePenalty: 8,
        blocker: false,
        userFacingMessage: "The premium look needs fewer visible information groups.",
      });
    }
  }

  return findings;
}
