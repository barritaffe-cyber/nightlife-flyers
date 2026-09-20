import type {
  CocoDesignCritique,
  CocoImprovementCandidate,
  CocoIterationInput,
  CocoIterationState,
  CocoPrediction,
} from "./types";
import { critiqueCocoDesign, scoreCocoCritiques } from "./critiqueEngine.ts";
import { applyCocoDesignPatch } from "./patch.ts";

type PredictionInput = CocoIterationInput & CocoIterationState;

export function predictCocoImprovement(
  input: PredictionInput,
  critique: CocoDesignCritique,
  candidate: CocoImprovementCandidate
): CocoPrediction {
  const beforeCritiques = critiqueCocoDesign(input);
  const beforePain = scoreCocoCritiques(beforeCritiques);
  const patched = applyCocoDesignPatch(input, candidate.patch);
  const afterCritiques = critiqueCocoDesign({
    ...input,
    ...patched,
  });
  const afterPain = scoreCocoCritiques(afterCritiques);
  const risk = riskForCandidate(input, candidate);
  const originalCritiqueResolved = !afterCritiques.some((after) => after.id === critique.id);
  const directGain = originalCritiqueResolved ? directGainFor(critique, candidate) : 0;
  const simulatedGain = beforePain - afterPain;
  const expectedGain = Math.max(0, Math.round(Math.max(simulatedGain, directGain) - risk * 10));

  return {
    candidateId: candidate.id,
    expectedGain,
    risk: Number(risk.toFixed(2)),
    reason: `Expected gain ${expectedGain}; simulated critique pain ${beforePain} -> ${afterPain}; risk ${risk.toFixed(2)}.`,
  };
}

function directGainFor(
  critique: CocoDesignCritique,
  candidate: CocoImprovementCandidate
) {
  if (critique.category === "visualInteraction") {
    if (candidate.action === "addImageInteraction") return 10;
    if (candidate.action === "moveStack") return 8;
  }
  if (critique.category === "hierarchy") {
    if (candidate.action === "shrinkAccent") return 9;
    if (candidate.action === "scaleHeadline") return 6;
  }
  if (critique.category === "metadata") return 8;
  if (critique.category === "badge") {
    if (candidate.action === "quietBadge") return 9;
    return 11;
  }
  if (critique.category === "topUtility") {
    if (candidate.action === "separateTopUtility") return 12;
    if (candidate.action === "quietBadge") return 10;
    return 9;
  }
  if (critique.category === "edgeRisk") return 7;
  return 0;
}

function riskForCandidate(
  input: PredictionInput,
  candidate: CocoImprovementCandidate
) {
  const patch = candidate.patch;
  let risk = 0.08;

  if (patch.stackOffsetX && Math.abs(patch.stackOffsetX) > 4) risk += 0.14;
  if (patch.stackOffsetY && Math.abs(patch.stackOffsetY) > 3) risk += 0.12;
  if (patch.headlineScale && patch.headlineScale > 1.08) risk += 0.14;
  if (patch.accentScale && patch.accentScale > 1.02) risk += 0.1;
  if (patch.accentRotation && Math.abs(patch.accentRotation) > 5) risk += 0.1;
  if (patch.badgeOffsetX && Math.abs(patch.badgeOffsetX) > 18) risk += 0.12;
  if (patch.badgeOffsetY && Math.abs(patch.badgeOffsetY) > 5) risk += 0.08;
  if (patch.badgeScale && patch.badgeScale < 0.68) risk += 0.08;
  if (input.faceZone && patch.accentOffsetX && Math.abs(patch.accentOffsetX) > 3.5) risk += 0.16;

  return risk;
}
