import type {
  ColorStoryDecision,
  DensityDecision,
  EffectDecision,
  HierarchyPolicy,
  MarketingIntent,
  SceneEvidence,
  SceneStory,
  TypographyPolicy,
} from "./types.ts";

export function inferMarketingIntent(evidence: SceneEvidence, story: SceneStory): MarketingIntent {
  const text = evidence.eventText.toLowerCase();
  if (/\bvip\b|\bbottle\b|\btable\b|\bexclusive\b/.test(text)) return "sell-vip";
  if (/\blive\b|\bperformance\b|\bshowcase\b|\bconcert\b|\bartist\b/.test(text)) return "sell-artist";
  if (["luxury-tropical-brunch", "rooftop-lifestyle", "pool-day-party", "premium-ladies-night"].includes(story)) {
    return "sell-lifestyle";
  }
  if (["edm-rave", "techno-underground", "afrobeats-sunset", "latin-night", "hiphop-showcase"].includes(story)) {
    return "sell-music";
  }
  return "sell-event";
}

export function hierarchyForStory(story: SceneStory): HierarchyPolicy {
  const base = {
    accentMaxRatio: 0.44,
    badgeMaxRatio: 0.25,
    bodyMaxRatio: 0.29,
    dateMaxRatio: 0.28,
    headlinePower: 100,
    presenterMaxRatio: 0.16,
    venueMaxRatio: 0.22,
  };
  if (["editorial-fashion", "vip-bottle-service"].includes(story)) {
    return { ...base, accentMaxRatio: 0.36, badgeMaxRatio: 0.18, bodyMaxRatio: 0.23 };
  }
  if (["edm-rave", "hiphop-showcase"].includes(story)) {
    return { ...base, accentMaxRatio: 0.5, bodyMaxRatio: 0.3, dateMaxRatio: 0.34 };
  }
  if (["luxury-tropical-brunch", "rnb-lounge"].includes(story)) {
    return { ...base, accentMaxRatio: 0.42, bodyMaxRatio: 0.25, venueMaxRatio: 0.18 };
  }
  return base;
}

export function typographyPolicyForStory(story: SceneStory): TypographyPolicy {
  switch (story) {
    case "luxury-tropical-brunch":
      return "clean-lifestyle";
    case "premium-ladies-night":
    case "rnb-lounge":
    case "editorial-fashion":
    case "rooftop-lifestyle":
    case "vip-bottle-service":
      return "luxury-serif";
    case "afrobeats-sunset":
    case "latin-night":
      return "organic-rhythmic";
    case "hiphop-showcase":
      return "bold-urban";
    case "throwback-party":
      return "retro-display";
    case "edm-rave":
    case "high-energy-club":
      return "electric-club";
    case "techno-underground":
      return "industrial-minimal";
    default:
      return "editorial-condensed";
  }
}

export function densityForStory(story: SceneStory, evidence: SceneEvidence): DensityDecision {
  const richImage = evidence.image.visualNoise > 0.55 || evidence.image.backgroundComplexity > 0.62;
  let policy: DensityDecision["policy"] = "low";
  if (["vip-bottle-service", "editorial-fashion"].includes(story)) policy = "minimal";
  if (["edm-rave", "hiphop-showcase", "throwback-party"].includes(story)) policy = "medium";
  if (richImage && policy === "medium") policy = "low";

  const settings = {
    minimal: { maxVisibleGroups: 4, maxBodyLines: 2, mergeSecondaryCopy: true, hideLowPriorityCopy: true },
    low: { maxVisibleGroups: 5, maxBodyLines: 3, mergeSecondaryCopy: true, hideLowPriorityCopy: true },
    medium: {
      maxVisibleGroups: 6,
      maxBodyLines: 4,
      mergeSecondaryCopy: evidence.eventText.length > 180,
      hideLowPriorityCopy: false,
    },
    dense: { maxVisibleGroups: 8, maxBodyLines: 6, mergeSecondaryCopy: false, hideLowPriorityCopy: false },
  }[policy];

  return {
    policy,
    ...settings,
    reason: richImage
      ? "The image already carries visual complexity, so copy density must remain controlled."
      : `The ${story} story supports ${policy} information density.`,
  };
}

export function effectsForStory(story: SceneStory, evidence: SceneEvidence): EffectDecision {
  const richImage = evidence.image.visualNoise > 0.55 || evidence.image.depth > 0.65 || evidence.image.saturation > 0.72;
  let policy: EffectDecision["policy"] = "moderate";
  if (["luxury-tropical-brunch", "vip-bottle-service", "editorial-fashion", "rnb-lounge"].includes(story)) {
    policy = "restrained";
  }
  if (["edm-rave", "high-energy-club"].includes(story)) policy = "high-energy";
  if (story === "techno-underground") policy = "cinematic";
  if (richImage && policy !== "high-energy") policy = "restrained";

  const settings = {
    none: { blur: 0, colorCast: 0, glow: 0, particles: 0, shadow: 0.15, texture: 0, vignette: 0.1 },
    restrained: { blur: 0.03, colorCast: 0.12, glow: 0.1, particles: 0, shadow: 0.32, texture: 0.08, vignette: 0.22 },
    moderate: { blur: 0.08, colorCast: 0.22, glow: 0.24, particles: 0.12, shadow: 0.42, texture: 0.18, vignette: 0.28 },
    cinematic: { blur: 0.12, colorCast: 0.3, glow: 0.3, particles: 0.16, shadow: 0.5, texture: 0.24, vignette: 0.34 },
    "high-energy": { blur: 0.15, colorCast: 0.38, glow: 0.46, particles: 0.3, shadow: 0.54, texture: 0.3, vignette: 0.3 },
  }[policy];

  return {
    policy,
    ...settings,
    reason: richImage
      ? "The image already supplies atmosphere, color, and energy; effects must not compete."
      : `The ${story} story supports a ${policy} effects policy.`,
  };
}

export function colorStoryForScene(story: SceneStory, evidence: SceneEvidence): ColorStoryDecision {
  const imageLed = evidence.image.dominantColors.length >= 2;
  if (story === "luxury-tropical-brunch") {
    return {
      id: imageLed ? "image-led" : "tropical-emerald",
      accentTone: "lime",
      dominantRole: "image",
      headlineTone: "warm-ivory",
      imageLed: true,
      preserveSkinTone: true,
      reason: "Use tropical greens and warm highlights; keep typography warm and restrained.",
      saturationPolicy: "balanced",
    };
  }
  if (story === "vip-bottle-service") {
    return {
      id: "champagne-black",
      accentTone: "gold",
      dominantRole: "background",
      headlineTone: "warm-ivory",
      imageLed,
      preserveSkinTone: true,
      reason: "Black, champagne, and warm ivory signal controlled luxury.",
      saturationPolicy: "restrained",
    };
  }
  if (story === "premium-ladies-night") {
    return {
      id: "rose-glamour",
      accentTone: "rose",
      dominantRole: "image",
      headlineTone: "warm-ivory",
      imageLed,
      preserveSkinTone: true,
      reason: "Use rose or plum as a controlled accent.",
      saturationPolicy: "balanced",
    };
  }
  if (story === "rnb-lounge") {
    return {
      id: "burgundy-intimate",
      accentTone: "gold",
      dominantRole: "image",
      headlineTone: "warm-ivory",
      imageLed,
      preserveSkinTone: true,
      reason: "Deep warm tones and low saturation support intimacy.",
      saturationPolicy: "restrained",
    };
  }
  if (["edm-rave", "high-energy-club"].includes(story)) {
    return {
      id: "electric-night",
      accentTone: "electric",
      dominantRole: "background",
      headlineTone: "pure-white",
      imageLed,
      preserveSkinTone: true,
      reason: "Use one electric accent against a dark field.",
      saturationPolicy: "vivid",
    };
  }
  if (story === "techno-underground") {
    return {
      id: "industrial-monochrome",
      accentTone: "image-derived",
      dominantRole: "background",
      headlineTone: "pure-white",
      imageLed,
      preserveSkinTone: true,
      reason: "Monochrome supports industrial restraint.",
      saturationPolicy: "restrained",
    };
  }
  if (story === "throwback-party") {
    return {
      id: "retro-pop",
      accentTone: "electric",
      dominantRole: "headline",
      headlineTone: "accent",
      imageLed,
      preserveSkinTone: true,
      reason: "One memorable retro accent should lead.",
      saturationPolicy: "vivid",
    };
  }
  return {
    id: imageLed ? "image-led" : "warm-premium",
    accentTone: "image-derived",
    dominantRole: "image",
    headlineTone: "warm-ivory",
    imageLed,
    preserveSkinTone: true,
    reason: "Let the image lead the palette.",
    saturationPolicy: "balanced",
  };
}
