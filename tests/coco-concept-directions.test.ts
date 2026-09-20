import assert from "node:assert/strict";
import test from "node:test";
import {
  COCO_CURATED_ART_DIRECTION_LIBRARY,
} from "../components/coco/artDirections/index.ts";
import {
  COCO_CONCEPT_DIRECTIONS,
  type CocoConceptDirectionId,
} from "../components/coco/conceptDirector/directions.ts";
import { VISUAL_RECIPES } from "../lib/visualRecipes.ts";

test("every curated art direction is a selectable concept direction", () => {
  const curatedIds = COCO_CURATED_ART_DIRECTION_LIBRARY.map(({ id }) => id);
  const conceptIds = COCO_CONCEPT_DIRECTIONS.map(({ id }) => id);

  assert.equal(COCO_CONCEPT_DIRECTIONS.length, 9);
  assert.equal(new Set(conceptIds).size, 9);
  assert.deepEqual(new Set(conceptIds), new Set(curatedIds));

  for (const curated of COCO_CURATED_ART_DIRECTION_LIBRARY) {
    const concept = COCO_CONCEPT_DIRECTIONS.find(({ id }) => id === curated.id);
    assert.ok(concept, `${curated.id} must enter the concept tournament`);
    assert.equal(concept.id satisfies CocoConceptDirectionId, curated.id);
    assert.equal(concept.name, curated.name);
    assert.equal(concept.effectsStyle, curated.effectsPolicy.id);
    assert.equal(concept.paletteStyle, curated.palettePolicy.id);
    assert.equal(concept.typePersonality, curated.typographyPersonality);
    if ("visualRecipeId" in curated && curated.visualRecipeId) {
      assert.equal(concept.layoutId, curated.layoutByFormat.square.layoutId);
    }
  }
});

test("all nine active authored recipes enter the concept tournament exactly once", () => {
  for (const id of COCO_CURATED_ART_DIRECTION_LIBRARY.map(({ id }) => id)) {
    const matches = COCO_CONCEPT_DIRECTIONS.filter((direction) => direction.id === id);
    assert.equal(matches.length, 1, `${id} must have one concept direction`);
    assert.equal(matches[0].id satisfies CocoConceptDirectionId, id);
  }
});

test("every authoritative visual recipe is reachable from exactly one art direction", () => {
  const recipeIds = VISUAL_RECIPES.map(({ id }) => id).sort();
  const routedRecipeIds = COCO_CURATED_ART_DIRECTION_LIBRARY.flatMap((direction) =>
    "visualRecipeId" in direction && direction.visualRecipeId
      ? [direction.visualRecipeId]
      : [],
  ).sort();

  assert.equal(recipeIds.length, 9);
  assert.deepEqual(routedRecipeIds, recipeIds);
});
