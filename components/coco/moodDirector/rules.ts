import type {
  CocoMoodDesignDirection,
  CocoMoodId,
  CocoMoodVector,
} from "./types";

type MoodRule = {
  direction: CocoMoodDesignDirection;
  tags: string[];
  vector: CocoMoodVector;
};

export const COCO_MOOD_IDS: CocoMoodId[] = [
  "luxury",
  "latin",
  "rave",
  "pool",
  "rooftop",
  "hiphop",
  "afrobeats",
  "rnb",
  "brunch",
  "techno",
  "throwback",
  "nightlife",
];

export const COCO_MOOD_RULES: Record<CocoMoodId, MoodRule> = {
  afrobeats: {
    direction: {
      colors: ["orange", "gold", "sunset pink", "deep green"],
      effects: ["warm bloom", "soft haze", "organic movement accents"],
      layout: ["lifestyle subject", "open warmth", "rhythmic spacing"],
      lighting: ["golden ambience", "warm side light", "sunset color cast"],
      typography: ["bold display", "expressive accent", "clean info font"],
    },
    tags: ["warm", "alive", "social", "rhythmic"],
    vector: vector({ elegance: 50, energy: 72, exclusivity: 38, playfulness: 78, sensuality: 62, summer: 78, underground: 18 }),
  },
  brunch: {
    direction: {
      colors: ["cream", "coral", "fresh green", "soft gold"],
      effects: ["light bloom", "soft grain", "gentle sun flare"],
      layout: ["airy", "friendly", "low density"],
      lighting: ["daylight", "warm fill", "soft natural highlight"],
      typography: ["clean bold", "friendly display", "simple utility sans"],
    },
    tags: ["fresh", "social", "bright", "approachable"],
    vector: vector({ elegance: 46, energy: 46, exclusivity: 24, playfulness: 70, sensuality: 28, summer: 84, underground: 4 }),
  },
  hiphop: {
    direction: {
      colors: ["black", "white", "red", "chrome", "deep blue"],
      effects: ["hard shadow", "print grit", "controlled sticker energy"],
      layout: ["assertive crop", "street-poster balance", "headline dominance"],
      lighting: ["hard contrast", "street light", "dramatic rim"],
      typography: ["heavy condensed", "bold grotesk", "clean utility font"],
    },
    tags: ["confident", "direct", "raw", "strong"],
    vector: vector({ elegance: 28, energy: 82, exclusivity: 42, playfulness: 42, sensuality: 30, summer: 18, underground: 58 }),
  },
  latin: {
    direction: {
      colors: ["red", "orange", "gold", "cream"],
      effects: ["warm flare", "motion accents", "soft gradients"],
      layout: ["movement", "diagonal rhythm", "curves"],
      lighting: ["warm spotlight", "dynamic light", "gold highlights"],
      typography: ["expressive serif", "script accent", "bold condensed"],
    },
    tags: ["warm", "dance", "sensual", "celebration"],
    vector: vector({ elegance: 54, energy: 76, exclusivity: 34, playfulness: 76, sensuality: 78, summer: 58, underground: 16 }),
  },
  luxury: {
    direction: {
      colors: ["black", "gold", "champagne", "deep red"],
      effects: ["subtle glow", "glass", "gold accent", "soft vignette"],
      layout: ["spacious", "centered", "low density", "premium margins"],
      lighting: ["warm glow", "soft vignette", "cinematic shadow"],
      typography: ["serif", "thin sans", "wide tracking"],
    },
    tags: ["sophisticated", "exclusive", "premium", "polished"],
    vector: vector({ elegance: 92, energy: 38, exclusivity: 92, playfulness: 18, sensuality: 58, summer: 12, underground: 10 }),
  },
  nightlife: {
    direction: {
      colors: ["black", "white", "deep saturated accent", "electric accent"],
      effects: ["controlled glow", "readability shadow", "subtle depth"],
      layout: ["clear hero", "phone-first hierarchy", "safe margins"],
      lighting: ["club ambience", "rim light", "background separation"],
      typography: ["bold headline", "simple information font"],
    },
    tags: ["social", "bold", "clear", "nightlife"],
    vector: vector({ elegance: 45, energy: 62, exclusivity: 35, playfulness: 48, sensuality: 42, summer: 24, underground: 28 }),
  },
  pool: {
    direction: {
      colors: ["aqua", "white", "yellow", "coral"],
      effects: ["sun flare", "water texture", "soft grain"],
      layout: ["open space", "fresh", "large subject"],
      lighting: ["bright", "sunlit", "airy"],
      typography: ["rounded sans", "retro script", "clean bold"],
    },
    tags: ["sunlit", "fresh", "playful", "summer"],
    vector: vector({ elegance: 38, energy: 58, exclusivity: 30, playfulness: 84, sensuality: 46, summer: 96, underground: 2 }),
  },
  rave: {
    direction: {
      colors: ["electric blue", "purple", "acid green", "hot magenta"],
      effects: ["glitch", "noise", "chromatic blur", "neon haze"],
      layout: ["asymmetric", "dense", "high energy"],
      lighting: ["neon", "laser", "high contrast", "strobe"],
      typography: ["compressed sans", "techno", "glitch"],
    },
    tags: ["electric", "kinetic", "loud", "night"],
    vector: vector({ elegance: 18, energy: 96, exclusivity: 22, playfulness: 70, sensuality: 34, summer: 12, underground: 76 }),
  },
  rnb: {
    direction: {
      colors: ["burgundy", "violet", "gold", "black"],
      effects: ["soft bloom", "velvet shadow", "subtle haze"],
      layout: ["smooth flow", "moody space", "readable details"],
      lighting: ["warm low light", "soft rim", "lounge ambience"],
      typography: ["elegant display", "clean sans", "wide tracking"],
    },
    tags: ["smooth", "romantic", "intimate", "moody"],
    vector: vector({ elegance: 78, energy: 34, exclusivity: 58, playfulness: 22, sensuality: 86, summer: 10, underground: 22 }),
  },
  rooftop: {
    direction: {
      colors: ["sunset orange", "sky blue", "gold", "deep navy"],
      effects: ["sunset haze", "soft light leak", "gentle grain"],
      layout: ["skyline space", "open top area", "elevated social"],
      lighting: ["golden hour", "city glow", "soft sky light"],
      typography: ["clean display", "wide tracking", "simple details font"],
    },
    tags: ["open", "elevated", "social", "sunset"],
    vector: vector({ elegance: 62, energy: 52, exclusivity: 52, playfulness: 44, sensuality: 34, summer: 66, underground: 8 }),
  },
  techno: {
    direction: {
      colors: ["black", "white", "acid green", "steel blue"],
      effects: ["scanlines", "hard blur", "monochrome texture"],
      layout: ["strict grid", "asymmetry", "industrial negative space"],
      lighting: ["cold light", "hard contrast", "industrial shadow"],
      typography: ["condensed sans", "monospace accent", "strict grid type"],
    },
    tags: ["minimal", "underground", "precise", "industrial"],
    vector: vector({ elegance: 30, energy: 76, exclusivity: 34, playfulness: 14, sensuality: 10, summer: 0, underground: 94 }),
  },
  throwback: {
    direction: {
      colors: ["cream", "red", "teal", "yellow"],
      effects: ["halftone", "print grain", "retro shadow"],
      layout: ["poster rhythm", "clear era cue", "strong date"],
      lighting: ["warm flash", "vintage wash", "soft contrast"],
      typography: ["retro display", "bold sans", "simple info font"],
    },
    tags: ["nostalgic", "fun", "recognizable", "poster"],
    vector: vector({ elegance: 32, energy: 68, exclusivity: 18, playfulness: 86, sensuality: 24, summer: 34, underground: 24 }),
  },
};

export function mergeMoodDirection(primary: CocoMoodId, secondary?: CocoMoodId): CocoMoodDesignDirection {
  const primaryDirection = COCO_MOOD_RULES[primary].direction;
  if (!secondary || secondary === primary) return cloneDirection(primaryDirection);
  const secondaryDirection = COCO_MOOD_RULES[secondary].direction;
  return {
    colors: mergeArrays(primaryDirection.colors, secondaryDirection.colors, 5),
    effects: mergeArrays(primaryDirection.effects, secondaryDirection.effects, 5),
    layout: mergeArrays(primaryDirection.layout, secondaryDirection.layout, 5),
    lighting: mergeArrays(primaryDirection.lighting, secondaryDirection.lighting, 5),
    typography: mergeArrays(primaryDirection.typography, secondaryDirection.typography, 5),
  };
}

export function baseMoodVector(mood: CocoMoodId) {
  return COCO_MOOD_RULES[mood].vector;
}

export function moodTagsFor(primary: CocoMoodId, secondary?: CocoMoodId) {
  return mergeArrays(COCO_MOOD_RULES[primary].tags, secondary ? COCO_MOOD_RULES[secondary].tags : [], 7);
}

function cloneDirection(direction: CocoMoodDesignDirection): CocoMoodDesignDirection {
  return {
    colors: [...direction.colors],
    effects: [...direction.effects],
    layout: [...direction.layout],
    lighting: [...direction.lighting],
    typography: [...direction.typography],
  };
}

function mergeArrays(a: string[], b: string[], max: number) {
  return Array.from(new Set([...a, ...b])).slice(0, max);
}

function vector(input: CocoMoodVector): CocoMoodVector {
  return input;
}
