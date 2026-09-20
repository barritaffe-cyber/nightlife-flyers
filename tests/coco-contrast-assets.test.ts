import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoContrastAssets } from "../components/coco/contrastAssets.ts";
import type { CocoCompositionSystem } from "../components/coco/layoutTournament/index.ts";

const splitComposition = {
  patternId: "split-hero-editorial",
  layoutId: "subject-right",
  anchorSide: "left",
  alignment: "left",
  textColumn: { x: 6, y: 9, width: 46, height: 80, align: "left" },
  blocks: [],
  allBlocks: [],
  copyTreatment: {
    script: "accent-support",
    details: "primary-meta",
    details2: "keep",
    date: "metadata",
    venue: "lock-to-stack",
  },
  rhythm: {
    headlineToAccent: 2,
    accentToMeta: 8,
    metaToDateTime: 10,
    dateTimeToVenue: 5,
  },
  hierarchy: {
    headlinePowerMin: 100,
    accentPowerMaxRatio: 0.6,
    bodyPowerMaxRatio: 0.38,
    metadataPowerMaxRatio: 0.42,
  },
  explanation: "test",
  score: 92,
} satisfies CocoCompositionSystem;

test("split editorial creates editable panel, seam, and paint assets", () => {
  const assets = buildCocoContrastAssets({
    accentColor: "#C9A94F",
    baseColor: "#090807",
    composition: splitComposition,
    format: "square",
    layoutId: "subject-right",
  });

  assert.deepEqual(
    assets.map((asset) => asset.id),
    ["coco_contrast_panel_square", "coco_contrast_seam_square", "coco_contrast_paint_square"]
  );
  assert.ok(assets.every((asset) => asset.locked === false));
  assert.equal(assets[0].isShapeGraphic, true);
  assert.equal(assets[0].paletteRole, "base");
  assert.equal(assets[0].cocoContrastRole, "shadow");
  assert.ok(Number(assets[0].shapeLength) >= 48, "panel should reserve a real editorial text field");
  assert.equal(assets[1].paletteRole, "accent");
  assert.equal(assets[1].shapeLength, 48);
  assert.match(String(assets[1].svgTemplate), /x="125"[^>]+width="6"/);
  assert.equal(assets[2].isTexture, true);
  assert.equal(assets[2].blendMode, "normal");
  assert.notEqual(assets[2].tint, 0);
  assert.ok(Number(assets[2].x) > 0 && Number(assets[2].x) < 48);
  assert.ok(Number(assets[0].shapeLength) > 0);
  assert.ok(Number(assets[0].scale) > 3);
});

test("a light palette still produces a dark readable panel", () => {
  const [panel] = buildCocoContrastAssets({
    accentColor: "#C9A94F",
    baseColor: "#FFF8E7",
    composition: splitComposition,
    format: "story",
    layoutId: "subject-right",
  });

  assert.match(String(panel.iconColor), /^#[0-2][0-9a-f][0-2][0-9a-f][0-2][0-9a-f]$/i);
});

test("non-split compositions do not receive an automatic panel", () => {
  assert.deepEqual(
    buildCocoContrastAssets({
      accentColor: "#ffffff",
      baseColor: "#000000",
      composition: { ...splitComposition, patternId: "left-premium-stack" },
      format: "story",
      layoutId: "subject-right",
    }),
    []
  );
});
