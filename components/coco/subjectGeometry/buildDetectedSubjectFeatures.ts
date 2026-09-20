import type { SubjectPixelRect } from "./buildSubjectSemanticRegions.ts";

export type NormalizedLandmark = { x: number; y: number };

export type DetectedHandRect = SubjectPixelRect & {
  confidence?: number;
  source: "mediapipe-hand-landmarker";
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export function handRectFromNormalizedLandmarks(input: {
  landmarks: NormalizedLandmark[];
  imageWidth: number;
  imageHeight: number;
  confidence?: number;
}): DetectedHandRect | null {
  const imageWidth = Math.max(1, input.imageWidth);
  const imageHeight = Math.max(1, input.imageHeight);
  if (input.landmarks.length < 5) return null;
  const xs = input.landmarks
    .map((point) => Number(point.x) * imageWidth)
    .filter(Number.isFinite);
  const ys = input.landmarks
    .map((point) => Number(point.y) * imageHeight)
    .filter(Number.isFinite);
  if (xs.length < 5 || ys.length < 5) return null;
  const rawLeft = Math.min(...xs);
  const rawRight = Math.max(...xs);
  const rawTop = Math.min(...ys);
  const rawBottom = Math.max(...ys);
  const padX = Math.max(imageWidth * 0.006, (rawRight - rawLeft) * 0.16);
  const padY = Math.max(imageHeight * 0.006, (rawBottom - rawTop) * 0.16);
  const left = clamp(rawLeft - padX, 0, imageWidth - 1);
  const top = clamp(rawTop - padY, 0, imageHeight - 1);
  const right = clamp(rawRight + padX, left + 1, imageWidth);
  const bottom = clamp(rawBottom + padY, top + 1, imageHeight);
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    confidence: input.confidence,
    source: "mediapipe-hand-landmarker",
  };
}
