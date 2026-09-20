import type {
  ArtDirectorFinding,
  ArtDirectorInput,
  ArtDirectorScore,
  ExportDecision,
} from "./types.ts";

export function decideExport(
  input: ArtDirectorInput,
  score: ArtDirectorScore,
  findings: ArtDirectorFinding[]
): ExportDecision {
  const minimum =
    input.userPreferences?.minimumExportScore ??
    (input.userPreferences?.strictness === "strict" ? 82 :
     input.userPreferences?.strictness === "relaxed" ? 68 :
     75);

  const blockers = findings.filter((finding) => finding.blocker);
  const warnings = findings.filter((finding) => !finding.blocker && ["high", "medium"].includes(finding.severity));

  const allowed = blockers.length === 0 && score.total >= minimum;

  return {
    allowed,
    score: score.total,
    blockers,
    warnings,
    message: allowed
      ? `Ready to export. Art Director score ${score.total.toFixed(1)}.`
      : blockers.length
        ? `Export blocked by ${blockers.length} critical design issue${blockers.length === 1 ? "" : "s"}.`
        : `Export blocked because score ${score.total.toFixed(1)} is below ${minimum}.`,
  };
}
