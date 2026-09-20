import type { CocoAllowedEffect, CocoEffectsDecision, CocoForbiddenEffect } from "../effectsDirector/types.ts";
import type { CocoSceneImageAnalysis } from "../../../lib/coco/compositionAnalyzer.ts";
import type { SceneInterpretation } from "../../../coco-scene-interpreter/index.ts";
import type {
  CocoCompositionSource,
  CocoCompositionSystem,
  CocoCopyTreatment,
} from "../layoutTournament/types.ts";
import type { CocoTypographyStackModel } from "../typographyStack/types.ts";

export type CocoRenderPlanMode = "strict-coco" | "legacy-fallback";

export type CocoRenderPlan<TRawEffects = unknown> = {
  allowedEffects: CocoAllowedEffect[];
  composition: Pick<CocoCompositionSystem, "copyTreatment" | "patternId" | "textColumn"> | null;
  copyTreatment?: CocoCopyTreatment;
  effects: Pick<CocoEffectsDecision<TRawEffects>, "maxIntensity" | "mode" | "reason">;
  forbiddenEffects: CocoForbiddenEffect[];
  mode: CocoRenderPlanMode;
  ownedSources: CocoCompositionSource[];
  scene: null | {
    confidence: number;
    hardConstraints: string[];
    imageAnalysis?: CocoSceneImageAnalysis | null;
    protectionZones: SceneInterpretation["protectionZones"];
    rendererProtectionMap: CocoSceneImageAnalysis["protectionMap"];
    textOpportunityMap: CocoSceneImageAnalysis["textOpportunityMap"];
    warnings: string[];
  };
  reason: string;
  rendererMustObey: string[];
  strict: boolean;
  typographyStack?: CocoTypographyStackModel | null;
};

export type BuildCocoRenderPlanInput<TRawEffects = unknown> = {
  composition?: CocoCompositionSystem | null;
  copyTreatment?: CocoCopyTreatment;
  effects: CocoEffectsDecision<TRawEffects>;
  sceneImageAnalysis?: CocoSceneImageAnalysis | null;
  scene?: SceneInterpretation | null;
  typographyStack?: CocoTypographyStackModel | null;
};
