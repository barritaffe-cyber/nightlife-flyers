import type {
  CritiqueIteration,
  CritiqueLoopInput,
  CritiqueLoopResult,
  CritiqueLoopSettings,
  CritiqueMemory,
  DesignPatch,
} from "./types.ts";
import { DEFAULT_CRITIQUE_SETTINGS } from "./defaults.ts";
import { createCritiqueMemory, decayCooldowns, incrementCooldowns, rememberAcceptedCandidate, rememberAcceptedFinding, rememberRejectedCandidate } from "./memory.ts";
import { selectStrongestFinding } from "./findingSelector.ts";
import { generateCritiqueCandidates } from "./candidateGenerator.ts";
import { predictCandidate } from "./predictor.ts";
import { selectWinningCandidate } from "./tournament.ts";
import { evaluateRegression } from "./regression.ts";
import { shouldStopAfterIteration, shouldStopBeforeIteration } from "./stopConditions.ts";
import { buildCocoCritiqueMessage } from "./messages.ts";
import { snapshotSignature } from "./signatures.ts";
import { clone } from "./utils.ts";
import { validateCritiqueLoopInput } from "./validate.ts";

export async function runCocoCritiqueLoop(
  input: CritiqueLoopInput
): Promise<CritiqueLoopResult> {
  const errors = validateCritiqueLoopInput(input);
  if (errors.length) {
    throw new Error(`Invalid Coco Critique Loop input:\n${errors.join("\n")}`);
  }

  const settings: CritiqueLoopSettings = {
    ...DEFAULT_CRITIQUE_SETTINGS,
    ...(input.settings ?? {}),
  };

  let memory: CritiqueMemory = createCritiqueMemory(input.memory);
  let currentSnapshot = clone(input.initialSnapshot);
  let currentEvaluation = clone(input.initialEvaluation);
  const history: CritiqueIteration[] = [];
  const acceptedPatches: DesignPatch[] = [];
  const rejectedCandidates: Array<{ candidateId: string; reason: string }> = [];
  let stoppedBecause = "Completed.";

  for (let index = 0; index < settings.maxIterations; index++) {
    const preStop = shouldStopBeforeIteration(
      currentEvaluation,
      history,
      settings
    );

    if (preStop) {
      stoppedBecause = preStop;
      break;
    }

    memory = decayCooldowns(memory);

    const selectedFinding = selectStrongestFinding(
      currentEvaluation.findings,
      input,
      memory
    );

    if (!selectedFinding) {
      stoppedBecause = "No eligible findings remained.";
      break;
    }

    const candidates = generateCritiqueCandidates(
      selectedFinding,
      input
    );

    const predictions = candidates.map((candidate) =>
      predictCandidate(
        candidate,
        selectedFinding,
        input,
        memory
      )
    );

    const tournament = selectWinningCandidate(
      candidates,
      predictions,
      input
    );

    rejectedCandidates.push(...tournament.rejected);

    if (!tournament.candidate || !tournament.prediction) {
      history.push({
        index,
        snapshotBefore: clone(currentSnapshot),
        evaluationBefore: clone(currentEvaluation),
        selectedFinding,
        candidates,
        predictions,
        patchesApplied: [],
        accepted: false,
        rolledBack: false,
        stopped: true,
        stopReason: "No candidate passed the critique tournament.",
        userMessage: buildCocoCritiqueMessage(selectedFinding, memory).body,
      });

      stoppedBecause = "No candidate passed the critique tournament.";
      break;
    }

    if (!settings.allowAutomaticFixes) {
      history.push({
        index,
        snapshotBefore: clone(currentSnapshot),
        evaluationBefore: clone(currentEvaluation),
        selectedFinding,
        candidates,
        predictions,
        winner: tournament.candidate,
        winningPrediction: tournament.prediction,
        patchesApplied: [],
        accepted: false,
        rolledBack: false,
        stopped: true,
        stopReason: "Automatic fixes are disabled.",
        userMessage: buildCocoCritiqueMessage(selectedFinding, memory).body,
      });

      stoppedBecause = "Automatic fixes are disabled.";
      break;
    }

    const snapshotBefore = clone(currentSnapshot);
    const evaluationBefore = clone(currentEvaluation);

    let patchedSnapshot = await input.adapters.applyPatches(
      clone(currentSnapshot),
      tournament.candidate.patches
    );

    patchedSnapshot = await input.adapters.renderSnapshot(
      patchedSnapshot
    );

    const evaluationAfter = await input.adapters.evaluateArtwork(
      patchedSnapshot
    );

    const regression = evaluateRegression(
      evaluationBefore,
      evaluationAfter,
      settings
    );

    const accepted = regression.accepted;
    const rolledBack = !accepted;

    if (accepted) {
      currentSnapshot = clone(patchedSnapshot);
      currentEvaluation = clone(evaluationAfter);

      acceptedPatches.push(...tournament.candidate.patches);

      memory = rememberAcceptedFinding(
        memory,
        selectedFinding
      );

      memory = rememberAcceptedCandidate(
        memory,
        tournament.candidate.id,
        tournament.candidate.patches,
        snapshotSignature(currentSnapshot)
      );

      memory = incrementCooldowns(
        memory,
        selectedFinding.category,
        selectedFinding.targetIds
      );
    } else {
      memory = rememberRejectedCandidate(
        memory,
        tournament.candidate.id,
        tournament.candidate.patches
      );
    }

    memory = {
      ...memory,
      iterationCount: memory.iterationCount + 1,
      messageHistory: [
        ...memory.messageHistory,
        buildCocoCritiqueMessage(selectedFinding, memory).body,
      ],
    };

    const iteration: CritiqueIteration = {
      index,
      snapshotBefore,
      evaluationBefore,
      selectedFinding,
      candidates,
      predictions,
      winner: tournament.candidate,
      winningPrediction: tournament.prediction,
      patchesApplied: tournament.candidate.patches,
      snapshotAfter: accepted ? clone(currentSnapshot) : snapshotBefore,
      evaluationAfter: accepted ? clone(currentEvaluation) : evaluationBefore,
      scoreDelta: regression.delta,
      accepted,
      rolledBack,
      stopped: false,
      userMessage: buildCocoCritiqueMessage(selectedFinding, memory).body,
    };

    const postStop = shouldStopAfterIteration(
      iteration,
      settings
    );

    if (postStop) {
      iteration.stopped = true;
      iteration.stopReason = postStop;
      history.push(iteration);
      stoppedBecause = postStop;
      break;
    }

    history.push(iteration);
  }

  if (
    settings.requirePreviewExportParity &&
    currentSnapshot.globalMetrics?.previewExportMatch === false
  ) {
    stoppedBecause = "Preview/export parity failed.";
  }

  return {
    initialSnapshot: clone(input.initialSnapshot),
    finalSnapshot: clone(currentSnapshot),
    initialEvaluation: clone(input.initialEvaluation),
    finalEvaluation: clone(currentEvaluation),
    history,
    memory,
    acceptedPatches,
    rejectedCandidates,
    stoppedBecause,
    exportReady:
      currentEvaluation.exportAllowed &&
      currentSnapshot.globalMetrics?.previewExportMatch !== false,
    finalScore: currentEvaluation.score.total,
    authority: {
      critiqueLoopVersion: "1.0",
      finalSnapshotId: currentSnapshot.id,
      downstreamMustObey: [
        "accepted critique patches",
        "final rendered snapshot",
        "final evaluation",
        "preview/export parity",
        "dismissed advice memory",
        "accepted user intent",
      ],
    },
  };
}
