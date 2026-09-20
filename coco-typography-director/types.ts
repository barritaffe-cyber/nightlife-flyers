export type TypographyRole =
  | "headline"
  | "accent"
  | "metadata"
  | "dateTime"
  | "venue"
  | "badge"
  | "presenter"
  | "footer";

export type TypographyPersonality =
  | "condensed-editorial"
  | "luxury-serif"
  | "clean-grotesk"
  | "organic-script"
  | "humanist-lifestyle"
  | "urban-heavy"
  | "retro-display"
  | "industrial-minimal"
  | "electric-display"
  | "fashion-serif"
  | "geometric-modern"
  | "classic-sans";

export type FontCategory =
  | "display-condensed"
  | "display-wide"
  | "serif-display"
  | "script"
  | "sans"
  | "grotesk"
  | "geometric"
  | "monospace"
  | "retro"
  | "decorative"
  | "unknown";

export type FontTone =
  | "luxury"
  | "editorial"
  | "energetic"
  | "playful"
  | "romantic"
  | "industrial"
  | "retro"
  | "clean"
  | "urban"
  | "general";

export type FontSupport = {
  family: string;
  category: FontCategory;
  tones: FontTone[];
  weights: number[];
  italic: boolean;
  condensed: boolean;
  wide: boolean;
  xHeight: "low" | "medium" | "high";
  contrast: "low" | "medium" | "high";
  source?: "system" | "google" | "custom" | "unknown";
  available: boolean;
};

export type AvailableFontsInput = {
  fonts: Array<
    | string
    | {
        family: string;
        category?: FontCategory;
        tones?: FontTone[];
        weights?: number[];
        italic?: boolean;
        condensed?: boolean;
        wide?: boolean;
        xHeight?: "low" | "medium" | "high";
        contrast?: "low" | "medium" | "high";
        source?: "system" | "google" | "custom" | "unknown";
        available?: boolean;
      }
  >;
  fallbackFamilies?: Partial<Record<TypographyRole, string[]>>;
};

export type SceneLike = {
  confidence?: number;
  creativeDecisions?: {
    story?: string;
    hero?: { type?: string };
    composition?: {
      typeField?: string;
      preferredPattern?: string;
      stackAlignment?: "left" | "center" | "right";
    };
    hierarchy?: {
      headlinePower?: number;
      accentMaxRatio?: number;
      bodyMaxRatio?: number;
      dateMaxRatio?: number;
      venueMaxRatio?: number;
      badgeMaxRatio?: number;
      presenterMaxRatio?: number;
    };
    typographyPolicy?: string;
    densityPolicy?: { policy?: string };
    effectPolicy?: { policy?: string };
  };
};

export type CreativeDirectionLike = {
  posterIdentity?: string;
  posterDNA?: string;
  visualEnergy?: string;
  creativeRisk?: string;
  informationDensity?: string;
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
  typography?: {
    headlinePersonality?: TypographyPersonality;
    accentPersonality?: TypographyPersonality;
    bodyPersonality?: TypographyPersonality;
    headlineTreatment?: string;
    trackingPolicy?: string;
    bodyCase?: string;
    bodyTracking?: number;
    bodyLineHeight?: number;
    maxFontFamilies?: number;
    allowScriptAccent?: boolean;
    reason?: string;
  };
  signatureMove?: {
    move?: string;
    intensity?: string;
    target?: string;
    parameters?: Record<string, unknown>;
    fallback?: string;
  };
  effects?: {
    policy?: string;
    maxGlow?: number;
    maxShadow?: number;
    maxTexture?: number;
  };
};

export type CompositionLike = {
  family?: string;
  alignment?: "left" | "center" | "right";
  typeField?: string;
  overlapPolicy?: string;
  blocks?: Array<{
    role: TypographyRole | string;
    width?: number;
    height?: number;
    maxVisualPower?: number;
    minVisualPower?: number;
  }>;
};

export type CopyGroupLike = {
  id: string;
  role: string;
  treatment: string;
  text: string;
  case?: string;
  priority?: number;
  maxLines?: number;
  powerRatio?: number;
  spacingBefore?: number;
  spacingAfter?: number;
};

export type CopyArchitectureLike = {
  id?: string;
  tone?: string;
  density?: string;
  groups: CopyGroupLike[];
};

export type TypographyDirectorInput = {
  scene?: SceneLike | null;
  creativeDirection?: CreativeDirectionLike | null;
  composition?: CompositionLike | null;
  copyArchitecture: CopyArchitectureLike;
  availableFonts: AvailableFontsInput;
  userPreferences?: Partial<{
    preferredHeadlineFonts: string[];
    preferredAccentFonts: string[];
    preferredBodyFonts: string[];
    forbiddenFonts: string[];
    maxFontFamilies: number;
    allowScriptAccent: boolean;
    preserveCurrentFonts: boolean;
  }>;
  learning?: Partial<{
    acceptedFontPairs: string[];
    rejectedFontPairs: string[];
    preferredHeadlinePersonality: TypographyPersonality;
    preferredAccentPersonality: TypographyPersonality;
  }>;
  debug?: boolean;
};

export type TypographyLayer = {
  role: TypographyRole;
  sourceGroupIds: string[];
  text: string;
  fontFamily: string;
  fallbackFamilies: string[];
  personality: TypographyPersonality;
  category: FontCategory;
  sizeScale: number;
  weight: number;
  style: "normal" | "italic";
  tracking: number;
  lineHeight: number;
  case: "preserve" | "uppercase" | "titlecase" | "sentence";
  align: "left" | "center" | "right";
  visualPower: number;
  maxLines: number;
  effects: {
    glow: number;
    shadow: number;
    stroke: number;
    blur: number;
    opacity: number;
    uppercaseTransform: boolean;
  };
  spacingBefore: number;
  spacingAfter: number;
  offsetX: number;
  offsetY: number;
  rotationDeg: number;
  reasoning: string[];
};

export type TypographySystem = {
  id: string;
  name: string;
  headline: TypographyLayer;
  accent?: TypographyLayer;
  metadata?: TypographyLayer;
  dateTime?: TypographyLayer;
  venue?: TypographyLayer;
  badge?: TypographyLayer;
  presenter?: TypographyLayer;
  footer?: TypographyLayer;
  fontFamilies: string[];
  personalities: TypographyPersonality[];
  maxFontFamilies: number;
  hierarchy: {
    headlinePower: number;
    accentMaxRatio: number;
    bodyMaxRatio: number;
    dateMaxRatio: number;
    venueMaxRatio: number;
    badgeMaxRatio: number;
    presenterMaxRatio: number;
    headlineMustWinBy: number;
  };
  signatureMove?: {
    id: string;
    target: TypographyRole | "full-stack";
    parameters: Record<string, string | number | boolean>;
  };
  score: TypographyScore;
  reasoning: string[];
  warnings: string[];
};

export type TypographyScore = {
  hierarchy: number;
  readability: number;
  moodFit: number;
  sceneFit: number;
  compositionFit: number;
  fontQuality: number;
  pairingQuality: number;
  rhythm: number;
  premiumPotential: number;
  originality: number;
  restraint: number;
  renderability: number;
  total: number;
};

export type TypographyDirectorResult = {
  winner: TypographySystem;
  finalists: TypographySystem[];
  candidates: TypographySystem[];
  rejected: Array<{ id: string; reason: string }>;
  normalizedFonts: FontSupport[];
  authority: {
    typographySystemId: string;
    ownsRoles: TypographyRole[];
    maxFontFamilies: number;
    downstreamMustObey: string[];
  };
  trace: Array<{
    stage: string;
    decision: string;
    confidence: number;
    evidence: string[];
  }>;
};

export type TypographyRenderModel = {
  id: string;
  roles: TypographyLayer[];
  fontFamilies: string[];
  maxFontFamilies: number;
};

export type RenderedTypographySnapshot = {
  renderedRoles: TypographyRole[];
  fontFamilies: string[];
  roleVisualPowers: Partial<Record<TypographyRole, number>>;
  roleLineCounts: Partial<Record<TypographyRole, number>>;
  roleFontFamilies: Partial<Record<TypographyRole, string>>;
  effects: Partial<Record<TypographyRole, { glow: number; shadow: number; stroke: number; blur: number }>>;
  previewExportMatch: boolean;
};

export type TypographyComplianceResult = {
  pass: boolean;
  blockers: string[];
  warnings: string[];
  score: number;
};
