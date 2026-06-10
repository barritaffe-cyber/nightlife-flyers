import type {
  PosterCandidate,
  SceneLayer,
  ImageLayer,
  TextLayer,
  Rect,
  PosterSize,
  SubjectAnalysis,
  LayoutScore,
} from "./artDirectorEngine";

import type { DirectedHierarchy } from "./semanticHierarchyDirector";

export type CompositionStyle =
  | "red_only_center_hero"
  | "center_hero_big_ghost"
  | "miami_luxe"
  | "neon_club"
  | "editorial_negative_space"
  | "bottle_service";

export type CropProfile =
  | "extreme_closeup"
  | "closeup"
  | "half_body"
  | "three_quarter"
  | "full_body"
  | "product";

export type PlacementIntent =
  | "center_dominant"
  | "right_weighted_text_left"
  | "left_weighted_text_right"
  | "low_center_footer_air"
  | "editorial_offset"
  | "aggressive_close_crop";

export type SubjectPlacement = {
  id: string;
  rect: Rect;
  intent: PlacementIntent;
  crop: CropProfile;
  zoom: number;
  subjectAreaRatio: number;
  textAirLeft: number;
  textAirRight: number;
  textAirTop: number;
  textAirBottom: number;
};

export type CompositionZone = {
  id: string;
  rect: Rect;
  role: "heroTitle" | "script" | "date" | "artist" | "footer" | "fineprint" | "negativeSpace";
  priority: number;
  mayOverlapSubject: boolean;
  shouldOverlapSubject: boolean;
  mayOverlapFace: boolean;
};

export type CompositionScore = {
  total: number;
  negativeSpace: number;
  textOpportunity: number;
  subjectDominance: number;
  balance: number;
  overlapPotential: number;
  focalRhythm: number;
  tension: number;
  safety: number;
  failures: string[];
  notes: string[];
};

export type CompositionSearchOptions = {
  style?: CompositionStyle;
  hierarchy?: DirectedHierarchy;
  candidateCount?: number;
  allowAsymmetry?: boolean;
  targetTension?: number;
  subjectDominance?: number;
  protectFace?: boolean;
  preserveFooterAir?: boolean;
  preserveSideModules?: boolean;
};

export type CompositionSearchResult = {
  bestPoster: PosterCandidate;
  bestPlacement: SubjectPlacement;
  placements: Array<{
    placement: SubjectPlacement;
    score: CompositionScore;
  }>;
};

export function solvePosterComposition(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: CompositionSearchOptions = {}
): PosterCandidate {
  return searchPosterComposition(candidate, subject, options).bestPoster;
}

export function searchPosterComposition(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: CompositionSearchOptions = {}
): CompositionSearchResult {
  const c = cloneCandidate(candidate);
  const subjectLayer = findSubjectLayer(c);

  if (!subjectLayer) {
    return {
      bestPoster: c,
      bestPlacement: fallbackPlacement(c.size),
      placements: [],
    };
  }

  const style = options.style ?? inferCompositionStyle(c);
  const crop = detectCropProfile(subjectLayer, subject);
  const zones = buildCompositionZones(c.size, style, options);
  const placements = generateSubjectPlacements({
    size: c.size,
    subject,
    crop,
    style,
    options,
  });

  const scored = placements.map((placement) => ({
    placement,
    score: scorePlacement({
      placement,
      size: c.size,
      zones,
      subject,
      style,
      options,
    }),
  }));

  scored.sort((a, b) => b.score.total - a.score.total);

  const best = scored[0] ?? { placement: fallbackPlacement(c.size), score: emptyScore() };
  const bestPoster = applyPlacementToPoster(c, best.placement, zones, best.score, subject);

  return {
    bestPoster,
    bestPlacement: best.placement,
    placements: scored,
  };
}

export function getPosterCompositionPlacement(candidate: PosterCandidate): SubjectPlacement | undefined {
  const subject = findSubjectLayer(candidate);
  return subject?.meta?.compositionPlacement as SubjectPlacement | undefined;
}

export function getPosterCompositionScore(candidate: PosterCandidate): CompositionScore | undefined {
  const subject = findSubjectLayer(candidate);
  return subject?.meta?.compositionScore as CompositionScore | undefined;
}

function generateSubjectPlacements(args: {
  size: PosterSize;
  subject?: SubjectAnalysis;
  crop: CropProfile;
  style: CompositionStyle;
  options: CompositionSearchOptions;
}): SubjectPlacement[] {
  const { size, subject, crop, style, options } = args;
  const count = clamp(options.candidateCount ?? 96, 24, 240);
  const aspect = getSubjectAspect(subject, crop);
  const baseHeightRatio = getBaseHeightRatio(crop, style, options.subjectDominance);
  const intents = getPlacementIntents(style, crop, options);
  const placements: SubjectPlacement[] = [];

  let index = 0;

  for (const intent of intents) {
    const profile = getIntentProfile(intent, style);
    const perIntent = Math.ceil(count / intents.length);

    for (let i = 0; i < perIntent; i += 1) {
      const scaleJitter = randomFromSeed(index + 10, -0.055, 0.055);
      const xJitter = randomFromSeed(index + 20, -0.045, 0.045);
      const yJitter = randomFromSeed(index + 30, -0.035, 0.035);

      const heightRatio = clamp(baseHeightRatio + profile.heightAdjust + scaleJitter, 0.38, 0.82);
      const height = size.height * heightRatio;
      const width = height * aspect;
      const centerX = size.width * clamp(profile.centerX + xJitter, 0.32, 0.72);
      const y = size.height * clamp(profile.y + yJitter, -0.04, 0.32);

      const clamped = clampSubjectPlacement(
        {
          x: centerX - width / 2,
          y,
          width,
          height,
        },
        size,
        style
      );

      placements.push({
        id: `placement_${index}`,
        rect: clamped,
        intent,
        crop,
        zoom: cropToZoom(crop),
        subjectAreaRatio: area(clamped) / area(fullRect(size)),
        textAirLeft: calculateSideAir(clamped, size, "left"),
        textAirRight: calculateSideAir(clamped, size, "right"),
        textAirTop: Math.max(0, clamped.y / size.height),
        textAirBottom: Math.max(0, (size.height - (clamped.y + clamped.height)) / size.height),
      });

      index += 1;
    }
  }

  return placements;
}

function getPlacementIntents(
  style: CompositionStyle,
  crop: CropProfile,
  options: CompositionSearchOptions
): PlacementIntent[] {
  if (crop === "product") return ["center_dominant", "right_weighted_text_left", "left_weighted_text_right"];

  if (style === "editorial_negative_space") {
    return ["editorial_offset", "right_weighted_text_left", "center_dominant"];
  }

  if (style === "neon_club") {
    return ["center_dominant", "aggressive_close_crop", "right_weighted_text_left", "left_weighted_text_right"];
  }

  if (style === "red_only_center_hero") {
    const centerIntents: PlacementIntent[] = ["center_dominant", "low_center_footer_air"];
    const sideIntents: PlacementIntent[] =
      options.allowAsymmetry === false ? [] : ["right_weighted_text_left", "left_weighted_text_right"];
    return crop === "extreme_closeup" ? [...centerIntents, "aggressive_close_crop", ...sideIntents] : [...centerIntents, ...sideIntents];
  }

  if (style === "miami_luxe") {
    return ["center_dominant", "right_weighted_text_left", "editorial_offset"];
  }

  return ["center_dominant", "right_weighted_text_left", "left_weighted_text_right"];
}

function getIntentProfile(
  intent: PlacementIntent,
  style: CompositionStyle
): {
  centerX: number;
  y: number;
  heightAdjust: number;
} {
  switch (intent) {
    case "right_weighted_text_left":
      return { centerX: 0.58, y: 0.19, heightAdjust: -0.03 };
    case "left_weighted_text_right":
      return { centerX: 0.42, y: 0.19, heightAdjust: -0.03 };
    case "low_center_footer_air":
      return { centerX: 0.5, y: 0.2, heightAdjust: -0.055 };
    case "editorial_offset":
      return { centerX: 0.66, y: 0.19, heightAdjust: -0.08 };
    case "aggressive_close_crop":
      return { centerX: 0.5, y: 0.12, heightAdjust: 0.05 };
    case "center_dominant":
    default:
      return { centerX: 0.5, y: style === "red_only_center_hero" ? 0.19 : 0.17, heightAdjust: 0 };
  }
}

function getBaseHeightRatio(crop: CropProfile, style: CompositionStyle, dominance?: number): number {
  let base: number;

  switch (crop) {
    case "extreme_closeup":
      base = 0.46;
      break;
    case "closeup":
      base = 0.52;
      break;
    case "half_body":
      base = 0.6;
      break;
    case "three_quarter":
      base = 0.65;
      break;
    case "full_body":
      base = 0.74;
      break;
    case "product":
      base = 0.62;
      break;
  }

  if (style === "red_only_center_hero") base = clamp(base, 0.55, 0.66);
  if (style === "miami_luxe") base -= 0.04;
  if (style === "editorial_negative_space") base -= 0.09;
  if (style === "neon_club") base += 0.035;

  if (typeof dominance === "number") {
    base += (clamp(dominance, 0, 1) - 0.62) * 0.18;
  }

  return clamp(base, 0.4, 0.78);
}

function getSubjectAspect(subject: SubjectAnalysis | undefined, crop: CropProfile): number {
  if (subject?.kind === "bottle") return 0.42;
  if (subject?.kind === "car") return 1.25;
  if (subject?.kind === "food") return 0.9;
  if (subject?.originalBounds?.width && subject.originalBounds.height) {
    return clamp(subject.originalBounds.width / subject.originalBounds.height, 0.36, 1.25);
  }

  switch (crop) {
    case "extreme_closeup":
      return 0.82;
    case "closeup":
      return 0.74;
    case "half_body":
      return 0.66;
    case "three_quarter":
      return 0.58;
    case "full_body":
      return 0.42;
    case "product":
      return 0.5;
  }
}

function buildCompositionZones(
  size: PosterSize,
  style: CompositionStyle,
  options: CompositionSearchOptions
): CompositionZone[] {
  const hierarchy = options.hierarchy;
  const preserveSideModules = options.preserveSideModules ?? true;
  const preserveFooterAir = options.preserveFooterAir ?? true;
  const zones: CompositionZone[] = [
    {
      id: "top_ghost_title_zone",
      rect: abs(size, -0.06, 0.055, 1.12, 0.23),
      role: "heroTitle",
      priority: hierarchy?.ghostTitle ? 8 : 7,
      mayOverlapSubject: true,
      shouldOverlapSubject: true,
      mayOverlapFace: true,
    },
    {
      id: "script_torso_zone",
      rect: abs(size, 0.12, 0.32, 0.76, 0.11),
      role: "script",
      priority: hierarchy?.scriptAccent ? 8 : 6,
      mayOverlapSubject: true,
      shouldOverlapSubject: true,
      mayOverlapFace: false,
    },
  ];

  if (preserveSideModules) {
    zones.push(
      {
        id: "left_date_zone",
        rect: abs(size, 0.055, 0.47, 0.19, 0.17),
        role: "date",
        priority: hierarchy?.dateModule ? 8 : 6,
        mayOverlapSubject: false,
        shouldOverlapSubject: false,
        mayOverlapFace: false,
      },
      {
        id: "right_artist_zone",
        rect: abs(size, 0.715, 0.48, 0.24, 0.16),
        role: "artist",
        priority: hierarchy?.artistModule ? 8 : 5,
        mayOverlapSubject: false,
        shouldOverlapSubject: false,
        mayOverlapFace: false,
      }
    );
  }

  if (preserveFooterAir) {
    zones.push(
      {
        id: "footer_zone",
        rect: abs(size, 0.08, 0.78, 0.84, 0.18),
        role: "footer",
        priority: 10,
        mayOverlapSubject: false,
        shouldOverlapSubject: false,
        mayOverlapFace: false,
      },
      {
        id: "bottom_fineprint_zone",
        rect: abs(size, 0.12, 0.9, 0.76, 0.05),
        role: "fineprint",
        priority: hierarchy?.fineprint ? 7 : 5,
        mayOverlapSubject: false,
        shouldOverlapSubject: false,
        mayOverlapFace: false,
      }
    );
  }

  if (style === "editorial_negative_space") {
    zones.push({
      id: "left_editorial_air",
      rect: abs(size, 0.06, 0.18, 0.36, 0.58),
      role: "negativeSpace",
      priority: 10,
      mayOverlapSubject: false,
      shouldOverlapSubject: false,
      mayOverlapFace: false,
    });
  }

  return zones;
}

function scorePlacement(args: {
  placement: SubjectPlacement;
  size: PosterSize;
  zones: CompositionZone[];
  subject?: SubjectAnalysis;
  style: CompositionStyle;
  options: CompositionSearchOptions;
}): CompositionScore {
  const { placement, size, zones, subject, style, options } = args;
  const failures: string[] = [];
  const notes: string[] = [];
  const face = subject?.faceBox ? normalizedRectToAbsolute(subject.faceBox, placement.rect) : undefined;
  const torso = subject?.torsoBox
    ? normalizedRectToAbsolute(subject.torsoBox, placement.rect)
    : approximateTorso(placement.rect);

  const negativeSpace = scoreNegativeSpace(placement, zones, style, failures);
  const textOpportunity = scoreTextOpportunity(placement, zones, failures);
  const subjectDominance = scoreSubjectDominance(placement, style, failures);
  const balance = scoreVisualBalance(placement, size, style);
  const overlapPotential = scoreOverlapPotential(placement, zones, torso, face, failures);
  const focalRhythm = scoreFocalRhythm(placement, zones, face, size);
  const tension = scoreControlledTension(placement, size, options.targetTension ?? getDefaultTension(style));
  const safety = scoreSafety(placement, zones, face, failures, options);

  const total = Math.round(
    negativeSpace * 0.18 +
      textOpportunity * 0.18 +
      subjectDominance * 0.16 +
      balance * 0.1 +
      overlapPotential * 0.14 +
      focalRhythm * 0.1 +
      tension * 0.08 +
      safety * 0.06
  );

  notes.push(`Intent: ${placement.intent}`);
  notes.push(`Subject crop: ${placement.crop}`);
  notes.push(`Subject area ratio: ${placement.subjectAreaRatio.toFixed(2)}`);
  notes.push(
    `Air L/R/T/B: ${placement.textAirLeft.toFixed(2)}, ${placement.textAirRight.toFixed(
      2
    )}, ${placement.textAirTop.toFixed(2)}, ${placement.textAirBottom.toFixed(2)}`
  );

  return {
    total: clampScore(total),
    negativeSpace,
    textOpportunity,
    subjectDominance,
    balance,
    overlapPotential,
    focalRhythm,
    tension,
    safety,
    failures,
    notes,
  };
}

function scoreNegativeSpace(
  placement: SubjectPlacement,
  zones: CompositionZone[],
  style: CompositionStyle,
  failures: string[]
): number {
  let score = 100;

  for (const zone of zones) {
    if (zone.mayOverlapSubject) continue;

    const ratio = intersectionRatio(placement.rect, zone.rect);
    if (ratio > 0.12) {
      score -= zone.priority * 3.2 * ratio;
      if (zone.priority >= 8) failures.push(`Subject invades ${zone.id}.`);
    }
  }

  if (style === "red_only_center_hero") {
    if (placement.textAirLeft < 0.16) score -= 10;
    if (placement.textAirRight < 0.16) score -= 10;
    if (placement.textAirBottom < 0.14) score -= 14;
  }

  if (style === "editorial_negative_space") {
    if (Math.max(placement.textAirLeft, placement.textAirRight) < 0.34) score -= 18;
  }

  return clampScore(score);
}

function scoreTextOpportunity(
  placement: SubjectPlacement,
  zones: CompositionZone[],
  failures: string[]
): number {
  let score = 100;
  const dateZone = zones.find((zone) => zone.role === "date");
  const artistZone = zones.find((zone) => zone.role === "artist");
  const footerZone = zones.find((zone) => zone.role === "footer");

  if (dateZone && intersects(placement.rect, dateZone.rect)) score -= 18;
  if (artistZone && intersects(placement.rect, artistZone.rect)) score -= 18;
  if (footerZone && intersects(placement.rect, footerZone.rect)) score -= 22;

  const sideAirTotal = placement.textAirLeft + placement.textAirRight;
  if (sideAirTotal < 0.38) {
    score -= 12;
    failures.push("Not enough side air for date/artist modules.");
  }

  if (placement.textAirBottom < 0.12) {
    score -= 14;
    failures.push("Not enough footer air.");
  }

  return clampScore(score);
}

function scoreSubjectDominance(
  placement: SubjectPlacement,
  style: CompositionStyle,
  failures: string[]
): number {
  const target = getTargetAreaRatio(style, placement.crop);
  const delta = Math.abs(placement.subjectAreaRatio - target);
  let score = 100 - delta * 180;

  if (placement.subjectAreaRatio > target + 0.13) {
    failures.push("Subject is visually too large and kills typography air.");
    score -= 18;
  }

  if (placement.subjectAreaRatio < target - 0.11) {
    failures.push("Subject is too small to feel like the hero.");
    score -= 16;
  }

  return clampScore(score);
}

function getTargetAreaRatio(style: CompositionStyle, crop: CropProfile): number {
  if (style === "red_only_center_hero") {
    if (crop === "closeup" || crop === "extreme_closeup") return 0.25;
    if (crop === "half_body") return 0.29;
    return 0.32;
  }

  if (style === "editorial_negative_space") return 0.22;
  if (style === "neon_club") return 0.34;
  if (style === "miami_luxe") return 0.26;
  return 0.3;
}

function scoreVisualBalance(placement: SubjectPlacement, size: PosterSize, style: CompositionStyle): number {
  const subjectCenterX = placement.rect.x + placement.rect.width / 2;
  const normalizedOffset = (subjectCenterX - size.width / 2) / size.width;
  const desiredOffset = style === "editorial_negative_space" ? 0.16 : 0.02;
  const delta = Math.abs(Math.abs(normalizedOffset) - desiredOffset);

  return clampScore(100 - delta * 220);
}

function scoreOverlapPotential(
  placement: SubjectPlacement,
  zones: CompositionZone[],
  torso: Rect,
  face: Rect | undefined,
  failures: string[]
): number {
  let score = 70;
  const ghost = zones.find((zone) => zone.role === "heroTitle");
  const script = zones.find((zone) => zone.role === "script");

  if (ghost) {
    const ghostOverlap = intersectionRatio(placement.rect, ghost.rect);
    if (ghostOverlap > 0.08) score += 15;
    else failures.push("Subject does not overlap ghost title enough for depth.");
  }

  if (script) {
    const torsoOverlap = intersectionRatio(script.rect, torso);
    if (torsoOverlap > 0.05) score += 15;
    else failures.push("Script zone does not cross torso/body.");

    if (face && intersects(script.rect, face)) score -= 18;
  }

  return clampScore(score);
}

function scoreFocalRhythm(
  placement: SubjectPlacement,
  zones: CompositionZone[],
  face: Rect | undefined,
  size: PosterSize
): number {
  const title = zones.find((zone) => zone.role === "heroTitle")?.rect;
  const script = zones.find((zone) => zone.role === "script")?.rect;
  const footer = zones.find((zone) => zone.role === "footer")?.rect;

  if (!title || !script || !footer) return 70;

  const faceY = face ? face.y + face.height / 2 : placement.rect.y + placement.rect.height * 0.25;
  const titleY = title.y + title.height / 2;
  const scriptY = script.y + script.height / 2;
  const footerY = footer.y + footer.height / 2;
  const ordered = titleY < faceY && faceY < scriptY && scriptY < footerY;
  let score = ordered ? 92 : 70;

  const spacing1 = (faceY - titleY) / size.height;
  const spacing2 = (scriptY - faceY) / size.height;
  const spacing3 = (footerY - scriptY) / size.height;

  if (spacing1 < 0.03 || spacing2 < 0.03 || spacing3 < 0.08) score -= 10;

  return clampScore(score);
}

function scoreControlledTension(
  placement: SubjectPlacement,
  size: PosterSize,
  targetTension: number
): number {
  const offset = Math.abs((placement.rect.x + placement.rect.width / 2 - size.width / 2) / size.width);
  const cropPressure =
    Math.max(0, -placement.rect.x / size.width) +
    Math.max(0, (placement.rect.x + placement.rect.width - size.width) / size.width);
  const actual = clamp(offset * 1.4 + cropPressure * 0.8, 0, 1);
  return clampScore(100 - Math.abs(actual - targetTension) * 120);
}

function scoreSafety(
  placement: SubjectPlacement,
  zones: CompositionZone[],
  face: Rect | undefined,
  failures: string[],
  options: CompositionSearchOptions
): number {
  let score = 100;

  if ((options.protectFace ?? true) && face) {
    for (const zone of zones) {
      if (!zone.mayOverlapFace && intersects(face, zone.rect)) {
        score -= zone.priority * 2.5;
        if (zone.priority >= 8) failures.push(`Face collides with protected zone ${zone.id}.`);
      }
    }
  }

  if (options.preserveFooterAir ?? true) {
    const footer = zones.find((zone) => zone.role === "footer");
    if (footer && intersects(placement.rect, footer.rect)) score -= 18;
  }

  return clampScore(score);
}

function applyPlacementToPoster(
  candidate: PosterCandidate,
  placement: SubjectPlacement,
  zones: CompositionZone[],
  score: CompositionScore,
  subjectAnalysis?: SubjectAnalysis
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const subject = findSubjectLayer(c);
  const shadow = findSubjectShadowLayer(c);

  if (subject) {
    subject.bounds = { ...placement.rect };
    subject.zIndex = 30;
    subject.opacity = 1;
    subject.fit = "contain";
    subject.meta = {
      ...subject.meta,
      dominant: true,
      role: "subject",
      blueprintSlot: "subject",
      compositionPlacement: placement,
      compositionScore: score,
      compositionZones: zones,
      cameraProfile: {
        crop: placement.crop,
        orientation: inferPlacementOrientation(placement, c.size),
        visualWeightCenter: subjectAnalysis?.visualWeightCenter ?? { x: 0.5, y: 0.45 },
        faceBox: subjectAnalysis?.faceBox,
        torsoBox: subjectAnalysis?.torsoBox,
        desiredSubjectRect: placement.rect,
        reservedAirZones: zones.map((zone) => ({
          id: zone.id,
          rect: zone.rect,
          purpose: zone.role,
          priority: zone.priority,
        })),
        textAir: inferTextAirSides(placement),
        subjectDominance: score.subjectDominance / 100,
        cameraZoom: placement.zoom,
        notes: score.notes,
      },
      cameraCrop: placement.crop,
      cameraZoom: placement.zoom,
    };
  }

  if (shadow && subject) {
    shadow.bounds = {
      ...subject.bounds,
      x: subject.bounds.x + c.size.width * 0.018,
      y: subject.bounds.y + c.size.height * 0.018,
    };
    shadow.zIndex = 24;
    shadow.opacity = 0.3;
  }

  for (const layer of c.layers) {
    layer.meta = {
      ...layer.meta,
      compositionZones: zones,
      compositionPlacementId: placement.id,
      compositionIntent: placement.intent,
    };
  }

  c.score = makeLayoutScore(score);
  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);

  return c;
}

function detectCropProfile(subjectLayer: ImageLayer, subject?: SubjectAnalysis): CropProfile {
  if (subject?.kind === "bottle" || subject?.kind === "car" || subject?.kind === "food") return "product";

  if (subject?.faceBox) {
    const faceHeight = subject.faceBox.height;
    const faceArea = subject.faceBox.width * subject.faceBox.height;

    if (faceHeight > 0.36 || faceArea > 0.16) return "extreme_closeup";
    if (faceHeight > 0.24 || faceArea > 0.09) return "closeup";
    if (faceHeight > 0.15) return "half_body";
  }

  if (subject?.torsoBox) {
    if (subject.torsoBox.height > 0.62) return "three_quarter";
    if (subject.torsoBox.height > 0.45) return "half_body";
  }

  const ratio = subjectLayer.bounds.height / Math.max(1, subjectLayer.bounds.width);
  if (ratio > 2.35) return "full_body";
  if (ratio > 1.55) return "three_quarter";
  if (ratio > 1.15) return "half_body";
  return "closeup";
}

function inferPlacementOrientation(
  placement: SubjectPlacement,
  size: PosterSize
): "front" | "left_weighted" | "right_weighted" | "unknown" {
  const center = (placement.rect.x + placement.rect.width / 2) / size.width;
  if (center < 0.47) return "left_weighted";
  if (center > 0.53) return "right_weighted";
  return "front";
}

function inferTextAirSides(placement: SubjectPlacement): string[] {
  const air: string[] = [];
  const leftOpen = placement.textAirLeft > 0.22;
  const rightOpen = placement.textAirRight > 0.22;

  if (leftOpen && rightOpen) air.push("both");
  else if (leftOpen) air.push("left");
  else if (rightOpen) air.push("right");
  if (placement.textAirTop > 0.16) air.push("top");
  if (placement.textAirBottom > 0.14) air.push("bottom");

  return air.length ? air : ["none"];
}

function cropToZoom(crop: CropProfile): number {
  switch (crop) {
    case "extreme_closeup":
      return 1;
    case "closeup":
      return 0.86;
    case "half_body":
      return 0.68;
    case "three_quarter":
      return 0.52;
    case "full_body":
      return 0.36;
    case "product":
      return 0.5;
  }
}

function inferCompositionStyle(candidate: PosterCandidate): CompositionStyle {
  const vibe = candidate.brief.vibe;
  const id = candidate.id.toLowerCase();

  if (id.includes("red") || vibe === "afrobeats" || vibe === "latin_night") return "red_only_center_hero";
  if (vibe === "miami_luxe" || vibe === "rooftop_sunset") return "miami_luxe";
  if (vibe === "neon_club" || vibe === "trap_urban") return "neon_club";
  if (vibe === "fashion_editorial" || vibe === "luxury_lounge") return "editorial_negative_space";
  if (candidate.brief.mainSubject === "bottle") return "bottle_service";
  return "center_hero_big_ghost";
}

function getDefaultTension(style: CompositionStyle): number {
  switch (style) {
    case "neon_club":
      return 0.42;
    case "editorial_negative_space":
      return 0.35;
    case "miami_luxe":
      return 0.22;
    case "red_only_center_hero":
      return 0.18;
    default:
      return 0.22;
  }
}

function clampSubjectPlacement(rect: Rect, size: PosterSize, style: CompositionStyle): Rect {
  const allowCrop = style === "neon_club" || style === "red_only_center_hero";
  const minX = allowCrop ? -size.width * 0.1 : 0;
  const maxX = allowCrop ? size.width - rect.width + size.width * 0.1 : size.width - rect.width;
  const minY = allowCrop ? -size.height * 0.035 : 0;
  const maxY = allowCrop ? size.height - rect.height + size.height * 0.1 : size.height - rect.height;

  return {
    ...rect,
    x: clamp(rect.x, minX, maxX),
    y: clamp(rect.y, minY, maxY),
  };
}

function calculateSideAir(rect: Rect, size: PosterSize, side: "left" | "right"): number {
  if (side === "left") return clamp(rect.x / size.width, 0, 1);
  return clamp((size.width - (rect.x + rect.width)) / size.width, 0, 1);
}

function approximateTorso(subjectRect: Rect): Rect {
  return {
    x: subjectRect.x + subjectRect.width * 0.18,
    y: subjectRect.y + subjectRect.height * 0.28,
    width: subjectRect.width * 0.64,
    height: subjectRect.height * 0.38,
  };
}

function fallbackPlacement(size: PosterSize): SubjectPlacement {
  const rect = abs(size, 0.23, 0.19, 0.54, 0.58);
  return {
    id: "fallback",
    rect,
    intent: "center_dominant",
    crop: "half_body",
    zoom: 0.68,
    subjectAreaRatio: area(rect) / area(fullRect(size)),
    textAirLeft: calculateSideAir(rect, size, "left"),
    textAirRight: calculateSideAir(rect, size, "right"),
    textAirTop: rect.y / size.height,
    textAirBottom: (size.height - (rect.y + rect.height)) / size.height,
  };
}

function emptyScore(): CompositionScore {
  return {
    total: 70,
    negativeSpace: 70,
    textOpportunity: 70,
    subjectDominance: 70,
    balance: 70,
    overlapPotential: 70,
    focalRhythm: 70,
    tension: 70,
    safety: 70,
    failures: [],
    notes: [],
  };
}

function makeLayoutScore(score: CompositionScore): LayoutScore {
  return {
    hierarchy: score.focalRhythm,
    readability: score.textOpportunity,
    subjectDominance: score.subjectDominance,
    styleMatch: score.overlapPotential,
    balance: score.balance,
    premiumFeel: Math.round((score.negativeSpace + score.tension) / 2),
    total: score.total,
    rejected: score.total < 54 || score.safety < 52,
    failures: [...score.failures],
    notes: [...score.failures, ...score.notes],
  };
}

function findSubjectLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    if (layer.type !== "subject") return false;
    const role = String(layer.meta?.role ?? "").toLowerCase();
    const depthKind = String(layer.meta?.depthKind ?? "").toLowerCase();
    if (role.includes("shadow") || depthKind.includes("shadow") || layer.id.toLowerCase().includes("shadow")) {
      return false;
    }
    return Boolean(layer.meta?.dominant) || layer.meta?.role === "subject" || layer.meta?.blueprintSlot === "subject";
  }) as ImageLayer | undefined;
}

function findSubjectShadowLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    if (layer.type !== "subject") return false;
    const role = String(layer.meta?.role ?? "").toLowerCase();
    const depthKind = String(layer.meta?.depthKind ?? "").toLowerCase();
    return role.includes("shadow") || depthKind.includes("shadow") || layer.id.toLowerCase().includes("shadow");
  }) as ImageLayer | undefined;
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score
      ? {
          ...candidate.score,
          failures: [...candidate.score.failures],
          notes: [...candidate.score.notes],
        }
      : undefined,
    layers: candidate.layers.map((layer) => {
      if (isTextLayer(layer)) {
        return {
          ...layer,
          bounds: { ...layer.bounds },
          meta: { ...layer.meta },
          shadow: layer.shadow ? { ...layer.shadow } : undefined,
          stroke: layer.stroke ? { ...layer.stroke } : undefined,
        };
      }

      return {
        ...layer,
        bounds: { ...layer.bounds },
        meta: { ...layer.meta },
        filter: layer.filter ? { ...layer.filter } : undefined,
      };
    }) as SceneLayer[],
  };
}

function abs(size: PosterSize, x: number, y: number, w: number, h: number): Rect {
  return {
    x: size.width * x,
    y: size.height * y,
    width: size.width * w,
    height: size.height * h,
  };
}

function fullRect(size: PosterSize): Rect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

function normalizedRectToAbsolute(normalized: Rect, container: Rect): Rect {
  return {
    x: container.x + normalized.x * container.width,
    y: container.y + normalized.y * container.height,
    width: normalized.width * container.width,
    height: normalized.height * container.height,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function intersectionArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function intersectionRatio(a: Rect, b: Rect): number {
  const denominator = Math.max(1, Math.min(area(a), area(b)));
  return intersectionArea(a, b) / denominator;
}

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function randomFromSeed(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999.123) * 10000;
  const t = x - Math.floor(x);
  return min + t * (max - min);
}
