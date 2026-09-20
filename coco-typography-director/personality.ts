import type {
  CreativeDirectionLike,
  SceneLike,
  TypographyPersonality,
  TypographyRole,
} from "./types.ts";

export function inferPersonalityForRole(
  role: TypographyRole,
  scene?: SceneLike | null,
  creative?: CreativeDirectionLike | null
): TypographyPersonality {
  const contract = creative?.typography;
  if (role === "headline" && contract?.headlinePersonality) return contract.headlinePersonality;
  if (role === "accent" && contract?.accentPersonality) return contract.accentPersonality;
  if (["metadata", "dateTime", "venue", "presenter", "footer"].includes(role) && contract?.bodyPersonality) {
    return contract.bodyPersonality;
  }

  const policy = scene?.creativeDecisions?.typographyPolicy ?? "";
  const story = scene?.creativeDecisions?.story ?? "";
  const identity = creative?.posterIdentity ?? "";

  if (role === "headline") {
    if (/luxury|serif|fashion|editorial/.test(`${policy} ${identity}`)) return "luxury-serif";
    if (/urban|hiphop/.test(`${policy} ${story} ${identity}`)) return "urban-heavy";
    if (/retro|throwback/.test(`${policy} ${story}`)) return "retro-display";
    if (/techno|industrial/.test(`${policy} ${story}`)) return "industrial-minimal";
    if (/edm|club|electric/.test(`${policy} ${story}`)) return "electric-display";
    if (/brunch|lifestyle|tropical/.test(`${story} ${identity}`)) return "condensed-editorial";
    return "condensed-editorial";
  }

  if (role === "accent") {
    if (/brunch|tropical|afro|latin|romantic|ladies/.test(`${story} ${identity}`)) return "organic-script";
    if (/techno|industrial/.test(`${story} ${identity}`)) return "industrial-minimal";
    if (/hiphop|urban/.test(`${story} ${identity}`)) return "urban-heavy";
    return "clean-grotesk";
  }

  if (role === "badge") {
    if (/retro/.test(story)) return "retro-display";
    return "geometric-modern";
  }

  return "clean-grotesk";
}
