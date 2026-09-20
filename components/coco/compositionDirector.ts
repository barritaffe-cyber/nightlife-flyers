import type {
  CocoCompositionBlock,
  CocoCompositionPatternId,
  CocoCompositionRole,
  CocoCompositionSystem,
  CocoCopyTreatment,
  CocoCreativeBrief,
  CocoTournamentAlign,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentText,
  CocoTournamentZoneMap,
} from "./layoutTournament";
import type { SceneInterpretation } from "../../coco-scene-interpreter";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../../lib/recipes/fashionClubVertical.ts";

export type CocoCompositionInput = {
  backgroundOnlyHero?: boolean;
  brief?: CocoCreativeBrief;
  eventName?: string;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  layoutId: CocoTournamentLayoutId;
  scene?: SceneInterpretation | null;
  subjectZone: CocoTournamentRect;
  text: CocoTournamentText;
  zones: CocoTournamentZoneMap;
};

export type CocoCompositionFromLayoutInput = {
  backgroundOnlyHero?: boolean;
  brief?: CocoCreativeBrief;
  eventName?: string;
  faceZone?: CocoTournamentRect | null;
  format?: CocoTournamentFormat;
  hasSubject?: boolean;
  layoutId: CocoTournamentLayoutId;
  scene?: SceneInterpretation | null;
  subjectZone?: CocoTournamentRect;
  text?: CocoTournamentText;
  zones: CocoTournamentZoneMap;
};

export function chooseCocoComposition(input: CocoCompositionInput): CocoCompositionSystem {
  const candidates = generateCompositionCandidates(input)
    .map((candidate) => ({
      ...candidate,
      score: scoreComposition(candidate, input),
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0] ?? buildFallbackComposition(input);
}

export function buildCocoCompositionSystemFromLayout(
  input: CocoCompositionFromLayoutInput
): CocoCompositionSystem {
  return chooseCocoComposition({
    backgroundOnlyHero: input.backgroundOnlyHero,
    brief: input.brief,
    eventName: input.eventName,
    faceZone: input.faceZone,
    format: input.format ?? "square",
    hasSubject: Boolean(input.hasSubject),
    layoutId: input.layoutId,
    scene: input.scene,
    subjectZone: input.subjectZone ?? input.zones.subject,
    text: input.text ?? {},
    zones: input.zones,
  });
}

export function applyCompositionToZones(
  zones: CocoTournamentZoneMap,
  composition: CocoCompositionSystem
): CocoTournamentZoneMap {
  const next: CocoTournamentZoneMap = {
    ...zones,
    date: { ...zones.date },
    headline: { ...zones.headline },
    leftInfo: { ...zones.leftInfo },
    presenter: { ...zones.presenter },
    price: { ...zones.price },
    rightInfo: { ...zones.rightInfo },
    script: { ...zones.script },
    subject: { ...zones.subject },
    subtag: { ...zones.subtag },
    venue: { ...zones.venue },
  };

  for (const block of composition.blocks) {
    if (block.source === "headline") next.headline = block.rect;
    if (block.source === "script") next.script = block.rect;
    if (block.source === "details") next.leftInfo = block.rect;
    if (block.source === "details2") next.rightInfo = block.rect;
    if (block.source === "date") next.date = block.rect;
    if (block.source === "venue") next.venue = block.rect;
    if (block.source === "price") next.price = block.rect;
    if (block.source === "presenter") next.presenter = block.rect;
    if (block.source === "subtag") next.subtag = block.rect;
  }

  if (composition.rendererZones) {
    return {
      ...next,
      date: composition.rendererZones.date ?? next.date,
      headline: composition.rendererZones.headline ?? next.headline,
      leftInfo: composition.rendererZones.leftInfo ?? next.leftInfo,
      presenter: composition.rendererZones.presenter ?? next.presenter,
      price: composition.rendererZones.price ?? next.price,
      rightInfo: composition.rendererZones.rightInfo ?? next.rightInfo,
      script: composition.rendererZones.script ?? next.script,
      subtag: composition.rendererZones.subtag ?? next.subtag,
      subject: composition.rendererZones.subject ?? next.subject,
      venue: composition.rendererZones.venue ?? next.venue,
    };
  }

  if (composition.copyTreatment.details2 === "hide" || composition.copyTreatment.details2 === "mute") {
    next.rightInfo = { ...next.rightInfo, height: 1, width: 1 };
  }

  if (composition.copyTreatment.details2 === "merge") {
    next.leftInfo = {
      ...next.leftInfo,
      height: next.leftInfo.height + 3,
    };
    next.rightInfo = { ...next.rightInfo, height: 1, width: 1 };
  }

  return next;
}

// Uses the face's actual position directly to decide the layout, instead
// of generating several fixed-template candidates and relying on a score
// to happen to prefer whichever one avoids it. If the face is clearly to
// one side, text goes to the other, built directly around the real face
// edge (columnAroundFace). If it's roughly centered, no horizontal side
// has enough guaranteed room, so the vertically-separated layout (text
// below the subject, never sharing a row with the face at all) is used
// instead - the one pattern that's structurally safe regardless of
// exactly where a centered face sits.
function faceDirectedPattern(
  input: CocoCompositionInput
): "left-premium-stack" | "right-premium-stack" | "bottom-lockup" | null {
  const face = input.faceZone;
  // A subject exists but there's no real face box yet - side-stack patterns
  // (left/right-premium-stack) need real coordinates to safely avoid the
  // face; without them they'd fall through to the old scoring-based
  // candidates, which could still pick a side-stack pattern with no face
  // awareness at all. bottom-lockup is safe regardless of exactly where
  // the face is (it never shares a row with it), so that's the forced
  // fallback instead of ever risking a layout with no face data behind it.
  if (input.hasSubject && (!face || face.width <= 1 || face.height <= 1)) return "bottom-lockup";
  if (!face || face.width <= 1 || face.height <= 1) return null;
  const centerX = face.x + face.width / 2;
  if (centerX >= 58) return "left-premium-stack";
  if (centerX <= 42) return "right-premium-stack";
  return "bottom-lockup";
}

function generateCompositionCandidates(input: CocoCompositionInput): CocoCompositionSystem[] {
  const candidates: CocoCompositionSystem[] = [];
  const preferred = input.brief?.recommendedComposition === "fashion-club-vertical" ||
    input.brief?.recommendedComposition === "golden-hero-editorial"
    ? input.brief.recommendedComposition
    : sceneCompositionPattern(input.scene) ?? input.brief?.recommendedComposition;

  // This curated grammar deliberately uses a full-bleed background hero with
  // a right-side identity rail. Subject-left is a crop instruction inside the
  // centered native canvas, so generic face-directed side-stack replacement
  // must not erase the selected campaign contract.
  if (preferred === "fashion-club-vertical") {
    candidates.push(buildFashionClubVertical(input));
    return dedupeCompositionCandidates(candidates);
  }
  if (preferred === "golden-hero-editorial") {
    candidates.push(buildGoldenHeroEditorial(input));
    return dedupeCompositionCandidates(candidates);
  }

  const faceDirected = faceDirectedPattern(input);
  if (faceDirected === "left-premium-stack") {
    candidates.push(buildLeftPremiumStack(input));
    return dedupeCompositionCandidates(candidates);
  }
  if (faceDirected === "right-premium-stack") {
    candidates.push(buildRightPremiumStack(input));
    return dedupeCompositionCandidates(candidates);
  }
  if (faceDirected === "bottom-lockup") {
    candidates.push(buildBottomLockup(input));
    return dedupeCompositionCandidates(candidates);
  }

  const forcedPattern = forcedCounterweightPattern(input);
  if (forcedPattern === "left-premium-stack") {
    candidates.push(buildLeftPremiumStack(input));
    return dedupeCompositionCandidates(candidates);
  }

  if (forcedPattern === "right-premium-stack") {
    candidates.push(buildRightPremiumStack(input));
    return dedupeCompositionCandidates(candidates);
  }

  if (preferred === "left-premium-stack") candidates.push(buildLeftPremiumStack(input));
  if (preferred === "right-premium-stack") candidates.push(buildRightPremiumStack(input));
  if (preferred === "center-poster-stack") candidates.push(buildCenterPosterStack(input));
  if (preferred === "bottom-lockup") candidates.push(buildBottomLockup(input));

  if (input.layoutId === "subject-right") {
    candidates.push(buildLeftPremiumStack(input));
  }

  if (input.layoutId === "subject-left") {
    candidates.push(buildRightPremiumStack(input));
  }

  if (input.layoutId === "subject-center") {
    candidates.push(buildBottomLockup(input));
    candidates.push(buildCenterPosterStack(input));
  }

  candidates.push(buildLeftPremiumStack(input));
  candidates.push(buildRightPremiumStack(input));

  return dedupeCompositionCandidates(candidates);
}

function buildFashionClubVertical(input: CocoCompositionInput): CocoCompositionSystem {
  const recipe = getFashionClubVerticalFormatRecipe(input.format);
  const recipeHierarchy = FASHION_CLUB_VERTICAL_RECIPE.runtime.hierarchy;
  const recipeRhythm = FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm;
  const withAlign = (
    rect: CocoTournamentRect,
    align: CocoTournamentAlign
  ): CocoTournamentRect => ({ ...rect, align });
  const blocks: CocoCompositionBlock[] = [
    { align: "center", priority: 3, rect: withAlign(recipe.zones.presenter, "center"), role: "footer", source: "presenter" },
    { align: "center", minVisualPower: recipeHierarchy.headlinePowerMin, priority: 1, rect: withAlign(recipe.zones.headlinePrimary, "center"), role: "headline", source: "headline" },
    { align: "center", minVisualPower: 96, priority: 1, rect: withAlign(recipe.zones.headlineSecondary, "center"), role: "headline", source: "headline" },
    { align: "left", maxVisualPower: recipeHierarchy.bodyPowerMaxRatio * 100, priority: 3, rect: withAlign(recipe.zones.talentPolicy, "left"), role: "primaryMeta", source: "details2" },
    { align: "left", maxVisualPower: recipeHierarchy.metadataPowerMaxRatio * 100, priority: 3, rect: withAlign(recipe.zones.date, "left"), role: "dateTime", source: "date" },
    { align: "center", maxVisualPower: 16, priority: 4, rect: withAlign(recipe.zones.doors, "center"), role: "footer", source: "subtag" },
    { align: "left", maxVisualPower: 38, priority: 4, rect: withAlign(recipe.zones.venue, "left"), role: "venue", source: "venue" },
    { align: "center", maxVisualPower: 6, priority: 5, rect: withAlign(recipe.zones.compliance, "center"), role: "footer", source: "compliance" },
  ];
  const rendererZones: Partial<CocoTournamentZoneMap> = {
    date: withAlign(recipe.zones.date, "left"),
    headline: withAlign(recipe.zones.headlinePrimary, "center"),
    leftInfo: withAlign(recipe.zones.primaryMeta, "left"),
    presenter: withAlign(recipe.zones.presenter, "center"),
    price: withAlign(recipe.zones.optionalBadge, "right"),
    rightInfo: withAlign(recipe.zones.talentPolicy, "left"),
    subject: withAlign(recipe.subjectRect, "left"),
    subtag: withAlign(recipe.zones.doors, "center"),
    venue: withAlign(recipe.zones.venue, "left"),
  };

  return {
    alignment: "right",
    allBlocks: blocks,
    anchorSide: "right",
    blocks,
    brief: input.brief,
    copyTreatment: {
      date: "hero-date",
      details: "hide",
      details2: "keep",
      script: "hide",
      venue: "footer",
    },
    explanation:
      "A full-bleed fashion hero owns the left field while two vertical identity rails and a structured footer anchor the right and bottom edges.",
    hierarchy: { ...recipeHierarchy },
    layoutId: "subject-center",
    patternId: "fashion-club-vertical",
    rendererZones,
    rhythm: {
      accentToMeta: recipeRhythm.accentToMeta,
      dateTimeToVenue: recipeRhythm.dateTimeToVenue,
      headlineToAccent: recipeRhythm.headlineToAccent,
      metaToDateTime: recipeRhythm.metaToDateTime,
    },
    score: 0,
    textColumn: withAlign(recipe.textColumn, "right"),
  };
}

function buildGoldenHeroEditorial(input: CocoCompositionInput): CocoCompositionSystem {
  const story = input.format === "story";
  const rects = story
    ? {
        presenter: { align: "right" as const, height: 7, width: 24, x: 70, y: 3 },
        headline: { align: "left" as const, height: 29, width: 42, x: 6, y: 6 },
        script: { align: "left" as const, height: 11, width: 36, x: 6, y: 36.5 },
        date: { align: "left" as const, height: 7, width: 15, x: 6, y: 56.5 },
        subtag: { align: "left" as const, height: 2.5, width: 15, x: 6, y: 64 },
        rightInfo: { align: "left" as const, height: 7.5, width: 67, x: 25, y: 57 },
        leftInfo: { align: "left" as const, height: 5, width: 67, x: 25, y: 67.5 },
        venue: { align: "left" as const, height: 8, width: 34, x: 6, y: 85 },
        price: { align: "center" as const, height: 10, width: 11, x: 84, y: 84 },
      }
    : {
        presenter: { align: "right" as const, height: 7, width: 24, x: 70, y: 3 },
        headline: { align: "left" as const, height: 30, width: 42, x: 6, y: 7 },
        script: { align: "left" as const, height: 13, width: 34, x: 6, y: 49 },
        date: { align: "left" as const, height: 7, width: 15, x: 6, y: 66 },
        subtag: { align: "left" as const, height: 2.5, width: 15, x: 6, y: 74 },
        rightInfo: { align: "left" as const, height: 6, width: 67, x: 25, y: 66 },
        leftInfo: { align: "left" as const, height: 4, width: 67, x: 25, y: 72.5 },
        venue: { align: "left" as const, height: 8, width: 34, x: 6, y: 85 },
        price: { align: "center" as const, height: 10, width: 11, x: 84, y: 84 },
      };
  const blocks: CocoCompositionBlock[] = [
    { align: "right", priority: 5, rect: rects.presenter, role: "footer", source: "presenter" },
    { align: "left", minVisualPower: 96, priority: 1, rect: rects.headline, role: "headline", source: "headline" },
    { align: "left", maxVisualPower: 42, priority: 2, rect: rects.script, role: "accent", source: "script" },
    { align: "left", maxVisualPower: 24, priority: 3, rect: rects.date, role: "dateTime", source: "date" },
    { align: "left", maxVisualPower: 18, priority: 3, rect: rects.subtag, role: "footer", source: "subtag" },
    { align: "left", maxVisualPower: 28, priority: 3, rect: rects.rightInfo, role: "primaryMeta", source: "details2" },
    { align: "left", hidden: true, maxVisualPower: 18, priority: 4, rect: rects.leftInfo, role: "secondaryMeta", source: "details" },
    { align: "left", maxVisualPower: 22, priority: 4, rect: rects.venue, role: "venue", source: "venue" },
    { align: "center", maxVisualPower: 16, priority: 5, rect: rects.price, role: "badge", source: "price" },
  ];
  return {
    alignment: "left",
    allBlocks: blocks,
    anchorSide: "left",
    blocks,
    brief: input.brief,
    copyTreatment: {
      date: "hero-date",
      details: "hide",
      details2: "keep",
      script: "accent-support",
      venue: "footer",
    },
    explanation: "A right-side hero is balanced by oversized display type, a dedicated handwritten weekday field, a two-column support band, and a structured footer.",
    hierarchy: {
      accentPowerMaxRatio: 0.56,
      bodyPowerMaxRatio: 0.22,
      headlinePowerMin: 96,
      metadataPowerMaxRatio: 0.24,
    },
    layoutId: "subject-right",
    patternId: "golden-hero-editorial",
    rendererZones: rects,
    rhythm: { accentToMeta: 4.4, dateTimeToVenue: 3, headlineToAccent: 3, metaToDateTime: 4.6 },
    score: 0,
    textColumn: { align: "left", height: 88, width: 48, x: 4, y: 6 },
  };
}


function buildLeftPremiumStack(input: CocoCompositionInput): CocoCompositionSystem {
  const column: CocoTournamentRect = columnAroundFace(
    {
      align: "left",
      height: input.format === "story" ? 68 : 74,
      width: input.format === "story" ? 50 : 48,
      x: 6,
      y: input.format === "story" ? 14 : 16,
    },
    input.faceZone,
    input.format
  );

  return buildStackSystem(input, {
    alignment: "left",
    anchorSide: "left",
    column,
    explanation: "The subject carries the right side, so the typography becomes a strong premium stack on the left.",
    layoutId: "subject-right",
    patternId: "left-premium-stack",
  });
}

function buildRightPremiumStack(input: CocoCompositionInput): CocoCompositionSystem {
  const column: CocoTournamentRect = columnAroundFace(
    {
      align: "right",
      height: input.format === "story" ? 68 : 74,
      width: input.format === "story" ? 50 : 48,
      x: input.format === "story" ? 44 : 46,
      y: input.format === "story" ? 14 : 16,
    },
    input.faceZone,
    input.format
  );

  return buildStackSystem(input, {
    alignment: "right",
    anchorSide: "right",
    column,
    explanation: "The subject carries the left side, so the typography becomes a counterweight on the right.",
    layoutId: "subject-left",
    patternId: "right-premium-stack",
  });
}

// The face box is the forbidden zone: once it exists, the column is built
// FROM it, not built from a fixed guess and defensively shrunk if the
// guess happens to reach too far. Left-anchored columns start at the
// canvas's own left margin and extend right until they reach the
// forbidden zone (not stopping earlier just because a fixed template
// guessed a narrower width) - right-anchored columns mirror that, starting
// just past the forbidden zone's right edge and extending to the canvas's
// right margin. Either way the result uses the actual full space next to
// the actual face, maximized, not a fixed percentage that was never
// checked against where the face really is.
function columnAroundFace(
  fallback: CocoTournamentRect,
  faceZone: CocoTournamentRect | null | undefined,
  format: CocoTournamentFormat
): CocoTournamentRect {
  if (!faceZone) return fallback;
  const gutter = format === "story" ? 3.25 : 2.75;
  const minWidth = format === "story" ? 16 : 18;
  const edgeMargin = format === "story" ? 4 : 5;

  if (fallback.align === "right") {
    const zoneRight = faceZone.x + faceZone.width;
    const x = Math.min(100 - minWidth, zoneRight + gutter);
    const width = Math.max(minWidth, 100 - edgeMargin - x);
    return { ...fallback, width, x };
  }

  const zoneLeft = faceZone.x;
  const width = Math.max(minWidth, zoneLeft - gutter - fallback.x);
  return { ...fallback, width };
}

function buildCenterPosterStack(input: CocoCompositionInput): CocoCompositionSystem {
  const column: CocoTournamentRect = {
    align: "center",
    height: 68,
    width: 76,
    x: 12,
    y: input.format === "story" ? 10 : 12,
  };

  return buildStackSystem(input, {
    alignment: "center",
    anchorSide: "center",
    column,
    explanation: "The subject is central, so the type stack must stay controlled and poster-like.",
    layoutId: "subject-center",
    patternId: "center-poster-stack",
  });
}

function buildBottomLockup(input: CocoCompositionInput): CocoCompositionSystem {
  const column: CocoTournamentRect = {
    align: "center",
    height: 34,
    width: 84,
    x: 8,
    y: input.format === "story" ? 58 : 60,
  };

  return buildStackSystem(input, {
    alignment: "center",
    anchorSide: "bottom",
    column,
    explanation: "The image owns the poster, so the event information locks into a clean lower stack.",
    layoutId: input.layoutId,
    patternId: "bottom-lockup",
  });
}

function buildStackSystem(
  input: CocoCompositionInput,
  config: {
    alignment: CocoTournamentAlign;
    anchorSide: "left" | "right" | "center" | "bottom";
    column: CocoTournamentRect;
    explanation: string;
    layoutId: CocoTournamentLayoutId;
    patternId: CocoCompositionPatternId;
  }
): CocoCompositionSystem {
  const c = columnForSceneAuthority(input, config.patternId, config.column);
  const bottom = config.anchorSide === "bottom";
  const premiumStack = config.patternId === "left-premium-stack" || config.patternId === "right-premium-stack";
  const headlineH = bottom ? 13 : premiumStack ? 27 : 24;
  const accentH = bottom ? 6 : premiumStack ? 5.8 : 8;
  const metaH = bottom ? 6 : premiumStack ? 7.5 : 8;
  const dateH = bottom ? 5 : premiumStack ? 5.6 : 7;
  const venueH = bottom ? 5 : premiumStack ? 5.2 : 6;
  const y0 = c.y;
  const headlineToAccent = input.brief?.rhythm.headlineToAccent ?? (premiumStack ? 2.4 : 1.5);
  const accentToMeta = input.brief?.rhythm.accentToMeta ?? (premiumStack ? 5.8 : 7);
  const metaToDate = premiumStack ? 9.2 : 12;
  const dateToVenue = premiumStack ? 4.8 : 6;
  const headlinePowerMin = input.brief?.hierarchy.headline ?? 90;
  const accentMaxRatio = input.brief?.hierarchyRules?.accentMaxRatio ?? (premiumStack ? 0.36 : 0.45);
  const bodyMaxRatio = input.brief?.hierarchyRules?.bodyMaxRatio ?? (premiumStack ? 0.24 : 0.3);
  const metadataMaxRatio = input.brief?.hierarchyRules?.dateMaxRatio ?? (premiumStack ? 0.22 : 0.24);
  const venueMaxRatio = input.brief?.hierarchyRules?.venueMaxRatio ?? (premiumStack ? 0.16 : 0.2);
  const hierarchy = {
    accentPowerMaxRatio: accentMaxRatio,
    bodyPowerMaxRatio: bodyMaxRatio,
    headlinePowerMin,
    metadataPowerMaxRatio: metadataMaxRatio,
  };
  const copyTreatment: CocoCopyTreatment = {
    date: "metadata",
    details: hasText(input.text.details) ? "primary-meta" : "hide",
    details2: chooseDetails2Treatment(input),
    script: hasText(input.text.script) ? "accent-support" : "hide",
    venue: "lock-to-stack",
  };

  const rawBlocks: CocoCompositionBlock[] = [
    {
      align: config.alignment,
      minVisualPower: hierarchy.headlinePowerMin,
      priority: 1,
      rect: stackRect(c, y0, c.width, headlineH, config.alignment),
      role: "headline",
      source: "headline",
    },
    {
      align: config.alignment,
      maxVisualPower: Math.round(hierarchy.headlinePowerMin * hierarchy.accentPowerMaxRatio),
      priority: 2,
      rect: stackRect(c, y0 + headlineH + headlineToAccent, c.width * (premiumStack ? 0.58 : 0.78), accentH, config.alignment),
      role: "accent",
      shouldAttachTo: "headline",
      source: "script",
    },
    {
      align: config.alignment,
      maxVisualPower: Math.round(hierarchy.headlinePowerMin * hierarchy.bodyPowerMaxRatio),
      priority: 3,
      rect: stackRect(
        c,
        y0 + headlineH + headlineToAccent + accentH + accentToMeta,
        c.width * (premiumStack ? 0.86 : 0.86),
        metaH,
        config.alignment
      ),
      role: "primaryMeta",
      shouldAttachTo: "accent",
      source: "details",
    },
    {
      align: config.alignment,
      maxVisualPower: Math.round(hierarchy.headlinePowerMin * 0.22),
      priority: 4,
      rect: stackRect(
        c,
        y0 + headlineH + headlineToAccent + accentH + accentToMeta + metaH + metaToDate + dateH + dateToVenue + venueH + 4,
        c.width * 0.72,
        metaH * 0.7,
        config.alignment
      ),
      role: "secondaryMeta",
      shouldAttachTo: "primaryMeta",
      source: "details2",
    },
    {
      align: config.alignment,
      maxVisualPower: Math.round(hierarchy.headlinePowerMin * hierarchy.metadataPowerMaxRatio),
      priority: 3,
      rect: stackRect(
        c,
        y0 + headlineH + headlineToAccent + accentH + accentToMeta + metaH + metaToDate,
        c.width * (premiumStack ? 0.68 : 0.58),
        dateH,
        config.alignment
      ),
      role: "dateTime",
      shouldAttachTo: "primaryMeta",
      source: "date",
    },
    {
      align: config.alignment,
      maxVisualPower: Math.round(hierarchy.headlinePowerMin * venueMaxRatio),
      priority: 4,
      rect: stackRect(
        c,
        y0 + headlineH + headlineToAccent + accentH + accentToMeta + metaH + metaToDate + dateH + dateToVenue,
        c.width * (premiumStack ? 0.86 : 0.78),
        venueH,
        config.alignment
      ),
      role: "venue",
      shouldAttachTo: "dateTime",
      source: "venue",
    },
  ];
  const blocks: CocoCompositionBlock[] = rawBlocks.map((block) => ({
    ...block,
    rect: clampRect(block.rect),
  }));
  const rendererZones = buildRendererZones(input.zones, blocks, copyTreatment);

  return {
    alignment: config.alignment,
    allBlocks: blocks,
    anchorSide: config.anchorSide,
    blocks,
    brief: input.brief,
    copyTreatment,
    explanation: config.explanation,
    gates: {
      detailsMaxHeadlineRatio: bodyMaxRatio,
      headlineOverBodyMin: 2.6,
      headlineOverScriptMin: premiumStack ? 2.35 : 1.9,
      scriptMaxHeadlineRatio: accentMaxRatio,
      venueMaxHeadlineRatio: venueMaxRatio,
    },
    hierarchy,
    layoutId: config.layoutId,
    patternId: config.patternId,
    rendererZones,
    rhythm: {
      accentToMeta,
      dateTimeToVenue: dateToVenue,
      headlineToAccent,
      metaToDateTime: metaToDate,
    },
    score: 0,
    textColumn: c,
  };
}

function sceneCompositionPattern(scene?: SceneInterpretation | null): CocoCompositionPatternId | null {
  const pattern = String(scene?.creativeDecisions.composition.preferredPattern ?? "");
  if (
    pattern === "left-premium-stack" ||
    pattern === "right-premium-stack" ||
    pattern === "center-poster-stack" ||
    pattern === "bottom-lockup" ||
    pattern === "diagonal-energy"
  ) {
    return pattern;
  }
  if (pattern === "split-editorial") return "split-hero-editorial";
  return null;
}

function forcedCounterweightPattern(
  input: CocoCompositionInput
): "left-premium-stack" | "right-premium-stack" | null {
  const composition = input.scene?.creativeDecisions.composition;
  const subjectSide = inferredSubjectSide(input);
  const typeField = composition?.typeField;
  const visualWeight = composition?.visualWeight;
  const briefColumn = input.brief?.typographyColumn.side;
  const briefCounterweight = input.brief?.counterweight.side;
  const briefSubject = input.brief?.scene.subjectPosition;

  const leftEvidence = [
    typeField === "left",
    visualWeight === "right",
    subjectSide === "right",
    briefColumn === "left",
    briefCounterweight === "left",
    briefSubject === "right",
    input.layoutId === "subject-right" && subjectSide !== "left",
  ].filter(Boolean).length;

  const rightEvidence = [
    typeField === "right",
    visualWeight === "left",
    subjectSide === "left",
    briefColumn === "right",
    briefCounterweight === "right",
    briefSubject === "left",
    input.layoutId === "subject-left" && subjectSide !== "right",
  ].filter(Boolean).length;

  if (leftEvidence >= 2 && leftEvidence > rightEvidence) return "left-premium-stack";
  if (rightEvidence >= 2 && rightEvidence > leftEvidence) return "right-premium-stack";
  return null;
}

function inferredSubjectSide(input: CocoCompositionInput): "left" | "right" | "center" | null {
  const sceneSubject = input.scene?.evidence.subjects[0]?.side;
  if (sceneSubject === "left" || sceneSubject === "right" || sceneSubject === "center") {
    return sceneSubject;
  }

  const subject = input.subjectZone;
  if (!subject || subject.width <= 1 || subject.height <= 1) return null;
  const center = subject.x + subject.width / 2;
  if (center <= 45) return "left";
  if (center >= 55) return "right";
  return "center";
}

function columnForSceneAuthority(
  input: CocoCompositionInput,
  patternId: CocoCompositionPatternId,
  fallback: CocoTournamentRect
): CocoTournamentRect {
  if (sceneCompositionPattern(input.scene) !== patternId) return fallback;
  const composition = input.scene?.creativeDecisions.composition;
  if (!composition) return fallback;
  const rect = composition.stackRect;
  if (!sceneRectMatchesPattern(patternId, rect)) return fallback;
  return clampRect({
    align: composition.stackAlignment,
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  });
}

function sceneRectMatchesPattern(
  patternId: CocoCompositionPatternId,
  rect: { x: number; y: number; width: number; height: number }
) {
  if (patternId === "left-premium-stack") return rect.x <= 22 && rect.y <= 32;
  if (patternId === "right-premium-stack") return rect.x >= 42 && rect.y <= 32;
  if (patternId === "bottom-lockup") return rect.y >= 48;
  if (patternId === "center-poster-stack") return rect.x >= 8 && rect.x <= 24 && rect.y <= 24;
  return true;
}

function buildRendererZones(
  zones: CocoTournamentZoneMap,
  blocks: CocoCompositionBlock[],
  copyTreatment: CocoCopyTreatment
): Partial<CocoTournamentZoneMap> {
  const next: Partial<CocoTournamentZoneMap> = {};
  for (const block of blocks) {
    if (block.source === "headline") next.headline = block.rect;
    if (block.source === "script") next.script = block.rect;
    if (block.source === "details") next.leftInfo = block.rect;
    if (block.source === "details2") next.rightInfo = block.rect;
    if (block.source === "date") next.date = block.rect;
    if (block.source === "venue") next.venue = block.rect;
  }

  if (copyTreatment.details2 === "hide" || copyTreatment.details2 === "mute") {
    next.rightInfo = { ...(next.rightInfo ?? zones.rightInfo), height: 1, width: 1 };
  }

  if (copyTreatment.details2 === "merge") {
    next.leftInfo = {
      ...(next.leftInfo ?? zones.leftInfo),
      height: (next.leftInfo ?? zones.leftInfo).height + 3,
    };
    next.rightInfo = { ...(next.rightInfo ?? zones.rightInfo), height: 1, width: 1 };
  }

  return next;
}

function chooseDetails2Treatment(input: CocoCompositionInput): CocoCopyTreatment["details2"] {
  const details2 = String(input.text.details2 ?? "").trim();
  if (!details2) return "hide";
  if (input.brief?.polishRules?.mergeSecondaryCopy) return "merge";
  if (details2.length <= 34) return "footer";
  if (details2.length <= 70) return "mute";
  return "merge";
}

function scoreComposition(system: CocoCompositionSystem, input: CocoCompositionInput) {
  let score = 100;
  const headline = getBlock(system, "headline");
  const accent = getBlock(system, "accent");
  const primaryMeta = getBlock(system, "primaryMeta");
  const secondaryMeta = getBlock(system, "secondaryMeta");
  const venue = getBlock(system, "venue");

  if (!headline) score -= 40;
  if (input.brief?.recommendedComposition) {
    if (system.patternId === input.brief.recommendedComposition) score += 18;
    else score -= input.brief.polishRules?.avoidScatteredZones ? 32 : 14;
  }
  if (input.brief?.recommendedLayoutId) {
    if (system.layoutId === input.brief.recommendedLayoutId) score += 8;
    else score -= 16;
  }

  if (accent && headline) {
    if (accent.rect.width > headline.rect.width * 0.9) score -= 12;
    if (accent.rect.height > headline.rect.height * 0.45) score -= 16;
    if (gap(headline.rect, accent.rect) > 5) score -= 14;
  }

  if (primaryMeta && accent && gap(accent.rect, primaryMeta.rect) > 12) score -= 16;

  if (secondaryMeta && primaryMeta) {
    if (secondaryMeta.rect.height > primaryMeta.rect.height * 0.9) score -= 10;
    if (gap(primaryMeta.rect, secondaryMeta.rect) > 14) score -= 8;
  }

  if (venue && primaryMeta && gap(primaryMeta.rect, venue.rect) > 32) score -= 12;

  for (let index = 0; index < system.blocks.length; index += 1) {
    const block = system.blocks[index];
    if (!block || block.rect.width <= 1 || block.rect.height <= 1) continue;
    for (let nextIndex = index + 1; nextIndex < system.blocks.length; nextIndex += 1) {
      const other = system.blocks[nextIndex];
      if (!other || other.rect.width <= 1 || other.rect.height <= 1) continue;
      const overlap = intersectionArea(block.rect, other.rect);
      if (overlap > 0.5) score -= block.priority <= 2 || other.priority <= 2 ? 24 : 12;
    }
  }

  if (input.hasSubject && input.faceZone) {
    for (const block of system.blocks) {
      const overlap = intersectionArea(block.rect, input.faceZone);
      if (overlap > 0) score -= block.role === "headline" ? 35 : 22;
    }
  }

  const forcedPattern = forcedCounterweightPattern(input);
  if (forcedPattern) {
    if (system.patternId === forcedPattern) score += 45;
    else score -= 90;
  }

  if (input.layoutId === "subject-right" && system.anchorSide !== "left") score -= 45;
  if (input.layoutId === "subject-left" && system.anchorSide !== "right") score -= 45;
  if (input.hasSubject && input.subjectZone) {
    const stackOverlap = rectOverlapRatio(system.textColumn, input.subjectZone);
    if (stackOverlap > 0.08) score -= 55;
    if (stackOverlap > 0.18) score -= 35;
  }
  if (input.backgroundOnlyHero && system.patternId === "center-poster-stack") score -= 8;

  return Math.round(clamp(score, 0, 100));
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  align: CocoTournamentAlign
): CocoTournamentRect {
  return {
    align,
    height,
    width,
    x,
    y,
  };
}

function stackRect(
  column: CocoTournamentRect,
  y: number,
  width: number,
  height: number,
  align: CocoTournamentAlign
) {
  const safeWidth = Math.max(1, width);
  const x = align === "right" ? column.x + column.width - safeWidth : column.x;
  return rect(x, y, safeWidth, height, align);
}

function getBlock(system: CocoCompositionSystem, role: CocoCompositionRole) {
  return system.blocks.find((block) => block.role === role);
}

function gap(a: CocoTournamentRect, b: CocoTournamentRect) {
  return Math.max(0, b.y - (a.y + a.height));
}

function intersectionArea(a: CocoTournamentRect, b: CocoTournamentRect) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

function rectOverlapRatio(a: CocoTournamentRect, b: CocoTournamentRect) {
  const overlap = intersectionArea(a, b);
  const area = Math.max(1, a.width * a.height);
  return overlap / area;
}

function clampRect(r: CocoTournamentRect): CocoTournamentRect {
  const width = clamp(r.width, 1, 100);
  const height = clamp(r.height, 1, 100);
  return {
    ...r,
    height: Number(height.toFixed(3)),
    width: Number(width.toFixed(3)),
    x: Number(clamp(r.x, 0, 100 - width).toFixed(3)),
    y: Number(clamp(r.y, 0, 100 - height).toFixed(3)),
  };
}

function dedupeCompositionCandidates(candidates: CocoCompositionSystem[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.patternId}:${candidate.layoutId}:${candidate.anchorSide}:${candidate.alignment}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function buildFallbackComposition(input: CocoCompositionInput): CocoCompositionSystem {
  return buildLeftPremiumStack(input);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
