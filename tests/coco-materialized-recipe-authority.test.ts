import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("app/page.tsx", "utf8");

test("materialized recipes bypass generic winner and format-session resets", () => {
  const applyTemplate = appSource.slice(
    appSource.indexOf("const applyTemplate ="),
    appSource.indexOf("const applyTemplateFromGallery")
  );
  assert.match(
    applyTemplate,
    /applyingMaterializedCocoVisualRecipe[\s\S]*applyingCocoTemplate && !applyingMaterializedCocoVisualRecipe/
  );

  const nativeWinner = appSource.slice(
    appSource.indexOf("const applyWinningTemplateNatively ="),
    appSource.indexOf("applyWinningTemplateNativelyRef.current = applyWinningTemplateNatively")
  );
  const recipeGate = nativeWinner.indexOf("isMaterializedCocoVisualRecipeVariant");
  const templateImport = nativeWinner.indexOf("TEMPLATE_GALLERY.find");
  assert.ok(recipeGate >= 0, "the native winner has a materialized-recipe gate");
  assert.ok(recipeGate < templateImport, "the recipe exits before generic template import");
});

test("materialized recipe authority blocks generic layout and palette controls", () => {
  const layoutMapper = appSource.slice(
    appSource.indexOf("const applyCocoSubjectLayout ="),
    appSource.indexOf("applyCocoSubjectLayoutRef.current = applyCocoSubjectLayout")
  );
  assert.match(layoutMapper, /materializedCocoRecipeBlocksGenericLayout/);
  assert.ok(
    layoutMapper.indexOf("materializedCocoRecipeBlocksGenericLayout") <
      layoutMapper.indexOf("const requestedCenterOption"),
    "the authored recipe exits before generic layout calculation"
  );
  assert.match(
    appSource,
    /const cocoAvailableSubjectLayoutOptions = activeMaterializedCocoRecipeBlocksGenericLayout\s*\? \[\]/
  );

  const generatedPalette = appSource.slice(
    appSource.indexOf("const applyGeneratedSceneBuilderPalette ="),
    appSource.indexOf("const currentGeneratedSceneBuilderPaletteKey")
  );
  assert.match(
    generatedPalette,
    /materializedCocoRecipeBlocksGeneratedPalette\(sessionVariant\)\) return;/
  );
});

test("Ladies Quick Edit keeps description out of the authored legal footer", () => {
  const quickEdit = appSource.slice(
    appSource.indexOf("const updateCocoQuickField ="),
    appSource.indexOf("const openCocoQuickSubjectReplacement")
  );
  const detailsPatch = quickEdit.slice(
    quickEdit.indexOf('field === "details"'),
    quickEdit.indexOf('field === "presenter"')
  );
  assert.match(detailsPatch, /eventBrief\.eventDetails = clean/);
  assert.match(detailsPatch, /if \(!ladiesRecipeActive\)/);
  assert.match(detailsPatch, /patch\.details = clean/);
});
