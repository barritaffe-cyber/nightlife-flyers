import test from "node:test";
import assert from "node:assert/strict";

import {
  CENTER_REFERENCE_LAYOUTS,
  chooseCenterReferenceLayout,
} from "../components/coco/referenceLayouts/centerReferenceLayouts.ts";

const copy = {
  headline: "JUNGLE BRUNCH",
  accent: "SATURDAY",
  presenter: "PRESENTS",
  details: "DJS AND SPECIAL GUESTS",
  date: "MARCH 11",
  price: "FREE ENTRY",
  venue: "CLUB ADDRESS",
  compliance: "18+",
};

test("center reference library indexes all seven supplied flyers", () => {
  assert.equal(CENTER_REFERENCE_LAYOUTS.length, 7);
  assert.equal(
    CENTER_REFERENCE_LAYOUTS.filter((layout) => layout.requiresOcclusion).length,
    2
  );
});

test("center reference selection returns one coherent safe layout and font profile", () => {
  const result = chooseCenterReferenceLayout({
    cells: [],
    canvasAspectRatio: 0.8,
    faceRect: { x: 34, y: 13, width: 32, height: 24 },
    copyTextByRole: copy,
  });

  assert.ok(result);
  assert.equal(result.layout.requiresOcclusion, undefined);
  assert.equal(result.layout.id, "center-05-stacked-block-title");
  assert.equal(result.candidates.length, 8);
  assert.ok(result.candidates.every((candidate) =>
    candidate.referenceLayoutId === result.layout.id
  ));
  assert.equal(
    result.candidates.find((candidate) => candidate.role === "headline")?.referenceFontFamily,
    "Anton"
  );
});

test("long headlines avoid script-led center references", () => {
  const result = chooseCenterReferenceLayout({
    cells: [],
    canvasAspectRatio: 0.75,
    faceRect: { x: 38, y: 14, width: 24, height: 23 },
    copyTextByRole: {
      ...copy,
      headline: "THE OFFICIAL SUMMER THURSDAY EXPERIENCE",
    },
  });

  assert.ok(result);
  assert.notEqual(result.layout.headlineKind, "script");
});
