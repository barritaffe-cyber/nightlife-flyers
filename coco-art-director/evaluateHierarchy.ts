import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluateHierarchy(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];

  if (!metrics.headline) {
    findings.push(finding(
      "hierarchy:missing-headline",
      "critical",
      "The flyer has no clear headline.",
      "The event identity is missing or not rendered.",
      ["No rendered headline role was found."],
      [],
      30,
      true
    ));
    return findings;
  }

  const ratio = metrics.strongestSecondaryPower > 0
    ? metrics.headlinePower / metrics.strongestSecondaryPower
    : 99;

  const required =
    input.creativeDirection?.hierarchy?.headlineMustWinBy ??
    1.8;

  if (ratio < required) {
    findings.push(finding(
      "hierarchy:headline-not-dominant",
      ratio < 1.2 ? "critical" : "high",
      "The headline is not clearly winning the poster.",
      "A secondary element is too close to the headline in visual power.",
      [
        `Headline power: ${metrics.headlinePower.toFixed(1)}.`,
        `Strongest secondary power: ${metrics.strongestSecondaryPower.toFixed(1)}.`,
        `Observed dominance ratio: ${ratio.toFixed(2)}.`,
        `Required ratio: ${required.toFixed(2)}.`,
      ],
      [metrics.headline.id],
      ratio < 1.2 ? 24 : 16,
      ratio < 1.2
    ));
  }

  if (metrics.accent && metrics.accent.visualPower && metrics.accent.visualPower > metrics.headlinePower * 0.48) {
    findings.push(finding(
      "hierarchy:accent-too-strong",
      "high",
      "The accent is behaving like a second headline.",
      "Accent scale, weight, contrast, or effects exceed its supporting role.",
      [`Accent power ${metrics.accent.visualPower.toFixed(1)} exceeds 48% of headline power.`],
      [metrics.accent.id],
      14,
      false
    ));
  }

  if (metrics.metadata && metrics.metadata.visualPower && metrics.metadata.visualPower > metrics.headlinePower * 0.34) {
    findings.push(finding(
      "hierarchy:metadata-too-strong",
      "medium",
      "Supporting copy is too visually heavy.",
      "Metadata is styled as body display text instead of premium information.",
      [`Metadata power ${metrics.metadata.visualPower.toFixed(1)} is too close to headline power.`],
      [metrics.metadata.id],
      10,
      false
    ));
  }

  return findings;
}

function finding(
  id: string,
  severity: ArtDirectorFinding["severity"],
  observation: string,
  cause: string,
  evidence: string[],
  targetIds: string[],
  scorePenalty: number,
  blocker: boolean
): ArtDirectorFinding {
  return {
    id,
    category: "hierarchy",
    severity,
    confidence: 0.94,
    observation,
    cause,
    evidence,
    targetIds,
    contractIds: ["headline-wins", "accent-subordinate", "body-is-metadata"],
    scorePenalty,
    blocker,
    userFacingMessage: observation,
  };
}
