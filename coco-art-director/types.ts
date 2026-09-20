export type ArtDirectorCategory =
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
export type Confidence = number;

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SceneLike = {
  confidence?: number;
  creativeDecisions?: {
    story?: string;
    marketingIntent?: string;
    hero?: { type?: string; id?: string; confidence?: number };
    composition?: {
      typeField?: string;
      preferredPattern?: string;
      stackAlignment?: string;
      stackRect?: Rect;
      overlapPolicy?: string;
    };
    hierarchy?: Record<string, number>;
    densityPolicy?: { policy?: string; maxVisibleGroups?: number; maxBodyLines?: number };
    effectPolicy?: { policy?: string };
    colorStory?: { id?: string };
  };
  protectionZones?: Array<{
    target: string;
    rect: Rect;
    importance: string;
    allowOverlapRatio: number;
  }>;
  constraints?: Array<{
    id: string;
    hard?: boolean;
    weight: number;
    reason: string;
    parameters?: Record<string, unknown>;
  }>;
};

export type CreativeDirectionLike = {
  id?: string;
  posterIdentity?: string;
  posterDNA?: string;
  marketingGoal?: string;
  emotionalGoal?: string;
  visualEnergy?: string;
  creativeRisk?: string;
  informationDensity?: string;
  composition?: {
    family?: string;
    typeField?: string;
    alignment?: string;
    stackRect?: Rect;
    overlapPolicy?: string;
    oneColumn?: boolean;
  };
  hierarchy?: {
    headlinePower?: number;
    accentMaxRatio?: number;
    bodyMaxRatio?: number;
    dateMaxRatio?: number;
    venueMaxRatio?: number;
    badgeMaxRatio?: number;
    presenterMaxRatio?: number;
    headlineMustWinBy?: number;
  };
  effects?: {
    policy?: string;
  };
  signatureMove?: {
    move?: string;
    target?: string;
    intensity?: string;
  };
  constraints?: Array<{
    id: string;
    severity?: string;
    weight: number;
    description: string;
    parameters?: Record<string, unknown>;
  }>;
};

export type CompositionLike = {
  id?: string;
  family?: string;
  alignment?: string;
  typeField?: string;
  stackRect?: Rect;
  subjectRect?: Rect;
  faceRect?: Rect;
  badgeRect?: Rect;
  blocks?: Array<{
    id: string;
    role: string;
    rect: Rect;
    visualPower?: number;
    alignment?: string;
  }>;
  score?: Record<string, number>;
};

export type CopyArchitectureLike = {
  id?: string;
  groups: Array<{
    id: string;
    role: string;
    treatment: string;
    text: string;
    maxLines?: number;
    powerRatio?: number;
    sources?: string[];
  }>;
};

export type TypographyLike = {
  id?: string;
  fontFamilies?: string[];
  maxFontFamilies?: number;
  headline?: TypographyRoleLike;
  accent?: TypographyRoleLike;
  metadata?: TypographyRoleLike;
  dateTime?: TypographyRoleLike;
  venue?: TypographyRoleLike;
  badge?: TypographyRoleLike;
  presenter?: TypographyRoleLike;
  footer?: TypographyRoleLike;
  hierarchy?: Record<string, number>;
  signatureMove?: { id?: string; target?: string };
};

export type TypographyRoleLike = {
  role?: string;
  text?: string;
  fontFamily?: string;
  sizeScale?: number;
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  visualPower?: number;
  maxLines?: number;
  align?: string;
  offsetX?: number;
  offsetY?: number;
  rotationDeg?: number;
  effects?: {
    glow?: number;
    shadow?: number;
    stroke?: number;
    blur?: number;
    opacity?: number;
  };
};

export type ColorLike = {
  id?: string;
  policy?: string;
  strongColors?: string[];
  roles?: Array<{
    role: string;
    color: string;
    contrastRatio?: number;
    importance?: string;
  }>;
  colorCast?: {
    enabled?: boolean;
    color?: string;
    strength?: number;
    blendMode?: string;
  };
};

export type EffectsLike = {
  id?: string;
  policy?: string;
  oneSignatureEffect?: boolean;
  roles?: Array<{
    role: string;
    glow?: number;
    shadow?: number;
    stroke?: number;
    blur?: number;
    texture?: number;
    opacity?: number;
  }>;
};

export type RenderedElementSnapshot = {
  id: string;
  role: string;
  rect: Rect;
  text?: string;
  visible: boolean;
  opacity: number;
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

export type RenderedFlyerSnapshot = {
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
  screenshotId?: string;
};

export type ArtDirectorInput = {
  scene?: SceneLike | null;
  creativeDirection?: CreativeDirectionLike | null;
  composition?: CompositionLike | null;
  copyArchitecture?: CopyArchitectureLike | null;
  typography?: TypographyLike | null;
  color?: ColorLike | null;
  effects?: EffectsLike | null;
  renderedSnapshot: RenderedFlyerSnapshot;
  userPreferences?: Partial<{
    strictness: "relaxed" | "balanced" | "strict";
    minimumExportScore: number;
    preserveUserMoves: boolean;
    allowAutomaticFixes: boolean;
    maxIterations: number;
    minExpectedGain: number;
  }>;
  learning?: Partial<{
    dismissedFindingIds: string[];
    acceptedFindingIds: string[];
    acceptedImprovementIds: string[];
    rejectedImprovementIds: string[];
  }>;
  debug?: boolean;
};

export type ArtDirectorFinding = {
  id: string;
  category: ArtDirectorCategory;
  severity: Severity;
  confidence: Confidence;
  observation: string;
  cause: string;
  evidence: string[];
  targetIds: string[];
  contractIds: string[];
  scorePenalty: number;
  blocker: boolean;
  userFacingMessage: string;
};

export type ArtDirectorScore = {
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

export type ImprovementAction =
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
  | "changeSignatureMove";

export type DesignPatch = {
  targetId: string;
  action: ImprovementAction;
  values: Record<string, string | number | boolean>;
};

export type ImprovementCandidate = {
  id: string;
  findingId: string;
  category: ArtDirectorCategory;
  description: string;
  patches: DesignPatch[];
  expectedGain: number;
  risk: number;
  implementationCost: number;
  confidence: number;
  reason: string;
};

export type ImprovementPrediction = {
  candidateId: string;
  expectedGain: number;
  risk: number;
  confidence: number;
  sideEffects: string[];
  netValue: number;
  reason: string;
};

export type ArtDirectorIteration = {
  index: number;
  scoreBefore: ArtDirectorScore;
  strongestFinding: ArtDirectorFinding;
  candidates: ImprovementCandidate[];
  winner?: ImprovementCandidate;
  prediction?: ImprovementPrediction;
  simulatedScoreAfter?: ArtDirectorScore;
  stopped: boolean;
  stopReason?: string;
};

export type ExportDecision = {
  allowed: boolean;
  score: number;
  blockers: ArtDirectorFinding[];
  warnings: ArtDirectorFinding[];
  message: string;
};

export type ArtDirectorResult = {
  finalScore: ArtDirectorScore;
  initialScore: ArtDirectorScore;
  findings: ArtDirectorFinding[];
  strongestFinding?: ArtDirectorFinding;
  iterations: ArtDirectorIteration[];
  recommendedPatches: DesignPatch[];
  exportDecision: ExportDecision;
  authority: {
    artDirectorVersion: string;
    requiredFixes: string[];
    downstreamMustObey: string[];
  };
  trace: Array<{
    stage: string;
    decision: string;
    confidence: number;
    evidence: string[];
  }>;
};
