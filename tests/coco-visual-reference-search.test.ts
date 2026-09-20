import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import {
  hydrateSelectedReferenceConstruction,
  rankFinishedVisualReferences,
  type VisualReferenceAnalysisInput,
} from "../components/coco/referenceLayouts/visualReferenceSearch.ts";
import {
  mapOptimizedVisualsToTemplates,
  OPTIMIZED_VISUAL_REFERENCE_MANIFEST,
} from "../components/coco/referenceLayouts/optimizedVisualReferences.ts";
import { buildVisualReferenceContactSheet } from "../lib/coco/buildVisualReferenceContactSheet.ts";
import {
  analyzeFinishedVisualReferencesWithOpenAI,
  buildVisualReferenceVisionRequest,
} from "../lib/coco/openAiVisualReferenceAnalyzer.ts";
import type { TemplateSpec } from "../lib/templates.ts";

function referenceCatalog() {
  const templates: TemplateSpec[] = [
    { id: "alpha-template", label: "Alpha", preview: "/a", tags: [], formats: { square: { headlineFamily: "Anton", headX: 10 } } },
    { id: "beta-template", label: "Beta", preview: "/b", tags: [], formats: { square: { headlineFamily: "Bebas Neue", headX: 45 } } },
    { id: "gamma-template", label: "Gamma", preview: "/c", tags: [], formats: { square: { headlineFamily: "Inter", headX: 70 } } },
  ];
  return mapOptimizedVisualsToTemplates(templates, [
    { id: "alpha", imageUrl: "/samples/optimized/afro.webp", templateId: "alpha-template", subjectPosition: "right" },
    { id: "beta", imageUrl: "/samples/optimized/disco.png", templateId: "beta-template", subjectPosition: "center" },
    { id: "gamma", imageUrl: "/samples/optimized/techno.webp", templateId: "gamma-template", subjectPosition: "none" },
  ]);
}

test("vision ranks finished images without receiving coordinates, fonts, or templates", async () => {
  const catalog = referenceCatalog();
  let received: VisualReferenceAnalysisInput | null = null;
  const ranked = await rankFinishedVisualReferences({
    catalog,
    creativeBrief: "A centered, high-energy flyer with a dominant lower headline.",
    currentCanvasImage: "data:image/jpeg;base64,current-canvas",
    limit: 2,
    analyzer: async (input) => {
      received = input;
      return [
        { id: "gamma", score: 82, reason: "Matching directional balance", profile: { balance: "asymmetric", density: "medium", headlineMass: "dominant", subjectInteraction: "overlap" } },
        { id: "alpha", score: 94, reason: "Best subject and headline relationship", profile: { balance: "centered", density: "high", headlineMass: "dominant", subjectInteraction: "frame" } },
        { id: "not-registered", score: 100, reason: "Invalid hallucinated id", profile: { balance: "split", density: "low", headlineMass: "light", subjectInteraction: "avoid" } },
      ];
    },
  });

  assert.ok(received);
  assert.deepEqual(Object.keys(received.references[0]).sort(), ["id", "imageUrl"]);
  assert.equal(JSON.stringify(received).includes("headlineFamily"), false);
  assert.equal(JSON.stringify(received).includes("construction"), false);
  assert.deepEqual(ranked.map((reference) => reference.id), ["alpha", "gamma"]);
});

test("construction is revealed only for visual ids selected by vision", async () => {
  const catalog = referenceCatalog();
  const ranked = await rankFinishedVisualReferences({
    catalog,
    creativeBrief: "Centered hero",
    currentCanvasImage: "data:image/jpeg;base64,current-canvas",
    analyzer: async () => [
      { id: "beta", score: 91, reason: "Best visual match", profile: { balance: "centered", density: "medium", headlineMass: "dominant", subjectInteraction: "frame" } },
    ],
  });
  const hydrated = hydrateSelectedReferenceConstruction(ranked, catalog);

  assert.equal(hydrated.length, 1);
  assert.equal(hydrated[0].id, "beta");
  assert.equal(hydrated[0].templateId, "beta-template");
  assert.equal(hydrated[0].construction.headlineFamily, "Bebas Neue");
  assert.equal(hydrated.some((reference) => reference.templateId === "alpha-template"), false);
});

test("the vision input is a real contact sheet made from finished optimized flyers", async () => {
  const references = OPTIMIZED_VISUAL_REFERENCE_MANIFEST.slice(0, 6).map(({ id, imageUrl }) => ({ id, imageUrl }));
  const sheet = await buildVisualReferenceContactSheet(references, { columns: 3, tileSize: 140 });
  const metadata = await sharp(sheet.buffer).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, sheet.width);
  assert.equal(metadata.height, sheet.height);
  assert.ok(sheet.dataUrl.startsWith("data:image/jpeg;base64,"));
  assert.ok(sheet.buffer.length > 10_000);
});

test("the production vision request contains pixels and visual ids but no construction data", () => {
  const request = buildVisualReferenceVisionRequest({
    analysis: {
      currentCanvasImage: "data:image/jpeg;base64,current",
      creativeBrief: "Dominant headline with balanced supporting copy",
      references: [{ id: "afro", imageUrl: "/samples/optimized/afro.webp" }],
    },
    contactSheetDataUrl: "data:image/jpeg;base64,references",
    model: "vision-test-model",
  });
  const serialized = JSON.stringify(request);
  assert.equal(request.model, "vision-test-model");
  assert.equal((request.messages[1].content as Array<{ type: string }>).filter((part) => part.type === "image_url").length, 2);
  assert.equal(serialized.includes('"construction":'), false);
  assert.equal(serialized.includes('"templateId":'), false);
  assert.equal(serialized.includes('"headlineFamily":'), false);
});

test("the production analyzer converts the visual model response into judgments", async () => {
  const judgments = await analyzeFinishedVisualReferencesWithOpenAI({
    currentCanvasImage: "data:image/jpeg;base64,current",
    creativeBrief: "Centered subject",
    references: [{ id: "afro", imageUrl: "/samples/optimized/afro.webp" }],
  }, {
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        references: [{
          id: "afro",
          score: 93,
          reason: "Strong matching focal hierarchy",
          profile: { balance: "centered", density: "high", headlineMass: "dominant", subjectInteraction: "overlap" },
        }],
      }) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }),
    model: "vision-test-model",
  });

  assert.equal(judgments[0].id, "afro");
  assert.equal(judgments[0].score, 93);
});
