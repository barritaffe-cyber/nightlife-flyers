import type {
  CritiqueFinding,
  CritiqueLoopInput,
  CritiqueMemory,
} from "./types.ts";
import { severityWeight, stableSort } from "./utils.ts";

export function selectStrongestFinding(
  findings: CritiqueFinding[],
  input: CritiqueLoopInput,
  memory: CritiqueMemory
): CritiqueFinding | undefined {
  const silent = new Set(input.userPreferences?.silentCategories ?? []);
  const preferred = new Set(input.userPreferences?.preferredCategories ?? []);

  const eligible = findings.filter((finding) => {
    if (memory.dismissedFindingIds.includes(finding.id)) return false;
    if (silent.has(finding.category)) return false;

    const categoryCount = memory.categoryCooldowns[finding.category] ?? 0;
    if (categoryCount >= (input.settings?.maxRepeatedCategory ?? 2)) return false;

    const targetOverused = finding.targetIds.some(
      (targetId) =>
        (memory.targetCooldowns[targetId] ?? 0) >=
        (input.settings?.maxRepeatedTarget ?? 2)
    );
    if (targetOverused) return false;

    return true;
  });

  return stableSort(eligible, (a, b) => {
    const aPreferred = preferred.has(a.category) ? 1 : 0;
    const bPreferred = preferred.has(b.category) ? 1 : 0;

    return (
      Number(b.blocker) - Number(a.blocker) ||
      bPreferred - aPreferred ||
      severityWeight(b.severity) - severityWeight(a.severity) ||
      b.scorePenalty - a.scorePenalty ||
      b.confidence - a.confidence
    );
  })[0];
}
