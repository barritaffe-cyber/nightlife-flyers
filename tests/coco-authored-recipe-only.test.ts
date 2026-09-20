import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildCocoAuthoredRecipeSeed } from "../lib/coco/authoredRecipeSeed.ts";
import { COCO_CURATED_ART_DIRECTION_LIBRARY } from "../components/coco/artDirections/library.ts";
import { COCO_PORTABLE_RECIPE_PROJECT_URLS, materializeCocoPortableRecipeTemplate } from "../lib/coco/portableRecipeRuntime.ts";
import { getMaterializedCocoVisualRecipe } from "../lib/visualRecipes.ts";

test("all offered directions start with authored recipe containers, not gallery canvases", () => {
  for (const direction of COCO_CURATED_ART_DIRECTION_LIBRARY) {
    const seed = buildCocoAuthoredRecipeSeed(direction.visualRecipeId);
    assert.equal(seed.id, direction.visualRecipeId);
    assert.deepEqual(seed.formats, { square: {}, story: {} });
    assert.equal(seed.preview, "");
  }
  for (const id of [undefined, "edm_tunnel", "techno_tunnel", "golden-hero-editorial"]) {
    assert.throws(() => buildCocoAuthoredRecipeSeed(id), /requires an authored recipe/);
  }
});

for (const recipeId of Object.keys(COCO_PORTABLE_RECIPE_PROJECT_URLS) as Array<keyof typeof COCO_PORTABLE_RECIPE_PROJECT_URLS>) {
  test(`${recipeId} creates both canvases without a gallery base`, () => {
    const project = JSON.parse(readFileSync(`public${COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId]}`, "utf8"));
    const result = materializeCocoPortableRecipeTemplate({
      baseTemplate: buildCocoAuthoredRecipeSeed(recipeId),
      composer: { eventName: "Recipe Only Test", eventBrief: {} },
      project,
      recipeId,
    });
    for (const format of ["square", "story"] as const) {
      assert.equal(getMaterializedCocoVisualRecipe(result.formats?.[format])?.id, recipeId);
    }
  });
}

test("Coco creation and startup cannot fall back to gallery references", () => {
  const source = readFileSync("app/page.tsx", "utf8");
  const candidate = source.slice(source.indexOf("async function buildPendingCocoDirectionCandidate("), source.indexOf("function mergeStartupVariant("));
  assert.doesNotMatch(candidate, /findTemplateById|TEMPLATE_GALLERY|direction\.referenceTemplateIds|buildCocoNativeReferenceStartupTemplate/);
  assert.match(candidate, /baseTemplate: recipeSeed/);
  assert.match(candidate, /did not materialize its authored/);
  const nativeBuilder = source.slice(source.indexOf("function buildCocoComposerTemplate("), source.indexOf("function cocoEditorNightlifeGraphic("));
  assert.doesNotMatch(nativeBuilder, /findTemplateById|TEMPLATE_GALLERY/);
  const startup = source.slice(source.indexOf("const handleTemplateSelect ="));
  assert.match(startup, /await buildPendingCocoDirectionCandidate\(payload\.composer, selectedArtDirection\)/);
  assert.doesNotMatch(startup, /buildCocoComposerTemplate\(payload\.composer\)/);
});
