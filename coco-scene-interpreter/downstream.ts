import type { CreativeConstraintId, CreativeOpportunityId, SceneInterpretation } from "./types.ts";

export type CompositionAuthority = {
  alignment: SceneInterpretation["creativeDecisions"]["composition"]["stackAlignment"];
  hardConstraints: CreativeConstraintId[];
  overlapPolicy: SceneInterpretation["creativeDecisions"]["composition"]["overlapPolicy"];
  pattern: SceneInterpretation["creativeDecisions"]["composition"]["preferredPattern"];
  stackRect: SceneInterpretation["creativeDecisions"]["composition"]["stackRect"];
  typeField: SceneInterpretation["creativeDecisions"]["composition"]["typeField"];
};

export type TypographyAuthority = {
  density: SceneInterpretation["creativeDecisions"]["densityPolicy"];
  hierarchy: SceneInterpretation["creativeDecisions"]["hierarchy"];
  policy: SceneInterpretation["creativeDecisions"]["typographyPolicy"];
  signatureOpportunities: CreativeOpportunityId[];
};

export const toCompositionAuthority = (scene: SceneInterpretation): CompositionAuthority => ({
  alignment: scene.creativeDecisions.composition.stackAlignment,
  hardConstraints: scene.constraints.filter((constraint) => constraint.hard).map((constraint) => constraint.id),
  overlapPolicy: scene.creativeDecisions.composition.overlapPolicy,
  pattern: scene.creativeDecisions.composition.preferredPattern,
  stackRect: scene.creativeDecisions.composition.stackRect,
  typeField: scene.creativeDecisions.composition.typeField,
});

export const toTypographyAuthority = (scene: SceneInterpretation): TypographyAuthority => ({
  density: scene.creativeDecisions.densityPolicy,
  hierarchy: scene.creativeDecisions.hierarchy,
  policy: scene.creativeDecisions.typographyPolicy,
  signatureOpportunities: scene.opportunities.slice(0, 4).map((opportunity) => opportunity.id),
});

export const toEffectsAuthority = (scene: SceneInterpretation) => scene.creativeDecisions.effectPolicy;

export const toPaletteAuthority = (scene: SceneInterpretation) => scene.creativeDecisions.colorStory;

export function shouldRenderSource(
  scene: SceneInterpretation,
  source: "headline" | "accent" | "details" | "details2" | "date" | "venue" | "badge" | "presenter"
) {
  const density = scene.creativeDecisions.densityPolicy;
  if (source === "details2" && density.mergeSecondaryCopy) return false;
  if (source === "presenter" && density.hideLowPriorityCopy) return false;
  if (source === "badge" && !scene.evidence.eventText.includes("$") && !/\bentry\b/i.test(scene.evidence.eventText)) {
    return false;
  }
  return true;
}
