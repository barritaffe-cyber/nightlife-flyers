import type { SceneInterpretation } from "../../../coco-scene-interpreter/index.ts";
import type { CocoNightlifeStyle } from "../intelligence/types.ts";
import type { CocoCreativeBrief } from "../layoutTournament/types.ts";
import type { CocoMoodProfile } from "../moodDirector/types.ts";

export type CocoEffectPolicyMode =
  | "none"
  | "restrained"
  | "moderate"
  | "cinematic"
  | "high-energy";

export type CocoAllowedEffect =
  | "soft-shadow"
  | "subtle-glow"
  | "background-color-cast"
  | "gentle-vignette"
  | "controlled-bloom"
  | "fine-grain";

export type CocoForbiddenEffect =
  | "chrome"
  | "texture-fill"
  | "rule-lines"
  | "date-module"
  | "venue-pill"
  | "underline-slash"
  | "random-separators"
  | "multi-effect-stack"
  | "heavy-glow";

export type CocoEffectsDirectorInput<TRawEffects = unknown> = {
  brief?: CocoCreativeBrief | null;
  moodProfile?: CocoMoodProfile | null;
  nightlifeStyle?: CocoNightlifeStyle | null;
  rawEffects?: TRawEffects;
  scene?: SceneInterpretation | null;
};

export type CocoEffectsDecision<TRawEffects = unknown> = {
  allowed: CocoAllowedEffect[];
  forbidden: CocoForbiddenEffect[];
  maxIntensity: number;
  mode: CocoEffectPolicyMode;
  rawEffects?: TRawEffects;
  reason: string;
  rendererMustObey: string[];
};
