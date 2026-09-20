export type CritiqueCategory =
  | "hierarchy"
  | "readability"
  | "composition"
  | "balance"
  | "rhythm"
  | "spacing"
  | "alignment"
  | "typography"
  | "copy"
  | "color"
  | "contrast"
  | "effects"
  | "sceneInteraction"
  | "subjectProtection"
  | "informationDensity"
  | "premiumPolish"
  | "originality"
  | "brandFit"
  | "marketingClarity"
  | "exportIntegrity";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CritiqueFinding = {
  id: string;
  category: CritiqueCategory;
  severity: Severity;
  confidence: number;
  observation: string;
  cause: string;
  evidence: string[];
  targetIds: string[];
  contractIds: string[];
  scorePenalty: number;
  blocker: boolean;
  userFacingMessage: string;
};

export type CritiqueScore = {
  hierarchy: number;
  readability: number;
  composition: number;
  balance: number;
  rhythm: number;
  spacing: number;
  alignment: number;
  typography: number;
  copy: number;
  color: number;
  contrast: number;
  effects: number;
  sceneInteraction: number;
  subjectProtection: number;
  informationDensity: number;
  premiumPolish: number;
  originality: number;
  brandFit: number;
  marketingClarity: number;
  exportIntegrity: number;
  total: number;
};

export type DesignPatchAction =
  | "move"
  | "scale"
  | "rotate"
  | "restyle"
  | "recolor"
  | "reorder"
  | "mergeCopy"
  | "hide"
  | "show"
  | "reduceEffects"
  | "increaseContrast"
  | "align"
  | "tightenSpacing"
  | "increaseSpacing"
  | "protectSubject"
  | "changeFont"
  | "changeLineBreak"
  | "changeHierarchy"
  | "changeSignatureMove"
  | "changeOpacity"
  | "changeTracking"
  | "changeLineHeight"
  | "changeWeight"
  | "changeCase";

export type DesignPatch = {
  id: string;
  targetId: string;
  action: DesignPatchAction;
  values: Record<string, string | number | boolean>;
  reversible: boolean;
  sourceFindingId: string;
};

export type CritiqueCandidate = {
  id: string;
  findingId: string;
  category: CritiqueCategory;
  description: string;
  patches: DesignPatch[];
  expectedGain: number;
  estimatedRisk: number;
  implementationCost: number;
  confidence: number;
  preservesUserIntent: boolean;
  touchesProtectedRegion: boolean;
  reason: string;
};

export type CandidatePrediction = {
  candidateId: string;
  expectedGain: number;
  risk: number;
  confidence: number;
  netValue: number;
  affectedCategories: Partial<Record<CritiqueCategory, number>>;
  sideEffects: string[];
  regressionRisks: string[];
  reason: string;
};

export type RenderedElementSnapshot = {
  id: string;
  role: string;
  rect: Rect;
  visible: boolean;
  opacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  tracking?: number;
  lineHeight?: number;
  lineCount?: number;
  align?: string;
  rotationDeg?: number;
  color?: string;
  backgroundColor?: string;
  contrastRatio?: number;
  visualPower?: number;
  zIndex?: number;
  effects?: {
    glow?: number;
    shadow?: number;
    stroke?: number;
    blur?: number;
    texture?: number;
  };
};

export type RenderedSnapshot = {
  id: string;
  width: number;
  height: number;
  format: "square" | "story";
  elements: RenderedElementSnapshot[];
  subjectRect?: Rect;
  faceRect?: Rect;
  gazeRect?: Rect;
  productRects?: Rect[];
  imageMetrics?: {
    luminance?: number;
    contrast?: number;
    saturation?: number;
    visualNoise?: number;
    edgeDensity?: number;
    saliencyCenter?: { x: number; y: number };
  };
  globalMetrics?: {
    visibleGroupCount?: number;
    uniqueFontCount?: number;
    strongColorCount?: number;
    previewExportMatch?: boolean;
    exportClipped?: boolean;
    safeMarginViolations?: number;
  };
  signature?: string;
};

export type CritiqueEvaluation = {
  score: CritiqueScore;
  findings: CritiqueFinding[];
  strongestFinding?: CritiqueFinding;
  exportAllowed: boolean;
};

export type CritiqueMemory = {
  acceptedFindingIds: string[];
  dismissedFindingIds: string[];
  acceptedCandidateIds: string[];
  rejectedCandidateIds: string[];
  acceptedPatchSignatures: string[];
  rejectedPatchSignatures: string[];
  snapshotSignatures: string[];
  messageHistory: string[];
  categoryCooldowns: Partial<Record<CritiqueCategory, number>>;
  targetCooldowns: Record<string, number>;
  iterationCount: number;
};

export type CritiqueLoopSettings = {
  maxIterations: number;
  minExpectedGain: number;
  minNetValue: number;
  maxRisk: number;
  plateauTolerance: number;
  regressionTolerance: number;
  maxRepeatedCategory: number;
  maxRepeatedTarget: number;
  strictness: "relaxed" | "balanced" | "strict";
  preserveUserMoves: boolean;
  allowAutomaticFixes: boolean;
  requirePreviewExportParity: boolean;
  stopWhenExportable: boolean;
};

export type CritiqueAdapters = {
  applyPatches: (
    snapshot: RenderedSnapshot,
    patches: DesignPatch[]
  ) => Promise<RenderedSnapshot> | RenderedSnapshot;

  renderSnapshot: (
    snapshot: RenderedSnapshot
  ) => Promise<RenderedSnapshot> | RenderedSnapshot;

  evaluateArtwork: (
    snapshot: RenderedSnapshot
  ) => Promise<CritiqueEvaluation> | CritiqueEvaluation;
};

export type CritiqueLoopInput = {
  initialSnapshot: RenderedSnapshot;
  initialEvaluation: CritiqueEvaluation;
  settings?: Partial<CritiqueLoopSettings>;
  memory?: Partial<CritiqueMemory>;
  adapters: CritiqueAdapters;
  userPreferences?: Partial<{
    preserveTargets: string[];
    preferredCategories: CritiqueCategory[];
    forbiddenActions: DesignPatchAction[];
    silentCategories: CritiqueCategory[];
  }>;
  debug?: boolean;
};

export type CritiqueIteration = {
  index: number;
  snapshotBefore: RenderedSnapshot;
  evaluationBefore: CritiqueEvaluation;
  selectedFinding?: CritiqueFinding;
  candidates: CritiqueCandidate[];
  predictions: CandidatePrediction[];
  winner?: CritiqueCandidate;
  winningPrediction?: CandidatePrediction;
  patchesApplied: DesignPatch[];
  snapshotAfter?: RenderedSnapshot;
  evaluationAfter?: CritiqueEvaluation;
  scoreDelta?: number;
  accepted: boolean;
  rolledBack: boolean;
  stopped: boolean;
  stopReason?: string;
  userMessage?: string;
};

export type CritiqueLoopResult = {
  initialSnapshot: RenderedSnapshot;
  finalSnapshot: RenderedSnapshot;
  initialEvaluation: CritiqueEvaluation;
  finalEvaluation: CritiqueEvaluation;
  history: CritiqueIteration[];
  memory: CritiqueMemory;
  acceptedPatches: DesignPatch[];
  rejectedCandidates: Array<{
    candidateId: string;
    reason: string;
  }>;
  stoppedBecause: string;
  exportReady: boolean;
  finalScore: number;
  authority: {
    critiqueLoopVersion: string;
    finalSnapshotId: string;
    downstreamMustObey: string[];
  };
};

export type CocoCritiqueMessage = {
  findingId: string;
  tone: "encouraging" | "direct" | "urgent" | "quiet";
  headline: string;
  body: string;
  actions: Array<{
    id: string;
    label: string;
    type: "apply" | "dismiss" | "review" | "keep";
  }>;
};
