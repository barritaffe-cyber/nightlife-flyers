import type {
  CocoLayoutCandidate,
  CocoTournamentAlign,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentResult,
  CocoTournamentScore,
  CocoTournamentSnapshot,
  CocoTournamentZoneMap,
} from "./types";

type TextRole = Exclude<keyof CocoTournamentZoneMap, "subject">;

type PatternDraft = {
  explanation: string;
  id: string;
  layoutId: CocoTournamentLayoutId;
  zones: CocoTournamentZoneMap;
};

const TEXT_ROLES: TextRole[] = [
  "headline",
  "script",
  "presenter",
  "leftInfo",
  "rightInfo",
  "date",
  "price",
  "venue",
  "subtag",
];

const ROLE_WEIGHT: Record<TextRole, number> = {
  date: 0.52,
  headline: 1,
  leftInfo: 0.56,
  presenter: 0.28,
  price: 0.46,
  rightInfo: 0.42,
  script: 0.74,
  subtag: 0.28,
  venue: 0.5,
};

const MIN_MARGIN = 4;

export function chooseCocoLayoutTournamentWinner(
  snapshot: CocoTournamentSnapshot
): CocoTournamentResult {
  const baseCandidates = generateLayoutCandidates(snapshot)
    .map((candidate) => scoreCandidate(candidate, snapshot))
    .sort(compareCandidates);
  const topFive = baseCandidates.slice(0, 5);
  const refined = topFive.flatMap((candidate) => refineCandidate(candidate, snapshot));
  const rescored = [...baseCandidates, ...refined.map((candidate) => scoreCandidate(candidate, snapshot))]
    .sort(compareCandidates);
  const finalists = rescored.slice(0, 8);
  const gated = finalists.filter((candidate) => passesFatalGates(candidate.scores));
  const winner = (gated[0] ?? finalists[0] ?? scoreCandidate(seedCandidate(snapshot), snapshot));

  return {
    finalists,
    rejectedCount: finalists.length - gated.length,
    totalCandidates: baseCandidates.length + refined.length,
    winner,
  };
}

function generateLayoutCandidates(snapshot: CocoTournamentSnapshot): CocoLayoutCandidate[] {
  const seeded = seedCandidate(snapshot);
  const drafts: PatternDraft[] = [
    ...centerPatterns(snapshot),
    ...sidePatterns(snapshot, "subject-left"),
    ...sidePatterns(snapshot, "subject-right"),
    seeded,
  ];

  const preferredBoost = drafts.filter((draft) => draft.layoutId === snapshot.layoutId);
  const fullSet = [...drafts, ...preferredBoost.map((draft) => ({
    ...draft,
    id: `${draft.id}:preferred`,
    explanation: `${draft.explanation} Preferred orientation variation.`,
  }))];

  return dedupeCandidates(
    fullSet.map((draft, index) => ({
      explanation: draft.explanation,
      generation: "base" as const,
      id: `${draft.id}:${index}`,
      layoutId: draft.layoutId,
      patternId: draft.id,
      zones: normalizeZoneMap(draft.zones),
    }))
  );
}

function seedCandidate(snapshot: CocoTournamentSnapshot): CocoLayoutCandidate {
  return {
    explanation: "The current designer recipe, included as the benchmark.",
    generation: "base",
    id: "seed:current",
    layoutId: snapshot.layoutId,
    patternId: "current",
    zones: normalizeZoneMap(snapshot.zones),
  };
}

function centerPatterns(snapshot: CocoTournamentSnapshot): PatternDraft[] {
  const story = snapshot.format === "story";
  const face = snapshot.faceZone;
  const faceBottom = face.y + face.height;
  const headlineY = clamp(faceBottom + (story ? 7 : 6), story ? 49 : 51, story ? 67 : 64);
  const lowerY = clamp(headlineY + (story ? 20 : 19), story ? 72 : 72, story ? 88 : 86);
  const topDetailsY = clamp(face.y + (story ? 9 : 8), story ? 18 : 20, story ? 37 : 39);
  const leftDetailsWidth = story ? 34 : 30;
  const topLeftX = story ? 7 : 8;
  const topRightX = story ? 72 : 76;
  const base = {
    ...snapshot.zones,
    subject: rect(18, 9, 64, 88, "center"),
    headline: rect(story ? 7 : 6, headlineY, story ? 86 : 88, story ? 16 : 18, "center"),
    script: rect(story ? 20 : 22, headlineY + (story ? 9.5 : 9), story ? 60 : 56, story ? 6.5 : 8, "center"),
    presenter: rect(story ? 18 : 24, story ? 4.5 : 5, story ? 64 : 52, story ? 6 : 6.5, "center"),
    date: rect(story ? 6 : 7, story ? 4 : 5, story ? 20 : 16, story ? 9 : 10, "center"),
    price: rect(topRightX, story ? 4 : 5, story ? 18 : 16, story ? 9 : 10, "center"),
    leftInfo: rect(topLeftX, topDetailsY, leftDetailsWidth, story ? 14 : 16, "left"),
    rightInfo: rect(story ? 9 : 8, lowerY, story ? 42 : 45, story ? 8 : 8.5, "left"),
    venue: rect(story ? 56 : 60, lowerY, story ? 35 : 34, story ? 8 : 8.5, "right"),
    subtag: rect(story ? 79 : 82, story ? 91 : 91, story ? 14 : 12, story ? 5 : 6, "center"),
  } satisfies CocoTournamentZoneMap;

  const titleLow = {
    ...base,
    headline: rect(story ? 7 : 6, clamp(headlineY + 5, 56, story ? 72 : 69), story ? 86 : 88, story ? 16 : 18, "center"),
    script: rect(story ? 21 : 22, clamp(headlineY + (story ? 15 : 14), 63, story ? 80 : 76), story ? 58 : 56, story ? 6.5 : 8, "center"),
    leftInfo: rect(topLeftX, topDetailsY, leftDetailsWidth, story ? 13 : 15, "left"),
    rightInfo: rect(story ? 7 : 7, story ? 82 : 83, story ? 42 : 44, story ? 8 : 8, "left"),
    venue: rect(story ? 55 : 60, story ? 82 : 83, story ? 36 : 34, story ? 8 : 8, "right"),
  } satisfies CocoTournamentZoneMap;

  const editorialAir = {
    ...base,
    headline: rect(story ? 9 : 8, clamp(headlineY + 2, 53, story ? 68 : 66), story ? 82 : 84, story ? 14 : 16, "center"),
    script: rect(story ? 24 : 25, clamp(headlineY + (story ? 10.5 : 10), 61, story ? 75 : 72), story ? 52 : 50, story ? 6 : 7, "center"),
    leftInfo: rect(story ? 8 : 9, story ? 73 : 73, story ? 38 : 35, story ? 8 : 8, "left"),
    rightInfo: rect(story ? 8 : 9, story ? 83 : 82, story ? 38 : 35, story ? 7 : 7, "left"),
    venue: rect(story ? 56 : 61, story ? 83 : 82, story ? 36 : 33, story ? 7 : 7, "right"),
  } satisfies CocoTournamentZoneMap;

  const posterImpact = {
    ...base,
    headline: rect(story ? 5 : 5, clamp(headlineY + 3, 54, story ? 69 : 66), story ? 90 : 90, story ? 18 : 20, "center"),
    script: rect(story ? 18 : 20, clamp(headlineY + (story ? 11 : 10.5), 62, story ? 76 : 73), story ? 64 : 60, story ? 7 : 8, "center"),
    leftInfo: rect(story ? 7 : 8, story ? 21 : 22, story ? 33 : 30, story ? 14 : 16, "left"),
    rightInfo: rect(story ? 7 : 8, story ? 82 : 82, story ? 43 : 42, story ? 8 : 8, "left"),
    venue: rect(story ? 56 : 60, story ? 82 : 82, story ? 36 : 34, story ? 8 : 8, "right"),
  } satisfies CocoTournamentZoneMap;

  return [
    { explanation: "Centered hero with strong middle title and split lower information.", id: "center:balanced-poster", layoutId: "subject-center", zones: base },
    { explanation: "Centered hero with title pushed lower for a stronger subject-first poster.", id: "center:low-title-impact", layoutId: "subject-center", zones: titleLow },
    { explanation: "Centered editorial layout with more air around the hero and footer.", id: "center:editorial-air", layoutId: "subject-center", zones: editorialAir },
    { explanation: "Centered club poster with maximum headline dominance and compact support copy.", id: "center:headline-takeover", layoutId: "subject-center", zones: posterImpact },
  ];
}

function sidePatterns(
  snapshot: CocoTournamentSnapshot,
  layoutId: Extract<CocoTournamentLayoutId, "subject-left" | "subject-right">
): PatternDraft[] {
  const story = snapshot.format === "story";
  const subjectOnLeft = layoutId === "subject-left";
  const textX = subjectOnLeft ? (story ? 45 : 40) : (story ? 6 : 5);
  const utilSideX = subjectOnLeft ? (story ? 6 : 6) : (story ? 74 : 78);
  const priceX = subjectOnLeft ? (story ? 76 : 78) : (story ? 6 : 6);
  const textWidth = story ? 49 : 55;
  const align: CocoTournamentAlign = subjectOnLeft ? "right" : "left";
  const subject = subjectOnLeft
    ? rect(0, story ? 8 : 8.5, story ? 52 : 37, story ? 88 : 91.5, "center")
    : rect(story ? 48 : 63, story ? 8 : 8.5, story ? 52 : 37, story ? 88 : 91.5, "center");
  const mirroredTextX = subjectOnLeft ? 100 - textX - textWidth : textX;
  const base = {
    ...snapshot.zones,
    subject,
    headline: rect(mirroredTextX, story ? 22 : 20, textWidth, story ? 18 : 22, align),
    script: rect(mirroredTextX, story ? 37 : 37, textWidth, story ? 9 : 11, align),
    leftInfo: rect(mirroredTextX, story ? 52 : 52, textWidth, story ? 10 : 12, align),
    rightInfo: rect(mirroredTextX, story ? 65 : 66, textWidth, story ? 9 : 10, align),
    venue: rect(mirroredTextX, story ? 80 : 83, textWidth, story ? 8 : 8, align),
    presenter: rect(mirroredTextX, story ? 4.5 : 5, textWidth, story ? 6 : 6.5, align),
    date: rect(utilSideX, story ? 85 : 85.5, story ? 19 : 16, story ? 9 : 10.5, "center"),
    price: rect(priceX, story ? 5 : 5.5, story ? 18 : 16, story ? 9 : 10.5, "center"),
    subtag: rect(subjectOnLeft ? 80 : 7, story ? 92 : 91, story ? 14 : 13, story ? 5 : 6, "center"),
  } satisfies CocoTournamentZoneMap;
  const titleForward = {
    ...base,
    headline: rect(mirroredTextX, story ? 18 : 17, textWidth, story ? 20 : 24, align),
    script: rect(mirroredTextX, story ? 34 : 34.5, textWidth, story ? 10 : 12, align),
    leftInfo: rect(mirroredTextX, story ? 51 : 52, textWidth, story ? 11 : 12, align),
    rightInfo: rect(mirroredTextX, story ? 65 : 66, textWidth, story ? 9 : 10, align),
  } satisfies CocoTournamentZoneMap;
  const footerHeavy = {
    ...base,
    headline: rect(mirroredTextX, story ? 24 : 23, textWidth, story ? 17 : 20, align),
    script: rect(mirroredTextX, story ? 39 : 39, textWidth, story ? 9 : 10, align),
    leftInfo: rect(mirroredTextX, story ? 57 : 56, textWidth, story ? 10 : 11, align),
    rightInfo: rect(mirroredTextX, story ? 70 : 70, textWidth, story ? 8 : 9, align),
    venue: rect(mirroredTextX, story ? 83 : 84, textWidth, story ? 7 : 7, align),
  } satisfies CocoTournamentZoneMap;

  return [
    { explanation: "Side-subject editorial stack with clear text hierarchy.", id: `${layoutId}:editorial-stack`, layoutId, zones: base },
    { explanation: "Side-subject poster with a more dominant title block.", id: `${layoutId}:title-forward`, layoutId, zones: titleForward },
    { explanation: "Side-subject layout with support copy weighted lower for more air.", id: `${layoutId}:footer-heavy`, layoutId, zones: footerHeavy },
  ];
}

function refineCandidate(
  candidate: CocoLayoutCandidate,
  snapshot: CocoTournamentSnapshot
): CocoLayoutCandidate[] {
  const protectedFace = protectFace(candidate.zones, snapshot.faceZone);
  const withResolvedOverlaps = resolveTextOverlaps(protectedFace);
  const withGrid = snapZoneMap(withResolvedOverlaps, 0.5);
  const safer = {
    ...candidate,
    explanation: `${candidate.explanation} Refined for face protection, spacing, and optical grid.`,
    generation: "refined" as const,
    id: `${candidate.id}:refined`,
    zones: withGrid,
  };

  const moreAir = {
    ...safer,
    explanation: `${candidate.explanation} Variation with extra breathing room around support copy.`,
    generation: "variation" as const,
    id: `${candidate.id}:air`,
    zones: addBreathingRoom(withGrid),
  };

  const strongerTitle = {
    ...safer,
    explanation: `${candidate.explanation} Variation with headline dominance increased.`,
    generation: "variation" as const,
    id: `${candidate.id}:dominance`,
    zones: increaseHeadlineDominance(withGrid, snapshot.format === "story"),
  };

  return [safer, moreAir, strongerTitle];
}

function scoreCandidate(
  candidate: CocoLayoutCandidate,
  snapshot: CocoTournamentSnapshot
): CocoLayoutCandidate {
  const zones = candidate.zones;
  const hierarchy = scoreHierarchy(zones, snapshot);
  const subjectProtection = scoreSubjectProtection(zones, snapshot.faceZone);
  const balance = scoreBalance(zones);
  const negativeSpace = scoreNegativeSpace(zones);
  const alignment = scoreAlignment(zones);
  const readability = scoreReadability(zones, snapshot);
  const moodMatch = scoreMoodMatch(candidate, snapshot);
  const premium = scorePremium(zones, { alignment, negativeSpace, readability, subjectProtection });
  const energy = scoreEnergy(candidate, zones);
  const originality = scoreOriginality(candidate);
  const final = weightedScore({
    alignment,
    balance,
    energy,
    hierarchy,
    moodMatch,
    negativeSpace,
    originality,
    premium,
    readability,
    subjectProtection,
  });

  return {
    ...candidate,
    scores: {
      alignment,
      balance,
      energy,
      final,
      hierarchy,
      moodMatch,
      negativeSpace,
      originality,
      premium,
      readability,
      subjectProtection,
    },
  };
}

function weightedScore(scores: Omit<CocoTournamentScore, "final">) {
  return clamp(
    scores.hierarchy * 0.16 +
      scores.subjectProtection * 0.16 +
      scores.readability * 0.14 +
      scores.balance * 0.12 +
      scores.negativeSpace * 0.11 +
      scores.alignment * 0.1 +
      scores.premium * 0.09 +
      scores.moodMatch * 0.07 +
      scores.energy * 0.04 +
      scores.originality * 0.01,
    0,
    100
  );
}

function scoreHierarchy(zones: CocoTournamentZoneMap, snapshot: CocoTournamentSnapshot) {
  const headlineArea = area(zones.headline);
  const scriptArea = area(zones.script);
  const detailsArea = area(zones.leftInfo);
  const utilityArea = area(zones.date) + area(zones.price);
  const headlineDominance = ratioScore(headlineArea / Math.max(1, detailsArea + scriptArea * 0.45), 0.85, 1.7);
  const utilityRestraint = clamp(100 - Math.max(0, utilityArea - headlineArea * 0.45) * 0.85, 45, 100);
  const titleSize = snapshot.layoutId === "subject-center" ? headlineArea >= 1300 : headlineArea >= 950;
  return clamp(headlineDominance * 0.62 + utilityRestraint * 0.28 + (titleSize ? 10 : 0), 0, 100);
}

function scoreSubjectProtection(zones: CocoTournamentZoneMap, faceZone: CocoTournamentRect) {
  let penalty = 0;
  for (const role of TEXT_ROLES) {
    const overlap = intersectionRatio(zones[role], faceZone);
    const weight = role === "headline" || role === "script" ? 95 : role === "presenter" ? 20 : 48;
    penalty += overlap * weight;
  }
  const faceEdgeCrowding = TEXT_ROLES.reduce((worst, role) => {
    const distance = rectDistance(zones[role], faceZone);
    return Math.max(worst, distance < 2 ? 10 : distance < 4 ? 5 : 0);
  }, 0);
  return clamp(100 - penalty - faceEdgeCrowding, 0, 100);
}

function scoreBalance(zones: CocoTournamentZoneMap) {
  const weights: Array<{ rect: CocoTournamentRect; weight: number }> = [
    { rect: zones.subject, weight: 1.5 },
    ...TEXT_ROLES.map((role) => ({ rect: zones[role], weight: ROLE_WEIGHT[role] })),
  ];
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const center = weights.reduce(
    (acc, item) => ({
      x: acc.x + rectCenter(item.rect).x * item.weight,
      y: acc.y + rectCenter(item.rect).y * item.weight,
    }),
    { x: 0, y: 0 }
  );
  const massX = center.x / totalWeight;
  const massY = center.y / totalWeight;
  const offset = Math.abs(massX - 50) * 1.2 + Math.abs(massY - 54) * 0.65;
  return clamp(100 - offset * 2.2, 0, 100);
}

function scoreNegativeSpace(zones: CocoTournamentZoneMap) {
  const textArea = TEXT_ROLES.reduce((sum, role) => sum + area(zones[role]), 0);
  const coverage = textArea / 10000;
  const coverageScore = ratioScore(coverage, 0.18, 0.32);
  const overlapPenalty = textOverlapPenalty(zones) * 1.9;
  const marginPenalty = TEXT_ROLES.reduce((sum, role) => sum + edgePenalty(zones[role]), 0);
  return clamp(coverageScore - overlapPenalty - marginPenalty, 0, 100);
}

function scoreAlignment(zones: CocoTournamentZoneMap) {
  const leftEdges = [zones.headline.x, zones.script.x, zones.leftInfo.x, zones.rightInfo.x, zones.venue.x];
  const centers = [zones.headline, zones.script, zones.presenter].map((item) => rectCenter(item).x);
  const edgeSpread = smallestSpread(leftEdges);
  const centerSpread = smallestSpread(centers);
  const footerLine = Math.abs(zones.rightInfo.y - zones.venue.y);
  return clamp(100 - edgeSpread * 3.2 - centerSpread * 2.4 - footerLine * 4, 0, 100);
}

function scoreReadability(zones: CocoTournamentZoneMap, snapshot: CocoTournamentSnapshot) {
  const text = snapshot.text ?? {};
  const fitScores = [
    textFitScore(zones.headline, text.headline, 10),
    textFitScore(zones.script, text.script, 5),
    textFitScore(zones.leftInfo, text.details, 2),
    textFitScore(zones.rightInfo, text.details2, 2),
    textFitScore(zones.venue, text.venue, 2),
  ];
  const fit = average(fitScores);
  const faceOverlap = 100 - scoreSubjectProtection(zones, snapshot.faceZone);
  const overlap = textOverlapPenalty(zones) * 1.6;
  return clamp(fit - faceOverlap * 0.4 - overlap, 0, 100);
}

function scoreMoodMatch(candidate: CocoLayoutCandidate, snapshot: CocoTournamentSnapshot) {
  const mood = snapshot.moodProfile;
  if (mood) {
    const centered = candidate.layoutId === "subject-center";
    const side = candidate.layoutId !== "subject-center";
    const pattern = candidate.patternId;
    let score = 78;
    if (mood.primaryMood === "luxury" || mood.primaryMood === "rnb") {
      score += centered ? 8 : 2;
      if (pattern.includes("editorial")) score += 11;
      if (pattern.includes("air")) score += 8;
      score += (mood.vector.elegance + mood.vector.exclusivity - 120) * 0.08;
    } else if (mood.primaryMood === "rave" || mood.primaryMood === "techno") {
      if (pattern.includes("takeover") || pattern.includes("title-forward")) score += 12;
      if (side || pattern.includes("asym")) score += 4;
      score += (mood.vector.energy + mood.vector.underground - 130) * 0.07;
    } else if (mood.primaryMood === "pool" || mood.primaryMood === "brunch" || mood.primaryMood === "rooftop") {
      score += centered ? 8 : 3;
      if (pattern.includes("air") || pattern.includes("balanced")) score += 8;
      score += (mood.vector.summer - 50) * 0.08;
    } else if (mood.primaryMood === "latin" || mood.primaryMood === "afrobeats") {
      score += centered ? 8 : 4;
      if (pattern.includes("balanced") || pattern.includes("title-forward")) score += 6;
      score += (mood.vector.playfulness + mood.vector.sensuality - 120) * 0.05;
    } else if (mood.primaryMood === "hiphop" || mood.primaryMood === "throwback") {
      if (pattern.includes("takeover") || pattern.includes("title-forward")) score += 12;
      score += (mood.vector.energy - 60) * 0.08;
    } else {
      score += candidate.layoutId === snapshot.layoutId ? 6 : 0;
    }
    return clamp(score, 0, 100);
  }

  const style = snapshot.nightlifeStyle;
  if (!style) return candidate.layoutId === snapshot.layoutId ? 84 : 78;
  const centered = candidate.layoutId === "subject-center";
  const side = candidate.layoutId !== "subject-center";
  const pattern = candidate.patternId;
  if (style === "luxury-club" || style === "rnb-lounge" || style === "bottle-service") {
    return clamp((centered ? 84 : 78) + (pattern.includes("editorial") ? 10 : 0) + (pattern.includes("air") ? 5 : 0), 0, 100);
  }
  if (style === "edm" || style === "techno" || style === "house") {
    return clamp((pattern.includes("takeover") || pattern.includes("title-forward") ? 90 : 80) + (side ? 4 : 0), 0, 100);
  }
  if (style === "afrobeats" || style === "latin-night" || style === "brunch" || style === "ladies-night") {
    return clamp((centered ? 88 : 82) + (pattern.includes("balanced") ? 7 : 0), 0, 100);
  }
  if (style === "hip-hop" || style === "throwback") {
    return clamp((pattern.includes("takeover") || pattern.includes("title-forward") ? 90 : 80), 0, 100);
  }
  return 80;
}

function scorePremium(
  zones: CocoTournamentZoneMap,
  inputs: Pick<CocoTournamentScore, "alignment" | "negativeSpace" | "readability" | "subjectProtection">
) {
  const calm = average([
    inputs.alignment,
    inputs.negativeSpace,
    inputs.readability,
    inputs.subjectProtection,
  ]);
  const chaosPenalty = textOverlapPenalty(zones) * 1.2 + unevenFooterPenalty(zones);
  return clamp(calm - chaosPenalty, 0, 100);
}

function scoreEnergy(candidate: CocoLayoutCandidate, zones: CocoTournamentZoneMap) {
  const headlineRatio = area(zones.headline) / Math.max(1, area(zones.leftInfo) + area(zones.rightInfo));
  const scriptOffset = Math.abs(rectCenter(zones.script).x - rectCenter(zones.headline).x);
  const patternBoost = candidate.patternId.includes("takeover") || candidate.patternId.includes("title-forward") ? 16 : 0;
  return clamp(62 + headlineRatio * 10 + scriptOffset * 0.5 + patternBoost, 0, 100);
}

function scoreOriginality(candidate: CocoLayoutCandidate) {
  if (candidate.patternId === "current") return 52;
  if (candidate.patternId.includes("takeover")) return 86;
  if (candidate.patternId.includes("editorial")) return 76;
  return 70;
}

export function passesFatalGates(score: CocoTournamentScore | undefined) {
  if (!score) return false;
  return (
    score.hierarchy >= 64 &&
    score.readability >= 62 &&
    score.subjectProtection >= 70 &&
    score.balance >= 58 &&
    score.negativeSpace >= 54
  );
}

function protectFace(zones: CocoTournamentZoneMap, faceZone: CocoTournamentRect): CocoTournamentZoneMap {
  const next = cloneZoneMap(zones);
  for (const role of TEXT_ROLES) {
    const rectValue = next[role];
    if (intersectionRatio(rectValue, faceZone) <= 0.01) continue;
    const faceCenter = rectCenter(faceZone);
    const rectValueCenter = rectCenter(rectValue);
    const moveLeft = rectValueCenter.x <= faceCenter.x;
    const moveUp = rectValueCenter.y <= faceCenter.y;
    const dx = moveLeft ? -(intersectionWidth(rectValue, faceZone) + 2) : intersectionWidth(rectValue, faceZone) + 2;
    const dy = moveUp ? -(intersectionHeight(rectValue, faceZone) + 2) : intersectionHeight(rectValue, faceZone) + 2;
    if (role === "headline" || role === "script") {
      next[role] = clampRect({ ...rectValue, y: rectValue.y + dy });
    } else {
      next[role] = clampRect({ ...rectValue, x: rectValue.x + dx });
    }
  }
  return next;
}

function resolveTextOverlaps(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  let next = cloneZoneMap(zones);
  const sorted = [...TEXT_ROLES].sort((a, b) => ROLE_WEIGHT[b] - ROLE_WEIGHT[a]);
  for (let pass = 0; pass < 3; pass += 1) {
    for (let highIndex = 0; highIndex < sorted.length; highIndex += 1) {
      for (let lowIndex = highIndex + 1; lowIndex < sorted.length; lowIndex += 1) {
        const high = sorted[highIndex];
        const low = sorted[lowIndex];
        if (!rectsOverlap(next[high], next[low])) continue;
        const overlapH = intersectionHeight(next[high], next[low]);
        const lowRect = next[low];
        const highCenter = rectCenter(next[high]);
        const lowCenter = rectCenter(lowRect);
        const direction = lowCenter.y >= highCenter.y ? 1 : -1;
        const moved = clampRect({ ...lowRect, y: lowRect.y + direction * (overlapH + 2.5) });
        next = { ...next, [low]: moved };
      }
    }
  }
  return next;
}

function addBreathingRoom(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  const next = cloneZoneMap(zones);
  next.leftInfo = shrinkRect(next.leftInfo, 0.94);
  next.rightInfo = shrinkRect(next.rightInfo, 0.94);
  next.venue = shrinkRect(next.venue, 0.95);
  next.script = shrinkRect(next.script, 0.96);
  return normalizeZoneMap(next);
}

function increaseHeadlineDominance(zones: CocoTournamentZoneMap, story: boolean): CocoTournamentZoneMap {
  const next = cloneZoneMap(zones);
  const extra = story ? 4 : 5;
  next.headline = clampRect({
    ...next.headline,
    height: next.headline.height + (story ? 1.5 : 2),
    width: Math.min(92, next.headline.width + extra),
    x: next.headline.align === "center" ? next.headline.x - extra / 2 : next.headline.x,
  });
  next.script = clampRect({
    ...next.script,
    y: next.script.y + (story ? 1 : 1.3),
  });
  return normalizeZoneMap(next);
}

function normalizeZoneMap(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  return {
    date: clampRect(zones.date),
    headline: clampRect(zones.headline),
    leftInfo: clampRect(zones.leftInfo),
    presenter: clampRect(zones.presenter),
    price: clampRect(zones.price),
    rightInfo: clampRect(zones.rightInfo),
    script: clampRect(zones.script),
    subject: clampRect(zones.subject),
    subtag: clampRect(zones.subtag),
    venue: clampRect(zones.venue),
  };
}

function snapZoneMap(zones: CocoTournamentZoneMap, grid: number): CocoTournamentZoneMap {
  const snapRect = (item: CocoTournamentRect) => ({
    ...item,
    height: snap(item.height, grid),
    width: snap(item.width, grid),
    x: snap(item.x, grid),
    y: snap(item.y, grid),
  });
  return normalizeZoneMap({
    date: snapRect(zones.date),
    headline: snapRect(zones.headline),
    leftInfo: snapRect(zones.leftInfo),
    presenter: snapRect(zones.presenter),
    price: snapRect(zones.price),
    rightInfo: snapRect(zones.rightInfo),
    script: snapRect(zones.script),
    subject: snapRect(zones.subject),
    subtag: snapRect(zones.subtag),
    venue: snapRect(zones.venue),
  });
}

function dedupeCandidates(candidates: CocoLayoutCandidate[]): CocoLayoutCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = TEXT_ROLES.map((role) => {
      const item = candidate.zones[role];
      return `${role}:${Math.round(item.x)}:${Math.round(item.y)}:${Math.round(item.width)}:${Math.round(item.height)}:${item.align ?? ""}`;
    }).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareCandidates(a: CocoLayoutCandidate, b: CocoLayoutCandidate) {
  return (
    (b.scores?.final ?? 0) - (a.scores?.final ?? 0) ||
    (b.scores?.subjectProtection ?? 0) - (a.scores?.subjectProtection ?? 0) ||
    (b.scores?.hierarchy ?? 0) - (a.scores?.hierarchy ?? 0)
  );
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  align?: CocoTournamentAlign
): CocoTournamentRect {
  return { align, height, width, x, y };
}

function clampRect(rectValue: CocoTournamentRect): CocoTournamentRect {
  const width = clamp(rectValue.width, 1, 100);
  const height = clamp(rectValue.height, 1, 100);
  return {
    ...rectValue,
    height,
    width,
    x: clamp(rectValue.x, 0, 100 - width),
    y: clamp(rectValue.y, 0, 100 - height),
  };
}

function shrinkRect(rectValue: CocoTournamentRect, factor: number): CocoTournamentRect {
  const nextWidth = rectValue.width * factor;
  const nextHeight = rectValue.height * factor;
  return {
    ...rectValue,
    height: nextHeight,
    width: nextWidth,
    x: rectValue.x + (rectValue.width - nextWidth) / 2,
    y: rectValue.y + (rectValue.height - nextHeight) / 2,
  };
}

function cloneZoneMap(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  return {
    date: { ...zones.date },
    headline: { ...zones.headline },
    leftInfo: { ...zones.leftInfo },
    presenter: { ...zones.presenter },
    price: { ...zones.price },
    rightInfo: { ...zones.rightInfo },
    script: { ...zones.script },
    subject: { ...zones.subject },
    subtag: { ...zones.subtag },
    venue: { ...zones.venue },
  };
}

function textFitScore(zone: CocoTournamentRect, value: string | undefined, maxLines: number) {
  const text = String(value || "").trim();
  if (!text) return 92;
  const words = text.split(/\s+/).filter(Boolean);
  const chars = words.join("").length + Math.max(0, words.length - 1);
  const lineCount = Math.max(1, Math.ceil(chars / Math.max(8, zone.width * 0.52)));
  const density = chars / Math.max(1, zone.width * zone.height * 0.55);
  const linePenalty = Math.max(0, lineCount - maxLines) * 12;
  return clamp(100 - density * 110 - linePenalty, 35, 100);
}

function textOverlapPenalty(zones: CocoTournamentZoneMap) {
  let penalty = 0;
  for (let i = 0; i < TEXT_ROLES.length; i += 1) {
    for (let j = i + 1; j < TEXT_ROLES.length; j += 1) {
      const a = TEXT_ROLES[i];
      const b = TEXT_ROLES[j];
      penalty += intersectionArea(zones[a], zones[b]) / Math.max(1, Math.min(area(zones[a]), area(zones[b])));
    }
  }
  return penalty * 100;
}

function unevenFooterPenalty(zones: CocoTournamentZoneMap) {
  return Math.abs(zones.rightInfo.y - zones.venue.y) * 1.4 + Math.abs(zones.rightInfo.height - zones.venue.height) * 0.8;
}

function edgePenalty(rectValue: CocoTournamentRect) {
  const edge = Math.min(rectValue.x, rectValue.y, 100 - rectValue.x - rectValue.width, 100 - rectValue.y - rectValue.height);
  if (edge >= MIN_MARGIN) return 0;
  return (MIN_MARGIN - edge) * 2.5;
}

function ratioScore(value: number, low: number, high: number) {
  if (value < low) return clamp((value / low) * 100, 0, 100);
  if (value > high) return clamp(100 - (value - high) * 35, 0, 100);
  return 100;
}

function rectCenter(rectValue: CocoTournamentRect) {
  return {
    x: rectValue.x + rectValue.width / 2,
    y: rectValue.y + rectValue.height / 2,
  };
}

function area(rectValue: CocoTournamentRect) {
  return Math.max(0, rectValue.width) * Math.max(0, rectValue.height);
}

function rectsOverlap(a: CocoTournamentRect, b: CocoTournamentRect) {
  return intersectionArea(a, b) > 0;
}

function intersectionArea(a: CocoTournamentRect, b: CocoTournamentRect) {
  return intersectionWidth(a, b) * intersectionHeight(a, b);
}

function intersectionWidth(a: CocoTournamentRect, b: CocoTournamentRect) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  return Math.max(0, right - left);
}

function intersectionHeight(a: CocoTournamentRect, b: CocoTournamentRect) {
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, bottom - top);
}

function intersectionRatio(a: CocoTournamentRect, b: CocoTournamentRect) {
  return intersectionArea(a, b) / Math.max(1, area(a));
}

function rectDistance(a: CocoTournamentRect, b: CocoTournamentRect) {
  const ax = rectCenter(a).x;
  const ay = rectCenter(a).y;
  const bx = rectCenter(b).x;
  const by = rectCenter(b).y;
  return Math.hypot(ax - bx, ay - by);
}

function smallestSpread(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return values.reduce((sum, value) => sum + Math.abs(value - median), 0) / values.length;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function snap(value: number, grid: number) {
  return Math.round(value / grid) * grid;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
