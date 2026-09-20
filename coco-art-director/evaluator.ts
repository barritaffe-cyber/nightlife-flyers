import type {
  ArtDirectorFinding,
  ArtDirectorInput,
} from "./types.ts";
import { deriveMetrics } from "./metrics.ts";
import { evaluateHierarchy } from "./evaluateHierarchy.ts";
import { evaluateReadability } from "./evaluateReadability.ts";
import { evaluateComposition } from "./evaluateComposition.ts";
import { evaluateSubjectProtection } from "./evaluateProtection.ts";
import { evaluateDensity } from "./evaluateDensity.ts";
import { evaluateEffects } from "./evaluateEffects.ts";
import { evaluateMarketingClarity } from "./evaluateMarketing.ts";
import { evaluateExportIntegrity } from "./evaluateExport.ts";
import { evaluatePremiumPolish } from "./evaluatePremium.ts";
import { severityWeight, stableSort } from "./utils.ts";

export function evaluateArtwork(
  input: ArtDirectorInput
): ArtDirectorFinding[] {
  const metrics = deriveMetrics(input);

  const findings = [
    ...evaluateHierarchy(input, metrics),
    ...evaluateReadability(input, metrics),
    ...evaluateComposition(input, metrics),
    ...evaluateSubjectProtection(input, metrics),
    ...evaluateDensity(input, metrics),
    ...evaluateEffects(input, metrics),
    ...evaluateMarketingClarity(input, metrics),
    ...evaluateExportIntegrity(input),
    ...evaluatePremiumPolish(input, metrics),
  ];

  const dismissed = new Set(input.learning?.dismissedFindingIds ?? []);

  return stableSort(
    findings.filter((finding) => !dismissed.has(finding.id)),
    (a, b) =>
      Number(b.blocker) - Number(a.blocker) ||
      severityWeight(b.severity) - severityWeight(a.severity) ||
      b.scorePenalty - a.scorePenalty ||
      b.confidence - a.confidence
  );
}
