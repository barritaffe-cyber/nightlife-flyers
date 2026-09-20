import {
  interpretCocoScene,
  type FaceDetection,
  type NegativeSpaceRegion,
  type ObjectDetection,
  type PercentRect,
  type SceneInterpretation,
  type SceneInterpreterInput,
  type SegmentationSignal,
  type SubjectDetection,
} from "../../coco-scene-interpreter/index.ts";
import type { CocoCompositionBox, CocoCompositionMap } from "../../lib/coco/compositionAnalyzer.ts";
import type {
  CocoNightlifeStyle,
  CocoPhotoSignal,
  CocoStyleDecision,
} from "./intelligence/types.ts";
import type {
  CocoTournamentFormat,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentText,
} from "./layoutTournament/types.ts";

type CocoSubjectPixelRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type CocoSubjectBoundsSignal = {
  alpha: CocoSubjectPixelRect;
  core?: CocoSubjectPixelRect;
  coreMode?: "alpha-density" | "face-anchor";
  face?: CocoSubjectPixelRect & { confidence?: number };
  faceKeypoints?: Array<{ label?: string; x: number; y: number }>;
  height: number;
  width: number;
};

type CocoHeroImageFaceSignal = CocoSubjectPixelRect & {
  confidence?: number;
  faceKeypoints?: Array<{ label?: string; x: number; y: number }>;
  imageHeight: number;
  imageWidth: number;
};

export type BuildCocoSceneInterpretationInput = {
  eventName: string;
  compositionMap?: CocoCompositionMap;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  heroImageFace?: CocoHeroImageFaceSignal | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoSignals?: CocoPhotoSignal[];
  preferredLayoutId?: CocoTournamentLayoutId | null;
  styleDecision?: CocoStyleDecision | null;
  subjectBounds?: CocoSubjectBoundsSignal | null;
  subjectZone?: CocoTournamentRect | null;
  text: CocoTournamentText;
};

export function buildCocoSceneInterpretation(
  input: BuildCocoSceneInterpretationInput
): SceneInterpretation | null {
  try {
    return interpretCocoScene(buildSceneInterpreterInput(input));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-scene-interpreter] failed", error);
    }
    return null;
  }
}

export function buildSceneInterpreterInput(
  input: BuildCocoSceneInterpretationInput
): SceneInterpreterInput {
  const subject = buildSubjectDetectionFromEvidence(input);
  const face = buildFaceDetectionFromEvidence(input, subject);
  const negativeSpace = buildNegativeSpaceHints(input.compositionMap);
  const segmentations = buildSegmentationSignals(input, subject);
  const hasSceneEvidence = Boolean(
    input.compositionMap ||
      input.heroImageFace ||
      input.subjectBounds?.alpha ||
      input.subjectBounds?.face
  );

  return {
    format: input.format,
    event: {
      name: input.eventName,
      headline: input.text.headline,
      accent: input.text.script ?? input.text.subtag,
      details: input.text.details,
      details2: input.text.details2,
      presenter: input.text.presenter,
      date: input.text.date,
      venue: input.text.venue,
      price: input.text.price,
      styleHint: input.nightlifeStyle ?? input.styleDecision?.style ?? null,
    },
    image: buildImageSignal(input.photoSignals),
    detections: {
      faces: face ? [face] : [],
      negativeSpace,
      objects: buildObjectDetectionsFromSceneImageAnalysis(input.compositionMap),
      segmentations,
      subjects: subject ? [subject] : [],
    },
    preferredLayoutId: hasSceneEvidence ? null : input.preferredLayoutId ?? null,
    existingPalette: existingPaletteFromPhotoSignals(input.photoSignals),
  };
}

function buildSubjectDetectionFromEvidence(
  input: BuildCocoSceneInterpretationInput
): SubjectDetection | null {
  if (!input.hasSubject) return null;

  if (input.subjectBounds?.alpha) {
    const alphaRect = toPercentPixelRect(
      input.subjectBounds.alpha,
      input.subjectBounds.width,
      input.subjectBounds.height
    );
    // input.faceZone is already in canvas-percent space, correctly
    // accounting for how the photo was actually scaled/positioned to fit
    // its zone (see fitCocoSubjectBoundsToZone in app/page.tsx). Deriving
    // straight from subjectBounds.face via raw pixel-to-percent-of-source
    // math ignores that transform entirely and is wrong whenever the photo
    // doesn't map 1:1 onto the canvas - which is nearly always.
    const faceRect = input.faceZone
      ? toPercentRect(input.faceZone)
      : input.subjectBounds.face
        ? toPercentPixelRect(input.subjectBounds.face, input.subjectBounds.width, input.subjectBounds.height)
        : undefined;
    const coreRect = input.subjectBounds.core
      ? toPercentPixelRect(input.subjectBounds.core, input.subjectBounds.width, input.subjectBounds.height)
      : undefined;
    const alphaIsCredible = isCredibleSubjectAlpha(input.subjectBounds);
    const rect = alphaIsCredible
      ? alphaRect
      : faceRect
      ? buildSubjectRectFromFace(faceRect, input.format)
      : coreRect && isCrediblePercentSubjectRect(coreRect)
      ? coreRect
      : null;
    if (!rect) return null;
    return {
      id: "subject-1",
      confidence: input.subjectBounds.face ? 0.84 : 0.7,
      crop: cropFromRect(rect),
      expression: "unknown",
      gaze: "unknown",
      headRect: faceRect,
      orientation: "unknown",
      poseEnergy: 0.42,
      rect,
      saliency: input.subjectBounds.face ? 0.88 : alphaIsCredible ? 0.76 : 0.62,
      torsoRect: coreRect ?? buildTorsoRect(rect, faceRect),
    };
  }

  if (input.heroImageFace) {
    // Same fix as the subjectBounds.face branch above: prefer the
    // already-transformed canvas-percent faceZone (accounts for how the
    // background photo was actually panned/scaled by buildCocoHeroImageFit)
    // over naive pixel-to-percent-of-source-image math.
    const faceRect = input.faceZone
      ? toPercentRect(input.faceZone)
      : toPercentPixelRect(
          input.heroImageFace,
          input.heroImageFace.imageWidth,
          input.heroImageFace.imageHeight
        );
    const rect = buildSubjectRectFromFace(faceRect, input.format);
    return {
      id: "subject-1",
      confidence: clamp01(input.heroImageFace.confidence ?? 0.74),
      crop: cropFromFaceRatio(input.heroImageFace.height / Math.max(1, input.heroImageFace.imageHeight)),
      expression: "unknown",
      gaze: "unknown",
      headRect: faceRect,
      orientation: "unknown",
      poseEnergy: 0.42,
      rect,
      saliency: 0.78,
      torsoRect: buildTorsoRect(rect, faceRect),
    };
  }

  const subjectZone = topCompositionZone(input.compositionMap?.subjectZones);
  if (subjectZone) {
    const rect = toPercentRect(subjectZone);
    return {
      id: "subject-1",
      confidence: scoreToUnit(subjectZone.score, 0.62),
      crop: cropFromRect(rect),
      expression: "unknown",
      gaze: "unknown",
      orientation: "unknown",
      poseEnergy: 0.42,
      rect,
      saliency: scoreToUnit(subjectZone.score, 0.66),
    };
  }

  return null;
}

function buildFaceDetectionFromEvidence(
  input: BuildCocoSceneInterpretationInput,
  subject: SubjectDetection | null
): FaceDetection | null {
  if (!input.hasSubject) return null;

  if (input.subjectBounds?.face) {
    // See the matching comment in buildSubjectDetectionFromEvidence: prefer
    // the already-transformed canvas-percent faceZone over re-deriving from
    // raw source-image pixels, which ignores how the photo was actually
    // fit/scaled/positioned.
    const rect = input.faceZone
      ? toPercentRect(input.faceZone)
      : toPercentPixelRect(
          input.subjectBounds.face,
          input.subjectBounds.width,
          input.subjectBounds.height
        );
    return {
      id: "face-1",
      confidence: clamp01(input.subjectBounds.face.confidence ?? 0.84),
      eyesRect: buildEyesRect(rect),
      expression: "unknown",
      gaze: "unknown",
      rect,
      subjectId: subject?.id ?? "subject-1",
    };
  }

  if (input.heroImageFace) {
    // See the matching comment in buildSubjectDetectionFromEvidence.
    const rect = input.faceZone
      ? toPercentRect(input.faceZone)
      : toPercentPixelRect(
          input.heroImageFace,
          input.heroImageFace.imageWidth,
          input.heroImageFace.imageHeight
        );
    return {
      id: "face-1",
      confidence: clamp01(input.heroImageFace.confidence ?? 0.78),
      eyesRect: buildEyesRect(rect),
      expression: "unknown",
      gaze: "unknown",
      rect,
      subjectId: subject?.id ?? "subject-1",
    };
  }

  const faceZone = topCompositionZone(input.compositionMap?.faceZones);
  if (faceZone) {
    const rect = toPercentRect(faceZone);
    return {
      id: "face-1",
      confidence: scoreToUnit(faceZone.score, 0.52),
      eyesRect: buildEyesRect(rect),
      expression: "unknown",
      gaze: "unknown",
      rect,
      subjectId: subject?.id,
    };
  }

  return null;
}

function buildSegmentationSignals(
  input: BuildCocoSceneInterpretationInput,
  subject: SubjectDetection | null
): SegmentationSignal[] {
  if (!subject) return [];

  if (input.subjectBounds?.alpha) {
    const alphaArea = isCredibleSubjectAlpha(input.subjectBounds)
      ? pixelArea(input.subjectBounds.alpha)
      : percentAreaToPixelArea(subject.rect, input.subjectBounds.width, input.subjectBounds.height);
    const imageArea = Math.max(1, input.subjectBounds.width * input.subjectBounds.height);
    return [
      {
        subjectId: subject.id,
        centroid: rectCenter(subject.rect),
        edgeContact: rectEdgeContact(subject.rect),
        silhouetteComplexity: input.subjectBounds.coreMode === "face-anchor" ? 0.42 : 0.52,
        visibleMass: clamp01(alphaArea / imageArea),
      },
    ];
  }

  const area = subject.rect.width * subject.rect.height;
  return [
    {
      subjectId: subject.id,
      centroid: rectCenter(subject.rect),
      edgeContact: rectEdgeContact(subject.rect),
      silhouetteComplexity: 0.5,
      visibleMass: clamp01(area / 10000),
    },
  ];
}

function buildNegativeSpaceHints(compositionMap?: CocoCompositionMap): NegativeSpaceRegion[] {
  const boxes = [
    ...(compositionMap?.sceneImageAnalysis?.textOpportunityMap ?? []),
    ...(compositionMap?.sceneImageAnalysis?.backgroundMap ?? []),
    ...(compositionMap?.bestTextZones ?? []),
    ...(compositionMap?.emptyZones ?? []),
  ];
  return boxes
    .filter((box) => box && box.width > 1 && box.height > 1)
    .sort((a, b) => scoreToUnit(b.score, 0.5) - scoreToUnit(a.score, 0.5))
    .slice(0, 5)
    .map((box, index) => ({
      id: box.label ? `scene-${box.label}-${index + 1}` : `scene-text-field-${index + 1}`,
      rect: toPercentRect(box),
      score: scoreToUnit(box.score, 0.56),
    }));
}

function buildObjectDetectionsFromSceneImageAnalysis(
  compositionMap?: CocoCompositionMap
): ObjectDetection[] {
  const objects = compositionMap?.sceneImageAnalysis?.objects ?? [];
  return objects
    .map((object, index): ObjectDetection | null => {
      if (object.type === "drink") {
        return {
          id: `scene-drink-${index + 1}`,
          type: "cocktail",
          rect: toPercentRect(object.rect),
          confidence: object.confidence,
          saliency: clamp01(object.importance / 100),
        };
      }
      return null;
    })
    .filter((object): object is ObjectDetection => Boolean(object));
}

function buildImageSignal(photoSignals?: CocoPhotoSignal[]): SceneInterpreterInput["image"] {
  const signal = photoSignals?.[0] ?? {};
  const dominantColors = existingPaletteFromPhotoSignals(photoSignals);
  return {
    width: 1080,
    height: 1080,
    backgroundComplexity: dominantColors.length >= 3 ? 0.58 : 0.5,
    contrast: signal.contrast === "high" ? 0.72 : signal.contrast === "low" ? 0.36 : 0.55,
    depth: 0.56,
    dominantColors,
    edgeDensity: 0.48,
    grain: 0.25,
    luminance: signal.brightness === "bright" ? 0.66 : signal.brightness === "dark" ? 0.34 : 0.45,
    saturation: signal.saturation === "vivid" ? 0.68 : signal.saturation === "muted" ? 0.34 : 0.5,
    visualNoise: 0.5,
    warmth: signal.temperature === "warm" ? 0.68 : signal.temperature === "cool" ? 0.34 : 0.5,
  };
}

function existingPaletteFromPhotoSignals(photoSignals?: CocoPhotoSignal[]) {
  return Array.from(
    new Set(
      (photoSignals ?? [])
        .flatMap((signal) => signal.dominantHints ?? [])
        .map((hint) => String(hint || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function toPercentRect(rect: CocoTournamentRect) {
  const width = clampRectSize(rect.width);
  const height = clampRectSize(rect.height);
  return {
    height,
    width,
    x: Math.max(0, Math.min(100 - width, Number.isFinite(rect.x) ? rect.x : 0)),
    y: Math.max(0, Math.min(100 - height, Number.isFinite(rect.y) ? rect.y : 0)),
  };
}

function toPercentPixelRect(
  rect: CocoSubjectPixelRect,
  imageWidth: number,
  imageHeight: number
): PercentRect {
  const widthBase = Math.max(1, Number(imageWidth) || 1);
  const heightBase = Math.max(1, Number(imageHeight) || 1);
  const width = clampRectSize((rect.width / widthBase) * 100);
  const height = clampRectSize((rect.height / heightBase) * 100);
  return {
    height,
    width,
    x: Math.max(0, Math.min(100 - width, (rect.x / widthBase) * 100)),
    y: Math.max(0, Math.min(100 - height, (rect.y / heightBase) * 100)),
  };
}

function clampRectSize(value: number) {
  return Math.max(0.01, Math.min(100, Number.isFinite(value) ? value : 0.01));
}

function topCompositionZone(zones?: CocoCompositionBox[]) {
  return [...(zones ?? [])]
    .filter((zone) => zone && zone.width > 1 && zone.height > 1)
    .sort((a, b) => scoreToUnit(b.score, 0.5) - scoreToUnit(a.score, 0.5))[0];
}

function pixelArea(rect: CocoSubjectPixelRect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function percentAreaToPixelArea(rect: PercentRect, imageWidth: number, imageHeight: number) {
  return Math.max(0, (rect.width / 100) * imageWidth) * Math.max(0, (rect.height / 100) * imageHeight);
}

function isCredibleSubjectAlpha(bounds: CocoSubjectBoundsSignal) {
  const imageArea = Math.max(1, bounds.width * bounds.height);
  const alpha = bounds.alpha;
  const areaRatio = pixelArea(alpha) / imageArea;
  const widthRatio = alpha.width / Math.max(1, bounds.width);
  const heightRatio = alpha.height / Math.max(1, bounds.height);
  const touchesAllHorizontalEdges = alpha.x <= bounds.width * 0.015 &&
    alpha.x + alpha.width >= bounds.width * 0.985;
  const touchesAllVerticalEdges = alpha.y <= bounds.height * 0.015 &&
    alpha.y + alpha.height >= bounds.height * 0.985;

  if (areaRatio >= 0.92) return false;
  if (widthRatio >= 0.96 && heightRatio >= 0.96) return false;
  if (touchesAllHorizontalEdges && touchesAllVerticalEdges) return false;
  return areaRatio >= 0.035 && widthRatio >= 0.08 && heightRatio >= 0.12;
}

function isCrediblePercentSubjectRect(rect: PercentRect) {
  const area = rect.width * rect.height;
  if (area >= 9200) return false;
  if (rect.width >= 96 && rect.height >= 96) return false;
  return area >= 350 && rect.width >= 8 && rect.height >= 12;
}

function buildSubjectRectFromFace(faceRect: PercentRect, format: CocoTournamentFormat): PercentRect {
  const faceCenter = rectCenter(faceRect);
  const maxWidth = format === "story" ? 70 : 64;
  const maxHeight = format === "story" ? 96 : 98;
  const width = Math.max(22, Math.min(maxWidth, faceRect.width * 2.35));
  const height = Math.max(46, Math.min(maxHeight, faceRect.height * 3.15));
  const x = Math.max(0, Math.min(100 - width, faceCenter.x - width / 2));
  const y = Math.max(0, Math.min(100 - height, faceRect.y - faceRect.height * 0.42));
  return {
    x,
    y,
    width,
    height,
  };
}

function cropFromRect(rect: PercentRect): SubjectDetection["crop"] {
  const area = rect.width * rect.height;
  if (rect.height >= 76 || rect.width >= 48 || area >= 3600) return "close";
  if (rect.height >= 56 || area >= 2300) return "half";
  if (rect.height >= 36 || area >= 1300) return "three-quarter";
  return "full";
}

function cropFromFaceRatio(faceHeightRatio: number): SubjectDetection["crop"] {
  if (faceHeightRatio >= 0.24) return "close";
  if (faceHeightRatio >= 0.15) return "half";
  if (faceHeightRatio >= 0.09) return "three-quarter";
  return "full";
}

function buildTorsoRect(
  subjectRect: PercentRect,
  faceRect?: CocoTournamentRect | null
): PercentRect | undefined {
  if (!faceRect) return undefined;
  const face = toPercentRect(faceRect);
  const y = Math.max(subjectRect.y, face.y + face.height * 0.85);
  const bottom = Math.min(100, subjectRect.y + subjectRect.height);
  const height = bottom - y;
  if (height <= 2) return undefined;
  return {
    x: subjectRect.x,
    y,
    width: subjectRect.width,
    height,
  };
}

function buildEyesRect(faceRect: PercentRect): PercentRect {
  return {
    x: faceRect.x + faceRect.width * 0.12,
    y: faceRect.y + faceRect.height * 0.24,
    width: faceRect.width * 0.76,
    height: Math.max(0.01, faceRect.height * 0.24),
  };
}

function rectCenter(rect: PercentRect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function rectEdgeContact(rect: PercentRect) {
  return {
    bottom: rect.y + rect.height >= 98,
    left: rect.x <= 2,
    right: rect.x + rect.width >= 98,
    top: rect.y <= 2,
  };
}

function scoreToUnit(score: number | undefined, fallback: number) {
  if (!Number.isFinite(score)) return fallback;
  const numeric = Number(score);
  return clamp01(numeric > 1 ? numeric / 100 : numeric);
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
