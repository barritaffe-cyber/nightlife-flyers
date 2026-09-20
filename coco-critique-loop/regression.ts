import type {
  CritiqueEvaluation,
  CritiqueLoopSettings,
} from "./types.ts";

export type RegressionResult = {
  accepted: boolean;
  delta: number;
  regressedCategories: string[];
  reason: string;
};

export function evaluateRegression(
  before: CritiqueEvaluation,
  after: CritiqueEvaluation,
  settings: CritiqueLoopSettings
): RegressionResult {
  const delta = after.score.total - before.score.total;

  const regressedCategories = Object.keys(before.score)
    .filter((key) => key !== "total")
    .filter((key) => {
      const beforeValue = (before.score as any)[key] as number;
      const afterValue = (after.score as any)[key] as number;
      return beforeValue - afterValue > settings.regressionTolerance;
    });

  const newBlockers = after.findings.filter((finding) => finding.blocker)
    .filter((finding) => !before.findings.some((item) => item.id === finding.id && item.blocker));

  if (newBlockers.length) {
    return {
      accepted: false,
      delta,
      regressedCategories,
      reason: `Rejected because ${newBlockers.length} new blocker${newBlockers.length === 1 ? "" : "s"} appeared.`,
    };
  }

  if (delta < -settings.regressionTolerance) {
    return {
      accepted: false,
      delta,
      regressedCategories,
      reason: `Rejected because total score dropped by ${Math.abs(delta).toFixed(1)}.`,
    };
  }

  if (regressedCategories.length > 3) {
    return {
      accepted: false,
      delta,
      regressedCategories,
      reason: "Rejected because too many categories regressed.",
    };
  }

  return {
    accepted: true,
    delta,
    regressedCategories,
    reason: delta >= 0
      ? `Accepted with score gain ${delta.toFixed(1)}.`
      : `Accepted with negligible score change ${delta.toFixed(1)}.`,
  };
}
