import assert from "node:assert/strict";
import test from "node:test";

import { buildBaseComposition } from "../coco-composition-director/blockBuilder.ts";
import { MOJITO_COMPOSITION_FIXTURE } from "../coco-composition-director/fixtures.ts";
import { overlapRatio } from "../coco-composition-director/geometry.ts";
import type { CompositionDirectorInput } from "../coco-composition-director/types.ts";
import { getFashionClubVerticalFormatRecipe } from "../lib/recipes/fashionClubVertical.ts";

const buildInput = (format: "square" | "story"): CompositionDirectorInput => {
  const input = structuredClone(MOJITO_COMPOSITION_FIXTURE);
  input.format = format;
  input.preferredFamily = "fashion-club-vertical";
  // The reference recipe must remain authored even if an upstream scene
  // suggestion arrives with a different generic stack rectangle/alignment.
  input.creativeDirection.composition.family = "fashion-club-vertical";
  input.creativeDirection.composition.typeField = "left";
  input.creativeDirection.composition.alignment = "left";
  input.creativeDirection.composition.stackRect = { x: 6, y: 12, width: 32, height: 40 };
  input.creativeDirection.composition.overlapPolicy = "controlled";
  input.creativeDirection.signatureMove.move = "vertical-type-rail";
  input.text = {
    headline: "FRIDAY FEVER",
    presenter: "CLUB 007",
    details: "MUSIC POLICY",
    details2: "DJ YINGKID\nEAZI\nV.O.G\nSINGAPORE",
    date: "FRI.\n3RD\nJULY",
    time: "10PM",
    subtag: "DOORS OPEN • 10PM",
    venue: "CLUB 007",
    price: "VIP $50",
    footer: "FOR RESERVATION CALL 07032213939",
    compliance: "MAXIMUM SECURITY GUARANTEED",
  };
  input.subject = {
    rect: { x: 0, y: 0, width: 58, height: 100 },
    visibleRect: { x: 0, y: 0, width: 58, height: 100 },
    faceRect: { x: 10, y: 10, width: 28, height: 32 },
    side: "left",
    crop: "close",
    saliency: 0.95,
    visualMass: 0.88,
  };
  input.scene.protectionZones = [{
    target: "face",
    rect: { x: 10, y: 10, width: 28, height: 32 },
    importance: "critical",
    allowOverlapRatio: 0,
  }];
  return input;
};

const blockRects = (input: CompositionDirectorInput) => {
  const composition = buildBaseComposition(
    input,
    "fashion-club-vertical",
    `fashion-club-${input.format}`
  );
  return {
    composition,
    rects: Object.fromEntries(composition.blocks.map((block) => [block.id, block.rect])),
  };
};

test("fashion club Story uses the authored twin-rail and structured-footer geometry", () => {
  const { composition, rects } = blockRects(buildInput("story"));
  const recipe = getFashionClubVerticalFormatRecipe("story");

  assert.equal(composition.alignment, "right");
  assert.equal(composition.typeField, "right");
  assert.deepEqual(composition.textColumn, recipe.textColumn);
  assert.deepEqual(rects["block-identity"], recipe.zones.headlinePrimary);
  assert.deepEqual(rects["block-identity-secondary"], recipe.zones.headlineSecondary);
  assert.deepEqual(rects["block-primaryMeta"], recipe.zones.primaryMeta);
  assert.deepEqual(rects["block-secondaryMeta"], recipe.zones.talentPolicy);
  assert.deepEqual(rects["block-dateTime"], recipe.zones.date);
  assert.deepEqual(rects["block-footer-doors"], recipe.zones.doors);
  assert.deepEqual(rects["block-venue"], recipe.zones.venue);
  assert.deepEqual(rects["block-badge"], recipe.zones.optionalBadge);
  assert.deepEqual(rects["block-footer-reservation"], recipe.zones.reservation);
  assert.deepEqual(rects["block-footer-compliance"], recipe.zones.compliance);
});

test("fashion club Square preserves the campaign grammar with format-specific spacing", () => {
  const { composition, rects } = blockRects(buildInput("square"));
  const recipe = getFashionClubVerticalFormatRecipe("square");

  assert.deepEqual(composition.textColumn, recipe.textColumn);
  assert.deepEqual(rects["block-identity"], recipe.zones.headlinePrimary);
  assert.deepEqual(rects["block-identity-secondary"], recipe.zones.headlineSecondary);
  assert.deepEqual(rects["block-primaryMeta"], recipe.zones.primaryMeta);
  assert.deepEqual(rects["block-secondaryMeta"], recipe.zones.talentPolicy);
  assert.deepEqual(rects["block-dateTime"], recipe.zones.date);
  assert.deepEqual(rects["block-footer-doors"], recipe.zones.doors);
  assert.deepEqual(rects["block-venue"], recipe.zones.venue);
  assert.deepEqual(rects["block-badge"], recipe.zones.optionalBadge);
  assert.deepEqual(rects["block-footer-reservation"], recipe.zones.reservation);
  assert.deepEqual(rects["block-footer-compliance"], recipe.zones.compliance);
});

test("fashion club blocks remain pinned, non-overlapping, and treat both rails as identity", () => {
  const { composition } = blockRects(buildInput("story"));
  const visible = composition.blocks.filter((block) => !block.hidden);
  const identity = visible.filter((block) => block.role === "identity");

  assert.equal(identity.length, 2);
  assert.ok(identity.every((block) => block.source === "headline"));
  assert.ok(identity.every((block) => block.minVisualPower! >= 88));
  assert.ok(composition.blocks.every((block) => block.pinned === true));

  for (let first = 0; first < visible.length; first += 1) {
    for (let second = first + 1; second < visible.length; second += 1) {
      assert.equal(
        overlapRatio(visible[first].rect, visible[second].rect, "min"),
        0,
        `${visible[first].id} overlaps ${visible[second].id}`
      );
    }
  }
});

test("a one-word event name hides only the unused second identity rail", () => {
  const input = buildInput("story");
  input.text.headline = "FRIDAY";
  input.text.footer = input.text.subtag;
  const { composition } = blockRects(input);

  assert.equal(composition.blocks.find((block) => block.id === "block-identity")?.hidden, false);
  assert.equal(composition.blocks.find((block) => block.id === "block-identity-secondary")?.hidden, true);
  assert.equal(composition.blocks.find((block) => block.id === "block-footer-reservation")?.hidden, true);
});
