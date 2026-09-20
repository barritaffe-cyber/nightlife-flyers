import type { SceneEvidence, SceneStory, StoryHypothesis } from "./types.ts";

type StoryRule = {
  base: number;
  conds?: Array<(evidence: SceneEvidence) => boolean>;
  keys: RegExp[];
  objects?: string[];
  story: SceneStory;
};

const RULES: StoryRule[] = [
  {
    story: "luxury-tropical-brunch",
    base: 16,
    keys: [/\bmojito\b/i, /\bmartini\b/i, /\bbrunch\b/i, /\bcocktail/i, /\bday\s*party\b/i, /\btropical\b/i, /\bisland\b/i],
    objects: ["cocktail", "food", "palm"],
    conds: [(evidence) => evidence.image.warmth > 0.55, (evidence) => evidence.image.saturation > 0.5],
  },
  {
    story: "premium-ladies-night",
    base: 14,
    keys: [/\bladies\b/i, /\bgirls\b/i, /\bqueen\b/i, /\bbaddie\b/i, /\bglam\b/i],
    objects: ["jewelry", "cocktail"],
  },
  {
    story: "afrobeats-sunset",
    base: 14,
    keys: [/\bafro\b/i, /\bafrobeats\b/i, /\bamapiano\b/i, /\bsunset\b/i, /\bisland\b/i, /\brooftop\b/i],
    objects: ["palm", "city"],
    conds: [(evidence) => evidence.image.warmth > 0.62],
  },
  {
    story: "rnb-lounge",
    base: 14,
    keys: [/\br&b\b/i, /\brnb\b/i, /\bsoul\b/i, /\blounge\b/i, /\bsmooth\b/i],
    objects: ["cocktail", "microphone"],
    conds: [(evidence) => evidence.image.luminance < 0.45],
  },
  {
    story: "vip-bottle-service",
    base: 14,
    keys: [/\bvip\b/i, /\bbottle\b/i, /\bchampagne\b/i, /\bluxury\b/i, /\bluxe\b/i, /\bexclusive\b/i],
    objects: ["bottle", "jewelry", "car"],
  },
  {
    story: "latin-night",
    base: 14,
    keys: [/\blatin\b/i, /\bsalsa\b/i, /\bbachata\b/i, /\breggaeton\b/i, /\bnoche\b/i],
    conds: [(evidence) => evidence.image.warmth > 0.55],
  },
  {
    story: "hiphop-showcase",
    base: 13,
    keys: [/\bhip[\s-]?hop\b/i, /\btrap\b/i, /\brap\b/i, /\bstreet\b/i, /\bshowcase\b/i],
    objects: ["microphone", "car", "jewelry"],
  },
  {
    story: "throwback-party",
    base: 13,
    keys: [/\bthrowback\b/i, /\bold\s*school\b/i, /\b90s\b/i, /\b2000s\b/i, /\bretro\b/i, /\bdisco\b/i],
  },
  {
    story: "rooftop-lifestyle",
    base: 12,
    keys: [/\brooftop\b/i, /\bskyline\b/i, /\bsunset\b/i, /\bterrace\b/i],
    objects: ["city", "cocktail"],
  },
  {
    story: "pool-day-party",
    base: 12,
    keys: [/\bpool\b/i, /\bsplash\b/i, /\bsummer\b/i, /\bday\s*party\b/i],
    objects: ["cocktail", "palm"],
    conds: [(evidence) => evidence.image.saturation > 0.62],
  },
  {
    story: "edm-rave",
    base: 13,
    keys: [/\bedm\b/i, /\brave\b/i, /\bbass\b/i, /\bneon\b/i, /\bfestival\b/i],
    objects: ["stage", "speaker"],
    conds: [(evidence) => evidence.image.contrast > 0.65],
  },
  {
    story: "techno-underground",
    base: 13,
    keys: [/\btechno\b/i, /\bunderground\b/i, /\bwarehouse\b/i, /\bindustrial\b/i, /\bafterhours\b/i],
    conds: [(evidence) => evidence.image.luminance < 0.36, (evidence) => evidence.image.saturation < 0.5],
  },
  {
    story: "high-energy-club",
    base: 10,
    keys: [/\bclub\b/i, /\bparty\b/i, /\bdj\b/i, /\bdance\b/i, /\bnight\b/i],
    objects: ["stage", "speaker", "headphones", "turntable"],
  },
  {
    story: "editorial-fashion",
    base: 10,
    keys: [/\bfashion\b/i, /\beditorial\b/i, /\bsoiree\b/i, /\bgala\b/i, /\bblack\s*tie\b/i],
    objects: ["jewelry"],
    conds: [(evidence) => evidence.image.visualNoise < 0.42, (evidence) => evidence.image.saturation < 0.58],
  },
];

export function inferStoryHypotheses(evidence: SceneEvidence): StoryHypothesis[] {
  const objectTypes = new Set(evidence.objects.map((object) => object.type));
  const hypotheses = RULES.map((rule) => {
    let score = rule.base;
    const positives: string[] = [];
    const conflicts: string[] = [];

    for (const key of rule.keys) {
      if (key.test(evidence.eventText)) {
        score += 15;
        positives.push(`Text matched ${key.source}.`);
      }
    }

    for (const objectType of rule.objects ?? []) {
      if (objectTypes.has(objectType as never)) {
        score += 9;
        positives.push(`Scene contains ${objectType}.`);
      }
    }

    for (const condition of rule.conds ?? []) {
      if (condition(evidence)) {
        score += 5;
        positives.push("Image atmosphere supports this story.");
      }
    }

    const smiling =
      evidence.faces.some((face) => face.expression === "smile") ||
      evidence.subjects.some((subject) => subject.expression === "smile");
    const dynamic = evidence.subjects.some((subject) => subject.poseEnergy > 0.72);
    const close = evidence.subjects.some((subject) => subject.crop === "close");
    const sunglasses = evidence.faces.some((face) => face.sunglasses);

    if (smiling && ["luxury-tropical-brunch", "pool-day-party", "afrobeats-sunset", "rooftop-lifestyle"].includes(rule.story)) {
      score += 7;
      positives.push("Smiling lifestyle subject supports relaxed social energy.");
    }
    if (dynamic && ["edm-rave", "high-energy-club", "latin-night", "hiphop-showcase"].includes(rule.story)) {
      score += 7;
      positives.push("Dynamic pose supports high energy.");
    }
    if (close && ["premium-ladies-night", "editorial-fashion", "rnb-lounge", "luxury-tropical-brunch"].includes(rule.story)) {
      score += 5;
      positives.push("Close portrait supports lifestyle/editorial composition.");
    }
    if (sunglasses && ["luxury-tropical-brunch", "rooftop-lifestyle", "premium-ladies-night"].includes(rule.story)) {
      score += 5;
      positives.push("Sunglasses reinforce premium lifestyle cues.");
    }
    if (evidence.objects.some((object) => object.type === "cocktail") && ["techno-underground", "edm-rave"].includes(rule.story)) {
      score -= 5;
      conflicts.push("Cocktail cue weakens pure rave interpretation.");
    }

    return {
      story: rule.story,
      score: Math.max(0, Math.min(100, Math.round(score))),
      evidence: positives,
      conflicts,
    };
  });

  hypotheses.push({
    story: "general-nightlife",
    score: 34,
    evidence: ["General fallback story."],
    conflicts: [],
  });

  return hypotheses.sort((a, b) => b.score - a.score);
}
