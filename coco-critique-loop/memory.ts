import type {
  CritiqueCategory,
  CritiqueFinding,
  CritiqueMemory,
  DesignPatch,
} from "./types.ts";
import { EMPTY_CRITIQUE_MEMORY } from "./defaults.ts";
import { patchSignature, snapshotSignature } from "./signatures.ts";
import { unique } from "./utils.ts";

export function createCritiqueMemory(
  partial?: Partial<CritiqueMemory>
): CritiqueMemory {
  return {
    ...EMPTY_CRITIQUE_MEMORY,
    ...partial,
    acceptedFindingIds: [...(partial?.acceptedFindingIds ?? [])],
    dismissedFindingIds: [...(partial?.dismissedFindingIds ?? [])],
    acceptedCandidateIds: [...(partial?.acceptedCandidateIds ?? [])],
    rejectedCandidateIds: [...(partial?.rejectedCandidateIds ?? [])],
    acceptedPatchSignatures: [...(partial?.acceptedPatchSignatures ?? [])],
    rejectedPatchSignatures: [...(partial?.rejectedPatchSignatures ?? [])],
    snapshotSignatures: [...(partial?.snapshotSignatures ?? [])],
    messageHistory: [...(partial?.messageHistory ?? [])],
    categoryCooldowns: { ...(partial?.categoryCooldowns ?? {}) },
    targetCooldowns: { ...(partial?.targetCooldowns ?? {}) },
    iterationCount: partial?.iterationCount ?? 0,
  };
}

export function rememberAcceptedFinding(
  memory: CritiqueMemory,
  finding: CritiqueFinding
): CritiqueMemory {
  return {
    ...memory,
    acceptedFindingIds: unique([...memory.acceptedFindingIds, finding.id]),
  };
}

export function rememberDismissedFinding(
  memory: CritiqueMemory,
  finding: CritiqueFinding
): CritiqueMemory {
  return {
    ...memory,
    dismissedFindingIds: unique([...memory.dismissedFindingIds, finding.id]),
  };
}

export function rememberAcceptedCandidate(
  memory: CritiqueMemory,
  candidateId: string,
  patches: DesignPatch[],
  snapshotId: string
): CritiqueMemory {
  return {
    ...memory,
    acceptedCandidateIds: unique([...memory.acceptedCandidateIds, candidateId]),
    acceptedPatchSignatures: unique([
      ...memory.acceptedPatchSignatures,
      ...patches.map(patchSignature),
    ]),
    snapshotSignatures: unique([
      ...memory.snapshotSignatures,
      snapshotId,
    ]),
  };
}

export function rememberRejectedCandidate(
  memory: CritiqueMemory,
  candidateId: string,
  patches: DesignPatch[]
): CritiqueMemory {
  return {
    ...memory,
    rejectedCandidateIds: unique([...memory.rejectedCandidateIds, candidateId]),
    rejectedPatchSignatures: unique([
      ...memory.rejectedPatchSignatures,
      ...patches.map(patchSignature),
    ]),
  };
}

export function incrementCooldowns(
  memory: CritiqueMemory,
  category: CritiqueCategory,
  targetIds: string[]
): CritiqueMemory {
  const categoryCooldowns = { ...memory.categoryCooldowns };
  categoryCooldowns[category] = (categoryCooldowns[category] ?? 0) + 1;

  const targetCooldowns = { ...memory.targetCooldowns };
  for (const targetId of targetIds) {
    targetCooldowns[targetId] = (targetCooldowns[targetId] ?? 0) + 1;
  }

  return {
    ...memory,
    categoryCooldowns,
    targetCooldowns,
  };
}

export function decayCooldowns(memory: CritiqueMemory): CritiqueMemory {
  const categoryCooldowns: CritiqueMemory["categoryCooldowns"] = Object.fromEntries(
    Object.entries(memory.categoryCooldowns)
      .map(([key, value]) => [key, Math.max(0, (value ?? 0) - 1)] as const)
      .filter(([, value]) => value > 0)
  );

  const targetCooldowns: CritiqueMemory["targetCooldowns"] = Object.fromEntries(
    Object.entries(memory.targetCooldowns)
      .map(([key, value]) => [key, Math.max(0, value - 1)] as const)
      .filter(([, value]) => value > 0)
  );

  return {
    ...memory,
    categoryCooldowns,
    targetCooldowns,
  };
}
