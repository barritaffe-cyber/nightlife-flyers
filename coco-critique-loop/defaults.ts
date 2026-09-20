import type {
  CritiqueLoopSettings,
  CritiqueMemory,
} from "./types.ts";

export const DEFAULT_CRITIQUE_SETTINGS: CritiqueLoopSettings = {
  maxIterations: 5,
  minExpectedGain: 3,
  minNetValue: 2.5,
  maxRisk: 0.35,
  plateauTolerance: 1.25,
  regressionTolerance: 0.75,
  maxRepeatedCategory: 2,
  maxRepeatedTarget: 2,
  strictness: "balanced",
  preserveUserMoves: true,
  allowAutomaticFixes: true,
  requirePreviewExportParity: true,
  stopWhenExportable: false,
};

export const EMPTY_CRITIQUE_MEMORY: CritiqueMemory = {
  acceptedFindingIds: [],
  dismissedFindingIds: [],
  acceptedCandidateIds: [],
  rejectedCandidateIds: [],
  acceptedPatchSignatures: [],
  rejectedPatchSignatures: [],
  snapshotSignatures: [],
  messageHistory: [],
  categoryCooldowns: {},
  targetCooldowns: {},
  iterationCount: 0,
};
