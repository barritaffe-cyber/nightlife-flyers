import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCocoSubjectDecision,
  resolveCocoRecipeSubjectAuthority,
  type CocoSubjectClassifierEvidence,
  type CocoSubjectDecision,
} from "../lib/coco/subjectAuthority.ts";

const RECIPE_IDS = [
  "rush-night-css",
  "fashion-club-vertical",
  "ladies-css-editorial",
  "neon-night-shift",
  "glow-in-the-dark",
  "punta-cana-sundays",
  "baddies-n-bundles",
] as const;

const STRONG_EVIDENCE: CocoSubjectClassifierEvidence = {
  intent: "user",
  source: "uploaded-photo",
  hasForeground: true,
  transparencyRatio: 0.48,
  edgeOpaqueRatio: 0.18,
  foregroundCoverage: 0.43,
  alphaBoundsArea: 0.62,
  alphaDensity: 0.69,
  sourceWidth: 1200,
  sourceHeight: 1800,
  identityConfidence: 0.91,
  faceWidthPx: 172,
  detectedPeople: 1,
  identityInsideMask: true,
  haloBoundaryRatio: 0.025,
};

test("no user intent remains distinct from an unusable user upload", () => {
  const decision = classifyCocoSubjectDecision({
    intent: "none",
    hasForeground: false,
    transparencyRatio: 0,
    edgeOpaqueRatio: 1,
    foregroundCoverage: 0,
    alphaBoundsArea: 0,
    alphaDensity: 0,
    sourceWidth: 1,
    sourceHeight: 1,
  });

  assert.deepEqual(decision, {
    intent: "none",
    quality: "none",
  });
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    }),
    {
      mode: "recipe",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    },
  );
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      hasRecipeSubjectFallback: false,
      hasUserSubject: false,
    }),
    {
      mode: "none",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    },
  );
  assert.equal(
    resolveCocoRecipeSubjectAuthority({
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    }).mode,
    "recipe",
  );
});

test("a legacy user cutout without decision metadata remains authoritative", () => {
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      hasRecipeSubjectFallback: true,
      hasUserSubject: true,
      visualRecipeId: "glow-in-the-dark",
    }),
    {
      mode: "user",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    },
  );
});

test("a clean isolated identity is classified as strong", () => {
  assert.deepEqual(classifyCocoSubjectDecision(STRONG_EVIDENCE), {
    intent: "user",
    quality: "strong",
    source: "uploaded-photo",
  });
});

test("a usable but uncertain cutout stays authoritative and offers improvement", () => {
  const decision = classifyCocoSubjectDecision({
    ...STRONG_EVIDENCE,
    source: "library-subject",
    identityConfidence: 0.49,
    haloBoundaryRatio: 0.2,
  });

  assert.equal(decision.quality, "weak");
  assert.equal(decision.source, "library-subject");
  assert.ok(decision.reasons?.includes("identity-confidence-low"));
  assert.ok(decision.reasons?.includes("possible-edge-halo"));
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      visualRecipeId: "glow-in-the-dark",
      hasRecipeSubjectFallback: true,
      hasUserSubject: true,
    }),
    {
      mode: "user",
      offerImproveCutout: true,
      requiresRecipeSubjectConsent: false,
    },
  );
});

test("marginal but valid alpha evidence is weak rather than unusable", () => {
  const decision = classifyCocoSubjectDecision({
    ...STRONG_EVIDENCE,
    transparencyRatio: 0.031,
    edgeOpaqueRatio: 0.939,
    foregroundCoverage: 0.021,
    alphaBoundsArea: 0.021,
    alphaDensity: 0.041,
  });

  assert.equal(decision.quality, "weak");
  assert.ok(decision.reasons?.includes("limited-background-separation"));
  assert.ok(decision.reasons?.includes("foreground-near-frame"));
});

test("failed foreground isolation is unusable and cannot silently select a recipe model", () => {
  const decision = classifyCocoSubjectDecision({
    ...STRONG_EVIDENCE,
    hasForeground: false,
    transparencyRatio: 0.01,
    edgeOpaqueRatio: 0.98,
  });

  assert.equal(decision.quality, "unusable");
  assert.ok(decision.reasons?.includes("foreground-missing"));
  assert.ok(decision.reasons?.includes("transparent-background-missing"));
  assert.ok(decision.reasons?.includes("foreground-touches-frame"));
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      visualRecipeId: "glow-in-the-dark",
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    }),
    {
      mode: "blocked",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: true,
    },
  );
});

test("an unusable upload may use the recipe subject only after explicit approval", () => {
  const decision = classifyCocoSubjectDecision({
    ...STRONG_EVIDENCE,
    hasForeground: false,
    recipeFallbackApproved: true,
  });

  assert.equal(decision.quality, "unusable");
  assert.equal(decision.recipeFallbackApproved, true);
  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      visualRecipeId: "glow-in-the-dark",
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    }),
    {
      mode: "recipe",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    },
  );
});

test("an unusable upload without a recipe fallback remains blocked", () => {
  const decision: CocoSubjectDecision = {
    intent: "user",
    quality: "unusable",
    source: "uploaded-photo",
    recipeFallbackApproved: true,
  };

  assert.deepEqual(
    resolveCocoRecipeSubjectAuthority({
      decision,
      hasRecipeSubjectFallback: false,
      hasUserSubject: false,
    }),
    {
      mode: "blocked",
      offerImproveCutout: false,
      requiresRecipeSubjectConsent: false,
    },
  );
});

test("all seven active recipes obey the same identity authority policy", () => {
  const strong = classifyCocoSubjectDecision(STRONG_EVIDENCE);
  const weak = classifyCocoSubjectDecision({
    ...STRONG_EVIDENCE,
    identityConfidence: 0.51,
  });
  const unusable: CocoSubjectDecision = {
    intent: "user",
    quality: "unusable",
    source: "uploaded-photo",
  };

  for (const visualRecipeId of RECIPE_IDS) {
    assert.equal(
      resolveCocoRecipeSubjectAuthority({
        decision: strong,
        visualRecipeId,
        hasRecipeSubjectFallback: true,
        hasUserSubject: true,
      }).mode,
      "user",
      `${visualRecipeId} replaced a strong user identity`,
    );

    const weakResolution = resolveCocoRecipeSubjectAuthority({
      decision: weak,
      visualRecipeId,
      hasRecipeSubjectFallback: true,
      hasUserSubject: true,
    });
    assert.equal(weakResolution.mode, "user", `${visualRecipeId} replaced a weak user identity`);
    assert.equal(weakResolution.offerImproveCutout, true);

    const blockedResolution = resolveCocoRecipeSubjectAuthority({
      decision: unusable,
      visualRecipeId,
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    });
    assert.equal(blockedResolution.mode, "blocked", `${visualRecipeId} silently used its model`);
    assert.equal(blockedResolution.requiresRecipeSubjectConsent, true);

    const approvedResolution = resolveCocoRecipeSubjectAuthority({
      decision: { ...unusable, recipeFallbackApproved: true },
      visualRecipeId,
      hasRecipeSubjectFallback: true,
      hasUserSubject: false,
    });
    assert.equal(approvedResolution.mode, "recipe");
    assert.equal(approvedResolution.requiresRecipeSubjectConsent, false);
  }
});
