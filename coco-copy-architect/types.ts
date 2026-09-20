export type CopyRole =
  | "identity"
  | "emotion"
  | "experience"
  | "music"
  | "offer"
  | "logistics"
  | "venue"
  | "presenter"
  | "badge"
  | "footer"
  | "social"
  | "age"
  | "sponsor";

export type CopyTreatment =
  | "hero"
  | "accent"
  | "metadata"
  | "microcopy"
  | "footer"
  | "badge"
  | "rail"
  | "merge"
  | "mute"
  | "hide";

export type CopyCase = "preserve" | "uppercase" | "titlecase" | "sentence";
export type CopyDensity = "minimal" | "low" | "medium" | "dense";
export type CopyTone =
  | "luxury"
  | "editorial"
  | "energetic"
  | "playful"
  | "romantic"
  | "sensual"
  | "underground"
  | "retro"
  | "clean"
  | "premium-lifestyle"
  | "general-nightlife";

export type CopySource =
  | "name"
  | "headline"
  | "accent"
  | "details"
  | "details2"
  | "presenter"
  | "date"
  | "time"
  | "venue"
  | "address"
  | "price"
  | "callToAction"
  | "ageRestriction"
  | "social"
  | "sponsors"
  | "custom";

export type EventCopyInput = Partial<Record<CopySource, string>> & {
  name: string;
};

export type SceneLike = {
  confidence?: number;
  creativeDecisions?: {
    story?: string;
    marketingIntent?: string;
    hero?: { type?: string };
    densityPolicy?: {
      policy?: string;
      maxVisibleGroups?: number;
      maxBodyLines?: number;
      mergeSecondaryCopy?: boolean;
      hideLowPriorityCopy?: boolean;
    };
  };
};

export type CreativeDirectionLike = {
  posterIdentity?: string;
  posterDNA?: string;
  marketingGoal?: string;
  emotionalGoal?: string;
  informationDensity?: CopyDensity;
  copyArchitecture?: Array<{
    id?: string;
    role?: CopyRole;
    sources?: string[];
    treatment?: CopyTreatment;
    priority?: number;
    maxLines?: number;
    mergeWith?: string;
    hideWhenEmpty?: boolean;
  }>;
  hierarchy?: {
    headlinePower?: number;
    accentMaxRatio?: number;
    bodyMaxRatio?: number;
    dateMaxRatio?: number;
    venueMaxRatio?: number;
    badgeMaxRatio?: number;
    presenterMaxRatio?: number;
  };
  constraints?: Array<{
    id: string;
    severity?: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
};

export type CopyArchitectInput = {
  event: EventCopyInput;
  scene?: SceneLike | null;
  creativeDirection?: CreativeDirectionLike | null;
  locale?: string;
  userPreferences?: Partial<{
    preserveOriginalCopy: boolean;
    allowRewriting: boolean;
    allowHiding: boolean;
    keepPresenter: boolean;
    keepPrice: boolean;
    keepAddress: boolean;
    maxVisibleGroups: number;
    preferredTone: CopyTone;
    forbiddenWords: string[];
  }>;
  learning?: Partial<{
    acceptedPatterns: string[];
    rejectedPatterns: string[];
    preferredBodyStyle: "bullets" | "single-line" | "two-line" | "stacked";
  }>;
  debug?: boolean;
};

export type NormalizedCopyField = {
  source: CopySource;
  raw: string;
  text: string;
  empty: boolean;
  words: string[];
  lines: string[];
  characterCount: number;
  wordCount: number;
  confidence: number;
  semanticTags: string[];
  duplicateOf?: CopySource;
};

export type CopyFact = {
  id: string;
  category:
    | "identity"
    | "mood"
    | "music"
    | "experience"
    | "offer"
    | "date"
    | "time"
    | "venue"
    | "address"
    | "price"
    | "presenter"
    | "age"
    | "social"
    | "sponsor"
    | "call-to-action";
  text: string;
  source: CopySource;
  priority: number;
  confidence: number;
  optional: boolean;
};

export type CopyGroup = {
  id: string;
  role: CopyRole;
  treatment: CopyTreatment;
  sources: CopySource[];
  facts: string[];
  text: string;
  case: CopyCase;
  priority: 1 | 2 | 3 | 4 | 5;
  maxLines: number;
  maxCharactersPerLine: number;
  maxWords: number;
  powerRatio: number;
  spacingBefore: number;
  spacingAfter: number;
  mergePolicy: "none" | "merge-same-role" | "merge-secondary" | "collapse";
  hiddenReason?: string;
  reasoning: string[];
};

export type CopyArchitecturePattern =
  | "identity-emotion-metadata-logistics"
  | "identity-experience-logistics"
  | "identity-music-offer-logistics"
  | "identity-date-venue"
  | "identity-product-logistics"
  | "identity-artist-logistics"
  | "minimal-editorial"
  | "dense-club"
  | "split-information"
  | "footer-heavy";

export type CopyArchitectureCandidate = {
  id: string;
  name: string;
  pattern: CopyArchitecturePattern;
  tone: CopyTone;
  density: CopyDensity;
  groups: CopyGroup[];
  score: CopyArchitectureScore;
  reasoning: string[];
  warnings: string[];
};

export type CopyArchitectureScore = {
  clarity: number;
  hierarchy: number;
  densityControl: number;
  rhythm: number;
  premiumPotential: number;
  marketingFit: number;
  sceneFit: number;
  completeness: number;
  redundancyControl: number;
  renderability: number;
  total: number;
};

export type CopyArchitectResult = {
  winner: CopyArchitectureCandidate;
  finalists: CopyArchitectureCandidate[];
  candidates: CopyArchitectureCandidate[];
  rejected: Array<{ id: string; reason: string }>;
  normalized: NormalizedCopyField[];
  facts: CopyFact[];
  authority: {
    architectureId: string;
    ownsSources: CopySource[];
    hiddenSources: CopySource[];
    mergedSources: CopySource[];
    downstreamMustObey: string[];
  };
  trace: Array<{
    stage: string;
    decision: string;
    confidence: number;
    evidence: string[];
  }>;
};

export type CopyRenderItem = {
  id: string;
  role: CopyRole;
  treatment: CopyTreatment;
  text: string;
  case: CopyCase;
  priority: number;
  maxLines: number;
  powerRatio: number;
  spacingBefore: number;
  spacingAfter: number;
  sources: CopySource[];
};

export type CopyRenderModel = {
  id: string;
  pattern: CopyArchitecturePattern;
  tone: CopyTone;
  density: CopyDensity;
  owns: CopySource[];
  items: CopyRenderItem[];
};

export type RenderedCopySnapshot = {
  renderedSources: CopySource[];
  renderedTexts: string[];
  roleLineCounts: Partial<Record<CopyRole, number>>;
  rolePowerRatios: Partial<Record<CopyRole, number>>;
  visibleGroups: number;
  duplicateTexts: string[];
  previewExportMatch: boolean;
};

export type CopyComplianceResult = {
  pass: boolean;
  blockers: string[];
  warnings: string[];
  score: number;
};
