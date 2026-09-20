import type { AvailableFontsInput, FontSupport } from "./types.ts";
import { inferFontCategory, inferFontTones, lookupKnownFont } from "./fontCatalog.ts";

export function normalizeAvailableFonts(input: AvailableFontsInput): FontSupport[] {
  const normalized = input.fonts.map((inputFont) => {
    const inputFamily = typeof inputFont === "string" ? inputFont : inputFont.family;
    const font = inputFamily.trim().toLowerCase() === "inter"
      ? "LEMONMILK-Regular"
      : inputFont;
    if (typeof font === "string") {
      const known = lookupKnownFont(font);
      if (known) return { ...known, available: true };
      const category = inferFontCategory(font);
      return {
        family: font,
        category,
        tones: inferFontTones(category),
        weights: [400, 500, 600, 700],
        italic: false,
        condensed: category === "display-condensed",
        wide: category === "display-wide",
        xHeight: "medium",
        contrast: category === "serif-display" ? "high" : "low",
        source: "unknown",
        available: true,
      } satisfies FontSupport;
    }

    const known = lookupKnownFont(font.family);
    const category = font.category ?? known?.category ?? inferFontCategory(font.family);
    return {
      family: font.family,
      category,
      tones: font.tones ?? known?.tones ?? inferFontTones(category),
      weights: font.weights ?? known?.weights ?? [400, 500, 600, 700],
      italic: font.italic ?? known?.italic ?? false,
      condensed: font.condensed ?? known?.condensed ?? category === "display-condensed",
      wide: font.wide ?? known?.wide ?? category === "display-wide",
      xHeight: font.xHeight ?? known?.xHeight ?? "medium",
      contrast: font.contrast ?? known?.contrast ?? (category === "serif-display" ? "high" : "low"),
      source: font.source ?? known?.source ?? "unknown",
      available: font.available ?? true,
    } satisfies FontSupport;
  });

  return dedupe(
    normalized.filter(
      (font) => font.available && font.family.trim().toLowerCase() !== "inter"
    )
  );
}

function dedupe(fonts: FontSupport[]): FontSupport[] {
  const seen = new Set<string>();
  return fonts.filter((font) => {
    const key = font.family.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
