import {
  analyzeCocoCompositionImage,
  type CocoCompositionAnalyzerOptions,
  type CocoCompositionBox,
  type CocoCompositionMap,
  type CocoDetectedObject,
  type CocoDetectedZone,
  type CocoSceneImageObjectType,
} from "./compositionAnalyzer";

const PERSON_DETECTOR_MODEL = "Xenova/detr-resnet-50";
const FACE_DETECTOR_MODEL = "";

const MIN_OBJECT_SCORE = 0.45;
const MIN_PERSON_SCORE = 0.55;
const MIN_FACE_SCORE = 0.5;
const NMS_OVERLAP_THRESHOLD = 0.5;

type PixelBox = { xmin: number; ymin: number; xmax: number; ymax: number };
type RawDetection = { box: PixelBox; label: string; score: number };
type ObjectDetectionPipeline = (
  input: string,
  options?: { threshold?: number }
) => Promise<RawDetection[]>;

export type CocoDetectionResult = {
  detectedObjects: CocoDetectedObject[];
  faceZones: CocoDetectedZone[];
  subjectZones: CocoDetectedZone[];
  source: "model-detected" | "model-unavailable" | "no-detections";
};

let personDetectorPromise: Promise<ObjectDetectionPipeline | null> | null = null;
let faceDetectorPromise: Promise<ObjectDetectionPipeline | null> | null = null;

async function loadDetector(modelId: string, kind: string): Promise<ObjectDetectionPipeline | null> {
  try {
    const { pipeline } = await import("@huggingface/transformers");
    return await pipeline("object-detection", modelId) as ObjectDetectionPipeline;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[coco-composition-detector] failed to load ${kind} detector`, error);
    }
    return null;
  }
}

function getPersonDetector() {
  if (!personDetectorPromise) {
    personDetectorPromise = loadDetector(PERSON_DETECTOR_MODEL, "person");
  }
  return personDetectorPromise;
}

function getFaceDetector() {
  if (!FACE_DETECTOR_MODEL) return Promise.resolve(null);
  if (!faceDetectorPromise) {
    faceDetectorPromise = loadDetector(FACE_DETECTOR_MODEL, "face");
  }
  return faceDetectorPromise;
}

export function resetCocoCompositionDetectorCache() {
  personDetectorPromise = null;
  faceDetectorPromise = null;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampBox(box: CocoCompositionBox): CocoCompositionBox {
  const width = clamp(Number(box.width), 1, 100);
  const height = clamp(Number(box.height), 1, 100);
  const x = clamp(Number(box.x), 0, 100 - width);
  const y = clamp(Number(box.y), 0, 100 - height);
  return {
    ...box,
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3)),
  };
}

function boxIntersectionArea(a: CocoCompositionBox, b: CocoCompositionBox) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function boxIntersectionRatio(a: CocoCompositionBox, b: CocoCompositionBox) {
  return boxIntersectionArea(a, b) / Math.max(0.01, a.width * a.height);
}

function scoreToUnit(score: number | undefined, fallback: number) {
  if (!Number.isFinite(score)) return fallback;
  const numeric = Number(score);
  return clamp01(numeric > 1 ? numeric / 100 : numeric);
}

async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  if (typeof Image !== "undefined") {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        height: Math.max(1, image.naturalHeight || image.height),
        width: Math.max(1, image.naturalWidth || image.width),
      });
      image.onerror = () => reject(new Error("Could not read image dimensions."));
      if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
      image.src = src;
    });
  }

  const { RawImage } = await import("@huggingface/transformers");
  const image = await RawImage.read(src);
  return { height: Math.max(1, image.height), width: Math.max(1, image.width) };
}

function toDetectedZone({
  authoritative,
  box,
  confidence,
  imageHeight,
  imageWidth,
  label,
  source,
}: {
  authoritative: boolean;
  box: PixelBox;
  confidence: number;
  imageHeight: number;
  imageWidth: number;
  label: string;
  source: CocoDetectedZone["source"];
}): CocoDetectedZone {
  return {
    ...clampBox({
      x: (box.xmin / imageWidth) * 100,
      y: (box.ymin / imageHeight) * 100,
      width: ((box.xmax - box.xmin) / imageWidth) * 100,
      height: ((box.ymax - box.ymin) / imageHeight) * 100,
      score: confidence,
      label,
    }),
    authoritative,
    confidence: clamp01(confidence),
    source,
  };
}

function nonMaxSuppress<T extends CocoCompositionBox>(boxes: T[], overlapThreshold: number) {
  const kept: T[] = [];
  const sorted = [...boxes].sort((a, b) => scoreToUnit(b.score, 0) - scoreToUnit(a.score, 0));
  for (const candidate of sorted) {
    const overlapsKept = kept.some(
      (existing) =>
        boxIntersectionRatio(candidate, existing) > overlapThreshold ||
        boxIntersectionRatio(existing, candidate) > overlapThreshold
    );
    if (!overlapsKept) kept.push(candidate);
  }
  return kept;
}

function nonMaxSuppressObjects(objects: CocoDetectedObject[], overlapThreshold: number) {
  const kept: CocoDetectedObject[] = [];
  const sorted = [...objects].sort((a, b) => b.confidence - a.confidence);
  for (const candidate of sorted) {
    const overlapsKept = kept.some(
      (existing) =>
        boxIntersectionRatio(candidate.rect, existing.rect) > overlapThreshold ||
        boxIntersectionRatio(existing.rect, candidate.rect) > overlapThreshold
    );
    if (!overlapsKept) kept.push(candidate);
  }
  return kept;
}

function estimateFaceFromSubjectBox(subject: CocoDetectedZone): CocoDetectedZone {
  const faceWidth = clamp(subject.width * 0.55, 10, 26);
  const faceHeight = clamp(subject.height * 0.22, 10, 26);
  return {
    ...clampBox({
      x: subject.x + subject.width / 2 - faceWidth / 2,
      y: subject.y + subject.height * 0.04,
      width: faceWidth,
      height: faceHeight,
      score: subject.score,
      label: "possible-face-from-person-detector",
    }),
    authoritative: false,
    confidence: Math.min(0.5, scoreToUnit(subject.score, 0.5) * 0.72),
    source: "face-inference",
  };
}

function objectTypeFromDetectionLabel(label: string): CocoSceneImageObjectType | null {
  const normalized = label.trim().toLowerCase();
  if (normalized === "wine glass" || normalized === "cup" || normalized === "bottle") return "drink";
  return null;
}

function toDetectedObject(
  detection: RawDetection,
  imageWidth: number,
  imageHeight: number
): CocoDetectedObject | null {
  const type = objectTypeFromDetectionLabel(detection.label);
  if (!type || detection.score < MIN_OBJECT_SCORE) return null;
  const rect = toDetectedZone({
    authoritative: true,
    box: detection.box,
    confidence: detection.score,
    imageHeight,
    imageWidth,
    label: `detected-${type}`,
    source: "external-detector",
  });
  return {
    authoritative: true,
    confidence: clamp01(detection.score),
    importance: type === "drink" ? 82 : 62,
    protection: type === "background" ? "none" : "hard",
    rect,
    source: "external-detector",
    type,
  };
}

export async function detectCompositionSubjects(src: string): Promise<CocoDetectionResult> {
  try {
    const [{ width, height }, personDetector, faceDetector] = await Promise.all([
      getImageDimensions(src),
      getPersonDetector(),
      getFaceDetector(),
    ]);

    if (!personDetector) {
      return { detectedObjects: [], faceZones: [], subjectZones: [], source: "model-unavailable" };
    }

    const objectResults = await personDetector(src, { threshold: MIN_OBJECT_SCORE });
    const subjectZones = nonMaxSuppress(
      objectResults
        .filter((result) => result.label.trim().toLowerCase() === "person" && result.score >= MIN_PERSON_SCORE)
        .map((result) =>
          toDetectedZone({
            authoritative: true,
            box: result.box,
            confidence: result.score,
            imageHeight: height,
            imageWidth: width,
            label: "detected-subject",
            source: "external-detector",
          })
        ),
      NMS_OVERLAP_THRESHOLD
    ).slice(0, 3);
    const detectedObjects = nonMaxSuppressObjects(
      objectResults
        .map((result) => toDetectedObject(result, width, height))
        .filter((object): object is CocoDetectedObject => Boolean(object)),
      NMS_OVERLAP_THRESHOLD
    ).slice(0, 4);

    let faceZones: CocoDetectedZone[] = [];
    if (faceDetector) {
      const faceResults = await faceDetector(src, { threshold: MIN_FACE_SCORE });
      faceZones = nonMaxSuppress(
        faceResults.map((result) =>
          toDetectedZone({
            authoritative: true,
            box: result.box,
            confidence: result.score,
            imageHeight: height,
            imageWidth: width,
            label: "detected-face",
            source: "external-detector",
          })
        ),
        NMS_OVERLAP_THRESHOLD
      ).slice(0, 3);
    }

    if (!faceZones.length && subjectZones.length) {
      faceZones = subjectZones.map(estimateFaceFromSubjectBox);
    }

    if (!subjectZones.length && !faceZones.length && !detectedObjects.length) {
      return { detectedObjects: [], faceZones: [], subjectZones: [], source: "no-detections" };
    }

    return { detectedObjects, faceZones, subjectZones, source: "model-detected" };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[coco-composition-detector] detection failed", error);
    }
    return { detectedObjects: [], faceZones: [], subjectZones: [], source: "model-unavailable" };
  }
}

export async function analyzeImageWithAutoDetection(
  src: string,
  manualOptions: CocoCompositionAnalyzerOptions = {}
): Promise<{ detection: CocoDetectionResult | "skipped"; map: CocoCompositionMap | null }> {
  const hasAuthoritativeSceneInput = Boolean(
    manualOptions.subjectMask ||
      manualOptions.detectedObjects?.length ||
      manualOptions.faceZones?.length ||
      manualOptions.subjectZones?.length
  );

  if (hasAuthoritativeSceneInput) {
    return {
      detection: "skipped",
      map: await analyzeCocoCompositionImage(src, manualOptions),
    };
  }

  const detection = await detectCompositionSubjects(src);
  return {
    detection,
    map: await analyzeCocoCompositionImage(src, {
      detectedObjects: detection.detectedObjects,
      faceZones: detection.faceZones,
      subjectZones: detection.subjectZones,
    }),
  };
}
