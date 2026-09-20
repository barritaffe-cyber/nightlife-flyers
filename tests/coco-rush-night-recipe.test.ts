import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getCocoArtDirection,
  selectCocoArtDirectionChoices,
} from "../components/coco/artDirections/index.ts";
import {
  getRushNightFormatRecipe,
  RUSH_NIGHT_MASTER_GEOMETRY,
  RUSH_NIGHT_RECIPE,
} from "../lib/recipes/rushNight.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return;
  }
  const object = value as object;
  if (seen.has(object)) return;
  seen.add(object);
  assert.equal(Object.isFrozen(object), true);
  for (const key of Reflect.ownKeys(object)) {
    assertDeepFrozen((object as Record<PropertyKey, unknown>)[key], seen);
  }
}

const masterUrl = new URL(
  "../public/generated-flyers/rush-night-reference-master.html",
  import.meta.url
);

test("Rush Night preserves the verified CSS master geometry and source hash", async () => {
  const html = await readFile(masterUrl, "utf8");
  const geometryMatch = html.match(
    /<script\s+type="application\/json"\s+id="rush-night-css-master-geometry">([\s\S]*?)<\/script>/
  );
  assert.ok(geometryMatch, "the CSS master must retain its embedded geometry contract");

  const embedded = JSON.parse(geometryMatch[1]) as unknown;
  const sha256 = createHash("sha256").update(html).digest("hex");

  assert.deepEqual(embedded, RUSH_NIGHT_MASTER_GEOMETRY);
  assert.equal(sha256, RUSH_NIGHT_RECIPE.source.sha256);
  assert.equal(RUSH_NIGHT_RECIPE.source.kind, "standalone-css-master");
  assert.equal(
    RUSH_NIGHT_RECIPE.source.publicPath,
    "/generated-flyers/rush-night-reference-master.html"
  );
  assert.equal(
    RUSH_NIGHT_RECIPE.source.geometryScriptId,
    "rush-night-css-master-geometry"
  );
  assert.equal(RUSH_NIGHT_RECIPE.source.regionAttribute, "data-region");
});

test("Rush Night is one registered measurement-only recipe", () => {
  assert.equal(RUSH_NIGHT_RECIPE.id, "rush-night-css");
  assert.equal(RUSH_NIGHT_RECIPE.version, 12);
  assert.equal(RUSH_NIGHT_RECIPE.referenceMode, "measurement-only");
  assert.equal(RUSH_NIGHT_RECIPE.runtime.directionId, "rush-night-css");
  assert.equal(RUSH_NIGHT_RECIPE.runtime.compositionPattern, "rush-night-css");
  assert.equal(
    VISUAL_RECIPES.filter((recipe) => recipe.id === RUSH_NIGHT_RECIPE.id).length,
    1
  );
  assert.equal(getVisualRecipe(RUSH_NIGHT_RECIPE.id), RUSH_NIGHT_RECIPE);
  assert.ok(
    RUSH_NIGHT_RECIPE.measurementReference?.deniedUses.includes(
      "flattened finished artwork"
    )
  );
  assert.ok(
    RUSH_NIGHT_RECIPE.composition?.deniedReferenceUses?.includes(
      "generated or stock replacement background"
    )
  );
});

test("Square and Story have explicit recipe-owned canvases and semantic zones", () => {
  const square = getRushNightFormatRecipe("square");
  const story = getRushNightFormatRecipe("story");

  assert.deepEqual(square.canvas, { width: 540, height: 540 });
  assert.deepEqual(story.canvas, { width: 540, height: 960 });
  assert.deepEqual(Object.keys(square.zones), Object.keys(story.zones));
  assert.deepEqual(Object.keys(story.zones), [
    "photo",
    "photoGrade",
    "texture",
    "edgeShadow",
    "triangle",
    "presenter",
    "date",
    "headline",
    "script",
    "genres",
    "lineup",
    "entry",
    "venue",
  ]);

  assert.deepEqual(story.zones.headline, { x: 19.5, y: 46, width: 62, height: 19 });
  assert.deepEqual(story.zones.script, { x: 28, y: 61.2, width: 52, height: 8.8 });
  assert.deepEqual(story.zones.date, { x: 13, y: 15.7, width: 13.5, height: 15.6 });
  assert.deepEqual(story.zones.genres, { x: 20.5, y: 72.8, width: 59, height: 3.2 });
  assert.deepEqual(story.zones.photo, { x: 8, y: 16, width: 84, height: 84 });
  assert.deepEqual(story.zones.entry, { x: 32.5, y: 84.5, width: 35, height: 4.4 });
  assert.deepEqual(story.zones.venue, { x: 22, y: 89.5, width: 56, height: 5.2 });

  assert.deepEqual(square.zones.headline, {
    x: 8,
    y: 48,
    width: 80,
    height: 20,
  });
  assert.deepEqual(square.zones.script, {
    x: 27,
    y: 59,
    width: 55,
    height: 12,
  });
  assert.deepEqual(square.zones.date, {
    x: 6,
    y: 16,
    width: 14,
    height: 21,
  });
  assert.deepEqual(square.zones.genres, {
    x: 17,
    y: 71.6,
    width: 66,
    height: 4.2,
  });
  assert.deepEqual(square.zones.lineup, {
    x: 14,
    y: 76.3,
    width: 72,
    height: 8.4,
  });
  assert.deepEqual(square.zones.entry, {
    x: 31,
    y: 85.3,
    width: 38,
    height: 5.2,
  });
  assert.deepEqual(square.zones.venue, {
    x: 20,
    y: 91.3,
    width: 60,
    height: 5,
  });

  for (const format of [square, story]) {
    assert.equal(format.imageFit.mode, "cover");
    assert.equal(format.imageFit.preserveUserScale, true);
    assert.equal(format.variant.headlineFamily, "BAD GRUNGE");
    assert.equal(format.variant.head2Family, "OpenScript");
    assert.equal(format.variant.headX, format.zones.headline.x);
    assert.equal(format.variant.headY, format.zones.headline.y);
    assert.equal(format.variant.head2X, format.zones.script.x);
    assert.equal(format.variant.head2Y, format.zones.script.y);
    assert.equal(format.variant.priceEnabled, true);
    assert.equal(format.variant.priceRingEnabled, false);
    assert.equal(format.variant.priceRingAlpha, 0.72);
    assert.equal(format.variant.priceScale, 0.75);
  }
  assert.deepEqual(
    { x: story.imageFit.positionX, y: story.imageFit.positionY, scale: story.imageFit.scale },
    { x: 50, y: 100, scale: 0.84 }
  );
  assert.deepEqual(
    { x: square.imageFit.positionX, y: square.imageFit.positionY, scale: square.imageFit.scale },
    { x: 70, y: 0, scale: 0.75 }
  );
});

test("the Rush Night recipe blocks generic layout, palette, crop, decoration and backgrounds", () => {
  const authority = RUSH_NIGHT_RECIPE.runtime.authority;

  assert.deepEqual(authority.downstreamMustObey, [
    "recipe-format-zones",
    "recipe-palette",
    "recipe-assets",
    "recipe-image-fit",
  ]);
  assert.equal(authority.layout.owner, "recipe-format-zones");
  assert.equal(authority.layout.genericTemplateMayOverride, false);
  assert.equal(authority.palette.owner, "recipe-palette");
  assert.equal(authority.palette.generatedPaletteMayOverride, false);
  assert.equal(authority.assets.owner, "recipe-assets");
  assert.equal(authority.assets.genericDecorationAllowed, false);
  assert.equal(authority.assets.generatedBackgroundAllowed, false);
  assert.equal(authority.crop.owner, "recipe-image-fit");
  assert.equal(authority.crop.genericCropMayOverride, false);
  assert.deepEqual(RUSH_NIGHT_RECIPE.runtime.assetPolicy, {
    allowOnlyRecipeAssets: true,
    autoAddGenericSocialIcons: false,
    autoAddPriceBadge: false,
    autoAddQr: false,
    autoAddTexture: false,
    autoGenerateBackground: false,
  });
  assert.equal(RUSH_NIGHT_RECIPE.targetAssets?.backgroundUrl, undefined);
  assert.match(
    RUSH_NIGHT_RECIPE.targetAssets?.notes?.join("\n") ?? "",
    /replaceable 9:16 mid-shot demo photo/i
  );
  assert.match(RUSH_NIGHT_RECIPE.avoid.join("\n"), /generating or substituting a background/i);
});

test("Rush Night keeps editable roles and an immutable source-to-runtime contract", () => {
  const composition = RUSH_NIGHT_RECIPE.composition;
  assert.ok(composition);
  assert.ok(composition.roles.every((role) => role.editable === true));
  assert.deepEqual(
    composition.roles.filter((role) => role.required).map((role) => role.id),
    [
      "photo",
      "photoGrade",
      "triangle",
      "date",
      "headline",
      "script",
      "genres",
      "lineup",
      "entryPrimary",
      "entryPrice",
      "entrySecondary",
      "venue",
    ]
  );

  const primaryEntry = composition.roles.find((role) => role.id === "entryPrimary");
  const entryPrice = composition.roles.find((role) => role.id === "entryPrice");
  const secondaryEntry = composition.roles.find((role) => role.id === "entrySecondary");
  assert.ok(primaryEntry);
  assert.ok(entryPrice);
  assert.ok(secondaryEntry);
  assert.ok(primaryEntry.bounds);
  assert.ok(entryPrice.bounds);
  assert.ok(secondaryEntry.bounds);
  const primaryEntryBounds = primaryEntry.bounds;
  const entryPriceBounds = entryPrice.bounds;
  const secondaryEntryBounds = secondaryEntry.bounds;
  assert.ok(primaryEntryBounds.height < getRushNightFormatRecipe("story").zones.entry.height);
  assert.deepEqual(entryPriceBounds, getRushNightFormatRecipe("story").assets.pricePill);
  assert.ok(secondaryEntryBounds.y > primaryEntryBounds.y);
  assert.equal(secondaryEntryBounds.width, getRushNightFormatRecipe("story").zones.entry.width);

  assertDeepFrozen(RUSH_NIGHT_MASTER_GEOMETRY);
  assertDeepFrozen(RUSH_NIGHT_RECIPE);
  assertDeepFrozen(getRushNightFormatRecipe("square"));
  assertDeepFrozen(getRushNightFormatRecipe("story"));

  assert.throws(() => {
    (getRushNightFormatRecipe("story").zones.headline as { x: number }).x = 0;
  }, TypeError);
  assert.equal(getRushNightFormatRecipe("story").zones.headline.x, 19.5);
});

test("plain Rush Night language routes to the recipe-backed High Energy Club direction", () => {
  const choices = selectCocoArtDirectionChoices({
    nightlifeStyle: "house",
    eventName: "Rush Night",
    eventDescription:
      "Use one orange neon triangle, a full-bleed nightlife portrait and a bold house music lineup.",
  });

  assert.equal(choices.length, 3);
  assert.equal(choices[0].id, "high-energy-club");
  assert.equal(choices[0].visualRecipeId, "rush-night-css");
  assert.equal(getCocoArtDirection("high-energy-club"), choices[0]);

  const premiumChoices = selectCocoArtDirectionChoices({
    nightlifeStyle: "luxury-club",
    eventName: "Rush Night",
    eventDescription:
      "A dark premium portrait with one orange neon triangle and an oversized distressed title.",
  });
  assert.equal(premiumChoices[0].id, "high-energy-club");
  assert.equal(premiumChoices[0].visualRecipeId, "rush-night-css");
});
