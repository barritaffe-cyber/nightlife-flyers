import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoLadiesCssEditorialAssets } from "../components/coco/ladiesCssEditorialAssets.ts";
import {
  getLadiesCssEditorialFormatRecipe,
  LADIES_CSS_EDITORIAL_RECIPE,
} from "../lib/recipes/ladiesCssEditorial.ts";

const build = (format: "square" | "story") =>
  buildCocoLadiesCssEditorialAssets({
    baseColor: "#05070B",
    format,
    paperColor: "#FBF8EF",
    patternId: "ladies-css-editorial",
    signalColor: "#FF302A",
  });

test("Ladies CSS returns only its seven ordinary unlocked SVG objects", () => {
  const assets = build("story");

  assert.deepEqual(
    assets.map((asset) => asset.id),
    [
      "coco_ladies_css_photo_control_story",
      "coco_ladies_css_footer_fade_story",
      "coco_ladies_css_headline_swash_story",
      "coco_ladies_css_date_ring_story",
      "coco_ladies_css_script_underline_story",
      "coco_ladies_css_footer_rule_story",
      "coco_ladies_css_age_pill_story",
    ]
  );
  assert.equal(new Set(assets.map((asset) => asset.id)).size, 7);
  assert.ok(assets.every((asset) => asset.kind === "sticker"));
  assert.ok(assets.every((asset) => asset.locked === false));
  assert.ok(assets.every((asset) => asset.showLabel === false));
  assert.ok(assets.every((asset) => asset.isSticker === true));
  assert.ok(assets.filter((asset) => !asset.isCircularText).every((asset) => asset.isShapeGraphic === true));
  assert.ok(assets.every((asset) => String(asset.url).startsWith("data:image/svg+xml;base64,")));
  assert.ok(assets.every((asset) => !asset.isTexture));
  assert.ok(assets.every((asset) => !asset.isFlare));
  assert.ok(assets.every((asset) => !String(asset.url).includes("/scene-assets/")));
  assert.ok(assets.every((asset) => !String(asset.label).match(/palm|flower|flare|texture|background/i)));
});

test("asset builder filters every composition except ladies-css-editorial", () => {
  assert.deepEqual(
    buildCocoLadiesCssEditorialAssets({
      composition: { patternId: "golden-hero-editorial" },
      format: "story",
    }),
    []
  );
  assert.deepEqual(
    buildCocoLadiesCssEditorialAssets({
      format: "square",
      patternId: "subject-center",
    }),
    []
  );
  assert.equal(
    buildCocoLadiesCssEditorialAssets({
      format: "story",
      composition: { patternId: "ladies-css-editorial" },
    }).length,
    7
  );
});

test("invalid or omitted colors resolve through the canonical recipe palette", () => {
  const palette = LADIES_CSS_EDITORIAL_RECIPE.runtime.palette;
  const defaults = buildCocoLadiesCssEditorialAssets({
    format: "story",
    patternId: "ladies-css-editorial",
  });
  const invalid = buildCocoLadiesCssEditorialAssets({
    baseColor: "not-a-color",
    format: "story",
    paperColor: "not-a-color",
    patternId: "ladies-css-editorial",
    signalColor: "not-a-color",
  });

  for (const assets of [defaults, invalid]) {
    assert.equal(assets[0].iconColor, palette.bgFrom);
    assert.equal(assets[1].iconColor, palette.bgFrom);
    assert.equal(assets[2].iconColor, palette.secondary);
    assert.equal(assets[3].iconColor, palette.primary);
    assert.equal(assets[4].iconColor, palette.secondary);
    assert.equal(assets[5].iconColor, palette.secondary);
    assert.equal(assets[6].iconColor, palette.primary);
  }
});

test("photo control and footer fade reproduce the CSS gradient stops", () => {
  const [photoControl, footerFade] = build("story");

  assert.equal(photoControl.x, 50);
  assert.equal(photoControl.y, 50);
  assert.equal(photoControl.cocoContrastRole, "shadow");
  assert.equal(photoControl.paletteRole, "base");
  assert.equal(photoControl.shapeGradient, true);
  assert.match(String(photoControl.svgTemplate), /id="top"/);
  assert.match(String(photoControl.svgTemplate), /offset="23%"[^>]+stop-opacity="0.07"/);
  assert.match(String(photoControl.svgTemplate), /offset="76%"[^>]+stop-opacity="0"/);
  assert.match(String(photoControl.svgTemplate), /offset="100%"[^>]+stop-opacity="0.12"/);
  assert.equal(Number(photoControl.shapeLength) * photoControl.scale, 540);
  assert.equal(photoControl.scale, 960 / 160);

  assert.equal(footerFade.x, 50);
  assert.equal(footerFade.y, 90.25);
  assert.equal(footerFade.cocoContrastRole, "shadow");
  assert.match(String(footerFade.svgTemplate), /offset="26%"[^>]+stop-opacity="0.72"/);
  assert.match(String(footerFade.svgTemplate), /offset="70%"[^>]+stop-opacity="1"/);
  assert.ok(Math.abs(footerFade.scale - (960 * 0.195) / 160) < 1e-9);
  assert.equal(Number(footerFade.shapeLength) * footerFade.scale, 540);
});

test("swash, date ring, script underline, footer rule and age pill follow recipe geometry", () => {
  const [, , swash, dateRing, scriptUnderline, footerRule, agePill] = build("story");
  const recipe = getLadiesCssEditorialFormatRecipe("story");

  assert.equal(swash.x, 22 + 53 / 2);
  assert.equal(swash.y, 16.725 + 6.375 / 2);
  assert.equal(swash.rotation, -1.8);
  assert.equal(swash.iconColor, "#FBF8EF");
  assert.match(String(swash.svgTemplate), /M10 55 C100 90/);
  assert.equal(Number(swash.shapeLength) * swash.scale, 540 * 0.53);

  assert.equal(dateRing.x, 5.6 + 20.5 / 2);
  assert.equal(dateRing.y, 25.875 + 11.55 / 2);
  assert.equal(dateRing.shapeKind, "shape_circle");
	assert.equal(dateRing.isShapeGraphic, false);
	assert.equal(dateRing.isCircularText, true);
	assert.equal(dateRing.isDesignElement, true);
	assert.equal(dateRing.label, "LA VIDA · LA VIDA · LA VIDA · LA VIDA ·");
	assert.equal(dateRing.labelSize, 15);
	assert.equal(dateRing.hitTestMode, "alpha-bounds");
  assert.equal(dateRing.iconColor, "#FF302A");
  assert.match(String(dateRing.svgTemplate), /LA VIDA · LA VIDA · LA VIDA · LA VIDA ·/);
  assert.doesNotMatch(String(dateRing.svgTemplate), />28</);
  assert.doesNotMatch(String(dateRing.svgTemplate), />AUG</);
  assert.equal(
    dateRing.scale,
    Math.min(540 * recipe.assets.dateRing.width / 100, 960 * recipe.assets.dateRing.height / 100) / 160
  );

  assert.equal(scriptUnderline.x, 50.78 + 30.96 / 2);
  assert.equal(scriptUnderline.y, 87.15625 + 0.1875 / 2);
  assert.equal(scriptUnderline.rotation, -5.1);
  assert.equal(scriptUnderline.scale, 0.45);
  assert.equal(scriptUnderline.iconColor, "#FBF8EF");
  assert.ok(
    Math.abs(Number(scriptUnderline.shapeLength) * scriptUnderline.scale - 540 * 0.3096) < 1e-9
  );

  assert.equal(footerRule.x, 7.6 + 84.8 / 2);
  assert.equal(footerRule.y, 89.35);
  assert.equal(footerRule.opacity, 0.25);
  assert.ok(Math.abs(Number(footerRule.shapeLength) * footerRule.scale - 540 * 0.848) < 1e-9);

  assert.equal(agePill.x, 81 + 5.8 / 2);
  assert.equal(agePill.y, 89.875 + 2.55 / 2);
  assert.equal(agePill.iconColor, "#FF302A");
  assert.ok(Math.abs(Number(agePill.shapeLength) * agePill.scale - 540 * 0.058) < 1e-9);
  assert.ok(Math.abs(agePill.scale - (960 * 0.0255) / 160) < 1e-9);
});

test("Square and Story retain one seven-object campaign asset vocabulary", () => {
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
  assert.ok(story[0].scale > square[0].scale);
  assert.ok(Math.abs(story[1].scale - square[1].scale) < 0.01);
  assert.ok(story[2].scale > square[2].scale);
  assert.equal(story[4].scale, square[4].scale);
  assert.ok(story[6].scale > square[6].scale);
});
