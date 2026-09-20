export type CocoSubjectQuality = "none" | "strong" | "weak" | "unusable";

export type CocoSubjectDecision = {
  intent: "none" | "user";
  quality: CocoSubjectQuality;
  source?: "uploaded-photo" | "library-subject";
  reasons?: string[];
  recipeFallbackApproved?: boolean;
  improvementApplied?: boolean;
};

export type CocoSubjectClassifierEvidence = {
  intent: CocoSubjectDecision["intent"];
  source?: CocoSubjectDecision["source"];
  recipeFallbackApproved?: boolean;
  hasForeground: boolean;
  transparencyRatio: number;
  edgeOpaqueRatio: number;
  foregroundCoverage: number;
  alphaBoundsArea: number;
  alphaDensity: number;
  sourceWidth: number;
  sourceHeight: number;
  identityConfidence?: number;
  faceWidthPx?: number;
  detectedPeople?: number;
  identityInsideMask?: boolean;
  haloBoundaryRatio?: number;
};

export type CocoRecipeSubjectAuthorityInput = {
  decision?: CocoSubjectDecision | null;
  visualRecipeId?: string | null;
  hasRecipeSubjectFallback: boolean;
  hasUserSubject: boolean;
};

export type CocoRecipeSubjectAuthorityResolution = {
  mode: "user" | "recipe" | "blocked" | "none";
  offerImproveCutout: boolean;
  requiresRecipeSubjectConsent: boolean;
};

export const COCO_SUBJECT_QUALITY_THRESHOLDS = {
  minimumTransparencyRatio: 0.03,
  maximumUsableEdgeOpaqueRatio: 0.94,
  minimumForegroundCoverage: 0.015,
  maximumForegroundCoverage: 0.94,
  minimumAlphaBoundsArea: 0.02,
  minimumAlphaDensity: 0.04,
  strongTransparencyRatio: 0.08,
  strongMaximumEdgeOpaqueRatio: 0.75,
  strongMinimumForegroundCoverage: 0.04,
  strongMaximumForegroundCoverage: 0.82,
  strongMinimumAlphaBoundsArea: 0.06,
  strongMaximumAlphaBoundsArea: 0.94,
  strongMinimumAlphaDensity: 0.15,
  strongMinimumIdentityConfidence: 0.72,
  strongMinimumSourceDimension: 512,
  strongMinimumFaceWidthPx: 48,
  strongMaximumHaloBoundaryRatio: 0.12,
} as const;

function finiteRatio(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : undefined;
}

function finitePositive(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function decisionWithQuality(
  evidence: CocoSubjectClassifierEvidence,
  quality: CocoSubjectQuality,
  reasons: string[],
): CocoSubjectDecision {
  return {
    intent: evidence.intent,
    quality,
    ...(evidence.source ? { source: evidence.source } : {}),
    ...(reasons.length ? { reasons } : {}),
    ...(evidence.recipeFallbackApproved
      ? { recipeFallbackApproved: true }
      : {}),
  };
}

/**
 * Classifies whether a user-selected subject can safely remain the identity
 * authority for recipe-backed designs. This deliberately judges only the
 * supplied cutout; recipe-subject quality is not an input and cannot outrank
 * the user's identity.
 */
export function classifyCocoSubjectDecision(
  evidence: CocoSubjectClassifierEvidence,
): CocoSubjectDecision {
  if (evidence.intent === "none") {
    return decisionWithQuality(evidence, "none", []);
  }

  const transparencyRatio = finiteRatio(evidence.transparencyRatio);
  const edgeOpaqueRatio = finiteRatio(evidence.edgeOpaqueRatio);
  const foregroundCoverage = finiteRatio(evidence.foregroundCoverage);
  const alphaBoundsArea = finiteRatio(evidence.alphaBoundsArea);
  const alphaDensity = finiteRatio(evidence.alphaDensity);
  const identityConfidence = finiteRatio(evidence.identityConfidence);
  const haloBoundaryRatio = finiteRatio(evidence.haloBoundaryRatio);
  const sourceWidth = finitePositive(evidence.sourceWidth);
  const sourceHeight = finitePositive(evidence.sourceHeight);
  const faceWidthPx = finitePositive(evidence.faceWidthPx);

  const unusableReasons: string[] = [];
  if (!evidence.hasForeground) unusableReasons.push("foreground-missing");
  if (
    transparencyRatio !== undefined &&
    transparencyRatio <= COCO_SUBJECT_QUALITY_THRESHOLDS.minimumTransparencyRatio
  ) {
    unusableReasons.push("transparent-background-missing");
  }
  if (
    edgeOpaqueRatio !== undefined &&
    edgeOpaqueRatio >= COCO_SUBJECT_QUALITY_THRESHOLDS.maximumUsableEdgeOpaqueRatio
  ) {
    unusableReasons.push("foreground-touches-frame");
  }
  if (
    foregroundCoverage !== undefined &&
    foregroundCoverage < COCO_SUBJECT_QUALITY_THRESHOLDS.minimumForegroundCoverage
  ) {
    unusableReasons.push("foreground-too-small");
  }
  if (
    foregroundCoverage !== undefined &&
    foregroundCoverage > COCO_SUBJECT_QUALITY_THRESHOLDS.maximumForegroundCoverage
  ) {
    unusableReasons.push("foreground-fills-frame");
  }
  if (
    alphaBoundsArea !== undefined &&
    alphaBoundsArea < COCO_SUBJECT_QUALITY_THRESHOLDS.minimumAlphaBoundsArea
  ) {
    unusableReasons.push("alpha-bounds-too-small");
  }
  if (
    alphaDensity !== undefined &&
    alphaDensity < COCO_SUBJECT_QUALITY_THRESHOLDS.minimumAlphaDensity
  ) {
    unusableReasons.push("alpha-mask-too-sparse");
  }
  if (
    (evidence.sourceWidth !== undefined && !sourceWidth) ||
    (evidence.sourceHeight !== undefined && !sourceHeight)
  ) {
    unusableReasons.push("invalid-source-dimensions");
  }
  if (evidence.identityInsideMask === false) {
    unusableReasons.push("identity-outside-mask");
  }

  if (unusableReasons.length) {
    return decisionWithQuality(evidence, "unusable", unusableReasons);
  }

  const weakReasons: string[] = [];
  if (
    transparencyRatio === undefined ||
    transparencyRatio < COCO_SUBJECT_QUALITY_THRESHOLDS.strongTransparencyRatio
  ) {
    weakReasons.push("limited-background-separation");
  }
  if (
    edgeOpaqueRatio === undefined ||
    edgeOpaqueRatio > COCO_SUBJECT_QUALITY_THRESHOLDS.strongMaximumEdgeOpaqueRatio
  ) {
    weakReasons.push("foreground-near-frame");
  }
  if (
    foregroundCoverage === undefined ||
    foregroundCoverage < COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumForegroundCoverage ||
    foregroundCoverage > COCO_SUBJECT_QUALITY_THRESHOLDS.strongMaximumForegroundCoverage
  ) {
    weakReasons.push("foreground-coverage-marginal");
  }
  if (
    alphaBoundsArea === undefined ||
    alphaBoundsArea < COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumAlphaBoundsArea ||
    alphaBoundsArea > COCO_SUBJECT_QUALITY_THRESHOLDS.strongMaximumAlphaBoundsArea
  ) {
    weakReasons.push("alpha-bounds-marginal");
  }
  if (
    alphaDensity === undefined ||
    alphaDensity < COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumAlphaDensity
  ) {
    weakReasons.push("alpha-mask-soft");
  }
  if (
    identityConfidence === undefined ||
    identityConfidence < COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumIdentityConfidence
  ) {
    weakReasons.push("identity-confidence-low");
  }
  if (evidence.detectedPeople !== 1) {
    weakReasons.push(
      evidence.detectedPeople && evidence.detectedPeople > 1
        ? "multiple-people-detected"
        : "identity-not-detected",
    );
  }
  if (evidence.identityInsideMask !== true) {
    weakReasons.push("identity-mask-unverified");
  }

  if (
    !sourceWidth ||
    !sourceHeight ||
    Math.min(sourceWidth, sourceHeight) <
      COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumSourceDimension
  ) {
    weakReasons.push("source-resolution-low");
  }
  if (
    faceWidthPx !== undefined &&
    faceWidthPx < COCO_SUBJECT_QUALITY_THRESHOLDS.strongMinimumFaceWidthPx
  ) {
    weakReasons.push("face-too-small");
  }
  if (
    haloBoundaryRatio !== undefined &&
    haloBoundaryRatio > COCO_SUBJECT_QUALITY_THRESHOLDS.strongMaximumHaloBoundaryRatio
  ) {
    weakReasons.push("possible-edge-halo");
  }

  return decisionWithQuality(
    evidence,
    weakReasons.length ? "weak" : "strong",
    weakReasons,
  );
}

/**
 * Resolves which identity source a direction may use. A usable user subject
 * always wins; an authored recipe subject is allowed only when there was no
 * user intent or the user explicitly approved fallback after an unusable cut.
 */
export function resolveCocoRecipeSubjectAuthority(
  input: CocoRecipeSubjectAuthorityInput,
): CocoRecipeSubjectAuthorityResolution {
  const decision = input.decision;
  const hasRecipeSubject = input.hasRecipeSubjectFallback;

  // Older startup payloads can carry a real user cutout without the newer
  // decision metadata. Preserve that identity rather than interpreting the
  // missing classifier result as permission to restore an authored model.
  if (!decision && input.hasUserSubject) {
    return {
      mode: "user",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    };
  }

  if (!decision || decision.intent === "none") {
    return {
      mode: hasRecipeSubject ? "recipe" : "none",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    };
  }

  const usableQuality = decision.quality === "strong" || decision.quality === "weak";
  if (usableQuality && input.hasUserSubject) {
    return {
      mode: "user",
      offerImproveCutout: decision.quality === "weak",
      requiresRecipeSubjectConsent: false,
    };
  }

  if (hasRecipeSubject && decision.recipeFallbackApproved === true) {
    return {
      mode: "recipe",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    };
  }

  return {
    mode: "blocked",
    offerImproveCutout: false,
    requiresRecipeSubjectConsent: hasRecipeSubject,
  };
}
