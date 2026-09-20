import type {
  CandidatePrediction,
  CritiqueCandidate,
  CritiqueLoopInput,
} from "./types.ts";
import { stableSort } from "./utils.ts";

export function selectWinningCandidate(
  candidates: CritiqueCandidate[],
  predictions: CandidatePrediction[],
  input: CritiqueLoopInput
): {
  candidate?: CritiqueCandidate;
  prediction?: CandidatePrediction;
  rejected: Array<{ candidateId: string; reason: string }>;
} {
  const predictionById = new Map(
    predictions.map((prediction) => [prediction.candidateId, prediction])
  );

  const eligible = candidates.filter((candidate) => {
    const prediction = predictionById.get(candidate.id);
    if (!prediction) return false;
    if (prediction.expectedGain < (input.settings?.minExpectedGain ?? 3)) return false;
    if (prediction.netValue < (input.settings?.minNetValue ?? 2.5)) return false;
    if (prediction.risk > (input.settings?.maxRisk ?? 0.35)) return false;
    return true;
  });

  const ranked = stableSort(eligible, (a, b) => {
    const ap = predictionById.get(a.id)!;
    const bp = predictionById.get(b.id)!;

    return (
      bp.netValue - ap.netValue ||
      bp.expectedGain - ap.expectedGain ||
      bp.confidence - ap.confidence ||
      ap.risk - bp.risk ||
      a.implementationCost - b.implementationCost
    );
  });

  const winner = ranked[0];
  const winningPrediction = winner
    ? predictionById.get(winner.id)
    : undefined;

  const rejected = candidates
    .filter((candidate) => candidate.id !== winner?.id)
    .map((candidate) => {
      const prediction = predictionById.get(candidate.id);

      if (!prediction) {
        return {
          candidateId: candidate.id,
          reason: "No prediction was available.",
        };
      }

      if (prediction.expectedGain < (input.settings?.minExpectedGain ?? 3)) {
        return {
          candidateId: candidate.id,
          reason: "Expected gain was too small.",
        };
      }

      if (prediction.netValue < (input.settings?.minNetValue ?? 2.5)) {
        return {
          candidateId: candidate.id,
          reason: "Net value was too low.",
        };
      }

      if (prediction.risk > (input.settings?.maxRisk ?? 0.35)) {
        return {
          candidateId: candidate.id,
          reason: "Predicted risk was too high.",
        };
      }

      return {
        candidateId: candidate.id,
        reason: "A stronger candidate won the tournament.",
      };
    });

  return {
    candidate: winner,
    prediction: winningPrediction,
    rejected,
  };
}
