import test from "node:test";
import assert from "node:assert/strict";

import { runSceneInterpreterTests } from "../coco-scene-interpreter/tests.ts";
import { interpretCocoScene } from "../coco-scene-interpreter/interpreter.ts";
import { MOJITO_SCENE_FIXTURE } from "../coco-scene-interpreter/fixtures.ts";
import { buildCocoCreativeBrief } from "../components/coco/creativeIntelligence/engine.ts";
import { chooseCocoComposition } from "../components/coco/compositionDirector.ts";
import { buildSceneInterpreterInput } from "../components/coco/sceneInterpreterAdapter.ts";
import type { CocoCompositionMap } from "../lib/coco/compositionAnalyzer.ts";
import type { CocoTournamentZoneMap } from "../components/coco/layoutTournament/types.ts";

test("scene interpreter fixture produces creative decisions for Mojito brunch", () => {
  const scene = runSceneInterpreterTests();

  assert.equal(scene.creativeDecisions.story, "luxury-tropical-brunch");
  assert.equal(scene.creativeDecisions.composition.typeField, "left");
  assert.equal(scene.creativeDecisions.composition.preferredPattern, "left-premium-stack");
  assert.equal(scene.creativeDecisions.densityPolicy.mergeSecondaryCopy, true);
});

test("creative brief consumes scene decisions before composition", () => {
  const scene = interpretCocoScene(MOJITO_SCENE_FIXTURE);
  const subjectZone = { align: "center" as const, height: 98, width: 53, x: 47, y: 2 };
  const faceZone = { align: "center" as const, height: 32, width: 29, x: 59, y: 14 };
  const text = {
    date: "Sat June 28 • 10PM",
    details: "Tropical rhythms • Afrobeats • Latin",
    details2: "Cocktails and island energy",
    headline: "Mojito Mondaze",
    price: "Entry $50",
    script: "Brunch Vibes",
    venue: "Venue Name",
  };
  const brief = buildCocoCreativeBrief({
    eventName: "Mojito Mondaze",
    faceZone,
    format: "square",
    hasSubject: true,
    scene,
    subjectZone,
    text,
  });

  assert.equal(brief.storyId, "luxury-tropical-brunch");
  assert.equal(brief.recommendedLayoutId, "subject-right");
  assert.equal(brief.recommendedComposition, "left-premium-stack");
  assert.equal(brief.polishRules?.useOneTypeColumn, true);
  assert.equal(brief.polishRules?.mergeSecondaryCopy, true);
  assert.equal(brief.hierarchyRules?.accentMaxRatio, scene.creativeDecisions.hierarchy.accentMaxRatio);
  assert.ok(brief.protection.forbiddenZones?.some((zone) => zone.x >= 59 && zone.y >= 14));

  const zones: CocoTournamentZoneMap = {
    date: { align: "left", height: 5, width: 25, x: 6, y: 64 },
    headline: { align: "left", height: 20, width: 45, x: 6, y: 15 },
    leftInfo: { align: "left", height: 8, width: 35, x: 6, y: 47 },
    presenter: { align: "left", height: 4, width: 30, x: 6, y: 5 },
    price: { align: "center", height: 10, width: 12, x: 78, y: 7 },
    rightInfo: { align: "left", height: 1, width: 1, x: 6, y: 56 },
    script: { align: "left", height: 6, width: 30, x: 6, y: 37 },
    subject: subjectZone,
    subtag: { align: "left", height: 4, width: 20, x: 6, y: 75 },
    venue: { align: "left", height: 5, width: 35, x: 6, y: 73 },
  };
  const composition = chooseCocoComposition({
    brief,
    faceZone,
    format: "square",
    hasSubject: true,
    layoutId: "subject-right",
    scene,
    subjectZone,
    text,
    zones,
  });

  assert.equal(composition.patternId, "left-premium-stack");
  assert.equal(composition.textColumn.x, scene.creativeDecisions.composition.stackRect.x);
  assert.ok(
    Math.abs(composition.textColumn.width - scene.creativeDecisions.composition.stackRect.width) < 0.001
  );
});

test("composition rejects center and bottom stacks when the scene needs a left counterweight", () => {
  const scene = interpretCocoScene(MOJITO_SCENE_FIXTURE);
  const badPreferredScene = {
    ...scene,
    creativeDecisions: {
      ...scene.creativeDecisions,
      composition: {
        ...scene.creativeDecisions.composition,
        preferredPattern: "bottom-lockup" as const,
        stackAlignment: "center" as const,
        stackRect: { height: 34, width: 84, x: 8, y: 60 },
        typeField: "left" as const,
        visualWeight: "right" as const,
      },
    },
  };
  const subjectZone = { align: "center" as const, height: 98, width: 53, x: 47, y: 2 };
  const faceZone = { align: "center" as const, height: 32, width: 29, x: 59, y: 14 };
  const text = {
    date: "Sat June 28 • 10PM",
    details: "Tropical rhythms • Afrobeats • Latin",
    details2: "Cocktails and island energy",
    headline: "Mojito Mondaze",
    price: "Entry $50",
    script: "Brunch Vibes",
    venue: "Venue Name",
  };
  const brief = buildCocoCreativeBrief({
    eventName: "Mojito Mondaze",
    faceZone,
    format: "square",
    hasSubject: true,
    scene: badPreferredScene,
    subjectZone,
    text,
  });
  const zones: CocoTournamentZoneMap = {
    date: { align: "left", height: 5, width: 25, x: 6, y: 64 },
    headline: { align: "left", height: 20, width: 45, x: 6, y: 15 },
    leftInfo: { align: "left", height: 8, width: 35, x: 6, y: 47 },
    presenter: { align: "left", height: 4, width: 30, x: 6, y: 5 },
    price: { align: "center", height: 10, width: 12, x: 78, y: 7 },
    rightInfo: { align: "left", height: 1, width: 1, x: 6, y: 56 },
    script: { align: "left", height: 6, width: 30, x: 6, y: 37 },
    subject: subjectZone,
    subtag: { align: "left", height: 4, width: 20, x: 6, y: 75 },
    venue: { align: "left", height: 5, width: 35, x: 6, y: 73 },
  };

  const composition = chooseCocoComposition({
    brief,
    faceZone,
    format: "square",
    hasSubject: true,
    layoutId: "subject-center",
    scene: badPreferredScene,
    subjectZone,
    text,
    zones,
  });

  assert.equal(composition.patternId, "left-premium-stack");
  assert.equal(composition.anchorSide, "left");
  assert.equal(composition.layoutId, "subject-right");
});

test("scene adapter does not turn layout zones into fake visual detections", () => {
  const input = buildSceneInterpreterInput({
    eventName: "Mojito Mondaze",
    faceZone: { align: "center", height: 32, width: 29, x: 59, y: 14 },
    format: "square",
    hasSubject: true,
    preferredLayoutId: "subject-right",
    subjectZone: { align: "center", height: 98, width: 53, x: 47, y: 2 },
    text: {
      headline: "Mojito Mondaze",
      script: "Brunch Vibes",
    },
  });

  assert.equal(input.detections?.subjects?.length, 0);
  assert.equal(input.detections?.faces?.length, 0);
  assert.equal(input.detections?.negativeSpace?.length, 0);
  assert.equal(input.detections?.segmentations?.length, 0);
  assert.equal(input.preferredLayoutId, "subject-right");
});

test("scene adapter uses real subject, face, and composition-map evidence", () => {
  const compositionMap = buildTestCompositionMap();
  const input = buildSceneInterpreterInput({
    compositionMap,
    eventName: "Mojito Mondaze",
    faceZone: { align: "center", height: 32, width: 29, x: 59, y: 14 },
    format: "square",
    hasSubject: true,
    preferredLayoutId: "subject-right",
    subjectBounds: {
      width: 1000,
      height: 1000,
      alpha: { x: 350, y: 20, width: 590, height: 960 },
      core: { x: 420, y: 80, width: 430, height: 820 },
      face: { x: 520, y: 140, width: 260, height: 310, confidence: 0.91 },
      coreMode: "face-anchor",
    },
    subjectZone: { align: "center", height: 98, width: 53, x: 47, y: 2 },
    text: {
      headline: "Mojito Mondaze",
      script: "Brunch Vibes",
    },
  });

  assert.equal(input.detections?.subjects?.length, 1);
  assert.equal(input.detections?.faces?.length, 1);
  assert.equal(input.detections?.negativeSpace?.length, 2);
  assert.equal(input.detections?.segmentations?.length, 1);
  assert.equal(input.detections?.faces?.[0]?.confidence, 0.91);
  assert.equal(input.preferredLayoutId, null);
  assert.deepEqual(input.detections?.negativeSpace?.[0]?.rect, {
    x: 5,
    y: 13,
    width: 42,
    height: 64,
  });
});

test("scene adapter trusts uploaded subject bounds before recipe subject zones", () => {
  const compositionMap = buildTestCompositionMap({
    bestTextZone: { x: 55, y: 15, width: 38, height: 60, score: 92, label: "right-type-field" },
    subjectZone: { x: 2, y: 2, width: 45, height: 96, score: 85, label: "subject-left" },
  });
  const input = buildSceneInterpreterInput({
    compositionMap,
    eventName: "Martini Sundaze",
    faceZone: { align: "center", height: 28, width: 24, x: 58, y: 14 },
    format: "square",
    hasSubject: true,
    preferredLayoutId: "subject-right",
    subjectBounds: {
      width: 1000,
      height: 1000,
      alpha: { x: 25, y: 20, width: 455, height: 960 },
      face: { x: 80, y: 120, width: 220, height: 280, confidence: 0.9 },
      coreMode: "face-anchor",
    },
    subjectZone: { align: "center", height: 91, width: 37, x: 63, y: 8.5 },
    text: {
      headline: "Martini Sundaze",
      script: "Chic Brunch",
    },
  });
  const subject = input.detections?.subjects?.[0];
  assert.ok(subject);
  assert.equal(subject.rect.x, 2.5);
  assert.equal(subject.rect.width, 45.5);
  assert.equal(input.preferredLayoutId, null);

  const scene = interpretCocoScene(input);
  assert.equal(scene.evidence.subjects[0]?.side, "left");
  assert.equal(scene.creativeDecisions.composition.typeField, "right");
  assert.equal(scene.creativeDecisions.composition.preferredPattern, "right-premium-stack");
});

test("scene adapter derives background hero subject from detected face, not layout zone", () => {
  const input = buildSceneInterpreterInput({
    compositionMap: buildTestCompositionMap({
      bestTextZone: { x: 55, y: 15, width: 38, height: 60, score: 92, label: "right-type-field" },
      subjectZone: { x: 63, y: 8, width: 37, height: 91, score: 85, label: "layout-subject-right" },
    }),
    eventName: "Martini Sundaze",
    faceZone: { align: "center", height: 28, width: 24, x: 58, y: 14 },
    format: "square",
    hasSubject: true,
    heroImageFace: {
      x: 80,
      y: 120,
      width: 220,
      height: 280,
      confidence: 0.9,
      imageWidth: 1000,
      imageHeight: 1000,
    },
    preferredLayoutId: "subject-right",
    subjectZone: { align: "center", height: 91, width: 37, x: 63, y: 8.5 },
    text: {
      headline: "Martini Sundaze",
      script: "Chic Brunch",
    },
  });

  const subject = input.detections?.subjects?.[0];
  const face = input.detections?.faces?.[0];
  assert.ok(subject);
  assert.ok(face);
  // The adapter now prefers `faceZone` (already in canvas-percent space,
  // matching the rest of this fixture's right-side scene: subjectZone at
  // x=63, preferredLayoutId "subject-right") over naively converting
  // heroImageFace's raw source-image pixels, which ignored how the
  // background photo was actually panned/scaled by buildCocoHeroImageFit
  // and produced a face anchor inconsistent with the rest of the scene.
  assert.ok(subject.rect.x > 30);
  assert.ok(subject.rect.width < 64);
  assert.equal(face.rect.x, 58);
  assert.equal(input.preferredLayoutId, null);

  const scene = interpretCocoScene(input);
  assert.equal(scene.evidence.subjects[0]?.side, "right");
  assert.equal(scene.creativeDecisions.composition.typeField, "right");
});

test("scene adapter rejects full-frame alpha as subject and falls back to face anchor", () => {
  const input = buildSceneInterpreterInput({
    compositionMap: buildTestCompositionMap({
      bestTextZone: { x: 55, y: 15, width: 38, height: 60, score: 92, label: "right-type-field" },
      subjectZone: { x: 63, y: 8, width: 37, height: 91, score: 85, label: "layout-subject-right" },
    }),
    eventName: "Martini Sundaze",
    faceZone: { align: "center", height: 28, width: 24, x: 58, y: 14 },
    format: "square",
    hasSubject: true,
    preferredLayoutId: "subject-right",
    subjectBounds: {
      width: 1000,
      height: 1000,
      alpha: { x: 0, y: 0, width: 1000, height: 1000 },
      face: { x: 80, y: 120, width: 220, height: 280, confidence: 0.9 },
      coreMode: "face-anchor",
    },
    subjectZone: { align: "center", height: 91, width: 37, x: 63, y: 8.5 },
    text: {
      headline: "Martini Sundaze",
      script: "Chic Brunch",
    },
  });

  const subject = input.detections?.subjects?.[0];
  assert.ok(subject);
  // The adapter now prefers `faceZone` (already in canvas-percent space,
  // matching the rest of this fixture's right-side scene: subjectZone at
  // x=63, preferredLayoutId "subject-right") over naively converting
  // subjectBounds.face's raw source-image pixels, which ignored how the
  // photo was actually fit/scaled onto the canvas and produced a face
  // anchor inconsistent with the rest of the scene.
  assert.ok(subject.rect.x > 30);
  assert.ok(subject.rect.width < 64);
  assert.ok(subject.rect.height < 100);

  const scene = interpretCocoScene(input);
  assert.equal(scene.evidence.subjects[0]?.side, "right");
  assert.equal(scene.creativeDecisions.composition.typeField, "right");
});

function buildTestCompositionMap(
  overrides: {
    bestTextZone?: CocoCompositionMap["bestTextZones"][number];
    subjectZone?: CocoCompositionMap["subjectZones"][number];
  } = {}
): CocoCompositionMap {
  return {
    width: 1080,
    height: 1080,
    faceZones: [{ x: 59, y: 14, width: 29, height: 32, score: 86, label: "face" }],
    subjectZones: [overrides.subjectZone ?? { x: 47, y: 2, width: 53, height: 98, score: 82, label: "subject" }],
    busyZones: [],
    darkZones: [],
    brightZones: [],
    emptyZones: [{ x: 8, y: 18, width: 35, height: 42, score: 74, label: "empty-left" }],
    bestTextZones: [overrides.bestTextZone ?? { x: 5, y: 13, width: 42, height: 64, score: 91, label: "left-type-field" }],
    compositionPlans: [],
    metadata: {
      generatedAt: 1,
      source: "canvas-pixel-scan",
      transformers: "not-loaded",
      transformersPackage: "unavailable",
      visionInference: "not-run",
    },
  };
}
