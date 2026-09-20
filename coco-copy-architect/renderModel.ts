import type {
  CopyArchitectureCandidate,
  CopyRenderModel,
} from "./types.ts";

export function buildCopyRenderModel(
  architecture: CopyArchitectureCandidate
): CopyRenderModel {
  const visibleGroups = architecture.groups.filter(
    (group) => group.treatment !== "hide"
  );

  return {
    id: `render:${architecture.id}`,
    pattern: architecture.pattern,
    tone: architecture.tone,
    density: architecture.density,
    owns: visibleGroups.flatMap((group) => group.sources)
      .filter((value, index, values) => values.indexOf(value) === index),
    items: visibleGroups.map((group) => ({
      id: group.id,
      role: group.role,
      treatment: group.treatment,
      text: group.text,
      case: group.case,
      priority: group.priority,
      maxLines: group.maxLines,
      powerRatio: group.powerRatio,
      spacingBefore: group.spacingBefore,
      spacingAfter: group.spacingAfter,
      sources: group.sources,
    })),
  };
}
