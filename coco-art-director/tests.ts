import { directCocoArtwork } from "./director.ts";
import { MOJITO_ART_DIRECTOR_FIXTURE } from "./fixtures.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Assertion failed: ${message}`);
}

export function runArtDirectorTests() {
  const result = directCocoArtwork(MOJITO_ART_DIRECTOR_FIXTURE);

  assert(result.initialScore.total > 70, "Mojito fixture should score above 70.");
  assert(result.finalScore.total >= result.initialScore.total, "Iteration should not lower simulated final score.");
  assert(result.exportDecision.allowed, `Mojito fixture should be exportable: ${result.exportDecision.message}`);
  assert(result.finalScore.hierarchy > 80, "Hierarchy should be strong.");
  assert(result.finalScore.subjectProtection > 80, "Subject protection should be strong.");
  assert(result.authority.artDirectorVersion === "1.0", "Version should be 1.0.");

  return {
    score: result.finalScore,
    findings: result.findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      message: finding.userFacingMessage,
    })),
    exportDecision: result.exportDecision,
    patches: result.recommendedPatches,
  };
}
