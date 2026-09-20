import type {
  CocoFinalArtDirectorScore,
  CocoNightlifeStyle,
  CocoPhotoSignal,
  CocoStyleDecision,
} from "../intelligence";
import type { CocoMoodDirectorInput, CocoMoodProfile } from "../moodDirector";
import type {
  CocoCompositionSystem,
  CocoCreativeBrief,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
  CocoTournamentRect,
  CocoTournamentText,
  CocoTournamentZoneMap,
} from "../layoutTournament";
import type {
  CocoTypographyAvailableFonts,
  CocoTypographyDecision,
  CocoTypographyFallbackFonts,
} from "../typographyDirector";
import type { CocoTypographyStackModel } from "../typographyStack/types";
import type { CocoLearningInput } from "../learning";
import type { CocoConceptDirection, CocoConceptDirectionId } from "./directions";
import type { SceneInterpretation } from "../../../coco-scene-interpreter";

export type CocoConceptPaletteLike = Partial<{
  date: string;
  details: string;
  details2: string;
  headline: string;
  headlineGlow: string;
  headlineStroke: string;
  palette: Partial<{
    accent: string;
    bgFrom: string;
    bgTo: string;
    neutral: string;
    primary: string;
    secondary: string;
  }>;
  presenter: string;
  price: string;
  subheadline: string;
  subtag: string;
  utility: string;
  venue: string;
}>;

export type CocoConceptEffectsLike = Record<string, unknown>;

export type {
  CocoCompositionBlock,
  CocoCompositionPatternId,
  CocoCompositionRole,
  CocoCompositionSystem,
  CocoCreativeBrief,
} from "../layoutTournament";

export type CocoConceptLayoutPlan = {
  brief?: CocoCreativeBrief;
  explanation?: string;
  layoutId: CocoTournamentLayoutId;
  patternId?: string;
  zones: CocoTournamentZoneMap;
  composition?: CocoCompositionSystem;
};

export type CocoConceptImprovement = {
  category: string;
  description: string;
};

export type CocoFlyerConcept<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  brief: CocoCreativeBrief;
  direction: CocoConceptDirection;
  effects: TEffects;
  id: string;
  improvements: CocoConceptImprovement[];
  layout: CocoConceptLayoutPlan;
  moodProfile: CocoMoodProfile;
  name: string;
  palette: TPalette;
  score?: CocoFinalArtDirectorScore;
  stage: "base" | "improved";
  typography: CocoTypographyDecision;
  typographyStack?: CocoTypographyStackModel | null;
};

export type CocoConceptTournamentResult<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  concepts: Array<CocoFlyerConcept<TPalette, TEffects>>;
  finalists: Array<CocoFlyerConcept<TPalette, TEffects>>;
  runnerUp?: CocoFlyerConcept<TPalette, TEffects>;
  wildCard?: CocoFlyerConcept<TPalette, TEffects>;
  winner: CocoFlyerConcept<TPalette, TEffects>;
};

export type CocoConceptDirectorInput<
  TPalette extends CocoConceptPaletteLike = CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike = CocoConceptEffectsLike,
> = {
  availableFonts: CocoTypographyAvailableFonts;
  backgroundOnlyHero?: boolean;
  baseMoodProfile: CocoMoodProfile;
  baseZones: CocoTournamentZoneMap;
  buildMoodProfile?: (input: CocoMoodDirectorInput) => CocoMoodProfile;
  chooseBrief?: (input: CocoBriefPickerInput) => CocoCreativeBrief;
  chooseComposition?: (input: CocoCompositionPickerInput) => CocoCompositionSystem;
  chooseEffects: (input: CocoConceptPickerInput) => TEffects;
  chooseLayout: (input: CocoConceptPickerInput) => CocoConceptLayoutPlan;
  choosePalette: (input: CocoConceptPickerInput) => TPalette;
  chooseTypography: (input: CocoConceptPickerInput) => CocoTypographyDecision;
  event: CocoMoodDirectorInput["event"];
  eventName: string;
  faceZone?: CocoTournamentRect | null;
  fallbackFonts?: CocoTypographyFallbackFonts;
  forcedLayoutId?: CocoTournamentLayoutId | null;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  learning?: CocoLearningInput | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  photoSignals?: CocoPhotoSignal[];
  preferredLayoutId?: CocoTournamentLayoutId | null;
  scene?: SceneInterpretation | null;
  selectedDirectionId?: CocoConceptDirectionId | null;
  styleDecision?: CocoStyleDecision | null;
  subjectZone: CocoTournamentRect;
  text: CocoTournamentText;
};

export type CocoCompositionPickerInput = CocoConceptPickerInput & {
  layout: CocoConceptLayoutPlan;
};

export type CocoConceptPickerInput = {
  backgroundOnlyHero?: boolean;
  baseZones: CocoTournamentZoneMap;
  brief?: CocoCreativeBrief;
  direction: CocoConceptDirection;
  eventName: string;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  hasSubject: boolean;
  improvement?: CocoConceptImprovement | null;
  layout?: CocoConceptLayoutPlan;
  layoutId: CocoTournamentLayoutId;
  moodProfile: CocoMoodProfile;
  nightlifeStyle?: CocoNightlifeStyle | null;
  preferredLayoutId?: CocoTournamentLayoutId | null;
  scene?: SceneInterpretation | null;
  subjectZone: CocoTournamentRect;
  text: CocoTournamentText;
};

export type CocoBriefPickerInput = CocoConceptPickerInput & {
  photoSignals?: CocoPhotoSignal[];
  styleDecision?: CocoStyleDecision | null;
};
