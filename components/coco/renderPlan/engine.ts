import type { CocoCompositionSource, CocoCopyTreatment } from "../layoutTournament/types.ts";
import type { BuildCocoRenderPlanInput, CocoRenderPlan } from "./types.ts";

export function buildCocoRenderPlan<TRawEffects = unknown>(
  input: BuildCocoRenderPlanInput<TRawEffects>
): CocoRenderPlan<TRawEffects> {
  const copyTreatment = input.copyTreatment ?? input.composition?.copyTreatment;
  const ownedSources = input.typographyStack?.ownedSources?.length
    ? [...input.typographyStack.ownedSources]
    : copyTreatment
      ? ownedSourcesFromTreatment(copyTreatment)
      : [];
  const strict = Boolean(input.typographyStack && input.composition);
  const hardConstraints =
    input.scene?.constraints.filter((constraint) => constraint.hard).map((constraint) => constraint.id) ?? [];
  const rendererProtectionMap = input.sceneImageAnalysis?.protectionMap ?? [];
  const textOpportunityMap = input.sceneImageAnalysis?.textOpportunityMap ?? [];
  const hasProtectionZones = Boolean(input.scene?.protectionZones.length || rendererProtectionMap.length);

  return {
    allowedEffects: [...input.effects.allowed],
    composition: input.composition
      ? {
          copyTreatment: input.composition.copyTreatment,
          patternId: input.composition.patternId,
          textColumn: input.composition.textColumn,
        }
      : null,
    copyTreatment,
    effects: {
      maxIntensity: input.effects.maxIntensity,
      mode: input.effects.mode,
      reason: input.effects.reason,
    },
    forbiddenEffects: [...input.effects.forbidden],
    mode: strict ? "strict-coco" : "legacy-fallback",
    ownedSources,
    scene: input.scene || input.sceneImageAnalysis
      ? {
          confidence: input.scene?.confidence ?? input.sceneImageAnalysis?.scene.confidence ?? 0,
          hardConstraints,
          imageAnalysis: input.sceneImageAnalysis ?? null,
          protectionZones: [...(input.scene?.protectionZones ?? [])],
          rendererProtectionMap: [...rendererProtectionMap],
          textOpportunityMap: [...textOpportunityMap],
          warnings: [...(input.scene?.warnings ?? [])],
        }
      : null,
    reason: strict
      ? "Renderer must use CocoRenderPlan as the only authority for owned copy, stack typography, and forbidden effects."
      : "Renderer may use legacy fallbacks because Coco did not provide a complete render plan.",
    rendererMustObey: [
      "render-owned-sources-only-through-typography-stack",
      "do-not-render-forbidden-effects",
      "do-not-add-renderer-side-separators",
      "do-not-rebuild-copy-after-copy-architect",
      "keep-preview-and-export-matched",
      ...(input.sceneImageAnalysis ? ["render-from-scene-image-analysis-authority"] : []),
      ...(rendererProtectionMap.length ? ["reject-overlap-with-scene-image-protection-map"] : []),
      ...(textOpportunityMap.length ? ["place-text-inside-scene-text-opportunity-map"] : []),
      ...(hasProtectionZones ? ["reject-overlap-above-scene-protection-allowance"] : []),
      ...(hardConstraints.length ? ["treat-hard-scene-constraints-as-render-blockers"] : []),
    ],
    strict,
    typographyStack: input.typographyStack ?? null,
  };
}

function ownedSourcesFromTreatment(treatment: CocoCopyTreatment) {
  const owned = new Set<CocoCompositionSource>(["headline"]);
  if (treatment.script === "accent-support" || treatment.script === "hide") owned.add("script");
  if (treatment.details === "primary-meta" || treatment.details === "hide") owned.add("details");
  if (treatment.details2) owned.add("details2");
  if (treatment.date === "metadata") owned.add("date");
  if (treatment.venue === "lock-to-stack") owned.add("venue");
  return Array.from(owned);
}
