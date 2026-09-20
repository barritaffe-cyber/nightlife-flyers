import type { SceneInterpretation } from "../../../coco-scene-interpreter/index.ts";
import type { CocoSceneImageAnalysis } from "../../../lib/coco/compositionAnalyzer.ts";
import type {
  CreativeDirection,
  CreativeDirectorResult,
} from "../../../coco-creative-director/index.ts";
import type {
  CompositionCandidate,
  CompositionDirectorResult,
} from "../../../coco-composition-director/index.ts";
import type {
  CopyArchitectResult,
  CopyRenderModel,
} from "../../../coco-copy-architect/index.ts";
import type {
  TypographyDirectorResult,
  TypographyRenderModel,
} from "../../../coco-typography-director/index.ts";
import type {
  ColorDirectorResult,
  ColorRenderModel,
} from "../../../coco-color-director/index.ts";
import type {
  ArtDirectorResult,
  RenderedFlyerSnapshot,
} from "../../../coco-art-director/index.ts";
import type {
  CritiqueLoopResult,
  CritiqueMemory,
} from "../../../coco-critique-loop/index.ts";
import type {
  CompositionAuthority,
  TypographyAuthority,
} from "../../../coco-scene-interpreter/downstream.ts";
import type {
  CocoConceptDirectorInput,
  CocoConceptEffectsLike,
  CocoConceptPaletteLike,
  CocoConceptTournamentResult,
  CocoFlyerConcept,
} from "../conceptDirector/types.ts";
import type { CocoConceptDirectionId } from "../conceptDirector/directions.ts";
import type { CocoEffectsDecision } from "../effectsDirector/types.ts";
import type { CocoFinalArtDirectorResult } from "../intelligence/finalArtDirector.ts";
import type { CocoCopyTreatment, CocoCreativeBrief } from "../layoutTournament/types.ts";
import type { CocoIterationResult } from "../iteration/types.ts";
import type { CocoRenderPlan } from "../renderPlan/types.ts";
import type { BuildCocoSceneInterpretationInput } from "../sceneInterpreterAdapter.ts";
import type { CocoTypographyStackModel } from "../typographyStack/types.ts";

export type CocoPipelineStageId =
  | "scene-interpreter"
  | "creative-director"
  | "composition-director"
  | "copy-architect"
  | "typography-director"
  | "color-director"
  | "effects-director"
  | "layout-tournament"
  | "typography-stack"
  | "renderer"
  | "art-director"
  | "critique-loop";

export type CocoPipelineStageStatus = "done" | "deferred" | "skipped";

export type CocoPipelineStage = {
  authority: string;
  id: CocoPipelineStageId;
  reason: string;
  status: CocoPipelineStageStatus;
};

export type CocoCopyArchitectureAuthority = {
  copyTreatment?: CocoCopyTreatment;
  groups?: CreativeDirection["copyArchitecture"];
  informationArchitecture?: CocoCreativeBrief["informationArchitecture"];
  ownedSources: string[];
  renderModel?: CopyRenderModel | null;
  suppressedSources: string[];
  rendererMustObey: string[];
};

export type CocoRendererAuthority = {
  mode: "model-obedience";
  rendererMustObey: string[];
};

export type CocoTypographyAuthority = {
  renderModel?: TypographyRenderModel | null;
  rendererMustObey: string[];
};

export type CocoColorAuthority = {
  renderModel?: ColorRenderModel | null;
  rendererMustObey: string[];
};

export type CocoSceneAuthority = {
  artDirectorMustBlock: string[];
  composition: CompositionAuthority;
  confidence: number;
  effects: SceneInterpretation["creativeDecisions"]["effectPolicy"];
  hardConstraints: string[];
  imageAnalysis?: CocoSceneImageAnalysis | null;
  palette: SceneInterpretation["creativeDecisions"]["colorStory"];
  protectionZones: SceneInterpretation["protectionZones"];
  rendererProtectionMap: CocoSceneImageAnalysis["protectionMap"];
  reasoning: string[];
  rendererMustObey: string[];
  suppressedSources: string[];
  textOpportunityMap: CocoSceneImageAnalysis["textOpportunityMap"];
  typography: TypographyAuthority;
  warnings: string[];
};

export type CocoPipelineState<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  artDirector?: CocoFinalArtDirectorResult | null;
  cocoArtDirector: ArtDirectorResult | null;
  color: TPalette;
  colorAuthority: CocoColorAuthority;
  colorDirector: ColorDirectorResult | null;
  colorRenderModel: ColorRenderModel | null;
  compositionCandidate: CompositionCandidate | null;
  compositionDirector: CompositionDirectorResult | null;
  conceptTournament: CocoConceptTournamentResult<TPalette, TEffects>;
  copyArchitecture: CocoCopyArchitectureAuthority;
  copyArchitect: CopyArchitectResult | null;
  copyRenderModel: CopyRenderModel | null;
  creativeBrief: CocoCreativeBrief;
  creativeDirection: CreativeDirection | null;
  creativeDirector: CreativeDirectorResult | null;
  critiqueLoop: CritiqueLoopResult | null;
  effects: CocoEffectsDecision<TEffects>;
  iteration?: CocoIterationResult | null;
  renderPlan: CocoRenderPlan<TEffects>;
  renderedSnapshot?: RenderedFlyerSnapshot | null;
  renderer: CocoRendererAuthority;
  scene: SceneInterpretation | null;
  sceneAuthority: CocoSceneAuthority | null;
  sceneInput: BuildCocoSceneInterpretationInput;
  stages: CocoPipelineStage[];
  typography: CocoTypographyAuthority;
  typographyDirector: TypographyDirectorResult | null;
  typographyRenderModel: TypographyRenderModel | null;
  typographyStack?: CocoTypographyStackModel | null;
  winner: CocoFlyerConcept<TPalette, TEffects>;
};

export type CocoPipelineInput<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  artDirector?: CocoFinalArtDirectorResult | null;
  conceptInput: Omit<CocoConceptDirectorInput<TPalette, TEffects>, "scene">;
  critiqueLoop?: CritiqueLoopResult | null;
  critiqueMemory?: Partial<CritiqueMemory> | null;
  iteration?: CocoIterationResult | null;
  renderedSnapshot?: RenderedFlyerSnapshot | null;
  sceneInput: BuildCocoSceneInterpretationInput;
  selectedDirectionId?: CocoConceptDirectionId | null;
  typographyStack?: CocoTypographyStackModel | null;
};
