import type {
  CocoAllowedEffect,
  CocoEffectPolicyMode,
  CocoEffectsDecision,
  CocoEffectsDirectorInput,
  CocoForbiddenEffect,
} from "./types.ts";

const RESTRAINED_FORBIDDEN: CocoForbiddenEffect[] = [
  "chrome",
  "texture-fill",
  "rule-lines",
  "date-module",
  "venue-pill",
  "underline-slash",
  "random-separators",
  "multi-effect-stack",
  "heavy-glow",
];

const BASE_ALLOWED: CocoAllowedEffect[] = [
  "soft-shadow",
  "subtle-glow",
  "background-color-cast",
  "gentle-vignette",
];

export function directCocoEffects<TRawEffects = unknown>(
  input: CocoEffectsDirectorInput<TRawEffects>
): CocoEffectsDecision<TRawEffects> {
  const scenePolicy = input.scene?.creativeDecisions.effectPolicy;
  const storyId = input.brief?.storyId ?? input.scene?.creativeDecisions.story ?? "";
  const mood = input.moodProfile;
  const rawMode = normalizeMode(scenePolicy?.policy);
  const premiumOrLowDensity =
    input.brief?.polishRules?.useOneTypeColumn ||
    input.scene?.creativeDecisions.densityPolicy?.policy === "low" ||
    input.scene?.creativeDecisions.densityPolicy?.policy === "minimal" ||
    /luxury|brunch|lounge|rnb|vip/.test(String(storyId).toLowerCase());
  const energetic =
    Number(mood?.vector.energy ?? 0) > 78 ||
    /edm|techno|club|rave|high-energy/.test(String(storyId).toLowerCase());

  const mode: CocoEffectPolicyMode =
    rawMode === "none"
      ? "none"
      : premiumOrLowDensity
        ? "restrained"
        : energetic && rawMode !== "restrained"
          ? "cinematic"
          : rawMode;

  const maxIntensity =
    mode === "none"
      ? 0
      : mode === "restrained"
        ? 0.16
        : mode === "moderate"
          ? 0.28
          : mode === "cinematic"
            ? 0.42
            : 0.58;

  const allowed: CocoAllowedEffect[] = mode === "none"
    ? []
    : mode === "restrained"
      ? BASE_ALLOWED
      : [...BASE_ALLOWED, "controlled-bloom", "fine-grain"];

  const forbidden: CocoForbiddenEffect[] = mode === "restrained" || mode === "none"
    ? RESTRAINED_FORBIDDEN
    : RESTRAINED_FORBIDDEN.filter((effect) => effect !== "heavy-glow");

  return {
    allowed,
    forbidden,
    maxIntensity,
    mode,
    rawEffects: input.rawEffects,
    reason: buildReason(mode, premiumOrLowDensity, energetic),
    rendererMustObey: [
      "do-not-add-forbidden-effects",
      "do-not-render-unrequested-separators",
      "keep-preview-and-export-effects-matched",
      "effects-must-support-readability",
    ],
  };
}

function normalizeMode(value: unknown): CocoEffectPolicyMode {
  if (
    value === "none" ||
    value === "restrained" ||
    value === "moderate" ||
    value === "cinematic" ||
    value === "high-energy"
  ) {
    return value;
  }
  return "restrained";
}

function buildReason(mode: CocoEffectPolicyMode, premiumOrLowDensity: boolean, energetic: boolean) {
  if (mode === "none") return "Effects are disabled for this scene.";
  if (premiumOrLowDensity) {
    return "The scene depends on premium hierarchy and negative space, so effects must stay restrained.";
  }
  if (energetic) {
    return "The event can support cinematic energy, but effects still need a single controlled system.";
  }
  return "Use limited effects only where they improve readability or mood.";
}
