import type {
  ArtDirectorFinding,
  ArtDirectorInput,
  ArtDirectorScore,
} from "./types.ts";
import { clamp, round, weightedAverage } from "./utils.ts";

type ArtDirectorScoreKey = Exclude<keyof ArtDirectorScore, "total">;

const CATEGORY_TO_SCORE: Partial<Record<ArtDirectorFinding["category"], ArtDirectorScoreKey>> = {
  hierarchy: "hierarchy",
  readability: "readability",
  composition: "composition",
  balance: "balance",
  rhythm: "rhythm",
  spacing: "spacing",
  alignment: "alignment",
  typography: "typography",
  copy: "copy",
  color: "color",
  contrast: "contrast",
  effects: "effects",
  sceneInteraction: "sceneInteraction",
  subjectProtection: "subjectProtection",
  informationDensity: "informationDensity",
  premiumPolish: "premiumPolish",
  originality: "originality",
  brandFit: "brandFit",
  marketingClarity: "marketingClarity",
  exportIntegrity: "exportIntegrity",
};

export function scoreArtwork(
  input: ArtDirectorInput,
  findings: ArtDirectorFinding[]
): ArtDirectorScore {
  const scores: Omit<ArtDirectorScore, "total"> = {
    hierarchy: 96,
    readability: 96,
    composition: 92,
    balance: baseFromContract(input.composition?.score?.balance, 90),
    rhythm: 90,
    spacing: 90,
    alignment: 90,
    typography: 92,
    copy: 92,
    color: 92,
    contrast: 94,
    effects: 90,
    sceneInteraction: 88,
    subjectProtection: 96,
    informationDensity: 92,
    premiumPolish: 88,
    originality: baseFromContract(input.composition?.score?.originality, 78),
    brandFit: 84,
    marketingClarity: 92,
    exportIntegrity: 100,
  };

  for (const finding of findings) {
    const key = CATEGORY_TO_SCORE[finding.category];
    if (!key) continue;
    scores[key] = clamp(scores[key] - finding.scorePenalty);
  }

  if (input.color?.roles?.length) {
    const lowContrast = input.color.roles.filter((role) =>
      role.contrastRatio !== undefined &&
      role.importance !== "low" &&
      role.contrastRatio < 3.5
    ).length;
    scores.contrast = clamp(scores.contrast - lowContrast * 8);
  }

  const total = weightedAverage([
    [scores.hierarchy, 0.1],
    [scores.readability, 0.09],
    [scores.composition, 0.08],
    [scores.balance, 0.07],
    [scores.rhythm, 0.05],
    [scores.spacing, 0.05],
    [scores.alignment, 0.05],
    [scores.typography, 0.08],
    [scores.copy, 0.05],
    [scores.color, 0.06],
    [scores.contrast, 0.06],
    [scores.effects, 0.04],
    [scores.sceneInteraction, 0.05],
    [scores.subjectProtection, 0.06],
    [scores.informationDensity, 0.04],
    [scores.premiumPolish, 0.06],
    [scores.originality, 0.03],
    [scores.brandFit, 0.02],
    [scores.marketingClarity, 0.04],
    [scores.exportIntegrity, 0.02],
  ]);

  return {
    ...Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, round(value)])
    ) as Omit<ArtDirectorScore, "total">,
    total: round(total),
  };
}

function baseFromContract(value: number | undefined, fallback: number): number {
  return typeof value === "number" ? clamp(value) : fallback;
}
