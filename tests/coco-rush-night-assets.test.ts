import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoRushNightAssets } from "../components/coco/rushNightAssets.ts";
import {
  getRushNightFormatRecipe,
  RUSH_NIGHT_RECIPE,
} from "../lib/recipes/rushNight.ts";

const build = (format: "square" | "story") =>
  buildCocoRushNightAssets({
    baseColor: "#030303",
    composition: { patternId: "rush-night-css" },
    format,
    neutralColor: "#FFF2B2",
    primaryColor: "#FF5A0A",
    secondaryColor: "#F8F5EE",
  });

test("Rush Night creates exactly nine ordinary unlocked SVG assets", () => {
  const assets = build("story");

  assert.deepEqual(
    assets.map((asset) => asset.id),
    [
      "coco_rush_night_photo_grade_story",
      "coco_rush_night_wear_story",
      "coco_rush_night_edge_vignette_story",
      "coco_rush_night_neon_triangle_story",
      "coco_rush_night_script_underline_story",
      "coco_rush_night_genre_frame_story",
      "coco_rush_night_entry_frame_story",
      "coco_rush_night_price_block_story",
      "coco_rush_night_venue_divider_story",
    ]
  );
  assert.equal(new Set(assets.map((asset) => asset.id)).size, 9);
  assert.ok(assets.every((asset) => asset.kind === "sticker"));
  assert.ok(assets.every((asset) => asset.locked === false));
  assert.ok(assets.every((asset) => asset.showLabel === false));
  assert.ok(assets.every((asset) => asset.isSticker === true));
  assert.ok(assets.every((asset) => asset.isShapeGraphic === true));
  assert.ok(
    assets.every((asset) =>
      String(asset.url).startsWith("data:image/svg+xml;base64,")
    )
  );
});

test("the asset builder rejects every non-Rush composition", () => {
  assert.deepEqual(
    buildCocoRushNightAssets({
      composition: { patternId: "subject-center" },
      format: "story",
    }),
    []
  );
  assert.deepEqual(
    buildCocoRushNightAssets({
      format: "square",
      patternId: "ladies-css-editorial",
    }),
    []
  );
  assert.equal(
    buildCocoRushNightAssets({
      format: "story",
      patternId: RUSH_NIGHT_RECIPE.runtime.compositionPattern,
    }).length,
    9
  );
});

test("the runtime triangle is complete, code-native, mask-free and behind the subject", () => {
  const triangle = build("story").find((asset) =>
    String(asset.id).includes("neon_triangle")
  );
  assert.ok(triangle);

  const svg = String(triangle.svgTemplate);
  assert.equal(triangle.layerOffset, -7);
  assert.ok(Number(triangle.layerOffset) < 0);
  assert.equal(triangle.iconColor, "#FF5A0A");
  assert.equal(triangle.blendMode, "normal");
  assert.equal(triangle.shapeGradient, true);
  assert.match(svg, /M610 62 L92 825 L866 825 Z/);
  assert.match(svg, /feGaussianBlur/);
  assert.match(svg, /id="tube"/);
  assert.ok((svg.match(/<path\b/g) ?? []).length >= 4);
  assert.doesNotMatch(svg, /<mask\b/i);
  assert.doesNotMatch(svg, /<ellipse\b/i);
  assert.doesNotMatch(svg, /<clipPath\b/i);
});

test("Rush assets use no generated background, scene asset or flattened master", () => {
  const assets = build("story");
  const serialized = JSON.stringify(assets);

  assert.doesNotMatch(serialized, /\/scene-assets\//i);
  assert.doesNotMatch(serialized, /\/generated-flyers\//i);
  assert.doesNotMatch(serialized, /generated[-_ ]?background/i);
  assert.ok(assets.every((asset) => !asset.isFlare));
  assert.equal(RUSH_NIGHT_RECIPE.runtime.assetPolicy.autoGenerateBackground, false);
  assert.equal(RUSH_NIGHT_RECIPE.runtime.authority.assets.generatedBackgroundAllowed, false);
});

test("triangle, frames and venue divider follow the Story recipe geometry", () => {
  const assets = build("story");
  const recipe = getRushNightFormatRecipe("story");
  const byId = (suffix: string) => {
    const asset = assets.find((candidate) => String(candidate.id).endsWith(`${suffix}_story`));
    assert.ok(asset, `missing ${suffix} asset`);
    return asset;
  };
  const triangle = byId("neon_triangle");
  const genreFrame = byId("genre_frame");
  const entryFrame = byId("entry_frame");
  const priceBlock = byId("price_block");
  const venueDivider = byId("venue_divider");

  for (const asset of [genreFrame, entryFrame, priceBlock, venueDivider]) {
    assert.equal(asset.layerOffset, 22);
  }

  assert.equal(triangle.x, recipe.assets.triangle.x + recipe.assets.triangle.width / 2);
  assert.equal(triangle.y, recipe.assets.triangle.y + recipe.assets.triangle.height / 2);
  assert.equal(
    triangle.scale,
    (recipe.canvas.height * recipe.assets.triangle.height) / 100 / 160
  );
  assert.ok(
    Math.abs(
      Number(triangle.shapeLength) * triangle.scale -
        (recipe.canvas.width * recipe.assets.triangle.width) / 100
    ) < 1e-9
  );

  for (const [asset, rect] of [
    [genreFrame, recipe.assets.genreFrame],
    [entryFrame, recipe.assets.entryFrame],
    [priceBlock, recipe.assets.pricePill],
    [venueDivider, recipe.assets.venueRule],
  ] as const) {
    assert.equal(asset.x, rect.x + rect.width / 2);
    assert.equal(asset.y, rect.y + rect.height / 2);
    assert.ok(
      Math.abs(
        Number(asset.shapeLength) * asset.scale -
          (recipe.canvas.width * rect.width) / 100
      ) < 1e-9
    );
  }
});

test("Square and Story retain one nine-object campaign asset vocabulary", () => {
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
  assert.ok(story[1].scale > square[1].scale);
  assert.ok(story[2].scale > square[2].scale);
  assert.ok(story[3].scale > square[3].scale);
});
