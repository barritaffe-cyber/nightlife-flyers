import { runCocoConceptTournament } from "../conceptDirector/engine.ts";
import { directCocoEffects } from "../effectsDirector/index.ts";
import type { CocoEffectsDecision } from "../effectsDirector/types.ts";
import { buildCocoRenderPlan } from "../renderPlan/index.ts";
import { buildCocoSceneInterpretation } from "../sceneInterpreterAdapter.ts";
import { buildConceptTypographyStack } from "../typographyStack/buildConceptTypographyStack.ts";
import type { CocoTypographyStackModel } from "../typographyStack/types.ts";
import {
  shouldRenderSource,
  toCompositionAuthority as toSceneCompositionAuthority,
  toEffectsAuthority as toSceneEffectsAuthority,
  toPaletteAuthority as toScenePaletteAuthority,
  toTypographyAuthority as toSceneTypographyAuthority,
} from "../../../coco-scene-interpreter/downstream.ts";
import {
  directCocoCreativeConcept,
  toCompositionAuthority as toCreativeCompositionAuthority,
  toCopyArchitectureAuthority,
  toEffectsAuthority as toCreativeEffectsAuthority,
  toPaletteAuthority as toCreativePaletteAuthority,
  toTypographyAuthority as toCreativeTypographyAuthority,
} from "../../../coco-creative-director/index.ts";
import {
  directCocoComposition,
  toRendererAuthority as toCompositionRendererAuthority,
  toTypographyStackAuthority as toCompositionTypographyStackAuthority,
} from "../../../coco-composition-director/index.ts";
import {
  architectCocoCopy,
  buildCopyRenderModel,
} from "../../../coco-copy-architect/index.ts";
import {
  buildTypographyRenderModel,
  directCocoTypography,
} from "../../../coco-typography-director/index.ts";
import {
  buildColorRenderModel,
  directCocoColor,
} from "../../../coco-color-director/index.ts";
import { directCocoArtwork } from "../../../coco-art-director/index.ts";
import { runCocoCritiqueLoop } from "../../../coco-critique-loop/index.ts";
import type {
  CocoPipelineInput,
  CocoSceneAuthority,
  CocoPipelineStage,
  CocoPipelineStageId,
  CocoPipelineState,
} from "./types.ts";
import type { CocoConceptEffectsLike, CocoConceptPaletteLike, CocoFlyerConcept } from "../conceptDirector/types.ts";
import type { CocoConceptDirection } from "../conceptDirector/directions.ts";
import { getCocoArtDirection } from "../artDirections/index.ts";
import type { CocoArtDirection } from "../artDirections/types.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../../../lib/recipes/fashionClubVertical.ts";
import type {
  CocoTypographyDecision,
  TypePersonality,
  TypographyLayerDecision,
  TypographyTreatment,
} from "../typographyDirector/types.ts";
import type {
  CocoCompositionBlock,
  CocoCompositionPatternId,
  CocoCompositionRole,
  CocoCompositionSource,
  CocoCompositionSystem,
  CocoCopyTreatment,
  CocoCreativeBrief,
  CocoCreativeStoryId,
  CocoInformationGroup,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentText,
} from "../layoutTournament/types.ts";
import type {
  CreativeDirection,
  CreativeEventInput,
  SignatureMove,
} from "../../../coco-creative-director/index.ts";
import type {
  CompositionCandidate,
  CompositionDirectorInput,
  CompositionDirectorResult,
  CompositionFamily,
  CompositionRole as DirectedCompositionRole,
  CompositionSource as DirectedCompositionSource,
  PercentRect as CompositionPercentRect,
  SubjectGeometry,
} from "../../../coco-composition-director/index.ts";
import type {
  CopyArchitectInput,
  CopyArchitectResult,
  CopyRenderItem,
  CopyRenderModel,
  CopySource,
} from "../../../coco-copy-architect/index.ts";
import type {
  AvailableFontsInput,
  TypographyDirectorInput,
  TypographyDirectorResult,
  TypographyLayer,
  TypographyPersonality,
  TypographyRole,
  TypographySystem,
} from "../../../coco-typography-director/index.ts";
import type {
  ColorDirectorInput,
  ColorDirectorResult,
  ColorRenderModel,
  ColorRole,
  PalettePolicy,
} from "../../../coco-color-director/index.ts";
import type {
  ArtDirectorInput,
  ArtDirectorResult,
  CompositionLike as ArtDirectorCompositionLike,
  CopyArchitectureLike as ArtDirectorCopyArchitectureLike,
  EffectsLike as ArtDirectorEffectsLike,
  TypographyLike as ArtDirectorTypographyLike,
} from "../../../coco-art-director/index.ts";
import type {
  CritiqueEvaluation,
  CritiqueFinding,
  CritiqueLoopInput,
  CritiqueLoopResult,
  CritiqueScore,
  RenderedSnapshot as CritiqueRenderedSnapshot,
} from "../../../coco-critique-loop/index.ts";
import type {
  CocoSignatureMove,
  CocoSignatureMoveId,
  CocoSignatureMoveTarget,
} from "../signatureMove/types.ts";

const ORDER: CocoPipelineStageId[] = [
  "scene-interpreter",
  "creative-director",
  "composition-director",
  "copy-architect",
  "typography-director",
  "color-director",
  "typography-stack",
  "effects-director",
  "layout-tournament",
  "renderer",
  "art-director",
  "critique-loop",
];

type SelectedDirectionLayoutContract = {
  alignment: CreativeDirection["composition"]["alignment"];
  compositionPattern: CocoCompositionPatternId;
  density: CreativeDirection["informationDensity"];
  layoutId: CocoTournamentLayoutId;
  safeMarginPct: number;
};

function applySelectedConceptVisualContract(
  base: CreativeDirection,
  direction: CocoConceptDirection,
  format: CocoTournamentFormat,
  curated: CocoArtDirection | null
): CreativeDirection {
  const layout = selectedDirectionLayout(direction, format, curated);
  const typography = selectedDirectionTypography(base.typography, direction);
  const palette = selectedDirectionPalette(base.palette, direction, curated);
  const effects = selectedDirectionEffects(base.effects, direction, curated);
  const hierarchy = selectedDirectionHierarchy(base.hierarchy, direction);
  const signatureMove = selectedDirectionSignatureMove(base.signatureMove, direction);
  const fashionClubVertical = layout.compositionPattern === "fashion-club-vertical";
  const goldenHeroEditorial = layout.compositionPattern === "golden-hero-editorial";
  const typeField = fashionClubVertical
    ? "right"
    : typeFieldForLayoutId(layout.layoutId);

  return {
    ...base,
    composition: {
      ...base.composition,
      alignment: layout.alignment,
      family: creativeCompositionFamilyForPattern(layout.compositionPattern),
      oneColumn: !fashionClubVertical && !goldenHeroEditorial,
      overlapPolicy:
        curated?.subjectPolicy.headlineOverlap === "none"
          ? "none"
          : direction.layoutStyle === "asymmetric" ||
              direction.layoutStyle === "bold-center" ||
              fashionClubVertical
            ? "controlled"
            : "subtle",
      protectSceneZones: true,
      reason: `Selected concept direction ${direction.id} requires ${layout.compositionPattern}; scene protection remains a hard gate.`,
      stackRect: fashionClubVertical
        ? fashionClubVerticalStackRect(format)
        : goldenHeroEditorial
          ? goldenHeroEditorialStackRect(format)
        : stackRectForSelectedLayout(layout.layoutId, layout.safeMarginPct),
      typeField,
    },
    creativeRisk: selectedDirectionRisk(direction),
    effects,
    emotionalGoal: selectedDirectionEmotion(direction),
    hierarchy,
    id: `concept-direction:${direction.id}`,
    informationDensity: layout.density,
    name: direction.name,
    palette,
    posterDNA: selectedDirectionPosterDna(direction),
    posterIdentity: selectedDirectionPosterIdentity(direction),
    reasoning: [
      `User selected ${direction.name} as the authoritative visual contract.`,
      ...base.reasoning,
    ],
    signatureMove,
    typography,
    visualEnergy: selectedDirectionEnergy(direction),
  };
}

function selectedDirectionLayout(
  direction: CocoConceptDirection,
  format: CocoTournamentFormat,
  curated: CocoArtDirection | null
): SelectedDirectionLayoutContract {
  const curatedLayout = curated?.layoutByFormat[format];
  // The selected concept remains authoritative when it explicitly promises
  // a side-specific hero relationship. Cinematic Lounge's concept contract
  // is right-hero/left-type, while its older curated library entry still
  // says subject-center. Consuming that stale entry changed the user's
  // selected direction into a different layout. Authored recipe directions
  // with matching layout IDs continue to use their full curated contract below.
  const conflictsWithExplicitHeroSide = Boolean(
    curatedLayout &&
      direction.layoutStyle === "right-hero-left-text" &&
      curatedLayout.layoutId !== direction.layoutId
  );
  if (curatedLayout && conflictsWithExplicitHeroSide) {
    return {
      alignment: "left",
      compositionPattern: "split-hero-editorial",
      density: curatedLayout.density,
      layoutId: direction.layoutId,
      safeMarginPct: curatedLayout.safeMarginPct,
    };
  }
  if (curatedLayout && !conflictsWithExplicitHeroSide) {
    return {
      alignment: curatedLayout.alignment,
      compositionPattern: curatedLayout.compositionPattern,
      density: curatedLayout.density,
      layoutId: curatedLayout.layoutId,
      safeMarginPct: curatedLayout.safeMarginPct,
    };
  }

  const compositionPattern: CocoCompositionPatternId =
    direction.layoutStyle === "vertical-editorial"
      ? "fashion-club-vertical"
      : direction.layoutStyle === "asymmetric"
      ? "diagonal-energy"
      : direction.layoutStyle === "spacious" || direction.layoutStyle === "clean-grid"
        ? "split-hero-editorial"
        : direction.layoutStyle === "right-hero-left-text"
          ? "left-premium-stack"
          : "center-poster-stack";
  const typeField = typeFieldForLayoutId(direction.layoutId);

  return {
    alignment: typeField === "right" ? "right" : typeField === "center" ? "center" : "left",
    compositionPattern,
    density:
      direction.layoutStyle === "clean-grid"
        ? "minimal"
        : direction.layoutStyle === "bold-center" ||
            direction.layoutStyle === "asymmetric" ||
            direction.layoutStyle === "vertical-editorial"
          ? "medium"
          : "low",
    layoutId: direction.layoutId,
    safeMarginPct: direction.layoutStyle === "bold-center" ? 4 : 5,
  };
}

function selectedCompositionFamilyFor(
  direction: CocoConceptDirection,
  format: CocoTournamentFormat,
  curated: CocoArtDirection | null
): CompositionFamily {
  return compositionFamilyForSelectedPattern(
    selectedDirectionLayout(direction, format, curated).compositionPattern
  );
}

function compositionFamilyForSelectedPattern(pattern: CocoCompositionPatternId): CompositionFamily {
  if (pattern === "split-hero-editorial") return "split-editorial";
  return pattern;
}

function creativeCompositionFamilyForPattern(
  pattern: CocoCompositionPatternId
): CreativeDirection["composition"]["family"] {
  const family = compositionFamilyForSelectedPattern(pattern);
  if (family === "fashion-club-vertical") return "full-bleed-type";
  return family === "center-hero-event-poster"
    ? "center-poster-stack"
    : family as CreativeDirection["composition"]["family"];
}

function typeFieldForLayoutId(
  layoutId: CocoTournamentLayoutId
): CreativeDirection["composition"]["typeField"] {
  if (layoutId === "subject-right") return "left";
  if (layoutId === "subject-left") return "right";
  return "center";
}

function stackRectForSelectedLayout(
  layoutId: CocoTournamentLayoutId,
  safeMarginPct: number
): CreativeDirection["composition"]["stackRect"] {
  const margin = Math.max(4, Math.min(10, safeMarginPct));
  if (layoutId === "subject-right") {
    return { height: 100 - margin * 2, width: 42, x: margin, y: margin };
  }
  if (layoutId === "subject-left") {
    return { height: 100 - margin * 2, width: 42, x: 100 - margin - 42, y: margin };
  }
  return {
    height: 100 - margin * 2,
    width: 100 - margin * 2,
    x: margin,
    y: margin,
  };
}

function fashionClubVerticalStackRect(
  format: CocoTournamentFormat
): CreativeDirection["composition"]["stackRect"] {
  const column = getFashionClubVerticalFormatRecipe(format).textColumn;
  return { ...column };
}

function goldenHeroEditorialStackRect(
  format: CocoTournamentFormat
): CreativeDirection["composition"]["stackRect"] {
  void format;
  return { height: 88, width: 48, x: 4, y: 6 };
}

function selectedDirectionTypography(
  base: CreativeDirection["typography"],
  direction: CocoConceptDirection
): CreativeDirection["typography"] {
  const headlinePersonality = selectedHeadlinePersonality(direction.typePersonality);
  const energetic = direction.typePersonality === "nightclub" || direction.typePersonality === "aggressive";
  const serif = headlinePersonality === "luxury-serif" || headlinePersonality === "fashion-serif";

  return {
    ...base,
    accentPersonality:
      direction.typePersonality === "nightclub"
        ? "electric-display"
        : direction.typePersonality === "aggressive"
          ? "industrial-minimal"
          : direction.id === "golden-hero-editorial"
            ? "organic-script"
          : direction.typePersonality === "elegant"
            ? "fashion-serif"
            : "clean-grotesk",
    allowScriptAccent: !energetic,
    bodyCase: energetic ? "uppercase" : "sentence",
    bodyLineHeight: energetic ? 0.94 : 1.08,
    bodyPersonality: energetic ? "industrial-minimal" : "clean-grotesk",
    bodyTracking: energetic ? 0.06 : 0.02,
    headlinePersonality,
    headlineTreatment:
      direction.id === "fashion-club-vertical"
        ? "serif-luxury"
        : direction.effectsStyle === "grain-glitch"
        ? "distressed"
        : direction.effectsStyle === "analog-glow" ||
            direction.effectsStyle === "light-beams" ||
            direction.effectsStyle === "soft-glow"
          ? "glow"
          : serif
            ? "serif-luxury"
            : "clean",
    maxFontFamilies: energetic ? 3 : 2,
    reason: `Typography follows the selected ${direction.name} ${direction.typePersonality} contract.`,
    trackingPolicy: energetic ? "tight" : serif ? "wide" : "neutral",
  };
}

function selectedHeadlinePersonality(
  type: TypePersonality
): CreativeDirection["typography"]["headlinePersonality"] {
  if (type === "editorial") return "fashion-serif";
  if (type === "luxury" || type === "elegant") return "luxury-serif";
  if (type === "nightclub" || type === "festival") return "electric-display";
  if (type === "aggressive") return "urban-heavy";
  if (type === "minimal") return "industrial-minimal";
  if (type === "throwback") return "retro-display";
  if (type === "afrobeats" || type === "latin") return "humanist-lifestyle";
  return "condensed-editorial";
}

function selectedDirectionPalette(
  base: CreativeDirection["palette"],
  direction: CocoConceptDirection,
  curated: CocoArtDirection | null
): CreativeDirection["palette"] {
  const policy = palettePolicyForSelectedDirection(direction);
  const imageLed = curated ? curated.palettePolicy.source === "image-aware" : ![
    "black-electric",
    "mono-accent",
  ].includes(direction.paletteStyle);
  const saturation = curated?.palettePolicy.saturation ?? (
    direction.paletteStyle === "neon-contrast"
      ? "vivid"
      : direction.paletteStyle === "champagne-black" || direction.paletteStyle === "mono-accent"
        ? "restrained"
        : "balanced"
  );
  const tones = selectedPaletteTones(policy);

  return {
    ...base,
    accentTone: tones.accent,
    dominantRole: imageLed ? "image" : "background",
    headlineTone: tones.headline,
    imageLed,
    maxStrongColors: curated?.palettePolicy.maxStrongColors ?? (saturation === "vivid" ? 3 : 2),
    neutralTone: tones.neutral,
    policy,
    preserveSkinTone: curated?.palettePolicy.preserveSkinTone ?? true,
    reason: `Palette policy ${policy} is required by selected direction ${direction.id}.`,
    saturation,
  };
}

function palettePolicyForSelectedDirection(direction: CocoConceptDirection): PalettePolicy {
  if (direction.paletteStyle === "champagne-black") return "champagne-black";
  if (direction.paletteStyle === "neon-contrast") return "electric-night";
  if (direction.paletteStyle === "deep-red-gold") return "warm-premium";
  if (direction.paletteStyle === "burgundy-rose") return "burgundy-intimate";
  if (direction.paletteStyle === "black-electric") return "industrial-monochrome";
  if (direction.paletteStyle === "tropical-emerald") return "tropical-emerald";
  if (direction.paletteStyle === "retro-pop") return "retro-pop";
  return "neutral-editorial";
}

function selectedPaletteTones(policy: PalettePolicy) {
  if (policy === "champagne-black") {
    return { accent: "champagne-gold", headline: "warm-ivory", neutral: "soft-champagne" };
  }
  if (policy === "electric-night") {
    return { accent: "electric-cyan", headline: "cold-white", neutral: "cool-gray" };
  }
  if (policy === "industrial-monochrome") {
    return { accent: "electric-red", headline: "hard-white", neutral: "steel-gray" };
  }
  if (policy === "burgundy-intimate") {
    return { accent: "dusty-rose", headline: "warm-ivory", neutral: "muted-rose" };
  }
  if (policy === "warm-premium") {
    return { accent: "antique-gold", headline: "warm-ivory", neutral: "warm-gray" };
  }
  if (policy === "tropical-emerald") {
    return { accent: "citrus-lime", headline: "warm-ivory", neutral: "sandstone" };
  }
  if (policy === "retro-pop") {
    return { accent: "retro-magenta", headline: "cream-white", neutral: "warm-taupe" };
  }
  return { accent: "single-accent", headline: "neutral-white", neutral: "mid-gray" };
}

function selectedDirectionEffects(
  base: CreativeDirection["effects"],
  direction: CocoConceptDirection,
  curated: CocoArtDirection | null
): CreativeDirection["effects"] {
  const policy = curated?.effectsPolicy.intensity ?? (
    direction.effectsStyle === "light-beams"
      ? "high-energy"
      : direction.effectsStyle === "grain-glitch" ||
          direction.effectsStyle === "haze-vignette" ||
          direction.effectsStyle === "soft-bloom"
        ? "moderate"
        : "restrained"
  );
  const energetic = policy === "high-energy";
  const textured = direction.effectsStyle === "grain-glitch";
  const hazy = direction.effectsStyle === "haze-vignette" || direction.effectsStyle === "sunset-haze";
  const blooming = direction.effectsStyle === "soft-bloom" || direction.effectsStyle === "analog-glow";

  return {
    ...base,
    colorCast: energetic ? 0.2 : textured ? 0.1 : 0.08,
    maxBlur: hazy ? 0.22 : energetic ? 0.12 : 0.08,
    maxGlow: energetic ? 0.38 : blooming ? 0.24 : 0.16,
    maxParticles: energetic ? 0.14 : textured ? 0.06 : 0,
    maxShadow: energetic || textured ? 0.18 : 0.12,
    maxTexture: textured ? 0.28 : energetic ? 0.1 : 0.06,
    oneSignatureEffect: curated?.effectsPolicy.oneSignatureEffect ?? true,
    policy,
    reason: `Effects follow selected direction ${direction.id}/${direction.effectsStyle}.`,
    vignette: hazy ? 0.3 : textured ? 0.16 : 0.1,
  };
}

function selectedDirectionHierarchy(
  base: CreativeDirection["hierarchy"],
  direction: CocoConceptDirection
): CreativeDirection["hierarchy"] {
  const energetic = direction.typePersonality === "nightclub" || direction.typePersonality === "aggressive";
  const minimal = direction.typePersonality === "minimal";
  const fashionClubVertical = direction.id === "fashion-club-vertical";
  const fashionHierarchy = FASHION_CLUB_VERTICAL_RECIPE.runtime.hierarchy;
  const goldenHeroEditorial = direction.id === "golden-hero-editorial";
  return {
    ...base,
    accentMaxRatio: goldenHeroEditorial
      ? 0.56
      : fashionClubVertical
        ? fashionHierarchy.accentPowerMaxRatio
        : energetic
          ? 0.46
          : 0.38,
    badgeMaxRatio: energetic ? 0.26 : 0.2,
    bodyMaxRatio: fashionClubVertical
      ? fashionHierarchy.bodyPowerMaxRatio
      : goldenHeroEditorial
        ? 0.22
        : minimal
          ? 0.22
          : energetic
            ? 0.28
            : 0.25,
    dateMaxRatio: energetic ? 0.28 : 0.24,
    headlineMustWinBy: fashionClubVertical
      ? 1 / Math.max(
          fashionHierarchy.accentPowerMaxRatio,
          fashionHierarchy.bodyPowerMaxRatio,
          fashionHierarchy.metadataPowerMaxRatio
        )
      : goldenHeroEditorial
        ? 1.8
        : energetic
          ? 1.7
          : 1.9,
    headlinePower: fashionClubVertical
      ? fashionHierarchy.headlinePowerMin
      : goldenHeroEditorial || energetic
        ? 100
        : minimal
          ? 90
          : 96,
    presenterMaxRatio: 0.14,
    venueMaxRatio: energetic ? 0.24 : 0.21,
  };
}

function selectedDirectionSignatureMove(
  base: CreativeDirection["signatureMove"],
  direction: CocoConceptDirection
): CreativeDirection["signatureMove"] {
  const move: CreativeDirection["signatureMove"]["move"] =
    direction.id === "fashion-club-vertical"
      ? "vertical-type-rail"
      : direction.id === "golden-hero-editorial"
        ? "editorial-spacing"
      : direction.id === "high-energy-club"
      ? "single-electric-glow"
      : direction.id === "retro-celebration"
        ? "single-electric-glow"
        : direction.id === "tropical-rooftop"
          ? "diagonal-accent"
      : direction.id === "underground-edge"
        ? "diagonal-accent"
        : direction.id === "sensual-night"
          ? "luxury-serif-scale"
          : direction.id === "cinematic-lounge"
            ? "subject-type-depth"
            : "editorial-spacing";
  return {
    ...base,
    fallback: "editorial-spacing",
    intensity:
      direction.id === "fashion-club-vertical" ||
      direction.id === "high-energy-club" ||
      direction.id === "retro-celebration" ||
      direction.id === "underground-edge"
        ? "bold"
        : "medium",
    move,
    parameters: { selectedDirectionId: direction.id },
    reason: `Signature move ${move} belongs to selected direction ${direction.id}.`,
    target:
      move === "subject-type-depth"
        ? "subject"
        : move === "diagonal-accent"
          ? "accent"
          : move === "vertical-type-rail"
            ? "full-stack"
            : "headline",
  };
}

function selectedDirectionPosterIdentity(
  direction: CocoConceptDirection
): CreativeDirection["posterIdentity"] {
  if (direction.id === "fashion-club-vertical") return "fashion-campaign";
  if (direction.id === "golden-hero-editorial") return "fashion-campaign";
  if (direction.id === "luxury-editorial") return "luxury-editorial";
  if (direction.id === "high-energy-club") return "high-energy-club";
  if (direction.id === "underground-edge") return "underground-industrial";
  if (direction.id === "cinematic-lounge") return "cinematic-event";
  if (direction.id === "modern-minimal") return "minimal-event";
  if (direction.id === "tropical-rooftop") return "organic-rhythmic";
  if (direction.id === "retro-celebration") return "retro-cultural";
  return "fashion-campaign";
}

function selectedDirectionPosterDna(
  direction: CocoConceptDirection
): CreativeDirection["posterDNA"] {
  if (direction.id === "luxury-editorial") return "editorial-fashion";
  if (direction.id === "golden-hero-editorial") return "tropical-lifestyle";
  if (direction.id === "high-energy-club") return "music-festival";
  if (direction.id === "underground-edge") return "underground-rave";
  if (direction.id === "cinematic-lounge") return "cinematic-key-art";
  if (direction.id === "modern-minimal") return "minimal-swiss";
  if (direction.id === "tropical-rooftop") return "tropical-lifestyle";
  if (direction.id === "retro-celebration") return "retro-era";
  return "editorial-fashion";
}

function selectedDirectionEmotion(
  direction: CocoConceptDirection
): CreativeDirection["emotionalGoal"] {
  if (direction.id === "fashion-club-vertical") return "fashion-forward";
  if (direction.id === "golden-hero-editorial") return "aspirational";
  if (direction.id === "luxury-editorial") return "exclusive";
  if (direction.id === "high-energy-club") return "energetic";
  if (direction.id === "underground-edge") return "underground";
  if (direction.id === "cinematic-lounge") return "intimate";
  if (direction.id === "modern-minimal") return "aspirational";
  if (direction.id === "tropical-rooftop") return "relaxed-luxury";
  if (direction.id === "retro-celebration") return "nostalgic";
  return "sensual";
}

function selectedDirectionEnergy(
  direction: CocoConceptDirection
): CreativeDirection["visualEnergy"] {
  if (direction.id === "fashion-club-vertical") return "high";
  if (direction.id === "golden-hero-editorial") return "medium";
  if (direction.id === "high-energy-club") return "explosive";
  if (direction.id === "underground-edge") return "high";
  if (direction.id === "retro-celebration") return "high";
  if (direction.id === "luxury-editorial" || direction.id === "modern-minimal") return "low";
  return "medium";
}

function selectedDirectionRisk(
  direction: CocoConceptDirection
): CreativeDirection["creativeRisk"] {
  if (direction.id === "fashion-club-vertical") return "expressive";
  if (direction.id === "golden-hero-editorial") return "expressive";
  if (direction.id === "high-energy-club" || direction.id === "underground-edge") return "bold";
  if (
    direction.id === "retro-celebration" ||
    direction.id === "sensual-night" ||
    direction.id === "tropical-rooftop"
  ) return "expressive";
  if (direction.id === "modern-minimal") return "safe";
  return "controlled";
}

export function runCocoPipeline<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
>(input: CocoPipelineInput<TPalette, TEffects>): CocoPipelineState<TPalette, TEffects> {
  const suppliedCritiqueLoop = input.critiqueLoop ?? null;
  const sceneImageAnalysis = input.sceneInput.compositionMap?.sceneImageAnalysis ?? null;
  const scene = buildCocoSceneInterpretation(input.sceneInput);
  const sceneAuthority = scene ? buildSceneAuthority(scene, sceneImageAnalysis) : null;
  const creativeDirector = scene
    ? directCocoCreativeConcept({
        event: buildCreativeEventInput(input),
        scene,
      })
    : null;
  const sceneCreativeDirection = creativeDirector?.winner ?? null;
  const tournamentBrief = sceneCreativeDirection && scene
    ? creativeDirectionToBrief(sceneCreativeDirection, scene, input)
    : null;
  const selectedDirectionId =
    input.selectedDirectionId ?? input.conceptInput.selectedDirectionId ?? null;
  const conceptTournament = runCocoConceptTournament<TPalette, TEffects>({
    ...input.conceptInput,
    ...(tournamentBrief ? { chooseBrief: () => tournamentBrief } : {}),
    scene,
    selectedDirectionId,
  });
  const baseWinner = conceptTournament.winner;
  const selectedDirectionIsWinner = Boolean(
    selectedDirectionId && baseWinner.direction.id === selectedDirectionId
  );
  const selectedArtDirection = selectedDirectionIsWinner
    ? getCocoArtDirection(baseWinner.direction.id) ?? null
    : null;
  const creativeDirection = selectedDirectionIsWinner && sceneCreativeDirection
    ? applySelectedConceptVisualContract(
        sceneCreativeDirection,
        baseWinner.direction,
        input.conceptInput.format,
        selectedArtDirection
      )
    : sceneCreativeDirection;
  const creativeBrief = selectedDirectionIsWinner && creativeDirection && scene
    ? creativeDirectionToBrief(creativeDirection, scene, input)
    : tournamentBrief;
  const winnerBrief = creativeBrief ?? baseWinner.brief;
  const selectedCompositionFamily = selectedDirectionIsWinner
    ? selectedCompositionFamilyFor(
        baseWinner.direction,
        input.conceptInput.format,
        selectedArtDirection
      )
    : null;
  const selectedCompositionDirector = scene && creativeDirection
    ? enforceSelectedCompositionContract(
        runCompositionDirectorSafely(
          buildCompositionDirectorInput(
            input,
            scene,
            creativeDirection,
            selectedCompositionFamily
          )
        ),
        selectedDirectionIsWinner ? selectedCompositionFamily : null,
        selectedDirectionIsWinner ? creativeDirection.composition.typeField : null
      )
    : null;
  const compositionDirector = selectedCompositionDirector ?? (
    selectedDirectionIsWinner && scene && sceneCreativeDirection
      ? runCompositionDirectorSafely(
          buildCompositionDirectorInput(input, scene, sceneCreativeDirection)
        )
      : null
  );
  const compositionCandidate = compositionDirector?.winner ?? null;
  const directedComposition = compositionCandidate
    ? compositionCandidateToCocoCompositionSystem(compositionCandidate, winnerBrief)
    : null;
  const copyArchitect = scene && creativeDirection
    ? runCopyArchitectSafely(buildCopyArchitectInput(input, scene, creativeDirection))
    : null;
  const copyRenderModel = copyArchitect ? buildCopyRenderModel(copyArchitect.winner) : null;
  const stackText = copyRenderModel
    ? textFromCopyRenderModel(input.conceptInput.text, copyRenderModel)
    : input.conceptInput.text;
  const typographyDirector = copyArchitect
    ? enforceSelectedTypographyContract(
        runTypographyDirectorSafely(
          buildTypographyDirectorInput(input, scene, creativeDirection, compositionCandidate, copyArchitect)
        ),
        selectedDirectionIsWinner ? creativeDirection?.typography.headlinePersonality ?? null : null
      )
    : null;
  const typographyRenderModel = typographyDirector
    ? buildTypographyRenderModel(typographyDirector.winner)
    : null;
  const directedTypography = typographyDirector
    ? typographySystemToCocoTypographyDecision(typographyDirector.winner, baseWinner.typography)
    : null;
  const colorDirector = scene && creativeDirection
    ? enforceSelectedPaletteContract(
        runColorDirectorSafely(
          buildColorDirectorInput(input, scene, creativeDirection, baseWinner.palette)
        ),
        selectedDirectionIsWinner ? creativeDirection.palette.policy : null
      )
    : null;
  const colorRenderModel = colorDirector
    ? buildColorRenderModel(colorDirector.winner, colorDirector.authority.maxStrongColors)
    : null;
  const directedPalette = colorRenderModel
    ? paletteFromColorRenderModel(colorRenderModel, baseWinner.palette)
    : baseWinner.palette;
  const winnerForStack = mergeDirectorWinnersIntoConcept({
    baseWinner,
    directedComposition,
    directedPalette,
    directedTypography,
    winnerBrief,
  });
  const creativeSignatureMove = creativeDirection
    ? creativeSignatureMoveForStack(creativeDirection, winnerForStack.typography.subheadline.fontFamily)
    : null;
  const winner = rebuildTypographyStackForConcept({
    compositionCandidate,
    creativeDirection,
    creativeSignatureMove,
    faceZone: input.conceptInput.faceZone,
    format: input.conceptInput.format,
    stackText,
    suppliedTypographyStack: input.typographyStack,
    typographyDirector,
    winnerForStack,
  });
  const conceptTournamentWithCreativeWinner = {
    ...conceptTournament,
    finalists: conceptTournament.finalists.map((concept) =>
      concept.id === baseWinner.id ? winner : concept
    ),
    winner,
  };
  const composition = winner.layout.composition;
  const typographyStack = winner.typographyStack;
  const compositionTypographyAuthority = compositionCandidate
    ? toCompositionTypographyStackAuthority(compositionCandidate)
    : null;
  const compositionRendererAuthority = compositionCandidate
    ? toCompositionRendererAuthority(compositionCandidate)
    : null;
  const effects = applySelectedEffectsContract(
    directCocoEffects<TEffects>({
      brief: winnerBrief,
      moodProfile: winner.moodProfile,
      nightlifeStyle: input.conceptInput.nightlifeStyle,
      rawEffects: winner.effects,
      scene,
    }),
    selectedDirectionIsWinner ? creativeDirection?.effects ?? null : null,
    selectedDirectionIsWinner ? baseWinner.direction.effectsStyle : null,
    selectedDirectionIsWinner ? baseWinner.direction.id : null
  );
  const selectedDirectionRendererMustObey = selectedDirectionIsWinner && creativeDirection
    ? [
        `selected-direction:${baseWinner.direction.id}`,
        `selected-direction-composition:${selectedCompositionFamily}`,
        `selected-direction-typography:${creativeDirection.typography.headlinePersonality}`,
        `selected-direction-palette:${creativeDirection.palette.policy}`,
        `selected-direction-effects:${baseWinner.direction.effectsStyle}`,
      ]
    : [];
  const renderPlan = buildCocoRenderPlan<TEffects>({
    composition,
    effects,
    scene,
    sceneImageAnalysis,
    typographyStack,
  });
  const cocoArtDirector = input.renderedSnapshot
    ? runArtDirectorSafely(
        buildArtDirectorInput({
          colorRenderModel,
          compositionCandidate,
          copyArchitect,
          creativeDirection,
          effects,
          renderedSnapshot: input.renderedSnapshot,
          scene,
          typographyDirector,
        })
      )
    : null;
  const creativeCompositionAuthority = creativeDirection
    ? toCreativeCompositionAuthority(creativeDirection)
    : null;
  const creativeCopyAuthority = creativeDirection
    ? toCopyArchitectureAuthority(creativeDirection)
    : null;
  const creativeTypographyAuthority = creativeDirection
    ? toCreativeTypographyAuthority(creativeDirection)
    : null;
  const creativePaletteAuthority = creativeDirection
    ? toCreativePaletteAuthority(creativeDirection)
    : null;
  const creativeEffectsAuthority = creativeDirection
    ? toCreativeEffectsAuthority(creativeDirection)
    : null;
  const suppressedSources = Array.from(
    new Set([
      ...(sceneAuthority?.suppressedSources ?? []),
      ...hiddenSourcesFromCreativeDirection(creativeDirection),
      ...sourcesFromCopySources(copyArchitect?.authority.hiddenSources ?? []),
    ])
  );
  const stages = orderStages([
    {
      authority: scene ? "SceneInterpretation" : "none",
      id: "scene-interpreter",
      reason: scene
        ? `Scene evidence converted into ${sceneAuthority?.hardConstraints.length ?? 0} hard constraints at confidence ${Math.round(scene.confidence * 100)}%.`
        : "No scene interpretation was available; downstream stages used fallback inputs.",
      status: scene ? "done" : "skipped",
    },
    {
      authority: creativeDirection?.id ?? "missing creative direction",
      id: "creative-director",
      reason: creativeDirection
        ? `Coco Creative Director selected ${creativeDirection.posterDNA}/${creativeDirection.posterIdentity}, ${creativeDirection.marketingGoal}, ${creativeDirection.emotionalGoal}, density ${creativeDirection.informationDensity}.`
        : "Coco Creative Director could not run without scene interpretation.",
      status: creativeDirection ? "done" : "deferred",
    },
    {
      authority:
        compositionCandidate?.family ??
        creativeCompositionAuthority?.family ??
        sceneAuthority?.composition.pattern ??
        composition?.patternId ??
        winner.layout.patternId ??
        winner.layout.layoutId,
      id: "composition-director",
      reason: compositionCandidate
        ? `Coco Composition Director selected ${compositionCandidate.family}/${compositionCandidate.typeField} with score ${compositionCandidate.score.total}.`
        : creativeCompositionAuthority
        ? `Composition consumed creative contract ${creativeCompositionAuthority.family} in ${creativeCompositionAuthority.typeField} type field.`
        : sceneAuthority
        ? `Composition consumed scene type field ${sceneAuthority.composition.typeField} with ${sceneAuthority.composition.hardConstraints.length} hard constraints.`
        : "Composition system selected the typography column, blocks, copy treatment, and rhythm.",
      status: compositionCandidate ? "done" : composition ? "done" : "deferred",
    },
    {
      authority: copyArchitect
        ? `copy-architect:${copyArchitect.winner.pattern}`
        : creativeCopyAuthority
        ? `creative-copy:${creativeCopyAuthority.groups.map((group) => group.id).join(",")}`
        : sceneAuthority?.suppressedSources.length
        ? `scene-copy-policy:${sceneAuthority.suppressedSources.join(",")}`
        : composition
          ? "copyTreatment"
          : "brief.informationArchitecture",
      id: "copy-architect",
      reason: copyArchitect
        ? `Copy Architect selected ${copyArchitect.winner.pattern}, ${copyArchitect.winner.tone} tone, ${copyArchitect.winner.density} density, and ${copyRenderModel?.items.length ?? 0} render groups.`
        : creativeCopyAuthority
        ? `Copy architecture consumed Creative Director density policy and ${creativeCopyAuthority.groups.length} copy groups.`
        : sceneAuthority
        ? "Copy ownership and suppression policy preserve scene density decisions."
        : "Copy ownership is derived from composition copyTreatment and brief information architecture.",
      status: "done",
    },
    {
      authority:
        typographyDirector?.winner.id ??
        creativeTypographyAuthority?.contract.headlinePersonality ??
        sceneAuthority?.typography.policy ??
        winner.typography.metadata.personality,
      id: "typography-director",
      reason: typographyDirector
        ? `Typography Director selected ${typographyDirector.winner.name} with ${typographyDirector.winner.fontFamilies.length} font families and score ${typographyDirector.winner.score.total}.`
        : creativeTypographyAuthority
        ? `Typography consumed Creative Director contract: ${creativeTypographyAuthority.contract.headlinePersonality} headline, ${creativeTypographyAuthority.contract.accentPersonality} accent, signature ${creativeTypographyAuthority.signatureMove.move}.`
        : sceneAuthority
        ? `Typography consumed scene policy ${sceneAuthority.typography.policy} and ${sceneAuthority.typography.signatureOpportunities.length} signature opportunities.`
        : "Typography decision selected font personality, hierarchy, sizing, and treatment restraint.",
      status: "done",
    },
    {
      authority:
        colorDirector?.winner.id ??
        creativePaletteAuthority?.policy ??
        sceneAuthority?.palette.id ??
        colorAuthority(winner.palette),
      id: "color-director",
      reason: colorDirector
        ? `Color Director selected ${colorDirector.winner.policy} with ${colorDirector.winner.roles.length} role assignments and score ${colorDirector.winner.score.total}.`
        : creativePaletteAuthority
        ? `Palette consumed Creative Director policy ${creativePaletteAuthority.policy}: ${creativePaletteAuthority.reason}`
        : sceneAuthority
        ? `Palette consumed scene color story ${sceneAuthority.palette.id}.`
        : "Palette decision selected role colors for headline, metadata, logistics, and accents.",
      status: colorDirector ? "done" : "deferred",
    },
    {
      authority: typographyStack ? "CocoTypographyStackModel" : "missing typography stack",
      id: "typography-stack",
      reason: typographyStack
        ? colorRenderModel
          ? `Typography stack consumed Typography Director and Color Director render models with ${typographyRenderModel?.roles.length ?? 0} type roles and ${colorRenderModel.roles.length} color roles.`
          : typographyRenderModel
          ? `Typography stack consumed Typography Director render model with ${typographyRenderModel.roles.length} roles.`
          : compositionTypographyAuthority
          ? `Typography stack consumed Composition Director textColumn and ${compositionTypographyAuthority.blocks.length} visible blocks.`
          : "Typography stack was built before layout tournament authority so layout evaluates one text object."
        : "Typography stack could not be built from the winning composition.",
      status: typographyStack ? "done" : "deferred",
    },
    {
      authority: creativeEffectsAuthority?.policy ?? sceneAuthority?.effects.policy ?? effects.mode,
      id: "effects-director",
      reason: creativeEffectsAuthority?.reason ?? (sceneAuthority ? sceneAuthority.effects.reason : effects.reason),
      status: "done",
    },
    {
      authority: winner.layout.layoutId,
      id: "layout-tournament",
      reason: typographyStack
        ? "Winning layout is downstream of the materialized typography stack authority."
        : "Concept tournament selected the winning layout candidate.",
      status: "done",
    },
    {
      authority: renderPlan.mode,
      id: "renderer",
      reason: renderPlan.scene
        ? `${renderPlan.reason} Renderer also received ${renderPlan.scene.protectionZones.length} scene protection zones, ${renderPlan.scene.rendererProtectionMap.length} image-protection zones, and ${renderPlan.scene.textOpportunityMap.length} text opportunities.`
        : renderPlan.reason,
      status: "done",
    },
    {
      authority: cocoArtDirector
        ? cocoArtDirector.exportDecision.allowed
          ? `export-ready:${cocoArtDirector.finalScore.total}`
          : `blocked:${cocoArtDirector.exportDecision.blockers.length}`
        : input.artDirector
        ? input.artDirector.decision.status
        : creativeDirector?.authority.hardConstraints.length
          ? `pending:${creativeDirector.authority.hardConstraints.length}-creative-hard-blockers`
          : sceneAuthority?.artDirectorMustBlock.length
          ? `pending:${sceneAuthority.artDirectorMustBlock.length}-hard-scene-blockers`
          : "pending final canvas snapshot",
      id: "art-director",
      reason: cocoArtDirector
        ? cocoArtDirector.strongestFinding?.userFacingMessage ?? cocoArtDirector.exportDecision.message
        : input.artDirector
        ? input.artDirector.decision.message
        : creativeDirector
          ? "Final art director pass must validate the rendered canvas against the Creative Director contract."
        : sceneAuthority
          ? "Final art director pass must treat hard scene constraints as blockers once rendered canvas data exists."
          : "Final art director pass requires the rendered canvas snapshot.",
      status: cocoArtDirector || input.artDirector ? "done" : "deferred",
    },
    {
      authority:
        suppliedCritiqueLoop?.stoppedBecause ??
        input.iteration?.debug?.stopReason ??
        "pending rendered critique loop",
      id: "critique-loop",
      reason: suppliedCritiqueLoop
        ? `Critique Loop evaluated ${suppliedCritiqueLoop.history.length} iteration${suppliedCritiqueLoop.history.length === 1 ? "" : "s"} and stopped because: ${suppliedCritiqueLoop.stoppedBecause}`
        : input.iteration
        ? `Applied ${input.iteration.applied.length} improvements.`
        : "Critique loop runs after Art Director has a rendered snapshot and evaluation.",
      status: suppliedCritiqueLoop || input.iteration ? "done" : "deferred",
    },
  ]);

  return {
    artDirector: input.artDirector ?? null,
    cocoArtDirector,
    color: winner.palette,
    colorAuthority: {
      renderModel: colorRenderModel,
      rendererMustObey: [
        ...(colorDirector?.authority.downstreamMustObey.map(
          (authority) => `color-director-must-obey:${authority}`
        ) ?? []),
        ...(colorRenderModel ? ["render-colors-from-color-director-model"] : []),
        ...(selectedDirectionIsWinner && creativeDirection
          ? [`selected-direction-palette:${creativeDirection.palette.policy}`]
          : []),
      ],
    },
    colorDirector,
    colorRenderModel,
    compositionCandidate,
    compositionDirector,
    conceptTournament: conceptTournamentWithCreativeWinner,
    copyArchitecture: {
      copyTreatment: composition?.copyTreatment,
      groups: creativeCopyAuthority?.groups,
      informationArchitecture: winnerBrief.informationArchitecture,
      ownedSources: Array.from(
        new Set([
          ...(composition ? ownedSourcesFromTreatment(composition.copyTreatment) : []),
          ...sourcesFromCompositionCandidate(compositionCandidate),
          ...sourcesFromCopySources(copyArchitect?.authority.ownsSources ?? []),
          ...ownedSourcesFromCreativeDirection(creativeDirection),
        ])
      ),
      renderModel: copyRenderModel,
      suppressedSources,
      rendererMustObey: [
        "do-not-render-owned-sources-outside-stack",
        "do-not-merge-or-split-copy-after-copy-architecture",
        "preserve-headline-first-hierarchy",
        ...(copyArchitect
          ? copyArchitect.authority.downstreamMustObey.map(
              (authority) => `copy-architect-must-obey:${authority}`
            )
          : []),
        ...(creativeCopyAuthority ? ["render-copy-from-creative-director-groups"] : []),
        ...(compositionCandidate ? ["render-copy-owned-by-composition-director"] : []),
        ...(suppressedSources.length ? ["do-not-render-suppressed-sources"] : []),
      ],
    },
    copyArchitect,
    copyRenderModel,
    creativeBrief: winnerBrief,
    creativeDirection,
    creativeDirector,
    critiqueLoop: suppliedCritiqueLoop,
    effects,
    iteration: input.iteration ?? null,
    renderPlan,
    renderedSnapshot: input.renderedSnapshot ?? null,
    renderer: {
      mode: "model-obedience",
      rendererMustObey: [
        ...renderPlan.rendererMustObey,
        ...(creativeDirector?.authority.downstreamMustObey.map(
          (authority) => `creative-director-must-obey:${authority}`
        ) ?? []),
        ...(compositionDirector?.authority.rendererMustObey.map(
          (authority) => `composition-director-must-obey:${authority}`
        ) ?? []),
        ...(compositionRendererAuthority
          ? [
              `composition-director-renderer-authority:${compositionRendererAuthority.id}`,
              `composition-director-family:${compositionRendererAuthority.family}`,
            ]
          : []),
        ...(copyArchitect?.authority.downstreamMustObey.map(
          (authority) => `copy-architect-must-obey:${authority}`
        ) ?? []),
        ...(typographyDirector?.authority.downstreamMustObey.map(
          (authority) => `typography-director-must-obey:${authority}`
        ) ?? []),
        ...(colorDirector?.authority.downstreamMustObey.map(
          (authority) => `color-director-must-obey:${authority}`
        ) ?? []),
        ...(cocoArtDirector?.authority.downstreamMustObey.map(
          (authority) => `art-director-must-obey:${authority}`
        ) ?? []),
        ...(suppliedCritiqueLoop?.authority.downstreamMustObey.map(
          (authority) => `critique-loop-must-obey:${authority}`
        ) ?? []),
        ...(sceneAuthority?.rendererMustObey ?? []),
        ...selectedDirectionRendererMustObey,
        "render-pipeline-models-only",
        "no-renderer-side-layout-decisions",
        "no-renderer-side-effects",
        "preview-export-parity",
      ],
    },
    scene,
    sceneAuthority,
    sceneInput: input.sceneInput,
    stages,
    typography: {
      renderModel: typographyRenderModel,
      rendererMustObey: [
        ...(typographyDirector?.authority.downstreamMustObey.map(
          (authority) => `typography-director-must-obey:${authority}`
        ) ?? []),
        ...(typographyRenderModel ? ["render-typography-from-typography-director-model"] : []),
        ...(selectedDirectionIsWinner && creativeDirection
          ? [`selected-direction-typography:${creativeDirection.typography.headlinePersonality}`]
          : []),
      ],
    },
    typographyDirector,
    typographyRenderModel,
    typographyStack,
    winner,
  };
}

export function mergeDirectorWinnersIntoConcept<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(args: {
  baseWinner: CocoFlyerConcept<TPalette, TEffects>;
  directedComposition: CocoCompositionSystem | null;
  directedPalette: TPalette;
  directedTypography: CocoTypographyDecision | null;
  winnerBrief: CocoCreativeBrief;
}): CocoFlyerConcept<TPalette, TEffects> {
  const { baseWinner, directedComposition, directedPalette, directedTypography, winnerBrief } = args;

  return {
    ...baseWinner,
    brief: winnerBrief,
    layout: {
      ...baseWinner.layout,
      layoutId: directedComposition?.layoutId ?? baseWinner.layout.layoutId,
      patternId: directedComposition?.patternId ?? baseWinner.layout.patternId,
      brief: winnerBrief,
      composition: directedComposition ?? (baseWinner.layout.composition
        ? {
            ...baseWinner.layout.composition,
            brief: winnerBrief,
          }
        : baseWinner.layout.composition),
    },
    palette: directedPalette,
    typography: directedTypography ?? baseWinner.typography,
  };
}

export function rebuildTypographyStackForConcept<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(args: {
  compositionCandidate: CompositionCandidate | null;
  creativeDirection: CreativeDirection | null;
  creativeSignatureMove: CocoSignatureMove | null;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  stackText: CocoTournamentText;
  suppliedTypographyStack?: CocoTypographyStackModel | null;
  typographyDirector: TypographyDirectorResult | null;
  winnerForStack: CocoFlyerConcept<TPalette, TEffects>;
}): CocoFlyerConcept<TPalette, TEffects> {
  const {
    compositionCandidate,
    creativeDirection,
    creativeSignatureMove,
    faceZone,
    format,
    stackText,
    suppliedTypographyStack,
    typographyDirector,
    winnerForStack,
  } = args;

  return {
    ...winnerForStack,
    typographyStack: suppliedTypographyStack ??
      buildConceptTypographyStack({
        concept: winnerForStack,
        debugReason: typographyDirector
          ? "Pipeline rebuilt CocoTypographyStackModel from Coco Typography Director authority."
          : compositionCandidate
          ? "Pipeline rebuilt CocoTypographyStackModel from Coco Composition Director authority."
          : creativeDirection
          ? "Pipeline rebuilt CocoTypographyStackModel from Coco Creative Director authority."
          : "Pipeline built CocoTypographyStackModel before layout tournament authority.",
        faceZone,
        format,
        palette: winnerForStack.palette,
        signatureMove: creativeSignatureMove,
        text: stackText,
        typography: winnerForStack.typography,
      }),
  };
}

export async function runCocoPipelineWithCritiqueLoop<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
>(input: CocoPipelineInput<TPalette, TEffects>): Promise<CocoPipelineState<TPalette, TEffects>> {
  const state = runCocoPipeline<TPalette, TEffects>(input);
  if (state.critiqueLoop || !state.cocoArtDirector || !state.renderedSnapshot) {
    return state;
  }

  const critiqueLoop = await runCritiqueLoopSafely(
    buildCritiqueLoopInput(state, input.critiqueMemory ?? null)
  );

  return critiqueLoop ? withCritiqueLoopState(state, critiqueLoop) : state;
}

function buildCritiqueLoopInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  state: CocoPipelineState<TPalette, TEffects>,
  memory: CocoPipelineInput<TPalette, TEffects>["critiqueMemory"]
): CritiqueLoopInput {
  const initialEvaluation = critiqueEvaluationFromArtDirector(state.cocoArtDirector!);

  return {
    adapters: {
      applyPatches(snapshot) {
        return snapshot;
      },
      evaluateArtwork() {
        return initialEvaluation;
      },
      renderSnapshot(snapshot) {
        return snapshot;
      },
    },
    initialEvaluation,
    initialSnapshot: critiqueSnapshotFromRenderedSnapshot(state.renderedSnapshot!),
    memory: memory ?? undefined,
    settings: {
      allowAutomaticFixes: false,
      maxIterations: 1,
      preserveUserMoves: true,
      requirePreviewExportParity: true,
      stopWhenExportable: false,
    },
  };
}

async function runCritiqueLoopSafely(input: CritiqueLoopInput): Promise<CritiqueLoopResult | null> {
  try {
    return await runCocoCritiqueLoop(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-critique-loop] failed", error);
    }
    return null;
  }
}

function withCritiqueLoopState<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  state: CocoPipelineState<TPalette, TEffects>,
  critiqueLoop: CritiqueLoopResult
): CocoPipelineState<TPalette, TEffects> {
  return {
    ...state,
    critiqueLoop,
    renderer: {
      ...state.renderer,
      rendererMustObey: Array.from(
        new Set([
          ...state.renderer.rendererMustObey,
          ...critiqueLoop.authority.downstreamMustObey.map(
            (authority) => `critique-loop-must-obey:${authority}`
          ),
        ])
      ),
    },
    stages: state.stages.map((stage) =>
      stage.id === "critique-loop"
        ? {
            authority: critiqueLoop.stoppedBecause,
            id: "critique-loop",
            reason: `Critique Loop evaluated ${critiqueLoop.history.length} iteration${critiqueLoop.history.length === 1 ? "" : "s"} and stopped because: ${critiqueLoop.stoppedBecause}`,
            status: "done",
          }
        : stage
    ),
  };
}

function critiqueEvaluationFromArtDirector(artDirector: ArtDirectorResult): CritiqueEvaluation {
  const findings = artDirector.findings.map(critiqueFindingFromArtFinding);

  return {
    exportAllowed: artDirector.exportDecision.allowed,
    findings,
    score: critiqueScoreFromArtScore(artDirector.initialScore),
    strongestFinding: artDirector.strongestFinding
      ? critiqueFindingFromArtFinding(artDirector.strongestFinding)
      : findings[0],
  };
}

function critiqueFindingFromArtFinding(finding: ArtDirectorResult["findings"][number]): CritiqueFinding {
  return { ...finding } as CritiqueFinding;
}

function critiqueScoreFromArtScore(score: ArtDirectorResult["initialScore"]): CritiqueScore {
  return { ...score };
}

function critiqueSnapshotFromRenderedSnapshot(
  snapshot: NonNullable<CocoPipelineInput["renderedSnapshot"]>
): CritiqueRenderedSnapshot {
  return {
    elements: snapshot.elements.map((element) => ({ ...element, rect: { ...element.rect } })),
    faceRect: snapshot.faceRect ? { ...snapshot.faceRect } : undefined,
    format: snapshot.format,
    gazeRect: snapshot.gazeRect ? { ...snapshot.gazeRect } : undefined,
    globalMetrics: snapshot.globalMetrics ? { ...snapshot.globalMetrics } : undefined,
    height: snapshot.height,
    id: snapshot.screenshotId ?? "pipeline-rendered-snapshot",
    imageMetrics: snapshot.imageMetrics ? { ...snapshot.imageMetrics } : undefined,
    productRects: snapshot.productRects?.map((rect) => ({ ...rect })),
    signature: snapshot.screenshotId,
    subjectRect: snapshot.subjectRect ? { ...snapshot.subjectRect } : undefined,
    width: snapshot.width,
  };
}

function buildSceneAuthority(
  scene: NonNullable<CocoPipelineState["scene"]>,
  imageAnalysis: CocoSceneAuthority["imageAnalysis"] = null
): CocoSceneAuthority {
  const suppressedSources = sceneSuppressedSources(scene);
  const hardConstraints = scene.constraints
    .filter((constraint) => constraint.hard)
    .map((constraint) => constraint.id);
  const rendererProtectionMap = imageAnalysis?.protectionMap ?? [];
  const textOpportunityMap = imageAnalysis?.textOpportunityMap ?? [];

  return {
    artDirectorMustBlock: hardConstraints,
    composition: toSceneCompositionAuthority(scene),
    confidence: scene.confidence,
    effects: toSceneEffectsAuthority(scene),
    hardConstraints,
    imageAnalysis,
    palette: toScenePaletteAuthority(scene),
    protectionZones: [...scene.protectionZones],
    rendererProtectionMap: [...rendererProtectionMap],
    reasoning: [...scene.reasoning],
    rendererMustObey: [
      ...(imageAnalysis ? ["renderer-must-use-scene-image-analysis"] : []),
      ...(rendererProtectionMap.length ? ["renderer-must-enforce-scene-image-protection-map"] : []),
      ...(textOpportunityMap.length ? ["renderer-must-place-stack-inside-text-opportunity-map"] : []),
      "renderer-must-preserve-scene-type-field",
      "renderer-must-enforce-scene-protection-zones",
      "renderer-must-respect-scene-density-policy",
      "renderer-must-not-ignore-scene-warnings",
    ],
    suppressedSources,
    textOpportunityMap: [...textOpportunityMap],
    typography: toSceneTypographyAuthority(scene),
    warnings: [...scene.warnings],
  };
}

export function buildCompositionDirectorInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  scene: NonNullable<CocoPipelineState["scene"]>,
  creativeDirection: CreativeDirection,
  selectedPreferredFamily?: CompositionFamily | null
): CompositionDirectorInput {
  const text = input.conceptInput.text;
  const event = input.conceptInput.event as Record<string, unknown>;

  return {
    busyZones: compositionBusyZones(scene),
    creativeDirection,
    format: input.conceptInput.format,
    negativeSpace: scene.evidence.negativeSpace,
    preferredFamily:
      selectedPreferredFamily ?? compositionFamily(creativeDirection.composition.family),
    scene,
    subject: subjectGeometry(scene, input.conceptInput.faceZone),
    text: {
      accent: text.script ?? text.subtag ?? stringValue(event.subtitle),
      compliance: text.compliance,
      date: text.date ?? stringValue(event.date),
      details: text.details ?? stringValue(event.description),
      details2: text.details2,
      footer: text.subtag,
      headline: text.headline ?? input.conceptInput.eventName,
      presenter: text.presenter,
      price: text.price,
      subtag: text.subtag,
      time: stringValue(event.time),
      venue: text.venue ?? stringValue(event.venue),
    },
  };
}

export function runCompositionDirectorSafely(input: CompositionDirectorInput) {
  try {
    return directCocoComposition(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-composition-director] failed", error);
    }
    return null;
  }
}

function enforceSelectedCompositionContract(
  result: CompositionDirectorResult | null,
  selectedFamily: CompositionFamily | null,
  selectedTypeField: CompositionCandidate["typeField"] | null
): CompositionDirectorResult | null {
  if (!result || !selectedFamily) return result;
  const safe = result.candidates.filter(
    (candidate) =>
      candidate.score.hardViolations === 0 &&
      !candidate.score.hasCriticalProtectionViolation &&
      !candidate.score.hasBlockOverlap
  );
  const exact = safe.filter(
    (candidate) =>
      candidate.family === selectedFamily &&
      (!selectedTypeField || candidate.typeField === selectedTypeField)
  );
  const familyMatches = safe.filter((candidate) => candidate.family === selectedFamily);
  const winner = [...exact, ...familyMatches]
    .sort((a, b) => b.score.total - a.score.total)[0];
  if (!winner || winner.id === result.winner.id) return result;

  return {
    ...result,
    authority: {
      ...result.authority,
      compositionId: winner.id,
      owns: winner.owns,
    },
    trace: [
      ...result.trace,
      {
        decision: `Promoted safe ${winner.family} candidate for the selected concept direction.`,
        evidence: [
          `hardViolations=${winner.score.hardViolations}`,
          `faceViolation=${winner.score.hasCriticalProtectionViolation}`,
        ],
        score: winner.score.total,
        stage: "selected-direction",
      },
    ],
    winner,
  };
}

function buildCopyArchitectInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  scene: NonNullable<CocoPipelineState["scene"]>,
  creativeDirection: CreativeDirection
): CopyArchitectInput {
  const text = input.conceptInput.text;
  const event = input.conceptInput.event as Record<string, unknown>;

  return {
    creativeDirection,
    event: {
      accent: text.script ?? text.subtag ?? stringValue(event.subtitle),
      callToAction: stringValue(event.callToAction),
      date: text.date ?? stringValue(event.date),
      details: text.details ?? stringValue(event.description),
      details2: text.details2,
      headline: text.headline ?? input.conceptInput.eventName,
      name: input.conceptInput.eventName || text.headline || "Untitled Event",
      presenter: text.presenter,
      price: text.price,
      time: stringValue(event.time),
      venue: text.venue ?? stringValue(event.venue),
    },
    scene,
    userPreferences: {
      allowHiding: true,
      allowRewriting: false,
      keepAddress: false,
      keepPresenter: Boolean(text.presenter),
      keepPrice: Boolean(text.price),
      maxVisibleGroups: scene.creativeDecisions.densityPolicy.maxVisibleGroups,
      preserveOriginalCopy: true,
    },
  };
}

function runCopyArchitectSafely(input: CopyArchitectInput): CopyArchitectResult | null {
  try {
    return architectCocoCopy(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-copy-architect] failed", error);
    }
    return null;
  }
}

export function textFromCopyRenderModel(
  fallback: CocoTournamentText,
  copyRenderModel: CopyRenderModel
): CocoTournamentText {
  const byRole = new Map<string, CopyRenderItem>();
  for (const item of copyRenderModel.items) {
    if (!item.text.trim()) continue;
    if (!byRole.has(item.role)) byRole.set(item.role, item);
  }

  const identity = byRole.get("identity");
  const emotion = byRole.get("emotion");
  const experience = byRole.get("experience") ?? byRole.get("music") ?? byRole.get("offer");
  const logistics = byRole.get("logistics");
  const venue = byRole.get("venue");
  const presenter = byRole.get("presenter");
  const badge = byRole.get("badge");
  const footer = byRole.get("footer") ?? byRole.get("social") ?? byRole.get("age");

  return {
    ...fallback,
    date: fallback.date || logistics?.text,
    details: fallback.details || experience?.text,
    details2: fallback.details2 || footer?.text,
    headline: preservePipelineHeadline(fallback.headline, identity?.text),
    presenter: fallback.presenter || presenter?.text,
    price: fallback.price || badge?.text,
    script: fallback.script || emotion?.text,
    subtag: fallback.subtag || emotion?.text,
    venue: fallback.venue || venue?.text,
  };
}

function preservePipelineHeadline(
  fallbackHeadline: string | undefined,
  copyHeadline: string | undefined
): string | undefined {
  const fallback = String(fallbackHeadline ?? "").replace(/\s+/g, " ").trim();
  const copy = String(copyHeadline ?? "").replace(/\s+/g, " ").trim();
  if (!fallback) return copyHeadline || fallbackHeadline;
  if (!copy) return fallbackHeadline;
  if (copy.toLowerCase() === fallback.toLowerCase() && String(copyHeadline ?? "").includes("\n")) {
    return copyHeadline;
  }

  const fallbackWords = fallback.split(" ").filter(Boolean);
  const copyWords = copy.split(" ").filter(Boolean);
  if (fallbackWords.length >= 2 && copyWords.length < fallbackWords.length) {
    const prefix = fallbackWords.slice(0, copyWords.length).join(" ").toLowerCase();
    if (copy.toLowerCase() === prefix) return fallbackHeadline;
  }

  return fallbackHeadline;
}

export function buildTypographyDirectorInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  scene: NonNullable<CocoPipelineState["scene"]> | null,
  creativeDirection: CreativeDirection | null,
  compositionCandidate: CompositionCandidate | null,
  copyArchitect: CopyArchitectResult
): TypographyDirectorInput {
  return {
    availableFonts: availableFontsForTypographyDirector(input.conceptInput.availableFonts),
    composition: compositionCandidate
      ? {
          alignment: compositionCandidate.alignment,
          blocks: compositionCandidate.blocks.map((block) => ({
            height: block.rect.height,
            maxVisualPower: block.maxVisualPower,
            minVisualPower: block.minVisualPower,
            role: typographyRoleFromCompositionRole(block.role),
            width: block.rect.width,
          })),
          family: compositionCandidate.family,
          overlapPolicy: creativeDirection?.composition.overlapPolicy,
          typeField: compositionCandidate.typeField,
        }
      : null,
    copyArchitecture: {
      density: copyArchitect.winner.density,
      groups: copyArchitect.winner.groups.map((group) => ({
        id: group.id,
        maxLines: group.maxLines,
        powerRatio: group.powerRatio,
        priority: group.priority,
        role: group.role,
        spacingAfter: group.spacingAfter,
        spacingBefore: group.spacingBefore,
        text: group.text,
        treatment: group.treatment,
      })),
      id: copyArchitect.winner.id,
      tone: copyArchitect.winner.tone,
    },
    creativeDirection,
    scene,
    userPreferences: {
      allowScriptAccent: creativeDirection?.typography.allowScriptAccent ?? true,
      // Headline, optional accent, bold information face, and regular support
      // face are distinct design roles. Capping this at two caused the repair
      // pass to replace body copy with the headline font and flattened Coco's
      // hierarchy into one monotonous family.
      maxFontFamilies:
        input.conceptInput.availableFonts.headline.length >= 4 &&
        (input.conceptInput.availableFonts.body2?.length ?? 0) >= 2
          ? Math.max(4, creativeDirection?.typography.maxFontFamilies ?? 4)
          : creativeDirection?.typography.maxFontFamilies ?? 2,
    },
  };
}

export function runTypographyDirectorSafely(input: TypographyDirectorInput): TypographyDirectorResult | null {
  try {
    return directCocoTypography(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-typography-director] failed", error);
    }
    return null;
  }
}

function enforceSelectedTypographyContract(
  result: TypographyDirectorResult | null,
  headlinePersonality: TypographyPersonality | null
): TypographyDirectorResult | null {
  if (!result || !headlinePersonality) return result;
  const winner = result.candidates
    .filter((candidate) => candidate.headline.personality === headlinePersonality)
    .sort((a, b) => b.score.total - a.score.total)[0];
  if (!winner || winner.id === result.winner.id) return result;

  return {
    ...result,
    authority: {
      ...result.authority,
      maxFontFamilies: winner.maxFontFamilies,
      typographySystemId: winner.id,
    },
    trace: [
      ...result.trace,
      {
        confidence: winner.score.total / 100,
        decision: `Promoted ${headlinePersonality} typography for the selected concept direction.`,
        evidence: [winner.name],
        stage: "selected-direction",
      },
    ],
    winner,
  };
}

export function buildColorDirectorInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  scene: NonNullable<CocoPipelineState["scene"]>,
  creativeDirection: CreativeDirection,
  basePalette: TPalette
): ColorDirectorInput {
  const image = scene.evidence.image;
  const dominantColors = validHexColors(image.dominantColors);
  const existingPalette = validHexColors(scene.evidence.existingPalette);
  const basePaletteColors = paletteHexValues(basePalette);
  const sampledColors = [
    ...dominantColors.map((hex, index) => ({
      hex,
      source: "background" as const,
      weight: index === 0 ? 1 : 0.86,
    })),
    ...basePaletteColors.map((hex) => ({
      hex,
      source: "unknown" as const,
      weight: 0.62,
    })),
  ];

  return {
    availableBrandColors: existingPalette,
    creativeDirection,
    imageSignals: {
      averageLuminance: image.luminance,
      contrast: image.contrast,
      dominantColors: dominantColors.length ? dominantColors : existingPalette,
      sampledColors,
      saturation: image.saturation,
      warmth: image.warmth,
    },
    scene,
    userPreferences: {
      allowBackgroundColorCast: false,
      allowPureBlack: false,
      allowPureWhite: false,
      maxStrongColors: creativeDirection.palette.maxStrongColors,
      preserveSkinTone: creativeDirection.palette.preserveSkinTone,
      preferredPalettePolicy: creativeDirection.palette.policy,
    },
  };
}

export function runColorDirectorSafely(input: ColorDirectorInput): ColorDirectorResult | null {
  try {
    return directCocoColor(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-color-director] failed", error);
    }
    return null;
  }
}

function enforceSelectedPaletteContract(
  result: ColorDirectorResult | null,
  policy: PalettePolicy | null
): ColorDirectorResult | null {
  if (!result || !policy) return result;
  const winner = result.candidates
    .filter((candidate) => candidate.policy === policy)
    .sort((a, b) => b.score.total - a.score.total)[0];
  if (!winner || winner.id === result.winner.id) return result;

  return {
    ...result,
    authority: {
      ...result.authority,
      colorSystemId: winner.id,
      maxStrongColors: winner.strongColors.length,
      roleAssignments: winner.roles,
    },
    winner,
  };
}

function applySelectedEffectsContract<TEffects>(
  decision: CocoEffectsDecision<TEffects>,
  contract: CreativeDirection["effects"] | null,
  effectsStyle: CocoConceptDirection["effectsStyle"] | null,
  directionId: CocoConceptDirection["id"] | null
): CocoEffectsDecision<TEffects> {
  if (!contract || !effectsStyle || !directionId || decision.mode === "none") return decision;
  const extraAllowed = effectsStyle === "grain-glitch"
    ? ["fine-grain" as const]
    : effectsStyle === "analog-glow" ||
        effectsStyle === "light-beams" ||
        effectsStyle === "soft-bloom"
      ? ["controlled-bloom" as const, "background-color-cast" as const]
      : effectsStyle === "haze-vignette" || effectsStyle === "sunset-haze"
        ? ["gentle-vignette" as const, "background-color-cast" as const]
        : ["subtle-glow" as const];
  const maxIntensity = Math.max(
    contract.maxGlow,
    contract.maxTexture,
    contract.maxParticles,
    contract.maxBlur,
    contract.vignette,
    contract.colorCast
  );

  return {
    ...decision,
    allowed: Array.from(new Set([...decision.allowed, ...extraAllowed])),
    maxIntensity,
    mode: contract.policy,
    reason: `${contract.reason} Scene-derived forbidden effects and readability limits remain enforced.`,
    rendererMustObey: [
      ...decision.rendererMustObey,
      `selected-direction-effects:${directionId}:${effectsStyle}`,
    ],
  };
}

export function buildArtDirectorInput(args: {
  colorRenderModel: ColorRenderModel | null;
  compositionCandidate: CompositionCandidate | null;
  copyArchitect: CopyArchitectResult | null;
  creativeDirection: CreativeDirection | null;
  effects: CocoPipelineState["effects"];
  renderedSnapshot: NonNullable<CocoPipelineInput["renderedSnapshot"]>;
  scene: CocoPipelineState["scene"];
  typographyDirector: TypographyDirectorResult | null;
}): ArtDirectorInput {
  return {
    color: artDirectorColor(args.colorRenderModel),
    composition: artDirectorComposition(args.compositionCandidate),
    copyArchitecture: artDirectorCopyArchitecture(args.copyArchitect),
    creativeDirection: args.creativeDirection,
    effects: artDirectorEffects(args.effects),
    renderedSnapshot: args.renderedSnapshot,
    scene: args.scene,
    typography: artDirectorTypography(args.typographyDirector?.winner ?? null),
    userPreferences: {
      allowAutomaticFixes: false,
      maxIterations: 4,
      minExpectedGain: 3,
      preserveUserMoves: true,
      strictness: "balanced",
    },
  };
}

export function runArtDirectorSafely(input: ArtDirectorInput): ArtDirectorResult | null {
  try {
    return directCocoArtwork(input);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-art-director] failed", error);
    }
    return null;
  }
}

function artDirectorComposition(
  candidate: CompositionCandidate | null
): ArtDirectorCompositionLike | null {
  if (!candidate) return null;
  const badge = candidate.blocks.find((block) => block.role === "badge" && !block.hidden);

  return {
    alignment: candidate.alignment,
    badgeRect: badge?.rect,
    blocks: candidate.blocks
      .filter((block) => !block.hidden)
      .map((block) => ({
        alignment: block.align,
        id: block.id,
        rect: block.rect,
        role: block.role,
        visualPower: block.maxVisualPower ?? block.minVisualPower,
      })),
    family: candidate.family,
    id: candidate.id,
    score: (({ hasCriticalProtectionViolation, hasBlockOverlap, ...numericScore }) => numericScore)(candidate.score),
    stackRect: candidate.textColumn,
    subjectRect: candidate.subjectRect,
    typeField: candidate.typeField,
  };
}

function artDirectorCopyArchitecture(
  copyArchitect: CopyArchitectResult | null
): ArtDirectorCopyArchitectureLike | null {
  if (!copyArchitect) return null;

  return {
    groups: copyArchitect.winner.groups.map((group) => ({
      id: group.id,
      maxLines: group.maxLines,
      powerRatio: group.powerRatio,
      role: group.role,
      sources: group.sources,
      text: group.text,
      treatment: group.treatment,
    })),
    id: copyArchitect.winner.id,
  };
}

function artDirectorTypography(system: TypographySystem | null): ArtDirectorTypographyLike | null {
  if (!system) return null;

  return {
    accent: artDirectorTypographyLayer(system.accent),
    badge: artDirectorTypographyLayer(system.badge),
    dateTime: artDirectorTypographyLayer(system.dateTime),
    footer: artDirectorTypographyLayer(system.footer),
    fontFamilies: system.fontFamilies,
    headline: artDirectorTypographyLayer(system.headline),
    hierarchy: { ...system.hierarchy },
    id: system.id,
    maxFontFamilies: system.maxFontFamilies,
    metadata: artDirectorTypographyLayer(system.metadata),
    presenter: artDirectorTypographyLayer(system.presenter),
    signatureMove: system.signatureMove
      ? {
          id: system.signatureMove.id,
          target: system.signatureMove.target,
        }
      : undefined,
    venue: artDirectorTypographyLayer(system.venue),
  };
}

function artDirectorTypographyLayer(layer: TypographyLayer | undefined) {
  if (!layer) return undefined;

  return {
    align: layer.align,
    effects: {
      blur: layer.effects.blur,
      glow: layer.effects.glow,
      opacity: layer.effects.opacity,
      shadow: layer.effects.shadow,
      stroke: layer.effects.stroke,
    },
    fontFamily: layer.fontFamily,
    lineHeight: layer.lineHeight,
    maxLines: layer.maxLines,
    offsetX: layer.offsetX,
    offsetY: layer.offsetY,
    role: layer.role,
    rotationDeg: layer.rotationDeg,
    sizeScale: layer.sizeScale,
    text: layer.text,
    tracking: layer.tracking,
    visualPower: layer.visualPower,
    weight: layer.weight,
  };
}

function artDirectorColor(model: ColorRenderModel | null) {
  if (!model) return null;

  return {
    colorCast: model.colorCast,
    id: model.id,
    policy: model.policy,
    roles: model.roles.map((role) => ({
      color: role.color,
      contrastRatio: role.contrastRatio,
      importance: role.importance,
      role: role.role,
    })),
    strongColors: Array.from(new Set(model.roles.map((role) => role.color))).slice(0, model.maxStrongColors),
  };
}

function artDirectorEffects(effects: CocoPipelineState["effects"]): ArtDirectorEffectsLike {
  return {
    id: `effects:${effects.mode}`,
    oneSignatureEffect: effects.mode === "restrained" || effects.mode === "none",
    policy: effects.mode,
    roles: [],
  };
}

export function paletteFromColorRenderModel<TPalette extends CocoConceptPaletteLike>(
  model: ColorRenderModel,
  fallback: TPalette
): TPalette {
  const headline = colorRole(model, "headline") ?? fallback.headline;
  const accent = colorRole(model, "accent") ?? fallback.subheadline ?? fallback.subtag;
  const metadata = colorRole(model, "metadata") ?? fallback.details;
  const dateTime = colorRole(model, "dateTime") ?? fallback.date;
  const venue = colorRole(model, "venue") ?? fallback.venue;
  const neutral = colorRole(model, "neutral") ?? metadata ?? fallback.palette?.neutral;

  return {
    ...fallback,
    date: dateTime,
    details: metadata,
    details2: colorRole(model, "footer") ?? fallback.details2,
    headline,
    headlineGlow: fallback.headlineGlow ?? colorRole(model, "glow"),
    headlineStroke: fallback.headlineStroke ?? colorRole(model, "stroke"),
    palette: {
      ...fallback.palette,
      accent: colorRole(model, "accent") ?? fallback.palette?.accent,
      bgFrom: colorRole(model, "background") ?? fallback.palette?.bgFrom,
      bgTo: colorRole(model, "backgroundSecondary") ?? fallback.palette?.bgTo,
      neutral,
      primary: headline ?? fallback.palette?.primary,
      secondary: colorRole(model, "accent") ?? fallback.palette?.secondary,
    },
    presenter: colorRole(model, "presenter") ?? fallback.presenter,
    price: colorRole(model, "badgeText") ?? fallback.price,
    subheadline: accent,
    subtag: accent,
    utility: colorRole(model, "utility") ?? fallback.utility,
    venue,
  } as TPalette;
}

function colorRole(model: ColorRenderModel, role: ColorRole) {
  return model.roles.find((assignment) => assignment.role === role)?.color;
}

function paletteHexValues(palette: CocoConceptPaletteLike) {
  return validHexColors([
    palette.date,
    palette.details,
    palette.details2,
    palette.headline,
    palette.headlineGlow,
    palette.headlineStroke,
    palette.presenter,
    palette.price,
    palette.subheadline,
    palette.subtag,
    palette.utility,
    palette.venue,
    palette.palette?.accent,
    palette.palette?.bgFrom,
    palette.palette?.bgTo,
    palette.palette?.neutral,
    palette.palette?.primary,
    palette.palette?.secondary,
  ]);
}

function validHexColors(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^#[0-9A-F]{6}$/.test(value))
    )
  );
}

function availableFontsForTypographyDirector(
  availableFonts: CocoPipelineInput["conceptInput"]["availableFonts"]
): AvailableFontsInput {
  const replaceLegacyInter = (
    families: string[] | undefined,
    replacement: string
  ) => Array.from(
    new Set(
      (families ?? [])
        .map((family) => {
          const safeFamilies = String(family || "")
            .split(",")
            .map((candidate) => candidate.trim())
            .filter(
              (candidate) =>
                candidate.replace(/^['"]|['"]$/g, "").toLowerCase() !== "inter"
            );
          return safeFamilies.length ? safeFamilies.join(", ") : replacement;
        })
        .filter(Boolean)
    )
  );
  const headlineFonts = replaceLegacyInter(availableFonts.headline, "LEMONMILK-Bold");
  const accentFonts = replaceLegacyInter(availableFonts.headline2, "LEMONMILK-Medium");
  const bodyFonts = replaceLegacyInter(availableFonts.body, "LEMONMILK-Regular");
  const body2Fonts = replaceLegacyInter(availableFonts.body2, "LEMONMILK-Light");
  const subtagFonts = replaceLegacyInter(availableFonts.subtag, "LEMONMILK-Medium");
  const utilityFonts = replaceLegacyInter(availableFonts.utility, "LEMONMILK-Medium");
  const venueFonts = replaceLegacyInter(availableFonts.venue, "LEMONMILK-Light");
  const allFonts = Array.from(
    new Set(
      [
        ...headlineFonts,
        ...accentFonts,
        ...bodyFonts,
        ...body2Fonts,
        ...subtagFonts,
        ...utilityFonts,
        ...venueFonts,
      ].filter(Boolean)
    )
  );

  return {
    fallbackFamilies: {
      accent: accentFonts,
      dateTime: utilityFonts,
      footer: body2Fonts.length ? body2Fonts : utilityFonts.length ? utilityFonts : bodyFonts,
      headline: headlineFonts,
      metadata: bodyFonts,
      presenter: utilityFonts,
      venue: venueFonts.length ? venueFonts : utilityFonts.length ? utilityFonts : bodyFonts,
    },
    fonts: allFonts.length ? allFonts : ["LEMONMILK-Regular"],
  };
}

export function typographySystemToCocoTypographyDecision(
  system: TypographySystem,
  fallback: CocoTypographyDecision
): CocoTypographyDecision {
  const headline = typographyHeadlineLayer(system.headline, fallback.headline);
  const subheadline = typographySupportLayer(system.accent, fallback.subheadline, 46, system.headline);
  const details = typographySupportLayer(system.metadata, fallback.details, 28, system.headline);
  const date = typographySupportLayer(system.dateTime, fallback.date, 28, system.headline);
  const venue = typographySupportLayer(system.venue, fallback.venue, 20, system.headline);
  const presenter = typographySupportLayer(system.presenter, fallback.presenter, 20, system.headline);
  const price = typographySupportLayer(system.badge, fallback.price, 22, system.headline);
  const footer = typographySupportLayer(system.footer, fallback.details2, 22, system.headline);

  return {
    date,
    details,
    details2: footer,
    headline,
    metadata: {
      mood: system.name,
      personality: cocoTypePersonality(system.headline.personality),
    },
    presenter,
    price,
    scores: {
      elegance: system.score.premiumPotential,
      eventMatch: system.score.moodFit,
      fontPersonalityMatch: system.score.fontQuality,
      hierarchy: system.score.hierarchy,
      lineBreakQuality: system.score.readability,
      photographyMatch: system.score.sceneFit,
      premiumFeel: system.score.premiumPotential,
      readability: system.score.readability,
      rhythm: system.score.rhythm,
      total: system.score.total,
      treatmentRestraint: system.score.restraint,
      zoneFit: system.score.compositionFit,
    },
    subheadline,
    subtag: footer,
    venue,
  };
}

function typographyHeadlineLayer(
  layer: TypographyLayer,
  fallback: CocoTypographyDecision["headline"]
): CocoTypographyDecision["headline"] {
  return {
    ...fallback,
    fontFamily: layer.fontFamily,
    glow: layer.effects.glow,
    letterSpacing: layer.tracking,
    lineHeight: layer.lineHeight,
    shadow: layer.effects.shadow,
    sizeScale: Math.max(0.72, layer.sizeScale),
    strokeWidth: layer.effects.stroke,
    text: layer.text,
    transform: transformFromTypographyLayer(layer),
    treatment: headlineTreatmentFromTypographyLayer(layer),
    weight: layer.weight,
  };
}

function typographySupportLayer(
  layer: TypographyLayer | undefined,
  fallback: TypographyLayerDecision,
  fallbackSize: number,
  headline: TypographyLayer
): TypographyLayerDecision {
  if (!layer) return fallback;

  return {
    ...fallback,
    fontFamily: layer.fontFamily,
    letterSpacing: layer.tracking,
    lineHeight: layer.lineHeight,
    sizeScale: sizeScaleForLegacyStack(layer, headline, fallbackSize),
    text: layer.text,
    transform: transformFromTypographyLayer(layer),
    weight: layer.weight,
  };
}

function sizeScaleForLegacyStack(layer: TypographyLayer, headline: TypographyLayer, fallbackSize: number) {
  const roleRatio = Math.max(0.08, layer.visualPower / Math.max(1, headline.visualPower));
  const headlineBaseSize = 96;
  const scale = (roleRatio * headlineBaseSize) / Math.max(1, fallbackSize);
  return Math.max(0.38, Math.min(1.25, scale));
}

function transformFromTypographyLayer(layer: TypographyLayer): TypographyLayerDecision["transform"] {
  if (layer.case === "titlecase") return "titlecase";
  if (layer.case === "sentence" || layer.case === "preserve") return undefined;
  return "uppercase";
}

function headlineTreatmentFromTypographyLayer(layer: TypographyLayer): TypographyTreatment {
  if (layer.personality === "luxury-serif" || layer.personality === "fashion-serif") return "serifLuxury";
  if (layer.effects.glow > 0.16) return "glow";
  return "clean";
}

function cocoTypePersonality(personality: TypographyPersonality): TypePersonality {
  if (personality === "luxury-serif" || personality === "fashion-serif") return "luxury";
  if (personality === "organic-script") return "afrobeats";
  if (personality === "urban-heavy") return "aggressive";
  if (personality === "retro-display") return "throwback";
  if (personality === "industrial-minimal") return "minimal";
  if (personality === "electric-display") return "nightclub";
  if (personality === "condensed-editorial" || personality === "clean-grotesk" || personality === "humanist-lifestyle" || personality === "geometric-modern" || personality === "classic-sans") {
    return "editorial";
  }
  return "nightclub";
}

function typographyRoleFromCompositionRole(role: DirectedCompositionRole): TypographyRole {
  if (role === "identity") return "headline";
  if (role === "primaryMeta" || role === "secondaryMeta") return "metadata";
  if (role === "presenter") return "presenter";
  return role;
}

export function compositionCandidateToCocoCompositionSystem(
  candidate: CompositionCandidate,
  brief: CocoCreativeBrief
): CocoCompositionSystem {
  const hierarchy = brief.hierarchyRules;

  return {
    alignment: candidate.alignment,
    allBlocks: candidate.blocks.map(compositionBlockToCocoBlock),
    anchorSide: anchorSideFromTypeField(candidate.typeField),
    blocks: candidate.blocks
      .filter((block) => !block.hidden)
      .map(compositionBlockToCocoBlock),
    brief,
    copyTreatment: copyTreatmentFromCompositionCandidate(candidate),
    explanation: `Coco Composition Director selected ${candidate.id}. ${candidate.explanation}`,
    gates: {
      detailsMaxHeadlineRatio: hierarchy?.bodyMaxRatio ?? 0.3,
      headlineOverBodyMin: 1 / Math.max(0.01, hierarchy?.bodyMaxRatio ?? 0.3),
      headlineOverScriptMin: 1 / Math.max(0.01, hierarchy?.accentMaxRatio ?? 0.42),
      scriptMaxHeadlineRatio: hierarchy?.accentMaxRatio ?? 0.42,
      venueMaxHeadlineRatio: hierarchy?.venueMaxRatio ?? 0.24,
    },
    hierarchy: {
      accentPowerMaxRatio: hierarchy?.accentMaxRatio ?? 0.42,
      bodyPowerMaxRatio: hierarchy?.bodyMaxRatio ?? 0.3,
      headlinePowerMin: brief.hierarchy.headline || 90,
      metadataPowerMaxRatio: Math.max(hierarchy?.bodyMaxRatio ?? 0.3, hierarchy?.dateMaxRatio ?? 0.26),
    },
    layoutId: layoutIdFromCompositionCandidate(candidate),
    patternId: compositionPatternIdFromFamily(candidate.family),
    rendererZones: rendererZonesFromCompositionCandidate(candidate),
    rhythm: {
      accentToMeta: candidate.rhythm.accentToMeta,
      dateTimeToVenue: candidate.rhythm.dateTimeToVenue,
      headlineToAccent: candidate.rhythm.headlineToAccent,
      metaToDateTime: candidate.rhythm.metaToDateTime,
    },
    score: candidate.score.total,
    textColumn: rectFromPercent(candidate.textColumn),
  };
}

function compositionBlockToCocoBlock(block: CompositionCandidate["blocks"][number]): CocoCompositionBlock {
  return {
    align: block.align,
    hidden: block.hidden,
    maxVisualPower: block.maxVisualPower,
    minVisualPower: block.minVisualPower,
    parentRole: block.parentRole ? cocoRole(block.parentRole) : undefined,
    priority: block.priority,
    rect: rectFromPercent(block.rect),
    role: cocoRole(block.role),
    shouldAttachTo: block.attachTo ? cocoRole(block.attachTo) : undefined,
    source: cocoSource(firstSource(block.source)),
  };
}

function copyTreatmentFromCompositionCandidate(candidate: CompositionCandidate): CocoCopyTreatment {
  if (
    candidate.family === "golden-hero-editorial"
  ) {
    return {
      date: "hero-date",
      details: "hide",
      details2: "keep",
      script: "accent-support",
      venue: "footer",
    };
  }
  const owns = new Set(candidate.owns);
  return {
    date: "metadata",
    details: owns.has("details") ? "primary-meta" : "hide",
    details2: owns.has("details2") ? "merge" : "hide",
    script: owns.has("accent") ? "accent-support" : "hide",
    venue: owns.has("venue") ? "lock-to-stack" : "footer",
  };
}

function rendererZonesFromCompositionCandidate(
  candidate: CompositionCandidate
): CocoCompositionSystem["rendererZones"] {
  const zones: CocoCompositionSystem["rendererZones"] = {};
  for (const block of candidate.blocks.filter((item) => !item.hidden)) {
    const rect = rectFromPercent(block.rect);
    if (block.role === "identity") zones.headline = rect;
    if (block.role === "accent") zones.script = rect;
    if (block.role === "primaryMeta") {
      if (candidate.family === "golden-hero-editorial") zones.rightInfo = rect;
      else zones.leftInfo = rect;
    }
    if (block.role === "secondaryMeta") {
      if (candidate.family === "golden-hero-editorial") zones.leftInfo = rect;
      else zones.subtag = rect;
    }
    if (block.role === "footer") {
      const source = firstSource(block.source);
      if (candidate.family !== "golden-hero-editorial" || source === "time" || source === "subtag") {
        zones.subtag = rect;
      }
    }
    if (block.role === "dateTime") zones.date = rect;
    if (block.role === "venue") zones.venue = rect;
    if (block.role === "badge") zones.price = rect;
    if (block.role === "presenter") zones.presenter = rect;
  }
  return zones;
}

function sourcesFromCompositionCandidate(candidate: CompositionCandidate | null): CocoCompositionSource[] {
  if (!candidate) return [];
  return Array.from(new Set(candidate.owns.map(cocoSource)));
}

function sourcesFromCopySources(sources: CopySource[]): CocoCompositionSource[] {
  return Array.from(new Set(sources.map(cocoSourceFromCopySource).filter(Boolean))) as CocoCompositionSource[];
}

function cocoSourceFromCopySource(source: CopySource): CocoCompositionSource | null {
  if (source === "name" || source === "headline") return "headline";
  if (source === "accent") return "script";
  if (source === "details") return "details";
  if (source === "details2" || source === "callToAction" || source === "social" || source === "sponsors" || source === "custom") return "details2";
  // Previously folded into details2 along with callToAction/social/sponsors/
  // custom - that meant it could never get its own zone (it wasn't a
  // distinct thing to the composition director, just more details2 text)
  // and collided with brand-header, which already owns details2.
  if (source === "ageRestriction") return "compliance";
  if (source === "date" || source === "time") return "date";
  if (source === "venue" || source === "address") return "venue";
  if (source === "price") return "price";
  if (source === "presenter") return "presenter";
  return null;
}

// faceRect prefers verifiedFaceZone (the real, detected face position
// already trusted everywhere else in the app - app/page.tsx's
// effectiveFaceZone/cocoSubjectFaceFitZone) over the scene interpreter's
// own independent face-finding (scene.evidence.faces). The composition
// director uses this rect to decide where text goes; every other use of
// evidence.faces (expression, sunglasses - story/creative decisions
// unrelated to positioning) is untouched and still reads from scene
// directly, since those don't need this override.
function subjectGeometry(
  scene: NonNullable<CocoPipelineState["scene"]>,
  verifiedFaceZone?: SubjectGeometry["faceRect"]
): SubjectGeometry | null {
  const subject = scene.evidence.subjects[0];
  if (!subject) {
    // The scene interpreter's own subject detection can come back empty
    // for framings it doesn't recognize (e.g. a tight close-up crop) even
    // though a real, verified face position exists from detection that
    // already ran upstream. Returning null here discarded that real face
    // data along with the failed subject guess - composition director's
    // face-avoidance (faceDirectedFamilies) needs input.subject.faceRect to
    // exist at all to ever engage, so losing it here silently fell back to
    // the old, non-face-aware family selection. A minimal geometry keeps
    // the one thing that matters (the real face rect) rather than losing
    // it because an unrelated, less reliable check failed.
    if (!verifiedFaceZone) return null;
    return { faceRect: verifiedFaceZone, rect: verifiedFaceZone };
  }
  const face = scene.evidence.faces.find((candidate) => candidate.subjectId === subject.id) ??
    scene.evidence.faces[0];

  return {
    centroid: subject.center,
    crop: subject.crop,
    faceRect: verifiedFaceZone ?? face?.rect ?? subject.headRect ?? null,
    hands: subject.hands,
    headRect: subject.headRect,
    rect: subject.rect,
    saliency: subject.saliency,
    side: subject.side,
    torsoRect: subject.torsoRect,
    visibleRect: subject.rect,
    visualMass: subject.visibleMass,
  };
}

function compositionBusyZones(scene: NonNullable<CocoPipelineState["scene"]>): CompositionPercentRect[] {
  const zones = [
    ...scene.protectionZones
      .filter((zone) => zone.importance === "critical" || zone.importance === "high")
      .map((zone) => zone.rect),
    ...scene.evidence.subjects.map((subject) => subject.rect),
    ...scene.evidence.objects
      .filter((object) => object.saliency > 0.55 || object.area > 2)
      .map((object) => object.rect),
  ];
  return zones;
}

function compositionFamily(family: string): CompositionFamily {
  if (
    family === "left-premium-stack" ||
    family === "right-premium-stack" ||
    family === "center-poster-stack" ||
    family === "bottom-lockup" ||
    family === "split-editorial" ||
    family === "diagonal-energy" ||
    family === "full-bleed-type" ||
    family === "type-around-subject" ||
    family === "top-lockup" ||
    family === "corner-editorial"
    || family === "fashion-club-vertical"
    || family === "golden-hero-editorial"
  ) {
    return family;
  }
  return "center-poster-stack";
}

function compositionPatternIdFromFamily(family: CompositionFamily): CocoCompositionPatternId {
  if (family === "fashion-club-vertical") return "fashion-club-vertical";
  if (family === "golden-hero-editorial") return "golden-hero-editorial";
  if (
    family === "left-premium-stack" ||
    family === "right-premium-stack" ||
    family === "center-poster-stack" ||
    family === "bottom-lockup" ||
    family === "diagonal-energy"
  ) {
    return family;
  }
  if (family === "split-editorial") return "split-hero-editorial";
  if (family === "corner-editorial") return "left-premium-stack";
  if (family === "center-hero-event-poster") return "center-hero-event-poster";
  return "center-poster-stack";
}

function layoutIdFromCompositionCandidate(candidate: CompositionCandidate): CocoTournamentLayoutId {
  if (candidate.family === "fashion-club-vertical") return "subject-center";
  if (candidate.family === "golden-hero-editorial") return "subject-right";
  if (candidate.typeField === "left") return "subject-right";
  if (candidate.typeField === "right") return "subject-left";
  return "subject-center";
}

function anchorSideFromTypeField(field: CompositionCandidate["typeField"]): CocoCompositionSystem["anchorSide"] {
  if (field === "left" || field === "right" || field === "bottom") return field;
  return "center";
}

export function cocoRole(role: DirectedCompositionRole): CocoCompositionRole {
  if (role === "identity") return "headline";
  if (role === "presenter") return "footer";
  return role;
}

function firstSource(source: DirectedCompositionSource | DirectedCompositionSource[]): DirectedCompositionSource {
  return Array.isArray(source) ? source[0] : source;
}

function cocoSource(source: DirectedCompositionSource): CocoCompositionSource {
  if (source === "accent") return "script";
  if (source === "time") return "date";
  if (source === "footer") return "subtag";
  if (
    source === "headline" ||
    source === "details" ||
    source === "details2" ||
    source === "date" ||
    source === "venue" ||
    source === "price" ||
    source === "presenter" ||
    source === "subtag" ||
    source === "compliance"
  ) {
    return source;
  }
  return "details";
}

function sceneSuppressedSources(scene: NonNullable<CocoPipelineState["scene"]>) {
  const sourceMap = {
    accent: "script",
    badge: "price",
    date: "date",
    details: "details",
    details2: "details2",
    headline: "headline",
    presenter: "presenter",
    venue: "venue",
  } as const;

  return (Object.keys(sourceMap) as Array<keyof typeof sourceMap>)
    .filter((source) => !shouldRenderSource(scene, source))
    .map((source) => sourceMap[source]);
}

function buildCreativeEventInput<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(input: CocoPipelineInput<TPalette, TEffects>): CreativeEventInput {
  const text = input.conceptInput.text;
  const event = input.conceptInput.event as Record<string, unknown>;
  return {
    accent: text.script ?? text.subtag ?? stringValue(event.subtitle),
    audienceHint: stringValue(event.audienceHint),
    brandHint: stringValue(event.brandHint),
    callToAction: stringValue(event.callToAction),
    date: text.date ?? stringValue(event.date),
    details: text.details ?? stringValue(event.description),
    details2: text.details2,
    headline: text.headline ?? stringValue(event.title),
    name: input.conceptInput.eventName || text.headline || stringValue(event.title) || "Untitled Event",
    presenter: text.presenter,
    price: text.price,
    time: stringValue(event.time),
    venue: text.venue ?? stringValue(event.venue),
  };
}

function creativeDirectionToBrief<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  direction: CreativeDirection,
  scene: NonNullable<CocoPipelineState["scene"]>,
  input: CocoPipelineInput<TPalette, TEffects>
): CocoCreativeBrief {
  const storyId = creativeStoryId(scene.creativeDecisions.story);
  const subject = scene.evidence.subjects[0] ?? null;
  const face = scene.evidence.faces[0] ?? null;
  const typeSide = sideFromTypeField(direction.composition.typeField);
  const subjectSide = subject?.side === "left" || subject?.side === "right" || subject?.side === "center"
    ? subject.side
    : input.conceptInput.hasSubject
      ? "center"
      : "none";
  const infoArchitecture: CocoInformationGroup[] = direction.copyArchitecture.map((group) => ({
    id: informationGroupId(group.role),
    priority: clampPriority(group.priority),
    sources: sourcesFromCreativeSources(group.sources),
    treatment: informationTreatment(group.treatment),
  }));
  const protect = protectionTargets(scene);

  return {
    counterweight: {
      reason: direction.composition.reason,
      side: sideFromTypeField(direction.composition.typeField),
    },
    colorStory: {
      accent: direction.palette.accentTone,
      dominant: scene.evidence.image.dominantColors.length
        ? scene.evidence.image.dominantColors
        : scene.evidence.existingPalette,
      footer: direction.palette.neutralTone,
      headline: direction.palette.headlineTone,
      metadata: direction.palette.neutralTone,
    },
    evaluationGoals: evaluationGoals(direction),
    event: {
      avoidTags: direction.constraints.map((constraint) => constraint.id),
      categoryTags: [direction.posterDNA, direction.posterIdentity, direction.marketingGoal],
      moodTags: [direction.emotionalGoal, direction.visualEnergy, direction.informationDensity],
    },
    eyeFlow: [
      { priority: 1, target: "headline" },
      { priority: 2, target: "accent" },
      { priority: 3, target: "subject" },
      { priority: 4, target: "primaryMeta" },
      { priority: 5, target: "venue" },
    ],
    hero: {
      primary: heroTarget(scene.creativeDecisions.hero.type),
      secondary: scene.creativeDecisions.hero.secondaryHero
        ? heroTarget(scene.creativeDecisions.hero.secondaryHero)
        : "headline",
      support: ["headline", "background"],
    },
    hierarchy: {
      accent: Math.round(direction.hierarchy.accentMaxRatio * 100),
      dateTime: Math.round(direction.hierarchy.dateMaxRatio * 100),
      footer: 16,
      headline: direction.hierarchy.headlinePower,
      metadata: Math.round(direction.hierarchy.bodyMaxRatio * 100),
      venue: Math.round(direction.hierarchy.venueMaxRatio * 100),
    },
    hierarchyRules: {
      accentMaxRatio: direction.hierarchy.accentMaxRatio,
      bodyMaxRatio: direction.hierarchy.bodyMaxRatio,
      dateMaxRatio: direction.hierarchy.dateMaxRatio,
      headlineMustWin: true,
      venueMaxRatio: direction.hierarchy.venueMaxRatio,
    },
    informationArchitecture: infoArchitecture,
    polishRules: {
      attachBodyToHeadline: true,
      avoidScatteredZones: true,
      mergeSecondaryCopy: direction.copyArchitecture.some((group) => group.treatment === "merge"),
      preferMetadataOverBodyCopy: true,
      protectFace: direction.composition.protectSceneZones,
      useOneTypeColumn: direction.composition.oneColumn,
    },
    protection: {
      forbiddenZones: scene.protectionZones.map((zone) => rectFromPercent(zone.rect)),
      protect,
    },
    readingOrder: ["headline", "accent", "primaryMeta", "dateTime", "venue", "footer"],
    recommendedComposition:
      direction.id === "concept-direction:fashion-club-vertical"
        ? "fashion-club-vertical"
        : direction.id === "concept-direction:golden-hero-editorial"
          ? "golden-hero-editorial"
        : compositionPatternId(direction.composition.family),
    recommendedLayoutId:
      direction.id === "concept-direction:fashion-club-vertical"
        ? "subject-center"
        : direction.id === "concept-direction:golden-hero-editorial"
          ? "subject-right"
        : layoutIdForCreativeDirection(direction),
    rhythm: direction.id === "concept-direction:fashion-club-vertical"
      ? {
          accentToMeta: FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm.accentToMeta,
          dateTimeToVenue: FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm.dateTimeToVenue,
          headlineToAccent: FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm.headlineToAccent,
          metaToDateTime: FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm.metaToDateTime,
        }
      : {
          accentToMeta: direction.informationDensity === "minimal" ? 10 : 7,
          dateTimeToVenue: 4,
          headlineToAccent: direction.signatureMove.move === "script-cross" ? 2 : 5,
          metaToDateTime: 8,
        },
    scene: {
      crop: cropForSubject(subject?.crop),
      dominantColors: scene.evidence.image.dominantColors,
      eyeDirection: eyeDirection(face?.gaze ?? subject?.gaze),
      lightingSide: "unknown",
      lightingTemperature: scene.evidence.image.warmth > 56 ? "warm" : scene.evidence.image.warmth < 44 ? "cool" : "neutral",
      moodTags: [direction.emotionalGoal, direction.posterDNA, direction.posterIdentity],
      negativeSpace: {
        scale: scene.creativeDecisions.densityPolicy.policy === "minimal" ? "large" : "medium",
        side: typeSide,
      },
      subjectCount: scene.evidence.subjects.length,
      subjectPosition: subjectSide,
    },
    story: {
      oneLine: `${direction.posterIdentity} ${direction.marketingGoal} direction for ${scene.creativeDecisions.story}.`,
      tags: [direction.posterDNA, direction.posterIdentity, direction.signatureMove.move],
    },
    storyId,
    typographyColumn: {
      alignment: direction.composition.alignment,
      role: typeSide === "center" ? "center-anchor" : typeSide === "bottom" ? "bottom-lockup" : "counterweight",
      side: typeSide,
    },
    visualWeight: {
      body: direction.hierarchy.bodyMaxRatio,
      face: face ? 0.9 : 0,
      headlineTarget: direction.hierarchy.headlinePower,
      imageSide: scene.creativeDecisions.composition.visualWeight === "right" ? 1 : scene.creativeDecisions.composition.visualWeight === "left" ? -1 : 0,
      subject: subject ? Math.min(1, subject.area * 2.5) : 0,
      supportTextTarget: direction.hierarchy.bodyMaxRatio,
    },
  };
}

function creativeSignatureMoveForStack(
  direction: CreativeDirection,
  accentFontFamily: string | null | undefined
): CocoSignatureMove {
  const requestedMove =
    direction.signatureMove.move === "script-cross" && !canUseScriptMove(accentFontFamily)
      ? "editorial-spacing"
      : direction.signatureMove.move;
  const id = signatureMoveId(requestedMove);
  const intensity = direction.signatureMove.intensity;
  const base = {
    id,
    intensity,
    priority: direction.score.signatureMoveFit,
    reason:
      requestedMove === direction.signatureMove.move
        ? direction.signatureMove.reason
        : "Creative Director requested script-cross, but the selected accent font is not script-like; using editorial spacing instead.",
    safety: {
      maxFaceOverlap: 0,
      maxHeadlineEdgeRisk: id === "cropped-type" ? 0.2 : 0.1,
      mustKeepReadability: true,
    },
    target: signatureMoveTarget(direction.signatureMove.target),
  } satisfies Omit<CocoSignatureMove, "typography" | "layout" | "effects">;

  if (id === "script-cross") {
    return {
      ...base,
      effects: { accentGlowBoost: 0.04 },
      layout: {
        accentOffsetX: -2.4,
        accentOffsetY: -1,
        allowAccentCrossStack: true,
        allowAccentOverlapHeadline: true,
        metadataOffsetY: 1.6,
      },
      typography: {
        accentRotationDeg: -6,
        accentScaleMultiplier: 0.86,
        useScriptAccent: true,
      },
    };
  }

  if (id === "editorial-spacing") {
    return {
      ...base,
      effects: { headlineGlowBoost: -0.04 },
      layout: { metadataOffsetY: 2, stackOffsetY: -1 },
      target: "full-stack",
      typography: { accentScaleMultiplier: 0.76, headlineTrackingDelta: 0.02 },
    };
  }

  if (id === "cropped-type") {
    return {
      ...base,
      layout: { stackOffsetX: -2, stackOffsetY: -2 },
      typography: {
        headlineScaleMultiplier: 1.08,
        headlineTrackingDelta: -0.018,
        useCondensedHeadline: true,
      },
    };
  }

  if (id === "luxury-serif-scale") {
    return {
      ...base,
      effects: { headlineGlowBoost: -0.04 },
      layout: { stackOffsetY: -1.5 },
      typography: { headlineScaleMultiplier: 1.04, headlineTrackingDelta: 0.024 },
    };
  }

  return {
    ...base,
    effects: id === "glow-sweep" ? { headlineGlowBoost: 0.12 } : undefined,
    layout: { stackOffsetY: -1 },
    typography: { headlineScaleMultiplier: id === "oversized-headline" ? 1.04 : 1 },
  };
}

function ownedSourcesFromCreativeDirection(direction: CreativeDirection | null): CocoCompositionSource[] {
  if (!direction) return [];
  return Array.from(
    new Set(
      direction.copyArchitecture
        .filter((group) => group.treatment !== "hide")
        .flatMap((group) => sourcesFromCreativeSources(group.sources))
    )
  );
}

function hiddenSourcesFromCreativeDirection(direction: CreativeDirection | null): string[] {
  if (!direction) return [];
  return Array.from(
    new Set(
      direction.copyArchitecture
        .filter((group) => group.treatment === "hide")
        .flatMap((group) => sourcesFromCreativeSources(group.sources))
    )
  );
}

function stringValue(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function creativeStoryId(story: string): CocoCreativeStoryId {
  if (
    story === "luxury-tropical-brunch" ||
    story === "premium-ladies-night" ||
    story === "afrobeats-sunset" ||
    story === "rnb-lounge" ||
    story === "high-energy-club" ||
    story === "throwback-party" ||
    story === "general-nightlife"
  ) {
    return story;
  }
  if (story === "vip-bottle-service") return "bottle-service-vip";
  return "general-nightlife";
}

function compositionPatternId(family: CreativeDirection["composition"]["family"]): CocoCompositionPatternId {
  if (family === "golden-hero-editorial") return "golden-hero-editorial";
  if (family === "left-premium-stack" || family === "right-premium-stack" || family === "center-poster-stack" || family === "bottom-lockup" || family === "diagonal-energy") {
    return family;
  }
  if (family === "split-editorial") return "split-hero-editorial";
  if (family === "full-bleed-type" || family === "type-around-subject") return "center-poster-stack";
  return "center-poster-stack";
}

function layoutIdForCreativeDirection(direction: CreativeDirection): CocoTournamentLayoutId {
  if (direction.composition.typeField === "left") return "subject-right";
  if (direction.composition.typeField === "right") return "subject-left";
  return "subject-center";
}

function sideFromTypeField(
  field: CreativeDirection["composition"]["typeField"]
): "left" | "right" | "center" | "bottom" {
  if (field === "left" || field === "right" || field === "bottom") return field;
  return "center";
}

function informationGroupId(role: CreativeDirection["copyArchitecture"][number]["role"]): CocoInformationGroup["id"] {
  if (role === "identity") return "identity";
  if (role === "emotion") return "emotion";
  if (role === "logistics") return "logistics";
  if (role === "venue") return "venue";
  if (role === "presenter" || role === "badge" || role === "footer") return "footer";
  return "primaryMeta";
}

function informationTreatment(
  treatment: CreativeDirection["copyArchitecture"][number]["treatment"]
): CocoInformationGroup["treatment"] {
  if (treatment === "hero") return "hero";
  if (treatment === "accent") return "accent";
  if (treatment === "footer") return "footer";
  if (treatment === "hide") return "hide";
  if (treatment === "mute" || treatment === "microcopy") return "muted";
  return "metadata";
}

function sourcesFromCreativeSources(sources: string[]): CocoCompositionSource[] {
  const out = sources
    .map((source) => {
      if (source === "accent") return "script";
      if (source === "time") return "date";
      if (source === "headline" || source === "script" || source === "details" || source === "details2" || source === "date" || source === "venue" || source === "price" || source === "presenter" || source === "subtag") {
        return source;
      }
      if (source === "callToAction") return "subtag";
      return null;
    })
    .filter(Boolean) as CocoCompositionSource[];
  return Array.from(new Set(out));
}

function clampPriority(priority: number): 1 | 2 | 3 | 4 | 5 {
  if (priority <= 1) return 1;
  if (priority === 2) return 2;
  if (priority === 3) return 3;
  if (priority === 4) return 4;
  return 5;
}

function heroTarget(type: string): "subject" | "headline" | "drink" | "logo" | "background" {
  if (type === "subject") return "subject";
  if (type === "headline") return "headline";
  if (type === "product") return "drink";
  if (type === "background" || type === "environment") return "background";
  return "background";
}

function cropForSubject(crop: unknown): "close-up" | "medium" | "wide" | "unknown" {
  if (crop === "close") return "close-up";
  if (crop === "half" || crop === "three-quarter") return "medium";
  if (crop === "full") return "wide";
  return "unknown";
}

function eyeDirection(gaze: unknown): "upper-left" | "upper-right" | "center" | "unknown" {
  if (gaze === "up-left" || gaze === "left") return "upper-left";
  if (gaze === "up-right" || gaze === "right") return "upper-right";
  if (gaze === "camera") return "center";
  return "unknown";
}

function protectionTargets(
  scene: NonNullable<CocoPipelineState["scene"]>
): Array<"eyes" | "smile" | "drink" | "hair-silhouette" | "subject-edge"> {
  const mapped = scene.protectionZones.map((zone) => {
    if (zone.target === "eyes" || zone.target === "sunglasses" || zone.target === "face") return "eyes";
    if (zone.target === "mouth") return "smile";
    if (zone.target === "drink" || zone.target === "product") return "drink";
    if (zone.target === "hair-silhouette") return "hair-silhouette";
    if (zone.target === "hands") return "subject-edge";
    return null;
  });
  const targets = mapped.filter(Boolean) as Array<"eyes" | "smile" | "drink" | "hair-silhouette" | "subject-edge">;
  return Array.from(new Set(targets.length ? targets : ["eyes"]));
}

function rectFromPercent(rect: { x: number; y: number; width: number; height: number }): CocoTournamentRect {
  return {
    height: round(rect.height),
    width: round(rect.width),
    x: round(rect.x),
    y: round(rect.y),
  };
}

function evaluationGoals(direction: CreativeDirection): CocoCreativeBrief["evaluationGoals"] {
  const goals: CocoCreativeBrief["evaluationGoals"] = [
    "hierarchy",
    "balance",
    "negative-space",
    "premium",
    "readability",
    "mood",
  ];
  if (direction.visualEnergy === "high" || direction.visualEnergy === "explosive") goals.push("energy");
  if (direction.marketingGoal === "sell-lifestyle" || direction.marketingGoal === "sell-vip") goals.push("brand");
  return Array.from(new Set(goals)) as CocoCreativeBrief["evaluationGoals"];
}

function signatureMoveId(move: SignatureMove): CocoSignatureMoveId {
  if (
    move === "oversized-headline" ||
    move === "script-cross" ||
    move === "diagonal-accent" ||
    move === "cropped-type" ||
    move === "luxury-serif-scale" ||
    move === "editorial-spacing" ||
    move === "none"
  ) {
    return move;
  }
  if (move === "single-electric-glow") return "glow-sweep";
  if (move === "corner-badge") return "badge-orbit";
  return "oversized-headline";
}

function signatureMoveTarget(target: CreativeDirection["signatureMove"]["target"]): CocoSignatureMoveTarget {
  if (target === "headline" || target === "accent" || target === "badge" || target === "full-stack") {
    return target;
  }
  return "headline";
}

function canUseScriptMove(accentFontFamily: string | null | undefined) {
  return /(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard)/i.test(
    String(accentFontFamily ?? "")
  );
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function orderStages(stages: CocoPipelineStage[]) {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  return ORDER.map((id) => byId.get(id)).filter(Boolean) as CocoPipelineStage[];
}

function colorAuthority(palette: CocoConceptPaletteLike) {
  if (palette.palette?.primary || palette.palette?.secondary) return "role-palette";
  if (palette.headline || palette.details || palette.venue) return "text-role-colors";
  return "palette-callback";
}

function ownedSourcesFromTreatment(treatment: NonNullable<CocoPipelineState["copyArchitecture"]["copyTreatment"]>) {
  const owned = new Set<CocoCompositionSource>(["headline"]);
  if (treatment.script === "accent-support" || treatment.script === "hide") owned.add("script");
  if (treatment.details === "primary-meta" || treatment.details === "hide") owned.add("details");
  if (treatment.details2) owned.add("details2");
  if (treatment.date === "metadata") owned.add("date");
  if (treatment.venue === "lock-to-stack") owned.add("venue");
  return Array.from(owned);
}
