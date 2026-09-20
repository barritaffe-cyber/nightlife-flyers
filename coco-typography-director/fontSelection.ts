import type {
  FontSupport,
  TypographyPersonality,
  TypographyRole,
  TypographyDirectorInput,
} from "./types.ts";
import { clamp } from "./utils.ts";

export type FontChoice = {
  font: FontSupport;
  score: number;
  reason: string[];
};

export function rankFontsForRole(
  fonts: FontSupport[],
  role: TypographyRole,
  personality: TypographyPersonality,
  input: TypographyDirectorInput
): FontChoice[] {
  const forbidden = new Set((input.userPreferences?.forbiddenFonts ?? []).map((value) => value.toLowerCase()));
  const strictRolePools =
    (input.availableFonts.fallbackFamilies?.headline?.length ?? 0) >= 4 &&
    (input.availableFonts.fallbackFamilies?.footer?.length ?? 0) >= 2;
  const roleFamilies = new Set(
    (strictRolePools ? input.availableFonts.fallbackFamilies?.[role] ?? [] : [])
      .map((value) => value.toLowerCase())
  );
  const preferences =
    role === "headline" ? input.userPreferences?.preferredHeadlineFonts :
    role === "accent" ? input.userPreferences?.preferredAccentFonts :
    input.userPreferences?.preferredBodyFonts;

  const permitted = fonts.filter((font) =>
    !forbidden.has(font.family.toLowerCase()) &&
    (!roleFamilies.size || roleFamilies.has(font.family.toLowerCase()))
  );
  // Role pools are authoritative when supplied. Retain the broader list only
  // as a defensive fallback for imported/legacy projects with an empty pool.
  const roleFonts = permitted.length
    ? permitted
    : fonts.filter((font) => !forbidden.has(font.family.toLowerCase()));

  return roleFonts
    .map((font) => scoreFont(font, role, personality, preferences ?? []))
    .sort((a, b) => b.score - a.score);
}

function scoreFont(
  font: FontSupport,
  role: TypographyRole,
  personality: TypographyPersonality,
  preferences: string[]
): FontChoice {
  let score = 45;
  const reason: string[] = [];

  const targetCategories = categoriesForPersonality(personality);
  if (targetCategories.includes(font.category)) {
    score += 28;
    reason.push(`Category ${font.category} matches ${personality}.`);
  } else if (compatibleCategory(font.category, personality)) {
    score += 12;
    reason.push(`Category ${font.category} is compatible with ${personality}.`);
  } else {
    score -= 10;
  }

  const targetTones = tonesForPersonality(personality);
  const toneMatches = font.tones.filter((tone) => targetTones.includes(tone)).length;
  score += toneMatches * 7;
  if (toneMatches) reason.push(`Tone match: ${font.tones.filter((tone) => targetTones.includes(tone)).join(", ")}.`);

  if (role === "headline") {
    if (font.condensed) score += 8;
    if (font.weights.some((weight) => weight >= 700)) score += 7;
    if (font.category === "script") score -= 28;
    if (font.category === "decorative") score -= 10;
  }

  if (role === "accent") {
    if (personality === "organic-script" && font.category === "script") score += 18;
    if (font.category === "decorative") score -= 6;
  }

  if (["metadata", "dateTime", "venue", "presenter", "footer"].includes(role)) {
    if (["grotesk", "sans", "geometric"].includes(font.category)) score += 15;
    if (font.xHeight === "high") score += 8;
    if (font.category === "script" || font.category === "decorative" || font.category === "retro") score -= 35;
    const family = font.family.toLowerCase();
    const boldBody = /(bold|medium|heavy)|^bebas neue$|coolvetica rg cond/.test(family);
    const regularBody = /(regular|light)|bebasneue-regular/.test(family);
    if (role === "metadata" || role === "dateTime" || role === "presenter") {
      if (boldBody) score += 18;
      if (regularBody) score -= 7;
    } else if (role === "footer" || role === "venue") {
      if (regularBody) score += 18;
      if (boldBody) score -= 7;
    }
  }

  if (role === "badge") {
    if (["geometric", "grotesk", "display-wide"].includes(font.category)) score += 10;
  }

  if (preferences.some((family) => family.toLowerCase() === font.family.toLowerCase())) {
    score += 18;
    reason.push("User preferred font.");
  }

  if (font.source === "custom") score += 3;
  if (font.available) score += 2;

  return {
    font,
    score: clamp(score),
    reason,
  };
}

function categoriesForPersonality(personality: TypographyPersonality): FontSupport["category"][] {
  const map: Record<TypographyPersonality, FontSupport["category"][]> = {
    "condensed-editorial": ["display-condensed"],
    "luxury-serif": ["serif-display"],
    "clean-grotesk": ["grotesk", "sans"],
    "organic-script": ["script"],
    "humanist-lifestyle": ["sans", "grotesk"],
    "urban-heavy": ["display-wide", "decorative", "display-condensed"],
    "retro-display": ["retro", "serif-display", "display-wide"],
    "industrial-minimal": ["monospace", "display-condensed", "grotesk"],
    "electric-display": ["display-wide", "display-condensed", "geometric"],
    "fashion-serif": ["serif-display"],
    "geometric-modern": ["geometric"],
    "classic-sans": ["sans", "grotesk"],
  };
  return map[personality];
}

function tonesForPersonality(personality: TypographyPersonality): FontSupport["tones"] {
  const map: Record<TypographyPersonality, FontSupport["tones"]> = {
    "condensed-editorial": ["editorial", "clean"],
    "luxury-serif": ["luxury", "editorial", "romantic"],
    "clean-grotesk": ["clean", "editorial", "general"],
    "organic-script": ["playful", "romantic"],
    "humanist-lifestyle": ["clean", "playful"],
    "urban-heavy": ["urban", "energetic"],
    "retro-display": ["retro", "playful"],
    "industrial-minimal": ["industrial", "clean"],
    "electric-display": ["energetic", "industrial"],
    "fashion-serif": ["luxury", "editorial"],
    "geometric-modern": ["clean", "editorial"],
    "classic-sans": ["clean", "general"],
  };
  return map[personality];
}

function compatibleCategory(category: FontSupport["category"], personality: TypographyPersonality): boolean {
  if (personality === "condensed-editorial" && category === "grotesk") return true;
  if (personality === "luxury-serif" && category === "serif-display") return true;
  if (personality === "clean-grotesk" && category === "geometric") return true;
  if (personality === "industrial-minimal" && category === "monospace") return true;
  if (personality === "humanist-lifestyle" && category === "geometric") return true;
  return false;
}
