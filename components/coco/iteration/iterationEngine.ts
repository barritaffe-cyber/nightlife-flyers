import type {
  CocoDesignCritique,
  CocoImprovementCandidate,
  CocoIterationInput,
  CocoIterationResult,
  CocoIterationState,
} from "./types";
import { critiqueCocoDesign } from "./critiqueEngine.ts";
import { generateCocoImprovements } from "./improvementGenerator.ts";
import { predictCocoImprovement } from "./predictionEngine.ts";
import { applyCocoDesignPatch, cloneStack } from "./patch.ts";

export function runCocoDesignIteration(
  input: CocoIterationInput,
  options: {
    maxCandidatesPerIteration?: number;
    maxIterations?: number;
    minGain?: number;
  } = {}
): CocoIterationResult {
  const maxIterations = options.maxIterations ?? 5;
  const maxCandidatesPerIteration = options.maxCandidatesPerIteration ?? 5;
  const minGain = options.minGain ?? 2;
  let state: CocoIterationState = {
    badgePatch: null,
    stack: cloneStack(input.stack),
  };
  const applied: CocoIterationResult["applied"] = [];
  let evaluatedCandidates = 0;
  let stopReason: NonNullable<CocoIterationResult["debug"]>["stopReason"] = "max-iterations";
  let critiques = critiqueCocoDesign({ ...input, ...state });

  for (let i = 0; i < maxIterations; i += 1) {
    if (!critiques.length) {
      stopReason = "no-critiques";
      break;
    }

    const improvementPool = buildImprovementPool(
      { ...input, ...state },
      critiques,
      maxCandidatesPerIteration
    );
    if (!improvementPool.length) {
      stopReason = "no-candidates";
      break;
    }

    const predictions = improvementPool
      .map(({ candidate, critique }) => ({
        candidate,
        critique,
        prediction: predictCocoImprovement({ ...input, ...state }, critique, candidate),
      }))
      .sort((a, b) => b.prediction.expectedGain - a.prediction.expectedGain);
    evaluatedCandidates += predictions.length;

    const winner = predictions[0];
    if (!winner || winner.prediction.expectedGain < minGain) {
      stopReason = "below-threshold";
      break;
    }

    state = applyCocoDesignPatch(state, winner.candidate.patch);

    applied.push({
      critique: winner.critique,
      improvement: winner.candidate,
      prediction: winner.prediction,
    });

    critiques = critiqueCocoDesign({
      ...input,
      ...state,
    });
  }

  return {
    stack: state.stack,
    badgePatch: state.badgePatch ?? null,
    applied,
    critiques,
    debug: {
      evaluatedCandidates,
      iterations: applied.length,
      stopReason,
    },
  };
}

function buildImprovementPool(
  input: CocoIterationInput & CocoIterationState,
  critiques: CocoDesignCritique[],
  maxCandidates: number
): Array<{
  candidate: CocoImprovementCandidate;
  critique: CocoDesignCritique;
}> {
  const pool: Array<{
    candidate: CocoImprovementCandidate;
    critique: CocoDesignCritique;
  }> = [];
  const seen = new Set<string>();

  for (const critique of critiques) {
    const candidates = generateCocoImprovements(input, critique);

    for (const candidate of candidates) {
      pushUniqueCandidate(pool, seen, candidate, critique);
      if (pool.length >= maxCandidates) return pool;
    }
  }

  const fallbackCritique = critiques[0];
  if (!fallbackCritique) return pool;

  for (const candidate of generateFallbackCandidates(input, fallbackCritique)) {
    pushUniqueCandidate(pool, seen, candidate, fallbackCritique);
    if (pool.length >= maxCandidates) return pool;
  }

  return pool;
}

function pushUniqueCandidate(
  pool: Array<{
    candidate: CocoImprovementCandidate;
    critique: CocoDesignCritique;
  }>,
  seen: Set<string>,
  candidate: CocoImprovementCandidate,
  critique: CocoDesignCritique
) {
  const key = `${candidate.action}:${JSON.stringify(candidate.patch)}`;
  if (seen.has(key)) return;
  seen.add(key);
  pool.push({ candidate, critique });
}

function generateFallbackCandidates(
  input: CocoIterationInput & CocoIterationState,
  critique: CocoDesignCritique
): CocoImprovementCandidate[] {
  const stackCenter = input.stack.rect.x + input.stack.rect.width / 2;
  const subjectCenter = input.subjectZone
    ? input.subjectZone.x + input.subjectZone.width / 2
    : null;
  const stackTowardSubject =
    subjectCenter == null ? 0 : Math.max(-2.5, Math.min(2.5, (subjectCenter - stackCenter) * 0.1));
  const inwardOffset =
    input.stack.rect.x < 8
      ? 2
      : input.stack.rect.x + input.stack.rect.width > 92
      ? -2
      : 0;

  const candidates: CocoImprovementCandidate[] = [
    {
      id: "fallback-stack-toward-subject",
      action: "moveStack",
      critiqueId: critique.id,
      description: "Try a small stack move toward the subject.",
      patch: {
        stackOffsetX: stackTowardSubject,
      },
    },
    {
      id: "fallback-quiet-metadata",
      action: "reduceMetadataWeight",
      critiqueId: critique.id,
      description: "Try quieter metadata for more premium hierarchy.",
      patch: {
        metadataScale: 0.9,
      },
    },
    {
      id: "fallback-quiet-badge",
      action: "quietBadge",
      critiqueId: critique.id,
      description: "Try reducing the badge so it does not steal attention.",
      patch: {
        badgeScale: 0.82,
      },
    },
    {
      id: "fallback-breathing-room",
      action: "increaseBreathingRoom",
      critiqueId: critique.id,
      description: "Try a small inward move for cleaner margins.",
      patch: {
        stackOffsetX: inwardOffset,
      },
    },
    {
      id: "fallback-headline-authority",
      action: "scaleHeadline",
      critiqueId: critique.id,
      description: "Try a slight headline authority increase.",
      patch: {
        headlineScale: 1.03,
      },
    },
  ];

  return candidates.filter((candidate) =>
    Object.values(candidate.patch).some((value) => typeof value !== "number" || Math.abs(value) > 0.001)
  );
}
