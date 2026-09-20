import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";

type Rect = { x: number; y: number; width: number; height: number };
type Placement = { role: SubjectCopyRole; rect: Rect };

export type CompositionGrammarId =
  | "centered-symmetrical"
  | "centered-optical"
  | "left-editorial"
  | "right-editorial";

export type CompositionGrammarEvaluation = {
  grammarId: CompositionGrammarId;
  guideCount: number;
  guidePenalty: number;
  lockupScore: number;
  rhythmScore: number;
  score: number;
  symmetryScore: number;
};

const center = (rect: Rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
const bottom = (rect: Rect) => rect.y + rect.height;
const right = (rect: Rect) => rect.x + rect.width;
const gap = (a: Rect, b: Rect) => {
  const dx = Math.max(a.x - right(b), b.x - right(a), 0);
  const dy = Math.max(a.y - bottom(b), b.y - bottom(a), 0);
  return Math.hypot(dx, dy);
};
const byRole = (placements: Placement[], role: SubjectCopyRole) =>
  placements.find((placement) => placement.role === role);

function clusterCount(values: number[], tolerance = 2.5) {
  const clusters: number[] = [];
  for (const value of [...values].sort((a, b) => a - b)) {
    const index = clusters.findIndex((cluster) => Math.abs(cluster - value) <= tolerance);
    if (index < 0) clusters.push(value);
    else clusters[index] = (clusters[index] + value) / 2;
  }
  return clusters.length;
}

function sharedGuideScore(rects: Rect[], mode: "left" | "right" | "center") {
  if (rects.length < 2) return 0;
  const values = rects.map((rect) =>
    mode === "left" ? rect.x : mode === "right" ? right(rect) : center(rect).x
  );
  const spread = Math.max(...values) - Math.min(...values);
  return Math.max(-12, 12 - spread * 1.5);
}

function commonScores(placements: Placement[]) {
  const headline = byRole(placements, "headline");
  const accent = byRole(placements, "accent");
  const presenter = byRole(placements, "presenter");
  const details = byRole(placements, "details");
  const date = byRole(placements, "date");
  const price = byRole(placements, "price");
  const venue = byRole(placements, "venue");
  const compliance = byRole(placements, "compliance");

  let lockupScore = 0;
  let rhythmScore = 0;
  if (headline && accent) {
    const heroGap = gap(headline.rect, accent.rect);
    lockupScore += Math.max(-18, 16 - heroGap * 1.8);
    rhythmScore += Math.max(-8, 8 - Math.abs(heroGap - 2.5) * 1.4);
  }
  if (presenter && details) {
    const infoGap = gap(presenter.rect, details.rect);
    lockupScore += Math.max(-10, 9 - infoGap * 0.85);
    rhythmScore += Math.max(-6, 6 - Math.abs(infoGap - 4) * 0.65);
  }
  if (venue && compliance) {
    const footerGap = gap(venue.rect, compliance.rect);
    lockupScore += Math.max(-8, 8 - footerGap * 0.65);
    rhythmScore += Math.max(-5, 5 - Math.abs(center(venue.rect).y - center(compliance.rect).y) * 0.5);
  }
  if (date && price) {
    rhythmScore += Math.max(-7, 7 - Math.abs(center(date.rect).y - center(price.rect).y) * 0.65);
  }

  const guideCount = clusterCount(
    placements.flatMap((placement) => [placement.rect.x, center(placement.rect).x, right(placement.rect)])
  );
  const guidePenalty = Math.max(0, guideCount - 7) * 2.4;
  return { lockupScore, rhythmScore, guideCount, guidePenalty };
}

function centeredScore(placements: Placement[], exactSymmetry: boolean) {
  const headline = byRole(placements, "headline");
  if (!headline) return Number.NEGATIVE_INFINITY;
  const accent = byRole(placements, "accent");
  const presenter = byRole(placements, "presenter");
  const date = byRole(placements, "date");
  const price = byRole(placements, "price");
  const venue = byRole(placements, "venue");
  let score = 22 - Math.abs(center(headline.rect).x - 50) * (exactSymmetry ? 1.2 : 0.65);
  if (accent) score += sharedGuideScore([headline.rect, accent.rect], "center");
  if (presenter) score += Math.max(-8, 8 - Math.abs(center(presenter.rect).x - 50) * 0.45);
  if (venue) score += Math.max(-10, 10 - Math.abs(center(venue.rect).x - 50) * 0.4) +
    Math.max(-8, 8 - Math.abs(center(venue.rect).y - 90) * 0.65);

  let symmetryScore = 0;
  if (date && price) {
    const dateCenter = center(date.rect);
    const priceCenter = center(price.rect);
    const mirroredAxis = (dateCenter.x + priceCenter.x) / 2;
    const bandDelta = Math.abs(dateCenter.y - priceCenter.y);
    symmetryScore = Math.max(-20, 20 - Math.abs(mirroredAxis - 50) * 1.5 - bandDelta * 0.8);
    score += symmetryScore;
  }
  return { score, symmetryScore };
}

function editorialScore(placements: Placement[], side: "left" | "right") {
  const headline = byRole(placements, "headline");
  if (!headline) return Number.NEGATIVE_INFINITY;
  const related = [
    headline,
    byRole(placements, "accent"),
    byRole(placements, "details"),
    byRole(placements, "presenter"),
  ].filter((placement): placement is Placement => Boolean(placement));
  const guideMode = side === "left" ? "left" : "right";
  const target = side === "left" ? 25 : 75;
  return (
    20 - Math.abs(center(headline.rect).x - target) * 0.7 +
    sharedGuideScore(related.map((placement) => placement.rect), guideMode)
  );
}

export function evaluateCompositionGrammar(placements: Placement[]): CompositionGrammarEvaluation {
  const common = commonScores(placements);
  const centeredSymmetrical = centeredScore(placements, true);
  const centeredOptical = centeredScore(placements, false);
  const candidates: Array<{ grammarId: CompositionGrammarId; base: number; symmetryScore: number }> = [
    {
      grammarId: "centered-symmetrical",
      base: typeof centeredSymmetrical === "number" ? centeredSymmetrical : centeredSymmetrical.score,
      symmetryScore: typeof centeredSymmetrical === "number" ? 0 : centeredSymmetrical.symmetryScore,
    },
    {
      grammarId: "centered-optical",
      base: typeof centeredOptical === "number" ? centeredOptical : centeredOptical.score,
      symmetryScore: typeof centeredOptical === "number" ? 0 : centeredOptical.symmetryScore,
    },
    { grammarId: "left-editorial", base: editorialScore(placements, "left"), symmetryScore: 0 },
    { grammarId: "right-editorial", base: editorialScore(placements, "right"), symmetryScore: 0 },
  ];
  const winner = candidates.sort((a, b) => b.base - a.base)[0];
  const score =
    winner.base + common.lockupScore + common.rhythmScore - common.guidePenalty;
  return { ...common, grammarId: winner.grammarId, score, symmetryScore: winner.symmetryScore };
}
