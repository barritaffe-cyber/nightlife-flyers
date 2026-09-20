import type {
  ArtDirectorFinding,
  ArtDirectorInput,
  ImprovementCandidate,
  ImprovementPrediction,
} from "./types.ts";

export function predictImprovement(
  input: ArtDirectorInput,
  finding: ArtDirectorFinding,
  candidate: ImprovementCandidate
): ImprovementPrediction {
  let gain = candidate.expectedGain;
  let risk = candidate.risk;
  const sideEffects: string[] = [];

  if (candidate.patches.some((patch) => patch.action === "scale" && Number(patch.values.scale) > 1.12)) {
    risk += 0.12;
    sideEffects.push("May create edge or overlap risk.");
  }

  if (candidate.patches.some((patch) => patch.action === "move")) {
    risk += 0.05;
    sideEffects.push("May affect composition balance.");
  }

  if (candidate.patches.some((patch) => patch.action === "hide")) {
    risk += 0.04;
    sideEffects.push("May remove useful information.");
  }

  if (finding.blocker) gain += 4;

  if (input.userPreferences?.preserveUserMoves && candidate.patches.some((patch) => patch.action === "move")) {
    risk += 0.12;
    sideEffects.push("Conflicts with preserveUserMoves.");
  }

  if (input.learning?.rejectedImprovementIds?.includes(candidate.id)) {
    risk += 0.25;
    gain -= 5;
    sideEffects.push("Previously rejected by the user.");
  }

  if (input.learning?.acceptedImprovementIds?.includes(candidate.id)) {
    gain += 3;
  }

  const confidence = Math.max(0.2, Math.min(0.99, candidate.confidence - risk * 0.2));
  const netValue = Math.max(0, gain - risk * 18 - candidate.implementationCost * 0.8);

  return {
    candidateId: candidate.id,
    expectedGain: Math.round(gain * 10) / 10,
    risk: Math.round(risk * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    sideEffects,
    netValue: Math.round(netValue * 10) / 10,
    reason: `Expected gain ${gain.toFixed(1)}, risk ${risk.toFixed(2)}, implementation cost ${candidate.implementationCost}.`,
  };
}
