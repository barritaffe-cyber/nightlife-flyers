import type {
  CandidatePrediction,
  CritiqueCandidate,
  CritiqueFinding,
  CritiqueLoopInput,
  CritiqueMemory,
} from "./types.ts";
import { patchSignature } from "./signatures.ts";
import { clamp, round } from "./utils.ts";

export function predictCandidate(
  candidate: CritiqueCandidate,
  finding: CritiqueFinding,
  input: CritiqueLoopInput,
  memory: CritiqueMemory
): CandidatePrediction {
  let expectedGain = candidate.expectedGain;
  let risk = candidate.estimatedRisk;
  const sideEffects: string[] = [];
  const regressionRisks: string[] = [];

  if (finding.blocker) expectedGain += 4;

  if (!candidate.preservesUserIntent) {
    risk += 0.16;
    sideEffects.push("Touches a user-preserved target.");
  }

  if (candidate.touchesProtectedRegion) {
    risk += 0.05;
    regressionRisks.push("Could create new scene-overlap risk.");
  }

  if (candidate.patches.some((patch) => patch.action === "move")) {
    risk += 0.05;
    regressionRisks.push("Could affect balance or alignment.");
  }

  if (candidate.patches.some((patch) => patch.action === "scale" && Number(patch.values.scale) > 1.12)) {
    risk += 0.12;
    regressionRisks.push("Could create edge or overlap risk.");
  }

  if (candidate.patches.some((patch) => patch.action === "hide")) {
    risk += 0.04;
    sideEffects.push("May remove useful information.");
  }

  if (candidate.patches.some((patch) => patch.action === "changeFont")) {
    risk += 0.04;
    sideEffects.push("May change line wrapping.");
  }

  if (candidate.patches.some((patch) => patch.action === "changeLineBreak")) {
    risk += 0.05;
    sideEffects.push("May change stack height.");
  }

  const signatures = candidate.patches.map(patchSignature);

  if (memory.rejectedCandidateIds.includes(candidate.id)) {
    expectedGain -= 5;
    risk += 0.2;
    regressionRisks.push("Candidate was previously rejected.");
  }

  if (signatures.some((signature) => memory.rejectedPatchSignatures.includes(signature))) {
    expectedGain -= 4;
    risk += 0.18;
    regressionRisks.push("A similar patch was previously rejected.");
  }

  if (memory.acceptedCandidateIds.includes(candidate.id)) {
    expectedGain += 2;
  }

  if (signatures.some((signature) => memory.acceptedPatchSignatures.includes(signature))) {
    expectedGain += 1.5;
  }

  if (input.settings?.preserveUserMoves && candidate.patches.some((patch) => patch.action === "move")) {
    risk += 0.08;
  }

  const affectedCategories = predictCategoryImpact(candidate.category, expectedGain);
  const confidence = clamp(
    (candidate.confidence - risk * 0.2) * 100,
    20,
    99
  ) / 100;

  const netValue =
    expectedGain -
    risk * 18 -
    candidate.implementationCost * 0.8;

  return {
    candidateId: candidate.id,
    expectedGain: round(expectedGain),
    risk: round(risk, 2),
    confidence: round(confidence, 2),
    netValue: round(netValue),
    affectedCategories,
    sideEffects,
    regressionRisks,
    reason: `Expected gain ${expectedGain.toFixed(1)}, risk ${risk.toFixed(2)}, cost ${candidate.implementationCost}.`,
  };
}

function predictCategoryImpact(
  category: CritiqueCandidate["category"],
  gain: number
): CandidatePrediction["affectedCategories"] {
  const result: CandidatePrediction["affectedCategories"] = {
    [category]: gain,
  };

  if (category === "hierarchy") {
    result.composition = gain * 0.18;
    result.premiumPolish = gain * 0.22;
    result.marketingClarity = gain * 0.12;
  }

  if (category === "readability" || category === "contrast") {
    result.contrast = gain * 0.45;
    result.marketingClarity = gain * 0.2;
  }

  if (category === "composition" || category === "alignment" || category === "rhythm") {
    result.balance = gain * 0.24;
    result.spacing = gain * 0.2;
    result.premiumPolish = gain * 0.18;
  }

  if (category === "subjectProtection") {
    result.sceneInteraction = gain * 0.25;
  }

  return result;
}
