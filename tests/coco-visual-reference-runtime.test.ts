import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("app/page.tsx", "utf8");
const startupSource = readFileSync("components/ui/StartupTemplates.tsx", "utf8");
const backgroundPanelsSource = readFileSync("components/editor/BackgroundPanels.tsx", "utf8");

test("manual Scene Builder palettes outrank delayed Coco color writers", () => {
  const paletteHandlers = appSource.slice(
    appSource.indexOf("const applySceneBuilderPaletteToCanvas"),
    appSource.indexOf("const applyTemplateBackgroundPalette")
  );
  assert.match(paletteHandlers, /authority: "automatic" \| "manual"/);
  assert.match(paletteHandlers, /templatePaletteAnalysisRef\.current \+= 1/);
  assert.match(paletteHandlers, /manualSceneBuilderPaletteRef\.current\[targetFormat\] = nextResolvedPalette/);
  assert.match(paletteHandlers, /cocoZoneContrastRequestRef\.current \+= 1/);
  assert.match(paletteHandlers, /COCO_ZONE_CONTRAST_ROLES\.map\(\(role\) => \[role, true\]\)/);
  assert.match(appSource, /onPaletteChange=\{applyManualSceneBuilderPaletteToCanvas\}/);
  assert.match(appSource, /onSelect: \(\) => applyManualSceneBuilderPaletteToCanvas\(rec\.palette\)/);

  const nativeWinner = appSource.slice(
    appSource.indexOf("const applyWinningTemplateNatively ="),
    appSource.indexOf("applyWinningTemplateNativelyRef.current = applyWinningTemplateNatively")
  );
  assert.match(nativeWinner, /manualSceneBuilderPaletteRef\.current\[format\]/);
  assert.match(nativeWinner, /applySceneBuilderPaletteToCanvas\(manualPalette, format, "manual"\)/);
});

test("Cool Electric keeps a stable preset seed after selection", () => {
  assert.match(
    backgroundPanelsSource,
    /const recommendationSeed = originalScenePalette \?\? scenePalette/
  );
  assert.match(
    appSource,
    /buildMobileBgFloatRecommendedPalettes\(originalSceneBuilderPalette \?\? palette\)/
  );
});

test("Generated cycles eight stable palettes with manual color authority", () => {
  const recipes = appSource.slice(
    appSource.indexOf("const GENERATED_SCENE_BUILDER_PALETTE_RECIPES"),
    appSource.indexOf("function buildMobileBgFloatRecommendedPalettes")
  );
  const recipeIds = Array.from(recipes.matchAll(/id: "([^"]+)"/g), (match) => match[1]);
  assert.equal(recipeIds.length, 8);
  assert.equal(new Set(recipeIds).size, 8);
  assert.match(recipes, /minimumContrast/);
  assert.match(recipes, /contrastRatio\(candidate, background\)/);

  const generatedHandler = appSource.slice(
    appSource.indexOf("const applyGeneratedSceneBuilderPalette"),
    appSource.indexOf("const currentGeneratedSceneBuilderPaletteKey")
  );
  assert.match(generatedHandler, /previousCycle\.index \+ 1/);
  assert.match(generatedHandler, /% generatedPalettes\.length/);
  assert.match(generatedHandler, /applyManualSceneBuilderPaletteToCanvas\(nextOption\.palette, format\)/);
  assert.match(generatedHandler, /tpl\?\.id \|\| templateId \|\| "canvas"/);
  assert.doesNotMatch(generatedHandler, /releaseManualSceneBuilderPaletteAuthority/);
  assert.doesNotMatch(generatedHandler, /applyTemplateBackgroundPalette/);
  assert.match(appSource, /`Generated \$\{status\.index \+ 1\}\/\$\{status\.total\}`/);
  assert.match(backgroundPanelsSource, /Click again to cycle through compatible generated palettes/);
});

test("Coco resolves the visual reference before preparing direction choices", () => {
  const submit = startupSource.slice(
    startupSource.indexOf("const handleComposerSubmit"),
    startupSource.indexOf("const openComposerStudio")
  );
  assert.match(submit, /Finding the best finished flyer reference/);
  assert.match(submit, /await onFindCocoReference/);
  assert.ok(
    submit.indexOf("await onFindCocoReference") < submit.indexOf('onSelect("coco-composer"'),
    "reference search must finish before startup prepares the direction choices"
  );
  assert.doesNotMatch(startupSource, /Designer recipe/);
  assert.doesNotMatch(startupSource, /setComposerLayoutRecipeId/);
});

test("Coco goes straight from the brief to three finished direction choices", () => {
  const submit = startupSource.slice(
    startupSource.indexOf("const handleComposerSubmit"),
    startupSource.indexOf("const openComposerStudio")
  );
  const styleReadIndex = submit.indexOf("await requestCocoStyleDecision");
  const copyIndex = submit.indexOf("await requestCocoGeneratedCopy");
  const referenceIndex = submit.indexOf("await onFindCocoReference");
  const handoffIndex = submit.indexOf('onSelect("coco-composer"');
  assert.ok(styleReadIndex >= 0 && styleReadIndex < copyIndex);
  assert.ok(copyIndex < referenceIndex);
  assert.ok(referenceIndex < handoffIndex);
  assert.doesNotMatch(submit, /if \(styleDecision\.askUser\)/);
  assert.doesNotMatch(startupSource, /coco-composer-style-read/);
  assert.doesNotMatch(startupSource, /I see a few directions/);
  assert.doesNotMatch(startupSource, /Choose a direction above/);
  assert.match(startupSource, /prepare three complete directions to choose from/);

  const handoff = submit.slice(handoffIndex);
  [
    "eventName",
    "eventBrief",
    "copy",
    "subjectDataUrl",
    "subjectBounds",
    "backgroundOnlyHero",
    "heroImageFace",
    "backgroundDataUrl",
    "backgroundSrc",
    "compositionMap",
    "initialSubjectLayoutId",
    "layoutRecipeTemplateId",
    "visualReferenceId",
    "referenceCandidates",
    "moodProfile",
    "photoSignals",
    "styleDecision",
  ].forEach((field) => assert.match(handoff, new RegExp(`\\b${field}\\b`)));
});

test("the first canvas is constructed from the mapped winning template", () => {
  const startupHandler = appSource.slice(
    appSource.indexOf('if (key === "coco-composer"'),
    appSource.indexOf('} else if (key === "dj"', appSource.indexOf('if (key === "coco-composer"'))
  );
  assert.match(startupHandler, /buildCocoNativeReferenceStartupTemplate/);
  assert.match(startupHandler, /payload\.composer\.layoutRecipeTemplateId/);
  assert.match(startupHandler, /setCocoNativeReferenceTemplateId/);
  assert.match(startupHandler, /setCocoVisualReferenceSearch\(\{/);
  const nativeStartup = appSource.slice(
    appSource.indexOf("function buildCocoNativeReferenceStartupTemplate"),
    appSource.indexOf("function mergeStartupVariant")
  );
  assert.doesNotMatch(nativeStartup, /\.\.\.centerGeometry/);
  assert.match(nativeStartup, /headBehindPortrait: false/);
  assert.match(nativeStartup, /headline: nativeHeadline/);
  assert.match(nativeStartup, /headlineSize: nativeHeadlineSize/);
  assert.match(nativeStartup, /const referenceUsesCompositeTitle/);
  assert.match(nativeStartup, /splitCompositeHeadline/);
  assert.match(nativeStartup, /const referenceUsesCompositeIdentity/);
  assert.match(nativeStartup, /generatedSource\.venue/);
  assert.match(nativeStartup, /head2Size: nativeHead2Size/);
  assert.match(nativeStartup, /venueSize: fitSlotFontSize/);
  assert.match(appSource, /initial cutout must not jump above[\s\S]*layerOffset: 0/);
});

test("pre-canvas selection requires subject-position compatibility", () => {
  const selector = appSource.slice(
    appSource.indexOf("const findCocoReferenceBeforeCanvas"),
    appSource.indexOf("React.useEffect(() =>", appSource.indexOf("const findCocoReferenceBeforeCanvas"))
  );
  assert.match(selector, /subjectLayoutId/);
  assert.match(selector, /supportsSubjectPlacement/);
  assert.match(selector, /reference\.profile\.subjectPosition === requestedSubjectPosition/);
});

test("subject uploads derive the initial reference layout from isolated face bounds", () => {
  assert.match(startupSource, /detectCocoFaceInDataUrl\(rawSubjectDataUrl\)/);
  assert.match(startupSource, /detectedSubjectFace =/);
  assert.match(startupSource, /face: detectedFace\.face/);
  assert.match(startupSource, /const subjectFace = subjectBounds\?\.face/);
  assert.match(startupSource, /subjectFace\.x \+ subjectFace\.width \/ 2/);
  assert.match(startupSource, /subjectLayoutId: initialSubjectLayoutId/);
});

test("live portrait canvas rerenders when visual reference selection arrives", () => {
  const portraitMemo = appSource.slice(
    appSource.indexOf("const portraitCanvas = React.useMemo"),
    appSource.indexOf("// === PORTRAIT LAYER END")
  );
  assert.match(portraitMemo, /cocoVisualReferenceSearch\.status/);
  assert.match(portraitMemo, /cocoVisualReferenceSearch\.templateIds/);
});

test("the first visually ranked template with enough saved headline capacity is applied directly", () => {
  assert.match(appSource, /const supportsExactHeadlineCopy = \(templateId: string\)/);
  assert.match(appSource, /templateIds\.find\(supportsExactHeadlineCopy\)/);
  assert.match(appSource, /applyWinningTemplateNatively\(winningTemplateId\)/);
  const candidateDebug = appSource.slice(
    appSource.indexOf("function CocoCanvasCandidateDebug"),
    appSource.indexOf("function cloneCocoRecipeRect")
  );
  assert.doesNotMatch(candidateDebug, /visualReferenceTemplateIds/);
  assert.doesNotMatch(candidateDebug, /chooseStructuredTemplateReference/);
});

test("the visual winner uses the complete saved template instead of reconstructed zones", () => {
  const nativeApply = appSource.slice(
    appSource.indexOf("const applyWinningTemplateNatively ="),
    appSource.indexOf("React.useEffect(() =>", appSource.indexOf("const applyWinningTemplateNatively ="))
  );
  assert.match(nativeApply, /cloneTemplateSessionVariant\(faceAdjustedSourceVariant\)/);
  assert.match(nativeApply, /const detailsSlotIsAgeGate = \/\^\(\?:18\|21\)\\\+\$\//);
  assert.match(nativeApply, /const fillTemplateTextSlot/);
  assert.match(nativeApply, /const fitTemplateHeadlineCopy/);
  assert.match(nativeApply, /const fitTemplateSlotFontSize/);
  assert.match(nativeApply, /fitTemplateHeadlineCopy\(sourceVariant\.headline, headline\)/);
  assert.match(nativeApply, /splitTemplateCompositeHeadline/);
  assert.match(nativeApply, /const referenceUsesCompositeIdentity/);
  assert.match(nativeApply, /headline: nativeHeadline/);
  assert.match(nativeApply, /const nativeHeadlineSize =/);
  assert.match(nativeApply, /headlineSize: nativeHeadlineSize/);
  assert.match(nativeApply, /headBehindPortrait: false/);
  assert.match(nativeApply, /textLayerOffset:\s*\{/);
  assert.match(nativeApply, /const normalizedCurrentSubjects/);
  assert.match(nativeApply, /layerOffset: 0/);
  assert.match(nativeApply, /const nativeHead2Size =/);
  assert.match(nativeApply, /head2Size: nativeHead2Size/);
  assert.match(nativeApply, /venueSize: fitTemplateSlotFontSize/);
  assert.match(nativeApply, /const fitTemplateSupportCopy/);
  assert.match(nativeApply, /const nativeDetails = !referenceDetails/);
  assert.match(nativeApply, /details: nativeDetails/);
  assert.match(nativeApply, /details2: fitTemplateSupportCopy\(sourceVariant\.details2, details2\)/);
  assert.match(nativeApply, /applyTemplate\(nativeTemplate, \{ targetFormat: format, initialLoad: true \}\)/);
  assert.match(nativeApply, /setCocoDirectorZones\(\{\}\)/);
  assert.match(nativeApply, /setCocoNativeReferenceTemplateId\(template\.id\)/);
  assert.doesNotMatch(nativeApply, /buildTypographyZoneModels/);
  assert.doesNotMatch(nativeApply, /applyWinningTemplateLayout/);
  assert.match(appSource, /data-coco-native-reference-template-id=\{cocoNativeReferenceTemplateId \?\? ""\}/);
  assert.match(appSource, /setTextColWidth\(merged\.textColWidth \?\? FULL_TEXT_BOX_WIDTH\)/);
  assert.match(
    appSource,
    /setHead2ColWidth\(merged\.head2ColWidth \?\? merged\.textColWidth \?\? FULL_TEXT_BOX_WIDTH\)/
  );
});

test("native subjects cannot occlude a front headline before depth placement is enabled", () => {
  assert.match(appSource, /headline: headBehindPortrait \? 8 : 40/);
});

test("native references use the same Coco-owned renderer path as generated compositions", () => {
  const artboardRenderer = appSource.slice(
    appSource.indexOf("const cocoDirectedRendererActive ="),
    appSource.indexOf("const [rushMeasuredSvgBounds")
  );

  assert.match(
    artboardRenderer,
    /const cocoDirectedRendererActive =\s*isCocoComposerTemplateActive \|\| cocoNativeReferenceTemplateActive;/
  );
  assert.match(artboardRenderer, /if \(!cocoDirectedRendererActive\) return null;[\s\S]*resolveCocoRendererFaceZone/);
  assert.match(artboardRenderer, /if \(!cocoDirectedRendererActive\) return null;[\s\S]*patchCocoCompositionZones/);
  assert.match(artboardRenderer, /const cocoIterationZones =\s*cocoDirectedRendererActive &&/);
  assert.match(artboardRenderer, /const strictCocoRenderPlanActive = Boolean\(\s*cocoDirectedRendererActive &&/);
  assert.doesNotMatch(artboardRenderer, /if \(!isCocoComposerTemplateActive\) return null;/);
  [
    "renderDetailsSafeFamily",
    "renderHead2SafeFamily",
    "renderDetails2SafeFamily",
    "renderVenueSafeFamily",
    "renderPresenterSafeFamily",
    "renderDateSafeFamily",
    "renderPriceSafeFamily",
    "renderComplianceFamily",
  ].forEach((binding) => {
    assert.match(
      artboardRenderer,
      new RegExp(`const ${binding} = cocoDirectedRendererActive`),
      `${binding} must keep native Coco output inside the coordinated font policy`
    );
  });

  ["details", "venue", "presenter", "date"].forEach((source) => {
    assert.match(
      appSource,
      new RegExp(`!cocoTypographyStackOwns\\("${source}"\\)`),
      `${source} legacy node must remain subordinate to Coco ownership`
    );
  });
});

test("native winning templates reflow their complete title lockup around the transformed face", () => {
  const avoidance = appSource.slice(
    appSource.indexOf("function applyCocoNativeFaceAvoidance"),
    appSource.indexOf("type CocoRendererZoneMap")
  );
  assert.match(avoidance, /const faceBottom = Number\(faceZone\.y\) \+ Number\(faceZone\.height\)/);
  assert.match(avoidance, /const desiredHeadlineY = Math\.max/);
  assert.match(avoidance, /headY: headlineY \+ shift/);
  assert.match(avoidance, /presenterToHeadlineGap/);
  assert.match(avoidance, /presenterY: Number\.isFinite\(presenterY\)/);
  assert.match(avoidance, /overlapsExpandedFace/);
  assert.match(avoidance, /adjustedHead2X/);
  assert.match(avoidance, /adjustedHeadlineSize/);
  assert.match(avoidance, /rightRailY: shiftNearbyY/);
  assert.match(avoidance, /emojiList: shiftAssets/);
  assert.match(appSource, /resolveCocoNativeVariantFaceZone\(generatedSource, formatName\)/);
  assert.match(appSource, /resolveCocoRendererFaceZone\(store, format, \{/);
  assert.match(appSource, /cloneTemplateSessionVariant\(faceAdjustedReferenceSource\)/);
  assert.match(appSource, /cloneTemplateSessionVariant\(faceAdjustedSourceVariant\)/);
  assert.match(appSource, /data-coco-native-face-shift/);
  assert.match(appSource, /cocoNativeFaceReflowSignatureRef/);
  assert.match(appSource, /\[\s*bgPosX,\s*bgPosY,\s*bgRotate,\s*bgScale,/);
});

test("the latest scene survives rerenders and freezes the procedural director", () => {
  const referenceSearchEffect = appSource.slice(
    appSource.indexOf("cocoVisualReferenceDesiredSceneRef.current = sceneSignature"),
    appSource.indexOf("let mounted = true", appSource.indexOf("cocoVisualReferenceDesiredSceneRef.current = sceneSignature"))
  );
  assert.match(
    appSource,
    /cocoVisualReferenceSceneRef\.current === sceneSignature &&\s*cocoVisualReferenceSearch\.status === "ready"/
  );
  assert.doesNotMatch(
    appSource,
    /cocoVisualReferenceSearch\.status === "loading" \|\| cocoVisualReferenceSearch\.status === "ready"/
  );
  assert.match(appSource, /cocoVisualReferenceDesiredSceneRef\.current !== sceneSignature/);
  assert.match(appSource, /cocoVisualReferencePendingSceneRef\.current === sceneSignature/);
  assert.match(appSource, /setCocoVisualReferenceTriggerEpoch\(\(current\) => current \+ 1\)/);
  assert.doesNotMatch(referenceSearchEffect, /window\.clearTimeout\(timer\)/);
  assert.match(
    appSource,
    /enabled=\{canBuildCocoSubjectComposition && cocoVisualReferenceSearch\.status === "idle"\}/
  );
});
