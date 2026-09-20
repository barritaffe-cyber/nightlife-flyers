import assert from "node:assert/strict";
import test from "node:test";
import {
  runCocoPipeline,
  runCocoPipelineWithCritiqueLoop,
  type CocoPipelineInput,
} from "../components/coco/pipeline/index.ts";
import { chooseCocoComposition } from "../components/coco/compositionDirector.ts";
import { chooseCocoTypography } from "../components/coco/typographyDirector/engine.ts";
import { buildCocoMoodProfile } from "../components/coco/moodDirector/engine.ts";
import type {
  CocoConceptEffectsLike,
  CocoConceptLayoutPlan,
  CocoConceptPaletteLike,
  CocoConceptPickerInput,
} from "../components/coco/conceptDirector/types.ts";
import {
  COCO_CONCEPT_DIRECTIONS,
  type CocoConceptDirectionId,
} from "../components/coco/conceptDirector/directions.ts";
import type { CocoTournamentRect, CocoTournamentZoneMap } from "../components/coco/layoutTournament/types.ts";

const rect = (x: number, y: number, width: number, height: number): CocoTournamentRect => ({
  height,
  width,
  x,
  y,
});

const zones: CocoTournamentZoneMap = {
  date: rect(8, 72, 28, 8),
  headline: rect(8, 18, 38, 22),
  leftInfo: rect(8, 48, 38, 10),
  presenter: rect(8, 6, 42, 5),
  price: rect(8, 8, 11, 11),
  rightInfo: rect(8, 59, 35, 8),
  script: rect(8, 41, 36, 7),
  subject: rect(53, 8, 38, 84),
  subtag: rect(8, 47, 38, 6),
  venue: rect(8, 82, 38, 6),
};

const text = {
  date: "SAT JUNE 28 • 10PM",
  details: "Tropical Rhythms • Afrobeats • Latin",
  details2: "Cocktails & Island Energy",
  headline: "MOJITO MONDAZE",
  presenter: "Presenter Here",
  price: "Entry $50",
  script: "Brunch Vibes",
  subtag: "Brunch Vibes",
  venue: "Venue Name Address",
};

test("Coco pipeline returns one ordered authority chain", async () => {
  const moodProfile = buildCocoMoodProfile({
    event: {
      description: [text.details, text.details2].join(" "),
      subtitle: text.script,
      title: text.headline,
      venue: text.venue,
    },
    nightlifeStyle: "brunch",
  });

  const pipelineInput = {
    sceneInput: {
      compositionMap: {
        bestTextZones: [{ ...rect(6, 14, 38, 58), label: "text-opportunity", score: 91 }],
        brightZones: [],
        busyZones: [],
        compositionPlans: [],
        darkZones: [],
        emptyZones: [{ ...rect(6, 14, 38, 58), label: "background", score: 0.86 }],
        faceZones: [{ ...rect(62, 16, 20, 18), label: "face", score: 0.9 }],
        height: 1080,
        metadata: {
          generatedAt: 1,
          source: "canvas-pixel-scan",
          transformers: "unavailable",
          transformersPackage: "unavailable",
          visionInference: "external",
        },
        sceneImageAnalysis: {
          backgroundMap: [{ ...rect(6, 14, 38, 58), label: "background", score: 84 }],
          hero: {
            confidence: 0.9,
            rect: { ...rect(53, 8, 38, 84), label: "subject", score: 88 },
            type: "person",
          },
          importanceMap: [{ ...rect(62, 16, 20, 18), label: "face-mask", score: 100 }],
          objects: [
            {
              confidence: 0.9,
              importance: 100,
              protection: "hard",
              rect: { ...rect(62, 16, 20, 18), label: "face-mask", score: 100 },
              type: "face",
            },
            {
              confidence: 0.72,
              importance: 78,
              protection: "hard",
              rect: { ...rect(54, 9, 37, 54), label: "hair-mask", score: 78 },
              type: "hair",
            },
            {
              confidence: 0.7,
              importance: 85,
              protection: "hard",
              rect: { ...rect(52, 63, 18, 14), label: "drink-mask", score: 85 },
              type: "drink",
            },
          ],
          protectionMap: [
            { ...rect(61, 15, 22, 20), label: "protected-face", score: 100 },
            { ...rect(53, 8, 39, 56), label: "protected-hair", score: 78 },
            { ...rect(51, 62, 20, 16), label: "protected-drink", score: 85 },
          ],
          saliencyMap: [{ ...rect(62, 16, 20, 18), label: "saliency-face", score: 96 }],
          scene: {
            confidence: 0.9,
            energy: 0.64,
            mood: ["premium", "lifestyle", "nightlife"],
            type: "nightlife",
          },
          subjectMask: {
            confidence: 0.82,
            coverage: 0.38,
            source: "face-inferred-subject",
            zones: [{ ...rect(53, 8, 38, 84), label: "subject-mask", score: 82 }],
          },
          textOpportunityMap: [{ ...rect(6, 14, 38, 58), label: "text-opportunity", score: 91 }],
        },
        subjectZones: [{ ...rect(53, 8, 38, 84), label: "subject", score: 0.88 }],
        width: 1080,
      },
      eventName: text.headline,
      faceZone: rect(62, 16, 20, 18),
      format: "square",
      hasSubject: true,
      nightlifeStyle: "brunch",
      preferredLayoutId: "subject-right",
      subjectBounds: {
        alpha: { height: 850, width: 420, x: 560, y: 80 },
        face: { confidence: 0.9, height: 190, width: 200, x: 660, y: 135 },
        height: 1080,
        width: 1080,
      },
      subjectZone: zones.subject,
      text,
    },
    renderedSnapshot: {
      elements: [
        {
          align: "left",
          color: "#F4EBDD",
          contrastRatio: 6.8,
          effects: { blur: 0, glow: 0.04, shadow: 0.12, stroke: 0 },
          fontFamily: "Inter",
          fontSize: 92,
          fontWeight: 800,
          id: "headline",
          lineCount: 2,
          opacity: 1,
          rect: rect(8, 18, 38, 22),
          role: "headline",
          text: "MOJITO\nMONDAZE",
          visible: true,
          visualPower: 100,
        },
        {
          align: "left",
          color: "#D8D1C4",
          contrastRatio: 4.8,
          effects: { blur: 0, glow: 0, shadow: 0.08, stroke: 0 },
          fontFamily: "Inter",
          fontSize: 26,
          fontWeight: 700,
          id: "metadata",
          lineCount: 2,
          opacity: 1,
          rect: rect(8, 48, 36, 10),
          role: "metadata",
          text: "TROPICAL RHYTHMS • AFROBEATS • LATIN\nCOCKTAILS & ISLAND ENERGY",
          visible: true,
          visualPower: 24,
        },
        {
          align: "left",
          color: "#D8D1C4",
          contrastRatio: 4.5,
          effects: { blur: 0, glow: 0, shadow: 0.05, stroke: 0 },
          fontFamily: "Inter",
          fontSize: 22,
          fontWeight: 700,
          id: "dateTime",
          lineCount: 1,
          opacity: 1,
          rect: rect(8, 62, 28, 6),
          role: "dateTime",
          text: "SAT JUNE 28 • 10PM",
          visible: true,
          visualPower: 22,
        },
        {
          align: "left",
          color: "#D8D1C4",
          contrastRatio: 4.1,
          effects: { blur: 0, glow: 0, shadow: 0.04, stroke: 0 },
          fontFamily: "Inter",
          fontSize: 18,
          fontWeight: 600,
          id: "venue",
          lineCount: 1,
          opacity: 0.9,
          rect: rect(8, 72, 30, 5),
          role: "venue",
          text: "VENUE NAME ADDRESS",
          visible: true,
          visualPower: 16,
        },
      ],
      faceRect: rect(62, 16, 20, 18),
      format: "square",
      globalMetrics: {
        exportClipped: false,
        previewExportMatch: true,
        safeMarginViolations: 0,
        strongColorCount: 3,
        uniqueFontCount: 1,
        visibleGroupCount: 4,
      },
      height: 1080,
      subjectRect: zones.subject,
      width: 1080,
    },
    conceptInput: {
      availableFonts: {
        body: ["Inter", "Bebas Neue"],
        headline: ["Bebas Neue"],
        headline2: ["Good Brush", "Inter"],
        utility: ["Inter"],
      },
      baseMoodProfile: moodProfile,
      baseZones: zones,
      chooseComposition: (input) =>
        chooseCocoComposition({
          backgroundOnlyHero: input.backgroundOnlyHero,
          brief: input.brief,
          eventName: input.eventName,
          faceZone: input.faceZone,
          format: input.format,
          hasSubject: input.hasSubject,
          layoutId: input.layoutId,
          scene: input.scene,
          subjectZone: input.subjectZone,
          text: input.text,
          zones: input.layout.zones,
        }),
      chooseEffects: () => ({ preset: "existing-app-treatment" }),
      chooseLayout: (input: CocoConceptPickerInput): CocoConceptLayoutPlan => ({
        layoutId: input.layoutId,
        patternId: input.direction.id,
        zones,
      }),
      choosePalette: () => ({
        details: "#f7f0d2",
        headline: "#fff3a5",
        palette: {
          accent: "#d6f25a",
          bgFrom: "#063b22",
          bgTo: "#03170f",
          primary: "#fff3a5",
        },
        venue: "#f4e8bf",
      }),
      chooseTypography: (input) =>
        chooseCocoTypography({
          availableFonts: {
            body: ["Inter", "Bebas Neue"],
            headline: ["Bebas Neue"],
            headline2: ["Good Brush", "Inter"],
            utility: ["Inter"],
          },
          composition: input.layout?.composition,
          eventName: input.eventName,
          format: input.format,
          layoutId: input.layoutId,
          moodProfile: input.moodProfile,
          nightlifeStyle: input.nightlifeStyle,
          text: input.text,
          zones,
        }),
      event: {
        description: [text.details, text.details2].join(" "),
        subtitle: text.script,
        title: text.headline,
        venue: text.venue,
      },
      eventName: text.headline,
      faceZone: rect(62, 16, 20, 18),
      forcedLayoutId: "subject-center",
      format: "square",
      hasSubject: true,
      nightlifeStyle: "brunch",
      preferredLayoutId: "subject-right",
      subjectZone: zones.subject,
      text,
    },
  } satisfies CocoPipelineInput<CocoConceptPaletteLike, CocoConceptEffectsLike>;

  const result = runCocoPipeline<CocoConceptPaletteLike, CocoConceptEffectsLike>(pipelineInput);

  assert.deepEqual(
    result.stages.map((stage) => stage.id),
    [
      "scene-interpreter",
      "creative-director",
      "composition-director",
      "copy-architect",
      "typography-director",
      "color-director",
      "typography-stack",
      "effects-director",
      "layout-tournament",
      "renderer",
      "art-director",
      "critique-loop",
    ]
  );
  const stageIds = result.stages.map((stage) => stage.id);
  assert.ok(stageIds.indexOf("typography-stack") < stageIds.indexOf("layout-tournament"));
  assert.ok(stageIds.indexOf("color-director") < stageIds.indexOf("typography-stack"));
  assert.ok(result.typographyStack);
  assert.equal(result.typographyStack, result.winner.typographyStack);
  assert.equal(result.typographyStack.debug?.reason, "Pipeline rebuilt CocoTypographyStackModel from Coco Typography Director authority.");
  assert.ok(result.creativeDirector);
  assert.ok(result.compositionDirector);
  assert.ok(result.compositionCandidate);
  assert.ok(result.copyArchitect);
  assert.ok(result.copyRenderModel);
  assert.ok(result.typographyDirector);
  assert.ok(result.typographyRenderModel);
  assert.ok(result.colorDirector);
  assert.ok(result.colorRenderModel);
  assert.ok(result.cocoArtDirector);
  assert.equal(result.renderedSnapshot?.width, 1080);
  assert.equal(result.creativeDirection?.posterDNA, "tropical-lifestyle");
  assert.equal(result.creativeDirection?.posterIdentity, "lifestyle-editorial");
  assert.equal(result.creativeDirection?.marketingGoal, "sell-lifestyle");
  assert.equal(result.creativeDirection?.informationDensity, "low");
  assert.equal(result.creativeDirection?.composition.family, "left-premium-stack");
  assert.equal(result.creativeDirection?.composition.typeField, "left");
  assert.equal(result.creativeDirection?.effects.policy, "restrained");
  assert.equal(result.creativeBrief.storyId, "luxury-tropical-brunch");
  assert.equal(result.winner.brief, result.creativeBrief);
  assert.equal(result.compositionCandidate?.typeField, "left");
  assert.equal(result.compositionCandidate?.family, "left-premium-stack");
  assert.equal(result.winner.layout.composition?.explanation.startsWith("Coco Composition Director selected"), true);
  assert.equal(result.copyArchitect?.winner.pattern, "identity-emotion-metadata-logistics");
  assert.equal(result.copyRenderModel?.density, "low");
  assert.ok(result.copyRenderModel?.owns.includes("headline"));
  assert.ok(result.copyRenderModel?.items.some((item) => item.role === "experience" && item.text.includes("TROPICAL")));
  assert.ok(result.typographyRenderModel?.roles.some((role) => role.role === "headline"));
  assert.ok(result.typography.rendererMustObey.includes("render-typography-from-typography-director-model"));
  assert.ok(result.colorRenderModel?.roles.some((role) => role.role === "headline"));
  assert.ok(result.colorAuthority.rendererMustObey.includes("render-colors-from-color-director-model"));
  assert.ok(result.renderer.rendererMustObey.includes("color-director-must-obey:role colors"));
  assert.ok(result.renderer.rendererMustObey.includes("art-director-must-obey:scene protection constraints"));
  assert.equal(
    result.winner.palette.headline,
    result.colorRenderModel?.roles.find((role) => role.role === "headline")?.color
  );
  assert.equal(result.typographyStack.items.find((item) => item.kind === "headline")?.text, "MOJITO\nMONDAZE");
  assert.ok(result.conceptTournament.finalists.every((concept) => concept.typographyStack));
  assert.ok(result.typographyStack.ownedSources.includes("headline"));
  assert.ok(result.typographyStack.ownedSources.includes("script"));
  assert.ok(result.typographyStack.ownedSources.includes("details"));
  const headlineFont = result.typographyStack.items.find((item) => item.kind === "headline")?.style.fontFamily ?? "";
  const accentFont = result.typographyStack.items.find((item) => item.kind === "accent")?.style.fontFamily ?? "";
  assert.doesNotMatch(headlineFont, /bebas|anton|coolvetica|cond|comp/i);
  assert.doesNotMatch(accentFont, /bebas|anton|coolvetica|cond|comp/i);
  assert.equal(result.scene?.creativeDecisions.story, "luxury-tropical-brunch");
  assert.equal(result.scene?.creativeDecisions.composition.typeField, "left");
  assert.equal(result.sceneAuthority?.composition.typeField, "left");
  assert.equal(result.sceneAuthority?.composition.pattern, "left-premium-stack");
  assert.equal(result.sceneAuthority?.typography.policy, "clean-lifestyle");
  assert.equal(result.sceneAuthority?.palette.id, "tropical-emerald");
  assert.equal(result.sceneAuthority?.effects.policy, "restrained");
  assert.ok(result.sceneAuthority?.hardConstraints.includes("single-type-column"));
  assert.ok(result.sceneAuthority?.hardConstraints.includes("protect-critical-features"));
  assert.ok(result.sceneAuthority?.protectionZones.some((zone) => zone.target === "face"));
  assert.ok(result.sceneAuthority?.imageAnalysis);
  assert.equal(result.sceneAuthority?.rendererProtectionMap.length, 3);
  assert.equal(result.sceneAuthority?.textOpportunityMap.length, 1);
  assert.ok(result.sceneAuthority?.rendererMustObey.includes("renderer-must-use-scene-image-analysis"));
  assert.ok(result.sceneAuthority?.rendererMustObey.includes("renderer-must-enforce-scene-image-protection-map"));
  assert.ok(result.sceneAuthority?.rendererMustObey.includes("renderer-must-place-stack-inside-text-opportunity-map"));
  assert.ok(result.sceneAuthority?.rendererMustObey.includes("renderer-must-enforce-scene-protection-zones"));
  assert.equal(result.winner.layout.layoutId, "subject-right");
  assert.equal(result.winner.layout.composition?.patternId, "left-premium-stack");
  assert.equal(result.effects.mode, "restrained");
  assert.ok(result.effects.forbidden.includes("date-module"));
  assert.ok(result.effects.forbidden.includes("underline-slash"));
  assert.equal(result.renderPlan.mode, "strict-coco");
  assert.equal(result.renderPlan.strict, true);
  assert.ok(result.renderPlan.ownedSources.includes("headline"));
  assert.ok(result.renderPlan.ownedSources.includes("script"));
  assert.ok(result.renderPlan.forbiddenEffects.includes("underline-slash"));
  assert.ok(result.renderPlan.scene);
  assert.ok(result.renderPlan.scene?.hardConstraints.includes("single-type-column"));
  assert.ok(result.renderPlan.scene?.protectionZones.some((zone) => zone.target === "face"));
  assert.equal(result.renderPlan.scene?.imageAnalysis?.subjectMask.source, "face-inferred-subject");
  assert.equal(result.renderPlan.scene?.rendererProtectionMap.length, 3);
  assert.equal(result.renderPlan.scene?.textOpportunityMap.length, 1);
  assert.ok(result.renderPlan.rendererMustObey.includes("render-from-scene-image-analysis-authority"));
  assert.ok(result.renderPlan.rendererMustObey.includes("reject-overlap-with-scene-image-protection-map"));
  assert.ok(result.renderPlan.rendererMustObey.includes("place-text-inside-scene-text-opportunity-map"));
  assert.ok(result.renderPlan.rendererMustObey.includes("render-owned-sources-only-through-typography-stack"));
  assert.ok(result.renderPlan.rendererMustObey.includes("do-not-add-renderer-side-separators"));
  assert.ok(result.renderPlan.rendererMustObey.includes("reject-overlap-above-scene-protection-allowance"));
  assert.ok(result.renderPlan.rendererMustObey.includes("treat-hard-scene-constraints-as-render-blockers"));
  assert.ok(result.renderer.rendererMustObey.includes("no-renderer-side-effects"));
  assert.ok(result.renderer.rendererMustObey.includes("composition-director-must-obey:winner.textColumn"));
  assert.ok(result.renderer.rendererMustObey.includes("do-not-render-forbidden-effects"));
  assert.ok(result.renderer.rendererMustObey.includes("renderer-must-respect-scene-density-policy"));
  assert.ok(result.copyArchitecture.rendererMustObey.includes("do-not-render-owned-sources-outside-stack"));
  assert.ok(result.copyArchitecture.rendererMustObey.includes("copy-architect-must-obey:group text"));
  assert.ok(result.renderer.rendererMustObey.includes("copy-architect-must-obey:source ownership"));
  assert.ok(result.renderer.rendererMustObey.includes("typography-director-must-obey:font family"));
  assert.equal(result.critiqueLoop, null);

  type DirectionPalette = CocoConceptPaletteLike & {
    directionId: CocoConceptDirectionId;
  };
  type DirectionEffects = CocoConceptEffectsLike & {
    directionId: CocoConceptDirectionId;
    preset: string;
  };
  const selectedDirectionIds = [
    "high-energy-club",
    "fashion-club-vertical",
    "baddies-n-bundles",
    "sensual-night",
  ] satisfies CocoConceptDirectionId[];
  const selectedContracts = {
    "fashion-club-vertical": {
      effectsMode: "high-energy",
      // The fixture's protected face map makes the recipe's centered candidate unsafe.
      layoutId: "subject-right",
      palettePolicy: "burgundy-intimate",
      preferredComposition: "fashion-club-vertical",
      typographyPersonality: "fashion-serif",
    },
    "baddies-n-bundles": {
      effectsMode: "high-energy",
      layoutId: "subject-right",
      palettePolicy: "industrial-monochrome",
      preferredComposition: "diagonal-energy",
      typographyPersonality: "urban-heavy",
    },
    "high-energy-club": {
      effectsMode: "high-energy",
      layoutId: "subject-center",
      palettePolicy: "electric-night",
      preferredComposition: "center-hero-event-poster",
      typographyPersonality: "electric-display",
    },
    "sensual-night": {
      effectsMode: "restrained",
      layoutId: "subject-center",
      palettePolicy: "burgundy-intimate",
      preferredComposition: "center-poster-stack",
      typographyPersonality: "luxury-serif",
    },
  } as const;
  const rankedDirectionIds = result.conceptTournament.finalists.map(
    (concept) => concept.direction.id
  );
  const selectedResults = selectedDirectionIds.map((selectedDirectionId) =>
    runCocoPipeline<DirectionPalette, DirectionEffects>({
      ...pipelineInput,
      conceptInput: {
        ...pipelineInput.conceptInput,
        chooseEffects: ({ direction }) => ({
          directionId: direction.id,
          preset: direction.effectsStyle,
        }),
        choosePalette: ({ direction }) => ({
          details: "#f7f0d2",
          directionId: direction.id,
          headline: "#fff3a5",
          palette: {
            accent: "#d6f25a",
            bgFrom: "#063b22",
            bgTo: "#03170f",
            primary: "#fff3a5",
          },
          venue: "#f4e8bf",
        }),
      },
      selectedDirectionId,
    })
  );

  selectedResults.forEach((selectedResult, index) => {
    const selectedDirectionId = selectedDirectionIds[index];
    const expectedDirection = COCO_CONCEPT_DIRECTIONS.find(
      (direction) => direction.id === selectedDirectionId
    );
    assert.ok(expectedDirection);
    assert.equal(selectedResult.winner.direction.id, selectedDirectionId);
    assert.equal(selectedResult.winner.stage, "improved");
    assert.equal(selectedResult.conceptTournament.winner, selectedResult.winner);
    assert.equal(selectedResult.winner.moodProfile.primaryMood, expectedDirection.moodId);
    assert.equal(selectedResult.winner.palette.directionId, selectedDirectionId);
    const rawEffects = selectedResult.effects.rawEffects;
    assert.ok(rawEffects);
    assert.equal(rawEffects.directionId, selectedDirectionId);
    assert.deepEqual(
      selectedResult.conceptTournament.finalists.map((concept) => concept.direction.id),
      rankedDirectionIds
    );
    assert.equal(selectedResult.winner.brief, selectedResult.creativeBrief);
    assert.equal(selectedResult.winner.typographyStack, selectedResult.typographyStack);
    assert.ok(selectedResult.sceneAuthority?.hardConstraints.includes("protect-critical-features"));
    const contract = selectedContracts[selectedDirectionId];
    assert.equal(
      selectedResult.winner.layout.layoutId,
      contract.layoutId,
      `${selectedDirectionId} layout`
    );
    assert.equal(
      selectedResult.creativeDirection?.typography.headlinePersonality,
      contract.typographyPersonality
    );
    if (
      selectedResult.typographyDirector?.candidates.some(
        (candidate) => candidate.headline.personality === contract.typographyPersonality
      )
    ) {
      assert.equal(
        selectedResult.typographyDirector.winner.headline.personality,
        contract.typographyPersonality
      );
    }
    assert.equal(selectedResult.colorDirector?.winner.policy, contract.palettePolicy);
    assert.equal(selectedResult.colorRenderModel?.policy, contract.palettePolicy);
    assert.equal(
      selectedResult.effects.mode,
      contract.effectsMode,
      `${selectedDirectionId} effects mode`
    );
    assert.ok(
      selectedResult.renderer.rendererMustObey.includes(
        `selected-direction-composition:${contract.preferredComposition}`
      )
    );
    assert.equal(
      selectedResult.compositionCandidate?.score.hasCriticalProtectionViolation ?? false,
      false
    );
    assert.equal(selectedResult.compositionCandidate?.score.hasBlockOverlap ?? false, false);
    assert.equal(selectedResult.compositionCandidate?.score.hardViolations ?? 0, 0);
  });

  const selectedDirectionContracts = selectedResults.map(({ winner }) =>
    [
      winner.direction.layoutStyle,
      winner.direction.paletteStyle,
      winner.direction.typePersonality,
      winner.direction.effectsStyle,
      winner.moodProfile.primaryMood,
    ].join("|")
  );
  assert.equal(new Set(selectedDirectionContracts).size, selectedDirectionIds.length);

  const critiqueResult = await runCocoPipelineWithCritiqueLoop<
    CocoConceptPaletteLike,
    CocoConceptEffectsLike
  >(pipelineInput);
  assert.ok(critiqueResult.critiqueLoop);
  assert.ok(critiqueResult.critiqueLoop.history.length >= 0);
  assert.ok(
    ["Automatic fixes are disabled.", "No remaining findings."].includes(
      critiqueResult.critiqueLoop.stoppedBecause
    )
  );
  assert.ok(critiqueResult.renderer.rendererMustObey.includes("critique-loop-must-obey:final evaluation"));
  assert.equal(
    critiqueResult.stages.find((stage) => stage.id === "critique-loop")?.status,
    "done"
  );
});
