import { directCocoTypography } from "./director.ts";
import { buildTypographyRenderModel } from "./renderModel.ts";
import { validateRenderedTypography } from "./compliance.ts";
import { MOJITO_TYPOGRAPHY_FIXTURE, TECHNO_TYPOGRAPHY_FIXTURE } from "./fixtures.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Assertion failed: ${message}`);
}

export function runTypographyDirectorTests() {
  const mojito = directCocoTypography(MOJITO_TYPOGRAPHY_FIXTURE);

  assert(mojito.winner.headline.visualPower === 100, "Headline power should be 100.");
  assert(mojito.winner.accent, "Mojito should have an accent.");
  assert(mojito.winner.accent!.visualPower <= 42, "Accent should remain subordinate.");
  assert(mojito.winner.metadata, "Mojito should have metadata.");
  assert(mojito.winner.metadata!.visualPower <= 25, "Metadata should remain quiet.");
  assert(mojito.winner.fontFamilies.length <= 2, "Mojito should use at most two font families.");
  assert(mojito.winner.signatureMove?.id === "script-cross", "Mojito should use script-cross.");

  const model = buildTypographyRenderModel(mojito.winner);
  const compliance = validateRenderedTypography(mojito.winner, {
    renderedRoles: model.roles.map((role) => role.role),
    fontFamilies: model.fontFamilies,
    roleVisualPowers: Object.fromEntries(model.roles.map((role) => [role.role, role.visualPower])),
    roleLineCounts: Object.fromEntries(model.roles.map((role) => [role.role, role.text.split("\n").length])),
    roleFontFamilies: Object.fromEntries(model.roles.map((role) => [role.role, role.fontFamily])),
    effects: Object.fromEntries(model.roles.map((role) => [role.role, role.effects])),
    previewExportMatch: true,
  });
  assert(compliance.pass, `Mojito typography render should pass: ${compliance.blockers.join(", ")}`);

  const techno = directCocoTypography(TECHNO_TYPOGRAPHY_FIXTURE);
  assert(["industrial-minimal", "electric-display", "condensed-editorial"].includes(techno.winner.headline.personality), "Techno headline personality should fit.");
  assert(techno.winner.signatureMove?.id === "single-electric-glow", "Techno should use electric glow.");

  return {
    mojito: {
      winner: mojito.winner.id,
      headline: mojito.winner.headline.fontFamily,
      accent: mojito.winner.accent?.fontFamily,
      body: mojito.winner.metadata?.fontFamily,
      score: mojito.winner.score.total,
    },
    techno: {
      winner: techno.winner.id,
      headline: techno.winner.headline.fontFamily,
      score: techno.winner.score.total,
    },
  };
}
