export type FlyerStyle =
  | "red_only_center_hero"
  | "miami_luxe"
  | "neon_club"
  | "editorial"
  | "bottle_service";

export type SubjectCrop =
  | "closeup"
  | "half_body"
  | "three_quarter"
  | "full_body"
  | "product";

export type SubjectOrientation =
  | "front"
  | "facing_left"
  | "facing_right"
  | "weight_left"
  | "weight_right";

export type RectPct = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextPriority = {
  hero: string;
  support?: string;
  metadata?: string[];
  suppressed?: string[];
};

export type RequiredTextZone =
  | "topPresenter"
  | "ghostTitle"
  | "scriptAccent"
  | "heroTitle"
  | "leftDate"
  | "rightArtist"
  | "bottomOffer"
  | "bottomFooter"
  | "fineprint";

export type OverlapIntent = {
  ghostTitle?: "behind_subject" | "none";
  scriptAccent?: "cross_torso" | "avoid_subject";
  heroTitle?: "overlap_lower_body" | "avoid_subject";
};

export type CoordinateDirectorInput = {
  flyerStyle: FlyerStyle;
  subjectCrop: SubjectCrop;
  subjectOrientation: SubjectOrientation;
  textPriority: TextPriority;
  requiredTextZones: RequiredTextZone[];
  overlapIntent: OverlapIntent;
  negativeSpaceNeed: number;
  subjectVisualPressure?: number;
  visiblePixelRatio?: number;
  candidateCount?: number;
};

export type CoordinateCandidateScore = {
  total: number;
  textProtection: number;
  negativeSpace: number;
  subjectDominance: number;
  overlap: number;
  rhythm: number;
  balance: number;
  pressure: number;
  failures: string[];
};

export type CoordinatePlan = {
  subjectVisibleRect: RectPct;
  zones: {
    topPresenter?: RectPct;
    ghostTitle?: RectPct;
    heroTitle?: RectPct;
    scriptAccent?: RectPct;
    leftDate?: RectPct;
    rightArtist?: RectPct;
    bottomOffer?: RectPct;
    bottomFooter?: RectPct;
    fineprint?: RectPct;
  };
  zIndex: {
    background: number;
    ghostTitle: number;
    backGlow: number;
    subject: number;
    heroTitle: number;
    scriptAccent: number;
    metadata: number;
    footer: number;
    foregroundFog: number;
    grain: number;
  };
  score: CoordinateCandidateScore;
  candidates: Array<{
    rect: RectPct;
    score: CoordinateCandidateScore;
  }>;
  notes: string[];
};

export type CoordinateSearchInput = CoordinateDirectorInput;

export type EditorCoordinatePatch = Partial<{
  headX: number;
  headY: number;
  textColWidth: number;
  head2X: number;
  head2Y: number;
  head2ColWidth: number;
  detailsX: number;
  detailsY: number;
  details2X: number;
  details2Y: number;
  venueX: number;
  venueY: number;
  subtagX: number;
  subtagY: number;
}>;

export function createOptimizedCoordinatePlan(input: CoordinateDirectorInput): CoordinatePlan {
  const base = getBaseStyleCoordinates(input);
  const zones = createBaseTextZones(input, base);
  const scored = generateSubjectCoordinateCandidates(input, base.subject)
    .map((rect) => ({
      rect,
      score: scoreCoordinateCandidate(rect, zones, input),
    }))
    .sort((a, b) => b.score.total - a.score.total);
  const best = scored[0];
  if (!best) {
    throw new Error("Coordinate Search failed: no subject coordinate candidates generated.");
  }

  const subjectVisibleRect = best.rect;
  const adjustedZones = solveTextZones(input, base, subjectVisibleRect);

  return {
    subjectVisibleRect,
    zones: adjustedZones,
    zIndex: {
      background: 0,
      ghostTitle: 12,
      backGlow: 24,
      subject: 30,
      heroTitle: 54,
      scriptAccent: 58,
      metadata: 64,
      footer: 66,
      foregroundFog: 70,
      grain: 96,
    },
    score: best.score,
    candidates: scored.slice(0, 25),
    notes: [
      `Best subject rect: ${formatRect(subjectVisibleRect)}`,
      `Best score: ${best.score.total}`,
      `Coordinate candidates searched: ${scored.length}`,
      ...best.score.failures.map((failure) => `Warning: ${failure}`),
    ],
  };
}

export function createCoordinatePlan(input: CoordinateDirectorInput): CoordinatePlan {
  return createOptimizedCoordinatePlan(input);
}

export function coordinatePlanToEditorPatch(plan: CoordinatePlan): EditorCoordinatePatch {
  const patch: EditorCoordinatePatch = {};
  const ghostTitle = plan.zones.ghostTitle;
  const heroTitle = plan.zones.heroTitle;
  const scriptAccent = plan.zones.scriptAccent;
  const leftDate = plan.zones.leftDate;
  const rightArtist = plan.zones.rightArtist;
  const bottomFooter = plan.zones.bottomFooter;
  const fineprint = plan.zones.fineprint;

  if (heroTitle) {
    patch.headX = roundPct(heroTitle.x);
    patch.headY = roundPct(heroTitle.y);
    patch.textColWidth = roundPct(heroTitle.width);
  }

  if (ghostTitle) {
    patch.head2X = roundPct(ghostTitle.x);
    patch.head2Y = roundPct(ghostTitle.y);
    patch.head2ColWidth = roundPct(ghostTitle.width);
  }

  if (leftDate) {
    patch.detailsX = roundPct(leftDate.x);
    patch.detailsY = roundPct(leftDate.y);
  }

  if (rightArtist) {
    patch.details2X = roundPct(rightArtist.x);
    patch.details2Y = roundPct(rightArtist.y);
  }

  if (scriptAccent) {
    patch.subtagX = roundPct(scriptAccent.x);
    patch.subtagY = roundPct(scriptAccent.y);
  }

  if (bottomFooter || fineprint) {
    const footer = (bottomFooter ?? fineprint)!;
    patch.venueX = roundPct(footer.x);
    patch.venueY = roundPct(footer.y);
  }

  return patch;
}

function getBaseStyleCoordinates(input: CoordinateDirectorInput | FlyerStyle): {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
} {
  const style = typeof input === "string" ? input : input.flyerStyle;

  if (style === "red_only_center_hero" && typeof input !== "string") {
    return getRedOnlyHeroTemplateCoordinates(input);
  }

  switch (style) {
    case "red_only_center_hero":
      return RED_ONLY_CENTER_HERO_FRONT;
    case "miami_luxe":
      return {
        subject: { x: 34, y: 21, width: 32, height: 54 },
        zones: {
          topPresenter: { x: 14, y: 4, width: 72, height: 3 },
          ghostTitle: { x: -8, y: 8, width: 116, height: 22 },
          scriptAccent: { x: 18, y: 35, width: 64, height: 8 },
          heroTitle: { x: 8, y: 54, width: 84, height: 10 },
          leftDate: { x: 7, y: 48, width: 18, height: 14 },
          rightArtist: { x: 73, y: 50, width: 20, height: 12 },
          bottomOffer: { x: 18, y: 79, width: 64, height: 4 },
          bottomFooter: { x: 16, y: 84, width: 68, height: 5 },
          fineprint: { x: 18, y: 90, width: 64, height: 3 },
        },
      };
    case "neon_club":
      return {
        subject: { x: 28, y: 16, width: 44, height: 65 },
        zones: {
          topPresenter: { x: 10, y: 4, width: 80, height: 3 },
          ghostTitle: { x: -12, y: 6, width: 124, height: 24 },
          scriptAccent: { x: 10, y: 35, width: 80, height: 9 },
          heroTitle: { x: -4, y: 56, width: 108, height: 12 },
          leftDate: { x: 5, y: 48, width: 20, height: 15 },
          rightArtist: { x: 72, y: 49, width: 24, height: 14 },
          bottomOffer: { x: 12, y: 79, width: 76, height: 4 },
          bottomFooter: { x: 10, y: 84, width: 80, height: 5.5 },
          fineprint: { x: 14, y: 90, width: 72, height: 3.5 },
        },
      };
    case "editorial":
      return {
        subject: { x: 56, y: 20, width: 30, height: 58 },
        zones: {
          topPresenter: { x: 7, y: 5, width: 44, height: 3 },
          ghostTitle: { x: 6, y: 10, width: 48, height: 17 },
          scriptAccent: { x: 8, y: 34, width: 42, height: 8 },
          heroTitle: { x: 7, y: 48, width: 42, height: 10 },
          leftDate: { x: 8, y: 62, width: 22, height: 12 },
          rightArtist: { x: 8, y: 72, width: 30, height: 10 },
          bottomOffer: { x: 8, y: 84, width: 50, height: 4 },
          bottomFooter: { x: 8, y: 89, width: 54, height: 4 },
          fineprint: { x: 8, y: 94, width: 54, height: 2.5 },
        },
      };
    case "bottle_service":
      return {
        subject: { x: 38, y: 22, width: 24, height: 58 },
        zones: {
          topPresenter: { x: 14, y: 4, width: 72, height: 3 },
          ghostTitle: { x: -6, y: 8, width: 112, height: 20 },
          scriptAccent: { x: 16, y: 34, width: 68, height: 8 },
          heroTitle: { x: 8, y: 55, width: 84, height: 10 },
          leftDate: { x: 7, y: 48, width: 18, height: 14 },
          rightArtist: { x: 73, y: 50, width: 20, height: 12 },
          bottomOffer: { x: 16, y: 79, width: 68, height: 4 },
          bottomFooter: { x: 14, y: 84, width: 72, height: 5 },
          fineprint: { x: 18, y: 90, width: 64, height: 3 },
        },
      };
  }
}

const RED_ONLY_CENTER_HERO_FRONT = {
  subject: { x: 31, y: 22, width: 38, height: 60 },
  zones: {
    topPresenter: { x: 31.5, y: 7.5, width: 40, height: 4 },
    ghostTitle: { x: 8, y: 32, width: 84, height: 24 },
    heroTitle: { x: 12, y: 16, width: 76, height: 22 },
    scriptAccent: { x: 27, y: 49, width: 47, height: 15 },
    leftDate: { x: 5, y: 58, width: 14, height: 24 },
    rightArtist: { x: 88, y: 34, width: 7, height: 32 },
    bottomOffer: { x: 76, y: 63, width: 12, height: 12 },
    bottomFooter: { x: 23, y: 87, width: 54, height: 8 },
    fineprint: { x: 23, y: 91, width: 54, height: 4 },
  },
} satisfies {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
};

const RED_ONLY_CENTER_HERO_LEFT_FACING = {
  subject: { x: 55, y: 18, width: 34, height: 62 },
  zones: {
    topPresenter: { x: 9, y: 8, width: 50, height: 4 },
    ghostTitle: { x: 8, y: 14, width: 58, height: 24 },
    heroTitle: { x: 8, y: 16, width: 58, height: 22 },
    scriptAccent: { x: 8, y: 32, width: 56, height: 14 },
    leftDate: { x: 8, y: 60, width: 18, height: 12 },
    rightArtist: { x: 34, y: 61, width: 30, height: 12 },
    bottomOffer: { x: 25, y: 61, width: 9, height: 9 },
    bottomFooter: { x: 8, y: 87, width: 62, height: 8 },
    fineprint: { x: 8, y: 89, width: 62, height: 6 },
  },
} satisfies {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
};

const RED_ONLY_CENTER_HERO_RIGHT_FACING = {
  subject: { x: 12, y: 18, width: 34, height: 62 },
  zones: {
    topPresenter: { x: 50, y: 8, width: 42, height: 4 },
    ghostTitle: { x: 38, y: 15, width: 58, height: 24 },
    heroTitle: { x: 38, y: 16, width: 58, height: 22 },
    scriptAccent: { x: 38, y: 37, width: 56, height: 14 },
    leftDate: { x: 75, y: 15, width: 18, height: 8 },
    rightArtist: { x: 88, y: 44, width: 8, height: 28 },
    bottomOffer: { x: 75, y: 44, width: 18, height: 28 },
    bottomFooter: { x: 25, y: 87, width: 68, height: 8 },
    fineprint: { x: 25, y: 91, width: 68, height: 5 },
  },
} satisfies {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
};

const RED_ONLY_CENTER_HERO_CLOSEUP = {
  subject: { x: 24, y: 10, width: 52, height: 54 },
  zones: {
    ...RED_ONLY_CENTER_HERO_FRONT.zones,
    ghostTitle: { x: -7, y: 9, width: 114, height: 25 },
    heroTitle: { x: 6, y: 56, width: 88, height: 12 },
    scriptAccent: { x: 12, y: 41, width: 76, height: 10 },
    leftDate: { x: 6, y: 66, width: 22, height: 14 },
    rightArtist: { x: 72, y: 65, width: 22, height: 14 },
  },
} satisfies {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
};

const RED_ONLY_CENTER_HERO_THREE_QUARTER = {
  subject: { x: 31, y: 22, width: 38, height: 60 },
  zones: RED_ONLY_CENTER_HERO_FRONT.zones,
} satisfies {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
};

function getRedOnlyHeroTemplateCoordinates(input: CoordinateDirectorInput): {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
} {
  if (input.subjectCrop === "closeup") return cloneBaseCoordinates(RED_ONLY_CENTER_HERO_CLOSEUP);
  if (input.subjectOrientation === "facing_left" || input.subjectOrientation === "weight_right") {
    return cloneBaseCoordinates(RED_ONLY_CENTER_HERO_LEFT_FACING);
  }
  if (input.subjectOrientation === "facing_right" || input.subjectOrientation === "weight_left") {
    return cloneBaseCoordinates(RED_ONLY_CENTER_HERO_RIGHT_FACING);
  }
  if (input.subjectCrop === "three_quarter") return cloneBaseCoordinates(RED_ONLY_CENTER_HERO_THREE_QUARTER);
  return cloneBaseCoordinates(RED_ONLY_CENTER_HERO_FRONT);
}

function cloneBaseCoordinates(base: {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
}): {
  subject: RectPct;
  zones: CoordinatePlan["zones"];
} {
  const zones: CoordinatePlan["zones"] = {};
  for (const key of Object.keys(base.zones) as RequiredTextZone[]) {
    const zone = base.zones[key];
    if (zone) zones[key] = { ...zone };
  }
  return {
    subject: { ...base.subject },
    zones,
  };
}

function solveSubjectVisibleRect(
  input: CoordinateDirectorInput,
  base: ReturnType<typeof getBaseStyleCoordinates>
): RectPct {
  let rect = { ...base.subject };
  const metadataCount = input.textPriority.metadata?.length ?? 0;
  const suppressedCount = input.textPriority.suppressed?.length ?? 0;

  if (metadataCount >= 4) {
    rect = scaleRectFromCenterPct(rect, 0.92, 0.92);
  }

  if (suppressedCount > 0) {
    rect = scaleRectFromCenterPct(rect, 0.94, 0.94);
    rect.y -= 1.5;
  }

  if (input.overlapIntent.scriptAccent === "cross_torso") {
    rect.y = Math.min(rect.y, 21);
  }

  return rect;
}

function solveSubjectSearchAnchor(
  input: CoordinateDirectorInput,
  base: ReturnType<typeof getBaseStyleCoordinates>
): RectPct {
  let rect = solveSubjectVisibleRect(input, base);
  rect = applyCropAdjustment(rect, input.subjectCrop, input.flyerStyle);
  rect = applyOrientationAdjustment(rect, input.subjectOrientation, input.flyerStyle);
  rect = applyNegativeSpaceAdjustment(rect, input.negativeSpaceNeed, input.flyerStyle);
  return clampSubjectRect(rect);
}

function generateSubjectCoordinateCandidates(
  input: CoordinateDirectorInput,
  anchor: RectPct
): RectPct[] {
  const cropRange = getCropRange(input.subjectCrop, input.flyerStyle, anchor);
  const styleRange = getStyleSearchRange(input.flyerStyle);
  const orientationShift = input.flyerStyle === "red_only_center_hero"
    ? { x: 0, y: 0 }
    : getOrientationShift(input.subjectOrientation);
  const densityPressure = getTextDensityPressure(input);
  const airShrink = clamp(input.negativeSpaceNeed, 0, 1) * 0.12;
  const requested = Math.max(64, input.candidateCount ?? 1050);
  const xSteps = requested <= 200 ? 5 : 7;
  const ySteps = requested <= 200 ? 4 : 6;
  const wSteps = requested <= 200 ? 4 : 5;
  const hSteps = requested <= 200 ? 3 : 5;
  const candidates: RectPct[] = [clampSubjectRect(anchor)];

  const xMin = anchor.x + styleRange.xMin + orientationShift.x;
  const xMax = anchor.x + styleRange.xMax + orientationShift.x;
  const yMin = anchor.y + styleRange.yMin + orientationShift.y;
  const yMax = anchor.y + styleRange.yMax + orientationShift.y;
  const widthMin = cropRange.width * (1 - cropRange.widthFlex - airShrink - densityPressure);
  const widthMax = cropRange.width * (1 + cropRange.widthFlex - densityPressure * 0.5);
  const heightMin = cropRange.height * (1 - cropRange.heightFlex - airShrink - densityPressure);
  const heightMax = cropRange.height * (1 + cropRange.heightFlex - densityPressure * 0.5);

  for (let xi = 0; xi < xSteps; xi += 1) {
    for (let yi = 0; yi < ySteps; yi += 1) {
      for (let wi = 0; wi < wSteps; wi += 1) {
        for (let hi = 0; hi < hSteps; hi += 1) {
          candidates.push(clampSubjectRect({
            x: lerp(xMin, xMax, xi / (xSteps - 1)),
            y: lerp(yMin, yMax, yi / (ySteps - 1)),
            width: lerp(widthMin, widthMax, wi / (wSteps - 1)),
            height: lerp(heightMin, heightMax, hi / (hSteps - 1)),
          }));
        }
      }
    }
  }

  candidates.push(...designerBiasCandidates(input, anchor));

  return uniqueRects(candidates);
}

function getCropRange(
  crop: SubjectCrop,
  style: FlyerStyle,
  anchor: RectPct
): { width: number; height: number; widthFlex: number; heightFlex: number } {
  let width = anchor.width;
  let height = anchor.height;

  if (crop === "closeup") {
    width = Math.max(width, 40);
    height = Math.min(height, 48);
  } else if (crop === "half_body") {
    width = Math.max(width, 37);
    height = Math.min(height, 54);
  } else if (crop === "full_body") {
    width = Math.min(width, 31);
    height = Math.max(height, 64);
  } else if (crop === "product") {
    width = style === "bottle_service" ? 24 : 22;
    height = style === "bottle_service" ? 58 : 54;
  }

  if (style === "editorial") {
    width *= 0.9;
    height *= 0.96;
  } else if (style === "neon_club") {
    width *= 1.08;
    height *= 1.06;
  } else if (style === "miami_luxe") {
    width *= 0.96;
    height *= 0.96;
  }

  return {
    width,
    height,
    widthFlex: 0.16,
    heightFlex: 0.12,
  };
}

function getStyleSearchRange(style: FlyerStyle): { xMin: number; xMax: number; yMin: number; yMax: number } {
  switch (style) {
    case "red_only_center_hero":
      return { xMin: -2, xMax: 2, yMin: -1.5, yMax: 1.5 };
    case "miami_luxe":
      return { xMin: -7, xMax: 7, yMin: -3, yMax: 5 };
    case "neon_club":
      return { xMin: -10, xMax: 10, yMin: -6, yMax: 4 };
    case "editorial":
      return { xMin: -5, xMax: 12, yMin: -2, yMax: 6 };
    case "bottle_service":
      return { xMin: -5, xMax: 5, yMin: -3, yMax: 4 };
  }
}

function getOrientationShift(orientation: SubjectOrientation): { x: number; y: number } {
  switch (orientation) {
    case "facing_right":
      return { x: -3, y: 0 };
    case "facing_left":
      return { x: 3, y: 0 };
    case "weight_left":
      return { x: 2, y: 0 };
    case "weight_right":
      return { x: -2, y: 0 };
    case "front":
    default:
      return { x: 0, y: 0 };
  }
}

function getTextDensityPressure(input: CoordinateDirectorInput): number {
  const metadataCount = input.textPriority.metadata?.length ?? 0;
  const suppressedCount = input.textPriority.suppressed?.length ?? 0;
  const requiredCount = input.requiredTextZones.length;
  return clamp(metadataCount * 0.012 + suppressedCount * 0.016 + Math.max(0, requiredCount - 6) * 0.01, 0, 0.12);
}

function designerBiasCandidates(input: CoordinateDirectorInput, anchor: RectPct): RectPct[] {
  if (input.flyerStyle === "red_only_center_hero") {
    return [
      anchor,
      { x: 30, y: 22, width: 38, height: 60 },
      { x: 32, y: 22, width: 37, height: 59 },
      { x: 31, y: 23, width: 37, height: 58 },
      { x: 30, y: 21, width: 39, height: 60 },
      { x: 33, y: 22, width: 36, height: 58 },
    ].map(clampSubjectRect);
  }

  if (input.flyerStyle === "editorial") {
    return [
      anchor,
      { x: 56, y: 21, width: 30, height: 57 },
      { x: 60, y: 22, width: 28, height: 55 },
      { x: 52, y: 20, width: 32, height: 58 },
    ].map(clampSubjectRect);
  }

  return [anchor].map(clampSubjectRect);
}

function applyCropAdjustment(rect: RectPct, crop: SubjectCrop, style: FlyerStyle): RectPct {
  let next = { ...rect };

  if (crop === "closeup") next = scaleRectFromCenterPct(next, 0.88, 0.82);
  if (crop === "half_body") next = scaleRectFromCenterPct(next, 0.96, 0.94);
  if (crop === "full_body") next = scaleRectFromCenterPct(next, 0.9, 1.08);
  if (crop === "product") {
    next = style === "bottle_service"
      ? { x: 38, y: 22, width: 24, height: 58 }
      : { x: 39, y: 24, width: 22, height: 54 };
  }

  return next;
}

function applyOrientationAdjustment(
  rect: RectPct,
  orientation: SubjectOrientation,
  style: FlyerStyle
): RectPct {
  const next = { ...rect };
  if (style === "red_only_center_hero") return next;

  if (orientation === "facing_right") next.x -= style === "editorial" ? 0 : 3;
  if (orientation === "facing_left") next.x += style === "editorial" ? 0 : 3;
  if (orientation === "weight_left") next.x += 2;
  if (orientation === "weight_right") next.x -= 2;

  return next;
}

function applyNegativeSpaceAdjustment(
  rect: RectPct,
  negativeSpaceNeed: number,
  style: FlyerStyle
): RectPct {
  let next = { ...rect };
  const air = clamp(negativeSpaceNeed, 0, 1);
  const shrink = 1 - air * 0.12;
  next = scaleRectFromCenterPct(next, shrink, shrink);

  if (style === "miami_luxe" || style === "editorial") {
    next.y += air * 1.5;
  }

  return next;
}

function solveTextZones(
  input: CoordinateDirectorInput,
  base: ReturnType<typeof getBaseStyleCoordinates>,
  subjectVisibleRect: RectPct
): CoordinatePlan["zones"] {
  if (input.flyerStyle === "red_only_center_hero") {
    return { ...base.zones };
  }

  const zones: CoordinatePlan["zones"] = {};

  for (const zone of input.requiredTextZones) {
    zones[zone] = base.zones[zone];
  }

  if (input.overlapIntent.ghostTitle === "behind_subject") {
    zones.ghostTitle = base.zones.ghostTitle;
  }

  if (input.overlapIntent.scriptAccent === "cross_torso") {
    zones.scriptAccent = placeScriptAcrossSubject(subjectVisibleRect, base.zones.scriptAccent);
  }

  if (input.overlapIntent.heroTitle === "overlap_lower_body") {
    zones.heroTitle = placeHeroOnLowerBody(subjectVisibleRect, base.zones.heroTitle);
  } else if (base.zones.heroTitle) {
    zones.heroTitle = base.zones.heroTitle;
  }

  if (zones.leftDate && rectsOverlapPct(subjectVisibleRect, zones.leftDate)) {
    zones.leftDate = { ...zones.leftDate, x: 5.5 };
  }

  if (zones.rightArtist && rectsOverlapPct(subjectVisibleRect, zones.rightArtist)) {
    zones.rightArtist = { ...zones.rightArtist, x: 74 };
  }

  return zones;
}

function createBaseTextZones(
  input: CoordinateDirectorInput,
  base: ReturnType<typeof getBaseStyleCoordinates>
): CoordinatePlan["zones"] {
  const zones: CoordinatePlan["zones"] = {};

  for (const zone of input.requiredTextZones) {
    zones[zone] = base.zones[zone];
  }

  if (input.overlapIntent.ghostTitle === "behind_subject") {
    zones.ghostTitle = base.zones.ghostTitle;
  }

  if (input.overlapIntent.scriptAccent === "cross_torso") {
    zones.scriptAccent = base.zones.scriptAccent;
  }

  if (input.overlapIntent.heroTitle === "overlap_lower_body") {
    zones.heroTitle = base.zones.heroTitle;
  }

  return zones;
}

function scoreCoordinateCandidate(
  rect: RectPct,
  zones: CoordinatePlan["zones"],
  input: CoordinateDirectorInput
): CoordinateCandidateScore {
  const failures: string[] = [];
  const textProtection = scoreTextProtection(rect, zones, failures);
  const negativeSpace = scoreNegativeSpace(rect, input, failures);
  const subjectDominance = scoreSubjectDominance(rect, input, failures);
  const overlap = scoreOverlap(rect, zones, input, failures);
  const rhythm = scoreRhythm(rect, zones);
  const balance = scoreBalance(rect, input);
  const pressure = scorePressure(rect, input, failures);
  const total = clampScore(
    textProtection * 0.22 +
      negativeSpace * 0.18 +
      subjectDominance * 0.16 +
      overlap * 0.15 +
      rhythm * 0.1 +
      balance * 0.09 +
      pressure * 0.1
  );

  return {
    total,
    textProtection,
    negativeSpace,
    subjectDominance,
    overlap,
    rhythm,
    balance,
    pressure,
    failures,
  };
}

function scoreExploration(rect: RectPct, baseSubject: RectPct): number {
  const centerDelta = Math.hypot(centerX(rect) - centerX(baseSubject), centerY(rect) - centerY(baseSubject));
  const sizeDelta = Math.abs(rect.width - baseSubject.width) + Math.abs(rect.height - baseSubject.height);
  const movement = centerDelta + sizeDelta * 0.35;

  if (movement < 0.8) return 35;
  if (movement < 2.2) return 72;
  if (movement < 7) return 100;
  return clampScore(100 - (movement - 7) * 4);
}

function scoreTextProtection(subject: RectPct, zones: CoordinatePlan["zones"], failures: string[]): number {
  let score = 100;
  const protectedZones: RequiredTextZone[] = [
    "leftDate",
    "rightArtist",
    "bottomOffer",
    "bottomFooter",
    "fineprint",
    "topPresenter",
  ];

  for (const key of protectedZones) {
    const zone = zones[key];
    if (!zone) continue;

    const overlap = intersectionRatioPct(subject, zone);
    if (overlap > 0.02) {
      const penalty = key.includes("bottom") || key === "fineprint" ? 38 : 28;
      score -= overlap * penalty;
      if (overlap > 0.15) failures.push(`Subject invades protected ${key} zone.`);
    }
  }

  return clampScore(score);
}

function scoreNegativeSpace(subject: RectPct, input: CoordinateDirectorInput, failures: string[]): number {
  let score = 100;
  const leftAir = subject.x;
  const rightAir = 100 - (subject.x + subject.width);
  const topAir = subject.y;
  const bottomAir = 100 - (subject.y + subject.height);
  const need = clamp(input.negativeSpaceNeed, 0, 1);
  const minSideAir = lerp(8, 20, need);
  const minLeftAir =
    input.flyerStyle === "red_only_center_hero" &&
    (input.subjectOrientation === "facing_right" || input.subjectOrientation === "weight_left")
      ? lerp(6, 12, need)
      : minSideAir;
  const minRightAir =
    input.flyerStyle === "red_only_center_hero" &&
    (input.subjectOrientation === "facing_left" || input.subjectOrientation === "weight_right")
      ? lerp(6, 12, need)
      : minSideAir;
  const minBottomAir = lerp(10, 20, need);
  const minTopAir = lerp(5, 12, need);

  if (leftAir < minLeftAir) score -= (minLeftAir - leftAir) * 2.2;
  if (rightAir < minRightAir) score -= (minRightAir - rightAir) * 2.2;
  if (bottomAir < minBottomAir) score -= (minBottomAir - bottomAir) * 2.6;
  if (topAir < minTopAir) score -= (minTopAir - topAir) * 1.2;
  if (leftAir < 5 || rightAir < 5) failures.push("Subject leaves almost no side air.");
  if (bottomAir < 8) failures.push("Subject leaves almost no footer air.");

  return clampScore(score);
}

function scoreSubjectDominance(subject: RectPct, input: CoordinateDirectorInput, failures: string[]): number {
  const target = getTargetArea(input.flyerStyle, input.subjectCrop);
  const areaRatio = (subject.width * subject.height) / 10000;
  const delta = Math.abs(areaRatio - target);
  let score = 100 - delta * 260;

  if (areaRatio > target + 0.09) {
    failures.push("Subject is too visually large for this style.");
    score -= 14;
  }

  if (areaRatio < target - 0.08) {
    failures.push("Subject is too small to dominate.");
    score -= 12;
  }

  return clampScore(score);
}

function getTargetArea(style: FlyerStyle, crop: SubjectCrop): number {
  if (style === "red_only_center_hero") {
    if (crop === "closeup") return 0.24;
    if (crop === "half_body") return 0.23;
    if (crop === "full_body") return 0.22;
    return 0.25;
  }

  if (style === "miami_luxe") return 0.17;
  if (style === "neon_club") return 0.25;
  if (style === "editorial") return 0.15;
  if (style === "bottle_service") return 0.14;
  return 0.2;
}

function scoreOverlap(
  subject: RectPct,
  zones: CoordinatePlan["zones"],
  input: CoordinateDirectorInput,
  failures: string[]
): number {
  let score = 70;

  if (input.overlapIntent.ghostTitle === "behind_subject" && zones.ghostTitle) {
    const overlap = intersectionRatioPct(subject, zones.ghostTitle);
    if (overlap > 0.08) score += 15;
    else failures.push("Subject does not overlap ghost title enough.");
  }

  if (input.overlapIntent.scriptAccent === "cross_torso" && zones.scriptAccent) {
    const overlap = intersectionRatioPct(approximateTorsoPct(subject), zones.scriptAccent);
    if (overlap > 0.05) score += 15;
    else failures.push("Script zone does not cross subject torso.");
  }

  if (input.overlapIntent.heroTitle === "overlap_lower_body" && zones.heroTitle) {
    const overlap = intersectionRatioPct(approximateLowerBodyPct(subject), zones.heroTitle);
    if (overlap > 0.04) score += 8;
  }

  return clampScore(score);
}

function scoreRhythm(subject: RectPct, zones: CoordinatePlan["zones"]): number {
  const ghost = zones.ghostTitle;
  const script = zones.scriptAccent;
  const footer = zones.bottomFooter;
  if (!ghost || !script || !footer) return 74;

  const ghostY = centerY(ghost);
  const faceY = subject.y + subject.height * 0.18;
  const scriptY = centerY(script);
  const footerY = centerY(footer);
  const ordered = ghostY < faceY && faceY < scriptY && scriptY < footerY;
  let score = ordered ? 92 : 70;

  if (scriptY - faceY < 4) score -= 8;
  if (footerY - scriptY < 20) score -= 8;

  return clampScore(score);
}

function scoreBalance(subject: RectPct, input: CoordinateDirectorInput): number {
  const subjectCenter = centerX(subject);
  const offset = Math.abs(subjectCenter - 50);
  let desiredOffset = 0;
  if (input.flyerStyle === "editorial") desiredOffset = 16;
  if (input.flyerStyle === "red_only_center_hero" && input.subjectOrientation !== "front") {
    desiredOffset = 22;
  } else if (input.subjectOrientation === "facing_right" || input.subjectOrientation === "facing_left") {
    desiredOffset = 4;
  }
  return clampScore(100 - Math.abs(offset - desiredOffset) * 3.1);
}

function scorePressure(subject: RectPct, input: CoordinateDirectorInput, failures: string[]): number {
  const pressure = input.subjectVisualPressure ?? 0.48;
  const visibleRatio = input.visiblePixelRatio ?? 0.34;
  const areaRatio = (subject.width * subject.height) / 10000;
  const effectivePressure = pressure * areaRatio * (3.7 + clamp(visibleRatio, 0.05, 0.7));
  const target = getTargetPressure(input.flyerStyle);
  const delta = Math.abs(effectivePressure - target);
  let score = 100 - delta * 95;

  if (effectivePressure > target + 0.22) {
    failures.push("Subject visual pressure too high; should be smaller or moved.");
    score -= 12;
  }

  return clampScore(score);
}

function getTargetPressure(style: FlyerStyle): number {
  if (style === "red_only_center_hero") return 0.4;
  if (style === "miami_luxe") return 0.34;
  if (style === "neon_club") return 0.5;
  if (style === "editorial") return 0.28;
  return 0.38;
}

function placeScriptAcrossSubject(subject: RectPct, fallback?: RectPct): RectPct {
  return {
    x: Math.max(8, subject.x - 10),
    y: subject.y + subject.height * 0.25,
    width: Math.min(84, subject.width + 20),
    height: fallback?.height ?? 9,
  };
}

function placeHeroOnLowerBody(subject: RectPct, fallback?: RectPct): RectPct {
  return {
    x: 4,
    y: subject.y + subject.height * 0.55,
    width: 92,
    height: fallback?.height ?? 11,
  };
}

function scaleRectFromCenterPct(rect: RectPct, sx: number, sy: number): RectPct {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const width = rect.width * sx;
  const height = rect.height * sy;

  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
  };
}

function clampSubjectRect(rect: RectPct): RectPct {
  return {
    x: clamp(rect.x, -8, 92),
    y: clamp(rect.y, -4, 88),
    width: clamp(rect.width, 8, 90),
    height: clamp(rect.height, 8, 90),
  };
}

function uniqueRects(rects: RectPct[]): RectPct[] {
  const seen = new Set<string>();
  const out: RectPct[] = [];

  for (const rect of rects) {
    const key = `${rect.x.toFixed(1)}:${rect.y.toFixed(1)}:${rect.width.toFixed(1)}:${rect.height.toFixed(1)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rect);
  }

  return out;
}

function rectsOverlapPct(a: RectPct, b: RectPct): boolean {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function intersectionAreaPct(a: RectPct, b: RectPct): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function intersectionRatioPct(a: RectPct, b: RectPct): number {
  const denominator = Math.max(1, Math.min(a.width * a.height, b.width * b.height));
  return intersectionAreaPct(a, b) / denominator;
}

function approximateTorsoPct(subject: RectPct): RectPct {
  return {
    x: subject.x + subject.width * 0.18,
    y: subject.y + subject.height * 0.28,
    width: subject.width * 0.64,
    height: subject.height * 0.38,
  };
}

function approximateLowerBodyPct(subject: RectPct): RectPct {
  return {
    x: subject.x + subject.width * 0.15,
    y: subject.y + subject.height * 0.58,
    width: subject.width * 0.7,
    height: subject.height * 0.28,
  };
}

function centerX(rect: RectPct): number {
  return rect.x + rect.width / 2;
}

function centerY(rect: RectPct): number {
  return rect.y + rect.height / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function roundPct(value: number): number {
  return Number(value.toFixed(2));
}

function formatRect(rect: RectPct): string {
  return `x:${rect.x.toFixed(1)} y:${rect.y.toFixed(1)} w:${rect.width.toFixed(1)} h:${rect.height.toFixed(1)}`;
}
