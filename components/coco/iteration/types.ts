import type { CocoTournamentRect, CocoTournamentZoneMap } from "../layoutTournament";
import type { CocoTypographyStackModel } from "../typographyStack/types";

export type CocoCritiqueCategory =
  | "visualInteraction"
  | "hierarchy"
  | "spacing"
  | "badge"
  | "metadata"
  | "edgeRisk"
  | "premiumPolish"
  | "topUtility";

export type CocoImprovementAction =
  | "moveStack"
  | "scaleHeadline"
  | "shrinkAccent"
  | "moveBadge"
  | "quietBadge"
  | "separateTopUtility"
  | "attachMetadata"
  | "addImageInteraction"
  | "reduceMetadataWeight"
  | "increaseBreathingRoom";

export type CocoDesignPatch = Partial<{
  stackOffsetX: number;
  stackOffsetY: number;
  headlineScale: number;
  accentScale: number;
  accentOffsetX: number;
  accentOffsetY: number;
  accentRotation: number;
  metadataScale: number;
  metadataOffsetY: number;
  badgeOffsetX: number;
  badgeOffsetY: number;
  badgeScale: number;
  allowAccentOverlap: boolean;
}>;

export type CocoDesignCritique = {
  id: string;
  category: CocoCritiqueCategory;
  severity: "low" | "medium" | "high";
  confidence: number;
  observation: string;
  reason: string;
  suggestedPatch?: CocoDesignPatch;
};

export type CocoImprovementCandidate = {
  id: string;
  action: CocoImprovementAction;
  critiqueId: string;
  description: string;
  patch: CocoDesignPatch;
};

export type CocoBadgePatch = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type CocoIterationState = {
  stack: CocoTypographyStackModel;
  badgePatch?: CocoBadgePatch | null;
};

export type CocoPrediction = {
  candidateId: string;
  expectedGain: number;
  risk: number;
  reason: string;
};

export type CocoIterationInput = {
  zones: CocoTournamentZoneMap;
  stack: CocoTypographyStackModel;
  subjectZone?: CocoTournamentRect | null;
  faceZone?: CocoTournamentRect | null;
  badgeZone?: CocoTournamentRect | null;
  presenterZone?: CocoTournamentRect | null;
};

export type CocoIterationResult = {
  stack: CocoTypographyStackModel;
  badgePatch?: CocoBadgePatch | null;
  applied: Array<{
    critique: CocoDesignCritique;
    improvement: CocoImprovementCandidate;
    prediction: CocoPrediction;
  }>;
  critiques: CocoDesignCritique[];
  debug?: {
    evaluatedCandidates: number;
    iterations: number;
    stopReason: "no-critiques" | "no-candidates" | "below-threshold" | "max-iterations";
  };
};
