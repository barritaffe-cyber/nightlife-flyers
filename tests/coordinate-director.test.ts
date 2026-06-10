import test from "node:test";
import assert from "node:assert/strict";

import {
  coordinatePlanToEditorPatch,
  createOptimizedCoordinatePlan,
} from "../lib/coordinateDirector.ts";

const baseInput = {
  flyerStyle: "red_only_center_hero" as const,
  subjectCrop: "three_quarter" as const,
  subjectOrientation: "front" as const,
  textPriority: {
    hero: "LADIES NIGHT",
    support: "Red Only",
    metadata: ["date", "artist", "footer"],
    suppressed: ["phone", "long promo"],
  },
  requiredTextZones: [
    "topPresenter",
    "ghostTitle",
    "scriptAccent",
    "heroTitle",
    "leftDate",
    "rightArtist",
    "bottomOffer",
    "bottomFooter",
    "fineprint",
  ] as const,
  overlapIntent: {
    ghostTitle: "behind_subject" as const,
    scriptAccent: "cross_torso" as const,
    heroTitle: "overlap_lower_body" as const,
  },
  negativeSpaceNeed: 0.7,
  subjectVisualPressure: 0.48,
  visiblePixelRatio: 0.34,
  candidateCount: 96,
};

test("coordinate director searches subject rectangles and returns the best visible rect", () => {
  const plan = createOptimizedCoordinatePlan(baseInput);

  assert.ok(plan.candidates.length > 1);
  assert.deepEqual(plan.subjectVisibleRect, plan.candidates[0].rect);
  assert.equal(plan.score.total, plan.candidates[0].score.total);
  assert.equal(plan.notes.some((note) => note.startsWith("Best subject rect:")), true);
});

test("coordinate director keeps protected footer and metadata zones available", () => {
  const plan = createOptimizedCoordinatePlan(baseInput);

  assert.ok(plan.zones.leftDate);
  assert.ok(plan.zones.rightArtist);
  assert.ok(plan.zones.bottomFooter);
  assert.ok(plan.zones.fineprint);
  assert.ok((plan.subjectVisibleRect.y + plan.subjectVisibleRect.height) < 90);
});

test("coordinate plan produces editor fields consumed by applyTemplate", () => {
  const plan = createOptimizedCoordinatePlan(baseInput);
  const patch = coordinatePlanToEditorPatch(plan);

  assert.equal(patch.headX, plan.zones.heroTitle?.x);
  assert.equal(patch.headY, plan.zones.heroTitle?.y);
  assert.equal(patch.textColWidth, plan.zones.heroTitle?.width);
  assert.equal(patch.head2X, plan.zones.ghostTitle?.x);
  assert.equal(patch.head2Y, plan.zones.ghostTitle?.y);
  assert.equal(patch.head2ColWidth, plan.zones.ghostTitle?.width);
  assert.equal(patch.detailsX, plan.zones.leftDate?.x);
  assert.equal(patch.details2Y, plan.zones.rightArtist?.y);
  assert.equal(patch.subtagY, plan.zones.scriptAccent?.y);
  assert.equal(patch.venueY, plan.zones.bottomFooter?.y);
});

test("orientation changes the searched subject coordinate result", () => {
  const front = createOptimizedCoordinatePlan(baseInput);
  const facingLeft = createOptimizedCoordinatePlan({
    ...baseInput,
    subjectOrientation: "facing_left",
  });

  assert.notEqual(front.subjectVisibleRect.x, facingLeft.subjectVisibleRect.x);
});
