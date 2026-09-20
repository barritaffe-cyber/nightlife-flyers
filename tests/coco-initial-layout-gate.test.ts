import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("app/page.tsx", "utf8");

test("project import invalidates delayed winner layout work", () => {
  const importBody = appSource.slice(appSource.indexOf("const importDesignJSON ="), appSource.indexOf("const applyHistorySnapshot ="));
  assert.match(importBody, /cocoInitialLayoutGenerationRef\.current \+= 1/);
  assert.match(importBody, /cocoPendingLayoutAfterMigrationRef\.current = null/);
  const callback = appSource.slice(appSource.indexOf("const initialLayoutGeneration ="), appSource.indexOf("[500, 1500, 3000]"));
  assert.match(callback, /initialLayoutGeneration !== cocoInitialLayoutGenerationRef\.current\) return/);
  assert.match(callback, /liveStore\.format !== format\) return/);
  assert.match(callback, /compiledDocument\?\.objects\?\.length > 0\) return/);
});

test("compiled CSS recipes bypass generic center migration", () => {
  const migration = appSource.slice(appSource.indexOf("const fashionClubRecipeActive = isCocoFashionClubVerticalVariant(variant)"));
  assert.ok(migration.indexOf("compiledDocument?.objects?.length > 0) return") < migration.indexOf("const migratedVariant ="));
  assert.match(migration.slice(0, 600), /compiledDocument\?\.objects\?\.length > 0\) return/);
});

test("chooser previews use directed geometry instead of the version-zero native wrapper", () => {
  const candidateBuilder = appSource.slice(
    appSource.indexOf("function buildPendingCocoDirectionCandidate"),
    appSource.indexOf("function mergeStartupVariant")
  );

  assert.match(
    candidateBuilder,
    /generatedPreview: buildCocoDirectionGeneratedPreview\(generatedTemplate\)/
  );
  assert.doesNotMatch(
    candidateBuilder,
    /generatedPreview: buildCocoDirectionGeneratedPreview\(template\)/
  );
});

test("new native Coco canvases preserve the generated subject relationship", () => {
  const nativeBuilder = appSource.slice(
    appSource.indexOf("function buildCocoNativeReferenceStartupTemplate"),
    appSource.indexOf("function mergeStartupVariant")
  );

  assert.match(nativeBuilder, /cocoSubjectLayoutId: generatedSubjectLayoutId/);
  assert.match(nativeBuilder, /cocoCenterLayoutOptionId:/);
  assert.match(nativeBuilder, /generatedSubjectLayoutId === "subject-center"/);
  assert.match(nativeBuilder, /String\(item\?\.id \|\| ""\)\.startsWith\("coco_contrast_"\)/);
  assert.match(nativeBuilder, /cocoCenterLayoutVersion: 0/);
});

test("registered visual recipes bypass the generic native-reference wrapper", () => {
  const nativeBuilder = appSource.slice(
    appSource.indexOf("function buildCocoNativeReferenceStartupTemplate"),
    appSource.indexOf("function mergeStartupVariant")
  );
  const recipeGateIndex = nativeBuilder.indexOf("const registeredRecipeId =");
  const referenceImportIndex = nativeBuilder.indexOf(
    "const referenceTemplate = findTemplateById(referenceTemplateId)"
  );

  assert.ok(recipeGateIndex >= 0, "the registered-recipe gate is present");
  assert.ok(
    recipeGateIndex < referenceImportIndex,
    "registered recipes exit before the generic reference is imported"
  );
  const recipeGate = nativeBuilder.slice(recipeGateIndex, referenceImportIndex);
  assert.match(recipeGate, /getMaterializedCocoVisualRecipe\(variant\)\?\.id/);
  assert.match(recipeGate, /squareRecipeId && squareRecipeId === storyRecipeId/);
  assert.match(recipeGate, /if \(registeredRecipeActive\)/);
  assert.match(recipeGate, /square: cloneTemplateSessionVariant\(generatedSquare\)/);
  assert.match(recipeGate, /story: cloneTemplateSessionVariant\(generatedStory\)/);
  assert.match(recipeGate, /return \{/);
});

test("the editor stays covered until the canonical composition is committed", () => {
  const startupHandler = appSource.slice(
    appSource.indexOf("const handleTemplateSelect ="),
    appSource.indexOf("\/\/ === \/STARTUP SCREEN ===")
  );

  assert.match(startupHandler, /const revealWhenComposed = \(\) =>/);
  assert.match(startupHandler, /const liveLayoutId = String\(liveVariant\.cocoSubjectLayoutId \?\? ""\)/);
  assert.match(startupHandler, /liveCenterLayoutVersion >= 55/);
  assert.match(startupHandler, /liveLayoutId === "subject-left" \|\| liveLayoutId === "subject-right"/);
  assert.match(startupHandler, /liveLayoutId === "subject-center" &&/);
  assert.match(startupHandler, /applyCocoSubjectLayoutRef\.current\?\.\(\s*nextCenterOption/);
  assert.match(startupHandler, /selectCocoArtDirectionChoices\(\{/);
  assert.match(startupHandler, /eventDescription: payload\.composer\.eventBrief\.description/);
});

test("the authored center recipe snapshots itself before the generic v55 mapper", () => {
  const subjectLayoutMapper = appSource.slice(
    appSource.indexOf("const applyCocoSubjectLayout ="),
    appSource.indexOf("React.useEffect(() => {\n    applyCocoSubjectLayoutRef.current")
  );
  const recipeGuardIndex = subjectLayoutMapper.indexOf(
    "const authoredCenterRecipe = isCocoFashionClubVerticalVariant(centerSessionVariant)"
  );
  const genericMapperIndex = subjectLayoutMapper.indexOf(
    "const detectedCenterFace = resolveCocoRendererFaceZone"
  );

  assert.ok(recipeGuardIndex >= 0, "the authored center-recipe guard is present");
  assert.ok(
    recipeGuardIndex < genericMapperIndex,
    "the authored recipe exits before generic center geometry is calculated"
  );
  const recipeBranch = subjectLayoutMapper.slice(recipeGuardIndex, genericMapperIndex);
  assert.match(recipeBranch, /materialize: applyCocoFashionClubVerticalVariant/);
  assert.match(recipeBranch, /option: "subject-center-rail"/);
  assert.match(recipeBranch, /cocoVisualRecipeMaterializedVersion: 0/);
  assert.match(recipeBranch, /cocoCenterLayoutVersion: 55/);
  assert.match(
    recipeBranch,
    /cocoCenterLayoutSnapshots:\s*\{\s*\[authoredCenterRecipe\.option\]: canonicalSnapshot/
  );
  assert.match(recipeBranch, /store\.setPortraits\(format, authoredAssets/);
  assert.match(recipeBranch, /cocoCenterMigrationActiveRef\.current = false/);
  assert.match(recipeBranch, /return;/);
});

test("the post-mount headline fitter cannot dismantle a finished side composition", () => {
  const compositionCommit = appSource.slice(
    appSource.indexOf("const applyCocoCanvasComposition ="),
    appSource.indexOf("const cocoNativeZoneMeasurementKey")
  );

  assert.match(
    compositionCommit,
    /if \(cocoNativeReferenceTemplateId && cocoSubjectLayoutId !== "subject-center"\) return;/
  );
});
