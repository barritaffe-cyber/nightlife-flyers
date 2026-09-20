import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoFashionClubAssets } from "../components/coco/fashionClubAssets.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../lib/recipes/fashionClubVertical.ts";

const build = (format: "square" | "story") =>
  buildCocoFashionClubAssets({
    accentColor: "#E9F23C",
    baseColor: "#1B0710",
    composition: { patternId: "fashion-club-vertical" },
    format,
    glowColor: "#F30A58",
    neutralColor: "#FFF9F2",
  });

const darkEditorialColor = (value: string) => {
  const normalized = value.replace(/^#/, "");
  const channel = (offset: number) => {
    const source = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    return Math.max(2, Math.min(18, Math.round(source * 0.1)));
  };
  return `#${[channel(0), channel(2), channel(4)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
};

test("omitted and invalid asset colors resolve through the canonical recipe palette", () => {
  const palette = FASHION_CLUB_VERTICAL_RECIPE.runtime.palette;
  const defaults = buildCocoFashionClubAssets({
    format: "story",
    patternId: FASHION_CLUB_VERTICAL_RECIPE.runtime.compositionPattern,
  });
  const invalidOverrides = buildCocoFashionClubAssets({
    baseColor: "not-a-color",
    format: "story",
    glowColor: "not-a-color",
    neutralColor: "not-a-color",
    patternId: FASHION_CLUB_VERTICAL_RECIPE.runtime.compositionPattern,
  });

  for (const assets of [defaults, invalidOverrides]) {
    assert.equal(assets[0].iconColor, darkEditorialColor(palette.bgFrom));
    assert.equal(assets[1].iconColor, palette.primary);
    assert.equal(assets[3].iconColor, palette.neutral);
  }
});

test("fashion-club vertical creates the refined ordinary editable Coco assets", () => {
  const assets = build("story");

  assert.deepEqual(
    assets.map((asset) => asset.id),
    [
      "coco_fashion_club_floor_story",
      "coco_fashion_club_glow_story",
      "coco_fashion_club_paint_story",
      "coco_fashion_club_footer_frame_story",
      "coco_fashion_club_arrow_story",
      "coco_fashion_club_circles_story",
    ]
  );
  assert.ok(assets.every((asset) => asset.kind === "sticker"));
  assert.ok(assets.every((asset) => asset.locked === false));
  assert.ok(assets.every((asset) => asset.showLabel === false));
  assert.equal(new Set(assets.map((asset) => asset.id)).size, assets.length);
});

test("contrast floor follows the measured Story fade and preserves canvas bleed", () => {
  const [squareFloor] = build("square");
  const [storyFloor] = build("story");
  const squareRecipe = getFashionClubVerticalFormatRecipe("square");
  const storyRecipe = getFashionClubVerticalFormatRecipe("story");

  assert.equal(squareFloor.cocoContrastRole, "shadow");
  assert.equal(squareFloor.paletteRole, "base");
  assert.equal(squareFloor.isShapeGraphic, true);
  assert.equal(squareFloor.blendMode, "normal");
  assert.match(String(squareFloor.svgTemplate), /linearGradient[^>]+y1="0"[^>]+y2="1"/);
  assert.match(String(squareFloor.svgTemplate), /offset="0%"[^>]+stop-opacity="0"/);
  assert.match(String(storyFloor.svgTemplate), /offset="28\.94736842105263%"[^>]+stop-opacity="0.65"/);
  assert.match(String(storyFloor.svgTemplate), /offset="44\.73684210526316%"[^>]+stop-opacity="1"/);
  assert.match(String(squareFloor.svgTemplate), /offset="100%"[^>]+stop-opacity="1"/);
  assert.equal(storyFloor.y, storyRecipe.assets.fieldY);
  assert.equal(storyFloor.scale, (960 * storyRecipe.assets.fieldHeightPct / 100) / 160);
  assert.equal(
    Number(storyFloor.y) - storyRecipe.assets.fieldHeightPct / 2,
    storyRecipe.assets.fieldY - storyRecipe.assets.fieldHeightPct / 2
  );
  assert.equal(Number(storyFloor.y) + storyRecipe.assets.fieldHeightPct / 2, 100);
  assert.equal(storyFloor.opacity, 1);
  assert.ok(Number(squareFloor.shapeLength) * squareFloor.scale > 540);
  assert.ok(Number(storyFloor.shapeLength) * storyFloor.scale > 540);
  assert.ok(storyFloor.scale > squareFloor.scale, "same campaign fade should scale to Story height");
  assert.equal(squareFloor.y, squareRecipe.assets.fieldY);
  assert.equal(squareFloor.scale, (540 * squareRecipe.assets.fieldHeightPct / 100) / 160);
});

test("magenta lighting uses a screen glow plus Coco's editable paint asset", () => {
  const [, glow, paint] = build("story");
  const recipe = getFashionClubVerticalFormatRecipe("story");

  assert.equal(glow.blendMode, "screen");
  assert.equal(glow.shapeKind, "shape_circle");
  assert.equal(glow.paletteRole, "primary");
  assert.equal(glow.iconColor, "#F30A58");
  assert.equal(glow.x, recipe.assets.glowX);
  assert.equal(glow.y, recipe.assets.glowY);
  assert.equal(glow.scale, recipe.assets.glowScale);
  assert.equal(glow.opacity, recipe.assets.glowOpacity);
  assert.match(String(glow.svgTemplate), /radialGradient/);
  assert.match(String(paint.url), /^data:image\/svg\+xml;base64,/);
  assert.equal(paint.isTexture, true);
  assert.equal(paint.tintMode, "colorize");
  assert.equal(paint.blendMode, "screen");
  assert.equal(paint.paletteRole, "primary");
  assert.equal(paint.x, recipe.assets.paintX);
  assert.equal(paint.y, recipe.assets.paintY);
  assert.equal(paint.scale, recipe.assets.paintScale);
  assert.equal(paint.rotation, recipe.assets.paintRotation);
  assert.equal(paint.opacity, recipe.assets.paintOpacity);
});

test("footer frame matches the measured Story reservation geometry", () => {
  const frame = build("story")[3];
  const recipe = getFashionClubVerticalFormatRecipe("story");

  assert.equal(frame.iconColor, "#FFF9F2");
  assert.equal(frame.paletteRole, "neutral");
  assert.match(String(frame.svgTemplate), /fill="none"[^>]+stroke="\{\{COLOR\}\}"/);
  assert.equal(frame.x, recipe.assets.frameX);
  assert.equal(frame.y, recipe.assets.frameY);
  assert.equal(frame.scale, (960 * recipe.assets.frameHeightPct / 100) / 160);
  assert.equal(
    Number(frame.shapeLength) * frame.scale,
    540 * recipe.assets.frameWidthPct / 100
  );
});

test("Square and Story preserve one campaign motif while adapting scale", () => {
  const square = build("square");
  const story = build("story");

  assert.deepEqual(
    square.filter((asset) => !asset.id.includes("red_sun")).map((asset) => asset.id.replace(/_square$/, "")),
    story.map((asset) => asset.id.replace(/_story$/, ""))
  );
  assert.equal(square[1].iconColor, story[1].iconColor);
  assert.equal(square[3].iconColor, story[3].iconColor);
  assert.ok(Math.abs(Number(square[1].x) - Number(story[1].x)) <= 2);
  assert.ok(Math.abs(Number(square[2].y) - Number(story[2].y)) <= 2);
  assert.ok(story[1].scale > square[1].scale);
  assert.ok(story[2].scale > square[2].scale);
  assert.ok(Number(square[3].shapeLength) * square[3].scale > 540 * 0.8);
  assert.ok(Number(story[3].shapeLength) * story[3].scale < 540 * 0.75);
});

test("other Coco composition families receive no fashion-club decoration", () => {
  assert.deepEqual(
    buildCocoFashionClubAssets({
      format: "story",
      composition: { patternId: "split-hero-editorial" },
    }),
    []
  );
});
