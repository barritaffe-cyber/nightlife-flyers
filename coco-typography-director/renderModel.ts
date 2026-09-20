import type {
  TypographyRenderModel,
  TypographySystem,
} from "./types.ts";

export function buildTypographyRenderModel(system: TypographySystem): TypographyRenderModel {
  const roles = [
    system.headline,
    system.accent,
    system.metadata,
    system.dateTime,
    system.venue,
    system.badge,
    system.presenter,
    system.footer,
  ].filter(Boolean);

  return {
    id: `render:${system.id}`,
    roles: roles as TypographyRenderModel["roles"],
    fontFamilies: system.fontFamilies,
    maxFontFamilies: system.maxFontFamilies,
  };
}
