import type {
  CopyArchitectureCandidate,
  CopyComplianceResult,
  RenderedCopySnapshot,
} from "./types.ts";
import { similarity } from "./utils.ts";

export function validateRenderedCopy(
  architecture: CopyArchitectureCandidate,
  snapshot: RenderedCopySnapshot
): CopyComplianceResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const visible = architecture.groups.filter((group) => group.treatment !== "hide");

  const requiredSources = visible.flatMap((group) => group.sources);
  for (const source of requiredSources) {
    if (!snapshot.renderedSources.includes(source)) {
      warnings.push(`Expected source ${source} was not rendered.`);
    }
  }

  const hiddenSources = architecture.groups
    .filter((group) => group.treatment === "hide")
    .flatMap((group) => group.sources);

  for (const source of hiddenSources) {
    if (snapshot.renderedSources.includes(source)) {
      blockers.push(`Hidden source ${source} was rendered independently.`);
    }
  }

  for (const group of visible) {
    const lines = snapshot.roleLineCounts[group.role] ?? 0;
    if (lines > group.maxLines) {
      blockers.push(`${group.role} exceeds its line limit.`);
    }

    const power = snapshot.rolePowerRatios[group.role];
    if (power !== undefined && power > group.powerRatio * 1.18) {
      warnings.push(`${group.role} exceeds its intended visual power.`);
    }
  }

  const identityPower = snapshot.rolePowerRatios.identity ?? 1;
  const accentPower = snapshot.rolePowerRatios.emotion ?? 0;
  if (accentPower > identityPower * 0.5) {
    blockers.push("Accent copy is competing with the identity.");
  }

  if (snapshot.visibleGroups > visible.length) {
    blockers.push("Renderer added copy groups not authorized by Copy Architect.");
  }

  if (snapshot.duplicateTexts.length) {
    blockers.push("Renderer contains duplicate copy.");
  }

  if (!snapshot.previewExportMatch) {
    blockers.push("Preview and export copy do not match.");
  }

  for (const group of visible) {
    const found = snapshot.renderedTexts.some((text) => similarity(text, group.text) >= 0.8);
    if (!found && group.text) warnings.push(`Rendered text for ${group.role} does not match the copy contract.`);
  }

  return {
    pass: blockers.length === 0,
    blockers,
    warnings,
    score: Math.max(0, 100 - blockers.length * 22 - warnings.length * 6),
  };
}
