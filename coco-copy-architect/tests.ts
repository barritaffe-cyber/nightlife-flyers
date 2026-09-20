import { architectCocoCopy } from "./director.ts";
import { buildCopyRenderModel } from "./renderModel.ts";
import { validateRenderedCopy } from "./compliance.ts";
import { MOJITO_COPY_FIXTURE, TECHNO_COPY_FIXTURE } from "./fixtures.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Assertion failed: ${message}`);
}

export function runCopyArchitectTests() {
  const mojito = architectCocoCopy(MOJITO_COPY_FIXTURE);

  assert(
    ["identity-emotion-metadata-logistics", "identity-experience-logistics", "minimal-editorial"].includes(mojito.winner.pattern),
    "Mojito should use a lifestyle/editorial architecture."
  );
  assert(mojito.winner.groups.some((group) => group.role === "identity" && group.treatment === "hero"), "Identity must be hero.");
  assert(mojito.winner.groups.some((group) => group.role === "experience" && group.treatment === "metadata"), "Experience must become metadata.");
  assert(mojito.winner.groups.find((group) => group.role === "experience")?.text.includes("AFROBEATS"), "Music facts should be retained.");
  assert(mojito.winner.groups.find((group) => group.role === "logistics")?.text.includes("MONDAY"), "Date should be retained.");

  const model = buildCopyRenderModel(mojito.winner);
  assert(model.items.length > 0, "Render model should contain items.");

  const snapshot = {
    renderedSources: model.owns,
    renderedTexts: model.items.map((item) => item.text),
    roleLineCounts: Object.fromEntries(model.items.map((item) => [item.role, item.text.split("\n").length])),
    rolePowerRatios: Object.fromEntries(model.items.map((item) => [item.role, item.powerRatio])),
    visibleGroups: model.items.length,
    duplicateTexts: [],
    previewExportMatch: true,
  };

  const compliance = validateRenderedCopy(mojito.winner, snapshot);
  assert(compliance.pass, `Mojito render should pass: ${compliance.blockers.join(", ")}`);

  const techno = architectCocoCopy(TECHNO_COPY_FIXTURE);
  assert(techno.winner.groups.some((group) => group.role === "music"), "Techno should use music copy.");

  return {
    mojito: {
      winner: mojito.winner.id,
      pattern: mojito.winner.pattern,
      total: mojito.winner.score.total,
      groups: mojito.winner.groups.map((group) => ({
        role: group.role,
        treatment: group.treatment,
        text: group.text,
      })),
    },
    techno: {
      winner: techno.winner.id,
      pattern: techno.winner.pattern,
      total: techno.winner.score.total,
    },
  };
}
