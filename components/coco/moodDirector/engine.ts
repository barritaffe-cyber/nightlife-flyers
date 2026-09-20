import {
  baseMoodVector,
  COCO_MOOD_IDS,
  mergeMoodDirection,
  moodTagsFor,
} from "./rules.ts";
import type {
  CocoMoodDirectorInput,
  CocoMoodId,
  CocoMoodProfile,
  CocoMoodScoreMap,
  CocoMoodVector,
} from "./types.ts";
import type { CocoNightlifeStyle, CocoPhotoSignal } from "../intelligence/types.ts";

const ZERO_SCORES = Object.fromEntries(COCO_MOOD_IDS.map((id) => [id, 0])) as CocoMoodScoreMap;

const STYLE_MOOD_PRIORS: Record<CocoNightlifeStyle, Partial<Record<CocoMoodId, number>>> = {
  afrobeats: { afrobeats: 1.1, latin: 0.25, pool: 0.18 },
  "bottle-service": { luxury: 1.15, nightlife: 0.25 },
  brunch: { brunch: 1, pool: 0.3, rooftop: 0.18 },
  edm: { rave: 1.15, nightlife: 0.25, techno: 0.22 },
  "general-nightlife": { nightlife: 0.82 },
  "hip-hop": { hiphop: 1.12, nightlife: 0.24 },
  house: { rave: 0.48, nightlife: 0.36, rooftop: 0.22 },
  "ladies-night": { luxury: 0.56, nightlife: 0.28, rnb: 0.2 },
  "latin-night": { latin: 1.18, nightlife: 0.2 },
  "luxury-club": { luxury: 1.22, rnb: 0.18 },
  "rnb-lounge": { rnb: 1.08, luxury: 0.34 },
  rooftop: { rooftop: 1.18, luxury: 0.22, pool: 0.2 },
  techno: { techno: 1.12, rave: 0.34 },
  throwback: { throwback: 1.12, hiphop: 0.18 },
};

const EVENT_KEYWORDS: Record<CocoMoodId, string[]> = {
  afrobeats: ["afrobeats", "afro", "amapiano", "soca", "dancehall", "island", "tropical"],
  brunch: ["brunch", "mimosa", "day party", "dayparty", "sunday funday", "dayclub"],
  hiphop: ["hip hop", "hip-hop", "trap", "rap", "drill", "cypher", "dj battle"],
  latin: ["latin", "salsa", "bachata", "noche", "reggaeton", "merengue"],
  luxury: ["vip", "bottle", "champagne", "luxe", "luxury", "soiree", "soirée", "black tie", "premium"],
  nightlife: ["party", "night", "club", "social", "after dark", "late night"],
  pool: ["pool", "summer", "cabana", "beach", "daybed", "swim", "sunset"],
  rave: ["rave", "edm", "laser", "bass", "festival", "strobe", "neon"],
  rnb: ["r&b", "rnb", "lounge", "slow jams", "velvet", "smooth", "soul"],
  rooftop: ["rooftop", "skyline", "terrace", "views", "elevated", "high", "sunset"],
  techno: ["techno", "warehouse", "underground", "industrial", "bunker"],
  throwback: ["throwback", "retro", "old school", "90s", "80s", "2000s", "disco"],
};

const IMAGE_HINT_MOOD: Record<string, Partial<Record<CocoMoodId, number>>> = {
  aqua: { pool: 0.24 },
  beach: { pool: 0.45, afrobeats: 0.18, brunch: 0.12 },
  black: { luxury: 0.18, techno: 0.12 },
  bottle: { luxury: 0.42, nightlife: 0.12 },
  champagne: { luxury: 0.48 },
  city: { rooftop: 0.26, nightlife: 0.1 },
  club: { nightlife: 0.2, rave: 0.12, latin: 0.08 },
  cocktail: { luxury: 0.14, brunch: 0.12, pool: 0.08 },
  concrete: { techno: 0.2, rave: 0.14 },
  crowd: { nightlife: 0.16, rave: 0.16 },
  dance: { latin: 0.26, rave: 0.12, afrobeats: 0.16 },
  daylight: { brunch: 0.24, pool: 0.2, rooftop: 0.14 },
  dj: { rave: 0.28, techno: 0.2, nightlife: 0.12 },
  gold: { luxury: 0.26, latin: 0.1, afrobeats: 0.1 },
  green: { rave: 0.16, techno: 0.2 },
  jewelry: { luxury: 0.26, rnb: 0.08 },
  laser: { rave: 0.48, techno: 0.2 },
  lounge: { rnb: 0.26, luxury: 0.22 },
  neon: { rave: 0.28, nightlife: 0.12, techno: 0.12 },
  orange: { latin: 0.18, afrobeats: 0.2, rooftop: 0.1 },
  pool: { pool: 0.52 },
  purple: { rave: 0.18, rnb: 0.16 },
  red: { latin: 0.22, hiphop: 0.08, rnb: 0.08 },
  skyline: { rooftop: 0.52 },
  sparkler: { luxury: 0.34, nightlife: 0.1 },
  strobe: { rave: 0.38, techno: 0.16 },
  sunny: { pool: 0.26, brunch: 0.2 },
  sunset: { rooftop: 0.32, pool: 0.18, afrobeats: 0.14 },
  velvet: { luxury: 0.2, rnb: 0.32 },
  warehouse: { techno: 0.44, rave: 0.2 },
  water: { pool: 0.38 },
};

export function buildCocoMoodProfile(input: CocoMoodDirectorInput): CocoMoodProfile {
  const eventScores = analyzeCocoEventMood(input);
  const imageScores = analyzeCocoImageMood(input);
  const moodScores = mergeCocoMoodScores(eventScores, imageScores);
  const sorted = Object.entries(moodScores)
    .map(([mood, score]) => ({ mood: mood as CocoMoodId, score }))
    .sort((a, b) => b.score - a.score);
  const primaryMood = sorted[0]?.mood ?? "nightlife";
  const secondaryMood =
    sorted[1] && sorted[1].score >= Math.max(0.42, sorted[0].score * 0.58)
      ? sorted[1].mood
      : undefined;
  const vector = calculateMoodVector(primaryMood, secondaryMood, moodScores);
  const confidence = calculateConfidence(sorted);

  return {
    confidence,
    designDirection: mergeMoodDirection(primaryMood, secondaryMood),
    eventScores,
    imageScores,
    moodScores,
    moodTags: moodTagsFor(primaryMood, secondaryMood),
    primaryMood,
    secondaryMood,
    source: "local",
    vector,
  };
}

export function analyzeCocoEventMood(input: CocoMoodDirectorInput): CocoMoodScoreMap {
  const scores = cloneScores();
  const eventText = [
    input.event.title,
    input.event.subtitle,
    input.event.description,
    input.event.venue,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const mood of COCO_MOOD_IDS) {
    const keywords = EVENT_KEYWORDS[mood];
    keywords.forEach((keyword) => {
      if (eventText.includes(keyword)) {
        scores[mood] += keyword.includes(" ") ? 0.34 : 0.24;
      }
    });
  }

  const style = input.styleDecision?.style ?? input.nightlifeStyle ?? null;
  if (style) {
    addMoodWeights(scores, STYLE_MOOD_PRIORS[style], input.styleDecision?.confidence ?? 0.76);
  }

  if (input.styleDecision?.mood) {
    const moodText = input.styleDecision.mood.toLowerCase();
    for (const mood of COCO_MOOD_IDS) {
      EVENT_KEYWORDS[mood].forEach((keyword) => {
        if (moodText.includes(keyword)) scores[mood] += 0.08;
      });
    }
  }

  if (topScore(scores) <= 0) scores.nightlife = 0.3;
  return normalizeMoodScores(scores);
}

export function analyzeCocoImageMood(input: CocoMoodDirectorInput): CocoMoodScoreMap {
  const scores = cloneScores();
  const semanticSignals = flattenImageSignals(input.imageSignals);
  semanticSignals.forEach((hint) => addMoodWeights(scores, IMAGE_HINT_MOOD[hint], 1));
  input.photoSignals?.forEach((signal) => scorePhotoSignal(scores, signal));

  if (topScore(scores) <= 0) scores.nightlife = 0.18;
  return normalizeMoodScores(scores);
}

export function mergeCocoMoodScores(
  eventScores: CocoMoodScoreMap,
  imageScores: CocoMoodScoreMap
): CocoMoodScoreMap {
  const merged = cloneScores();
  for (const mood of COCO_MOOD_IDS) {
    merged[mood] = eventScores[mood] * 1.4 + imageScores[mood];
  }
  return normalizeMoodScores(merged);
}

function scorePhotoSignal(scores: CocoMoodScoreMap, signal: CocoPhotoSignal) {
  signal.dominantHints?.forEach((hint) => {
    const normalized = String(hint || "").trim().toLowerCase();
    addMoodWeights(scores, IMAGE_HINT_MOOD[normalized], 1);
  });

  if (signal.brightness === "bright" && signal.temperature === "warm") {
    scores.pool += 0.18;
    scores.brunch += 0.14;
    scores.rooftop += 0.12;
    scores.afrobeats += 0.08;
  }
  if (signal.brightness === "dark" && signal.saturation === "vivid") {
    scores.rave += 0.2;
    scores.nightlife += 0.12;
  }
  if (signal.brightness === "dark" && signal.saturation === "muted") {
    scores.luxury += 0.14;
    scores.techno += 0.12;
    scores.rnb += 0.08;
  }
  if (signal.temperature === "cool" && signal.contrast === "high") {
    scores.techno += 0.16;
    scores.rave += 0.12;
  }
  if (signal.temperature === "warm" && signal.saturation === "vivid") {
    scores.latin += 0.14;
    scores.afrobeats += 0.14;
    scores.pool += 0.08;
  }
}

function calculateMoodVector(
  primary: CocoMoodId,
  secondary: CocoMoodId | undefined,
  scores: CocoMoodScoreMap
): CocoMoodVector {
  const primaryVector = baseMoodVector(primary);
  const secondaryVector = secondary ? baseMoodVector(secondary) : primaryVector;
  const scoreTotal = Math.max(0.01, Object.values(scores).reduce((sum, score) => sum + score, 0));
  const weighted = Object.entries(scores).reduce(
    (acc, [mood, score]) => {
      const vector = baseMoodVector(mood as CocoMoodId);
      const weight = score / scoreTotal;
      acc.energy += vector.energy * weight;
      acc.elegance += vector.elegance * weight;
      acc.sensuality += vector.sensuality * weight;
      acc.exclusivity += vector.exclusivity * weight;
      acc.playfulness += vector.playfulness * weight;
      acc.underground += vector.underground * weight;
      acc.summer += vector.summer * weight;
      return acc;
    },
    vectorZero()
  );

  return {
    elegance: rounded(weighted.elegance * 0.58 + primaryVector.elegance * 0.3 + secondaryVector.elegance * 0.12),
    energy: rounded(weighted.energy * 0.58 + primaryVector.energy * 0.3 + secondaryVector.energy * 0.12),
    exclusivity: rounded(weighted.exclusivity * 0.58 + primaryVector.exclusivity * 0.3 + secondaryVector.exclusivity * 0.12),
    playfulness: rounded(weighted.playfulness * 0.58 + primaryVector.playfulness * 0.3 + secondaryVector.playfulness * 0.12),
    sensuality: rounded(weighted.sensuality * 0.58 + primaryVector.sensuality * 0.3 + secondaryVector.sensuality * 0.12),
    summer: rounded(weighted.summer * 0.58 + primaryVector.summer * 0.3 + secondaryVector.summer * 0.12),
    underground: rounded(weighted.underground * 0.58 + primaryVector.underground * 0.3 + secondaryVector.underground * 0.12),
  };
}

function calculateConfidence(sorted: Array<{ mood: CocoMoodId; score: number }>) {
  const first = sorted[0]?.score ?? 0;
  const second = sorted[1]?.score ?? 0;
  const gap = first - second;
  return rounded(Math.max(0.34, Math.min(0.96, first * 0.82 + gap * 0.5)));
}

function flattenImageSignals(signals: CocoMoodDirectorInput["imageSignals"]) {
  if (!signals) return [];
  return Object.values(signals)
    .flat()
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

function addMoodWeights(
  scores: CocoMoodScoreMap,
  weights: Partial<Record<CocoMoodId, number>> | undefined,
  multiplier: number
) {
  if (!weights) return;
  for (const [mood, score] of Object.entries(weights)) {
    scores[mood as CocoMoodId] += (score ?? 0) * multiplier;
  }
}

function normalizeMoodScores(scores: CocoMoodScoreMap): CocoMoodScoreMap {
  const max = topScore(scores);
  if (max <= 0) return { ...scores };
  const normalized = cloneScores();
  for (const mood of COCO_MOOD_IDS) {
    normalized[mood] = rounded(Math.min(1, scores[mood] / max));
  }
  return normalized;
}

function topScore(scores: CocoMoodScoreMap) {
  return Math.max(...Object.values(scores));
}

function cloneScores(): CocoMoodScoreMap {
  return { ...ZERO_SCORES };
}

function vectorZero(): CocoMoodVector {
  return {
    elegance: 0,
    energy: 0,
    exclusivity: 0,
    playfulness: 0,
    sensuality: 0,
    summer: 0,
    underground: 0,
  };
}

function rounded(value: number) {
  return Math.round(value * 100) / 100;
}
