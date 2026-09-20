import type {
  TypographyDirectorInput,
  TypographySystem,
} from "./types.ts";

export function validateTypographyDirectorInput(input: TypographyDirectorInput): string[] {
  const errors: string[] = [];
  if (!input.copyArchitecture) errors.push("copyArchitecture is required.");
  if (!input.copyArchitecture?.groups?.length) errors.push("copyArchitecture.groups cannot be empty.");
  if (!input.availableFonts) errors.push("availableFonts is required.");
  if (!input.availableFonts?.fonts?.length) errors.push("availableFonts.fonts cannot be empty.");
  return errors;
}

export function validateTypographySystem(system: TypographySystem): string[] {
  const errors: string[] = [];

  if (!system.id) errors.push("system.id is required.");
  if (!system.headline) errors.push("headline is required.");
  if (!system.headline.fontFamily) errors.push("headline fontFamily is required.");
  if (system.fontFamilies.length > system.maxFontFamilies) errors.push("Too many font families.");
  if (system.hierarchy.accentMaxRatio >= 0.6) errors.push("accentMaxRatio is too high.");
  if (system.hierarchy.bodyMaxRatio >= 0.45) errors.push("bodyMaxRatio is too high.");

  for (const layer of [
    system.headline,
    system.accent,
    system.metadata,
    system.dateTime,
    system.venue,
    system.badge,
    system.presenter,
    system.footer,
  ].filter(Boolean)) {
    if (!layer!.text.trim()) errors.push(`${layer!.role} has no text.`);
    if (layer!.sizeScale <= 0) errors.push(`${layer!.role} sizeScale is invalid.`);
    if (layer!.visualPower < 0) errors.push(`${layer!.role} visualPower is invalid.`);
    if (layer!.maxLines < 1) errors.push(`${layer!.role} maxLines is invalid.`);
  }

  return errors;
}
