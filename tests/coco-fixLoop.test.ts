import assert from "node:assert/strict";
import test from "node:test";
import { directCocoArtwork } from "../coco-art-director/index.ts";
import {
  buildRenderedFlyerSnapshotFromPipelineState,
  runCocoPipeline,
  runCocoPipelineWithFixLoop,
} from "../components/coco/pipeline/index.ts";
import { ownerForCategory } from "../components/coco/pipeline/fixLoopRouting.ts";
import { chooseCocoComposition } from "../components/coco/compositionDirector.ts";
import { chooseCocoTypography } from "../components/coco/typographyDirector/engine.ts";
import { buildCocoMoodProfile } from "../components/coco/moodDirector/engine.ts";
import type {
  CocoConceptEffectsLike,
  CocoConceptLayoutPlan,
  CocoConceptPaletteLike,
  CocoConceptPickerInput,
} from "../components/coco/conceptDirector/types.ts";
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

function buildFixturePipelineInput() {
  const moodProfile = buildCocoMoodProfile({
    event: {
      description: [text.details, text.details2].join(" "),
      subtitle: text.script,
      title: text.headline,
      venue: text.venue,
    },
    nightlifeStyle: "brunch",
  });

  return {
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
    conceptInput: {
      availableFonts: {
        body: ["Inter", "Bebas Neue"],
        headline: ["Bebas Neue"],
        headline2: ["Good Brush", "Inter"],
        utility: ["Inter"],
      },
      baseMoodProfile: moodProfile,
      baseZones: zones,
      chooseComposition: (input: any) =>
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
      chooseTypography: (input: any) =>
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
  };
}

test("fix loop routing sends each art-director category to its owning director", () => {
  assert.equal(ownerForCategory("color"), "color");
  assert.equal(ownerForCategory("contrast"), "color");
  assert.equal(ownerForCategory("typography"), "typography");
  assert.equal(ownerForCategory("readability"), "typography");
  assert.equal(ownerForCategory("composition"), "composition");
  assert.equal(ownerForCategory("balance"), "composition");
  assert.equal(ownerForCategory("hierarchy"), "composition");
  assert.equal(ownerForCategory("brandFit"), "not-auto-fixable");
  assert.equal(ownerForCategory("copy"), "not-auto-fixable");
});

test("buildRenderedFlyerSnapshotFromPipelineState produces elements art-director can flag for bad contrast", () => {
  const state = runCocoPipeline<CocoConceptPaletteLike, CocoConceptEffectsLike>(
    buildFixturePipelineInput() as any
  );
  assert.ok(state.colorRenderModel);
  assert.ok(state.compositionCandidate);
  assert.ok(state.typographyStack);

  const spoiledColorRenderModel = {
    ...state.colorRenderModel!,
    roles: state.colorRenderModel!.roles.map((role) =>
      role.role === "metadata"
        ? { ...role, color: role.contrastAgainst ?? "#3A3A3A", contrastRatio: 1.02 }
        : role
    ),
  };

  const snapshot = buildRenderedFlyerSnapshotFromPipelineState({
    colorRenderModel: spoiledColorRenderModel,
    compositionCandidate: state.compositionCandidate,
    format: "square",
    sceneAuthority: state.sceneAuthority,
    typographyStack: state.typographyStack,
  });

  const metadataElement = snapshot.elements.find((element) => element.role === "metadata");
  assert.ok(metadataElement, "metadata element should exist in the snapshot");
  assert.ok((metadataElement!.contrastRatio ?? 99) < 2, "metadata contrast should be spoiled");

  const artDirectorResult = directCocoArtwork({
    renderedSnapshot: snapshot,
    scene: state.scene,
    userPreferences: { allowAutomaticFixes: false, strictness: "balanced" },
  });

  assert.ok(
    artDirectorResult.findings.some((finding) => finding.category === "readability" || finding.category === "contrast"),
    "art-director should flag the spoiled metadata contrast"
  );
});

test("runCocoPipelineWithFixLoop evaluates the design and returns bounded history", () => {
  const input = buildFixturePipelineInput();
  const result = runCocoPipelineWithFixLoop<CocoConceptPaletteLike, CocoConceptEffectsLike>(input as any, {
    maxIterations: 3,
  });

  assert.ok(result.state.cocoArtDirector, "art-director should run as part of the fix loop");
  assert.ok(result.state.renderedSnapshot, "fix loop should build a structured snapshot");
  assert.ok(Array.isArray(result.history));
  assert.ok(result.history.length <= 3);
  assert.equal(typeof result.stoppedBecause, "string");
  assert.ok(result.stoppedBecause.length > 0);

  for (const iteration of result.history) {
    assert.ok(["color", "typography", "composition"].includes(iteration.owner));
    assert.equal(typeof iteration.scoreBefore, "number");
    assert.equal(typeof iteration.scoreAfter, "number");
  }
});

test("runCocoPipelineWithFixLoop respects the maxIterations bound", () => {
  const input = buildFixturePipelineInput();
  const result = runCocoPipelineWithFixLoop<CocoConceptPaletteLike, CocoConceptEffectsLike>(input as any, {
    maxIterations: 1,
  });

  assert.ok(result.history.length <= 1);
});
