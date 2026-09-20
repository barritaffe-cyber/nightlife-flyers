import type { CocoCanvasSnapshot, CocoFinding, CocoRule } from "../types";

export function evaluateMargins(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];

  const minMargin = Math.max(10, Math.min(28, Math.min(artboard.width, artboard.height) * 0.035));
  const candidates = snapshot.textNodes
    .map((node) => {
      const gap = Math.min(
        node.rect.left - artboard.left,
        artboard.right - node.rect.right,
        node.rect.top - artboard.top,
        artboard.bottom - node.rect.bottom
      );
      return { gap, node };
    })
    .filter(({ gap }) => gap >= 0 && gap < minMargin)
    .sort((a, b) => a.gap - b.gap);

  const closest = candidates[0];
  if (!closest) return [];

  return [
    {
      actions: [
        {
          id: "fix-text-margin",
          label: "Adjust spacing",
          target: { role: closest.node.role, type: "text" },
        },
      ],
      confidence: Math.min(0.94, 0.82 + (1 - closest.gap / minMargin) * 0.12),
      evidence: { gap: closest.gap, minMargin, role: closest.node.role },
      id: `margins:${closest.node.role}`,
      intent: "text_near_edge",
      observation: "A text block is sitting close to the canvas edge.",
      principle: "negative-space",
      reason: "Clean margins make the design feel intentional and more premium.",
      recommendation: "Pull the text inward slightly so the layout has breathing room.",
      ruleId: "margins",
      severity: closest.gap < minMargin * 0.45 ? "high" : "medium",
      target: { role: closest.node.role, type: "text" },
    },
  ];
}

export const marginsRule: CocoRule = {
  evaluate: evaluateMargins,
  id: "margins",
};
