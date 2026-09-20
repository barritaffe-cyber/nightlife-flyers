import type {
  ArtDirectorInput,
  ArtDirectorIteration,
  ArtDirectorScore,
} from "./types.ts";
import { generateImprovements } from "./improvements.ts";
import { predictImprovement } from "./prediction.ts";
import { simulateScoreAfterImprovement } from "./simulate.ts";

export function runArtDirectorIterations(
  input: ArtDirectorInput,
  initialScore: ArtDirectorScore,
  findings: ReturnType<typeof import("./evaluator.ts").evaluateArtwork>
): ArtDirectorIteration[] {
  const maxIterations = input.userPreferences?.maxIterations ?? 4;
  const minExpectedGain = input.userPreferences?.minExpectedGain ?? 3;
  const iterations: ArtDirectorIteration[] = [];
  let currentScore = initialScore;
  const remaining = [...findings];

  for (let index = 0; index < maxIterations; index++) {
    const strongestFinding = remaining.shift();
    if (!strongestFinding) break;

    const candidates = generateImprovements(input, strongestFinding);
    const ranked = candidates
      .map((candidate) => ({
        candidate,
        prediction: predictImprovement(input, strongestFinding, candidate),
      }))
      .sort((a, b) => b.prediction.netValue - a.prediction.netValue);

    const winner = ranked[0];

    if (!winner || winner.prediction.expectedGain < minExpectedGain) {
      iterations.push({
        index,
        scoreBefore: currentScore,
        strongestFinding,
        candidates,
        stopped: true,
        stopReason: `No candidate exceeded minimum expected gain ${minExpectedGain}.`,
      });
      break;
    }

    const simulatedScoreAfter = simulateScoreAfterImprovement(
      currentScore,
      winner.candidate,
      winner.prediction
    );

    iterations.push({
      index,
      scoreBefore: currentScore,
      strongestFinding,
      candidates,
      winner: winner.candidate,
      prediction: winner.prediction,
      simulatedScoreAfter,
      stopped: false,
    });

    currentScore = simulatedScoreAfter;
  }

  return iterations;
}
