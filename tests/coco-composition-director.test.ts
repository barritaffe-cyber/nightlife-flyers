import assert from "node:assert/strict";
import test from "node:test";

import { directCocoComposition } from "../coco-composition-director/director.ts";
import { FAMILY_PRESETS } from "../coco-composition-director/families.ts";
import { MOJITO_COMPOSITION_FIXTURE } from "../coco-composition-director/fixtures.ts";
import { getFashionClubVerticalFormatRecipe } from "../lib/recipes/fashionClubVertical.ts";

test("split editorial owns a narrow left text panel in both formats", () => {
  const split = FAMILY_PRESETS["split-editorial"];

  assert.deepEqual(split.squareColumn, { x: 6, y: 10, width: 46, height: 80 });
  assert.deepEqual(split.storyColumn, { x: 6, y: 9, width: 46, height: 80 });
});

test("a preferred split editorial family survives right-face direction", () => {
  const input = structuredClone(MOJITO_COMPOSITION_FIXTURE);
  input.preferredFamily = "split-editorial";
  input.creativeDirection.composition.family = "split-editorial";

  const result = directCocoComposition(input);
  const splitCandidates = result.candidates.filter(
    (candidate) => candidate.family === "split-editorial"
  );

  assert.ok(splitCandidates.length > 0);
  assert.ok(result.finalists.some((candidate) => candidate.family === "split-editorial"));
  assert.ok(
    splitCandidates.some(
      (candidate) =>
        !candidate.score.hasCriticalProtectionViolation &&
        !candidate.score.hasBlockOverlap
    )
  );
});

test("fashion club vertical keeps its full-bleed rail family in the tournament", () => {
  const preset = FAMILY_PRESETS["fashion-club-vertical"];
  assert.deepEqual(
    preset.squareColumn,
    getFashionClubVerticalFormatRecipe("square").textColumn
  );
  assert.deepEqual(
    preset.storyColumn,
    getFashionClubVerticalFormatRecipe("story").textColumn
  );
  assert.equal(preset.align, "right");

  const input = structuredClone(MOJITO_COMPOSITION_FIXTURE);
  input.preferredFamily = "fashion-club-vertical";
  input.creativeDirection.composition.family = "full-bleed-type";
  input.creativeDirection.composition.typeField = "right";
  input.creativeDirection.composition.alignment = "right";
  input.creativeDirection.composition.stackRect = preset.squareColumn;
  if (input.subject) {
    input.subject.faceRect = { x: 12, y: 14, width: 28, height: 32 };
    input.subject.rect = { x: 0, y: 0, width: 58, height: 100 };
    input.subject.visibleRect = { x: 0, y: 0, width: 58, height: 100 };
    input.subject.side = "left";
  }
  input.scene.protectionZones = [
    {
      target: "face",
      rect: { x: 12, y: 14, width: 28, height: 32 },
      importance: "critical",
      allowOverlapRatio: 0,
    },
  ];

  const result = directCocoComposition(input);
  assert.ok(
    result.candidates.some((candidate) => candidate.family === "fashion-club-vertical")
  );
});
