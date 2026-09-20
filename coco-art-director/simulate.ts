import type {
  ArtDirectorScore,
  ImprovementCandidate,
  ImprovementPrediction,
} from "./types.ts";
import { clone, clamp, round } from "./utils.ts";

export function simulateScoreAfterImprovement(
  score: ArtDirectorScore,
  candidate: ImprovementCandidate,
  prediction: ImprovementPrediction
): ArtDirectorScore {
  const next = clone(score);
  const category = candidate.category as keyof ArtDirectorScore;

  if (category in next && category !== "total") {
    (next as any)[category] = clamp((next as any)[category] + prediction.expectedGain);
  }

  if (candidate.category === "hierarchy") {
    next.composition = clamp(next.composition + prediction.expectedGain * 0.18);
    next.premiumPolish = clamp(next.premiumPolish + prediction.expectedGain * 0.22);
  }

  if (candidate.category === "readability") {
    next.contrast = clamp(next.contrast + prediction.expectedGain * 0.45);
    next.marketingClarity = clamp(next.marketingClarity + prediction.expectedGain * 0.2);
  }

  if (candidate.category === "composition" || candidate.category === "alignment" || candidate.category === "rhythm") {
    next.balance = clamp(next.balance + prediction.expectedGain * 0.24);
    next.spacing = clamp(next.spacing + prediction.expectedGain * 0.2);
    next.premiumPolish = clamp(next.premiumPolish + prediction.expectedGain * 0.18);
  }

  if (candidate.category === "subjectProtection") {
    next.sceneInteraction = clamp(next.sceneInteraction + prediction.expectedGain * 0.25);
  }

  const values = Object.entries(next)
    .filter(([key]) => key !== "total")
    .map(([, value]) => value as number);

  next.total = round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return next;
}
