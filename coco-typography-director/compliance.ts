import type {
  RenderedTypographySnapshot,
  TypographyComplianceResult,
  TypographySystem,
} from "./types.ts";

export function validateRenderedTypography(
  system: TypographySystem,
  snapshot: RenderedTypographySnapshot
): TypographyComplianceResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const requiredRoles = [
    system.headline,
    system.accent,
    system.metadata,
    system.dateTime,
    system.venue,
    system.badge,
    system.presenter,
    system.footer,
  ].filter(Boolean).map((layer) => layer!.role);

  for (const role of requiredRoles) {
    if (!snapshot.renderedRoles.includes(role)) {
      blockers.push(`Required role ${role} was not rendered.`);
    }
  }

  if (new Set(snapshot.fontFamilies).size > system.maxFontFamilies) {
    blockers.push("Rendered typography exceeds maxFontFamilies.");
  }

  const headlinePower = snapshot.roleVisualPowers.headline ?? 0;
  if (headlinePower <= 0) blockers.push("Headline visual power is missing.");

  checkPower("accent", system.hierarchy.accentMaxRatio);
  checkPower("metadata", system.hierarchy.bodyMaxRatio);
  checkPower("dateTime", system.hierarchy.dateMaxRatio);
  checkPower("venue", system.hierarchy.venueMaxRatio);
  checkPower("badge", system.hierarchy.badgeMaxRatio);
  checkPower("presenter", system.hierarchy.presenterMaxRatio);

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
    const role = layer!.role;
    const renderedFont = snapshot.roleFontFamilies[role];
    if (renderedFont && renderedFont !== layer!.fontFamily) {
      warnings.push(`${role} rendered with ${renderedFont} instead of ${layer!.fontFamily}.`);
    }

    const lines = snapshot.roleLineCounts[role] ?? 0;
    if (lines > layer!.maxLines) blockers.push(`${role} exceeds its line limit.`);

    const effects = snapshot.effects[role];
    if (effects) {
      if (effects.glow > layer!.effects.glow * 1.2 + 0.01) warnings.push(`${role} glow exceeds contract.`);
      if (effects.blur > layer!.effects.blur * 1.2 + 0.01) warnings.push(`${role} blur exceeds contract.`);
      if (effects.stroke > layer!.effects.stroke * 1.2 + 0.01) warnings.push(`${role} stroke exceeds contract.`);
    }
  }

  if (!snapshot.previewExportMatch) blockers.push("Preview and export typography do not match.");

  return {
    pass: blockers.length === 0,
    blockers,
    warnings,
    score: Math.max(0, 100 - blockers.length * 22 - warnings.length * 6),
  };

  function checkPower(role: keyof typeof snapshot.roleVisualPowers, ratio: number) {
    const power = snapshot.roleVisualPowers[role] ?? 0;
    if (headlinePower > 0 && power > headlinePower * ratio * 1.08) {
      blockers.push(`${role} exceeds its hierarchy cap.`);
    }
  }
}
