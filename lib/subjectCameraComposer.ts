import type {
  ImageLayer,
  LayoutScore,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  SubjectAnalysis,
} from "./artDirectorEngine";

export type CameraCrop =
  | "extreme_closeup"
  | "closeup"
  | "half_body"
  | "three_quarter"
  | "full_body"
  | "product";

export type SubjectOrientation =
  | "front"
  | "left_facing"
  | "right_facing"
  | "left_weighted"
  | "right_weighted"
  | "unknown";

export type SubjectCameraStyle =
  | "red_only_center_hero"
  | "center_hero_big_ghost"
  | "miami_luxe"
  | "neon_club"
  | "editorial_negative_space"
  | "bottle_service";

export type TextAirSide = "left" | "right" | "both" | "top" | "bottom" | "none";

export type ReservedAirZone = {
  id: string;
  rect: Rect;
  purpose: "date" | "artist" | "headline" | "footer" | "logo" | "qr" | "negative_space";
  priority: number;
};

export type SubjectCameraProfile = {
  crop: CameraCrop;
  orientation: SubjectOrientation;
  visualWeightCenter: { x: number; y: number };
  faceBox?: Rect;
  torsoBox?: Rect;
  desiredSubjectRect: Rect;
  reservedAirZones: ReservedAirZone[];
  textAir: TextAirSide[];
  subjectDominance: number;
  cameraZoom: number;
  notes: string[];
};

export type SubjectCameraOptions = {
  style?: SubjectCameraStyle;
  preserveFace?: boolean;
  leaveFooterAir?: boolean;
  leaveSideModules?: boolean;
  allowAsymmetry?: boolean;
  subjectDominance?: number;
};

export function composeSubjectCamera(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: SubjectCameraOptions = {}
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const size = c.size;
  const subjectLayer = findSubjectLayer(c);

  if (!subjectLayer) return c;

  const style = options.style ?? inferCameraStyle(candidate);
  const profile = buildSubjectCameraProfile(size, subjectLayer, subject, style, options);

  subjectLayer.bounds = { ...profile.desiredSubjectRect };
  subjectLayer.zIndex = 30;
  subjectLayer.opacity = 1;
  subjectLayer.fit = "contain";
  subjectLayer.meta = {
    ...subjectLayer.meta,
    role: "subject",
    blueprintSlot: "subject",
    dominant: true,
    cameraProfile: profile,
    cameraCrop: profile.crop,
    cameraZoom: profile.cameraZoom,
    reservedAirZones: profile.reservedAirZones,
  };

  const shadow = findSubjectShadowLayer(c);
  if (shadow) {
    shadow.bounds = {
      ...subjectLayer.bounds,
      x: subjectLayer.bounds.x + size.width * 0.018,
      y: subjectLayer.bounds.y + size.height * 0.018,
    };
    shadow.zIndex = 24;
    shadow.opacity = 0.32;
  }

  for (const layer of c.layers) {
    layer.meta = {
      ...layer.meta,
      cameraComposerStyle: style,
      reservedAirZones: profile.reservedAirZones,
    };
  }

  c.score = mergeCameraScore(c.score, profile);
  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  return c;
}

export function buildSubjectCameraProfile(
  size: PosterSize,
  subjectLayer: ImageLayer,
  subject: SubjectAnalysis | undefined,
  style: SubjectCameraStyle,
  options: SubjectCameraOptions = {}
): SubjectCameraProfile {
  const crop = detectCameraCrop(subjectLayer, subject);
  const orientation = detectSubjectOrientation(subjectLayer, subject);
  const visualWeightCenter = subject?.visualWeightCenter ?? { x: 0.5, y: 0.45 };
  const dominance = clamp(options.subjectDominance ?? getStyleDominance(style), 0.35, 0.92);
  const reservedAirZones = createReservedAirZones(size, style, options);
  const desiredSubjectRect = solveSubjectRect({
    size,
    crop,
    orientation,
    style,
    dominance,
    visualWeightCenter,
    reservedAirZones,
    subject,
  });
  const textAir = inferTextAirSides(desiredSubjectRect, reservedAirZones, size);

  return {
    crop,
    orientation,
    visualWeightCenter,
    faceBox: subject?.faceBox,
    torsoBox: subject?.torsoBox,
    desiredSubjectRect,
    reservedAirZones,
    textAir,
    subjectDominance: dominance,
    cameraZoom: cropToZoom(crop),
    notes: [
      `Camera crop detected: ${crop}`,
      `Subject orientation detected: ${orientation}`,
      `Style: ${style}`,
      `Subject rect solved to ${Math.round(desiredSubjectRect.width)}x${Math.round(
        desiredSubjectRect.height
      )} at ${Math.round(desiredSubjectRect.x)},${Math.round(desiredSubjectRect.y)}`,
    ],
  };
}

export function detectCameraCrop(subjectLayer: ImageLayer, subject?: SubjectAnalysis): CameraCrop {
  if (subject?.kind === "bottle" || subject?.kind === "car" || subject?.kind === "food") return "product";

  const face = subject?.faceBox;
  const torso = subject?.torsoBox;

  if (face) {
    const faceArea = face.width * face.height;
    if (face.height > 0.36 || faceArea > 0.16) return "extreme_closeup";
    if (face.height > 0.24 || faceArea > 0.09) return "closeup";
    if (face.height > 0.15) return "half_body";
  }

  if (torso) {
    if (torso.height > 0.62) return "three_quarter";
    if (torso.height > 0.45) return "half_body";
  }

  const ratio = subjectLayer.bounds.height / Math.max(1, subjectLayer.bounds.width);
  if (ratio > 2.4) return "full_body";
  if (ratio > 1.55) return "three_quarter";
  if (ratio > 1.15) return "half_body";
  return "closeup";
}

export function detectSubjectOrientation(_subjectLayer: ImageLayer, subject?: SubjectAnalysis): SubjectOrientation {
  const center = subject?.visualWeightCenter;
  if (!center) return "front";
  if (center.x < 0.42) return "left_weighted";
  if (center.x > 0.58) return "right_weighted";
  return "front";
}

export function getSubjectCameraProfile(candidate: PosterCandidate): SubjectCameraProfile | undefined {
  const subject = findSubjectLayer(candidate);
  return subject?.meta?.cameraProfile as SubjectCameraProfile | undefined;
}

export function getReservedAirZones(candidate: PosterCandidate): ReservedAirZone[] {
  const subject = findSubjectLayer(candidate);
  const zones = subject?.meta?.reservedAirZones;
  return Array.isArray(zones) ? (zones as ReservedAirZone[]) : [];
}

export function scoreSubjectComposition(candidate: PosterCandidate, subject?: SubjectAnalysis): number {
  const subjectLayer = findSubjectLayer(candidate);
  if (!subjectLayer) return 0;

  const size = candidate.size;
  const zones = getReservedAirZones(candidate);
  let score = 100;
  const subjectAreaRatio = area(subjectLayer.bounds) / area(fullRect(size));

  if (subjectAreaRatio > 0.42) score -= 18;
  if (subjectAreaRatio < 0.18) score -= 18;

  const footer = zones.find((zone) => zone.purpose === "footer");
  if (footer && intersects(subjectLayer.bounds, footer.rect)) score -= 15;

  const left = zones.find((zone) => zone.purpose === "date");
  const right = zones.find((zone) => zone.purpose === "artist");
  if (left && right && intersects(subjectLayer.bounds, left.rect) && intersects(subjectLayer.bounds, right.rect)) {
    score -= 18;
  }

  if (subject?.faceBox) {
    const face = normalizedRectToAbsolute(subject.faceBox, subjectLayer.bounds);
    const top = zones.find((zone) => zone.purpose === "headline");
    if (top && intersects(face, top.rect)) score -= 12;
  }

  return clampScore(score);
}

function cropToZoom(crop: CameraCrop): number {
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

function getStyleDominance(style: SubjectCameraStyle): number {
  switch (style) {
    case "red_only_center_hero":
      return 0.62;
    case "center_hero_big_ghost":
      return 0.64;
    case "miami_luxe":
      return 0.58;
    case "neon_club":
      return 0.68;
    case "editorial_negative_space":
      return 0.5;
    case "bottle_service":
      return 0.56;
  }
}

function inferCameraStyle(candidate: PosterCandidate): SubjectCameraStyle {
  const id = candidate.id.toLowerCase();
  const vibe = candidate.brief.vibe;

  if (id.includes("red") || vibe === "afrobeats" || vibe === "latin_night") return "red_only_center_hero";
  if (vibe === "miami_luxe" || vibe === "rooftop_sunset") return "miami_luxe";
  if (vibe === "neon_club" || vibe === "trap_urban") return "neon_club";
  if (vibe === "fashion_editorial" || vibe === "luxury_lounge") return "editorial_negative_space";
  if (candidate.brief.mainSubject === "bottle") return "bottle_service";
  return "center_hero_big_ghost";
}

function createReservedAirZones(
  size: PosterSize,
  style: SubjectCameraStyle,
  options: SubjectCameraOptions
): ReservedAirZone[] {
  const zones: ReservedAirZone[] = [
    {
      id: "top_title_air",
      rect: abs(size, 0.04, 0.035, 0.92, 0.22),
      purpose: "headline",
      priority: 8,
    },
  ];

  if (options.leaveSideModules ?? true) {
    zones.push(
      {
        id: "left_date_air",
        rect: abs(size, 0.045, 0.45, 0.2, 0.2),
        purpose: "date",
        priority: 8,
      },
      {
        id: "right_artist_air",
        rect: abs(size, 0.72, 0.46, 0.24, 0.2),
        purpose: "artist",
        priority: 8,
      }
    );
  }

  if (options.leaveFooterAir ?? true) {
    zones.push({
      id: "footer_air",
      rect: abs(size, 0.07, 0.78, 0.86, 0.18),
      purpose: "footer",
      priority: 10,
    });
  }

  if (style === "editorial_negative_space") {
    zones.push({
      id: "editorial_left_air",
      rect: abs(size, 0.06, 0.2, 0.38, 0.58),
      purpose: "negative_space",
      priority: 9,
    });
  }

  return zones;
}

function solveSubjectRect(args: {
  size: PosterSize;
  crop: CameraCrop;
  orientation: SubjectOrientation;
  style: SubjectCameraStyle;
  dominance: number;
  visualWeightCenter: { x: number; y: number };
  reservedAirZones: ReservedAirZone[];
  subject?: SubjectAnalysis;
}): Rect {
  const { size, crop, orientation, style, dominance, reservedAirZones, subject } = args;

  if (crop === "product") return solveProductRect(size, dominance);

  const aspect = getSubjectAspect(subject, crop);
  const targetHeight = size.height * getTargetSubjectHeightRatio(crop, style, dominance);
  const targetWidth = targetHeight * aspect;

  let rect: Rect = {
    x: size.width * getBaseXRatio(style, orientation) - targetWidth / 2,
    y: size.height * getBaseYRatio(style, crop),
    width: targetWidth,
    height: targetHeight,
  };

  rect = keepAboveFooterAir(rect, reservedAirZones);
  rect = respectSideAir(rect, reservedAirZones, size, style, orientation);
  rect = protectFaceFromTopTitle(rect, subject, reservedAirZones, size);
  rect = keepFaceBelowHeadlineAir(rect, subject, reservedAirZones, size);
  rect = clampSubjectRect(rect, size, style);

  return rect;
}

function getTargetSubjectHeightRatio(crop: CameraCrop, style: SubjectCameraStyle, dominance: number): number {
  let base: number;

  switch (crop) {
    case "extreme_closeup":
      base = 0.48;
      break;
    case "closeup":
      base = 0.54;
      break;
    case "half_body":
      base = 0.6;
      break;
    case "three_quarter":
      base = 0.64;
      break;
    case "full_body":
      base = 0.68;
      break;
    case "product":
      base = 0.62;
      break;
  }

  if (style === "red_only_center_hero") base = clamp(base, 0.52, 0.61);
  if (style === "neon_club") base += 0.04;
  if (style === "editorial_negative_space") base -= 0.08;
  if (style === "miami_luxe") base -= 0.06;

  return clamp(base + (dominance - 0.62) * 0.14, 0.42, 0.7);
}

function getSubjectAspect(subject: SubjectAnalysis | undefined, crop: CameraCrop): number {
  if (subject?.kind === "bottle") return 0.42;
  if (subject?.kind === "car") return 1.25;
  if (subject?.kind === "food") return 0.9;
  if (subject?.originalBounds?.width && subject.originalBounds.height) {
    return clamp(subject.originalBounds.width / subject.originalBounds.height, 0.38, 0.92);
  }

  switch (crop) {
    case "extreme_closeup":
      return 0.8;
    case "closeup":
      return 0.72;
    case "half_body":
      return 0.66;
    case "three_quarter":
      return 0.58;
    case "full_body":
      return 0.42;
    default:
      return 0.64;
  }
}

function getBaseXRatio(style: SubjectCameraStyle, orientation: SubjectOrientation): number {
  if (style === "editorial_negative_space") return 0.68;
  if (style === "bottle_service") return 0.5;
  if (style === "red_only_center_hero") {
    if (orientation === "left_weighted") return 0.53;
    if (orientation === "right_weighted") return 0.47;
    return 0.5;
  }
  if (orientation === "left_weighted") return 0.54;
  if (orientation === "right_weighted") return 0.46;
  return 0.5;
}

function getBaseYRatio(style: SubjectCameraStyle, crop: CameraCrop): number {
  if (style === "red_only_center_hero") {
    if (crop === "closeup" || crop === "extreme_closeup") return 0.26;
    if (crop === "half_body") return 0.24;
    return 0.22;
  }
  if (style === "editorial_negative_space") return 0.22;
  if (style === "miami_luxe") return 0.21;
  if (style === "neon_club") return 0.16;
  return 0.18;
}

function keepAboveFooterAir(rect: Rect, zones: ReservedAirZone[]): Rect {
  const footer = zones.find((zone) => zone.purpose === "footer");
  if (!footer) return rect;

  const maxBottom = footer.rect.y + footer.rect.height * 0.15;
  const currentBottom = rect.y + rect.height;

  if (currentBottom > maxBottom) {
    const overflow = currentBottom - maxBottom;
    rect.y -= overflow * 0.55;
    rect.height *= 0.96;
    rect.width *= 0.96;
  }

  return rect;
}

function respectSideAir(
  rect: Rect,
  zones: ReservedAirZone[],
  size: PosterSize,
  style: SubjectCameraStyle,
  orientation: SubjectOrientation
): Rect {
  const left = zones.find((zone) => zone.purpose === "date");
  const right = zones.find((zone) => zone.purpose === "artist");
  if (!left || !right) return rect;

  if (intersects(rect, left.rect) && intersects(rect, right.rect)) {
    scaleRectFromCenter(rect, 0.88, 0.88);
  }

  if (intersects(rect, left.rect) && intersects(rect, right.rect)) {
    if (orientation === "left_weighted") rect.x += size.width * 0.05;
    else if (orientation === "right_weighted") rect.x -= size.width * 0.05;
    else rect.x += style === "red_only_center_hero" ? 0 : size.width * 0.03;
  }

  return rect;
}

function protectFaceFromTopTitle(
  rect: Rect,
  subject: SubjectAnalysis | undefined,
  zones: ReservedAirZone[],
  size: PosterSize
): Rect {
  if (!subject?.faceBox) return rect;

  const top = zones.find((zone) => zone.purpose === "headline");
  if (!top) return rect;

  const face = normalizedRectToAbsolute(subject.faceBox, rect);
  if (intersects(face, top.rect)) rect.y += size.height * 0.035;
  return rect;
}

function keepFaceBelowHeadlineAir(
  rect: Rect,
  subject: SubjectAnalysis | undefined,
  zones: ReservedAirZone[],
  size: PosterSize
): Rect {
  const top = zones.find((zone) => zone.purpose === "headline");
  if (!top) return rect;

  if (subject?.faceBox) {
    const face = normalizedRectToAbsolute(subject.faceBox, rect);
    const minFaceTop = top.rect.y + top.rect.height + size.height * 0.018;
    if (face.y < minFaceTop) {
      rect.y += minFaceTop - face.y;
    }
    return rect;
  }

  const minSubjectTop = top.rect.y + top.rect.height * 0.45;
  if (rect.y < minSubjectTop) {
    rect.y += minSubjectTop - rect.y;
  }
  return rect;
}

function clampSubjectRect(rect: Rect, size: PosterSize, style: SubjectCameraStyle): Rect {
  const allowBottomCrop = style === "red_only_center_hero" || style === "neon_club";
  const minX = -size.width * 0.08;
  const maxX = size.width - rect.width + size.width * 0.08;
  const minY = -size.height * 0.03;
  const maxY = allowBottomCrop ? size.height - rect.height + size.height * 0.1 : size.height - rect.height;

  return {
    ...rect,
    x: clamp(rect.x, minX, maxX),
    y: clamp(rect.y, minY, maxY),
  };
}

function solveProductRect(size: PosterSize, dominance: number): Rect {
  const height = size.height * clamp(0.58 + (dominance - 0.55) * 0.2, 0.48, 0.7);
  const width = height * 0.42;
  return {
    x: size.width * 0.5 - width / 2,
    y: size.height * 0.22,
    width,
    height,
  };
}

function inferTextAirSides(rect: Rect, zones: ReservedAirZone[], size: PosterSize): TextAirSide[] {
  const air: TextAirSide[] = [];
  const leftOpen = rect.x > size.width * 0.25 || !zones.some((zone) => zone.purpose === "date" && intersects(rect, zone.rect));
  const rightOpen =
    rect.x + rect.width < size.width * 0.75 ||
    !zones.some((zone) => zone.purpose === "artist" && intersects(rect, zone.rect));

  if (leftOpen && rightOpen) air.push("both");
  else if (leftOpen) air.push("left");
  else if (rightOpen) air.push("right");
  if (rect.y > size.height * 0.2) air.push("top");
  if (rect.y + rect.height < size.height * 0.76) air.push("bottom");
  return air.length ? air : ["none"];
}

function findSubjectLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    if (layer.type !== "subject") return false;
    return Boolean(layer.meta?.dominant) || layer.meta?.blueprintSlot === "subject" || layer.meta?.role === "subject";
  }) as ImageLayer | undefined;
}

function findSubjectShadowLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    if (layer.type !== "subject") return false;
    return layer.meta?.role === "depth_shadow" || String(layer.id).includes("shadow");
  }) as ImageLayer | undefined;
}

function mergeCameraScore(score: LayoutScore | undefined, profile: SubjectCameraProfile): LayoutScore | undefined {
  if (!score) return undefined;
  return {
    ...score,
    subjectDominance: Math.round(profile.subjectDominance * 100),
    notes: [...score.notes, ...profile.notes],
  };
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score
      ? { ...candidate.score, failures: [...candidate.score.failures], notes: [...candidate.score.notes] }
      : undefined,
    layers: candidate.layers.map((layer) => ({
      ...layer,
      bounds: { ...layer.bounds },
      meta: { ...layer.meta },
      filter: "filter" in layer && layer.filter ? { ...layer.filter } : undefined,
    })) as SceneLayer[],
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

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function normalizedRectToAbsolute(normalized: Rect, container: Rect): Rect {
  return {
    x: container.x + normalized.x * container.width,
    y: container.y + normalized.y * container.height,
    width: normalized.width * container.width,
    height: normalized.height * container.height,
  };
}

function scaleRectFromCenter(rect: Rect, sx: number, sy: number): void {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  rect.width *= sx;
  rect.height *= sy;
  rect.x = cx - rect.width / 2;
  rect.y = cy - rect.height / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}
