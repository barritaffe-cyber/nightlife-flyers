import type { CocoTarget, CocoTone } from "../types";

export type CocoTextRole = Extract<
  CocoTarget,
  | "date"
  | "details"
  | "details2"
  | "headline"
  | "headline2"
  | "leftRail"
  | "presenter"
  | "price"
  | "rightRail"
  | "subtag"
  | "venue"
>;

export type CocoRect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

export type CocoTargetRef =
  | { type: "canvas" }
  | { role: CocoTextRole; type: "text" }
  | { type: "subject" }
  | { type: "layout" }
  | { type: "palette" }
  | { type: "export" };

export type CocoCanvasPhase =
  | "arrival"
  | "export"
  | "format"
  | "idle"
  | "layout"
  | "palette"
  | "polish"
  | "post-change"
  | "subject"
  | "text";

export type CocoFindingSeverity = "blocker" | "high" | "low" | "medium";

export type CocoDesignPrinciple =
  | "alignment"
  | "balance"
  | "consistency"
  | "contrast"
  | "dominance"
  | "hierarchy"
  | "mood-fit"
  | "negative-space"
  | "proximity"
  | "rhythm"
  | "scale";

export type CocoDesignPrincipleDefinition = {
  id: CocoDesignPrinciple;
  label: string;
  question: string;
  reason: string;
};

export type CocoNightlifeStyle =
  | "afrobeats"
  | "bottle-service"
  | "brunch"
  | "edm"
  | "general-nightlife"
  | "hip-hop"
  | "house"
  | "ladies-night"
  | "latin-night"
  | "luxury-club"
  | "rnb-lounge"
  | "rooftop"
  | "techno"
  | "throwback";

export type CocoStyleProfile = {
  avoid: string[];
  composition: string[];
  effects: string[];
  energy: "calm" | "elevated" | "explosive" | "warm";
  id: CocoNightlifeStyle;
  lighting: string[];
  mood: string[];
  palette: string[];
  texture: string[];
  typography: string[];
};

export type CocoPhotoSignal = {
  brightness?: "bright" | "dark" | "mid";
  contrast?: "balanced" | "high" | "low";
  dominantHints?: string[];
  role?: "background" | "reference" | "subject";
  saturation?: "balanced" | "muted" | "vivid";
  temperature?: "cool" | "neutral" | "warm";
};

export type CocoStyleScore = {
  evidence: string[];
  score: number;
  style: CocoNightlifeStyle;
};

export type CocoStyleDecisionSource = "ai" | "fallback" | "local" | "user" | "user-needed";

export type CocoStyleDecision = {
  askUser?: boolean;
  confidence: number;
  evidence: string[];
  mood: string;
  reason: string;
  scores: CocoStyleScore[];
  source: CocoStyleDecisionSource;
  style: CocoNightlifeStyle;
};

export type CocoReadabilityMetricId =
  | "background_complexity"
  | "contrast"
  | "edge_distance"
  | "glow_interference"
  | "shadow_effectiveness"
  | "stroke_effectiveness"
  | "text_size";

export type CocoReadabilityMetric = {
  id: CocoReadabilityMetricId;
  label: string;
  observation: string;
  recommendation: string;
  score: number;
};

export type CocoTextReadability = {
  backgroundComplexity?: number | null;
  backgroundLuminance?: number | null;
  contrastRatio?: number | null;
  metrics: CocoReadabilityMetric[];
  overallScore: number;
  textLuminance?: number | null;
  weakestMetric: CocoReadabilityMetric;
};

export type CocoAlignmentMetricId =
  | "baseline_consistency"
  | "edge_alignment"
  | "group_alignment"
  | "information_grouping"
  | "optical_center"
  | "spacing_consistency"
  | "subject_balance"
  | "visual_alignment";

export type CocoActionId =
  | "check-spacing"
  | "continue"
  | "fix-it"
  | "fix-alignment"
  | "fix-balance"
  | "fix-readability"
  | "fix-rhythm"
  | "fix-subject-placement"
  | "fix-text-margin"
  | "improve-contrast"
  | "keep-editing"
  | "make-nightlife-impact"
  | "open-subject-panel"
  | "open-text-panel"
  | "rebalance-date"
  | "tighten-headline"
  | "rescan";

export type CocoAction = {
  id: CocoActionId;
  label: string;
  meta?: Record<string, unknown>;
  target?: CocoTargetRef;
};

export type CocoSolutionScore = {
  confidence: number;
  disruption: number;
  finalScore: number;
  improvement: number;
  risk: number;
  styleFit: number;
};

export type CocoSolutionCandidate = {
  action: CocoAction;
  explanation: string;
  id: string;
  predictedOutcome: string;
  recommendation: string;
  score?: CocoSolutionScore;
};

export type CocoFinding = {
  actions?: CocoAction[];
  confidence: number;
  evidence?: Record<string, unknown>;
  id: string;
  intent: string;
  observation: string;
  principle: CocoDesignPrinciple;
  reason: string;
  recommendation: string;
  ruleId: string;
  severity: CocoFindingSeverity;
  solutions?: CocoSolutionCandidate[];
  styleContext?: CocoNightlifeStyle;
  target: CocoTargetRef;
};

export type CocoRule = {
  evaluate: (snapshot: CocoCanvasSnapshot) => CocoFinding[];
  id: string;
};

export type CocoCanvasTextNode = {
  fontFamily?: string | null;
  fontSize?: number | null;
  fontWeight?: number | string | null;
  letterSpacing?: number | null;
  lineHeight?: number | null;
  opticalCenter?: { x: number; y: number } | null;
  priority?: number;
  readability?: CocoTextReadability | null;
  rect: CocoRect;
  role: CocoTextRole;
  rotation?: number | null;
  strokeWidth?: number | null;
  text?: string;
  textAlign?: string | null;
  textColor?: string | null;
  textShadow?: string | null;
  visualRect?: CocoRect | null;
};

export type CocoCanvasSubjectIssue = {
  overlapRatio?: number | null;
  overlapRole?: CocoTextRole | null;
  rect?: CocoRect | null;
  suggestion?: string | null;
  type: "hero-combo" | "off-canvas" | "text-overlap" | "too-large" | "too-small" | null;
};

export type CocoCanvasFieldState = {
  changed?: boolean;
  layoutIssue?: "overflow" | "overlap" | "subject-overlap" | null;
  overlapRole?: CocoTextRole | null;
  role?: CocoTextRole | null;
  settled?: boolean;
};

export type CocoCanvasPostChangeState = {
  hasIssue: boolean;
  target: CocoTargetRef;
};

export type CocoCanvasSnapshot = {
  activeTarget: CocoTargetRef;
  artboardRect?: CocoRect | null;
  field?: CocoCanvasFieldState | null;
  format: "square" | "story";
  hasSubject: boolean;
  headlineText?: string | null;
  isMobile?: boolean;
  nightlifeStyle: CocoNightlifeStyle;
  phase: CocoCanvasPhase;
  postChange?: CocoCanvasPostChangeState | null;
  subjectIssue?: CocoCanvasSubjectIssue | null;
  templateId?: string | null;
  textNodes: CocoCanvasTextNode[];
  tone: CocoTone;
  userIsDragging?: boolean;
};

export type CocoMemorySnapshot = {
  acceptedFindingIds: readonly string[];
  cooldownMs: number;
  dismissedFindingIds: readonly string[];
  lastShownAtByFindingId: Readonly<Record<string, number>>;
  now: number;
};

export type CocoJudgmentMode = "director" | "nudge" | "quiet";

export type CocoJudgment = {
  actions: CocoAction[];
  confidence: number;
  finding: CocoFinding | null;
  intent: string | null;
  mode: CocoJudgmentMode;
  selectedSolution?: CocoSolutionCandidate | null;
  severity: CocoFindingSeverity | null;
  target: CocoTargetRef | null;
};
