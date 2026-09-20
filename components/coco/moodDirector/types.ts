import type { CocoNightlifeStyle, CocoPhotoSignal, CocoStyleDecision } from "../intelligence";

export type CocoMoodId =
  | "afrobeats"
  | "brunch"
  | "hiphop"
  | "latin"
  | "luxury"
  | "nightlife"
  | "pool"
  | "rave"
  | "rnb"
  | "rooftop"
  | "techno"
  | "throwback";

export type CocoMoodVector = {
  elegance: number;
  energy: number;
  exclusivity: number;
  playfulness: number;
  sensuality: number;
  summer: number;
  underground: number;
};

export type CocoMoodDesignDirection = {
  colors: string[];
  effects: string[];
  layout: string[];
  lighting: string[];
  typography: string[];
};

export type CocoMoodImageSignals = Partial<{
  clothing: string[];
  colors: string[];
  expression: string[];
  lighting: string[];
  objects: string[];
  pose: string[];
  scene: string[];
}>;

export type CocoMoodEventInput = Partial<{
  description: string;
  subtitle: string;
  title: string;
  venue: string;
}>;

export type CocoMoodScoreMap = Record<CocoMoodId, number>;

export type CocoMoodProfile = {
  confidence: number;
  designDirection: CocoMoodDesignDirection;
  eventScores: CocoMoodScoreMap;
  imageScores: CocoMoodScoreMap;
  moodScores: CocoMoodScoreMap;
  moodTags: string[];
  primaryMood: CocoMoodId;
  secondaryMood?: CocoMoodId;
  source: "local";
  vector: CocoMoodVector;
};

export type CocoMoodDirectorInput = {
  event: CocoMoodEventInput;
  imageSignals?: CocoMoodImageSignals | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoSignals?: CocoPhotoSignal[];
  styleDecision?: CocoStyleDecision | null;
};
