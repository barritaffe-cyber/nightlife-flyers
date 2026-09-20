import type {
  ArtDirectorInput,
  ArtDirectorResult,
  DesignPatch,
} from "./types.ts";
import { evaluateArtwork } from "./evaluator.ts";
import { scoreArtwork } from "./score.ts";
import { runArtDirectorIterations } from "./iteration.ts";
import { decideExport } from "./exportGate.ts";
import { validateArtDirectorInput } from "./validate.ts";

export function directCocoArtwork(
  input: ArtDirectorInput
): ArtDirectorResult {
  const inputErrors = validateArtDirectorInput(input);
  if (inputErrors.length) {
    throw new Error(`Invalid Coco Art Director input:\n${inputErrors.join("\n")}`);
  }

  const findings = evaluateArtwork(input);
  const initialScore = scoreArtwork(input, findings);
  const iterations = runArtDirectorIterations(input, initialScore, findings);

  const finalScore =
    [...iterations].reverse().find((iteration) => iteration.simulatedScoreAfter)?.simulatedScoreAfter ??
    initialScore;

  const recommendedPatches: DesignPatch[] = iterations.flatMap(
    (iteration) => iteration.winner?.patches ?? []
  );

  const exportDecision = decideExport(input, finalScore, findings);
  const strongestFinding = findings[0];

  return {
    finalScore,
    initialScore,
    findings,
    strongestFinding,
    iterations,
    recommendedPatches,
    exportDecision,
    authority: {
      artDirectorVersion: "1.0",
      requiredFixes: findings
        .filter((finding) => finding.blocker)
        .map((finding) => finding.id),
      downstreamMustObey: [
        "all critical findings before export",
        "selected improvement patches",
        "scene protection constraints",
        "upstream hierarchy contracts",
        "preview/export parity",
        "single highest-value issue at a time",
      ],
    },
    trace: [
      {
        stage: "evaluate",
        decision: `Found ${findings.length} design findings.`,
        confidence: 0.96,
        evidence: findings.slice(0, 8).map((finding) => `${finding.id}:${finding.severity}`),
      },
      {
        stage: "score",
        decision: `Initial score ${initialScore.total}.`,
        confidence: 0.95,
        evidence: [
          `Hierarchy ${initialScore.hierarchy}`,
          `Readability ${initialScore.readability}`,
          `Composition ${initialScore.composition}`,
          `Premium ${initialScore.premiumPolish}`,
        ],
      },
      {
        stage: "iterate",
        decision: `Generated ${iterations.length} refinement iteration${iterations.length === 1 ? "" : "s"}.`,
        confidence: 0.9,
        evidence: iterations.map((iteration) =>
          iteration.winner
            ? `${iteration.strongestFinding.id} -> ${iteration.winner.id}`
            : `${iteration.strongestFinding.id} -> stopped`
        ),
      },
      {
        stage: "export",
        decision: exportDecision.message,
        confidence: exportDecision.allowed ? 0.96 : 0.99,
        evidence: exportDecision.blockers.map((finding) => finding.id),
      },
    ],
  };
}
