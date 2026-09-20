import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasCocoCompiledCanvas } from "../lib/coco/compiledCanvasAuthority.ts";
import { getVisualRecipe } from "../lib/visualRecipes.ts";

test("the Brunch compilation owns both imported canvases", () => {
  const project = JSON.parse(readFileSync("public/generated-flyers/brunch-vibes-compiled-portrait.nflyer", "utf8"));
  assert.equal(getVisualRecipe("brunch-vibes")?.id, "brunch-vibes");
  for (const format of ["square", "story"]) {
    assert.equal(hasCocoCompiledCanvas(project.state.session[format]), true);
  }
});

test("a recipe name or incomplete compiled metadata is not canvas authority", () => {
  for (const value of [null, {}, { cocoVisualRecipeId: "brunch-vibes" },
    { cocoCompositionSystem: { compiledDocument: { schemaVersion: 1, objects: [] } } }]) {
    assert.equal(hasCocoCompiledCanvas(value), false);
  }
});

test("import invalidates pending searches and compiled ownership gates native replacement", () => {
  const source = readFileSync("app/page.tsx", "utf8");
  assert.match(source, /return hasCocoCompiledCanvas\(value\) \|\| Boolean\(getMaterializedCocoVisualRecipe\(value\)\)/);
  const importer = source.slice(source.indexOf("const importDesignJSON ="), source.indexOf("const importDesignJSON =") + 5000);
  assert.match(importer, /cocoVisualReferenceRequestSerialRef.current \+= 1/);
  assert.match(importer, /cocoVisualReferenceDesiredSceneRef.current = ""/);
  const winner = source.slice(source.indexOf("const applyWinningTemplateNatively ="), source.indexOf("const applyWinningTemplateNatively =") + 700);
  assert.ok(winner.indexOf("isMaterializedCocoVisualRecipeVariant") < winner.indexOf("TEMPLATE_GALLERY.find"));
  const layoutGuard = source.slice(source.indexOf("function materializedCocoRecipeBlocksGenericLayout"), source.indexOf("function materializedCocoRecipeBlocksGeneratedPalette"));
  assert.match(layoutGuard, /if \(hasCocoCompiledCanvas\(value\)\) return true/);
  const delayedFooter = source.slice(source.indexOf("const placeCenterFooter ="), source.indexOf("const placeCenterFooter =") + 400);
  assert.match(delayedFooter, /materializedCocoRecipeBlocksGenericLayout/);
});

test("Brunch export retains authored translated positions and editor-sized text", () => {
  const project = JSON.parse(readFileSync("public/generated-flyers/brunch-vibes-compiled-portrait.nflyer", "utf8"));
  for (const format of ["square", "story"]) {
    const objects = project.state.session[format].cocoCompositionSystem.compiledDocument.objects;
    const month = objects.find((object: any) => object.id === "month");
    assert.ok(Math.abs(month.bounds.x - (79 + 27.3405) / 1024 * 100) < 0.001);
    assert.ok(Math.abs(month.bounds.y - (232 - 37.56) / 1536 * 100) < 0.001);
    assert.ok(Math.abs(month.binding.initial.size - 58 * 540 / 1024) < 0.001);
  }
});
