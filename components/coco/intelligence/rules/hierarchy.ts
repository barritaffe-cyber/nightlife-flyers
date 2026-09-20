import type { CocoCanvasSnapshot, CocoFinding, CocoRule, CocoTextRole } from "../types";

const TEXT_TARGET_LABELS: Record<CocoTextRole, string> = {
  date: "date",
  details: "details",
  details2: "extra details",
  headline: "headline",
  headline2: "second line",
  leftRail: "left rail",
  presenter: "presenter",
  price: "price",
  rightRail: "right rail",
  subtag: "support line",
  venue: "venue",
};

function rectArea(role: CocoTextRole, snapshot: CocoCanvasSnapshot) {
  const node = snapshot.textNodes.find((item) => item.role === role);
  return node ? node.rect.width * node.rect.height : 0;
}

export function evaluateHierarchy(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const findings: CocoFinding[] = [];
  const headlineWords = String(snapshot.headlineText ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (headlineWords.length > 5) {
    findings.push({
      actions: [{ id: "tighten-headline", label: "Tighten headline", target: { role: "headline", type: "text" } }],
      confidence: Math.min(0.96, 0.82 + (headlineWords.length - 5) * 0.035),
      evidence: { wordCount: headlineWords.length },
      id: "hierarchy:headline-too-long",
      intent: "headline_too_long",
      observation: "The headline is trying to say too much at once.",
      principle: "hierarchy",
      reason: "A viewer should understand the event quickly before they scan details.",
      recommendation: "Use a shorter event name or move supporting words into a smaller text layer.",
      ruleId: "hierarchy",
      severity: headlineWords.length > 8 ? "high" : "medium",
      target: { role: "headline", type: "text" },
    });
  }

  const headlineArea = rectArea("headline", snapshot);
  const dateArea = rectArea("date", snapshot);

  if (headlineArea > 0 && dateArea > headlineArea * 0.88) {
    findings.push({
      actions: [{ id: "rebalance-date", label: "Rebalance date", target: { role: "date", type: "text" } }],
      confidence: Math.min(0.94, 0.82 + (dateArea / Math.max(1, headlineArea) - 0.88) * 0.12),
      evidence: { dateArea, headlineArea, label: TEXT_TARGET_LABELS.date },
      id: "hierarchy:date-stealing-attention",
      intent: "date_stealing_attention",
      observation: "The date has nearly as much visual weight as the headline.",
      principle: "hierarchy",
      reason: "The event name should lead before the viewer reads timing details.",
      recommendation: "Reduce the date slightly or give the headline more presence.",
      ruleId: "hierarchy",
      severity: "medium",
      target: { role: "date", type: "text" },
    });
  }

  return findings;
}

export const hierarchyRule: CocoRule = {
  evaluate: evaluateHierarchy,
  id: "hierarchy",
};
