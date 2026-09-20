import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoGoldenHeroAssets } from "../components/coco/goldenHeroAssets.ts";

const build = (format: "square" | "story") =>
  buildCocoGoldenHeroAssets({
    composition: { patternId: "golden-hero-editorial" },
    format,
  });

test("Golden Hero creates seven ordinary unlocked Coco objects instead of flattened artwork", () => {
  const assets = build("story");

  assert.deepEqual(
    assets.map((asset) => asset.id),
    [
      "coco_golden_hero_curtain_story",
      "coco_golden_hero_floor_story",
      "coco_golden_hero_glow_story",
      "coco_golden_hero_palms_story",
      "coco_golden_hero_particles_story",
      "coco_golden_hero_brush_story",
      "coco_golden_hero_footer_rule_story",
    ]
  );
  assert.equal(new Set(assets.map((asset) => asset.id)).size, 7);
  assert.ok(assets.every((asset) => asset.kind === "sticker"));
  assert.ok(assets.every((asset) => asset.isSticker === true));
  assert.ok(assets.every((asset) => asset.locked === false));
  assert.ok(assets.every((asset) => asset.showLabel === false));
});

test("Golden Hero contrast fields remain editable base-colored shape layers", () => {
  const [curtain, floor] = build("story");

  for (const asset of [curtain, floor]) {
    assert.equal(asset.blendMode, "normal");
    assert.equal(asset.paletteRole, "base");
    assert.equal(asset.cocoContrastRole, "shadow");
    assert.equal(asset.isShapeGraphic, true);
    assert.equal(asset.shapeKind, "shape_square");
    assert.equal(asset.shapeGradient, true);
    assert.match(String(asset.url), /^data:image\/svg\+xml;base64,/);
    assert.match(String(asset.svgTemplate), /linearGradient/);
  }

  assert.match(String(curtain.svgTemplate), /x1="0"[^>]+x2="1"/);
  assert.match(String(floor.svgTemplate), /y1="0"[^>]+y2="1"/);
  assert.ok(Number(curtain.shapeLength) * curtain.scale >= 540 * 0.48);
  assert.match(String(curtain.svgTemplate), /stop-opacity="0\.96"/);
  assert.match(String(curtain.svgTemplate), /stop-opacity="0\.22"/);
  assert.ok(Number(floor.shapeLength) * floor.scale > 540);
});

test("Golden Hero atmosphere uses Coco's palm, particle, glow, brush, and footer-rule layers", () => {
  const [, , glow, palms, particles, brush, footerRule] = build("story");

  assert.equal(glow.blendMode, "screen");
  assert.equal(glow.paletteRole, "primary");
  assert.equal(glow.shapeKind, "shape_circle");
  assert.equal(glow.iconColor, "#E58A00");
  assert.equal(glow.opacity, 0.26);
  assert.match(String(glow.svgTemplate), /radialGradient/);

  assert.equal(palms.url, "/scene-assets/common/palm-shadow.svg");
  assert.equal(palms.blendMode, "multiply");
  assert.equal(palms.paletteRole, "base");
  assert.equal(palms.isTexture, true);
  assert.equal(palms.opacity, 0.2);

  assert.equal(particles.url, "/scene-assets/afrobeats-night/gold-particles.svg");
  assert.equal(particles.blendMode, "screen");
  assert.equal(particles.paletteRole, "accent");
  assert.equal(particles.isTexture, true);
  assert.equal(particles.opacity, 0.1);

  assert.equal(brush.blendMode, "normal");
  assert.equal(brush.paletteRole, "accent");
  assert.equal(brush.iconColor, "#FF8B00");
  assert.equal(brush.x, 18);
  assert.equal(brush.y, 45.5);
  assert.equal(brush.scale, 0.46);
  assert.equal(brush.opacity, 0.74);
  assert.equal(brush.isShapeGraphic, true);
  assert.match(String(brush.url), /^data:image\/svg\+xml;base64,/);
  assert.match(String(brush.svgTemplate), /<path/);

  assert.equal(footerRule.blendMode, "normal");
  assert.equal(footerRule.paletteRole, "primary");
  assert.equal(footerRule.iconColor, "#E58A00");
  assert.equal(footerRule.x, 50);
  assert.equal(footerRule.y, 82.5);
  assert.equal(footerRule.scale, 0.2);
  assert.equal(footerRule.opacity, 0.68);
  assert.equal(footerRule.isShapeGraphic, true);
  assert.match(String(footerRule.svgTemplate), /<rect/);
});

test("Square and Story retain one Golden Hero motif while adapting object scale", () => {
  const square = build("square");
  const story = build("story");

  assert.deepEqual(
    square.map((asset) => asset.id.replace(/_square$/, "")),
    story.map((asset) => asset.id.replace(/_story$/, ""))
  );
  assert.deepEqual(
    square.map((asset) => asset.paletteRole),
    story.map((asset) => asset.paletteRole)
  );
  assert.deepEqual(
    square.map((asset) => asset.blendMode),
    story.map((asset) => asset.blendMode)
  );
  assert.ok(story[0].scale > square[0].scale);
  assert.ok(story[1].scale > square[1].scale);
  assert.ok(story[2].scale > square[2].scale);
  assert.ok(story[3].scale > square[3].scale);
  assert.ok(story[4].scale > square[4].scale);
  assert.ok(story[5].scale > square[5].scale);
  assert.equal(story[6].scale, square[6].scale);
  assert.equal(square[1].y, 70);
  assert.equal(story[1].y, 70);
  assert.equal(square[5].x, 18);
  assert.equal(square[5].y, 61);
  assert.equal(square[5].scale, 0.4);
  assert.equal(story[5].x, 18);
  assert.equal(story[5].y, 45.5);
  assert.equal(story[5].scale, 0.46);
  assert.equal(square[6].y, 82);
  assert.equal(story[6].y, 82.5);
});

test("other Coco composition families receive no Golden Hero recipe objects", () => {
  assert.deepEqual(
    buildCocoGoldenHeroAssets({
      composition: { patternId: "split-hero-editorial" },
      format: "story",
    }),
    []
  );
});
