import { runCocoCritiqueLoop } from "./loop.ts";
import { createCritiqueLoopFixture } from "./fixtures.ts";

function assert(
  value: unknown,
  message: string
): asserts value {
  if (!value) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runCritiqueLoopTests() {
  const input = createCritiqueLoopFixture();
  const result = await runCocoCritiqueLoop(input);

  assert(
    result.history.length > 0,
    "Critique loop should run at least one iteration."
  );

  assert(
    result.finalScore >= result.initialEvaluation.score.total,
    "Final score should not be lower than initial score."
  );

  assert(
    result.acceptedPatches.length > 0,
    "At least one patch should be accepted."
  );

  assert(
    result.memory.iterationCount > 0,
    "Memory should record iteration count."
  );

  assert(
    result.authority.critiqueLoopVersion === "1.0",
    "Critique loop version should be 1.0."
  );

  return {
    initialScore: result.initialEvaluation.score.total,
    finalScore: result.finalScore,
    iterations: result.history.length,
    acceptedPatches: result.acceptedPatches,
    stoppedBecause: result.stoppedBecause,
    exportReady: result.exportReady,
  };
}
