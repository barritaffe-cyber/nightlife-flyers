import type {
  CritiqueEvaluation,
  CritiqueIteration,
  CritiqueLoopSettings,
} from "./types.ts";

export function shouldStopBeforeIteration(
  evaluation: CritiqueEvaluation,
  history: CritiqueIteration[],
  settings: CritiqueLoopSettings
): string | null {
  if (history.length >= settings.maxIterations) {
    return "Maximum iteration count reached.";
  }

  if (settings.stopWhenExportable && evaluation.exportAllowed) {
    return "Artwork is exportable and stopWhenExportable is enabled.";
  }

  if (!evaluation.findings.length) {
    return "No remaining findings.";
  }

  if (history.length >= 2) {
    const recent = history.slice(-2);
    const gains = recent
      .map((iteration) => iteration.scoreDelta ?? 0)
      .filter(Number.isFinite);

    if (
      gains.length === 2 &&
      gains.every((gain) => Math.abs(gain) < settings.plateauTolerance)
    ) {
      return "Critique loop reached a score plateau.";
    }
  }

  return null;
}

export function shouldStopAfterIteration(
  iteration: CritiqueIteration,
  settings: CritiqueLoopSettings
): string | null {
  if (iteration.rolledBack) {
    return "The selected refinement regressed the artwork.";
  }

  if (
    typeof iteration.scoreDelta === "number" &&
    iteration.scoreDelta < settings.plateauTolerance
  ) {
    return `Score gain ${iteration.scoreDelta.toFixed(1)} is below plateau tolerance ${settings.plateauTolerance}.`;
  }

  return null;
}
