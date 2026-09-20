import type {
  CocoAction,
  CocoCanvasSnapshot,
  CocoCanvasTextNode,
  CocoFinding,
  CocoFindingSeverity,
  CocoNightlifeStyle,
  CocoReadabilityMetricId,
  CocoTextRole,
} from "./types";

export type CocoFinalArtDirectorCategory =
  | "brandFit"
  | "colorHarmony"
  | "composition"
  | "depth"
  | "emotion"
  | "hierarchy"
  | "lightingConsistency"
  | "originality"
  | "premiumPolish"
  | "readability"
  | "spacing"
  | "texture"
  | "typography";

export type CocoFinalArtDirectorScore = {
  overallQuality: number;
  professional: number;
  luxury: number;
  energy: number;
  readability: number;
  originality: number;
  premiumPolish: number;
  hierarchy: number;
  composition: number;
  spacing: number;
  typography: number;
  colorHarmony: number;
  lightingConsistency: number;
  depth: number;
  texture: number;
  brandFit: number;
  emotion: number;
  weakestCategory: CocoFinalArtDirectorCategory;
  critique: string;
  suggestedFixes: string[];
};

export type CocoFinalArtDirectorDecisionStatus =
  | "approved"
  | "needs_minor_fix"
  | "needs_redesign";

export type CocoFinalArtDirectorDecision = {
  action?: CocoAction | null;
  fixes: string[];
  message: string;
  status: CocoFinalArtDirectorDecisionStatus;
};

export type CocoFinalArtDirectorResult = {
  decision: CocoFinalArtDirectorDecision;
  score: CocoFinalArtDirectorScore;
};

type WeightedElement = {
  centerX: number;
  centerY: number;
  role: CocoTextRole | "subject";
  weight: number;
};

const ROLE_WEIGHT: Record<CocoTextRole, number> = {
  date: 7,
  details: 7,
  details2: 5,
  headline: 24,
  headline2: 13,
  leftRail: 2,
  presenter: 3,
  price: 6,
  rightRail: 2,
  subtag: 7,
  venue: 6,
};

const ROLE_READABILITY_WEIGHT: Record<CocoTextRole, number> = {
  date: 1.1,
  details: 0.9,
  details2: 0.72,
  headline: 1.55,
  headline2: 1.2,
  leftRail: 0.35,
  presenter: 0.55,
  price: 0.8,
  rightRail: 0.35,
  subtag: 0.82,
  venue: 0.95,
};

const IMPORTANT_ROLES = new Set<CocoTextRole>([
  "date",
  "details",
  "details2",
  "headline",
  "headline2",
  "price",
  "subtag",
  "venue",
]);

const CATEGORY_BY_FINDING: Partial<Record<CocoFinalArtDirectorCategory, string[]>> = {
  composition: ["balance", "subjectOverlap"],
  hierarchy: ["hierarchy"],
  premiumPolish: ["nightlifeImpact"],
  readability: ["readability"],
  spacing: ["margins", "rhythm"],
};

export function runCocoFinalArtDirectorPass({
  findings,
  snapshot,
}: {
  findings?: CocoFinding[];
  snapshot: CocoCanvasSnapshot;
}): CocoFinalArtDirectorResult {
  const activeFindings = (findings ?? []).filter((finding) => finding.confidence >= 0.68);
  const readability = scoreReadability(snapshot, activeFindings);
  const hierarchy = scoreHierarchy(snapshot, activeFindings);
  const composition = scoreComposition(snapshot, activeFindings);
  const spacing = scoreSpacing(snapshot, activeFindings);
  const typography = scoreTypographyFinish(snapshot, activeFindings);
  const colorHarmony = scoreColorHarmony(snapshot, readability, activeFindings);
  const lightingConsistency = scoreLightingConsistency(snapshot, activeFindings);
  const depth = scoreDepth(snapshot, activeFindings);
  const texture = scoreTexture(snapshot, activeFindings);
  const originality = scoreOriginality(snapshot, activeFindings);
  const emotion = scoreEmotion(snapshot, { colorHarmony, composition, originality, typography });
  const brandFit = scoreBrandFit(snapshot, {
    colorHarmony,
    composition,
    emotion,
    originality,
    readability,
    spacing,
    typography,
  });
  const premiumPolish = scorePremiumPolish({
    activeFindings,
    colorHarmony,
    hierarchy,
    lightingConsistency,
    readability,
    spacing,
    texture,
    typography,
  });

  const professional =
    hierarchy * 0.15 +
    composition * 0.15 +
    spacing * 0.12 +
    typography * 0.12 +
    colorHarmony * 0.1 +
    lightingConsistency * 0.1 +
    depth * 0.08 +
    texture * 0.05 +
    readability * 0.13;

  const luxury =
    spacing * 0.18 +
    typography * 0.18 +
    colorHarmony * 0.14 +
    lightingConsistency * 0.12 +
    premiumPolish * 0.2 +
    texture * 0.08 +
    emotion * 0.1;

  const energy =
    composition * 0.22 +
    colorHarmony * 0.16 +
    typography * 0.14 +
    depth * 0.12 +
    emotion * 0.2 +
    originality * 0.16;

  const overallQuality =
    professional * 0.28 +
    readability * 0.18 +
    premiumPolish * 0.18 +
    brandFit * 0.14 +
    emotion * 0.12 +
    originality * 0.1;

  const categoryScores: Record<CocoFinalArtDirectorCategory, number> = {
    brandFit,
    colorHarmony,
    composition,
    depth,
    emotion,
    hierarchy,
    lightingConsistency,
    originality,
    premiumPolish,
    readability,
    spacing,
    texture,
    typography,
  };
  const weakestCategory = Object.entries(categoryScores).sort((a, b) => a[1] - b[1])[0]?.[0] as
    | CocoFinalArtDirectorCategory
    | undefined;
  const finalWeakestCategory = weakestCategory ?? "premiumPolish";
  const suggestedFixes = buildFixes(finalWeakestCategory, snapshot);
  const score: CocoFinalArtDirectorScore = {
    brandFit: roundScore(brandFit),
    colorHarmony: roundScore(colorHarmony),
    composition: roundScore(composition),
    critique: buildCritique(finalWeakestCategory),
    depth: roundScore(depth),
    emotion: roundScore(emotion),
    energy: roundScore(energy),
    hierarchy: roundScore(hierarchy),
    lightingConsistency: roundScore(lightingConsistency),
    luxury: roundScore(luxury),
    originality: roundScore(originality),
    overallQuality: roundScore(overallQuality),
    premiumPolish: roundScore(premiumPolish),
    professional: roundScore(professional),
    readability: roundScore(readability),
    spacing: roundScore(spacing),
    suggestedFixes,
    texture: roundScore(texture),
    typography: roundScore(typography),
    weakestCategory: finalWeakestCategory,
  };

  return {
    decision: approveOrFix(score, actionForWeakestCategory(finalWeakestCategory, activeFindings)),
    score,
  };
}

export function getCocoFinalArtDirectorLines(result: CocoFinalArtDirectorResult): string[] {
  if (result.decision.status === "approved") {
    return ["This feels finished.", "Ready to export."];
  }

  const fix = result.decision.fixes[0] ?? "Give the weakest area one more pass.";
  if (result.decision.status === "needs_minor_fix") {
    return ["This is close, but not fully finished.", fix];
  }

  return ["This needs one more design pass.", result.score.critique];
}

function approveOrFix(
  score: CocoFinalArtDirectorScore,
  action: CocoAction | null
): CocoFinalArtDirectorDecision {
  if (score.overallQuality >= 88 && score.readability >= 85 && score.premiumPolish >= 80) {
    return {
      action: null,
      fixes: [],
      message: "This flyer feels finished and professional.",
      status: "approved",
    };
  }

  if (score.overallQuality >= 75 && score.readability >= 72) {
    return {
      action,
      fixes: score.suggestedFixes.slice(0, 2),
      message: score.critique,
      status: "needs_minor_fix",
    };
  }

  return {
    action,
    fixes: score.suggestedFixes,
    message: "The flyer needs a stronger design pass before export.",
    status: "needs_redesign",
  };
}

function scoreReadability(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  const nodes = readableNodes(snapshot);
  if (!nodes.length) return penaltyFromFindings(78, findings, ["readability"]);

  const weighted = weightedAverage(
    nodes.map((node) => ({
      score: node.readability?.overallScore ?? 72,
      weight: ROLE_READABILITY_WEIGHT[node.role] ?? 0.7,
    }))
  );
  const weakestPenalty = nodes.reduce((penalty, node) => {
    const weakest = node.readability?.weakestMetric;
    if (!weakest) return penalty;
    return penalty + Math.max(0, 58 - weakest.score) * 0.16;
  }, 0);

  return penaltyFromFindings(weighted - weakestPenalty, findings, ["readability"]);
}

function scoreHierarchy(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  const headline = roleNode(snapshot, "headline");
  const headline2 = roleNode(snapshot, "headline2");
  const details = roleNode(snapshot, "details");
  const details2 = roleNode(snapshot, "details2");
  const date = roleNode(snapshot, "date");
  let score = 86;

  if (!headline || !textPresent(headline)) score -= 24;
  if (headline && details) {
    const headlineWeight = visualWeight(headline);
    const detailsWeight = visualWeight(details) + (details2 ? visualWeight(details2) * 0.66 : 0);
    if (headlineWeight < detailsWeight * 1.2) score -= clamp((detailsWeight * 1.2 - headlineWeight) / 45, 0, 18);
  }
  if (headline && date && visualWeight(date) > visualWeight(headline) * 0.74) score -= 9;
  if (headline && headline2 && visualWeight(headline2) > visualWeight(headline) * 0.9) score -= 6;

  const headlineWords = String(snapshot.headlineText ?? headline?.text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (headlineWords > 5) score -= Math.min(18, (headlineWords - 5) * 3.4);

  return penaltyFromFindings(score, findings, ["hierarchy"]);
}

function scoreComposition(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = 84;
  const artboard = snapshot.artboardRect;
  const elements = buildWeightedElements(snapshot);

  if (!snapshot.hasSubject) score -= 10;
  if (snapshot.subjectIssue?.type === "off-canvas") score -= 24;
  if (snapshot.subjectIssue?.type === "too-large" || snapshot.subjectIssue?.type === "too-small") score -= 13;
  if (snapshot.subjectIssue?.type === "text-overlap") score -= 11;

  if (artboard && elements.length >= 2) {
    const totalWeight = elements.reduce((sum, element) => sum + element.weight, 0);
    const centerX =
      elements.reduce((sum, element) => sum + element.centerX * element.weight, 0) / totalWeight;
    const centerY =
      elements.reduce((sum, element) => sum + element.centerY * element.weight, 0) / totalWeight;
    const offsetX = Math.abs((centerX - (artboard.left + artboard.width / 2)) / artboard.width);
    const offsetY = Math.abs((centerY - (artboard.top + artboard.height / 2)) / artboard.height);
    score -= Math.max(0, offsetX - 0.08) * 145;
    score -= Math.max(0, offsetY - 0.1) * 110;
  }

  return penaltyFromFindings(score, findings, ["balance", "subjectOverlap"]);
}

function scoreSpacing(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = 88;
  const artboard = snapshot.artboardRect;

  if (artboard) {
    const edgePenalties = activeNodes(snapshot)
      .filter((node) => IMPORTANT_ROLES.has(node.role))
      .map((node) => {
        const rect = node.visualRect ?? node.rect;
        const minEdge = Math.min(
          rect.left - artboard.left,
          rect.top - artboard.top,
          artboard.right - rect.right,
          artboard.bottom - rect.bottom
        );
        const minAllowed = Math.min(34, Math.max(14, Math.min(artboard.width, artboard.height) * 0.035));
        return Math.max(0, minAllowed - minEdge) * 0.5;
      });
    score -= edgePenalties.reduce((sum, penalty) => sum + Math.min(12, penalty), 0);
  }

  const groups = [
    ["headline", "headline2"],
    ["details", "details2", "venue"],
    ["date", "price"],
  ] as CocoTextRole[][];
  for (const group of groups) {
    const gaps = verticalGaps(group.map((role) => roleNode(snapshot, role)).filter(isNode));
    if (gaps.length >= 2) score -= Math.min(9, spacingVariance(gaps) * 0.18);
  }

  return penaltyFromFindings(score, findings, ["margins", "rhythm"]);
}

function scoreTypographyFinish(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  const nodes = activeNodes(snapshot);
  const headline = roleNode(snapshot, "headline");
  const headline2 = roleNode(snapshot, "headline2");
  const details = roleNode(snapshot, "details");
  const details2 = roleNode(snapshot, "details2");
  let score = 84;

  if (headline && details && fontSize(headline) < fontSize(details) * 2.2) score -= 13;
  if (headline2 && headline && fontSize(headline2) > fontSize(headline) * 0.78) score -= 8;
  if (details && details2) {
    if (Math.abs(fontSize(details) - fontSize(details2)) < 2) score -= 6;
    if (String(details.fontWeight ?? "") === String(details2.fontWeight ?? "")) score -= 5;
  }

  const familyCount = new Set(
    nodes
      .map((node) => String(node.fontFamily ?? "").trim().toLowerCase())
      .filter(Boolean)
  ).size;
  if (familyCount > 4) score -= (familyCount - 4) * 6;
  if (familyCount <= 1 && nodes.length >= 5) score -= 4;

  const crampedLineHeights = nodes.filter((node) => {
    const size = fontSize(node);
    const lineHeight = Number(node.lineHeight);
    return size > 0 && Number.isFinite(lineHeight) && lineHeight < size * 0.78;
  }).length;
  score -= crampedLineHeights * 4;

  return penaltyFromFindings(score, findings, ["hierarchy", "readability"]);
}

function scoreColorHarmony(
  snapshot: CocoCanvasSnapshot,
  readability: number,
  findings: CocoFinding[]
) {
  let score = 80 + (readability - 75) * 0.22;
  const colors = activeNodes(snapshot)
    .map((node) => parseColor(node.textColor))
    .filter(isColor);
  const uniqueColors = uniqueColorCount(colors);
  if (uniqueColors > 5) score -= (uniqueColors - 5) * 5;

  const vividCount = colors.filter((color) => color.saturation > 0.62).length;
  if (colors.length >= 4 && vividCount > Math.ceil(colors.length * 0.62)) score -= 7;

  if (isElegantStyle(snapshot.nightlifeStyle) && vividCount > 3) score -= 8;
  if (isEnergyStyle(snapshot.nightlifeStyle) && vividCount === 0) score -= 4;

  return penaltyFromFindings(score, findings, ["nightlifeImpact"]);
}

function scoreLightingConsistency(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = 82;
  const nodes = activeNodes(snapshot);
  const shadowNodes = nodes.filter((node) => Boolean(node.textShadow));
  const shadowRatio = nodes.length ? shadowNodes.length / nodes.length : 0;
  if (nodes.length >= 5 && shadowRatio > 0.86) score -= 7;
  if (nodes.length >= 5 && shadowRatio < 0.18 && snapshot.hasSubject) score -= 5;

  const glowPenalty = nodes.reduce((penalty, node) => {
    const metric = readabilityMetric(node, "glow_interference");
    return penalty + (metric ? Math.max(0, 68 - metric) * 0.1 : 0);
  }, 0);
  score -= glowPenalty;

  return penaltyFromFindings(score, findings, ["readability", "nightlifeImpact"]);
}

function scoreDepth(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = snapshot.hasSubject ? 80 : 68;
  const nodes = activeNodes(snapshot);
  const hasHeadline = Boolean(roleNode(snapshot, "headline"));
  const hasSubject = Boolean(snapshot.subjectIssue?.rect || snapshot.hasSubject);
  const effectCount = nodes.filter((node) => Boolean(node.textShadow) || Number(node.strokeWidth) > 0).length;

  if (hasHeadline && hasSubject) score += 8;
  if (effectCount >= 2) score += 5;
  if (snapshot.subjectIssue?.type === "text-overlap") score -= 7;
  if (snapshot.subjectIssue?.type === "hero-combo") score += 4;

  return penaltyFromFindings(score, findings, ["subjectOverlap"]);
}

function scoreTexture(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = 82;
  const nodes = activeNodes(snapshot);
  const effectNodes = nodes.filter((node) => Boolean(node.textShadow) || Number(node.strokeWidth) > 0);
  if (effectNodes.length > Math.max(5, nodes.length * 0.72)) score -= 8;
  if (isElegantStyle(snapshot.nightlifeStyle) && effectNodes.length > 4) score -= 6;

  const strokeHeavyCount = nodes.filter((node) => Number(node.strokeWidth) > 2.8).length;
  score -= strokeHeavyCount * 3;

  return penaltyFromFindings(score, findings, ["readability"]);
}

function scoreOriginality(snapshot: CocoCanvasSnapshot, findings: CocoFinding[]) {
  let score = 72;
  const headline = roleNode(snapshot, "headline");
  const headline2 = roleNode(snapshot, "headline2");
  const rotated = activeNodes(snapshot).some((node) => Math.abs(Number(node.rotation) || 0) > 2.5);
  if (headline && visualWeight(headline) > 180) score += 8;
  if (headline2 && textPresent(headline2)) score += 5;
  if (snapshot.hasSubject) score += 5;
  if (snapshot.subjectIssue?.type === "hero-combo") score += 8;
  if (rotated) score += 3;
  if (isEnergyStyle(snapshot.nightlifeStyle)) score += 4;
  if (activeNodes(snapshot).length >= 8 && !headline2) score -= 4;

  return penaltyFromFindings(score, findings, ["nightlifeImpact"]);
}

function scoreEmotion(
  snapshot: CocoCanvasSnapshot,
  inputs: Pick<CocoFinalArtDirectorScore, "colorHarmony" | "composition" | "originality" | "typography">
) {
  let score = 70 + inputs.colorHarmony * 0.12 + inputs.composition * 0.08 + inputs.originality * 0.08;
  if (snapshot.hasSubject) score += 5;
  if (isElegantStyle(snapshot.nightlifeStyle)) score += Math.max(0, inputs.typography - 72) * 0.08;
  if (isEnergyStyle(snapshot.nightlifeStyle)) score += Math.max(0, inputs.originality - 70) * 0.12;
  return clamp(score, 0, 100);
}

function scoreBrandFit(
  snapshot: CocoCanvasSnapshot,
  inputs: Pick<
    CocoFinalArtDirectorScore,
    "colorHarmony" | "composition" | "emotion" | "originality" | "readability" | "spacing" | "typography"
  >
) {
  const style = snapshot.nightlifeStyle;
  if (isElegantStyle(style)) {
    return clamp(
      inputs.spacing * 0.24 +
        inputs.typography * 0.2 +
        inputs.colorHarmony * 0.18 +
        inputs.readability * 0.16 +
        inputs.emotion * 0.14 +
        inputs.originality * 0.08,
      0,
      100
    );
  }
  if (isEnergyStyle(style)) {
    return clamp(
      inputs.composition * 0.22 +
        inputs.originality * 0.2 +
        inputs.emotion * 0.2 +
        inputs.colorHarmony * 0.18 +
        inputs.typography * 0.12 +
        inputs.readability * 0.08,
      0,
      100
    );
  }
  if (style === "brunch" || style === "afrobeats" || style === "latin-night") {
    return clamp(
      inputs.colorHarmony * 0.22 +
        inputs.emotion * 0.2 +
        inputs.composition * 0.18 +
        inputs.spacing * 0.14 +
        inputs.typography * 0.14 +
        inputs.readability * 0.12,
      0,
      100
    );
  }
  return clamp(
    inputs.readability * 0.2 +
      inputs.composition * 0.18 +
      inputs.typography * 0.18 +
      inputs.colorHarmony * 0.16 +
      inputs.emotion * 0.16 +
      inputs.originality * 0.12,
    0,
    100
  );
}

function scorePremiumPolish({
  activeFindings,
  colorHarmony,
  hierarchy,
  lightingConsistency,
  readability,
  spacing,
  texture,
  typography,
}: {
  activeFindings: CocoFinding[];
  colorHarmony: number;
  hierarchy: number;
  lightingConsistency: number;
  readability: number;
  spacing: number;
  texture: number;
  typography: number;
}) {
  const base =
    readability * 0.2 +
    spacing * 0.18 +
    typography * 0.18 +
    colorHarmony * 0.14 +
    lightingConsistency * 0.12 +
    texture * 0.1 +
    hierarchy * 0.08;
  const highIssuePenalty = activeFindings.filter((finding) => finding.severity === "high").length * 5;
  const blockerPenalty = activeFindings.filter((finding) => finding.severity === "blocker").length * 12;
  return clamp(base - highIssuePenalty - blockerPenalty, 0, 100);
}

function actionForWeakestCategory(
  category: CocoFinalArtDirectorCategory,
  findings: CocoFinding[]
): CocoAction | null {
  const preferredRuleIds = CATEGORY_BY_FINDING[category] ?? [];
  const candidates = findings
    .filter((finding) => {
      if (!finding.actions?.length) return false;
      if (preferredRuleIds.includes(finding.ruleId)) return true;
      if (category === "typography" && ["hierarchy", "readability", "rhythm"].includes(finding.ruleId)) return true;
      if (category === "colorHarmony" && ["readability", "nightlifeImpact"].includes(finding.ruleId)) return true;
      if (category === "lightingConsistency" && ["readability", "nightlifeImpact"].includes(finding.ruleId)) return true;
      if (category === "depth" && ["subjectOverlap", "nightlifeImpact"].includes(finding.ruleId)) return true;
      return category === "emotion" || category === "brandFit" || category === "originality";
    })
    .sort(
      (a, b) =>
        severityWeight(b.severity) - severityWeight(a.severity) ||
        b.confidence - a.confidence
    );

  return candidates[0]?.actions?.[0] ?? findings.find((finding) => finding.actions?.[0])?.actions?.[0] ?? null;
}

function buildCritique(category: CocoFinalArtDirectorCategory) {
  const critiques: Record<CocoFinalArtDirectorCategory, string> = {
    brandFit: "The visual style is not fully matching the event mood yet.",
    colorHarmony: "The palette needs a stronger relationship between the subject, type, and background.",
    composition: "The composition does not feel fully stable yet.",
    depth: "The flyer feels a little flat. It needs stronger separation between layers.",
    emotion: "The design is technically close, but the feeling is not strong enough yet.",
    hierarchy: "The eye does not know what to read first with enough confidence.",
    lightingConsistency: "The subject, text, and scene lighting do not feel fully unified yet.",
    originality: "The flyer is polished, but it needs one more memorable visual move.",
    premiumPolish: "The flyer feels close, but the finishing details are not fully resolved.",
    readability: "Important information is not reading cleanly enough yet.",
    spacing: "The design feels tight. It needs more breathing room.",
    texture: "The effects and texture need more restraint so the finish feels premium.",
    typography: "The type does not feel fully resolved yet.",
  };
  return critiques[category];
}

function buildFixes(category: CocoFinalArtDirectorCategory, snapshot: CocoCanvasSnapshot) {
  const fixes: Record<CocoFinalArtDirectorCategory, string[]> = {
    brandFit: [
      "Bring the type, color, and lighting closer to the event mood.",
      "Remove any visual move that does not support the event personality.",
    ],
    colorHarmony: [
      "Limit the palette to one dominant mood color and one accent.",
      "Pull the accent from the subject or background lighting.",
    ],
    composition: [
      "Move the strongest counterweight slightly toward the empty side.",
      "Give the subject and headline a clearer visual relationship.",
    ],
    depth: [
      "Use shadow or glow behind the subject to separate layers.",
      "Reduce flat overlays and create foreground, middle, and background depth.",
    ],
    emotion: [
      "Push one stronger mood cue through color, lighting, or headline treatment.",
      "Make the event feel more specific instead of generally polished.",
    ],
    hierarchy: [
      "Make the headline the clear first read.",
      "Reduce competing utility text around the date, price, or details.",
    ],
    lightingConsistency: [
      "Use one shared color cast across the subject, background, and type.",
      "Reduce any glow that fights the scene lighting.",
    ],
    originality: [
      snapshot.hasSubject
        ? "Try one intentional text-behind-subject or framing move."
        : "Use one stronger crop, frame, or signature type move.",
      "Add one memorable visual accent, then keep the rest restrained.",
    ],
    premiumPolish: [
      "Clean up the smallest alignment, glow, and spacing inconsistencies.",
      "Keep the strongest visual move and reduce anything that competes with it.",
    ],
    readability: [
      "Improve the weakest text separation before export.",
      "Reduce background activity behind the most important information.",
    ],
    spacing: [
      "Give the headline and subject more breathing room.",
      "Separate the supporting text blocks so they feel intentional.",
    ],
    texture: [
      "Reduce overdone strokes, shadows, or glow.",
      "Keep one texture system instead of multiple competing effects.",
    ],
    typography: [
      "Strengthen the type hierarchy between headline, details, and venue.",
      "Improve line breaks, tracking, or weight contrast.",
    ],
  };
  return fixes[category];
}

function activeNodes(snapshot: CocoCanvasSnapshot) {
  return snapshot.textNodes.filter(textPresent);
}

function readableNodes(snapshot: CocoCanvasSnapshot) {
  return activeNodes(snapshot).filter((node) => node.readability && node.role !== "leftRail" && node.role !== "rightRail");
}

function roleNode(snapshot: CocoCanvasSnapshot, role: CocoTextRole) {
  return activeNodes(snapshot).find((node) => node.role === role) ?? null;
}

function textPresent(node: CocoCanvasTextNode) {
  return Boolean(String(node.text ?? "").trim()) && node.rect.width > 0 && node.rect.height > 0;
}

function fontSize(node: CocoCanvasTextNode) {
  return Math.max(1, Number(node.fontSize) || node.rect.height || 1);
}

function visualWeight(node: CocoCanvasTextNode) {
  const rect = node.visualRect ?? node.rect;
  const area = rect.width * rect.height;
  const size = fontSize(node);
  const roleFactor = ROLE_WEIGHT[node.role] ?? 5;
  const shadowFactor = node.textShadow ? 1.1 : 1;
  const strokeFactor = 1 + Math.min(0.18, Math.max(0, Number(node.strokeWidth) || 0) * 0.035);
  return Math.sqrt(Math.max(1, area)) * (size / 18) * roleFactor * 0.1 * shadowFactor * strokeFactor;
}

function buildWeightedElements(snapshot: CocoCanvasSnapshot): WeightedElement[] {
  const artboard = snapshot.artboardRect;
  const elements: WeightedElement[] = activeNodes(snapshot).map((node) => {
    const rect = node.visualRect ?? node.rect;
    return {
      centerX: node.opticalCenter?.x ?? rect.left + rect.width / 2,
      centerY: node.opticalCenter?.y ?? rect.top + rect.height / 2,
      role: node.role,
      weight: visualWeight(node),
    };
  });

  if (artboard && snapshot.subjectIssue?.rect) {
    const rect = snapshot.subjectIssue.rect;
    const areaRatio = (rect.width * rect.height) / Math.max(1, artboard.width * artboard.height);
    elements.push({
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      role: "subject",
      weight: clamp(22 + Math.sqrt(Math.max(0, areaRatio)) * 38, 24, 52),
    });
  }

  return elements;
}

function verticalGaps(nodes: CocoCanvasTextNode[]) {
  const sorted = [...nodes].sort((a, b) => a.rect.top - b.rect.top);
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    gaps.push(sorted[index].rect.top - sorted[index - 1].rect.bottom);
  }
  return gaps.filter((gap) => Number.isFinite(gap));
}

function spacingVariance(values: number[]) {
  if (values.length < 2) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + Math.abs(value - average), 0) / values.length;
}

function penaltyFromFindings(score: number, findings: CocoFinding[], ruleIds: string[]) {
  const penalty = findings
    .filter((finding) => ruleIds.includes(finding.ruleId))
    .reduce((sum, finding) => sum + severityPenalty(finding.severity) * clamp(finding.confidence, 0.68, 1), 0);
  return clamp(score - penalty, 0, 100);
}

function severityPenalty(severity: CocoFindingSeverity) {
  switch (severity) {
    case "blocker":
      return 24;
    case "high":
      return 15;
    case "medium":
      return 8;
    case "low":
      return 4;
  }
}

function severityWeight(severity: CocoFindingSeverity) {
  switch (severity) {
    case "blocker":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function readabilityMetric(node: CocoCanvasTextNode, id: CocoReadabilityMetricId) {
  return node.readability?.metrics.find((metric) => metric.id === id)?.score ?? null;
}

function weightedAverage(items: Array<{ score: number; weight: number }>) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
}

function isElegantStyle(style: CocoNightlifeStyle) {
  return style === "luxury-club" || style === "rnb-lounge" || style === "bottle-service" || style === "rooftop";
}

function isEnergyStyle(style: CocoNightlifeStyle) {
  return style === "edm" || style === "techno" || style === "house" || style === "hip-hop" || style === "throwback";
}

type ParsedColor = {
  b: number;
  g: number;
  r: number;
  saturation: number;
};

function parseColor(value?: string | null): ParsedColor | null {
  if (!value) return null;
  const text = value.trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hex;
    return rgbToColor(
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16)
    );
  }

  const rgb = text.match(/rgba?\(([^)]+)\)/i);
  if (!rgb) return null;
  const parts = rgb[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  return rgbToColor(parts[0], parts[1], parts[2]);
}

function rgbToColor(r: number, g: number, b: number): ParsedColor {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return { b: bn, g: gn, r: rn, saturation };
}

function uniqueColorCount(colors: ParsedColor[]) {
  const keys = new Set(
    colors.map((color) =>
      [Math.round(color.r * 8), Math.round(color.g * 8), Math.round(color.b * 8)].join(":")
    )
  );
  return keys.size;
}

function isColor(value: ParsedColor | null): value is ParsedColor {
  return Boolean(value);
}

function isNode(value: CocoCanvasTextNode | null): value is CocoCanvasTextNode {
  return Boolean(value);
}

function roundScore(value: number) {
  return Math.round(clamp(value, 0, 100));
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
