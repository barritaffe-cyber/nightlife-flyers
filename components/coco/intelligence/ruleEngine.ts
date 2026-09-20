import type { CocoCanvasSnapshot, CocoFinding, CocoRule } from "./types.ts";
import { alignmentRule } from "./rules/alignment.ts";
import { balanceRule } from "./rules/balance.ts";
import { hierarchyRule } from "./rules/hierarchy.ts";
import { marginsRule } from "./rules/margins.ts";
import { nightlifeImpactRule } from "./rules/nightlifeImpact.ts";
import { readabilityRule } from "./rules/readability.ts";
import { rhythmRule } from "./rules/rhythm.ts";
import { subjectOverlapRule } from "./rules/subjectOverlap.ts";

export const COCO_CREATIVE_DIRECTOR_RULES: CocoRule[] = [
  readabilityRule,
  subjectOverlapRule,
  balanceRule,
  nightlifeImpactRule,
  hierarchyRule,
  rhythmRule,
  marginsRule,
  alignmentRule,
];

export function runCocoRules(
  snapshot: CocoCanvasSnapshot,
  rules: CocoRule[] = COCO_CREATIVE_DIRECTOR_RULES
): CocoFinding[] {
  return rules.flatMap((rule) =>
    rule
      .evaluate(snapshot)
      .filter((finding) => Number.isFinite(finding.confidence) && finding.confidence > 0)
      .map((finding) => ({
        ...finding,
        confidence: Math.max(0, Math.min(1, finding.confidence)),
        styleContext: finding.styleContext ?? snapshot.nightlifeStyle,
      }))
  );
}
