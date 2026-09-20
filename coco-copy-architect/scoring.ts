import type {
  CopyArchitectureCandidate,
  CopyArchitectureScore,
  CopyArchitectInput,
} from "./types.ts";
import { clamp, weightedAverage } from "./utils.ts";

export function scoreCopyArchitecture(
  input: CopyArchitectInput,
  candidate: Omit<CopyArchitectureCandidate, "score">
): CopyArchitectureScore {
  const visible = candidate.groups.filter((group) => group.treatment !== "hide");
  const clarity = scoreClarity(candidate);
  const hierarchy = scoreHierarchy(candidate, input);
  const densityControl = scoreDensity(candidate, input);
  const rhythm = scoreRhythm(candidate);
  const premiumPotential = scorePremium(candidate);
  const marketingFit = scoreMarketing(candidate, input);
  const sceneFit = scoreScene(candidate, input);
  const completeness = scoreCompleteness(candidate, input);
  const redundancyControl = scoreRedundancy(candidate);
  const renderability = scoreRenderability(candidate);

  const total = weightedAverage([
    [clarity, 0.14],
    [hierarchy, 0.14],
    [densityControl, 0.12],
    [rhythm, 0.1],
    [premiumPotential, 0.1],
    [marketingFit, 0.1],
    [sceneFit, 0.08],
    [completeness, 0.08],
    [redundancyControl, 0.07],
    [renderability, 0.07],
  ]);

  return {
    clarity: round(clarity),
    hierarchy: round(hierarchy),
    densityControl: round(densityControl),
    rhythm: round(rhythm),
    premiumPotential: round(premiumPotential),
    marketingFit: round(marketingFit),
    sceneFit: round(sceneFit),
    completeness: round(completeness),
    redundancyControl: round(redundancyControl),
    renderability: round(renderability),
    total: round(total),
  };
}

function scoreClarity(candidate: Omit<CopyArchitectureCandidate, "score">): number {
  let score = 92;
  for (const group of candidate.groups) {
    if (group.treatment === "hide") continue;
    if (group.text.length > group.maxCharactersPerLine * group.maxLines * 1.35) score -= 8;
    if (group.maxLines > 4 && group.role !== "footer") score -= 5;
  }
  return clamp(score);
}

function scoreHierarchy(
  candidate: Omit<CopyArchitectureCandidate, "score">,
  input: CopyArchitectInput
): number {
  const identity = candidate.groups.find((group) => group.role === "identity");
  const accent = candidate.groups.find((group) => group.role === "emotion");
  const body = candidate.groups.find((group) => group.role === "experience" || group.role === "music");
  const needsAccent = Boolean(
    input.event.accent ||
      input.creativeDirection?.copyArchitecture?.some(
        (group) =>
          (group.role === "emotion" || group.treatment === "accent") &&
          group.treatment !== "hide"
      )
  );
  let score = 90;

  if (!identity || identity.treatment !== "hero") score -= 35;
  if (needsAccent && (!accent || accent.treatment === "hide" || !accent.text.trim())) score -= 22;
  if (accent && accent.powerRatio > 0.48) score -= 12;
  if (body && body.powerRatio > 0.32) score -= 12;
  if (candidate.groups.filter((group) => group.priority === 1).length > 1) score -= 15;
  return clamp(score);
}

function scoreDensity(candidate: Omit<CopyArchitectureCandidate, "score">, input: CopyArchitectInput): number {
  const visible = candidate.groups.filter((group) => group.treatment !== "hide" && group.treatment !== "mute");
  const maxVisible =
    input.userPreferences?.maxVisibleGroups ??
    input.scene?.creativeDecisions?.densityPolicy?.maxVisibleGroups ??
    (candidate.density === "minimal" ? 4 : candidate.density === "low" ? 5 : candidate.density === "medium" ? 6 : 8);

  let score = 94;
  if (visible.length > maxVisible) score -= (visible.length - maxVisible) * 12;
  if (candidate.density === "minimal" && visible.length > 4) score -= 10;
  return clamp(score);
}

function scoreRhythm(candidate: Omit<CopyArchitectureCandidate, "score">): number {
  const visible = candidate.groups.filter((group) => group.treatment !== "hide");
  let score = 88;
  const priorities = visible.map((group) => group.priority);
  for (let i = 1; i < priorities.length; i++) {
    if (priorities[i] < priorities[i - 1] - 1) score -= 6;
  }
  if (visible.some((group) => group.spacingAfter > 4)) score -= 4;
  return clamp(score);
}

function scorePremium(candidate: Omit<CopyArchitectureCandidate, "score">): number {
  let score = 78;
  if (["minimal", "low"].includes(candidate.density)) score += 9;
  if (["luxury", "editorial", "premium-lifestyle"].includes(candidate.tone)) score += 8;
  if (candidate.groups.some((group) => group.treatment === "metadata")) score += 4;
  if (candidate.groups.filter((group) => group.treatment === "badge").length > 1) score -= 10;
  return clamp(score);
}

function scoreMarketing(candidate: Omit<CopyArchitectureCandidate, "score">, input: CopyArchitectInput): number {
  const goal = input.creativeDirection?.marketingGoal ?? input.scene?.creativeDecisions?.marketingIntent ?? "sell-event";
  let score = 82;

  if (goal === "sell-lifestyle" && candidate.groups.some((group) => group.role === "experience")) score += 12;
  if (goal === "sell-music" && candidate.groups.some((group) => group.role === "music")) score += 12;
  if (goal === "sell-vip" && candidate.groups.some((group) => group.role === "offer" || group.role === "badge")) score += 10;
  if (goal === "sell-artist" && candidate.pattern === "identity-artist-logistics") score += 10;
  return clamp(score);
}

function scoreScene(candidate: Omit<CopyArchitectureCandidate, "score">, input: CopyArchitectInput): number {
  let score = 82 + (input.scene?.confidence ?? 0.6) * 10;
  const density = input.scene?.creativeDecisions?.densityPolicy?.policy;
  if (density === candidate.density) score += 7;
  return clamp(score);
}

function scoreCompleteness(candidate: Omit<CopyArchitectureCandidate, "score">, input: CopyArchitectInput): number {
  let score = 86;
  if (!candidate.groups.some((group) => group.role === "identity" && group.text)) score -= 40;
  if (input.event.date && !candidate.groups.some((group) => group.role === "logistics" && group.text)) score -= 10;
  if (input.event.venue && !candidate.groups.some((group) => group.role === "venue" && group.text)) score -= 10;
  return clamp(score);
}

function scoreRedundancy(candidate: Omit<CopyArchitectureCandidate, "score">): number {
  const texts = candidate.groups.filter((group) => group.treatment !== "hide").map((group) => group.text.toLowerCase());
  const duplicates = texts.filter((text, index) => texts.indexOf(text) !== index);
  return clamp(96 - duplicates.length * 20);
}

function scoreRenderability(candidate: Omit<CopyArchitectureCandidate, "score">): number {
  let score = 92;
  for (const group of candidate.groups) {
    if (group.treatment === "hide") continue;
    if (!group.text.trim()) score -= 8;
    if (group.text.split("\n").length > group.maxLines) score -= 8;
  }
  return clamp(score);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
