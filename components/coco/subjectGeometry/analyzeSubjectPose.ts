import type { SubjectPixelRect } from "./buildSubjectSemanticRegions.ts";

export type SubjectPoseEvidence = {
  shoulderY: number | null;
  shoulderWidth: number | null;
  bodyLean: "left" | "center" | "right";
  openSide: "left" | "right" | "balanced";
  faceCenterX: number | null;
  torsoCenterX: number | null;
  confidence: number;
  signals: {
    face: number;
    shoulders: number;
    silhouette: number;
  };
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function analyzeSubjectPose(input: {
  alpha: Uint8ClampedArray;
  maskWidth: number;
  maskHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  face?: SubjectPixelRect;
  alphaThreshold?: number;
}): SubjectPoseEvidence {
  const width = Math.max(1, Math.floor(input.maskWidth));
  const height = Math.max(1, Math.floor(input.maskHeight));
  const threshold = input.alphaThreshold ?? 18;
  const scaleX = width / Math.max(1, input.sourceWidth);
  const scaleY = height / Math.max(1, input.sourceHeight);
  const face = input.face
    ? {
        x: input.face.x * scaleX,
        y: input.face.y * scaleY,
        width: input.face.width * scaleX,
        height: input.face.height * scaleY,
      }
    : null;
  const rowBounds: Array<{ left: number; right: number; mass: number } | null> =
    new Array(height).fill(null);
  let totalMass = 0;

  for (let y = 0; y < height; y += 1) {
    let left = width;
    let right = -1;
    let mass = 0;
    for (let x = 0; x < width; x += 1) {
      const alpha = input.alpha[y * width + x] ?? 0;
      if (alpha <= threshold) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      mass += alpha / 255;
    }
    if (right >= left) rowBounds[y] = { left, right, mass };
    totalMass += mass;
  }

  const silhouetteCoverage = totalMass / Math.max(1, width * height);
  const faceCenterX = face ? face.x + face.width / 2 : null;
  const shoulderSearchTop = face
    ? Math.max(0, Math.floor(face.y + face.height * 0.72))
    : Math.floor(height * 0.2);
  const shoulderSearchBottom = face
    ? Math.min(height - 1, Math.ceil(face.y + face.height * 1.9))
    : Math.floor(height * 0.48);
  const requiredShoulderWidth = face ? face.width * 1.45 : width * 0.34;
  let shoulderRow: number | null = null;
  let shoulderWidth: number | null = null;

  for (let y = shoulderSearchTop; y <= shoulderSearchBottom; y += 1) {
    const row = rowBounds[y];
    if (!row) continue;
    const rowWidth = row.right - row.left + 1;
    if (rowWidth < requiredShoulderWidth) continue;
    shoulderRow = y;
    shoulderWidth = rowWidth;
    break;
  }

  const torsoTop = shoulderRow ?? shoulderSearchBottom;
  let torsoMass = 0;
  let torsoWeightedX = 0;
  let leftMass = 0;
  let rightMass = 0;
  const splitX = faceCenterX ?? width / 2;
  for (let y = torsoTop; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = input.alpha[y * width + x] ?? 0;
      if (alpha <= threshold) continue;
      const mass = alpha / 255;
      torsoMass += mass;
      torsoWeightedX += x * mass;
      if (x < splitX) leftMass += mass;
      else rightMass += mass;
    }
  }
  const torsoCenterX = torsoMass > 0 ? torsoWeightedX / torsoMass : null;
  const leanDelta =
    torsoCenterX != null && faceCenterX != null
      ? (torsoCenterX - faceCenterX) / Math.max(1, face?.width ?? width * 0.2)
      : 0;
  const bodyLean = leanDelta < -0.18 ? "left" : leanDelta > 0.18 ? "right" : "center";
  const sideDifference = Math.abs(leftMass - rightMass) / Math.max(1, leftMass + rightMass);
  const openSide =
    sideDifference < 0.08 ? "balanced" : leftMass < rightMass ? "left" : "right";
  const signals = {
    face: face ? 0.95 : 0,
    shoulders: shoulderRow != null ? 0.82 : 0.25,
    silhouette: clamp01((silhouetteCoverage - 0.02) / 0.32),
  };

  return {
    shoulderY: shoulderRow == null ? null : shoulderRow / height * 100,
    shoulderWidth: shoulderWidth == null ? null : shoulderWidth / width * 100,
    bodyLean,
    openSide,
    faceCenterX: faceCenterX == null ? null : faceCenterX / width * 100,
    torsoCenterX: torsoCenterX == null ? null : torsoCenterX / width * 100,
    confidence: clamp01(
      signals.face * 0.4 + signals.shoulders * 0.32 + signals.silhouette * 0.28
    ),
    signals,
  };
}
