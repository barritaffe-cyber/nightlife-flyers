import type { CopyArchitectInput, CopyTone } from "./types.ts";

export function inferCopyTone(input: CopyArchitectInput): CopyTone {
  if (input.userPreferences?.preferredTone) return input.userPreferences.preferredTone;

  const story = input.scene?.creativeDecisions?.story ?? "";
  const identity = input.creativeDirection?.posterIdentity ?? "";
  const emotion = input.creativeDirection?.emotionalGoal ?? "";

  if (/luxury|vip|editorial|fashion/.test(`${story} ${identity} ${emotion}`)) return "luxury";
  if (/brunch|rooftop|pool|tropical|lifestyle/.test(`${story} ${identity}`)) return "premium-lifestyle";
  if (/edm|club|festival|energy/.test(`${story} ${identity} ${emotion}`)) return "energetic";
  if (/afro|latin|rhythmic/.test(`${story} ${identity}`)) return "playful";
  if (/rnb|intimate|romantic/.test(`${story} ${emotion}`)) return "romantic";
  if (/techno|underground|industrial/.test(`${story} ${identity}`)) return "underground";
  if (/throwback|retro/.test(`${story} ${identity}`)) return "retro";
  if (/minimal|clean/.test(identity)) return "clean";
  return "general-nightlife";
}
