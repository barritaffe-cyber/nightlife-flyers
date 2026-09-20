export type CocoCompositionBox = {
  authoritative?: boolean;
  confidence?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  score?: number;
  label?: string;
  source?: CocoDetectionSource;
};

export type CocoCompositionPlan = {
  family: "left-stack" | "right-stack" | "center-poster" | "bottom-lockup";
  anchor: CocoCompositionBox;
  alignment: "left" | "center" | "right";
  textColumn: CocoCompositionBox;
  headline: CocoCompositionBox;
  accent: CocoCompositionBox;
  metadata: CocoCompositionBox;
  venue: CocoCompositionBox;
  dateTime: CocoCompositionBox;
  footer?: CocoCompositionBox;
  score: number;
};

export type CocoCompositionMap = {
  width: number;
  height: number;
  detectedScene?: {
    objects: CocoSceneImageObject[];
    reliable: boolean;
    subjectMask?: CocoSubjectMask;
  };
  faceZones: CocoCompositionBox[];
  subjectZones: CocoCompositionBox[];
  heuristicHints?: {
    possibleDrinkZones: CocoCompositionBox[];
    possibleFaceZones: CocoCompositionBox[];
    possibleSubjectZones: CocoCompositionBox[];
  };
  busyZones: CocoCompositionBox[];
  darkZones: CocoCompositionBox[];
  brightZones: CocoCompositionBox[];
  emptyZones: CocoCompositionBox[];
  bestTextZones: CocoCompositionBox[];
  compositionPlans: CocoCompositionPlan[];
  sceneImageAnalysis?: CocoSceneImageAnalysis;
  metadata: {
    source: "canvas-pixel-scan";
    /** @deprecated Package availability only. Use transformersPackage + visionInference. */
    transformers?: "installed" | "not-loaded" | "unavailable";
    transformersPackage: "available" | "unavailable";
    visionInference: "external" | "not-run" | "segmentation-model";
    generatedAt: number;
  };
};

export type CocoCompositionAnalyzerOptions = {
  allowHeuristicFallback?: boolean;
  detectedObjects?: CocoDetectedObject[];
  faceZones?: CocoDetectedZone[];
  subjectMask?: CocoSubjectMask;
  subjectZones?: CocoDetectedZone[];
};

export type CocoDetectionSource =
  | "cutout-alpha"
  | "external-detector"
  | "face-inference"
  | "pixel-heuristic"
  | "segmentation";

export type CocoDetectedZone = CocoCompositionBox & {
  authoritative?: boolean;
  confidence?: number;
  source?: CocoDetectionSource;
};

export type CocoSubjectMask = {
  bounds: CocoCompositionBox;
  confidence: number;
  source: "cutout-alpha" | "external-detector" | "segmentation";
  zones?: CocoCompositionBox[];
};

export type CocoDetectedObject = {
  authoritative?: boolean;
  confidence: number;
  importance?: number;
  protection?: "hard" | "soft" | "none";
  rect: CocoCompositionBox;
  source?: CocoDetectionSource;
  type: CocoSceneImageObjectType;
};

export type CocoSceneImageObjectType =
  | "subject"
  | "face"
  | "eyes"
  | "mouth"
  | "hair"
  | "torso"
  | "drink"
  | "background";

export type CocoSceneImageObject = {
  authoritative?: boolean;
  confidence: number;
  importance: number;
  protection: "hard" | "soft" | "none";
  rect: CocoCompositionBox;
  source?: CocoDetectionSource;
  type: CocoSceneImageObjectType;
};

export type CocoSceneImageAnalysis = {
  backgroundMap: CocoCompositionBox[];
  hero: {
    confidence: number;
    rect?: CocoCompositionBox;
    type: "person" | "background";
  };
  importanceMap: CocoCompositionBox[];
  objects: CocoSceneImageObject[];
  protectionMap: CocoCompositionBox[];
  saliencyMap: CocoCompositionBox[];
  scene: {
    confidence: number;
    energy: number;
    mood: string[];
    type: "nightlife";
  };
  subjectMask: {
    confidence: number;
    coverage: number;
    source: "detected-subject" | "face-inferred-subject" | "pixel-estimated-subject" | "none";
    zones: CocoCompositionBox[];
  };
  textOpportunityMap: CocoCompositionBox[];
};

type ZoneStats = {
  luminance: number;
  contrast: number;
  emptySpace: number;
  visualNoise: number;
};

type SubjectMaskStats = {
  faceDistance: number;
  hardProtectionCoverage: number;
  softProtectionCoverage: number;
  subjectCoverage: number;
};

const ANALYSIS_WIDTH = 240;
const ANALYSIS_HEIGHT = 240;

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeScore(value: number, max = 100) {
  return Number(Math.max(0, Math.min(max, value)).toFixed(3));
}

function scoreToUnit(score: number | undefined, fallback: number) {
  if (!Number.isFinite(score)) return fallback;
  const numeric = Number(score);
  return clamp01(numeric > 1 ? numeric / 100 : numeric);
}

function confidenceFromZone(zone: CocoCompositionBox, fallback: number) {
  return clamp01(zone.confidence ?? scoreToUnit(zone.score, fallback));
}

function isAuthoritativeSource(source: CocoDetectionSource | undefined) {
  return source === "cutout-alpha" || source === "external-detector" || source === "segmentation";
}

function isAuthoritativeZone(zone: CocoCompositionBox) {
  return zone.authoritative === true || isAuthoritativeSource(zone.source);
}

function withDetectionSource(
  box: CocoCompositionBox,
  {
    authoritative,
    confidence,
    label,
    source,
  }: {
    authoritative: boolean;
    confidence: number;
    label?: string;
    source: CocoDetectionSource;
  }
): CocoCompositionBox {
  return {
    ...clampBox(box),
    authoritative,
    confidence: clamp01(confidence),
    label: label ?? box.label,
    score: box.score,
    source,
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampBox(box: CocoCompositionBox): CocoCompositionBox {
  const width = Math.max(1, Math.min(100, Number(box.width)));
  const height = Math.max(1, Math.min(100, Number(box.height)));
  const x = Math.max(0, Math.min(100 - width, Number(box.x)));
  const y = Math.max(0, Math.min(100 - height, Number(box.y)));
  return {
    ...box,
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3)),
  };
}

function boxCenter(box: CocoCompositionBox) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

// A single 10%x10% grid cell was the largest possible "empty" region before
// this - real open areas (a whole sky, a plain wall) are almost always
// bigger than one cell, so findZoneRect's search windows kept missing real
// space that was right there, just spread across several adjacent cells it
// never combined. This merges neighboring open cells into one real
// rectangle instead. "Open" is judged on emptySpace alone (visual
// simplicity/low noise) - contrast (how well white/black text would read
// there) no longer gates whether a region exists at all, only how it
// scores against other candidates, so a smooth low-contrast sky (still
// visually obvious empty space to a person) isn't thrown out before
// search even sees it.
function mergeOpenRegions(cellStats: ZoneStats[][], grid: number, cell: number): CocoCompositionBox[] {
  const openThreshold = 0.52;
  const isOpen = (gy: number, gx: number) => cellStats[gy]?.[gx]?.emptySpace > openThreshold;
  const visited: boolean[][] = Array.from({ length: grid }, () => new Array(grid).fill(false));
  const regions: CocoCompositionBox[] = [];

  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      if (visited[gy][gx] || !isOpen(gy, gx)) continue;

      // Grow right while every cell in the row still qualifies and is
      // unvisited (a real single-row strip of open space).
      let maxGx = gx;
      while (maxGx + 1 < grid && !visited[gy][maxGx + 1] && isOpen(gy, maxGx + 1)) maxGx += 1;

      // Grow down only while the FULL width just claimed also qualifies in
      // the next row - keeps the result a genuine rectangle instead of a
      // bounding box that could swallow a busy cell in an L-shaped gap.
      let maxGy = gy;
      growDown: while (maxGy + 1 < grid) {
        for (let x = gx; x <= maxGx; x += 1) {
          if (visited[maxGy + 1][x] || !isOpen(maxGy + 1, x)) break growDown;
        }
        maxGy += 1;
      }

      let emptySum = 0;
      let contrastSum = 0;
      let count = 0;
      for (let y = gy; y <= maxGy; y += 1) {
        for (let x = gx; x <= maxGx; x += 1) {
          visited[y][x] = true;
          emptySum += cellStats[y][x].emptySpace;
          contrastSum += cellStats[y][x].contrast;
          count += 1;
        }
      }
      const avgEmpty = emptySum / Math.max(1, count);
      const avgContrast = contrastSum / Math.max(1, count);
      regions.push(
        clampBox({
          x: gx * cell,
          y: gy * cell,
          width: (maxGx - gx + 1) * cell,
          height: (maxGy - gy + 1) * cell,
          score: normalizeScore(avgEmpty * 0.7 + avgContrast * 0.3, 1),
          label: "empty",
        })
      );
    }
  }

  return regions;
}

function boxIntersectionArea(a: CocoCompositionBox, b: CocoCompositionBox) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function boxIntersectionRatio(a: CocoCompositionBox, b: CocoCompositionBox) {
  const area = Math.max(0.01, a.width * a.height);
  return boxIntersectionArea(a, b) / area;
}

function boxDistanceScore(box: CocoCompositionBox, protectedZones: CocoCompositionBox[]) {
  if (!protectedZones.length) return 1;
  const center = boxCenter(box);
  const minDistance = protectedZones.reduce((best, protectedZone) => {
    const protectedCenter = boxCenter(protectedZone);
    const dx = center.x - protectedCenter.x;
    const dy = center.y - protectedCenter.y;
    return Math.min(best, Math.sqrt(dx * dx + dy * dy));
  }, Number.POSITIVE_INFINITY);
  return clamp01(minDistance / 48);
}

function protectedOverlapPenalty(box: CocoCompositionBox, protectedZones: CocoCompositionBox[]) {
  return protectedZones.reduce(
    (sum, protectedZone) => sum + boxIntersectionRatio(box, protectedZone),
    0
  );
}

function maxIntersectionRatio(box: CocoCompositionBox, zones: CocoCompositionBox[]) {
  return zones.reduce((max, zone) => Math.max(max, boxIntersectionRatio(box, zone)), 0);
}

function loadImageForComposition(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not analyze this image."));
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function statsForRect(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rect: CocoCompositionBox
): ZoneStats {
  const left = Math.max(0, Math.min(width - 1, Math.floor((rect.x / 100) * width)));
  const top = Math.max(0, Math.min(height - 1, Math.floor((rect.y / 100) * height)));
  const right = Math.max(left + 1, Math.min(width, Math.ceil(((rect.x + rect.width) / 100) * width)));
  const bottom = Math.max(top + 1, Math.min(height, Math.ceil(((rect.y + rect.height) / 100) * height)));
  const stepX = Math.max(1, Math.floor((right - left) / 20));
  const stepY = Math.max(1, Math.floor((bottom - top) / 20));
  let count = 0;
  let lumSum = 0;
  let lumSq = 0;
  let gradientSum = 0;

  for (let y = top; y < bottom; y += stepY) {
    for (let x = left; x < right; x += stepX) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      lumSum += lum;
      lumSq += lum * lum;

      const nx = Math.min(width - 1, x + stepX);
      const ny = Math.min(height - 1, y + stepY);
      const ix = (y * width + nx) * 4;
      const iy = (ny * width + x) * 4;
      const lumX = (0.2126 * (data[ix] ?? 0) + 0.7152 * (data[ix + 1] ?? 0) + 0.0722 * (data[ix + 2] ?? 0)) / 255;
      const lumY = (0.2126 * (data[iy] ?? 0) + 0.7152 * (data[iy + 1] ?? 0) + 0.0722 * (data[iy + 2] ?? 0)) / 255;
      gradientSum += Math.abs(lum - lumX) + Math.abs(lum - lumY);
      count += 1;
    }
  }

  const luminance = count > 0 ? lumSum / count : 0;
  const variance = count > 0 ? Math.max(0, lumSq / count - luminance * luminance) : 0;
  const stdDev = Math.sqrt(variance);
  const gradient = count > 0 ? gradientSum / count : 0;
  const visualNoise = clamp01(stdDev * 2.9 + gradient * 2.35);
  const contrastForWhite = clamp01((1.05 / (luminance + 0.05) - 1) / 8);
  const contrastForBlack = clamp01(((luminance + 0.05) / 0.05 - 1) / 10);
  const contrast = Math.max(contrastForWhite, contrastForBlack);
  const emptySpace = clamp01(1 - visualNoise * 1.08);

  return {
    luminance,
    contrast,
    emptySpace,
    visualNoise,
  };
}

function scoreTextZone(
  rect: CocoCompositionBox,
  stats: ZoneStats,
  protectedZones: CocoCompositionBox[] = [],
  subjectMaskStats: SubjectMaskStats = buildSubjectMaskStats(rect, [], protectedZones)
) {
  if (subjectMaskStats.hardProtectionCoverage > 0.01) return 0;
  if (subjectMaskStats.subjectCoverage > 0.18) return 0;

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const templateAlignment = clamp01(1 - Math.abs(centerX - 50) / 58);
  const premiumBand = clamp01(1 - Math.abs(centerY - 38) / 48);
  const overlapPenalty = protectedOverlapPenalty(rect, protectedZones);
  const subjectPenalty = subjectMaskStats.subjectCoverage * 70;
  const softProtectionPenalty = subjectMaskStats.softProtectionCoverage * 42;
  const faceDistanceReward = clamp01(subjectMaskStats.faceDistance) * 20;
  const score =
    stats.emptySpace * 28 +
    stats.contrast * 22 +
    faceDistanceReward +
    templateAlignment * 10 +
    premiumBand * 5 -
    stats.visualNoise * 24 -
    overlapPenalty * 45 -
    subjectPenalty -
    softProtectionPenalty;
  return normalizeScore(score);
}

function buildSubjectMaskStats(
  rect: CocoCompositionBox,
  subjectZones: CocoCompositionBox[],
  hardProtectionZones: CocoCompositionBox[]
): SubjectMaskStats {
  const subjectCoverage = maxIntersectionRatio(rect, subjectZones);
  const hardProtectionCoverage = maxIntersectionRatio(rect, hardProtectionZones);
  const softProtectionCoverage = maxIntersectionRatio(
    rect,
    subjectZones.map((zone) => expandBox(zone, 1.5, 1.5, zone.label ?? "soft-protected-subject"))
  );
  return {
    faceDistance: boxDistanceScore(rect, hardProtectionZones),
    hardProtectionCoverage,
    softProtectionCoverage,
    subjectCoverage,
  };
}

function boxArea(box: CocoCompositionBox) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

function importanceBox(
  box: CocoCompositionBox,
  label: string,
  score: number
): CocoCompositionBox {
  return {
    ...clampBox(box),
    label,
    score: normalizeScore(score, 100),
  };
}

function buildEyesZone(face: CocoCompositionBox): CocoCompositionBox {
  return clampBox({
    x: face.x + face.width * 0.12,
    y: face.y + face.height * 0.23,
    width: face.width * 0.76,
    height: Math.max(2, face.height * 0.24),
    score: normalizeScore(Number(face.score ?? 0.92), 1),
    label: "eyes",
  });
}

function buildMouthZone(face: CocoCompositionBox): CocoCompositionBox {
  return clampBox({
    x: face.x + face.width * 0.18,
    y: face.y + face.height * 0.58,
    width: face.width * 0.64,
    height: Math.max(2, face.height * 0.18),
    score: normalizeScore(Number(face.score ?? 0.86), 1),
    label: "mouth",
  });
}

function inferHairZone(subject: CocoCompositionBox, face?: CocoCompositionBox): CocoCompositionBox | null {
  if (!face) return null;
  const subjectCenter = boxCenter(subject);
  const faceCenter = boxCenter(face);
  const subjectRight = subject.x + subject.width;
  const subjectBottom = subject.y + subject.height;
  const hairIsRightOfFace = faceCenter.x <= subjectCenter.x;
  const x = hairIsRightOfFace
    ? clamp(face.x + face.width * 0.42, subject.x, subjectRight - 8)
    : subject.x;
  const right = hairIsRightOfFace
    ? subjectRight
    : clamp(face.x + face.width * 0.58, subject.x + 8, subjectRight);
  const y = clamp(face.y - face.height * 0.26, subject.y, subjectBottom - 8);
  const bottom = clamp(
    Math.max(face.y + face.height * 2.25, y + 24),
    y + 8,
    Math.min(subjectBottom, subject.y + subject.height * 0.82)
  );
  if (right - x < 8 || bottom - y < 8) return null;
  return clampBox({
    x,
    y,
    width: right - x,
    height: bottom - y,
    score: normalizeScore(Number(face.score ?? subject.score ?? 0.72), 1),
    label: "hair",
  });
}

function inferTorsoZone(subject: CocoCompositionBox, face?: CocoCompositionBox): CocoCompositionBox | null {
  const y = face ? face.y + face.height * 0.86 : subject.y + subject.height * 0.42;
  const bottom = subject.y + subject.height;
  if (bottom - y < 8) return null;
  return clampBox({
    x: subject.x + subject.width * 0.08,
    y,
    width: subject.width * 0.84,
    height: bottom - y,
    score: normalizeScore(Number(subject.score ?? 0.64), 1),
    label: "torso",
  });
}

function inferDrinkZones(
  brightZones: CocoCompositionBox[],
  subjectZones: CocoCompositionBox[]
): CocoCompositionBox[] {
  const candidates = brightZones
    .filter((zone) => zone.y >= 42)
    .filter((zone) => subjectZones.some((subject) => boxIntersectionRatio(zone, subject) > 0.08))
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 4);
  const drink = unionBoxes(candidates, "drink");
  return drink
    ? [
        withDetectionSource(expandBox(drink, 2, 2, "drink"), {
          authoritative: false,
          confidence: scoreToUnit(drink.score, 0.34),
          label: "possible-drink",
          source: "pixel-heuristic",
        }),
      ]
    : [];
}

function nearestFaceForSubject(
  subject: CocoCompositionBox,
  faceZones: CocoCompositionBox[]
): CocoCompositionBox | undefined {
  if (!faceZones.length) return undefined;
  const subjectCenter = boxCenter(subject);
  return [...faceZones].sort((a, b) => {
    const ac = boxCenter(a);
    const bc = boxCenter(b);
    const ad = Math.hypot(ac.x - subjectCenter.x, ac.y - subjectCenter.y);
    const bd = Math.hypot(bc.x - subjectCenter.x, bc.y - subjectCenter.y);
    return ad - bd;
  })[0];
}

function buildSceneImageObjects({
  detectedObjects,
  faceZones,
  subjectZones,
}: {
  detectedObjects?: CocoDetectedObject[];
  faceZones: CocoCompositionBox[];
  subjectZones: CocoCompositionBox[];
}): CocoSceneImageObject[] {
  const objects: CocoSceneImageObject[] = [];
  for (const subject of subjectZones) {
    if (!isAuthoritativeZone(subject)) continue;
    const face = nearestFaceForSubject(subject, faceZones);
    objects.push({
      authoritative: true,
      confidence: confidenceFromZone(subject, 0.76),
      importance: 72,
      protection: "soft",
      rect: importanceBox(subject, "subject-mask", 82),
      source: subject.source ?? "external-detector",
      type: "subject",
    });
    const hair = inferHairZone(subject, face);
    if (hair) {
      objects.push({
        authoritative: false,
        confidence: scoreToUnit(hair.score, 0.7),
        importance: 48,
        protection: "soft",
        rect: importanceBox(hair, "hair-mask", 78),
        source: "face-inference",
        type: "hair",
      });
    }
    const torso = inferTorsoZone(subject, face);
    if (torso) {
      objects.push({
        authoritative: false,
        confidence: scoreToUnit(torso.score, 0.58),
        importance: 42,
        protection: "soft",
        rect: importanceBox(torso, "torso-mask", 42),
        source: "face-inference",
        type: "torso",
      });
    }
  }

  for (const face of faceZones) {
    if (!isAuthoritativeZone(face)) continue;
    objects.push({
      authoritative: true,
      confidence: confidenceFromZone(face, 0.86),
      importance: 100,
      protection: "hard",
      rect: importanceBox(face, "face-mask", 100),
      source: face.source ?? "external-detector",
      type: "face",
    });
    objects.push({
      authoritative: false,
      confidence: confidenceFromZone(face, 0.86),
      importance: 100,
      protection: "hard",
      rect: importanceBox(buildEyesZone(face), "eyes-mask", 100),
      source: face.source ?? "external-detector",
      type: "eyes",
    });
    objects.push({
      authoritative: false,
      confidence: confidenceFromZone(face, 0.82),
      importance: 95,
      protection: "hard",
      rect: importanceBox(buildMouthZone(face), "mouth-mask", 95),
      source: face.source ?? "external-detector",
      type: "mouth",
    });
  }

  for (const detected of detectedObjects ?? []) {
    if (detected.confidence < 0.45 || detected.authoritative === false) continue;
    objects.push({
      authoritative: detected.authoritative ?? isAuthoritativeSource(detected.source),
      confidence: clamp01(detected.confidence),
      importance: detected.importance ?? (detected.type === "drink" ? 85 : 62),
      protection: detected.protection ?? (detected.type === "background" ? "none" : "hard"),
      rect: importanceBox(detected.rect, `${detected.type}-mask`, detected.importance ?? 62),
      source: detected.source ?? "external-detector",
      type: detected.type,
    });
  }

  return objects;
}

function buildProtectionMap(objects: CocoSceneImageObject[]) {
  return objects
    .filter((object) => object.protection !== "none")
    .map((object) => {
      const pad = object.protection === "hard" ? 1.4 : 0.8;
      return importanceBox(expandBox(object.rect, pad, pad, `protected-${object.type}`), `protected-${object.type}`, object.importance);
    })
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));
}

function filterBackgroundZones(
  zones: CocoCompositionBox[],
  protectionMap: CocoCompositionBox[]
) {
  return dedupeZones(
    zones
      .filter((zone) => maxIntersectionRatio(zone, protectionMap) <= 0.04)
      .map((zone) => ({ ...zone, label: zone.label ?? "background" }))
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
  ).slice(0, 18);
}

function buildSceneImageAnalysis({
  bestTextZones,
  brightZones,
  busyZones,
  darkZones,
  emptyZones,
  faceZones,
  objects,
  protectionMap,
  reliable,
  subjectMask: detectedSubjectMask,
  subjectMaskZones,
  subjectZones,
}: {
  bestTextZones: CocoCompositionBox[];
  brightZones: CocoCompositionBox[];
  busyZones: CocoCompositionBox[];
  darkZones: CocoCompositionBox[];
  emptyZones: CocoCompositionBox[];
  faceZones: CocoCompositionBox[];
  objects: CocoSceneImageObject[];
  protectionMap: CocoCompositionBox[];
  reliable: boolean;
  subjectMask?: CocoSubjectMask;
  subjectMaskZones: CocoCompositionBox[];
  subjectZones: CocoCompositionBox[];
}): CocoSceneImageAnalysis {
  const heroSubject = [...subjectZones]
    .filter(isAuthoritativeZone)
    .sort((a, b) => confidenceFromZone(b, 0) - confidenceFromZone(a, 0))[0];
  const subjectMaskBounds = unionBoxes(subjectMaskZones, "subject-mask");
  const backgroundMap = filterBackgroundZones(
    [...emptyZones, ...darkZones, ...brightZones],
    protectionMap
  );
  const importanceMap = dedupeZones(objects.map((object) => object.rect))
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 16);
  const saliencyMap = dedupeZones([
    ...faceZones.map((zone) => importanceBox(zone, "saliency-face", 96)),
    ...objects
      .filter((object) => object.type === "drink" || object.type === "hair")
      .map((object) => importanceBox(object.rect, `saliency-${object.type}`, object.importance)),
    ...busyZones.slice(0, 6).map((zone) => importanceBox(zone, "saliency-texture", 32)),
  ]).slice(0, 16);
  const coverage = subjectMaskBounds ? boxArea(subjectMaskBounds) / 10000 : 0;
  return {
    backgroundMap,
    hero: heroSubject
      ? { confidence: confidenceFromZone(heroSubject, 0.84), rect: heroSubject, type: "person" }
      : { confidence: 0.28, type: "background" },
    importanceMap,
    objects,
    protectionMap,
    saliencyMap,
    scene: {
      confidence: reliable ? (heroSubject ? 0.9 : 0.74) : 0.28,
      energy: brightZones.length > darkZones.length ? 0.64 : 0.56,
      mood: reliable ? ["premium", "lifestyle", "nightlife"] : ["nightlife"],
      type: "nightlife",
    },
    subjectMask: {
      confidence: detectedSubjectMask?.confidence ?? (heroSubject ? confidenceFromZone(heroSubject, 0.74) : 0),
      coverage: Number(clamp01(coverage).toFixed(3)),
      source: detectedSubjectMask
        ? "detected-subject"
        : subjectZones.some((zone) => zone.source === "face-inference")
        ? "face-inferred-subject"
        : heroSubject
        ? "detected-subject"
        : "none",
      zones: subjectMaskZones,
    },
    textOpportunityMap: bestTextZones,
  };
}

function buildCandidateTextZones() {
  const sizes = [
    { width: 54, height: 18 },
    { width: 62, height: 16 },
    { width: 46, height: 22 },
    { width: 38, height: 44 },
    { width: 34, height: 50 },
    { width: 28, height: 56 },
  ];
  const candidates: CocoCompositionBox[] = [];
  for (const size of sizes) {
    const maxY = Math.max(12, 96 - size.height);
    for (let y = 12; y <= maxY; y += 4) {
      for (let x = 4; x <= 96 - size.width; x += 4) {
        candidates.push(clampBox({ x, y, width: size.width, height: size.height }));
      }
    }
  }
  return dedupeZones(candidates);
}

function withLabel(box: CocoCompositionBox, label: string): CocoCompositionBox {
  return {
    ...clampBox(box),
    label,
  };
}

function buildLeftStackPlan(zone: CocoCompositionBox): CocoCompositionPlan {
  const anchor = clampBox(zone);
  const columnHeight = clamp(anchor.height + 46, 58, 74);
  const textColumn = withLabel(
    {
      x: anchor.x,
      y: anchor.y,
      width: anchor.width,
      height: columnHeight,
      score: anchor.score,
    },
    "type-column"
  );

  return {
    family: "left-stack",
    alignment: "left",
    anchor,
    textColumn,
    headline: withLabel({ x: anchor.x, y: anchor.y, width: anchor.width, height: 22 }, "headline"),
    accent: withLabel({ x: anchor.x, y: anchor.y + 22, width: anchor.width * 0.9, height: 10 }, "accent"),
    metadata: withLabel({ x: anchor.x, y: anchor.y + 35, width: anchor.width * 0.92, height: 9 }, "metadata"),
    dateTime: withLabel({ x: anchor.x, y: anchor.y + 48, width: anchor.width * 0.45, height: 10 }, "date-time"),
    venue: withLabel({ x: anchor.x, y: anchor.y + 60, width: anchor.width * 0.9, height: 8 }, "venue"),
    score: 0,
  };
}

function buildRightStackPlan(zone: CocoCompositionBox): CocoCompositionPlan {
  const anchor = clampBox(zone);
  const columnHeight = clamp(anchor.height + 46, 58, 74);
  const textColumn = withLabel(
    {
      x: anchor.x,
      y: anchor.y,
      width: anchor.width,
      height: columnHeight,
      score: anchor.score,
    },
    "type-column"
  );
  return {
    family: "right-stack",
    alignment: "right",
    anchor,
    textColumn,
    headline: withLabel({ x: anchor.x, y: anchor.y, width: anchor.width, height: 22 }, "headline"),
    accent: withLabel({ x: anchor.x + anchor.width * 0.1, y: anchor.y + 22, width: anchor.width * 0.9, height: 10 }, "accent"),
    metadata: withLabel({ x: anchor.x + anchor.width * 0.08, y: anchor.y + 35, width: anchor.width * 0.92, height: 9 }, "metadata"),
    dateTime: withLabel({ x: anchor.x + anchor.width * 0.55, y: anchor.y + 48, width: anchor.width * 0.45, height: 10 }, "date-time"),
    venue: withLabel({ x: anchor.x + anchor.width * 0.1, y: anchor.y + 60, width: anchor.width * 0.9, height: 8 }, "venue"),
    score: 0,
  };
}

function buildCenterPosterPlan(zone: CocoCompositionBox): CocoCompositionPlan {
  const anchor = clampBox({
    ...zone,
    x: clamp(50 - Math.max(58, zone.width) / 2, 4, 42),
    width: clamp(Math.max(58, zone.width), 58, 88),
  });
  const textColumn = withLabel(
    {
      x: anchor.x,
      y: anchor.y,
      width: anchor.width,
      height: clamp(anchor.height + 36, 48, 64),
      score: anchor.score,
    },
    "type-column"
  );

  return {
    family: "center-poster",
    alignment: "center",
    anchor,
    textColumn,
    headline: withLabel({ x: anchor.x, y: anchor.y, width: anchor.width, height: 20 }, "headline"),
    accent: withLabel({ x: anchor.x + anchor.width * 0.16, y: anchor.y + 20, width: anchor.width * 0.68, height: 8 }, "accent"),
    metadata: withLabel({ x: anchor.x + anchor.width * 0.08, y: anchor.y + 32, width: anchor.width * 0.84, height: 8 }, "metadata"),
    dateTime: withLabel({ x: anchor.x + anchor.width * 0.18, y: anchor.y + 44, width: anchor.width * 0.28, height: 9 }, "date-time"),
    venue: withLabel({ x: anchor.x + anchor.width * 0.5, y: anchor.y + 44, width: anchor.width * 0.32, height: 9 }, "venue"),
    score: 0,
  };
}

function buildBottomLockupPlan(zone: CocoCompositionBox): CocoCompositionPlan {
  const anchor = clampBox({
    ...zone,
    x: clamp(zone.x, 5, 28),
    y: clamp(Math.max(zone.y, 54), 54, 74),
    width: clamp(Math.max(zone.width, 64), 64, 90),
    height: clamp(zone.height, 16, 24),
  });
  const textColumn = withLabel({ x: anchor.x, y: anchor.y, width: anchor.width, height: 35, score: anchor.score }, "type-column");

  return {
    family: "bottom-lockup",
    alignment: "left",
    anchor,
    textColumn,
    headline: withLabel({ x: anchor.x, y: anchor.y, width: anchor.width, height: 16 }, "headline"),
    accent: withLabel({ x: anchor.x, y: anchor.y + 15, width: anchor.width * 0.72, height: 7 }, "accent"),
    metadata: withLabel({ x: anchor.x, y: anchor.y + 24, width: anchor.width * 0.78, height: 5 }, "metadata"),
    dateTime: withLabel({ x: anchor.x + anchor.width * 0.8, y: anchor.y + 23, width: anchor.width * 0.18, height: 8 }, "date-time"),
    venue: withLabel({ x: anchor.x, y: anchor.y + 31, width: anchor.width * 0.66, height: 4 }, "venue"),
    footer: withLabel({ x: anchor.x, y: anchor.y + 34, width: anchor.width, height: 3 }, "footer"),
    score: 0,
  };
}

function planBoxes(plan: CocoCompositionPlan) {
  return [
    plan.textColumn,
    plan.headline,
    plan.accent,
    plan.metadata,
    plan.dateTime,
    plan.venue,
    plan.footer,
  ].filter((box): box is CocoCompositionBox => Boolean(box));
}

function scoreCompositionPlan(
  plan: CocoCompositionPlan,
  {
    protectedZones = [],
    statsForZone,
  }: {
    protectedZones?: CocoCompositionBox[];
    statsForZone?: (zone: CocoCompositionBox) => ZoneStats;
  } = {}
) {
  let score = 100;

  if (plan.headline.height < plan.accent.height * 1.8) score -= 25;
  if (plan.accent.width > plan.headline.width * 1.05) score -= 15;

  const metadataGap = plan.metadata.y - (plan.accent.y + plan.accent.height);
  if (metadataGap > 8) score -= 18;
  if (metadataGap < 1) score -= 8;

  const dateGap = plan.dateTime.y - (plan.metadata.y + plan.metadata.height);
  if (dateGap > 12) score -= 10;
  if (dateGap < 1) score -= 6;

  const venueGap = plan.venue.y - (plan.metadata.y + plan.metadata.height);
  if (venueGap > 18) score -= 12;
  if (plan.venue.y < plan.dateTime.y) score -= 8;

  const anchorScore = Number(plan.anchor.score ?? 0);
  score += clamp((anchorScore - 55) * 0.28, -10, 12);

  const textColumnStats = statsForZone?.(plan.textColumn);
  if (textColumnStats) {
    score += textColumnStats.emptySpace * 10 + textColumnStats.contrast * 8 - textColumnStats.visualNoise * 18;
  }

  const protectedPenalty = planBoxes(plan).reduce(
    (sum, box) => sum + protectedOverlapPenalty(box, protectedZones),
    0
  );
  score -= protectedPenalty * 55;

  const columnCenterX = plan.textColumn.x + plan.textColumn.width / 2;
  if (plan.family === "left-stack" && columnCenterX > 50) score -= 18;
  if (plan.family === "right-stack" && columnCenterX < 50) score -= 18;
  if (plan.family === "center-poster") score -= Math.abs(columnCenterX - 50) * 0.24;

  if (plan.textColumn.y < 4 || plan.textColumn.y + plan.textColumn.height > 98) score -= 16;

  return normalizeScore(score);
}

function buildCompositionPlans({
  bestTextZones,
  protectedZones,
  statsForZone,
}: {
  bestTextZones: CocoCompositionBox[];
  protectedZones: CocoCompositionBox[];
  statsForZone: (zone: CocoCompositionBox) => ZoneStats;
}) {
  const plans = bestTextZones.flatMap((zone) => {
    const centerX = zone.x + zone.width / 2;
    const candidates: CocoCompositionPlan[] = [];
    if (centerX <= 58) candidates.push(buildLeftStackPlan(zone));
    if (centerX >= 42) candidates.push(buildRightStackPlan(zone));
    candidates.push(buildCenterPosterPlan(zone));
    if (zone.y >= 42) candidates.push(buildBottomLockupPlan(zone));
    return candidates;
  });

  return plans
    .map((plan) => ({
      ...plan,
      score: scoreCompositionPlan(plan, { protectedZones, statsForZone }),
    }))
    .filter((plan) => plan.score >= 48)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function unionBoxes(boxes: CocoCompositionBox[], label: string): CocoCompositionBox | null {
  if (!boxes.length) return null;
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  const score = boxes.reduce((sum, box) => sum + Number(box.score ?? 0), 0) / boxes.length;
  return clampBox({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    score: normalizeScore(score, 1),
    label,
  });
}

function expandBox(box: CocoCompositionBox, amountX: number, amountY: number, label = box.label): CocoCompositionBox {
  return clampBox({
    ...box,
    x: box.x - amountX,
    y: box.y - amountY,
    width: box.width + amountX * 2,
    height: box.height + amountY * 2,
    label,
  });
}

function estimateSubjectZones(busyZones: CocoCompositionBox[]) {
  const candidates = busyZones.filter((zone) => zone.y < 82 && Number(zone.score ?? 0) >= 0.48);
  const columns = [
    candidates.filter((zone) => zone.x + zone.width / 2 < 38),
    candidates.filter((zone) => {
      const centerX = zone.x + zone.width / 2;
      return centerX >= 38 && centerX <= 62;
    }),
    candidates.filter((zone) => zone.x + zone.width / 2 > 62),
  ];

  return columns
    .map((column, index): CocoCompositionBox | null => {
      const box = unionBoxes(column, "subject");
      if (!box) return null;
      const area = box.width * box.height;
      const sideBias = index === 1 ? 0.88 : 1;
      const score = normalizeScore(Math.sqrt(area) * sideBias + Number(box.score ?? 0) * 18);
      return withDetectionSource(
        {
          ...expandBox(box, 3, 3, "possible-subject"),
          score,
        },
        {
          authoritative: false,
          confidence: scoreToUnit(score, 0.32),
          label: "possible-subject",
          source: "pixel-heuristic",
        }
      );
    })
    .filter((box): box is CocoCompositionBox => Boolean(box))
    .filter((box) => box.width >= 16 && box.height >= 18)
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 2);
}

function estimateFaceZones(subjectZones: CocoCompositionBox[]) {
  return subjectZones
    .map((subject) => {
      const faceWidth = clamp(subject.width * 0.48, 12, 24);
      const faceHeight = clamp(subject.height * 0.36, 12, 24);
      const subjectCenterX = subject.x + subject.width / 2;
      const faceX = subjectCenterX < 50
        ? subject.x + subject.width * 0.36 - faceWidth / 2
        : subject.x + subject.width * 0.64 - faceWidth / 2;
      return withDetectionSource(
        {
          x: faceX,
          y: subject.y + subject.height * 0.12,
          width: faceWidth,
          height: faceHeight,
          score: subject.score,
          label: "possible-face",
        },
        {
          authoritative: false,
          confidence: Math.min(0.42, confidenceFromZone(subject, 0.32)),
          label: "possible-face",
          source: "face-inference",
        }
      );
    })
    .filter((box) => box.width >= 10 && box.height >= 10);
}

function inferSubjectZoneFromFace(face: CocoCompositionBox): CocoCompositionBox {
  const normalizedFace = clampBox(face);
  const faceCenter = boxCenter(normalizedFace);
  const width = clamp(Math.max(normalizedFace.width * 2.8, 58), 46, 72);
  const height = clamp(Math.max(normalizedFace.height * 3.2, 72), 58, 98);
  const x = faceCenter.x < 50
    ? clamp(normalizedFace.x - normalizedFace.width * 0.08, 0, 100 - width)
    : clamp(normalizedFace.x + normalizedFace.width * 1.08 - width, 0, 100 - width);
  const y = clamp(normalizedFace.y - normalizedFace.height * 0.28, 0, 100 - height);
  return clampBox({
    ...withDetectionSource(
      {
        x,
        y,
        width,
        height,
        score: normalizeScore(Number(normalizedFace.score ?? 0.82), 1),
        label: "subject-from-face",
      },
      {
        authoritative: false,
        confidence: Math.min(0.68, confidenceFromZone(normalizedFace, 0.62) * 0.72),
        label: "subject-from-face",
        source: "face-inference",
      }
    ),
  });
}

function dedupeZones(zones: CocoCompositionBox[]) {
  const deduped: CocoCompositionBox[] = [];
  for (const zone of zones.map(clampBox)) {
    const duplicate = deduped.some((existing) => boxIntersectionRatio(zone, existing) > 0.72);
    if (!duplicate) deduped.push(zone);
  }
  return deduped;
}

async function detectTransformersAvailability(): Promise<CocoCompositionMap["metadata"]["transformersPackage"]> {
  try {
    await import("@huggingface/transformers");
    return "available";
  } catch {
    return "unavailable";
  }
}

export async function analyzeCocoCompositionImage(
  src: string,
  options: CocoCompositionAnalyzerOptions = {}
): Promise<CocoCompositionMap | null> {
  if (typeof document === "undefined" || !src) return null;
  const img = await loadImageForComposition(src);
  const canvas = document.createElement("canvas");
  canvas.width = ANALYSIS_WIDTH;
  canvas.height = ANALYSIS_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  ctx.drawImage(img, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  const imageData = ctx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  const data = imageData.data;
  const grid = 10;
  const cell = 100 / grid;
  const busyZones: CocoCompositionBox[] = [];
  const darkZones: CocoCompositionBox[] = [];
  const brightZones: CocoCompositionBox[] = [];

  // Per-cell stats, kept in a grid so the empty-region merge below can walk
  // neighbors. Every other zone type (busy/dark/bright) stays single-cell -
  // only "empty" feeds findZoneRect's search, where a single 10%x10% tile
  // being the largest possible region is the actual root cause of zones
  // failing to be found on photos with real, larger open areas.
  const cellStats: ZoneStats[][] = [];
  for (let gy = 0; gy < grid; gy += 1) {
    const row: ZoneStats[] = [];
    for (let gx = 0; gx < grid; gx += 1) {
      const zone = clampBox({ x: gx * cell, y: gy * cell, width: cell, height: cell });
      const stats = statsForRect(data, ANALYSIS_WIDTH, ANALYSIS_HEIGHT, zone);
      row.push(stats);
      if (stats.visualNoise > 0.48) busyZones.push({ ...zone, score: normalizeScore(stats.visualNoise, 1), label: "busy" });
      if (stats.luminance < 0.38 && stats.visualNoise < 0.72) {
        darkZones.push({ ...zone, score: normalizeScore(1 - stats.luminance, 1), label: "dark" });
      }
      if (stats.luminance > 0.62 && stats.visualNoise < 0.72) {
        brightZones.push({ ...zone, score: normalizeScore(stats.luminance, 1), label: "bright" });
      }
    }
    cellStats.push(row);
  }
  const emptyZones = mergeOpenRegions(cellStats, grid, cell);

  const suppliedFaceZones = (options.faceZones ?? [])
    .filter((zone) => zone && zone.width > 1 && zone.height > 1)
    .map((zone) =>
      withDetectionSource(
        {
          ...zone,
          label: zone.label ?? "face",
          score: zone.score ?? 0.88,
        },
        {
          authoritative: zone.authoritative ?? true,
          confidence: zone.confidence ?? scoreToUnit(zone.score, 0.88),
          label: zone.label ?? "face",
          source: zone.source ?? "external-detector",
        }
      )
    )
    .filter(isAuthoritativeZone);
  const suppliedSubjectZones = (options.subjectZones ?? [])
    .filter((zone) => zone && zone.width > 1 && zone.height > 1)
    .map((zone) =>
      withDetectionSource(
        {
          ...zone,
          label: zone.label ?? "subject",
          score: zone.score ?? 0.84,
        },
        {
          authoritative: zone.authoritative ?? true,
          confidence: zone.confidence ?? scoreToUnit(zone.score, 0.84),
          label: zone.label ?? "subject",
          source: zone.source ?? "external-detector",
        }
      )
    )
    .filter(isAuthoritativeZone);
  const subjectMaskZones = options.subjectMask
    ? (options.subjectMask.zones?.length ? options.subjectMask.zones : [options.subjectMask.bounds]).map((zone) =>
        withDetectionSource(
          {
            ...zone,
            label: zone.label ?? "subject-mask",
            score: zone.score ?? options.subjectMask?.confidence ?? 0.99,
          },
          {
            authoritative: true,
            confidence: options.subjectMask?.confidence ?? 0.99,
            label: zone.label ?? "subject-mask",
            source: options.subjectMask?.source ?? "segmentation",
          }
        )
      )
    : [];
  const inferredSubjectZones = suppliedSubjectZones.length || subjectMaskZones.length
    ? []
    : suppliedFaceZones.map(inferSubjectZoneFromFace);
  const estimatedSubjectZones = options.allowHeuristicFallback === false ? [] : estimateSubjectZones(busyZones);
  const heuristicSubjectZones = dedupeZones([
    ...inferredSubjectZones,
    ...estimatedSubjectZones,
  ]).slice(0, 3);
  const heuristicFaceZones = dedupeZones(estimateFaceZones(heuristicSubjectZones)).slice(0, 3);
  const subjectZones = dedupeZones([
    ...subjectMaskZones,
    ...suppliedSubjectZones,
  ])
    .filter(isAuthoritativeZone)
    .sort((a, b) => confidenceFromZone(b, 0) - confidenceFromZone(a, 0))
    .slice(0, 3);
  const faceZones = dedupeZones([
    ...suppliedFaceZones,
  ])
    .filter(isAuthoritativeZone)
    .sort((a, b) => confidenceFromZone(b, 0) - confidenceFromZone(a, 0))
    .slice(0, 3);
  const possibleDrinkZones = options.allowHeuristicFallback === false
    ? []
    : inferDrinkZones(brightZones, [...subjectZones, ...heuristicSubjectZones]);
  const reliableScene =
    Boolean(options.subjectMask) ||
    subjectZones.some(isAuthoritativeZone) ||
    faceZones.some(isAuthoritativeZone) ||
    Boolean(options.detectedObjects?.some((object) => object.authoritative !== false && object.confidence >= 0.45));
  const sceneObjects = buildSceneImageObjects({
    detectedObjects: options.detectedObjects,
    faceZones,
    subjectZones,
  });
  const protectionMap = buildProtectionMap(sceneObjects);
  const sceneSubjectMaskZones = dedupeZones(
    sceneObjects
      .filter((object) => object.type === "subject")
      .map((object) => object.rect)
  );
  const protectedZones = [
    ...protectionMap,
    ...faceZones.map((zone) => expandBox(zone, 4, 4, "protected-face")),
  ];

  const bestTextZones = reliableScene
    ? buildCandidateTextZones()
        .map((zone) => {
          const stats = statsForRect(data, ANALYSIS_WIDTH, ANALYSIS_HEIGHT, zone);
          const maskStats = buildSubjectMaskStats(zone, sceneSubjectMaskZones, faceZones);
          return {
            ...zone,
            score: scoreTextZone(zone, stats, protectedZones, maskStats),
            label: "text-opportunity",
          };
        })
        .filter((zone) => Number(zone.score ?? 0) >= 42)
        .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
        .slice(0, 12)
    : [];
  const compositionPlans = reliableScene
    ? buildCompositionPlans({
        bestTextZones,
        protectedZones,
        statsForZone: (zone) => statsForRect(data, ANALYSIS_WIDTH, ANALYSIS_HEIGHT, zone),
      })
    : [];
  const sceneImageAnalysis = buildSceneImageAnalysis({
    bestTextZones,
    brightZones,
    busyZones,
    darkZones,
    emptyZones,
    faceZones,
    objects: sceneObjects,
    protectionMap,
    reliable: reliableScene,
    subjectMask: options.subjectMask,
    subjectMaskZones: sceneSubjectMaskZones,
    subjectZones,
  });
  const transformersPackage = await detectTransformersAvailability();

  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    detectedScene: {
      objects: sceneObjects,
      reliable: reliableScene,
      subjectMask: options.subjectMask,
    },
    faceZones,
    subjectZones,
    heuristicHints: {
      possibleDrinkZones,
      possibleFaceZones: heuristicFaceZones,
      possibleSubjectZones: heuristicSubjectZones,
    },
    busyZones,
    darkZones,
    brightZones,
    emptyZones,
    bestTextZones,
    compositionPlans,
    sceneImageAnalysis,
    metadata: {
      source: "canvas-pixel-scan",
      transformers: transformersPackage === "available" ? "installed" : "unavailable",
      transformersPackage,
      visionInference: options.subjectMask
        ? "segmentation-model"
        : reliableScene
        ? "external"
        : "not-run",
      generatedAt: Date.now(),
    },
  };
}
