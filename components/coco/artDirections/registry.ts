import type { CocoNightlifeStyle } from "../intelligence/types.ts";
import {
  resolveCocoCreativeIntent,
  type CocoCreativeIntentPresetId,
} from "../creativeIntent.ts";
import {
  COCO_CURATED_ART_DIRECTION_IDS,
  COCO_CURATED_ART_DIRECTION_LIBRARY,
  COCO_LAUNCH_ART_DIRECTION_IDS,
  COCO_LAUNCH_ART_DIRECTIONS,
} from "./library.ts";
import type { CocoArtDirection, CocoArtDirectionId } from "./types.ts";

const ART_DIRECTION_BY_ID = new Map<CocoArtDirectionId, CocoArtDirection>(
  COCO_CURATED_ART_DIRECTION_LIBRARY.map((direction) => [direction.id, direction])
);

export type CocoArtDirectionSelectionContext = Readonly<{
  eventDescription?: string | null;
  eventName?: string | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
}>;

export type CocoArtDirectionChoiceTuple = readonly [
  CocoArtDirection,
  CocoArtDirection,
  CocoArtDirection,
];

/**
 * Direct visual instructions define a compatibility boundary, not merely a
 * ranking hint. Keeping these alternatives explicit prevents unrelated style
 * defaults (for example EDM) from putting neon work beside an all-white brief.
 * The second and third choices vary composition while preserving the requested
 * visual temperature.
 */
const COCO_EXPLICIT_INTENT_DIRECTION_CHOICES: Readonly<
  Record<
    CocoCreativeIntentPresetId,
    readonly [CocoArtDirectionId, CocoArtDirectionId, CocoArtDirectionId]
  >
> = {
  "all-white-minimal": ["sensual-night", "fashion-club-vertical", "baddies-n-bundles"],
  "clean-minimal": ["sensual-night", "fashion-club-vertical", "baddies-n-bundles"],
  "black-gold-luxury": ["black-gold-party", "fashion-club-vertical", "sensual-night"],
  "neon-electric": ["neon-night-shift", "glow-in-the-dark", "high-energy-club"],
  "retro-disco": ["glow-in-the-dark", "high-energy-club", "fashion-club-vertical"],
};

function cocoDirectionChoicesFromIds(
  ids: readonly [CocoArtDirectionId, CocoArtDirectionId, CocoArtDirectionId]
): CocoArtDirectionChoiceTuple {
  const replacements: Partial<Record<CocoArtDirectionId, CocoArtDirectionId>> = {
    'high-energy-club': 'space-neon', 'sensual-night': 'ladies-night-rose',
    'city-nights': 'we-outside', 'black-gold-party': 'elite-monday',
  };
  const activeIds = [...new Set(ids.map(id => replacements[id] ?? id))];
  const directions = [...activeIds, ...COCO_LAUNCH_ART_DIRECTION_IDS]
    .filter((id, index, all) => all.indexOf(id) === index)
    .map(id => ART_DIRECTION_BY_ID.get(id)).filter((direction): direction is CocoArtDirection => Boolean(direction));
  if (!directions[0] || !directions[1] || !directions[2]) {
    throw new Error("Coco explicit-intent shortlist references an unknown art direction.");
  }
  return [directions[0], directions[1], directions[2]];
}

const COCO_STYLE_DIRECTION_DEFAULTS: Readonly<
  Record<CocoNightlifeStyle, readonly [CocoArtDirectionId, CocoArtDirectionId, CocoArtDirectionId]>
> = {
  afrobeats: ["punta-cana-sundays", "baddies-n-bundles", "glow-in-the-dark"],
  "bottle-service": ["black-gold-party", "fashion-club-vertical", "sensual-night"],
  brunch: ["brunch-saturday", "brunch-vibes", "punta-cana-sundays"],
  edm: ["high-energy-club", "neon-night-shift", "glow-in-the-dark"],
  "general-nightlife": ["high-energy-club", "glow-in-the-dark", "fashion-club-vertical"],
  "hip-hop": ["baddies-n-bundles", "high-energy-club", "fashion-club-vertical"],
  house: ["high-energy-club", "neon-night-shift", "glow-in-the-dark"],
  "ladies-night": ["sensual-night", "baddies-n-bundles", "fashion-club-vertical"],
  "latin-night": ["punta-cana-sundays", "sensual-night", "glow-in-the-dark"],
  "luxury-club": ["black-gold-party", "fashion-club-vertical", "sensual-night"],
  "rnb-lounge": ["rnb-thursdays", "sensual-night", "black-gold-party"],
  rooftop: ["punta-cana-sundays", "fashion-club-vertical", "sensual-night"],
  techno: ["neon-night-shift", "high-energy-club", "glow-in-the-dark"],
  throwback: ["glow-in-the-dark", "fashion-club-vertical", "high-energy-club"],
};

const COCO_DIRECTION_KEYWORD_SIGNALS: Readonly<
  Partial<Record<CocoArtDirectionId, readonly Readonly<{ pattern: RegExp; weight: number }>[]>>
> = {
  "black-gold-party": [
    { pattern: /\bblack\s*(?:and|&|n)?\s*gold(?:\s+party)?\b/i, weight: 64 },
    { pattern: /\b(?:gold|golden)\s+(?:luxury|foil|frame|portrait|makeup)\b/i, weight: 48 },
    { pattern: /\b(?:luxury|upscale|premium)\s+(?:black|gold|party|night)\b/i, weight: 38 },
    { pattern: /\b(?:shattered|broken)\s+glass\b/i, weight: 30 },
  ],
  "high-energy-club": [
    { pattern: /\b(?:rush\s+night|orange\s+triangle|neon\s+triangle)\b/i, weight: 48 },
    { pattern: /\b(?:edm|festival|laser|rave)\b/i, weight: 22 },
    { pattern: /\b(?:club|dance ?floor|high[ -]?energy|party)\b/i, weight: 12 },
    { pattern: /\b(?:house|bass|mainstage)\b/i, weight: 9 },
    { pattern: /\b(?:exciting|wild|dancing|big energy)\b/i, weight: 48 },
  ],
  "fashion-club-vertical": [
    {
      pattern: /\b(?:friday\s+(?:fashion|fever|club)|(?:fashion|fever|club)\s+friday)\b/i,
      weight: 34,
    },
    { pattern: /\b(?:fashion\s+fever|fashion\s+club|club\s+fashion)\b/i, weight: 30 },
    { pattern: /\b(?:fashion|fever|glam|glamour|runway|couture)\b/i, weight: 22 },
    { pattern: /\b(?:friday|club)\b/i, weight: 10 },
  ],
  "sensual-night": [
    { pattern: /\b(?:sensual|romance|romantic|rose|date night)\b/i, weight: 20 },
    // "Ladies" is the event identity of the stored CSS-master recipe. Treat
    // that plain-language request as authoritative enough to survive the
    // general-nightlife defaults; users should not need to know the internal
    // Sensual Night direction name to reach the recipe-backed option.
    { pattern: /\b(?:ladies|girls|women|baddie)\b/i, weight: 38 },
    { pattern: /\b(?:r\s*&\s*b|rnb|slow jams?)\b/i, weight: 10 },
    { pattern: /\b(?:romantic|couples?|for two|love story)\b/i, weight: 48 },
  ],
  "neon-night-shift": [
    {
      pattern: /\b(?:neon\s+night\s+shift|night\s+shift\s+neon)\b/i,
      weight: 64,
    },
    {
      pattern: /\b(?:cyan|aqua)\s*(?:and|&)\s*(?:magenta|hot[ -]?pink)\s+(?:disc|circle|halo|portrait)\b/i,
      weight: 54,
    },
    { pattern: /\bwet\s+black\s+(?:wall|brick|backdrop)\b/i, weight: 44 },
    {
      pattern: /\bnight\s+(?:headline|title|type)\b.{0,40}\bshift\s+(?:script|handwriting|word)\b/i,
      weight: 52,
    },
  ],
  "glow-in-the-dark": [
    { pattern: /\bneon\s+glow\b/i, weight: 80 },
    { pattern: /\bglow[ -]+in[ -]+the[ -]+dark\b/i, weight: 64 },
    { pattern: /\b(?:blacklight|black[ -]?light|uv|glow)\s+(?:night|party)\b/i, weight: 56 },
    { pattern: /\b(?:fluorescent|neon)\s+(?:body\s+)?paint\b/i, weight: 40 },
    {
      pattern: /\bmulticolor\s+(?:brush|marker|painted)\s+(?:headline|lettering|type)\b/i,
      weight: 48,
    },
  ],
  "punta-cana-sundays": [
    {
      pattern: /\b(?:punta\s+cana\s+sundays?|sundays?\s+(?:in|at)\s+punta\s+cana)\b/i,
      weight: 64,
    },
    { pattern: /\bpunta\s+cana\b/i, weight: 56 },
    {
      pattern: /\b(?:red|orange)\s+(?:and|&)\s+(?:lime|yellow)\s+tropical\s+(?:type|title|flyer)\b/i,
      weight: 48,
    },
    {
      pattern: /\b(?:vertical|side)\s+(?:info|information|date)\s+rail\b/i,
      weight: 34,
    },
  ],
  "baddies-n-bundles": [
    {
      pattern: /\bbaddies\s*(?:n|and|&)\s*bundles\b/i,
      weight: 64,
    },
    { pattern: /\bbaddies\b/i, weight: 52 },
    { pattern: /\b(?:hair|braid|beauty)\s+bundles\b/i, weight: 44 },
    {
      pattern: /\b(?:acid|neon)\s+(?:lime|green)\b.{0,36}\b(?:split|stacked|huge)\s+(?:headline|title|type)\b/i,
      weight: 50,
    },
  ],
  "city-nights": [
    { pattern: /\bcity\s+nights?\b/i, weight: 64 },
    { pattern: /\b(?:red|scarlet)\s+(?:city|skyline|urban)\b/i, weight: 52 },
    { pattern: /\b(?:classic|lowrider|muscle)\s+car\b/i, weight: 44 },
    { pattern: /\b(?:urban|downtown)\s+(?:night|nightlife|party)\b/i, weight: 34 },
  ],
  "pulse": [{ pattern: /\bpulse(?:\s+sunday)?\b/i, weight: 80 }, { pattern: /\bpink\s+statue\b/i, weight: 64 }],
  "bad-girls": [{pattern:/\bbad\s+girls?\b/i,weight:100},{pattern:/\b(girls?|baddies|ladies)\b/i,weight:25}],
  "beat-therapy": [
    { pattern: /\bbeat\s+therapy\b/i, weight: 100 },
    { pattern: /\b(?:tech\s+house|afro\s+house|open\s+format)\b/i, weight: 24 },
    { pattern: /\b(?:house|melodic|dj)\b/i, weight: 12 },
  ],
  "zona-de-perreo": [{ pattern: /\b(?:zona[ -]+de[ -]+perreo|diabla|perreo|little[ -]+monster|chrome[ -]+devil)\b/i, weight: 90 }],
  "summer-sunset": [{ pattern: /\bsummer\s+sunset\b/i, weight: 100 }],
  "diabla-all-white": [{ pattern: /\b(?:diabla\s+all\s+white|all[ -]white\s+affair)\b/i, weight: 100 }],
  "rnb-thursdays": [{ pattern: /\b(?:r\s*&\s*b|rnb|rhythm\s*(?:and|&)\s*blues|roxy\s+lounge)\b/i, weight: 95 }],
  "reggae-jams": [{ pattern: /\b(?:reggae|dancehall|rasta)\b/i, weight: 90 }],
  "amapiano-night": [{ pattern: /\b(?:amapiano|abisco|afrobeats?)\b/i, weight: 90 }],
  "como-una-boa": [{ pattern: /\b(?:como[ -]+una[ -]+boa|boa|latin|reggaeton|salsa|bachata)\b/i, weight: 80 }],
  "i-love-thursday": [{ pattern: /\b(?:i[ -]+love[ -]+thursday|grodify|teddy[ -]+bear)\b/i, weight: 80 }],
  "elite-monday": [{ pattern: /\b(?:elite[ -]+monday|zythos)\b/i, weight: 80 }],
  "we-outside": [{ pattern: /\b(?:we[ -]+outside|deon[’']?s\s+cave)\b/i, weight: 80 }],
  "space-neon": [{ pattern: /\b(?:space\s+neon|astronaut|cosmic)\b/i, weight: 80 }],
  "brunch-saturday": [
    { pattern: /\bbrunch\s+saturday\b|\bsaturday\s+brunch\b/i, weight: 70 },
    { pattern: /\bbrunch\b/i, weight: 35 },
  ],
  "brunch-vibes": [
    { pattern: /\bbrunch\s+vibes\b|\bterrace\s+brunch\b/i, weight: 70 },
    { pattern: /\bbrunch\b/i, weight: 35 },
  ],
  "grey-rave-festival": [
    { pattern: /\b(?:grey|gray)\s+rave\b/i, weight: 64 },
    { pattern: /\brave\s+festival\b/i, weight: 58 },
    { pattern: /\b(?:statue|sculpture)\b.{0,30}\b(?:rave|techno|festival)\b/i, weight: 52 },
    { pattern: /\b(?:pink|magenta)\b.{0,30}\b(?:black|monochrome|statue)\b/i, weight: 38 },
  ],
  "dodge-night-rides": [
    { pattern: /\b(?:dodge|muscle\s+car)\b.{0,36}\b(?:night|rides?|party)\b/i, weight: 64 },
    { pattern: /\bnight\s+rides?\b/i, weight: 60 },
    { pattern: /\b(?:car|automotive)\s+(?:meet|night|party|event)\b/i, weight: 44 },
  ],
};

const COCO_DEFAULT_RANK_BONUS = [34, 21, 13] as const;

function normalizedCocoDirectionContext(context: CocoArtDirectionSelectionContext) {
  return [context.eventName, context.eventDescription]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

const COCO_DIRECTION_NEGATION_WORDS = new Set([
  "avoid",
  "avoiding",
  "don't",
  "exclude",
  "excluding",
  "never",
  "no",
  "not",
  "skip",
  "without",
]);

function cocoDirectionSignalIsNegated(
  briefText: string,
  matchIndex: number,
  matchLength: number
) {
  const nearbyPrefix = briefText.slice(Math.max(0, matchIndex - 72), matchIndex);
  if (/\b(?:anything|everything)\s+(?:but|except)\s*$/i.test(nearbyPrefix)) return true;

  const prefix = briefText.slice(0, matchIndex);
  const resetPattern = /[,.!?;:—–]|\b(?:but|however|instead)\b/gi;
  let scopeStart = Math.max(0, prefix.length - 96);
  for (const reset of prefix.matchAll(resetPattern)) {
    if (reset.index !== undefined) scopeStart = reset.index + reset[0].length;
  }
  const scopeWords = prefix
    .slice(scopeStart)
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];

  for (let index = scopeWords.length - 1; index >= 0; index -= 1) {
    const word = scopeWords[index];
    if (!word || !COCO_DIRECTION_NEGATION_WORDS.has(word)) continue;
    const wordsAfterNegation = scopeWords.slice(index + 1);
    if (wordsAfterNegation[0] === "only" || wordsAfterNegation[0] === "just") continue;
    if (wordsAfterNegation.length <= 6) return true;
    break;
  }

  const nearbySuffix = briefText.slice(matchIndex + matchLength, matchIndex + matchLength + 16);
  return /^\s*(?:[-–—]\s*)?free\b/i.test(nearbySuffix);
}

function cocoDirectionSignalPolarity(briefText: string, pattern: RegExp) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  let positive = false;
  let negative = false;
  for (const match of briefText.matchAll(matcher)) {
    const matchIndex = match.index ?? 0;
    if (cocoDirectionSignalIsNegated(briefText, matchIndex, match[0].length)) {
      negative = true;
    } else {
      positive = true;
    }
  }
  return { negative, positive } as const;
}

/** Rank every eligible direction; a three-item shortlist loses keyword matches. */
export function cocoDirectionKeywordScore(direction: CocoArtDirection, eventName: string): number {
  // Newly registered artwork also gets name-based ranking without needing a
  // second, manually maintained keyword registry. Explicit legacy signals win.
  if (!COCO_DIRECTION_KEYWORD_SIGNALS[direction.id]?.length) {
    const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const name = normalize(direction.name), query = normalize(eventName);
    if (!query) return 0;
    const tokens = new Set(name.split(' '));
    return (` ${name} `.includes(` ${query} `) ? 40 : 0)
      + query.split(' ').filter(word => tokens.has(word)).length * 2;
  }
  return (COCO_DIRECTION_KEYWORD_SIGNALS[direction.id] ?? []).reduce((sum, signal) => {
    const polarity = cocoDirectionSignalPolarity(eventName, signal.pattern);
    return sum + (polarity.negative ? -signal.weight : polarity.positive ? signal.weight : 0);
  }, 0);
}

function cocoDirectionSimilarityPenalty(
  candidate: CocoArtDirection,
  selected: readonly CocoArtDirection[]
) {
  return selected.reduce((penalty, direction) => {
    const sameSquarePattern =
      candidate.layoutByFormat.square.compositionPattern ===
      direction.layoutByFormat.square.compositionPattern;
    const sameSquareLayout =
      candidate.layoutByFormat.square.layoutId === direction.layoutByFormat.square.layoutId;
    const samePersonality = candidate.typographyPersonality === direction.typographyPersonality;
    const sameEffectEnergy =
      candidate.effectsPolicy.intensity === direction.effectsPolicy.intensity;
    return (
      penalty +
      (sameSquarePattern ? 7 : 0) +
      (sameSquareLayout ? 4 : 0) +
      (samePersonality ? 4 : 0) +
      (sameEffectEnergy ? 1 : 0)
    );
  }, 0);
}

/** Public generation surface: exactly the eight recipe-backed directions. */
export const COCO_ART_DIRECTIONS = COCO_CURATED_ART_DIRECTION_LIBRARY;
export const COCO_ART_DIRECTION_IDS = COCO_CURATED_ART_DIRECTION_IDS;

export {
  COCO_CURATED_ART_DIRECTION_IDS,
  COCO_CURATED_ART_DIRECTION_LIBRARY,
  COCO_LAUNCH_ART_DIRECTION_IDS,
  COCO_LAUNCH_ART_DIRECTIONS,
};

export function getCocoLaunchArtDirectionChoices(): typeof COCO_LAUNCH_ART_DIRECTIONS {
  return COCO_LAUNCH_ART_DIRECTIONS;
}

/**
 * Selects three relevant but materially different directions from the complete
 * curated library. The result depends only on the supplied brief: there is no
 * random seed, persistence, or recent-choice state in this selector.
 */
export function selectCocoArtDirectionChoices(
  context: CocoArtDirectionSelectionContext
): CocoArtDirectionChoiceTuple {
  const explicitIntent = resolveCocoCreativeIntent(context);
  const briefText = normalizedCocoDirectionContext(context);
  const neonNightShiftSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["neon-night-shift"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const neonNightShiftRequested =
    neonNightShiftSignals.some((signal) => signal.positive && signal.weight >= 52) &&
    !neonNightShiftSignals.some((signal) => signal.negative);
  const glowInTheDarkSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["glow-in-the-dark"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const glowInTheDarkRequested =
    glowInTheDarkSignals.some((signal) => signal.positive && signal.weight >= 56) &&
    !glowInTheDarkSignals.some((signal) => signal.negative);
  const puntaCanaSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["punta-cana-sundays"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const puntaCanaRequested =
    puntaCanaSignals.some((signal) => signal.positive && signal.weight >= 56) &&
    !puntaCanaSignals.some((signal) => signal.negative);
  const baddiesNBundlesSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["baddies-n-bundles"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const baddiesNBundlesRequested =
    baddiesNBundlesSignals.some((signal) => signal.positive && signal.weight >= 52) &&
    !baddiesNBundlesSignals.some((signal) => signal.negative);
  const cityNightsSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["city-nights"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const cityNightsRequested =
    cityNightsSignals.some((signal) => signal.positive && signal.weight >= 52) &&
    !cityNightsSignals.some((signal) => signal.negative);
  const fashionClubSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["fashion-club-vertical"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const fashionClubRequested =
    fashionClubSignals.some((signal) => signal.positive && signal.weight >= 22) &&
    !fashionClubSignals.some((signal) => signal.negative);
  const ladiesRecipeSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["sensual-night"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const ladiesRecipeRequested =
    ladiesRecipeSignals.some((signal) => signal.positive && signal.weight >= 38) &&
    !ladiesRecipeSignals.some((signal) => signal.negative);
  const rushNightSignals = (COCO_DIRECTION_KEYWORD_SIGNALS["high-energy-club"] ?? []).map(
    (signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    })
  );
  const rushNightRequested =
    rushNightSignals.some((signal) => signal.positive && signal.weight >= 48) &&
    !rushNightSignals.some((signal) => signal.negative);
  // A named recipe or its distinctive visual grammar is more specific than a
  // broad finish instruction such as "premium" or "minimal", so it wins before
  // the recipe-only intent fallbacks below.
  for (const id of ["summer-sunset", "diabla-all-white", "rnb-thursdays", "pulse", "space-neon", "we-outside", "elite-monday", "i-love-thursday", "zona-de-perreo", "amapiano-night", "reggae-jams", "como-una-boa"] as const) {
    const signals = (COCO_DIRECTION_KEYWORD_SIGNALS[id] ?? []).map(signal =>
      cocoDirectionSignalPolarity(briefText, signal.pattern));
    if (signals.some(signal => signal.positive) && !signals.some(signal => signal.negative)) {
      return cocoDirectionChoicesFromIds([id, "neon-night-shift", "high-energy-club"]);
    }
  }
  if (cityNightsRequested) {
    return cocoDirectionChoicesFromIds([
      "city-nights",
      "baddies-n-bundles",
      "high-energy-club",
    ]);
  }
  if (baddiesNBundlesRequested) {
    return cocoDirectionChoicesFromIds([
      "baddies-n-bundles",
      "fashion-club-vertical",
      "sensual-night",
    ]);
  }
  if (puntaCanaRequested) {
    return cocoDirectionChoicesFromIds([
      "punta-cana-sundays",
      "fashion-club-vertical",
      "sensual-night",
    ]);
  }
  if (glowInTheDarkRequested) {
    return cocoDirectionChoicesFromIds([
      "glow-in-the-dark",
      "neon-night-shift",
      "high-energy-club",
    ]);
  }
  if (neonNightShiftRequested) {
    return cocoDirectionChoicesFromIds([
      "neon-night-shift",
      "glow-in-the-dark",
      "high-energy-club",
    ]);
  }
  if (ladiesRecipeRequested) {
    return cocoDirectionChoicesFromIds([
      "sensual-night",
      "fashion-club-vertical",
      "baddies-n-bundles",
    ]);
  }
  if (rushNightRequested) {
    return cocoDirectionChoicesFromIds([
      "high-energy-club",
      "neon-night-shift",
      "glow-in-the-dark",
    ]);
  }
  if (fashionClubRequested) {
    return cocoDirectionChoicesFromIds([
      "fashion-club-vertical",
      "sensual-night",
      "baddies-n-bundles",
    ]);
  }
  if (explicitIntent) {
    return cocoDirectionChoicesFromIds(
      COCO_EXPLICIT_INTENT_DIRECTION_CHOICES[explicitIntent.presetId]
    );
  }

  const nightlifeStyle =
    context.nightlifeStyle &&
    Object.prototype.hasOwnProperty.call(COCO_STYLE_DIRECTION_DEFAULTS, context.nightlifeStyle)
      ? context.nightlifeStyle
      : "general-nightlife";
  const styleDefaults = COCO_STYLE_DIRECTION_DEFAULTS[nightlifeStyle];
  const ranked = COCO_CURATED_ART_DIRECTION_LIBRARY.map((direction, stableIndex) => {
    const defaultRank = styleDefaults.indexOf(direction.id);
    const styleEligible = (direction.eligibleNightlifeStyles as readonly CocoNightlifeStyle[])
      .includes(nightlifeStyle);
    const signalPolarities = (COCO_DIRECTION_KEYWORD_SIGNALS[direction.id] ?? []).map((signal) => ({
      ...cocoDirectionSignalPolarity(briefText, signal.pattern),
      weight: signal.weight,
    }));
    const keywordScore = signalPolarities.reduce(
      (score, signal) => score + (signal.positive ? signal.weight : 0),
      0
    );
    return {
      direction: direction as CocoArtDirection,
      explicitlyNegated: signalPolarities.some((signal) => signal.negative),
      hasPositiveSignal: signalPolarities.some((signal) => signal.positive),
      score:
        (styleEligible ? 30 : 0) +
        (defaultRank >= 0 ? COCO_DEFAULT_RANK_BONUS[defaultRank] : 0) +
        keywordScore * 2,
      stableIndex,
    };
  });

  const selected: CocoArtDirection[] = [];
  const remaining = ranked.filter((candidate) => !candidate.explicitlyNegated);
  while (selected.length < 3 && remaining.length) {
    remaining.sort((left, right) => {
      const leftScore = left.score - cocoDirectionSimilarityPenalty(left.direction, selected);
      const rightScore = right.score - cocoDirectionSimilarityPenalty(right.direction, selected);
      return rightScore - leftScore || left.stableIndex - right.stableIndex;
    });
    const winner = remaining.shift();
    if (winner) selected.push(winner.direction);
  }

  // The curated library is statically guaranteed to contain at least three entries.
  // Keep the tuple construction explicit so callers can rely on exactly three.
  if (!selected[0] || !selected[1] || !selected[2]) {
    throw new Error("Coco requires at least three curated art directions.");
  }
  return [selected[0], selected[1], selected[2]];
}

export function isCocoArtDirectionId(value: unknown): value is CocoArtDirectionId {
  return typeof value === "string" && ART_DIRECTION_BY_ID.has(value as CocoArtDirectionId);
}

export function getCocoArtDirection(
  id: CocoArtDirectionId | string
): CocoArtDirection | undefined {
  return ART_DIRECTION_BY_ID.get(id as CocoArtDirectionId);
}

export function requireCocoArtDirection(id: CocoArtDirectionId | string): CocoArtDirection {
  const direction = getCocoArtDirection(id);
  if (!direction) throw new Error(`Unknown Coco art direction: ${id}`);
  return direction;
}

/** Filters the eight recipe-backed directions by nightlife style. */
export function getCocoArtDirectionsForNightlifeStyle(
  style: CocoNightlifeStyle
): readonly CocoArtDirection[] {
  return COCO_CURATED_ART_DIRECTION_LIBRARY.filter((direction) =>
    (direction.eligibleNightlifeStyles as readonly CocoNightlifeStyle[]).includes(style)
  );
}

/** Searches the complete curated library for future directors and recommendation systems. */
export function getCocoCuratedArtDirectionsForNightlifeStyle(
  style: CocoNightlifeStyle
): readonly CocoArtDirection[] {
  return COCO_CURATED_ART_DIRECTION_LIBRARY.filter((direction) =>
    (direction.eligibleNightlifeStyles as readonly CocoNightlifeStyle[]).includes(style)
  );
}
