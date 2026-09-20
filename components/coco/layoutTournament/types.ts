import type { CocoNightlifeStyle } from "../intelligence";
import type { CocoMoodProfile } from "../moodDirector";

export type CocoTournamentAlign = "left" | "center" | "right";
export type CocoTournamentFormat = "square" | "story";
export type CocoTournamentLayoutId = "subject-center" | "subject-left" | "subject-right";

export type CocoTournamentRect = {
  align?: CocoTournamentAlign;
  height: number;
  width: number;
  x: number;
  y: number;
};

export type CocoTournamentZoneMap = {
  date: CocoTournamentRect;
  headline: CocoTournamentRect;
  leftInfo: CocoTournamentRect;
  presenter: CocoTournamentRect;
  price: CocoTournamentRect;
  rightInfo: CocoTournamentRect;
  script: CocoTournamentRect;
  subject: CocoTournamentRect;
  subtag: CocoTournamentRect;
  venue: CocoTournamentRect;
};

// Renderer zones are recipe-defined and may extend the tournament's core
// layout zones (for example, `doors` is the independent time zone used by
// compiled recipes). Keep the core keys typed while allowing those semantic
// recipe zones to remain first-class.
export type CocoRendererZoneMap = Partial<CocoTournamentZoneMap> & {
  [zone: string]: CocoTournamentRect | undefined;
};

export type CocoTournamentText = Partial<{
  compliance: string;
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

export type CocoCompositionPatternId =
  | "left-premium-stack"
  | "right-premium-stack"
  | "center-poster-stack"
  | "bottom-lockup"
  | "split-hero-editorial"
  | "diagonal-energy"
  | "fashion-club-vertical"
  | "golden-hero-editorial"
  | "center-hero-event-poster";

export type CocoCompositionRole =
  | "headline"
  | "accent"
  | "primaryMeta"
  | "secondaryMeta"
  | "dateTime"
  | "venue"
  | "footer"
  | "badge";

export type CocoCompositionSource =
  | "headline"
  | "script"
  | "details"
  | "details2"
  | "date"
  | "venue"
  | "price"
  | "presenter"
  | "subtag"
  | "compliance";

export type CocoCopyTreatment = {
  script: "accent-support" | "hide";
  details: "primary-meta" | "hide";
  details2: "keep" | "merge" | "mute" | "footer" | "hide";
  date: "metadata" | "hero-date";
  venue: "lock-to-stack" | "footer";
};

export type CocoCreativeStoryId =
  | "luxury-tropical-brunch"
  | "premium-ladies-night"
  | "afrobeats-sunset"
  | "rnb-lounge"
  | "bottle-service-vip"
  | "high-energy-club"
  | "throwback-party"
  | "general-nightlife";

export type CocoInformationGroup = {
  id: "identity" | "emotion" | "primaryMeta" | "logistics" | "venue" | "footer";
  priority: 1 | 2 | 3 | 4 | 5;
  sources: CocoCompositionSource[];
  treatment: "hero" | "accent" | "metadata" | "muted" | "footer" | "hide";
};

export type CocoEyeFlowStep = {
  target: CocoCompositionRole | "subject";
  priority: number;
};

export type CocoCreativeBrief = {
  storyId?: CocoCreativeStoryId;
  recommendedLayoutId?: CocoTournamentLayoutId;
  recommendedComposition?: CocoCompositionPatternId;
  informationArchitecture?: CocoInformationGroup[];
  eyeFlow?: CocoEyeFlowStep[];
  hierarchyRules?: {
    headlineMustWin: true;
    accentMaxRatio: number;
    bodyMaxRatio: number;
    venueMaxRatio: number;
    dateMaxRatio: number;
  };
  polishRules?: {
    attachBodyToHeadline: boolean;
    avoidScatteredZones: boolean;
    mergeSecondaryCopy: boolean;
    preferMetadataOverBodyCopy: boolean;
    protectFace: boolean;
    useOneTypeColumn: boolean;
  };
  scene: {
    subjectCount: number;
    subjectPosition: "left" | "right" | "center" | "none";
    crop: "close-up" | "medium" | "wide" | "unknown";
    eyeDirection: "upper-left" | "upper-right" | "center" | "unknown";
    lightingSide: "left" | "right" | "center" | "unknown";
    lightingTemperature: "cool" | "neutral" | "warm";
    negativeSpace: {
      side: "left" | "right" | "center" | "bottom";
      scale: "large" | "medium" | "small";
    };
    dominantColors: string[];
    moodTags: string[];
  };
  event: {
    categoryTags: string[];
    avoidTags: string[];
    moodTags: string[];
  };
  story: {
    oneLine: string;
    tags: string[];
  };
  hero: {
    primary: "subject" | "headline" | "drink" | "logo" | "background";
    secondary?: "subject" | "headline" | "drink" | "logo" | "background";
    support: Array<"subject" | "headline" | "drink" | "logo" | "background">;
  };
  visualWeight: {
    subject: number;
    face: number;
    body: number;
    imageSide: number;
    headlineTarget: number;
    supportTextTarget: number;
  };
  counterweight: {
    side: "left" | "right" | "center" | "bottom";
    reason: string;
  };
  typographyColumn: {
    side: "left" | "right" | "center" | "bottom";
    alignment: CocoTournamentAlign;
    role: "counterweight" | "center-anchor" | "bottom-lockup";
  };
  readingOrder: CocoCompositionRole[];
  hierarchy: {
    headline: number;
    accent: number;
    metadata: number;
    dateTime: number;
    venue: number;
    footer: number;
  };
  rhythm: {
    headlineToAccent: number;
    accentToMeta: number;
    metaToDateTime: number;
    dateTimeToVenue: number;
  };
  protection: {
    protect: Array<"eyes" | "smile" | "drink" | "hair-silhouette" | "subject-edge">;
    forbiddenZones?: CocoTournamentRect[];
  };
  colorStory: {
    dominant: string[];
    headline: string;
    accent: string;
    metadata: string;
    footer: string;
  };
  evaluationGoals: Array<"hierarchy" | "balance" | "negative-space" | "premium" | "readability" | "energy" | "mood" | "brand">;
};

export type CocoCompositionBlock = {
  role: CocoCompositionRole;
  source: CocoCompositionSource;
  rect: CocoTournamentRect;
  align: CocoTournamentAlign;
  priority: 1 | 2 | 3 | 4 | 5;
  parentRole?: CocoCompositionRole;
  shouldAttachTo?: CocoCompositionRole;
  minVisualPower?: number;
  maxVisualPower?: number;
  hidden?: boolean;
};

export type CocoCompositionSystem = {
  patternId: CocoCompositionPatternId;
  layoutId: CocoTournamentLayoutId;
  anchorSide: "left" | "right" | "center" | "bottom";
  alignment: CocoTournamentAlign;
  brief?: CocoCreativeBrief;
  textColumn: CocoTournamentRect;
  blocks: CocoCompositionBlock[];
  // Every zone the composition director actually found (findZoneRect
  // matched real negative space) or hand-positioned (the hero-title
  // column), regardless of whether it has text right now - `blocks` above
  // is filtered down to only what renders. This is for debug visibility
  // into zone PLACEMENT itself, independent of content.
  allBlocks: CocoCompositionBlock[];
  copyTreatment: CocoCopyTreatment;
  rendererZones?: CocoRendererZoneMap;
  gates?: {
    headlineOverScriptMin: number;
    headlineOverBodyMin: number;
    scriptMaxHeadlineRatio: number;
    detailsMaxHeadlineRatio: number;
    venueMaxHeadlineRatio: number;
  };
  rhythm: {
    headlineToAccent: number;
    accentToMeta: number;
    metaToDateTime: number;
    dateTimeToVenue: number;
  };
  hierarchy: {
    headlinePowerMin: number;
    accentPowerMaxRatio: number;
    bodyPowerMaxRatio: number;
    metadataPowerMaxRatio: number;
  };
  explanation: string;
  score: number;
};

export type CocoTournamentSnapshot = {
  backgroundOnlyHero?: boolean;
  brief?: CocoCreativeBrief;
  composition?: CocoCompositionSystem;
  eventName?: string;
  faceZone: CocoTournamentRect;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  layoutId: CocoTournamentLayoutId;
  moodProfile?: CocoMoodProfile | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  preferredPatternId?: string | null;
  subjectZone: CocoTournamentRect;
  text?: CocoTournamentText;
  zones: CocoTournamentZoneMap;
};

export type CocoTournamentScore = {
  alignment: number;
  balance: number;
  energy: number;
  final: number;
  hierarchy: number;
  moodMatch: number;
  negativeSpace: number;
  originality: number;
  premium: number;
  readability: number;
  subjectProtection: number;
};

export type CocoLayoutCandidate = {
  brief?: CocoCreativeBrief;
  explanation: string;
  generation: "base" | "refined" | "variation";
  id: string;
  layoutId: CocoTournamentLayoutId;
  patternId: string;
  composition?: CocoCompositionSystem;
  scores?: CocoTournamentScore;
  zones: CocoTournamentZoneMap;
};

export type CocoTournamentResult = {
  finalists: CocoLayoutCandidate[];
  rejectedCount: number;
  totalCandidates: number;
  winner: CocoLayoutCandidate;
};
