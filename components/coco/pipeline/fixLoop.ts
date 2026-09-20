import { buildColorRenderModel } from "../../../coco-color-director/index.ts";
import type { ColorDirectorInput } from "../../../coco-color-director/index.ts";
import type { CompositionDirectorResult } from "../../../coco-composition-director/index.ts";
import type { ArtDirectorFinding } from "../../../coco-art-director/index.ts";
import { buildTypographyRenderModel } from "../../../coco-typography-director/index.ts";
import type { TypographyDirectorInput, TypographySystem } from "../../../coco-typography-director/index.ts";
import { buildCocoRenderPlan } from "../renderPlan/index.ts";
import {
  buildArtDirectorInput,
  buildColorDirectorInput,
  buildTypographyDirectorInput,
  compositionCandidateToCocoCompositionSystem,
  mergeDirectorWinnersIntoConcept,
  paletteFromColorRenderModel,
  rebuildTypographyStackForConcept,
  runArtDirectorSafely,
  runColorDirectorSafely,
  runCocoPipeline,
  runTypographyDirectorSafely,
  textFromCopyRenderModel,
  typographySystemToCocoTypographyDecision,
} from "./engine.ts";
import { buildRenderedFlyerSnapshotFromPipelineState } from "./renderedSnapshot.ts";
import { ownerForCategory, type FixLoopOwner } from "./fixLoopRouting.ts";
import type { CocoConceptEffectsLike, CocoConceptPaletteLike, CocoFlyerConcept } from "../conceptDirector/types.ts";
import type { CocoPipelineInput, CocoPipelineState } from "./types.ts";

const DEFAULT_MAX_ITERATIONS = 6;
const HARD_MAX_ITERATIONS = 8;

export type FixLoopIteration = {
  finding: ArtDirectorFinding;
  iteration: number;
  owner: FixLoopOwner;
  scoreAfter: number;
  scoreBefore: number;
};

export type CocoPipelineFixLoopResult<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  history: FixLoopIteration[];
  state: CocoPipelineState<TPalette, TEffects>;
  stoppedBecause: string;
};

/**
 * Runs the pipeline, then repeatedly: scores the current design with
 * art-director, and if a finding is owned by a single domain director
 * (color/typography/composition), re-invokes THAT director (steered away
 * from whatever it just picked) and re-scores. Stops when clean, when the
 * strongest remaining finding isn't auto-fixable, or at maxIterations.
 */
export function runCocoPipelineWithFixLoop<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  options?: { maxIterations?: number }
): CocoPipelineFixLoopResult<TPalette, TEffects> {
  const maxIterations = Math.min(
    HARD_MAX_ITERATIONS,
    Math.max(1, Math.round(options?.maxIterations ?? DEFAULT_MAX_ITERATIONS))
  );
  const maxAttempts = maxIterations * 3;

  let state = runCocoPipeline(input);
  if (state.scene) {
    state = withFreshEvaluation(input, state);
  }

  const history: FixLoopIteration[] = [];
  const dismissedFindingIds = new Set<string>();
  const triedCompositionCandidateIds = new Set<string>(
    state.compositionCandidate ? [state.compositionCandidate.id] : []
  );

  let stoppedBecause = "No remaining findings.";
  let attempts = 0;

  for (;;) {
    if (history.length >= maxIterations) {
      stoppedBecause = "Maximum iteration count reached.";
      break;
    }
    if (attempts >= maxAttempts) {
      stoppedBecause = "Fix loop could not find further improvements.";
      break;
    }
    attempts += 1;

    const artDirector = state.cocoArtDirector;
    if (!artDirector) {
      stoppedBecause = "Art Director could not evaluate a rendered snapshot.";
      break;
    }
    if (!artDirector.findings.length) {
      stoppedBecause = "No remaining findings.";
      break;
    }

    const finding = selectStrongestFinding(artDirector.findings, dismissedFindingIds);
    if (!finding) {
      stoppedBecause = "Remaining findings have exhausted their fix attempts.";
      break;
    }

    const owner = ownerForCategory(finding.category);
    if (owner === "not-auto-fixable") {
      stoppedBecause = "Strongest finding is not auto-fixable.";
      break;
    }

    const scoreBefore = artDirector.initialScore.total;
    const regenerated = regenerateForOwner(owner, input, state, finding, triedCompositionCandidateIds);
    // Each finding gets one fix attempt. Whether or not it helps, retrying the
    // identical finding again would just spin the loop without new options.
    dismissedFindingIds.add(finding.id);
    if (!regenerated) {
      continue;
    }

    const nextState = withFreshEvaluation(input, regenerated);
    const scoreAfter = nextState.cocoArtDirector?.initialScore.total ?? scoreBefore;

    history.push({ finding, iteration: history.length + 1, owner, scoreAfter, scoreBefore });

    // A regression means the swap made things worse overall - discard it and
    // keep the better-scoring state so the loop never adopts a worse design.
    if (scoreAfter < scoreBefore) {
      continue;
    }

    state = nextState;
  }

  return { history, state, stoppedBecause };
}

function selectStrongestFinding(
  findings: ArtDirectorFinding[],
  dismissedFindingIds: Set<string>
): ArtDirectorFinding | undefined {
  const eligible = findings.filter((finding) => !dismissedFindingIds.has(finding.id));
  if (!eligible.length) return undefined;

  return [...eligible].sort(
    (a, b) =>
      Number(b.blocker) - Number(a.blocker) ||
      severityWeight(b.severity) - severityWeight(a.severity) ||
      b.scorePenalty - a.scorePenalty ||
      b.confidence - a.confidence
  )[0];
}

function severityWeight(severity: ArtDirectorFinding["severity"]): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function withFreshEvaluation<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>
): CocoPipelineState<TPalette, TEffects> {
  if (!state.scene) return { ...state, cocoArtDirector: null, renderedSnapshot: null };

  const renderedSnapshot = buildRenderedFlyerSnapshotFromPipelineState({
    colorRenderModel: state.colorRenderModel,
    compositionCandidate: state.compositionCandidate,
    format: input.conceptInput.format,
    sceneAuthority: state.sceneAuthority,
    typographyStack: state.typographyStack,
  });

  const cocoArtDirector = runArtDirectorSafely(
    buildArtDirectorInput({
      colorRenderModel: state.colorRenderModel,
      compositionCandidate: state.compositionCandidate,
      copyArchitect: state.copyArchitect,
      creativeDirection: state.creativeDirection,
      effects: state.effects,
      renderedSnapshot,
      scene: state.scene,
      typographyDirector: state.typographyDirector,
    })
  );

  return { ...state, cocoArtDirector, renderedSnapshot };
}

function regenerateForOwner<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  owner: FixLoopOwner,
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>,
  finding: ArtDirectorFinding,
  triedCompositionCandidateIds: Set<string>
): CocoPipelineState<TPalette, TEffects> | null {
  if (!state.scene || !state.creativeDirection) return null;

  if (owner === "color") return regenerateColor(input, state, finding);
  if (owner === "typography") return regenerateTypography(input, state);
  if (owner === "composition") return regenerateComposition(input, state, triedCompositionCandidateIds);
  return null;
}

function regenerateColor<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>,
  finding: ArtDirectorFinding
): CocoPipelineState<TPalette, TEffects> | null {
  const scene = state.scene!;
  const creativeDirection = state.creativeDirection!;

  const flaggedColors = finding.targetIds
    .map((targetId) => state.renderedSnapshot?.elements.find((element) => element.id === targetId)?.color)
    .filter((color): color is string => Boolean(color));

  const baseInput = buildColorDirectorInput(input, scene, creativeDirection, state.winner.palette);
  const colorInput: ColorDirectorInput = {
    ...baseInput,
    learning: {
      ...baseInput.learning,
      rejectedPaletteIds: [
        ...(baseInput.learning?.rejectedPaletteIds ?? []),
        ...(state.colorDirector ? [state.colorDirector.winner.id] : []),
      ],
    },
    userPreferences: {
      ...baseInput.userPreferences,
      forbiddenColors: [...(baseInput.userPreferences?.forbiddenColors ?? []), ...flaggedColors],
    },
  };

  const colorDirector = runColorDirectorSafely(colorInput);
  if (!colorDirector || colorDirector.winner.id === state.colorDirector?.winner.id) return null;

  const colorRenderModel = buildColorRenderModel(colorDirector.winner, colorDirector.authority.maxStrongColors);
  const directedPalette = paletteFromColorRenderModel(colorRenderModel, state.winner.palette);

  const winnerForStack = mergeDirectorWinnersIntoConcept({
    baseWinner: state.winner,
    directedComposition: null,
    directedPalette,
    directedTypography: null,
    winnerBrief: state.winner.brief,
  });

  const rebuilt = rebuildDownstream(input, state, winnerForStack);

  return {
    ...state,
    ...rebuilt,
    color: rebuilt.winner.palette,
    colorAuthority: {
      ...state.colorAuthority,
      renderModel: colorRenderModel,
    },
    colorDirector,
    colorRenderModel,
  };
}

function regenerateTypography<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>
): CocoPipelineState<TPalette, TEffects> | null {
  const scene = state.scene!;
  const creativeDirection = state.creativeDirection!;
  if (!state.copyArchitect || !state.typographyDirector) return null;

  const currentPair = fontPairSignature(state.typographyDirector.winner);
  const baseInput = buildTypographyDirectorInput(
    input,
    scene,
    creativeDirection,
    state.compositionCandidate,
    state.copyArchitect
  );
  const typographyInput: TypographyDirectorInput = {
    ...baseInput,
    learning: {
      ...baseInput.learning,
      rejectedFontPairs: [...(baseInput.learning?.rejectedFontPairs ?? []), currentPair],
    },
  };

  const typographyDirector = runTypographyDirectorSafely(typographyInput);
  if (!typographyDirector || typographyDirector.winner.id === state.typographyDirector.winner.id) return null;

  const typographyRenderModel = buildTypographyRenderModel(typographyDirector.winner);
  const directedTypography = typographySystemToCocoTypographyDecision(
    typographyDirector.winner,
    state.winner.typography
  );

  const winnerForStack = mergeDirectorWinnersIntoConcept({
    baseWinner: state.winner,
    directedComposition: null,
    directedPalette: state.winner.palette,
    directedTypography,
    winnerBrief: state.winner.brief,
  });

  const rebuilt = rebuildDownstream(input, state, winnerForStack);

  return {
    ...state,
    ...rebuilt,
    typography: {
      ...state.typography,
      renderModel: typographyRenderModel,
    },
    typographyDirector,
    typographyRenderModel,
  };
}

function regenerateComposition<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>,
  triedCompositionCandidateIds: Set<string>
): CocoPipelineState<TPalette, TEffects> | null {
  if (!state.compositionDirector) return null;

  const nextCandidate = [...state.compositionDirector.candidates]
    .filter((candidate) => !triedCompositionCandidateIds.has(candidate.id))
    .sort((a, b) => b.score.total - a.score.total)[0];
  if (!nextCandidate) return null;

  triedCompositionCandidateIds.add(nextCandidate.id);

  const compositionDirector: CompositionDirectorResult = {
    ...state.compositionDirector,
    winner: nextCandidate,
  };
  const directedComposition = compositionCandidateToCocoCompositionSystem(nextCandidate, state.winner.brief);

  const winnerForStack = mergeDirectorWinnersIntoConcept({
    baseWinner: state.winner,
    directedComposition,
    directedPalette: state.winner.palette,
    directedTypography: null,
    winnerBrief: state.winner.brief,
  });

  const rebuilt = rebuildDownstream(input, { ...state, compositionCandidate: nextCandidate }, winnerForStack);

  return {
    ...state,
    ...rebuilt,
    compositionCandidate: nextCandidate,
    compositionDirector,
  };
}

function rebuildDownstream<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(
  input: CocoPipelineInput<TPalette, TEffects>,
  state: CocoPipelineState<TPalette, TEffects>,
  winnerForStack: CocoFlyerConcept<TPalette, TEffects>
) {
  const stackText = state.copyRenderModel
    ? textFromCopyRenderModel(input.conceptInput.text, state.copyRenderModel)
    : input.conceptInput.text;

  const winner = rebuildTypographyStackForConcept({
    compositionCandidate: state.compositionCandidate,
    creativeDirection: state.creativeDirection,
    creativeSignatureMove: state.typographyStack?.signatureMove ?? null,
    faceZone: input.conceptInput.faceZone,
    format: input.conceptInput.format,
    stackText,
    suppliedTypographyStack: null,
    typographyDirector: state.typographyDirector,
    winnerForStack,
  });

  const sceneImageAnalysis = input.sceneInput.compositionMap?.sceneImageAnalysis ?? null;
  const renderPlan = buildCocoRenderPlan<TEffects>({
    composition: winner.layout.composition,
    effects: state.effects,
    scene: state.scene,
    sceneImageAnalysis,
    typographyStack: winner.typographyStack,
  });

  return { renderPlan, typographyStack: winner.typographyStack ?? null, winner };
}

function fontPairSignature(system: TypographySystem): string {
  return [system.headline.fontFamily, system.accent?.fontFamily ?? system.metadata?.fontFamily]
    .filter(Boolean)
    .join(" + ");
}
