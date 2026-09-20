import type {
  CopyArchitectureCandidate,
  CopyArchitectInput,
  CopyArchitecturePattern,
  CopyFact,
  CopyTone,
} from "./types.ts";
import { buildGroupsForPattern } from "./patterns.ts";
import { scoreCopyArchitecture } from "./scoring.ts";
import { slug } from "./utils.ts";

export function buildCopyCandidate(
  input: CopyArchitectInput,
  facts: CopyFact[],
  pattern: CopyArchitecturePattern,
  tone: CopyTone,
  index: number
): CopyArchitectureCandidate {
  const density =
    input.creativeDirection?.informationDensity ??
    (input.scene?.creativeDecisions?.densityPolicy?.policy as any) ??
    "low";

  const groups = buildGroupsForPattern(pattern, facts, input, tone);
  const partial = {
    id: `copy-${slug(pattern)}-${index + 1}`,
    name: nameForPattern(pattern),
    pattern,
    tone,
    density,
    groups,
    reasoning: [
      `Pattern ${pattern} was generated for ${input.creativeDirection?.marketingGoal ?? input.scene?.creativeDecisions?.marketingIntent ?? "sell-event"}.`,
      `Tone is ${tone}.`,
      `Density is ${density}.`,
      "Identity remains the first read.",
      "Secondary copy is merged, muted, or hidden before rendering.",
    ],
    warnings: buildWarnings(groups),
  };

  return {
    ...partial,
    score: scoreCopyArchitecture(input, partial),
  };
}

function nameForPattern(pattern: CopyArchitecturePattern): string {
  return pattern
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildWarnings(groups: CopyArchitectureCandidate["groups"]): string[] {
  const warnings: string[] = [];
  const identity = groups.find((group) => group.role === "identity");
  if (!identity?.text) warnings.push("Identity copy is missing.");
  if (groups.filter((group) => group.treatment !== "hide").length > 7) {
    warnings.push("The architecture contains many visible groups.");
  }
  if (groups.some((group) => group.text.split("\n").length > group.maxLines)) {
    warnings.push("At least one group exceeds its line limit.");
  }
  return warnings;
}
