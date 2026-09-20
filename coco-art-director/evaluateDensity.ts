import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluateDensity(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];

  const policy = input.creativeDirection?.informationDensity ??
    input.scene?.creativeDecisions?.densityPolicy?.policy ??
    "low";

  const maxGroups =
    input.scene?.creativeDecisions?.densityPolicy?.maxVisibleGroups ??
    (policy === "minimal" ? 4 : policy === "low" ? 5 : policy === "medium" ? 6 : 8);

  if (metrics.visibleGroupCount > maxGroups) {
    findings.push({
      id: "density:too-many-groups",
      category: "informationDensity",
      severity: metrics.visibleGroupCount > maxGroups + 2 ? "high" : "medium",
      confidence: 0.94,
      observation: "The flyer is carrying too many visible information groups.",
      cause: "Low-priority copy was rendered instead of merged, muted, or hidden.",
      evidence: [
        `Visible groups: ${metrics.visibleGroupCount}.`,
        `Allowed groups: ${maxGroups}.`,
      ],
      targetIds: metrics.textElements.map((element) => element.id),
      contractIds: ["low-density", "body-is-metadata"],
      scorePenalty: 10,
      blocker: false,
      userFacingMessage: "The flyer needs less visible copy.",
    });
  }

  if (metrics.fontCount > (input.typography?.maxFontFamilies ?? 2)) {
    findings.push({
      id: "density:too-many-fonts",
      category: "typography",
      severity: "high",
      confidence: 0.98,
      observation: "Too many font families are weakening the design system.",
      cause: "The renderer introduced fonts outside the typography contract.",
      evidence: [
        `Rendered font count: ${metrics.fontCount}.`,
        `Allowed font count: ${input.typography?.maxFontFamilies ?? 2}.`,
      ],
      targetIds: metrics.textElements.map((element) => element.id),
      contractIds: ["renderer-obedience"],
      scorePenalty: 14,
      blocker: true,
      userFacingMessage: "The typography needs to return to one or two font families.",
    });
  }

  return findings;
}
