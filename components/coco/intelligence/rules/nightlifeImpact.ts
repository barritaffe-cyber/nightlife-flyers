import { COCO_NIGHTLIFE_IMPACT_DOCTRINE } from "../doctrine.ts";
import type { CocoCanvasSnapshot, CocoCanvasTextNode, CocoFinding, CocoRule } from "../types.ts";

const MIN_SHORT_HEADLINE_CANVAS_RATIO = 0.095;
const MIN_SHORT_HEADLINE_WIDTH_RATIO = 0.48;
const MIN_SCRIPT_TO_HEADLINE_RATIO = 0.12;

function rectArea(rect: { height: number; width: number } | null | undefined) {
  if (!rect) return 0;
  return Math.max(0, Number(rect.width) || 0) * Math.max(0, Number(rect.height) || 0);
}

function findTextNode(snapshot: CocoCanvasSnapshot, role: CocoCanvasTextNode["role"]) {
  return snapshot.textNodes.find((node) => node.role === role) ?? null;
}

function wordCount(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isStrongNightlifeStyle(snapshot: CocoCanvasSnapshot) {
  return COCO_NIGHTLIFE_IMPACT_DOCTRINE.strongStyles.includes(snapshot.nightlifeStyle);
}

function canvasArea(snapshot: CocoCanvasSnapshot) {
  return rectArea(snapshot.artboardRect);
}

function canvasWidth(snapshot: CocoCanvasSnapshot) {
  return Math.max(1, Number(snapshot.artboardRect?.width) || 1);
}

function confidenceFromDeficit(deficit: number, base = 0.86) {
  return Math.min(0.96, base + Math.max(0, deficit) * 0.6);
}

export function evaluateNightlifeImpact(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  if (!snapshot.hasSubject || !isStrongNightlifeStyle(snapshot)) return [];
  if (snapshot.phase === "arrival" || snapshot.phase === "format" || snapshot.phase === "text") return [];

  const headlineWords = wordCount(snapshot.headlineText);
  if (headlineWords < 1 || headlineWords > COCO_NIGHTLIFE_IMPACT_DOCTRINE.shortHeadlineMaxWords) {
    return [];
  }

  const findings: CocoFinding[] = [];
  const headline = findTextNode(snapshot, "headline");
  const headlineArea = rectArea(headline?.rect);
  const boardArea = canvasArea(snapshot);
  const headlineCanvasRatio = boardArea > 0 ? headlineArea / boardArea : 0;
  const headlineWidthRatio = headline ? headline.rect.width / canvasWidth(snapshot) : 0;

  if (
    headline &&
    (headlineCanvasRatio < MIN_SHORT_HEADLINE_CANVAS_RATIO ||
      headlineWidthRatio < MIN_SHORT_HEADLINE_WIDTH_RATIO)
  ) {
    const areaDeficit = MIN_SHORT_HEADLINE_CANVAS_RATIO - headlineCanvasRatio;
    const widthDeficit = MIN_SHORT_HEADLINE_WIDTH_RATIO - headlineWidthRatio;
    findings.push({
      actions: [{ id: "make-nightlife-impact", label: "Make it stronger", target: { role: "headline", type: "text" } }],
      confidence: confidenceFromDeficit(Math.max(areaDeficit, widthDeficit), 0.87),
      evidence: {
        doctrine: COCO_NIGHTLIFE_IMPACT_DOCTRINE.principle,
        headlineCanvasRatio,
        headlineWidthRatio,
        headlineWords,
        referenceLesson: "oversized-rave-subject-overlap",
      },
      id: "nightlife-impact:headline-too-safe",
      intent: "headline_too_safe",
      observation: "The headline is readable, but it is too polite for this nightlife flyer.",
      principle: "dominance",
      reason: "A short event name should become the dominant visual event, not just sit safely in a zone.",
      recommendation: "Scale the headline up and let it own the composition while keeping the face and key info clear.",
      ruleId: "nightlife-impact",
      severity: "high",
      target: { role: "headline", type: "text" },
    });
  }

  const script = findTextNode(snapshot, "headline2");
  const scriptArea = rectArea(script?.rect);
  if (headline && script && headlineArea > 0 && scriptArea / headlineArea < MIN_SCRIPT_TO_HEADLINE_RATIO) {
    const scriptRatio = scriptArea / headlineArea;
    findings.push({
      actions: [{ id: "make-nightlife-impact", label: "Make it stronger", target: { role: "headline2", type: "text" } }],
      confidence: confidenceFromDeficit(MIN_SCRIPT_TO_HEADLINE_RATIO - scriptRatio, 0.86),
      evidence: {
        doctrine: COCO_NIGHTLIFE_IMPACT_DOCTRINE.principle,
        scriptToHeadlineRatio: scriptRatio,
      },
      id: "nightlife-impact:script-too-timid",
      intent: "script_too_timid",
      observation: "The script accent is too timid to feel attached to the headline.",
      principle: "scale",
      reason: "A script accent should add energy and depth to the hero word, not disappear as decoration.",
      recommendation: "Make the script larger or let it cross the headline with intention.",
      ruleId: "nightlife-impact",
      severity: "medium",
      target: { role: "headline2", type: "text" },
    });
  }

  return findings;
}

export const nightlifeImpactRule: CocoRule = {
  evaluate: evaluateNightlifeImpact,
  id: "nightlife-impact",
};
