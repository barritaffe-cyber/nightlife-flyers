import { runCocoFinalArtDirectorPass } from "../intelligence/finalArtDirector.ts";
import { runCocoRules } from "../intelligence/ruleEngine.ts";
import { buildCocoCanvasSnapshot } from "../intelligence/snapshot.ts";
import type {
  CocoCanvasSnapshot,
  CocoReadabilityMetric,
  CocoReadabilityMetricId,
  CocoTextReadability,
  CocoTextRole,
} from "../intelligence/types.ts";
import type { CocoMoodProfile } from "../moodDirector/types.ts";
import { baseMoodVector, mergeMoodDirection, moodTagsFor } from "../moodDirector/rules.ts";
import type {
  CocoCompositionSource,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentZoneMap,
} from "../layoutTournament/types.ts";
import type { SceneInterpretation } from "../../../coco-scene-interpreter";
import { applyCocoLearningToScore } from "../learning/engine.ts";
import type { CocoLearningSuggestion } from "../learning/types.ts";
import { buildConceptTypographyStack } from "../typographyStack/buildConceptTypographyStack.ts";
import { stackOwnsSource } from "../typographyStack/buildTypographyStackModel.ts";
import { drawTypographyStackTextLayers } from "../typographyStack/drawTypographyStack.ts";
import {
  applyCompositionToZones,
  chooseCocoComposition as chooseBaseCocoComposition,
} from "../compositionDirector.ts";
import type { CocoTypographyDecision } from "../typographyDirector/types.ts";
import { applyCreativeBriefToZones } from "../creativeIntelligence/applyBrief.ts";
import { buildCocoCreativeBrief } from "../creativeIntelligence/engine.ts";
import { COCO_CONCEPT_DIRECTIONS } from "./directions.ts";
import type {
  CocoConceptDirectorInput,
  CocoConceptEffectsLike,
  CocoConceptImprovement,
  CocoConceptPaletteLike,
  CocoConceptPickerInput,
  CocoFlyerConcept,
  CocoConceptTournamentResult,
} from "./types.ts";

type ScoreKey =
  | "brandFit"
  | "colorHarmony"
  | "composition"
  | "depth"
  | "emotion"
  | "hierarchy"
  | "lightingConsistency"
  | "originality"
  | "premiumPolish"
  | "readability"
  | "spacing"
  | "texture"
  | "typography";

const HEAD_TO_HEAD_KEYS = [
  "overallQuality",
  "readability",
  "professional",
  "premiumPolish",
  "brandFit",
  "emotion",
  "originality",
] as const;

export function runCocoConceptTournament<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>
): CocoConceptTournamentResult<TPalette, TEffects> {
  const concepts = COCO_CONCEPT_DIRECTIONS.map((direction, index) =>
    buildConcept(input, {
      direction,
      id: `concept-${direction.id}-${index + 1}`,
      improvement: null,
      stage: "base",
    })
  ).map((concept) => scoreConcept(input, concept));

  const topThree = [...concepts]
    .sort(compareByScore)
    .slice(0, 3);

  const finalists = topThree
    .map((concept) => improveConcept(input, concept))
    .map((concept) => scoreConcept(input, concept))
    .sort(compareByScore);

  const rankedWinner = chooseHeadToHeadWinner(finalists) ?? finalists[0] ?? concepts[0];
  const selectedBase = input.selectedDirectionId
    ? concepts.find((concept) => concept.direction.id === input.selectedDirectionId)
    : null;
  const selectedWinner = input.selectedDirectionId
    ? finalists.find((concept) => concept.direction.id === input.selectedDirectionId) ??
      (selectedBase ? scoreConcept(input, improveConcept(input, selectedBase)) : null)
    : null;
  const winner = selectedWinner ?? rankedWinner;
  const runnerUp = finalists.find((concept) => concept.id !== winner.id);
  const wildCard = [...concepts]
    .filter((concept) => !finalists.some((finalist) => finalist.direction.id === concept.direction.id))
    .sort((a, b) => (b.score?.originality ?? 0) - (a.score?.originality ?? 0))[0];

  return {
    concepts,
    finalists,
    runnerUp,
    wildCard,
    winner,
  };
}

function buildConcept<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  {
    direction,
    id,
    improvement,
    stage,
  }: {
    direction: (typeof COCO_CONCEPT_DIRECTIONS)[number];
    id: string;
    improvement: CocoConceptImprovement | null;
    stage: CocoFlyerConcept<TPalette, TEffects>["stage"];
  }
): CocoFlyerConcept<TPalette, TEffects> {
  const moodProfile = buildConceptMoodProfile(input, direction);
  const sceneLayoutId = layoutIdForScene(input.scene);
  const layoutId = sceneLayoutId ?? input.preferredLayoutId ?? direction.layoutId;
  const basePickerInput: CocoConceptPickerInput = {
    backgroundOnlyHero: input.backgroundOnlyHero,
    baseZones: input.baseZones,
    direction,
    eventName: input.eventName,
    faceZone: input.faceZone,
    format: input.format,
    hasSubject: input.hasSubject,
    improvement,
    layoutId,
    moodProfile,
    nightlifeStyle: input.nightlifeStyle,
    preferredLayoutId: sceneLayoutId ?? input.preferredLayoutId,
    scene: input.scene ?? null,
    subjectZone: input.subjectZone,
    text: input.text,
  };
  const brief =
    input.chooseBrief?.({
      ...basePickerInput,
      photoSignals: input.photoSignals,
      styleDecision: input.styleDecision ?? null,
    }) ??
    buildCocoCreativeBrief({
      ...basePickerInput,
      photoSignals: input.photoSignals,
      styleDecision: input.styleDecision ?? null,
    });
  const effectiveLayoutId =
    input.forcedLayoutId ?? sceneLayoutId ?? brief.recommendedLayoutId ?? input.preferredLayoutId ?? layoutId;
  const pickerInput: CocoConceptPickerInput = {
    ...basePickerInput,
    brief,
    layoutId: effectiveLayoutId,
    preferredLayoutId: effectiveLayoutId,
  };
  const rawLayout = input.chooseLayout(pickerInput);
  const briefZones = applyCreativeBriefToZones(rawLayout.zones, brief, input.text);
  const layoutWithBrief = {
    ...rawLayout,
    brief: rawLayout.brief ?? brief,
    layoutId: effectiveLayoutId,
    patternId: brief.recommendedComposition ?? rawLayout.patternId,
    zones: briefZones,
  };
  const composition =
    input.chooseComposition?.({
      ...pickerInput,
      layout: layoutWithBrief,
      layoutId: layoutWithBrief.layoutId,
    }) ??
    chooseBaseCocoComposition({
      backgroundOnlyHero: input.backgroundOnlyHero,
      brief,
      eventName: input.eventName,
      faceZone: input.faceZone,
      format: input.format,
      hasSubject: input.hasSubject,
      layoutId: effectiveLayoutId,
      scene: input.scene ?? null,
      subjectZone: input.subjectZone,
      text: input.text,
      zones: layoutWithBrief.zones,
    });
  const composedLayout = {
    ...layoutWithBrief,
    composition,
    zones: applyCompositionToZones(layoutWithBrief.zones, composition),
  };
  const typography = input.chooseTypography({
    ...pickerInput,
    layout: composedLayout,
    layoutId: composedLayout.layoutId,
  });
  const palette = input.choosePalette({
    ...pickerInput,
    layout: composedLayout,
    layoutId: composedLayout.layoutId,
  });
  const typographyStack = buildConceptTypographyStack({
    concept: {
      brief,
      layout: composedLayout,
      moodProfile,
      name: direction.name,
    },
    debugReason: "Concept built CocoTypographyStackModel before tournament scoring.",
    faceZone: input.faceZone,
    format: input.format,
    palette,
    text: input.text,
    typography,
  });
  const effects = input.chooseEffects({
    ...pickerInput,
    layout: composedLayout,
    layoutId: composedLayout.layoutId,
  });

  return {
    brief,
    direction,
    effects,
    id,
    improvements: improvement ? [improvement] : [],
    layout: composedLayout,
    moodProfile,
    name: direction.name,
    palette,
    stage,
    typography,
    typographyStack,
  };
}

function layoutIdForScene(scene?: SceneInterpretation | null): CocoTournamentLayoutId | null {
  const composition = scene?.creativeDecisions.composition;
  if (!composition) return null;
  if (composition.typeField === "left") return "subject-right";
  if (composition.typeField === "right") return "subject-left";
  if (
    composition.typeField === "center" ||
    composition.typeField === "top" ||
    composition.typeField === "bottom" ||
    composition.typeField === "split"
  ) {
    return "subject-center";
  }
  return null;
}

function improveConcept<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  const weakest = concept.score?.weakestCategory ?? "premiumPolish";
  const improvement = improvementForWeakness(weakest);
  const next = buildConcept(input, {
    direction: concept.direction,
    id: `${concept.id}:improved`,
    improvement,
    stage: "improved",
  });

  return applyConceptImprovement(next, weakest);
}

function scoreConcept<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  const snapshot = buildConceptSnapshot(input, concept);
  const findings = runCocoRules(snapshot);
  const result = runCocoFinalArtDirectorPass({ findings, snapshot });
  const predictedScore = applyFirstDraftStabilityGates(
    input,
    concept,
    applyImprovementPrediction(result.score, concept.improvements)
  );
  const score = applyCocoLearningToScore(
    predictedScore,
    buildConceptLearningSuggestion(input, concept),
    input.learning,
    String(input.nightlifeStyle ?? concept.moodProfile.primaryMood ?? "general")
  );
  return {
    ...concept,
    score,
  };
}

function applyFirstDraftStabilityGates<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>,
  score: NonNullable<CocoFlyerConcept["score"]>
) {
  const adjusted = { ...score };
  if (input.backgroundOnlyHero && concept.layout.layoutId === "subject-center") {
    const style = String(input.nightlifeStyle ?? "");
    const impactStyle = /^(edm|techno|hip-hop|throwback)$/.test(style);
    const penalty = impactStyle ? 6 : 12;
    adjusted.composition = Math.round(clamp(adjusted.composition - penalty, 0, 100));
    adjusted.spacing = Math.round(clamp(adjusted.spacing - penalty, 0, 100));
    adjusted.premiumPolish = Math.round(clamp(adjusted.premiumPolish - penalty * 0.75, 0, 100));
    adjusted.overallQuality = Math.round(clamp(adjusted.overallQuality - penalty, 0, 100));
    if (adjusted.weakestCategory !== "readability") {
      adjusted.weakestCategory = "composition";
      adjusted.critique = "The first draft needs a calmer structure around the hero image.";
      adjusted.suggestedFixes = [
        "Move the subject toward one side and give the headline a cleaner lane.",
        "Keep support copy smaller than the headline and away from the face.",
      ];
    }
  }
  return adjusted;
}

function buildConceptLearningSuggestion<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>
): CocoLearningSuggestion {
  const typographyPersonality = concept.typography.metadata?.personality;
  return {
    conceptId: concept.id,
    directionId: concept.direction.id,
    headlineTreatment: concept.typography.headline.treatment,
    layoutId: concept.layout.layoutId,
    moodId: concept.moodProfile.primaryMood,
    nightlifeStyle: input.nightlifeStyle ?? null,
    paletteId: concept.direction.paletteStyle,
    paletteStyle: concept.direction.paletteStyle,
    score: concept.score?.overallQuality ?? 0,
    typographyId: typographyPersonality ?? concept.typography.headline.fontFamily,
    typographyPersonality,
  };
}

function chooseHeadToHeadWinner<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(concepts: Array<CocoFlyerConcept<TPalette, TEffects>>) {
  if (!concepts.length) return null;
  return concepts.slice(1).reduce((winner, challenger) => compareHeadToHead(winner, challenger), concepts[0]);
}

function compareHeadToHead<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  a: CocoFlyerConcept<TPalette, TEffects>,
  b: CocoFlyerConcept<TPalette, TEffects>
) {
  if (!a.score) return b;
  if (!b.score) return a;

  let aWins = 0;
  let bWins = 0;
  for (const key of HEAD_TO_HEAD_KEYS) {
    if (a.score[key] > b.score[key]) aWins += 1;
    if (b.score[key] > a.score[key]) bWins += 1;
  }
  if (aWins !== bWins) return aWins > bWins ? a : b;
  return (a.score.overallQuality ?? 0) >= (b.score.overallQuality ?? 0) ? a : b;
}

function compareByScore<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(a: CocoFlyerConcept<TPalette, TEffects>, b: CocoFlyerConcept<TPalette, TEffects>) {
  return (
    (b.score?.overallQuality ?? 0) - (a.score?.overallQuality ?? 0) ||
    (b.score?.premiumPolish ?? 0) - (a.score?.premiumPolish ?? 0) ||
    (b.score?.brandFit ?? 0) - (a.score?.brandFit ?? 0) ||
    (b.score?.originality ?? 0) - (a.score?.originality ?? 0)
  );
}

function buildConceptMoodProfile(
  input: CocoConceptDirectorInput,
  direction: (typeof COCO_CONCEPT_DIRECTIONS)[number]
): CocoMoodProfile {
  const primaryVector = baseMoodVector(direction.moodId);
  const secondaryVector = direction.secondaryMoodId ? baseMoodVector(direction.secondaryMoodId) : null;
  const baseVector = input.baseMoodProfile.vector;
  const blend = (key: keyof CocoMoodProfile["vector"]) =>
    clamp(
      primaryVector[key] * 0.58 +
        (secondaryVector ? secondaryVector[key] * 0.18 : 0) +
        baseVector[key] * (secondaryVector ? 0.24 : 0.42),
      0,
      100
    );

  const moodScores = { ...input.baseMoodProfile.moodScores };
  moodScores[direction.moodId] = Math.max(moodScores[direction.moodId] ?? 0, 96);
  if (direction.secondaryMoodId) {
    moodScores[direction.secondaryMoodId] = Math.max(moodScores[direction.secondaryMoodId] ?? 0, 82);
  }

  return {
    ...input.baseMoodProfile,
    confidence: Math.max(input.baseMoodProfile.confidence, 0.78),
    designDirection: mergeMoodDirection(direction.moodId, direction.secondaryMoodId),
    moodScores,
    moodTags: moodTagsFor(direction.moodId, direction.secondaryMoodId),
    primaryMood: direction.moodId,
    secondaryMood: direction.secondaryMoodId,
    vector: {
      elegance: blend("elegance"),
      energy: blend("energy"),
      exclusivity: blend("exclusivity"),
      playfulness: blend("playfulness"),
      sensuality: blend("sensuality"),
      summer: blend("summer"),
      underground: blend("underground"),
    },
  };
}

function buildConceptSnapshot<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>
): CocoCanvasSnapshot {
  const zones = concept.layout.zones;
  const textNodes = [
    ...buildStackTextNodes(input, concept),
    buildTextNodeForSource("headline", "headline", zones.headline, input.text.headline, concept),
    buildTextNodeForSource("script", "headline2", zones.script, input.text.script, concept),
    buildTextNodeForSource("details", "details", zones.leftInfo, input.text.details, concept),
    buildTextNodeForSource("details2", "details2", zones.rightInfo, input.text.details2, concept),
    buildTextNodeForSource("venue", "venue", zones.venue, input.text.venue, concept),
    buildTextNodeForSource("date", "date", zones.date, input.text.date, concept),
    buildTextNodeForSource("price", "price", zones.price, input.text.price, concept),
    buildTextNodeForSource("presenter", "presenter", zones.presenter, input.text.presenter, concept),
    buildTextNodeForSource("subtag", "subtag", zones.subtag, input.text.subtag, concept),
  ].filter((node): node is NonNullable<typeof node> => Boolean(node));

  return buildCocoCanvasSnapshot({
    activeTarget: { type: "export" },
    artboardRect: rectToCanvas({ x: 0, y: 0, width: 100, height: 100 }),
    format: input.format,
    hasSubject: input.hasSubject,
    headlineText: input.text.headline ?? input.eventName,
    nightlifeStyle: input.nightlifeStyle ?? "general-nightlife",
    phase: "export",
    subjectIssue: input.hasSubject
      ? {
          rect: rectToCanvas(concept.layout.zones.subject),
          type: null,
        }
      : null,
    textNodes,
    tone: "premium",
  });
}

function buildStackTextNodes<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoConceptDirectorInput<TPalette, TEffects>,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  const stack = concept.typographyStack;
  if (!stack) return [];
  const canvasHeight = input.format === "story" ? 1920 : 1080;
  const itemById = new Map(stack.items.map((item) => [item.id, item]));

  return drawTypographyStackTextLayers({
    height: canvasHeight,
    model: stack,
  }).map((layer) => {
    const item = itemById.get(layer.id);
    const role = stackLayerRole(layer.id);
    const lineHeight = Number(layer.lineHeight ?? 1) || 1;
    const lineCount = Math.max(1, layer.text.split(/\r?\n/).filter(Boolean).length);
    const height = ((Number(layer.fontSize) * lineHeight * lineCount) / canvasHeight) * 100;
    const rect = rectToCanvas({
      height,
      width: layer.widthPct ?? stack.rect.width,
      x: layer.xPct,
      y: layer.yPct,
    });
    const textColor = layer.color ?? colorForRole(role, concept.palette);

    return {
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      letterSpacing: layer.letterSpacingEm,
      lineHeight,
      opticalCenter: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      priority: item ? Math.max(1, Math.round(item.visualPower / 10)) : priorityForRole(role),
      readability: plannedReadability(role, textColor, concept),
      rect,
      role,
      strokeWidth: layer.strokeWidth ?? 0,
      text: layer.text,
      textAlign: layer.align ?? stack.alignment,
      textColor,
      textShadow: layer.textShadow ?? "",
      visualRect: rect,
    };
  });
}

function buildTextNodeForSource<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  source: CocoCompositionSource,
  role: CocoTextRole,
  zone: CocoTournamentRect | undefined,
  text: string | undefined,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  if (stackOwnsSource(concept.typographyStack, source)) return null;
  return buildTextNode(role, zone, text, concept.typography, concept.palette, concept);
}

function stackLayerRole(id: string): CocoTextRole {
  if (id.includes("headline")) return "headline";
  if (id.includes("accent")) return "headline2";
  if (id.includes("metadata")) return "details";
  if (id.includes("secondary")) return "details2";
  if (id.includes("date")) return "date";
  if (id.includes("venue")) return "venue";
  return "details";
}

function buildTextNode<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  role: CocoTextRole,
  zone: CocoTournamentRect | undefined,
  text: string | undefined,
  typography: CocoTypographyDecision,
  palette: TPalette,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  if (!zone || !String(text ?? "").trim()) return null;
  const layer = typographyLayerForRole(role, typography);
  const fontSize = plannedFontSize(role, zone, String(text ?? ""), layer, concept);
  const textColor = colorForRole(role, palette);
  const rect = rectToCanvas(zone);

  return {
    fontFamily: layer?.fontFamily,
    fontSize,
    fontWeight: layer?.weight,
    letterSpacing: layer?.letterSpacing,
    lineHeight: layer?.lineHeight,
    opticalCenter: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    priority: priorityForRole(role),
    readability: plannedReadability(role, textColor, concept),
    rect,
    role,
    strokeWidth: role === "headline" ? typography.headline.strokeWidth : 0,
    text,
    textAlign: zone.align ?? "center",
    textColor,
    textShadow:
      role === "headline"
        ? String(typography.headline.shadow > 0.2 ? "planned-shadow" : "")
        : "planned-shadow",
    visualRect: rect,
  };
}

function typographyLayerForRole(role: CocoTextRole, typography: CocoTypographyDecision) {
  switch (role) {
    case "headline":
      return typography.headline;
    case "headline2":
      return typography.subheadline;
    case "details":
      return typography.details;
    case "details2":
      return typography.details2;
    case "venue":
      return typography.venue;
    case "date":
      return typography.date;
    case "price":
      return typography.price;
    case "presenter":
      return typography.presenter;
    case "subtag":
      return typography.subtag;
    default:
      return typography.details;
  }
}

function plannedFontSize<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  role: CocoTextRole,
  zone: CocoTournamentRect,
  text: string,
  layer: ReturnType<typeof typographyLayerForRole>,
  concept: CocoFlyerConcept<TPalette, TEffects>
) {
  const baseByRole: Record<CocoTextRole, number> = {
    date: 20,
    details: 14,
    details2: 11,
    headline: 84,
    headline2: 36,
    leftRail: 10,
    presenter: 15,
    price: 20,
    rightRail: 10,
    subtag: 12,
    venue: 11,
  };
  const lines = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const lineCount = Math.max(1, lines.length);
  const longestLine = lines.reduce((longest, line) => Math.max(longest, line.length), 1);
  const roleBase = baseByRole[role] ?? 12;
  const lineHeight = clamp(Number(layer?.lineHeight) || 1, 0.62, 1.35);
  const heightFactor =
    role === "headline"
      ? 5.8
      : role === "headline2"
      ? 5.1
      : role === "date" || role === "price"
      ? 4.8
      : role === "details"
      ? 4.25
      : role === "details2"
      ? 4.05
      : 3.95;
  const widthFactor =
    role === "headline"
      ? 13.6
      : role === "headline2"
      ? 9.2
      : role === "date" || role === "price"
      ? 8.4
      : role === "details"
      ? 8.2
      : role === "details2"
      ? 7.7
      : 7.8;
  const zoneHeightCap = (zone.height * heightFactor) / Math.max(1, lineCount * lineHeight);
  const zoneWidthCap = (zone.width * widthFactor) / Math.max(4, longestLine);
  const directionBoost =
    concept.direction.layoutStyle === "bold-center" && role === "headline"
      ? 1.12
      : concept.direction.layoutStyle === "spacious" && role !== "headline"
        ? 0.94
        : 1;
  const sizeScale = clamp(Number(layer?.sizeScale) || 1, 0.72, 1.28);
  return Math.round(clamp(Math.min(roleBase, zoneHeightCap, zoneWidthCap) * sizeScale * directionBoost, 5, 150));
}

function plannedReadability<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  role: CocoTextRole,
  textColor: string,
  concept: CocoFlyerConcept<TPalette, TEffects>
): CocoTextReadability {
  const contrast = contrastScoreForColor(textColor);
  const moodBonus = concept.moodProfile.vector.elegance > 75 || concept.moodProfile.vector.energy > 75 ? 4 : 0;
  const improvementBonus = concept.improvements.some((item) => item.category === "readability") ? 12 : 0;
  const base = clamp(contrast + moodBonus + improvementBonus, 0, 100);
  const metrics: CocoReadabilityMetric[] = [
    metric("contrast", base, "The planned text contrast is being checked.", "Use stronger separation on this text."),
    metric("text_size", role === "headline" ? 86 : role === "headline2" ? 78 : 72, "The planned type scale is readable.", "Increase the type size slightly."),
    metric(
      "background_complexity",
      concept.direction.effectsStyle === "grain-glitch" ? 62 : concept.direction.effectsStyle === "light-beams" ? 68 : 78,
      "The planned background activity could affect readability.",
      "Quiet the background behind the text."
    ),
    metric("edge_distance", 78, "The planned text has usable margins.", "Move the text farther from the edge."),
    metric("glow_interference", concept.direction.effectsStyle === "grain-glitch" ? 66 : 82, "The planned glow is controlled.", "Reduce glow around this text."),
    metric("shadow_effectiveness", 78, "The planned shadow supports readability.", "Add a cleaner readability shadow."),
    metric("stroke_effectiveness", role === "headline" ? 80 : 72, "The planned stroke is controlled.", "Use a cleaner stroke or remove it."),
  ];
  const weakestMetric = metrics.reduce((weakest, item) => (item.score < weakest.score ? item : weakest), metrics[0]);
  return {
    contrastRatio: null,
    metrics,
    overallScore: Math.round(
      clamp(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length, 0, 100)
    ),
    weakestMetric,
  };
}

function metric(
  id: CocoReadabilityMetricId,
  score: number,
  observation: string,
  recommendation: string
): CocoReadabilityMetric {
  return {
    id,
    label: id.replace(/_/g, " "),
    observation,
    recommendation,
    score: Math.round(clamp(score, 0, 100)),
  };
}

function colorForRole(role: CocoTextRole, palette: CocoConceptPaletteLike) {
  switch (role) {
    case "headline":
      return palette.headline ?? palette.palette?.primary ?? "#fff4cc";
    case "headline2":
      return palette.subheadline ?? palette.palette?.secondary ?? "#ffffff";
    case "details":
      return palette.details ?? palette.palette?.neutral ?? "#ffffff";
    case "details2":
      return palette.details2 ?? palette.palette?.secondary ?? "#ffffff";
    case "venue":
      return palette.venue ?? palette.palette?.accent ?? "#ffffff";
    case "date":
    case "price":
      return palette.utility ?? palette.palette?.neutral ?? "#ffffff";
    case "presenter":
      return palette.presenter ?? palette.palette?.accent ?? "#ffffff";
    case "subtag":
      return palette.subtag ?? palette.palette?.secondary ?? "#ffffff";
    default:
      return "#ffffff";
  }
}

function contrastScoreForColor(color: string) {
  const parsed = parseHexColor(color);
  if (!parsed) return 74;
  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  return luminance > 0.72 ? 88 : luminance > 0.44 ? 76 : 64;
}

function rectToCanvas(rect: CocoTournamentRect) {
  return {
    bottom: rect.y + rect.height,
    height: rect.height,
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
    width: rect.width,
  };
}

function priorityForRole(role: CocoTextRole) {
  switch (role) {
    case "headline":
      return 10;
    case "headline2":
      return 8;
    case "details":
      return 6;
    case "date":
    case "venue":
      return 5;
    case "details2":
    case "price":
      return 4;
    default:
      return 2;
  }
}

function improvementForWeakness(category: string): CocoConceptImprovement {
  switch (category) {
    case "readability":
      return {
        category,
        description: "Strengthened contrast and reduced visual noise behind key text.",
      };
    case "spacing":
      return {
        category,
        description: "Opened up the text zones and created more breathing room.",
      };
    case "colorHarmony":
      return {
        category,
        description: "Tightened the palette around the concept mood.",
      };
    case "hierarchy":
      return {
        category,
        description: "Gave the headline more authority and reduced competing details.",
      };
    case "originality":
      return {
        category,
        description: "Added one stronger signature move without disturbing readability.",
      };
    case "premiumPolish":
    default:
      return {
        category,
        description: "Refined effects, spacing, and type restraint.",
      };
  }
}

function applyConceptImprovement<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  concept: CocoFlyerConcept<TPalette, TEffects>,
  category: string
): CocoFlyerConcept<TPalette, TEffects> {
  if (category === "spacing") {
    return {
      ...concept,
      layout: {
        ...concept.layout,
        zones: addBreathingRoom(concept.layout.zones),
      },
    };
  }

  if (category === "hierarchy") {
    return {
      ...concept,
      layout: {
        ...concept.layout,
        zones: strengthenHierarchyZones(concept.layout.zones),
      },
    };
  }

  if (category === "originality") {
    return {
      ...concept,
      layout: {
        ...concept.layout,
        zones: addSignatureMoveZones(concept.layout.zones, concept.direction.layoutId),
      },
    };
  }

  return concept;
}

function applyImprovementPrediction(
  score: NonNullable<CocoFlyerConcept["score"]>,
  improvements: CocoConceptImprovement[]
) {
  if (!improvements.length) return score;
  const adjusted = { ...score };
  for (const improvement of improvements) {
    const boosts = boostsForImprovement(improvement.category);
    for (const [key, amount] of Object.entries(boosts) as Array<[ScoreKey, number]>) {
      adjusted[key] = Math.round(clamp(adjusted[key] + amount, 0, 100));
    }
  }

  adjusted.professional = Math.round(
    adjusted.hierarchy * 0.15 +
      adjusted.composition * 0.15 +
      adjusted.spacing * 0.12 +
      adjusted.typography * 0.12 +
      adjusted.colorHarmony * 0.1 +
      adjusted.lightingConsistency * 0.1 +
      adjusted.depth * 0.08 +
      adjusted.texture * 0.05 +
      adjusted.readability * 0.13
  );
  adjusted.luxury = Math.round(
    adjusted.spacing * 0.18 +
      adjusted.typography * 0.18 +
      adjusted.colorHarmony * 0.14 +
      adjusted.lightingConsistency * 0.12 +
      adjusted.premiumPolish * 0.2 +
      adjusted.texture * 0.08 +
      adjusted.emotion * 0.1
  );
  adjusted.energy = Math.round(
    adjusted.composition * 0.22 +
      adjusted.colorHarmony * 0.16 +
      adjusted.typography * 0.14 +
      adjusted.depth * 0.12 +
      adjusted.emotion * 0.2 +
      adjusted.originality * 0.16
  );
  adjusted.overallQuality = Math.round(
    adjusted.professional * 0.28 +
      adjusted.readability * 0.18 +
      adjusted.premiumPolish * 0.18 +
      adjusted.brandFit * 0.14 +
      adjusted.emotion * 0.12 +
      adjusted.originality * 0.1
  );

  const categoryEntries = ([
    "brandFit",
    "colorHarmony",
    "composition",
    "depth",
    "emotion",
    "hierarchy",
    "lightingConsistency",
    "originality",
    "premiumPolish",
    "readability",
    "spacing",
    "texture",
    "typography",
  ] as ScoreKey[]).map((key) => [key, adjusted[key]] as const);
  adjusted.weakestCategory = categoryEntries.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "premiumPolish";
  adjusted.critique = critiqueForWeakness(adjusted.weakestCategory);
  adjusted.suggestedFixes = fixesForWeakness(adjusted.weakestCategory);
  return adjusted;
}

function boostsForImprovement(category: string): Partial<Record<ScoreKey, number>> {
  switch (category) {
    case "readability":
      return { premiumPolish: 3, readability: 9 };
    case "spacing":
      return { composition: 3, premiumPolish: 4, spacing: 10 };
    case "colorHarmony":
      return { brandFit: 4, colorHarmony: 10, emotion: 3 };
    case "hierarchy":
      return { hierarchy: 10, typography: 3 };
    case "originality":
      return { emotion: 4, originality: 10 };
    case "premiumPolish":
    default:
      return { lightingConsistency: 3, premiumPolish: 9, texture: 4, typography: 3 };
  }
}

function addBreathingRoom(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  return {
    ...zones,
    headline: { ...zones.headline, height: Math.max(10, zones.headline.height - 1.2), y: zones.headline.y - 0.8 },
    leftInfo: { ...zones.leftInfo, height: Math.max(7, zones.leftInfo.height - 1), y: zones.leftInfo.y + 1.4 },
    rightInfo: { ...zones.rightInfo, height: Math.max(6, zones.rightInfo.height - 1), y: zones.rightInfo.y + 1.2 },
    venue: { ...zones.venue, y: Math.min(94, zones.venue.y + 1.1) },
  };
}

function strengthenHierarchyZones(zones: CocoTournamentZoneMap): CocoTournamentZoneMap {
  return {
    ...zones,
    headline: {
      ...zones.headline,
      height: Math.min(24, zones.headline.height + 1.5),
      width: Math.min(92, zones.headline.width + 2),
      x: Math.max(4, zones.headline.x - 1),
    },
    date: { ...zones.date, height: Math.max(7, zones.date.height - 1) },
    price: { ...zones.price, height: Math.max(7, zones.price.height - 1) },
  };
}

function addSignatureMoveZones(
  zones: CocoTournamentZoneMap,
  layoutId: string
): CocoTournamentZoneMap {
  const scriptShift = layoutId === "subject-center" ? -3 : 2;
  return {
    ...zones,
    script: {
      ...zones.script,
      x: clamp(zones.script.x + scriptShift, 3, 92 - zones.script.width),
      y: clamp(zones.script.y + 1.2, 4, 95),
    },
  };
}

function critiqueForWeakness(category: ScoreKey) {
  const critiques: Record<ScoreKey, string> = {
    brandFit: "The direction needs a closer match to the event mood.",
    colorHarmony: "The palette needs a stronger relationship between the type and image.",
    composition: "The composition needs a more stable center of gravity.",
    depth: "The concept needs stronger foreground, subject, and background separation.",
    emotion: "The concept needs a stronger feeling.",
    hierarchy: "The reading order needs more authority.",
    lightingConsistency: "The lighting and effects need to feel more unified.",
    originality: "The concept needs one more memorable move.",
    premiumPolish: "The concept needs tighter finishing details.",
    readability: "The important information needs cleaner separation.",
    spacing: "The concept needs more breathing room.",
    texture: "The effects need more restraint.",
    typography: "The type system needs more polish.",
  };
  return critiques[category];
}

function fixesForWeakness(category: ScoreKey) {
  const fixes: Record<ScoreKey, string[]> = {
    brandFit: ["Make the mood cues more specific to the event."],
    colorHarmony: ["Tighten the palette around one dominant mood color."],
    composition: ["Move the strongest text block into a cleaner counterweight."],
    depth: ["Add a clearer layer relationship between subject and type."],
    emotion: ["Push one stronger mood cue."],
    hierarchy: ["Make the headline the unmistakable first read."],
    lightingConsistency: ["Reduce effects that fight the scene lighting."],
    originality: ["Add one signature visual move."],
    premiumPolish: ["Clean up small spacing, glow, and alignment details."],
    readability: ["Strengthen contrast behind important text."],
    spacing: ["Open the headline and support text spacing."],
    texture: ["Reduce competing texture and glow."],
    typography: ["Improve the type pairing and scale contrast."],
  };
  return fixes[category];
}

function parseHexColor(value: string) {
  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const raw = match[1];
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : raw;
  return {
    b: Number.parseInt(hex.slice(4, 6), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    r: Number.parseInt(hex.slice(0, 2), 16),
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
