import assert from "node:assert/strict";
import test from "node:test";

import { directCocoColor, type ColorDirectorResult } from "../coco-color-director/index.ts";
import { MOJITO_COLOR_FIXTURE } from "../coco-color-director/fixtures.ts";
import {
  campaignPalettesByFormat,
  createCocoColorSelection,
  deserializeCocoColorSelection,
  nextCocoColorSelection,
  orderedCampaignPaletteCandidates,
  selectedCampaignPalette,
  serializeCocoColorSelection,
} from "../components/coco/palette/index.ts";

const directorResult = () => directCocoColor(MOJITO_COLOR_FIXTURE);

test("campaign palette selection wraps deterministically after ten clicks", () => {
  const initial = createCocoColorSelection(directorResult(), "brief:mojito:v1");
  let selection = initial;
  for (let click = 0; click < 10; click += 1) {
    selection = nextCocoColorSelection(selection);
  }

  const expectedIndex = 10 % initial.candidates.length;
  assert.equal(selection.selectedIndex, expectedIndex);
  assert.equal(selection.selectedId, initial.candidates[expectedIndex].id);
});

test("candidate order and IDs stay stable while duplicate palettes are removed", () => {
  const result = directorResult();
  const duplicate = {
    ...result.candidates[1],
    id: "duplicate-visual-system",
    roles: result.candidates[1].roles.map((role) => ({ ...role })),
  };
  const first: ColorDirectorResult = {
    ...result,
    candidates: [duplicate, ...result.candidates].reverse(),
    finalists: [...result.finalists].reverse(),
  };
  const second: ColorDirectorResult = {
    ...result,
    candidates: [...result.candidates, duplicate],
  };

  const firstCandidates = orderedCampaignPaletteCandidates(first);
  const secondCandidates = orderedCampaignPaletteCandidates(second);
  assert.deepEqual(
    firstCandidates.map((candidate) => candidate.id),
    secondCandidates.map((candidate) => candidate.id)
  );
  assert.equal(
    firstCandidates.filter((candidate) => candidate.id === "duplicate-visual-system").length,
    0
  );
  assert.equal(new Set(firstCandidates.map((candidate) => candidate.id)).size, firstCandidates.length);
});

test("campaign selection is serializable with selected ID, index, and input hash", () => {
  const initial = createCocoColorSelection(directorResult(), "brief:mojito:v1");
  const selected = nextCocoColorSelection(nextCocoColorSelection(initial));
  const restored = deserializeCocoColorSelection(serializeCocoColorSelection(selected));

  assert.deepEqual(restored, selected);
  assert.equal(restored?.inputHash, "brief:mojito:v1");
  assert.equal(restored?.selectedIndex, 2 % initial.candidates.length);
  assert.equal(restored?.selectedId, selectedCampaignPalette(selected).id);
});

test("square and story receive one campaign palette", () => {
  const selection = nextCocoColorSelection(
    createCocoColorSelection(directorResult(), "brief:mojito:v1")
  );
  const formats = campaignPalettesByFormat(selection);

  assert.deepEqual(formats.square, formats.story);
  assert.notEqual(formats.square, formats.story);
  assert.equal(formats.square.bgFrom, selectedCampaignPalette(selection).roles.background);
  assert.equal(formats.square.secondary, selectedCampaignPalette(selection).roles.background);
  assert.equal(formats.square.accent, selectedCampaignPalette(selection).roles.accent);
  assert.equal(formats.square.neutral, selectedCampaignPalette(selection).roles.metadata);
});
