import type { CocoTournamentRect } from "../layoutTournament";

export type CocoSignatureMoveId =
  | "none"
  | "oversized-headline"
  | "script-cross"
  | "diagonal-accent"
  | "luxury-serif-scale"
  | "editorial-spacing"
  | "cropped-type"
  | "glow-sweep"
  | "badge-orbit";

export type CocoSignatureMoveIntensity = "subtle" | "medium" | "bold";

export type CocoSignatureMoveTarget =
  | "headline"
  | "accent"
  | "metadata"
  | "badge"
  | "full-stack";

export type CocoSignatureMove = {
  id: CocoSignatureMoveId;
  target: CocoSignatureMoveTarget;
  intensity: CocoSignatureMoveIntensity;
  reason: string;
  priority: number;
  typography?: Partial<{
    headlineScaleMultiplier: number;
    accentScaleMultiplier: number;
    accentRotationDeg: number;
    headlineTrackingDelta: number;
    accentTrackingDelta: number;
    useScriptAccent: boolean;
    useCondensedHeadline: boolean;
  }>;
  layout?: Partial<{
    stackOffsetX: number;
    stackOffsetY: number;
    accentOffsetX: number;
    accentOffsetY: number;
    metadataOffsetY: number;
    allowAccentOverlapHeadline: boolean;
    allowAccentCrossStack: boolean;
  }>;
  effects?: Partial<{
    headlineGlowBoost: number;
    accentGlowBoost: number;
    addSoftBehindTextBloom: boolean;
    addBadgeHalo: boolean;
  }>;
  safety: {
    maxFaceOverlap: number;
    maxHeadlineEdgeRisk: number;
    mustKeepReadability: boolean;
  };
};

export type CocoSignatureMoveInput = {
  accentFontFamily?: string | null;
  accentText?: string;
  compositionPatternId?: string | null;
  eventName: string;
  faceZone?: CocoTournamentRect | null;
  hasSubject: boolean;
  headlineText: string;
  mood?: Partial<{
    elegance: number;
    energy: number;
    exclusivity: number;
    playfulness: number;
    summer: number;
    underground: number;
  }> | null;
  nightlifeStyle?: string | null;
  story?: string | null;
  subjectZone?: CocoTournamentRect | null;
};
