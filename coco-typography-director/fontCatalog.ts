import type { FontCategory, FontSupport, FontTone } from "./types.ts";

type CatalogEntry = Omit<FontSupport, "available">;

const KNOWN_FONTS: CatalogEntry[] = [
  entry("Anton", "display-condensed", ["energetic", "urban"], [400], false, true, false, "medium", "low", "google"),
  entry("Bebas Neue", "display-condensed", ["editorial", "energetic", "clean"], [400], false, true, false, "medium", "low", "google"),
  entry("Oswald", "display-condensed", ["editorial", "clean", "industrial"], [300,400,500,600,700], false, true, false, "medium", "low", "google"),
  entry("League Gothic", "display-condensed", ["editorial", "retro"], [400], false, true, false, "medium", "low", "google"),
  entry("Roboto Condensed", "display-condensed", ["clean", "general"], [300,400,500,600,700], false, true, false, "high", "low", "google"),
  entry("Archivo Narrow", "display-condensed", ["clean", "editorial"], [400,500,600,700], false, true, false, "high", "low", "google"),
  entry("Playfair Display", "serif-display", ["luxury", "editorial", "romantic"], [400,500,600,700,800,900], true, false, false, "medium", "high", "google"),
  entry("Cormorant Garamond", "serif-display", ["luxury", "editorial", "romantic"], [300,400,500,600,700], true, false, false, "low", "high", "google"),
  entry("Bodoni Moda", "serif-display", ["luxury", "editorial"], [400,500,600,700,800,900], true, false, false, "low", "high", "google"),
  entry("DM Serif Display", "serif-display", ["luxury", "editorial"], [400], true, false, false, "medium", "high", "google"),
  entry("Libre Baskerville", "serif-display", ["luxury", "editorial"], [400,700], true, false, false, "medium", "medium", "google"),
  entry("LEMONMILK-Regular", "geometric", ["clean", "editorial", "luxury"], [400], false, false, false, "high", "low", "custom"),
  entry("LEMONMILK-Light", "geometric", ["clean", "editorial", "luxury"], [300], false, false, false, "high", "low", "custom"),
  entry("LEMONMILK-Medium", "geometric", ["clean", "editorial", "luxury"], [500], false, false, false, "high", "low", "custom"),
  entry("LEMONMILK-Bold", "display-wide", ["clean", "editorial", "luxury"], [700], false, false, true, "medium", "low", "custom"),
  entry("Manrope", "geometric", ["clean", "editorial", "general"], [200,300,400,500,600,700,800], false, false, false, "high", "low", "google"),
  entry("Montserrat", "geometric", ["clean", "editorial", "general"], [100,200,300,400,500,600,700,800,900], true, false, false, "high", "low", "google"),
  entry("Poppins", "geometric", ["clean", "playful", "general"], [100,200,300,400,500,600,700,800,900], true, false, false, "high", "low", "google"),
  entry("Helvetica Neue", "grotesk", ["clean", "editorial", "general"], [300,400,500,600,700], true, false, false, "high", "low", "system"),
  entry("Arial", "sans", ["clean", "general"], [400,700], true, false, false, "high", "low", "system"),
  entry("Avenir Next", "geometric", ["clean", "editorial", "luxury"], [400,500,600,700], true, false, false, "high", "low", "system"),
  entry("Futura", "geometric", ["editorial", "retro", "clean"], [400,500,700], false, false, false, "medium", "low", "system"),
  entry("Open Sans", "sans", ["clean", "general"], [300,400,500,600,700,800], true, false, false, "high", "low", "google"),
  entry("Source Sans 3", "sans", ["clean", "editorial", "general"], [200,300,400,500,600,700,800,900], true, false, false, "high", "low", "google"),
  entry("Dancing Script", "script", ["playful", "romantic"], [400,500,600,700], false, false, false, "medium", "medium", "google"),
  entry("Great Vibes", "script", ["luxury", "romantic"], [400], false, false, false, "low", "high", "google"),
  entry("Pacifico", "script", ["playful", "retro"], [400], false, false, false, "medium", "medium", "google"),
  entry("Satisfy", "script", ["playful", "romantic"], [400], false, false, false, "medium", "medium", "google"),
  entry("Permanent Marker", "script", ["urban", "energetic"], [400], false, false, false, "medium", "low", "google"),
  entry("Bungee", "display-wide", ["urban", "retro", "energetic"], [400], false, false, true, "medium", "low", "google"),
  entry("Lovelo Black", "display-wide", ["retro", "energetic", "editorial"], [900], false, false, true, "medium", "low", "custom"),
  entry("Metropolis 1920", "retro", ["retro", "luxury", "editorial"], [400], false, false, true, "medium", "medium", "custom"),
  entry("Black Ops One", "decorative", ["urban", "industrial"], [400], false, false, true, "medium", "low", "google"),
  entry("Orbitron", "display-wide", ["industrial", "energetic"], [400,500,600,700,800,900], false, false, true, "medium", "low", "google"),
  entry("Rajdhani", "display-condensed", ["industrial", "clean"], [300,400,500,600,700], false, true, false, "high", "low", "google"),
  entry("Space Grotesk", "grotesk", ["clean", "industrial", "editorial"], [300,400,500,600,700], false, false, false, "high", "low", "google"),
  entry("IBM Plex Mono", "monospace", ["industrial", "clean"], [100,200,300,400,500,600,700], true, false, false, "high", "low", "google"),
  entry("Cinzel", "serif-display", ["luxury", "editorial"], [400,500,600,700,800,900], false, false, false, "medium", "medium", "google"),
  entry("Abril Fatface", "serif-display", ["editorial", "retro", "luxury"], [400], false, false, true, "low", "high", "google"),
];

export function lookupKnownFont(family: string): CatalogEntry | null {
  const normalized = family.trim().toLowerCase();
  return KNOWN_FONTS.find((font) => font.family.toLowerCase() === normalized) ?? null;
}

export function inferFontCategory(family: string): FontCategory {
  const lower = family.toLowerCase();
  if (/script|brush|hand|signature|cursive/.test(lower)) return "script";
  if (/serif|bodoni|didot|baskerville|garamond|playfair|cinzel/.test(lower)) return "serif-display";
  if (/condensed|narrow|gothic|bebas|anton|oswald|rajdhani/.test(lower)) return "display-condensed";
  if (/mono|code/.test(lower)) return "monospace";
  if (/retro|disco|groovy/.test(lower)) return "retro";
  if (/display|black|heavy|impact|bungee/.test(lower)) return "display-wide";
  if (/helvetica|arial|grotesk|sans/.test(lower)) return "grotesk";
  if (/futura|poppins|montserrat|geometric|avenir/.test(lower)) return "geometric";
  return "unknown";
}

export function inferFontTones(category: FontCategory): FontTone[] {
  if (category === "script") return ["playful", "romantic"];
  if (category === "serif-display") return ["luxury", "editorial"];
  if (category === "display-condensed") return ["editorial", "energetic"];
  if (category === "retro") return ["retro", "playful"];
  if (category === "monospace") return ["industrial", "clean"];
  if (category === "decorative") return ["urban", "energetic"];
  return ["clean", "general"];
}

function entry(
  family: string,
  category: FontCategory,
  tones: FontTone[],
  weights: number[],
  italic: boolean,
  condensed: boolean,
  wide: boolean,
  xHeight: FontSupport["xHeight"],
  contrast: FontSupport["contrast"],
  source: FontSupport["source"]
): CatalogEntry {
  return { family, category, tones, weights, italic, condensed, wide, xHeight, contrast, source };
}
