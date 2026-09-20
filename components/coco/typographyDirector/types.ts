import type { CocoNightlifeStyle } from "../intelligence";
import type { CocoMoodProfile } from "../moodDirector";

export type TypePersonality =
  | "afrobeats"
  | "aggressive"
  | "editorial"
  | "elegant"
  | "festival"
  | "latin"
  | "luxury"
  | "minimal"
  | "nightclub"
  | "throwback";

export type TypographyTreatment =
  | "chrome"
  | "clean"
  | "distressed"
  | "glass"
  | "glow"
  | "serifLuxury";

export type TypographyTransform = "lowercase" | "titlecase" | "uppercase";

export type CocoTypographyFormat = "square" | "story";
export type CocoTypographyLayoutId = "subject-center" | "subject-left" | "subject-right";

export type CocoTypographyRect = {
  align?: "center" | "left" | "right";
  height: number;
  width: number;
  x: number;
  y: number;
};

export type CocoTypographyZones = {
  date?: CocoTypographyRect;
  headline: CocoTypographyRect;
  leftInfo?: CocoTypographyRect;
  presenter?: CocoTypographyRect;
  price?: CocoTypographyRect;
  rightInfo?: CocoTypographyRect;
  script?: CocoTypographyRect;
  subtag?: CocoTypographyRect;
  venue?: CocoTypographyRect;
};

export type CocoTypographyText = Partial<{
  date: string;
  details: string;
  details2: string;
  headline: string;
  presenter: string;
  price: string;
  script: string;
  subtag: string;
  venue: string;
}>;

export type CocoTypographyCompositionSystem = {
  hierarchy: {
    headlinePowerMin: number;
    accentPowerMaxRatio: number;
    bodyPowerMaxRatio: number;
    metadataPowerMaxRatio: number;
  };
  gates?: {
    headlineOverScriptMin: number;
    headlineOverBodyMin: number;
    scriptMaxHeadlineRatio: number;
    detailsMaxHeadlineRatio: number;
    venueMaxHeadlineRatio: number;
  };
  blocks?: Array<{
    role:
      | "headline"
      | "accent"
      | "primaryMeta"
      | "secondaryMeta"
      | "dateTime"
      | "venue"
      | "footer"
      | "badge";
    maxVisualPower?: number;
    minVisualPower?: number;
  }>;
};

export type CocoTypographyAvailableFonts = {
  body: string[];
  body2?: string[];
  headline: string[];
  headline2: string[];
  subtag?: string[];
  utility?: string[];
  venue?: string[];
};

export type CocoTypographyFallbackFonts = {
  body: string;
  body2?: string;
  headline: string;
  headline2: string;
  presenter?: string;
  subtag?: string;
  utility?: string;
  venue?: string;
};

export type FontProfile = {
  aggression: number;
  avoidFor: string[];
  bestFor: string[];
  elegance: number;
  energy: number;
  family: string;
  luxury: number;
  personalities: TypePersonality[];
  readability: number;
};

export type TypographyLayerDecision = {
  fontFamily: string;
  letterSpacing: number;
  lineHeight: number;
  sizeScale: number;
  text?: string;
  transform?: TypographyTransform;
  weight: number;
};

export type TypographyHeadlineDecision = TypographyLayerDecision & {
  glow: number;
  shadow: number;
  strokeWidth: number;
  treatment: TypographyTreatment;
};

export type TypographyScores = {
  elegance: number;
  eventMatch: number;
  fontPersonalityMatch: number;
  hierarchy: number;
  lineBreakQuality: number;
  photographyMatch: number;
  premiumFeel: number;
  readability: number;
  rhythm: number;
  total: number;
  treatmentRestraint: number;
  zoneFit: number;
};

export type TypographyCandidate = {
  date: TypographyLayerDecision;
  details: TypographyLayerDecision;
  details2: TypographyLayerDecision;
  headline: TypographyHeadlineDecision;
  metadata: {
    mood: string;
    personality: TypePersonality;
  };
  presenter: TypographyLayerDecision;
  price: TypographyLayerDecision;
  scores?: TypographyScores;
  subheadline: TypographyLayerDecision;
  subtag: TypographyLayerDecision;
  venue: TypographyLayerDecision;
};

export type CocoTypographyDecision = TypographyCandidate & {
  scores: TypographyScores;
};

export type CocoTypographySnapshot = {
  availableFonts: CocoTypographyAvailableFonts;
  composition?: CocoTypographyCompositionSystem;
  eventName: string;
  fallbackFonts?: CocoTypographyFallbackFonts;
  format: CocoTypographyFormat;
  layoutId: CocoTypographyLayoutId;
  moodProfile?: CocoMoodProfile | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoMood?: {
    brightness?: "bright" | "dark" | "mid";
    contrast?: "balanced" | "high" | "low";
    saturation?: "balanced" | "muted" | "vivid";
  } | null;
  text: CocoTypographyText;
  zones: CocoTypographyZones;
};
