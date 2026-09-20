import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getCocoArtDirection } from "../components/coco/artDirections/index.ts";
import {
  getVisualRecipe,
  resolveCocoVisualRecipeProvenance,
} from "../lib/visualRecipes.ts";

const getArchivedGoldenHeroRecipe = () =>
  resolveCocoVisualRecipeProvenance({
    cocoVisualRecipeId: "golden-hero-editorial",
    cocoVisualRecipeVersion: 3,
    cocoVisualRecipeMaterializedVersion: 3,
  })?.recipe;

test("the saved Golden Hero master uses the current split Venue contract", async () => {
  const project = JSON.parse(
    await readFile(new URL("../public/generated-flyers/tribal-night-coco-recipe.nflyer", import.meta.url), "utf8")
  );
  const state = project.state ?? project;
  for (const variant of [state, state.session?.square, state.session?.story]) {
    assert.equal(variant.cocoVisualRecipeVersion, 3);
    assert.equal(variant.cocoVisualRecipeMaterializedVersion, 3);
    assert.equal(variant.venue, "Downtown Lounge");
    assert.equal(variant.venueAddress, "47 Grand Avenue");
    assert.equal(typeof variant.cocoRushVenueStyles?.venueNameSize, "number");
    assert.equal(typeof variant.cocoRushVenueStyles?.addressSize, "number");
    assert.equal(typeof variant.cocoRushVenueStyles?.gap, "number");
    assert.equal(typeof variant.detailsLabelSize, "number");
    assert.equal(typeof variant.djLineupLabelSize, "number");
    const assets = Array.isArray(variant.portraits)
      ? variant.portraits
      : Object.values(variant.portraits ?? {}).flat();
    for (const asset of assets.filter((item: any) => String(item?.id ?? "").startsWith("coco_golden_hero_"))) {
      assert.equal((asset as any).isDesignElement, true);
      assert.equal((asset as any).hitTestMode, "alpha-bounds");
    }
  }
});

test("Golden Hero is archived for saved-project recovery but is not selectable", () => {
  const direction = getCocoArtDirection("golden-hero-editorial");
  assert.equal(direction, undefined);
  assert.equal(getVisualRecipe("golden-hero-editorial"), undefined);

  const recipe = getArchivedGoldenHeroRecipe();
  assert.ok(recipe);
  assert.equal(recipe.id, "golden-hero-editorial");
  assert.equal(recipe.name, "Golden Hero Editorial");
  assert.equal(recipe.version, 3);
  assert.equal(recipe.reference, "tribal-night-final.html");
  assert.equal(recipe.referenceMode, "measurement-only");
  assert.equal(recipe.measurementReference?.mode, "measurement-only");
  assert.equal(recipe.measurementReference?.sourceTemplateId, "tribal-night-final");
  assert.ok(recipe.measurementReference?.deniedUses.includes("literal event copy"));
  assert.ok(recipe.measurementReference?.deniedUses.includes("literal uploaded portrait"));
  assert.ok(recipe.measurementReference?.deniedUses.includes("flattened finished artwork"));
  assert.ok(recipe.composition?.deniedReferenceUses?.includes("flattened canvas"));
});

test("Golden Hero stores the measured Square and Story campaign geometry", () => {
  const recipe = getArchivedGoldenHeroRecipe();
  assert.ok(recipe?.measurementReference);
  const measurements = recipe.measurementReference.measurements;

  assert.deepEqual(measurements.squareSubjectRect, {
    x: 42,
    y: 5,
    width: 58,
    height: 95,
  });
  assert.deepEqual(measurements.squareHeadlineRect, {
    x: 6,
    y: 7,
    width: 42,
    height: 30,
  });
  assert.deepEqual(measurements.squareScriptRect, {
    x: 6,
    y: 49,
    width: 34,
    height: 13,
  });
  assert.deepEqual(measurements.squareDateRect, {
    x: 6,
    y: 66,
    width: 15,
    height: 7,
  });
  assert.deepEqual(measurements.squareTimeRect, {
    x: 6,
    y: 74,
    width: 15,
    height: 2.5,
  });
  assert.deepEqual(measurements.squareLineupRect, {
    x: 25,
    y: 66,
    width: 67,
    height: 6,
  });
  assert.deepEqual(measurements.squareOptionalDetailsRect, {
    x: 25,
    y: 72.5,
    width: 67,
    height: 4,
  });
  assert.deepEqual(measurements.squareVenueRect, {
    x: 6,
    y: 85,
    width: 34,
    height: 8,
  });
  assert.deepEqual(measurements.squareMusicPolicyRect, {
    x: 50,
    y: 85,
    width: 27,
    height: 8,
  });
  assert.deepEqual(measurements.squareEntryRect, {
    x: 84,
    y: 84,
    width: 11,
    height: 10,
  });
  assert.deepEqual(measurements.squarePresenterRect, {
    x: 70,
    y: 3,
    width: 24,
    height: 7,
  });
  assert.deepEqual(measurements.squareSocialRect, {
    x: 70,
    y: 8,
    width: 24,
    height: 2.4,
  });
  assert.deepEqual(measurements.squareRsvpRect, {
    x: 6,
    y: 94,
    width: 88,
    height: 3,
  });

  assert.deepEqual(measurements.storySubjectRect, {
    x: 40,
    y: 3,
    width: 60,
    height: 97,
  });
  assert.deepEqual(measurements.storyHeadlineRect, {
    x: 6,
    y: 6,
    width: 42,
    height: 29,
  });
  assert.deepEqual(measurements.storyScriptRect, {
    x: 6,
    y: 36.5,
    width: 36,
    height: 11,
  });
  assert.deepEqual(measurements.storyDateRect, {
    x: 6,
    y: 56.5,
    width: 15,
    height: 7,
  });
  assert.deepEqual(measurements.storyTimeRect, {
    x: 6,
    y: 64,
    width: 15,
    height: 2.5,
  });
  assert.deepEqual(measurements.storyLineupRect, {
    x: 25,
    y: 57,
    width: 67,
    height: 7.5,
  });
  assert.deepEqual(measurements.storyOptionalDetailsRect, {
    x: 25,
    y: 67.5,
    width: 67,
    height: 5,
  });
  assert.deepEqual(measurements.storyVenueRect, {
    x: 6,
    y: 85,
    width: 34,
    height: 8,
  });
  assert.deepEqual(measurements.storyMusicPolicyRect, {
    x: 50,
    y: 85,
    width: 27,
    height: 8,
  });
  assert.deepEqual(measurements.storyEntryRect, {
    x: 84,
    y: 84,
    width: 11,
    height: 10,
  });
  assert.deepEqual(measurements.storyPresenterRect, {
    x: 70,
    y: 3,
    width: 24,
    height: 7,
  });
  assert.deepEqual(measurements.storySocialRect, {
    x: 70,
    y: 8,
    width: 24,
    height: 2.4,
  });
  assert.deepEqual(measurements.storyRsvpRect, {
    x: 6,
    y: 94,
    width: 88,
    height: 3,
  });
  assert.equal(measurements.headlineMinCanvasSpan, 0.7);
  assert.equal(measurements.maximumStrongColors, 2);
  assert.equal(measurements.recipeVersion, 3);
});

test("Golden Hero remains a recipe of editable semantic roles instead of flattened artwork", () => {
  const recipe = getArchivedGoldenHeroRecipe();
  assert.ok(recipe?.composition);
  const roles = recipe.composition.roles;
  const roleIds = roles.map((role) => role.id);

  assert.deepEqual(roleIds, [
    "contrastField",
    "subjectPrimary",
    "mainHeadline",
    "scriptHeadline",
    "date",
    "time",
    "lineup",
    "optionalDetails",
    "venue",
    "musicPolicy",
    "entry",
    "presenter",
    "social",
    "rsvp",
  ]);
  assert.ok(roles.every((role) => role.editable === true));
  assert.deepEqual(
    roles.filter((role) => role.required).map((role) => role.id),
    ["contrastField", "subjectPrimary", "mainHeadline"]
  );
  assert.equal(roles.find((role) => role.id === "contrastField")?.layer, "behindSubject");
  assert.equal(roles.find((role) => role.id === "subjectPrimary")?.layer, "subject");
  assert.equal(roles.find((role) => role.id === "mainHeadline")?.layer, "foreground");
  assert.equal(roles.find((role) => role.id === "scriptHeadline")?.layer, "foreground");
  assert.deepEqual(
    recipe.composition.overlapRules.find((rule) =>
      rule.objects.includes("scriptHeadline") && rule.objects.includes("mainHeadline")
    )?.allowed,
    false
  );

  assert.match(recipe.typography.join("\n"), /Coolvetica Hv Comp/i);
  assert.match(recipe.typography.join("\n"), /OpenScript/i);
  assert.match(recipe.typography.join("\n"), /LEMONMILK/i);
  assert.match(recipe.typography.join("\n"), /#E89300/i);
  assert.match(recipe.typography.join("\n"), /no metallic/i);
  assert.match(recipe.layerStack.join("\n"), /editable left contrast curtain/i);
  assert.match(recipe.appNotes.join("\n"), /survives \.nflyer export/i);
});
