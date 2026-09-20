export type SubjectPixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SubjectRegionKind =
  | "hair"
  | "eyes"
  | "face-core"
  | "face-perimeter"
  | "hands"
  | "prop"
  | "shoulders"
  | "torso"
  | "lower-body";

export type SubjectSemanticRegion = {
  kind: SubjectRegionKind;
  protection: number;
  rectPct: SubjectPixelRect;
};

export type SubjectSemanticBounds = {
  width: number;
  height: number;
  alpha: SubjectPixelRect;
  face?: SubjectPixelRect;
  hands?: Array<SubjectPixelRect & { confidence?: number }>;
  props?: Array<SubjectPixelRect & { confidence?: number; kind?: string }>;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function normalizeRect(rect: SubjectPixelRect, width: number, height: number): SubjectPixelRect {
  const left = clamp(rect.x, 0, width);
  const top = clamp(rect.y, 0, height);
  const right = clamp(rect.x + rect.width, left, width);
  const bottom = clamp(rect.y + rect.height, top, height);
  return {
    x: (left / width) * 100,
    y: (top / height) * 100,
    width: ((right - left) / width) * 100,
    height: ((bottom - top) / height) * 100,
  };
}

// First semantic decomposition: the alpha mask supplies exact visible
// pixels while the detected face supplies the anatomical anchor. These
// regions are deliberately face-relative, never canvas-position presets.
// Body regions are clipped by the real alpha mask. Independently detected
// hands and props retain their own boxes so held objects excluded by person
// segmentation still remain protected.
export function buildSubjectSemanticRegions(
  bounds: SubjectSemanticBounds
): SubjectSemanticRegion[] {
  const width = Math.max(1, Number(bounds.width));
  const height = Math.max(1, Number(bounds.height));
  const alpha = bounds.alpha;
  const face = bounds.face;
  const detectedRegions: SubjectSemanticRegion[] = [
    ...(bounds.hands ?? []).map((hand) => ({
      kind: "hands" as const,
      protection: 0.98,
      rectPct: normalizeRect(hand, width, height),
    })),
    ...(bounds.props ?? []).map((prop) => ({
      kind: "prop" as const,
      protection: 0.94,
      rectPct: normalizeRect(prop, width, height),
    })),
  ];
  if (!face) {
    const shoulderY = alpha.y + alpha.height * 0.24;
    const torsoY = alpha.y + alpha.height * 0.38;
    const lowerY = alpha.y + alpha.height * 0.72;
    return [
      {
        kind: "hair",
        protection: 0.45,
        rectPct: normalizeRect(
          { x: alpha.x, y: alpha.y, width: alpha.width, height: alpha.height * 0.24 },
          width,
          height
        ),
      },
      {
        kind: "shoulders",
        protection: 0.3,
        rectPct: normalizeRect(
          { x: alpha.x, y: shoulderY, width: alpha.width, height: alpha.height * 0.2 },
          width,
          height
        ),
      },
      {
        kind: "torso",
        protection: 0.2,
        rectPct: normalizeRect(
          { x: alpha.x, y: torsoY, width: alpha.width, height: lowerY - torsoY },
          width,
          height
        ),
      },
      {
        kind: "lower-body",
        protection: 0.15,
        rectPct: normalizeRect(
          { x: alpha.x, y: lowerY, width: alpha.width, height: alpha.y + alpha.height - lowerY },
          width,
          height
        ),
      },
      ...detectedRegions,
    ];
  }

  const faceCenterX = face.x + face.width / 2;
  const faceBottom = face.y + face.height;
  const shoulderTop = clamp(face.y + face.height * 0.82, alpha.y, alpha.y + alpha.height);
  const shoulderBottom = clamp(faceBottom + face.height * 0.78, shoulderTop, alpha.y + alpha.height);
  const torsoBottom = clamp(
    shoulderBottom + (alpha.y + alpha.height - shoulderBottom) * 0.62,
    shoulderBottom,
    alpha.y + alpha.height
  );
  const perimeterPadX = face.width * 0.16;
  const perimeterPadY = face.height * 0.14;

  return [
    {
      kind: "hair",
      protection: 0.45,
      rectPct: normalizeRect(
        {
          x: Math.max(alpha.x, faceCenterX - face.width * 1.05),
          y: alpha.y,
          width: Math.min(alpha.x + alpha.width, faceCenterX + face.width * 1.05) -
            Math.max(alpha.x, faceCenterX - face.width * 1.05),
          height: Math.max(1, face.y + face.height * 0.2 - alpha.y),
        },
        width,
        height
      ),
    },
    {
      kind: "face-perimeter",
      protection: 0.85,
      rectPct: normalizeRect(
        {
          x: face.x - perimeterPadX,
          y: face.y - perimeterPadY,
          width: face.width + perimeterPadX * 2,
          height: face.height + perimeterPadY * 2,
        },
        width,
        height
      ),
    },
    {
      kind: "face-core",
      protection: 1,
      rectPct: normalizeRect(face, width, height),
    },
    {
      kind: "eyes",
      protection: 1,
      rectPct: normalizeRect(
        {
          x: face.x + face.width * 0.08,
          y: face.y + face.height * 0.22,
          width: face.width * 0.84,
          height: face.height * 0.25,
        },
        width,
        height
      ),
    },
    {
      kind: "shoulders",
      protection: 0.3,
      rectPct: normalizeRect(
        { x: alpha.x, y: shoulderTop, width: alpha.width, height: shoulderBottom - shoulderTop },
        width,
        height
      ),
    },
    {
      kind: "torso",
      protection: 0.2,
      rectPct: normalizeRect(
        { x: alpha.x, y: shoulderBottom, width: alpha.width, height: torsoBottom - shoulderBottom },
        width,
        height
      ),
    },
    {
      kind: "lower-body",
      protection: 0.15,
      rectPct: normalizeRect(
        {
          x: alpha.x,
          y: torsoBottom,
          width: alpha.width,
          height: alpha.y + alpha.height - torsoBottom,
        },
        width,
        height
      ),
    },
    ...detectedRegions,
  ];
}

export const SUBJECT_REGION_DEBUG_COLORS: Record<SubjectRegionKind, string> = {
  hair: "rgba(168, 85, 247, 0.58)",
  eyes: "rgba(239, 68, 68, 0.9)",
  "face-core": "rgba(244, 63, 94, 0.68)",
  "face-perimeter": "rgba(249, 115, 22, 0.45)",
  hands: "rgba(236, 72, 153, 0.72)",
  prop: "rgba(255, 255, 255, 0.78)",
  shoulders: "rgba(250, 204, 21, 0.48)",
  torso: "rgba(34, 197, 94, 0.42)",
  "lower-body": "rgba(14, 165, 233, 0.4)",
};
