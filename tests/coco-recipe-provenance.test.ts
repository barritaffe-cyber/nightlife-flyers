import assert from "node:assert/strict";
import test from "node:test";

import {
  getMaterializedCocoVisualRecipe,
  getVisualRecipe,
  resolveCocoVisualRecipeProvenance,
} from "../lib/visualRecipes.ts";

test("registered recipe provenance resolves without a flyer-specific predicate", () => {
  const recipe = getVisualRecipe("fashion-club-vertical");
  assert.ok(recipe);

  const provenance = resolveCocoVisualRecipeProvenance({
    cocoVisualRecipeId: recipe.id,
    cocoVisualRecipeVersion: recipe.version,
    cocoVisualRecipeMaterializedVersion: recipe.version,
  });

  assert.equal(provenance?.recipe, recipe);
  assert.equal(provenance?.isMaterialized, true);
  assert.equal(provenance?.isCurrent, true);
  assert.equal(
    getMaterializedCocoVisualRecipe({
      cocoVisualRecipeId: recipe.id,
      cocoVisualRecipeVersion: recipe.version,
      cocoVisualRecipeMaterializedVersion: recipe.version,
    }),
    recipe
  );
});

test("removed Golden Hero is hidden from selection but remains recoverable by saved provenance", () => {
  assert.equal(getVisualRecipe("golden-hero-editorial"), undefined);
  const provenance = resolveCocoVisualRecipeProvenance({
    cocoVisualRecipeId: "golden-hero-editorial",
    cocoVisualRecipeVersion: 3,
    cocoVisualRecipeMaterializedVersion: 3,
  });

  assert.equal(provenance?.recipe.id, "golden-hero-editorial");
  assert.equal(provenance?.isMaterialized, true);
  assert.equal(provenance?.isCurrent, true);
});

test("a recipe ID alone cannot claim authored canvas authority", () => {
  assert.equal(
    getMaterializedCocoVisualRecipe({
      cocoVisualRecipeId: "golden-hero-editorial",
      cocoVisualRecipeVersion: 2,
    }),
    undefined
  );
  assert.equal(
    resolveCocoVisualRecipeProvenance({
      cocoVisualRecipeId: "not-in-the-registry",
      cocoVisualRecipeVersion: 1,
      cocoVisualRecipeMaterializedVersion: 1,
    }),
    null
  );
});

test("incomplete materialization cannot bypass generic construction", () => {
  const provenance = resolveCocoVisualRecipeProvenance({
    cocoVisualRecipeId: "golden-hero-editorial",
    cocoVisualRecipeVersion: 2,
    cocoVisualRecipeMaterializedVersion: 1,
  });

  assert.equal(provenance?.isMaterialized, false);
  assert.equal(provenance?.isCurrent, false);
  assert.equal(
    getMaterializedCocoVisualRecipe({
      cocoVisualRecipeId: "golden-hero-editorial",
      cocoVisualRecipeVersion: 2,
      cocoVisualRecipeMaterializedVersion: 1,
    }),
    undefined
  );
});

test("an older authored project stays protected while its recipe upgrades", () => {
  const provenance = resolveCocoVisualRecipeProvenance({
    cocoVisualRecipeId: "golden-hero-editorial",
    cocoVisualRecipeVersion: 1,
    cocoVisualRecipeMaterializedVersion: 1,
  });

  assert.equal(provenance?.isMaterialized, true);
  assert.equal(provenance?.isCurrent, false);
  assert.equal(provenance?.registryVersion, 3);
  assert.equal(provenance?.recipe.id, "golden-hero-editorial");
});
