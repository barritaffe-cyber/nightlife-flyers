import type {
  CocoNightlifeStyle,
  CocoPhotoSignal,
  CocoStyleDecision,
} from "../intelligence";
import type { CocoMoodProfile } from "../moodDirector";
import type {
  CocoCompositionPatternId,
  CocoCreativeBrief,
  CocoCreativeStoryId,
  CocoTournamentAlign,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentText,
} from "../layoutTournament";
import type {
  CreativeConstraintId,
  ProtectionTarget,
  SceneInterpretation,
  SceneStory,
  TypeField,
} from "../../../coco-scene-interpreter";

export type CocoCreativeIntelligenceInput = {
  backgroundOnlyHero?: boolean;
  eventName: string;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  layoutId?: CocoTournamentLayoutId | null;
  moodProfile?: CocoMoodProfile | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoSignals?: CocoPhotoSignal[];
  scene?: SceneInterpretation | null;
  styleDecision?: CocoStyleDecision | null;
  subjectZone: CocoTournamentRect;
  text: CocoTournamentText;
};

export function buildCocoCreativeBrief(input: CocoCreativeIntelligenceInput): CocoCreativeBrief {
  const text = [
    input.eventName,
    input.text.headline,
    input.text.script,
    input.text.details,
    input.text.details2,
    input.text.subtag,
    input.nightlifeStyle,
    input.moodProfile?.primaryMood,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const scene = input.scene ?? null;
  const sceneComposition = scene?.creativeDecisions.composition;
  const sceneHierarchy = scene?.creativeDecisions.hierarchy;
  const sceneDensity = scene?.creativeDecisions.densityPolicy;
  const sceneConstraints = new Set<CreativeConstraintId>(scene?.constraints.map((constraint) => constraint.id) ?? []);
  const storyId = sceneStoryToCreativeStory(scene?.creativeDecisions.story) ?? inferStory(text, input.moodProfile, input.nightlifeStyle);
  const sceneSubject = scene?.evidence.subjects[0];
  const sceneFace = scene?.evidence.faces[0];
  const subjectPosition = input.hasSubject
    ? sceneSubjectPosition(sceneSubject?.side) ?? sideForRect(input.subjectZone)
    : "none";
  const subjectArea = input.hasSubject ? input.subjectZone.width * input.subjectZone.height : 0;
  const crop = !input.hasSubject
    ? "unknown"
    : sceneCropToBriefCrop(sceneSubject?.crop) ??
      (subjectArea > 3800 || input.subjectZone.width > 46
        ? "close-up"
        : subjectArea > 2300
          ? "medium"
          : "wide");
  const counterweightSide =
    sceneTypeFieldToBriefSide(sceneComposition?.typeField) ??
    counterweightForSubject(subjectPosition, input.backgroundOnlyHero === true);
  const recommendedLayoutId =
    sceneLayoutForTypeField(sceneComposition?.typeField) ??
    recommendedLayoutForCounterweight(counterweightSide);
  const recommendedComposition =
    sceneCompositionPattern(sceneComposition?.preferredPattern) ?? recommendedCompositionForCounterweight(counterweightSide);
  const alignment = sceneComposition?.stackAlignment ?? alignmentForSide(counterweightSide);
  const eventTags = eventCategoryTags(text, storyId);
  const moodTags = uniqueStrings([
    ...eventMoodTags(text, storyId),
    ...(input.moodProfile?.moodTags ?? []),
    input.moodProfile?.primaryMood,
  ]);
  const avoidTags = eventAvoidTags(text, storyId);
  const dominantColors = dominantColorHints(input, text, storyId);
  const headlinePower =
    sceneHierarchy?.headlinePower ?? (recommendedLayoutId === "subject-center" ? 92 : 100);
  const premiumStack = recommendedComposition === "left-premium-stack" || recommendedComposition === "right-premium-stack";
  const accentMaxRatio = sceneHierarchy?.accentMaxRatio ?? (premiumStack ? 0.36 : 0.42);
  const bodyMaxRatio = sceneHierarchy?.bodyMaxRatio ?? (premiumStack ? 0.24 : 0.28);
  const dateMaxRatio = sceneHierarchy?.dateMaxRatio ?? (premiumStack ? 0.22 : 0.24);
  const venueMaxRatio = sceneHierarchy?.venueMaxRatio ?? (premiumStack ? 0.16 : 0.2);
  const colorStory = scene?.creativeDecisions.colorStory;
  const sceneProtectTargets = sceneProtectionTargets(scene?.protectionZones.map((zone) => zone.target) ?? [], eventTags);
  const forbiddenZones = scene?.protectionZones.length
    ? scene.protectionZones.map((zone) => sceneRectToTournamentRect(zone.rect))
    : input.hasSubject && input.faceZone
      ? [insetRect(input.faceZone, -1.5)]
      : undefined;

  return {
    colorStory: {
      accent: colorStory?.accentTone ?? (dominantColors.includes("yellow") ? "champagne lime" : "controlled warm accent"),
      dominant: dominantColors,
      footer: colorStory?.imageLed || dominantColors.includes("green") ? "deep green" : "dark neutral",
      headline:
        colorStory?.headlineTone === "pure-white"
          ? "pure white"
          : dominantColors.includes("yellow")
            ? "champagne yellow"
            : "warm ivory",
      metadata: colorStory?.headlineTone === "pure-white" ? "soft white" : "warm ivory",
    },
    counterweight: {
      reason: counterweightReason(subjectPosition, counterweightSide),
      side: counterweightSide,
    },
    event: {
      avoidTags,
      categoryTags: eventTags,
      moodTags,
    },
    evaluationGoals: [
      "hierarchy",
      "balance",
      "negative-space",
      "premium",
      "readability",
      "energy",
      "mood",
      "brand",
    ],
    eyeFlow: [
      { target: "headline", priority: 1 },
      { target: "accent", priority: 2 },
      ...(input.hasSubject ? [{ target: "subject" as const, priority: 3 }] : []),
      { target: "primaryMeta", priority: input.hasSubject ? 4 : 3 },
      { target: "dateTime", priority: input.hasSubject ? 5 : 4 },
      { target: "venue", priority: input.hasSubject ? 6 : 5 },
    ],
    hero: {
      primary: input.hasSubject ? "subject" : "headline",
      secondary: input.hasSubject ? "headline" : undefined,
      support: input.hasSubject ? ["headline", "drink", "logo", "background"] : ["background", "logo"],
    },
    hierarchy: {
      accent: Math.round(headlinePower * Math.min(accentMaxRatio, 0.42)),
      dateTime: Math.round(headlinePower * dateMaxRatio),
      footer: Math.round(headlinePower * 0.12),
      headline: headlinePower,
      metadata: Math.round(headlinePower * bodyMaxRatio),
      venue: Math.round(headlinePower * venueMaxRatio),
    },
    hierarchyRules: {
      accentMaxRatio,
      bodyMaxRatio,
      dateMaxRatio,
      headlineMustWin: true,
      venueMaxRatio,
    },
    informationArchitecture: [
      { id: "identity", priority: 1, sources: ["headline"], treatment: "hero" },
      { id: "emotion", priority: 2, sources: ["script", "subtag"], treatment: "accent" },
      { id: "primaryMeta", priority: 3, sources: ["details"], treatment: "metadata" },
      { id: "logistics", priority: 3, sources: ["date", "price"], treatment: "metadata" },
      { id: "venue", priority: 4, sources: ["venue"], treatment: "footer" },
      {
        id: "footer",
        priority: 5,
        sources: ["details2", "presenter"],
        treatment: premiumStack ? "muted" : "footer",
      },
    ],
    polishRules: {
      attachBodyToHeadline: true,
      avoidScatteredZones: true,
      mergeSecondaryCopy: sceneDensity?.mergeSecondaryCopy ?? premiumStack,
      preferMetadataOverBodyCopy: true,
      protectFace: input.hasSubject || sceneConstraints.has("protect-critical-features"),
      useOneTypeColumn:
        sceneConstraints.has("single-type-column") ||
        premiumStack ||
        recommendedComposition === "bottom-lockup",
    },
    protection: {
      forbiddenZones,
      protect: input.hasSubject ? sceneProtectTargets : [],
    },
    readingOrder: ["headline", "accent", "primaryMeta", "dateTime", "venue", "secondaryMeta", "footer"],
    recommendedComposition,
    recommendedLayoutId,
    rhythm: {
      accentToMeta: premiumStack ? 7 : 8,
      dateTimeToVenue: premiumStack ? 5 : 8,
      headlineToAccent: premiumStack ? 2 : 4,
      metaToDateTime: premiumStack ? 9 : 16,
    },
    scene: {
      crop,
      dominantColors,
      eyeDirection:
        sceneGazeToBriefEyeDirection(sceneFace?.gaze ?? sceneSubject?.gaze) ??
        (subjectPosition === "right"
          ? "upper-left"
          : subjectPosition === "left"
            ? "upper-right"
            : input.hasSubject
              ? "center"
              : "unknown"),
      lightingSide: subjectPosition === "right" ? "right" : subjectPosition === "left" ? "left" : "unknown",
      lightingTemperature: input.photoSignals?.find((signal) => signal.temperature)?.temperature ?? "neutral",
      moodTags,
      negativeSpace: {
        scale: recommendedLayoutId === "subject-center" ? "medium" : "large",
        side: counterweightSide,
      },
      subjectCount: input.hasSubject ? 1 : 0,
      subjectPosition,
    },
    story: {
      oneLine: storyLineForStory(storyId),
      tags: uniqueStrings([storyId, ...eventTags, ...moodTags]).slice(0, 8),
    },
    storyId,
    typographyColumn: {
      alignment,
      role: counterweightSide === "bottom" ? "bottom-lockup" : counterweightSide === "center" ? "center-anchor" : "counterweight",
      side: counterweightSide,
    },
    visualWeight: {
      body: input.hasSubject ? 14 : 0,
      face: crop === "close-up" ? 42 : input.hasSubject ? 28 : 0,
      headlineTarget: Math.round(headlinePower * 0.82),
      imageSide: input.hasSubject ? 74 : 32,
      subject: input.hasSubject ? clamp(Math.round(subjectArea / 55), 34, 82) : 0,
      supportTextTarget: Math.round(headlinePower * 0.22),
    },
  };
}

function sceneStoryToCreativeStory(story?: SceneStory): CocoCreativeStoryId | null {
  switch (story) {
    case "luxury-tropical-brunch":
    case "premium-ladies-night":
    case "afrobeats-sunset":
    case "rnb-lounge":
    case "throwback-party":
    case "high-energy-club":
    case "general-nightlife":
      return story;
    case "vip-bottle-service":
      return "bottle-service-vip";
    case "latin-night":
    case "pool-day-party":
    case "rooftop-lifestyle":
      return "luxury-tropical-brunch";
    case "hiphop-showcase":
    case "edm-rave":
    case "techno-underground":
      return "high-energy-club";
    case "editorial-fashion":
      return "premium-ladies-night";
    default:
      return null;
  }
}

function sceneCompositionPattern(pattern?: string): CocoCompositionPatternId | null {
  switch (pattern) {
    case "left-premium-stack":
    case "right-premium-stack":
    case "center-poster-stack":
    case "bottom-lockup":
    case "diagonal-energy":
    case "fashion-club-vertical":
    case "golden-hero-editorial":
    case "split-editorial":
      return "split-hero-editorial";
    default:
      return null;
  }
}

function sceneTypeFieldToBriefSide(field?: TypeField): "left" | "right" | "center" | "bottom" | null {
  if (field === "left" || field === "right" || field === "center" || field === "bottom") return field;
  if (field === "top" || field === "split") return "center";
  return null;
}

function sceneLayoutForTypeField(field?: TypeField): CocoTournamentLayoutId | null {
  if (field === "left") return "subject-right";
  if (field === "right") return "subject-left";
  if (field === "center" || field === "top" || field === "bottom" || field === "split") return "subject-center";
  return null;
}

function sceneSubjectPosition(side?: string): "left" | "right" | "center" | null {
  if (side === "left" || side === "right" || side === "center") return side;
  if (side === "full") return "center";
  return null;
}

function sceneCropToBriefCrop(crop?: string): "close-up" | "medium" | "wide" | null {
  if (crop === "close") return "close-up";
  if (crop === "half" || crop === "three-quarter") return "medium";
  if (crop === "full") return "wide";
  return null;
}

function sceneGazeToBriefEyeDirection(
  gaze?: string
): "upper-left" | "upper-right" | "center" | "unknown" | null {
  if (gaze === "up-left" || gaze === "left") return "upper-left";
  if (gaze === "up-right" || gaze === "right") return "upper-right";
  if (gaze === "camera") return "center";
  if (gaze === "unknown") return "unknown";
  return null;
}

function sceneProtectionTargets(
  targets: ProtectionTarget[],
  eventTags: string[]
): CocoCreativeBrief["protection"]["protect"] {
  const protect: CocoCreativeBrief["protection"]["protect"] = [];
  const add = (target: CocoCreativeBrief["protection"]["protect"][number]) => {
    if (!protect.includes(target)) protect.push(target);
  };

  for (const target of targets) {
    if (target === "eyes" || target === "face" || target === "sunglasses" || target === "gaze") add("eyes");
    if (target === "mouth") add("smile");
    if (target === "drink" || target === "product") add("drink");
    if (target === "hair-silhouette") add("hair-silhouette");
  }

  if (eventTags.includes("cocktails")) add("drink");
  add("hair-silhouette");
  add("subject-edge");

  return protect;
}

function sceneRectToTournamentRect(rect: { height: number; width: number; x: number; y: number }): CocoTournamentRect {
  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function inferStory(
  text: string,
  moodProfile?: CocoMoodProfile | null,
  nightlifeStyle?: CocoNightlifeStyle | null
): CocoCreativeStoryId {
  const mood = moodProfile?.primaryMood;
  const style = String(nightlifeStyle ?? "").toLowerCase();
  if (/(mojito|martini|brunch|cocktail|day party|dayparty|tropical)/.test(text)) return "luxury-tropical-brunch";
  if (/(ladies|girls|queen|baddie)/.test(text) || style.includes("ladies")) return "premium-ladies-night";
  if (/(afro|afrobeats|island|sunset)/.test(text) || mood === "afrobeats") return "afrobeats-sunset";
  if (/(r&b|rnb|lounge|soul)/.test(text) || mood === "rnb") return "rnb-lounge";
  if (/(vip|bottle|champagne|luxe|luxury)/.test(text)) return "bottle-service-vip";
  if (/(throwback|old school|90s|2000s|retro)/.test(text)) return "throwback-party";
  if (/(club|party|dj|dance|night|after hours|afterhours)/.test(text)) return "high-energy-club";
  return "general-nightlife";
}

function sideForRect(rect: CocoTournamentRect): "left" | "right" | "center" {
  const center = rect.x + rect.width / 2;
  if (center < 42) return "left";
  if (center > 58) return "right";
  return "center";
}

function counterweightForSubject(
  subjectPosition: "left" | "right" | "center" | "none",
  backgroundOnlyHero: boolean
): "left" | "right" | "center" | "bottom" {
  if (backgroundOnlyHero) return "left";
  if (subjectPosition === "right") return "left";
  if (subjectPosition === "left") return "right";
  return "center";
}

function recommendedLayoutForCounterweight(side: "left" | "right" | "center" | "bottom"): CocoTournamentLayoutId {
  if (side === "left") return "subject-right";
  if (side === "right") return "subject-left";
  return "subject-center";
}

function recommendedCompositionForCounterweight(side: "left" | "right" | "center" | "bottom"): CocoCompositionPatternId {
  if (side === "left") return "left-premium-stack";
  if (side === "right") return "right-premium-stack";
  if (side === "bottom") return "bottom-lockup";
  return "center-poster-stack";
}

function alignmentForSide(side: "left" | "right" | "center" | "bottom"): CocoTournamentAlign {
  if (side === "right") return "right";
  if (side === "center" || side === "bottom") return "center";
  return "left";
}

function counterweightReason(subjectPosition: "left" | "right" | "center" | "none", side: string) {
  if (subjectPosition === "right") return "The subject is visually heavy on the right, so the typography must counterweight from the left.";
  if (subjectPosition === "left") return "The subject is visually heavy on the left, so the typography must counterweight from the right.";
  if (side === "bottom") return "The subject occupies the main image field, so information should lock into the lower composition.";
  return "No strong side subject was found, so the headline becomes the central poster anchor.";
}

function eventCategoryTags(text: string, storyId: CocoCreativeStoryId) {
  const tags: string[] = [];
  if (/(mojito|martini|cocktail|margarita|champagne|bottle)/.test(text)) tags.push("cocktails");
  if (/(brunch|monday|mondaze|day party|dayparty|sunday)/.test(text)) tags.push("brunch", "day-party");
  if (/(tropical|island|afro|afrobeats|latin|salsa|reggaeton)/.test(text)) tags.push("tropical");
  if (/(vip|luxe|luxury|premium|rooftop|lounge)/.test(text)) tags.push("premium");
  if (/(rnb|r&b|smooth|ladies)/.test(text)) tags.push("social");
  if (/(edm|techno|rave|warehouse|underground)/.test(text)) tags.push("club-energy");
  if (storyId === "luxury-tropical-brunch") tags.push("cocktails", "brunch", "tropical", "premium");
  return uniqueStrings(tags.length ? tags : ["nightlife"]);
}

function eventMoodTags(text: string, storyId: CocoCreativeStoryId) {
  const tags: string[] = [];
  if (/(mojito|margarita|tropical|island|summer|pool|day party|dayparty)/.test(text)) tags.push("summer", "tropical", "fun");
  if (/(brunch|lounge|smooth|rnb|r&b|rooftop)/.test(text)) tags.push("relaxed", "social");
  if (/(vip|luxe|luxury|champagne|bottle|premium)/.test(text)) tags.push("premium", "luxury");
  if (/(edm|techno|rave|afterhours)/.test(text)) tags.push("high-energy", "nightclub");
  if (storyId === "luxury-tropical-brunch") tags.push("premium", "summer", "social");
  return uniqueStrings(tags);
}

function eventAvoidTags(text: string, storyId: CocoCreativeStoryId) {
  if (storyId === "luxury-tropical-brunch" || /(mojito|martini|cocktail|brunch|tropical|lounge|rnb|r&b)/.test(text)) {
    return ["edm", "techno", "warehouse", "underground", "diagonal-chaos"];
  }
  if (/(edm|techno|rave|warehouse)/.test(text)) return ["brunch", "soft-script", "day-party"];
  return [];
}

function dominantColorHints(input: CocoCreativeIntelligenceInput, text: string, storyId: CocoCreativeStoryId) {
  const hints = (input.photoSignals ?? [])
    .flatMap((signal) => signal.dominantHints ?? [])
    .map((hint) => hint.toLowerCase());
  if (storyId === "luxury-tropical-brunch" || /(mojito|tropical|island)/.test(text)) hints.push("green", "yellow", "dark gray");
  if (/(champagne|luxe|luxury|vip)/.test(text)) hints.push("gold", "black", "warm white");
  if (/(rave|edm|techno)/.test(text)) hints.push("cyan", "magenta", "black");
  return uniqueStrings(hints).slice(0, 5);
}

function storyLineForStory(storyId: CocoCreativeStoryId) {
  switch (storyId) {
    case "luxury-tropical-brunch":
      return "Tropical brunch with premium cocktails.";
    case "premium-ladies-night":
      return "Premium social nightlife with a glamorous feminine signal.";
    case "afrobeats-sunset":
      return "Warm rhythmic nightlife with sunset energy.";
    case "rnb-lounge":
      return "Smooth lounge nightlife with intimate premium energy.";
    case "bottle-service-vip":
      return "Exclusive VIP nightlife built around luxury signals.";
    case "throwback-party":
      return "Nostalgic party energy with one bold retro hook.";
    case "high-energy-club":
      return "High-energy nightlife built around sound, lights, and crowd momentum.";
    default:
      return "A polished nightlife event with one clear headline story.";
  }
}

function insetRect(rect: CocoTournamentRect, amount: number): CocoTournamentRect {
  return {
    ...rect,
    height: Math.max(1, rect.height - amount * 2),
    width: Math.max(1, rect.width - amount * 2),
    x: rect.x + amount,
    y: rect.y + amount,
  };
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return values
    .map((value) => String(value ?? "").trim())
    .filter((value, index, all) => value && all.indexOf(value) === index);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
