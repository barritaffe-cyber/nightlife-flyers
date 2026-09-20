import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";
import { edgeDistances, horizontalAlignmentDelta, safeBounds, verticalGap, rectInside } from "./geometry.ts";

export function evaluateComposition(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];
  const safe = safeBounds(input.renderedSnapshot.format);

  for (const element of metrics.visibleElements) {
    if (!rectInside(element.rect, safe)) {
      const distances = edgeDistances(element.rect);
      findings.push({
        id: `composition:safe-margin:${element.id}`,
        category: "composition",
        severity: Math.min(distances.left, distances.right, distances.top, distances.bottom) < 1 ? "high" : "medium",
        confidence: 0.95,
        observation: `${element.role} is too close to the edge.`,
        cause: "The element violates the poster safe margin.",
        evidence: [
          `Left ${distances.left.toFixed(1)}%, right ${distances.right.toFixed(1)}%, top ${distances.top.toFixed(1)}%, bottom ${distances.bottom.toFixed(1)}%.`,
        ],
        targetIds: [element.id],
        contractIds: ["large-margins", "preserve-negative-space"],
        scorePenalty: 8,
        blocker: false,
        userFacingMessage: `${element.role} needs more breathing room from the edge.`,
      });
    }
  }

  const stack = [metrics.headline, metrics.accent, metrics.metadata, metrics.dateTime, metrics.venue]
    .filter(Boolean) as NonNullable<typeof metrics.headline>[];

  if (stack.length >= 3) {
    const align = (input.composition?.alignment ?? input.creativeDirection?.composition?.alignment ?? "left") as "left" | "center" | "right";
    const deltas = stack.slice(1).map((element) => horizontalAlignmentDelta(stack[0].rect, element.rect, align));
    const maxDelta = Math.max(...deltas);

    if (maxDelta > 5.5) {
      findings.push({
        id: "composition:stack-alignment",
        category: "alignment",
        severity: maxDelta > 10 ? "high" : "medium",
        confidence: 0.9,
        observation: "The typography stack does not feel optically connected.",
        cause: "Supporting groups drift too far from the headline alignment axis.",
        evidence: [`Maximum alignment delta: ${maxDelta.toFixed(1)}%.`],
        targetIds: stack.map((element) => element.id),
        contractIds: ["single-type-system"],
        scorePenalty: maxDelta > 10 ? 12 : 8,
        blocker: false,
        userFacingMessage: "The typography stack needs a cleaner shared alignment.",
      });
    }

    const sorted = [...stack].sort((a, b) => a.rect.y - b.rect.y);
    const gaps = sorted.slice(1).map((element, index) => verticalGap(sorted[index].rect, element.rect));
    const positive = gaps.filter((gap) => gap >= 0);

    if (positive.length >= 2) {
      const max = Math.max(...positive);
      const min = Math.min(...positive);
      if (max - min > 6) {
        findings.push({
          id: "composition:uneven-rhythm",
          category: "rhythm",
          severity: "medium",
          confidence: 0.88,
          observation: "The vertical rhythm feels uneven.",
          cause: "Spacing jumps between typography groups instead of following a deliberate sequence.",
          evidence: [`Observed gaps: ${positive.map((gap) => gap.toFixed(1)).join(", ")}%.`],
          targetIds: sorted.map((element) => element.id),
          contractIds: ["single-type-system"],
          scorePenalty: 8,
          blocker: false,
          userFacingMessage: "The stack needs tighter, more deliberate spacing.",
        });
      }
    }
  }

  return findings;
}
