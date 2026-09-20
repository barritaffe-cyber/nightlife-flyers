import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseStructuredTemplateReference,
  extractStructuredTemplateReferences,
  readDirectTemplateTextLayout,
} from "../components/coco/referenceLayouts/templateReferenceLayouts.ts";
import type { TemplateSpec } from "../lib/templates.ts";
import { buildAuthoritativeReferenceComposition } from "../components/coco/referenceLayouts/buildReferenceCompositionSystem.ts";
import { buildTypographyZoneModels } from "../components/coco/typographyStack/buildTypographyStackModel.ts";
import type { CocoCompositionSystem } from "../components/coco/layoutTournament/types.ts";

const centerTemplate: TemplateSpec = {
  id: "center_reference",
  label: "Center reference",
  tags: [],
  preview: "/templates/center.jpg",
  formats: {
    square: {
      subjectVisibleRect: { x: 30, y: 10, width: 40, height: 85 },
      headlineFamily: "Anton",
      headMaxPx: 96,
      headlineLineHeight: 0.9,
      headAlign: "center",
      head2Family: "OpenScript",
      textZones: {
        mainTitle: { x: 12, y: 55, width: 76, height: 22, align: "center" },
        scriptTitle: { x: 25, y: 77, width: 50, height: 8, align: "center" },
        presenter: { x: 30, y: 4, width: 40, height: 5, align: "center" },
        details: { x: 7, y: 42, width: 25, height: 10, align: "left" },
        date: { x: 7, y: 84, width: 20, height: 7, align: "left" },
        price: { x: 73, y: 42, width: 20, height: 10, align: "center" },
        footer: { x: 20, y: 90, width: 60, height: 6, align: "center" },
        compliance: { x: 82, y: 92, width: 10, height: 5, align: "center" },
      },
    },
  },
};

const leftTemplate: TemplateSpec = {
  id: "left_reference",
  label: "Left subject reference",
  tags: [],
  preview: "/templates/left.jpg",
  formats: {
    square: {
      subjectVisibleRect: { x: 4, y: 8, width: 38, height: 88 },
      headlineFamily: "Bebas Neue",
      textZones: {
        mainTitle: { x: 48, y: 30, width: 45, height: 24, align: "right" },
        presenter: { x: 55, y: 8, width: 38, height: 5, align: "right" },
        footer: { x: 45, y: 88, width: 48, height: 7, align: "right" },
      },
    },
  },
};

const copy = {
  headline: "BEACH BUMS",
  accent: "BRUNCH VIBES",
  presenter: "PRESENTS",
  venue: "VENUE ADDRESS",
  details: "DJS AND SPECIAL GUESTS",
  date: "FRIDAY 10PM",
  price: "ENTRY $50",
  compliance: "18+",
};

test("structured references preserve template rectangles and typography", () => {
  const references = extractStructuredTemplateReferences({
    templates: [centerTemplate],
    format: "square",
    copyTextByRole: copy,
    cells: [],
  });
  assert.equal(references.length, 1);
  const headline = references[0].candidates.find((candidate) => candidate.role === "headline");
  assert.deepEqual(headline?.rect, { x: 12, y: 55, width: 76, height: 22 });
  assert.equal(headline?.referenceFontFamily, "Anton");
  assert.equal(headline?.referenceFontSize, 96);
  assert.equal(headline?.referenceLineHeight, 0.9);
  assert.equal(headline?.referenceAlign, "center");
});

test("winning template exposes its stored layout without copy or subject scoring", () => {
  const layout = readDirectTemplateTextLayout({ template: centerTemplate, format: "square" });
  const headline = layout.find((item) => item.role === "headline");
  assert.deepEqual(headline?.rect, { x: 12, y: 55, width: 76, height: 22 });
  assert.equal(headline?.fontFamily, "Anton");
  assert.equal(headline?.fontSize, 96);
  assert.equal(headline?.align, "center");
});

test("winning template does not invent zones for labels disabled in the reference", () => {
  const template: TemplateSpec = {
    ...centerTemplate,
    id: "disabled_reference_labels",
    formats: {
      square: {
        ...centerTemplate.formats?.square,
        dateEnabled: false,
        priceEnabled: false,
        subtagEnabled: false,
      },
    },
  };
  const roles = readDirectTemplateTextLayout({ template, format: "square" }).map((item) => item.role);
  assert.equal(roles.includes("date"), false);
  assert.equal(roles.includes("price"), false);
  assert.equal(roles.includes("compliance"), false);
  assert.equal(roles.includes("headline"), true);
});

test("selection follows the chosen subject layout family", () => {
  const result = chooseStructuredTemplateReference({
    templates: [centerTemplate, leftTemplate],
    format: "square",
    layoutId: "subject-left",
    copyTextByRole: { headline: copy.headline, presenter: copy.presenter, venue: copy.venue },
    cells: [],
  });
  assert.equal(result?.id, "template:left_reference:square");
  assert.ok(result?.candidates.every((candidate) => candidate.referenceLayoutId === result.id));
});

test("visual shortlist replaces coordinate-first layout-family filtering", () => {
  const result = chooseStructuredTemplateReference({
    templates: [centerTemplate, leftTemplate],
    format: "square",
    layoutId: "subject-center",
    visualReferenceTemplateIds: ["left_reference"],
    copyTextByRole: { headline: copy.headline, presenter: copy.presenter, venue: copy.venue },
    cells: [],
  });
  assert.equal(result?.id, "template:left_reference:square");
});

test("adding a template automatically expands the reference pool", () => {
  const one = extractStructuredTemplateReferences({
    templates: [centerTemplate],
    format: "square",
    copyTextByRole: copy,
    cells: [],
  });
  const two = extractStructuredTemplateReferences({
    templates: [centerTemplate, leftTemplate],
    format: "square",
    copyTextByRole: copy,
    cells: [],
  });
  assert.equal(one.length, 1);
  assert.equal(two.length, 2);
});

test("a real torso silhouette does not dismantle the selected template", () => {
  const result = chooseStructuredTemplateReference({
    templates: [centerTemplate],
    format: "square",
    layoutId: "subject-center",
    copyTextByRole: copy,
    cells: [{
      column: 0,
      row: 0,
      xPct: 0,
      yPct: 0,
      widthPct: 10,
      heightPct: 10,
      subjectCoverage: 0.8,
      protection: 0.2,
      region: "torso",
      canvasX: 25,
      canvasY: 50,
      canvasWidth: 50,
      canvasHeight: 40,
    }],
    subjectRect: { x: 25, y: 10, width: 50, height: 85 },
    faceRect: { x: 40, y: 18, width: 20, height: 20 },
  });
  assert.ok(result);
  assert.equal(result.candidates.length, Object.keys(copy).length);
  assert.deepEqual(new Set(result.candidates.map((candidate) => candidate.role)), new Set(Object.keys(copy)));
  assert.ok(result.candidates.some((candidate) => candidate.subjectOverlap > 0));
});

test("authoritative reference becomes eight independent renderer zones", () => {
  const base: CocoCompositionSystem = {
    alignment: "center",
    allBlocks: [],
    anchorSide: "center",
    blocks: [],
    copyTreatment: {
      date: "metadata",
      details: "primary-meta",
      details2: "merge",
      script: "accent-support",
      venue: "lock-to-stack",
    },
    explanation: "base",
    hierarchy: {
      accentPowerMaxRatio: 0.5,
      bodyPowerMaxRatio: 0.4,
      headlinePowerMin: 80,
      metadataPowerMaxRatio: 0.4,
    },
    layoutId: "subject-center",
    patternId: "center-poster-stack",
    rhythm: { accentToMeta: 2, dateTimeToVenue: 2, headlineToAccent: 2, metaToDateTime: 2 },
    score: 1,
    textColumn: { x: 10, y: 10, width: 80, height: 80, align: "center" },
  };
  const zones = {
    headline: { x: 12, y: 55, width: 76, height: 22, align: "center" as const },
    script: { x: 5, y: 77, width: 90, height: 20, align: "center" as const },
    leftInfo: { x: 7, y: 42, width: 25, height: 10, align: "left" as const },
    presenter: { x: 30, y: 4, width: 40, height: 5, align: "center" as const },
    date: { x: 7, y: 84, width: 20, height: 7, align: "left" as const },
    price: { x: 73, y: 42, width: 20, height: 10, align: "center" as const },
    venue: { x: 20, y: 90, width: 60, height: 6, align: "center" as const },
    compliance: { x: 82, y: 92, width: 10, height: 5, align: "center" as const },
  };
  const composition = buildAuthoritativeReferenceComposition({
    base,
    layoutId: "template:center_reference:square",
    zones,
  });
  const rendered = buildTypographyZoneModels({
    authoritativeReference: true,
    composition,
    enabled: { headline: true, script: true, details: true, presenter: true, date: true, price: true, venue: true, compliance: true },
    format: "square",
    styles: {
      headline: { color: "#fff", fontFamily: "Anton", fontSize: 96, lineHeight: 0.9 },
      // Deliberately larger than the procedural accent/headline ratio. A
      // retrieved reference must keep this authored proportion.
      accent: { color: "#fff", fontFamily: "OpenScript", fontSize: 64 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 20, lineHeight: 0.62 },
      presenter: { color: "#fff", fontFamily: "Inter", fontSize: 16 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 18 },
      badge: { color: "#fff", fontFamily: "Inter", fontSize: 18 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 14 },
      compliance: { color: "#fff", fontFamily: "Inter", fontSize: 12 },
    },
    text: { ...copy, details: "FIRST LINE\nSECOND LINE", script: "VIBE" },
  });
  assert.equal(rendered.length, 8, rendered.map((zone) => `${zone.zoneId}:${zone.ownedSources.join("+")}`).join(", "));
  assert.deepEqual(
    new Set(rendered.flatMap((zone) => zone.ownedSources)),
    new Set(Object.keys(copy).map((role) => role === "accent" ? "script" : role))
  );
  assert.deepEqual(rendered.find((zone) => zone.zoneId === "headline")?.rect, zones.headline);
  assert.equal(rendered.find((zone) => zone.zoneId === "headline")?.item.style.fontFamily, "Anton");
  assert.equal(rendered.find((zone) => zone.zoneId === "headline")?.item.style.lineHeight, 0.9);
  assert.equal(rendered.find((zone) => zone.zoneId === "accent")?.item.style.fontSize, 64);
  assert.equal(rendered.find((zone) => zone.zoneId === "details")?.item.style.lineHeight, 1);
});
