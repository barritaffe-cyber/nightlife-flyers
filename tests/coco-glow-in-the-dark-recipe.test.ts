import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getGlowInTheDarkFormatRecipe,
  GLOW_IN_THE_DARK_RECIPE,
} from "../lib/recipes/glowInTheDark.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";
import { readSemanticCssMaster } from "../scripts/lib/coco-css-recipe-compiler.mjs";

const GLOW_EDITED_MASTER_SOURCE_HASH =
  "762588dc2998d526ddc436be53614f59739139df0797a77822a0275493ef89af";
const GLOW_EDITED_PROJECT_SHA256 =
  "e04f8f4b02561e9fe799ad8360c24fe20ce4b87a753b2e8f044ae9d4068d1ded";

const GLOW_PROMOTED_MASTER = {
  square: {
    assetIds: [
      "coco_css_glow-in-the-dark_square_background",
      "coco_css_glow-in-the-dark_square_glow-wash",
      "coco_css_glow-in-the-dark_square_subject-glow",
      "coco_css_glow-in-the-dark_square_edge-line-left",
      "coco_css_glow-in-the-dark_square_edge-line-right",
      "coco_css_glow-in-the-dark_square_subject",
      "coco_css_glow-in-the-dark_square_footer-band",
      "flare_sun04_1788281115505_pg39s",
      "design_bold-plus_1788281289949_wc483",
      "design_bold-plus_1788281335149_mq35h",
    ],
    additions: [
      {
        id: "flare_sun04_1788281115505_pg39s",
        url: "/flares/sun04.png",
        x: 48.17780671296297,
        y: 72.64539930555556,
        scale: 0.2,
        opacity: 0.45,
        rotation: 0,
        blendMode: "screen",
        layerOffset: -24,
        locked: false,
        isFlare: true,
        isSticker: null,
        isDesignElement: null,
        hitTestMode: null,
        label: "Green Sun",
        showLabel: null,
        iconColor: null,
        hasColorTemplate: false,
      },
      {
        id: "design_bold-plus_1788281289949_wc483",
        url: "data:image/svg+xml;base64",
        x: 26.525607638888893,
        y: 50.99826388888889,
        scale: 0.44,
        opacity: null,
        rotation: -36,
        blendMode: null,
        layerOffset: 55,
        locked: false,
        isFlare: null,
        isSticker: true,
        isDesignElement: true,
        hitTestMode: "alpha-bounds",
        label: "Bold Plus",
        showLabel: false,
        iconColor: "#FF1B92",
        hasColorTemplate: true,
      },
      {
        id: "design_bold-plus_1788281335149_mq35h",
        url: "data:image/svg+xml;base64",
        x: 71.74406828703702,
        y: 71.3744212962963,
        scale: 0.22,
        opacity: null,
        rotation: -80,
        blendMode: null,
        layerOffset: 55,
        locked: false,
        isFlare: null,
        isSticker: true,
        isDesignElement: true,
        hitTestMode: "alpha-bounds",
        label: "Bold Plus",
        showLabel: false,
        iconColor: "#00EF80",
        hasColorTemplate: true,
      },
    ],
    compiledAssetPatches: {
      "edge-line-left": {
        x: 0.8441840277777776,
        y: 13.642939814814817,
        scale: 2.35,
        opacity: 0.6,
        rotation: 0,
      },
      "edge-line-right": {
        x: 99.91391782407408,
        y: 75.859375,
        scale: 2.35,
        opacity: 0.6,
        rotation: 0,
        tint: -180,
      },
      subject: {
        x: 50.2611400462963,
        y: 62.639612268518526,
        scale: 1.28,
      },
      "footer-band": {
        x: 42.26869212962963,
        y: 93.53443287037037,
        scale: 1.3,
      },
    },
    fields: {
      detailsUppercase: true,
      detailsFamily: "Bebas Neue",
      head2SizePx: 124,
      head2Size: 124,
      dateFamily: "Bebas Neue",
      subtagFamily: "Bebas Neue",
      subtagRotate: 0,
      venueFamily: "Bebas Neue",
      venueSize: 35,
      rightRail:
        "a high-energy Friday night packed with vibrant colors, great music, and nonstop party vibes.",
      leftRailLabelColor: "#00EF80",
      leftRailSize: 11,
      priceFamily: "Bebas Neue",
      priceX: 84.001,
      priceY: 62.462,
      priceAlign: "right",
      priceLineHeight: 0.3,
      priceLabel: "ENTRT",
      priceLabelSize: 16,
      priceLabelColor: "#FF1B92",
      priceLabelBgColor: "#071B24",
      cocoRushVenueStyles: {
        venueNameSize: 35,
        addressSize: 12,
        gap: 3,
        venueNameColor: "rgb(255, 255, 255)",
        addressColor: "rgb(255, 255, 255)",
      },
    },
    overrides: {
      "smoke-frame": { removed: true },
      "dark-title": { x: 50.79137731481482, y: 23.790509259259263 },
      "link-word": { x: 84.80396412037037, y: 14.769965277777779 },
      venue: { x: 23.353587962962965, y: 88.9431423611111 },
      "footer-contact-label": { x: 12.486255787037038, y: 63.36877893518518 },
      "footer-contact-value": { x: 12.43272569444445, y: 66.7042824074074 },
      "footer-address": { x: 12.126736111111112, y: 95.14684606481481 },
      friday: { x: 50.89988425925926, y: 65.71108217592592 },
      lineup: { x: 49.943576388888886, y: 77.49638310185185 },
      "footer-details": { x: 46.946614583333336, y: 90.03761574074075 },
    },
  },
  story: {
    assetIds: [
      "coco_css_glow-in-the-dark_story_background",
      "coco_css_glow-in-the-dark_story_glow-wash",
      "coco_css_glow-in-the-dark_story_subject-glow",
      "coco_css_glow-in-the-dark_story_edge-line-left",
      "coco_css_glow-in-the-dark_story_edge-line-right",
      "coco_css_glow-in-the-dark_story_subject",
      "coco_css_glow-in-the-dark_story_footer-band",
      "flare_sun04_1788281674867_wxnif",
      "flare_flare03_1788281708751_onwni",
      "design_bold-plus_1788281766134_1xh48",
      "design_bold-plus_1788281796429_p6fsh",
    ],
    additions: [
      {
        id: "flare_sun04_1788281674867_wxnif",
        url: "/flares/sun04.png",
        x: 49.56958912037037,
        y: 68.0859375,
        scale: 0.3,
        opacity: 0.6,
        rotation: 0,
        blendMode: "screen",
        layerOffset: -24,
        locked: false,
        isFlare: true,
        isSticker: null,
        isDesignElement: null,
        hitTestMode: null,
        label: "Green Sun",
        showLabel: null,
        iconColor: null,
        hasColorTemplate: false,
      },
      {
        id: "flare_flare03_1788281708751_onwni",
        url: "/flares/optimized/flare03.png",
        x: 51.89742476851852,
        y: 27.318929036458332,
        scale: 0.4,
        opacity: 0.3,
        rotation: 0,
        blendMode: "screen",
        layerOffset: -24,
        locked: false,
        isFlare: true,
        isSticker: null,
        isDesignElement: null,
        hitTestMode: null,
        label: "Amber Burst",
        showLabel: null,
        iconColor: null,
        hasColorTemplate: false,
      },
      {
        id: "design_bold-plus_1788281766134_1xh48",
        url: "data:image/svg+xml;base64",
        x: 22.631655092592595,
        y: 44.097086588541664,
        scale: 0.41,
        opacity: null,
        rotation: -41,
        blendMode: null,
        layerOffset: 55,
        locked: false,
        isFlare: null,
        isSticker: true,
        isDesignElement: true,
        hitTestMode: "alpha-bounds",
        label: "Bold Plus",
        showLabel: false,
        iconColor: "#00EF80",
        hasColorTemplate: true,
      },
      {
        id: "design_bold-plus_1788281796429_p6fsh",
        url: "data:image/svg+xml;base64",
        x: 81.19068287037038,
        y: 35.15380859375,
        scale: 0.42,
        opacity: null,
        rotation: 31,
        blendMode: null,
        layerOffset: 55,
        locked: false,
        isFlare: null,
        isSticker: true,
        isDesignElement: true,
        hitTestMode: "alpha-bounds",
        label: "Bold Plus",
        showLabel: false,
        iconColor: "#00DFF4",
        hasColorTemplate: true,
      },
    ],
    compiledAssetPatches: {
      "edge-line-left": {
        x: 0.35083912037037024,
        y: 40.310872395833336,
        scale: 2.15,
        opacity: 0.6,
        rotation: 0,
        tint: 125,
        tintMode: "hue",
      },
      "edge-line-right": {
        x: 99.58839699074075,
        y: 40.377197265625,
        scale: 2.15,
        opacity: 0.6,
        rotation: 0,
        tint: -85,
        tintMode: "hue",
      },
      subject: {
        x: 50.01808449074073,
        y: 56.294352213541664,
        scale: 1.37,
      },
      "footer-band": {
        x: 50.57002314814815,
        y: 96.96248372395834,
        scale: 1,
      },
    },
    fields: {
      detailsFamily: "Bebas Neue",
      bodyFamily: "Bebas Neue",
      head2SizePx: 120,
      head2Size: 120,
      dateFamily: "Bebas Neue",
      subtagFamily: "Bebas Neue",
      subtagRotate: 0,
      venueFamily: "Bebas Neue",
      venueSize: 41,
      rightRail:
        "a high-energy Friday night packed with vibrant colors, great music, and nonstop party vibes.",
      rightRailColor: "#00EF80",
      rightRailAlign: "center",
      cocoManualTextColorRoles: { rightRail: true },
      leftRailLabelBgColor: "#00EF80",
      priceFamily: "Bebas Neue",
      priceX: 86.616,
      priceY: 45.132,
      priceAlign: "right",
      priceLineHeight: 0.36,
      priceLabel: "ENTRY",
      priceLabelSize: 21,
      priceLabelColor: "#ffffff",
      priceLabelBgColor: "#FF1B92",
      head2Shadow: true,
      detailsShadow: true,
      details2Shadow: true,
      venueShadow: true,
      subtagShadow: true,
      vignette: true,
      vignetteStrength: 0.5,
      cocoRushVenueStyles: {
        venueNameSize: 41,
        addressSize: 7,
        gap: 3,
        venueNameColor: "rgb(255, 255, 255)",
        addressColor: "rgb(255, 255, 255)",
      },
      head2Fx: {
        uppercase: true,
        bold: true,
        italic: false,
        underline: false,
        alpha: 1,
        tracking: 0,
        gradient: true,
        gradFrom: "#ffffff",
        gradTo: "#ffd166",
        color: "#ffffff",
        strokeWidth: 0,
        strokeColor: "#000000",
        shadow: 0.5,
        glow: 0.15,
        shadowEnabled: true,
      },
    },
    overrides: {
      "smoke-frame": { removed: true },
      "dark-title": { x: 52.15277777777778, y: 17.34619140625 },
      headline: { x: 52.039207175925924, y: 9.158121744791666 },
      "link-word": { x: 86.41637731481481, y: 12.523193359374998 },
      presenter: { x: 52.50144675925926, y: 5.945638020833334 },
      friday: { x: 49.74392361111111, y: 76.268310546875 },
      time: { x: 90.24016203703704, y: 36.978759765625 },
      date: { x: 11.867766203703704, y: 37.72176106770833 },
      "footer-contact-label": { x: 12.333622685185183, y: 45.70678710937501 },
      "footer-contact-value": { x: 12.398726851851851, y: 47.83732096354167 },
      "footer-details": { x: 27.09418402777778, y: 86.35335286458334 },
      venue: { x: 48.78689236111111, y: 92.89388020833333 },
      "footer-address": { x: 37.355324074074076, y: 97.12565104166667 },
    },
  },
} as const;

function authoredAssetSnapshot(asset: any) {
  return {
    id: asset.id,
    url: String(asset.url).startsWith("data:image/svg+xml;base64,")
      ? "data:image/svg+xml;base64"
      : asset.url,
    x: asset.x,
    y: asset.y,
    scale: asset.scale,
    opacity: asset.opacity ?? null,
    rotation: asset.rotation ?? null,
    blendMode: asset.blendMode ?? null,
    layerOffset: asset.layerOffset ?? null,
    locked: asset.locked ?? null,
    isFlare: asset.isFlare ?? null,
    isSticker: asset.isSticker ?? null,
    isDesignElement: asset.isDesignElement ?? null,
    hitTestMode: asset.hitTestMode ?? null,
    label: asset.label ?? null,
    showLabel: asset.showLabel ?? null,
    iconColor: asset.iconColor ?? null,
    hasColorTemplate:
      typeof asset.svgTemplate === "string" && asset.svgTemplate.includes("{{COLOR}}"),
  };
}

test("Glow in the Dark is one authoritative registered recipe", () => {
  assert.equal(getVisualRecipe("glow-in-the-dark"), GLOW_IN_THE_DARK_RECIPE);
  assert.equal(
    VISUAL_RECIPES.filter((recipe) => recipe.id === "glow-in-the-dark").length,
    1,
  );
});

test("Glow CSS master preserves provenance and semantic roles", async () => {
  const source = await readFile(
    new URL("../public/generated-flyers/glow-in-the-dark-reference-master.html", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    GLOW_IN_THE_DARK_RECIPE.measurementReference?.measurements.sourceSha256,
  );
  const master = readSemanticCssMaster(
    source.toString("utf8"),
    "glow-in-the-dark-css-master-geometry",
  );
  assert.deepEqual(
    master.objectElements.map((item) => item.objectId).sort(),
    [
      "darkTitle",
      "date",
      "djLineup",
      "footerAddress",
      "footerContact",
      "footerContactLabel",
      "footerDetails",
      "friday",
      "headline",
      "linkWord",
      "presenter",
      "price",
      "subject",
      "time",
      "venue",
    ],
  );
  assert.deepEqual(
    master.assetElements.map((item) => item.assetId).sort(),
    ["background", "edgeLineLeft", "edgeLineRight", "footerBand", "smokeFrame", "subject", "subjectGlow"],
  );
  assert.deepEqual(getGlowInTheDarkFormatRecipe("square").canvas, { width: 1080, height: 1080 });
  assert.deepEqual(getGlowInTheDarkFormatRecipe("story").canvas, { width: 1080, height: 1920 });
  assert.deepEqual(master.geometry.sourceCanvas, { width: 1080, height: 1350, aspectRatio: "4:5" });
  assert.equal(master.geometry.schemaVersion, 2);
  assert.equal(master.geometry.elementStyles.headline.typography.fontSize, 132);
  assert.equal(master.geometry.elementStyles.headline.typography.sourceFamily, "Permanent Marker");
  assert.equal(master.geometry.elementStyles.headline.typography.runtimeFamily, "Good Brush");
  assert.equal(master.geometry.elementStyles.darkTitle.transform.scaleX, 1.03);
  assert.equal(master.geometry.elementStyles.footerBand.paint.fill.type, "linear-gradient");
  assert.equal(master.geometry.elementStyles.footerBand.paint.fill.angle, 105);
  assert.doesNotMatch(source.toString("utf8"), /paint04\.png|data-coco-texture-src/);
  assert.notDeepEqual(
    getGlowInTheDarkFormatRecipe("square").zones.subject,
    getGlowInTheDarkFormatRecipe("story").zones.subject,
  );
  assert.match(source.toString("utf8"), /data-coco-object="friday"[^>]*><span>F<\/span><span>R<\/span><span>I<\/span><span>D<\/span><span>A<\/span><span>Y<\/span>/);
});

test("Glow edited-master refinements are provenance-locked and deterministic", async () => {
  const refinement = JSON.parse(
    await readFile(
      new URL(
        "../public/generated-flyers/glow-in-the-dark-refinements.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  assert.equal(refinement.schemaVersion, 1);
  assert.equal(refinement.recipeId, "glow-in-the-dark");
  assert.equal(refinement.recipeVersion, 10);
  assert.equal(refinement.recipeVersion, GLOW_IN_THE_DARK_RECIPE.version);
  assert.equal(refinement.sourceHash, GLOW_EDITED_MASTER_SOURCE_HASH);
  assert.equal(
    refinement.sourceHash,
    GLOW_IN_THE_DARK_RECIPE.measurementReference?.measurements.sourceSha256,
  );
  assert.equal(refinement.sourceProjectSha256, GLOW_EDITED_PROJECT_SHA256);
  assert.equal(refinement.sourceSavedAt, "2026-09-01T16:58:15.447Z");
  assert.deepEqual(Object.keys(refinement.formats).sort(), ["square", "story"]);

  for (const format of ["square", "story"] as const) {
    const expected = GLOW_PROMOTED_MASTER[format];
    const formatRefinement = refinement.formats[format];
    assert.deepEqual(formatRefinement.assets.removeCompiledObjectIds, ["smoke-frame"]);
    assert.deepEqual(formatRefinement.compiledObjectOverrides, expected.overrides);
    assert.deepEqual(
      formatRefinement.assets.additions.map(authoredAssetSnapshot),
      expected.additions,
    );
    for (const [field, value] of Object.entries(expected.fields)) {
      assert.deepEqual(
        formatRefinement.fields[field],
        value,
        `${format} refinement must preserve the edited ${field} value`,
      );
    }
    for (const [objectId, patch] of Object.entries(expected.compiledAssetPatches)) {
      const actualPatch = formatRefinement.assets.patchCompiledByObjectId[objectId];
      for (const [field, value] of Object.entries(patch)) {
        assert.deepEqual(
          actualPatch[field],
          value,
          `${format} ${objectId} must preserve its edited ${field}`,
        );
      }
    }
  }
});

test("compiled Glow project keeps separate Square and Story Coco objects", async () => {
  const project = JSON.parse(
    await readFile(
      new URL("../public/generated-flyers/glow-in-the-dark.nflyer", import.meta.url),
      "utf8",
    ),
  );
  const state = project.state;
  for (const format of ["square", "story"] as const) {
    const expected = GLOW_PROMOTED_MASTER[format];
    const variant = state.session[format];
    const ir = variant.cocoCssCompiler.ir;
    const object = (id: string) => ir.objects.find((item: any) => item.id === id);
    assert.equal(variant.format, format);
    assert.equal(variant.cocoVisualRecipeId, "glow-in-the-dark");
    assert.equal(variant.cocoVisualRecipeVersion, GLOW_IN_THE_DARK_RECIPE.version);
    assert.equal(variant.cocoVisualRecipeMaterializedVersion, GLOW_IN_THE_DARK_RECIPE.version);
    assert.equal(variant.cocoCssCompiler.schemaVersion, 4);
    assert.equal(variant.cocoCssCompiler.extractor, "chromium-computed-style");
    assert.deepEqual(
      variant.cocoCssCompiler.sourceCanvas,
      format === "square" ? { width: 540, height: 540 } : { width: 540, height: 960 },
    );
    assert.equal(ir.schemaVersion, 1);
    assert.equal(ir.objects.length, 23);
    assert.equal(new Set(ir.objects.map((item: any) => item.id)).size, ir.objects.length);
    assert.deepEqual(variant.cocoCssCompiler.report, {
      compiled: 23,
      approximated: 0,
      unsupported: 0,
      warnings: [],
    });
    assert.ok(Math.abs(object("headline").transform.scaleX - 1.25) < 0.001);
    assert.ok(Math.abs(object("dark-title").transform.scaleX - 1.45) < 0.001);
    assert.ok(Math.abs(object("friday").transform.scaleX - 1.35) < 0.001);
    assert.equal(object("headline").typography.fontSizePx, 102.6);
    assert.equal(object("dark-title").typography.fontSizePx, 172.8);
    assert.equal(object("friday").typography.fontSizePx, 72.9);
    assert.equal(variant.headlineSize, object("headline").typography.fontSizePx);
    assert.equal(variant.head2Size, expected.fields.head2Size);
    assert.equal(variant.subtagSize, object("friday").typography.fontSizePx);
    assert.equal(variant.cocoRecipeImageFit.scale, 1);
    assert.equal(variant.cocoCompositionSystem.patternId, "center-subject-headline-behind");
    assert.equal(variant.cocoCompositionSystem.styleId, "glow-party");
    assert.equal(variant.cocoCssCompiler.semanticObjects.time.stateField, "time");
    assert.equal(variant.cocoCssCompiler.semanticObjects.price.stateField, "price");
    assert.equal(variant.cocoCompositionSystem.rendererZones.doors.x, object("time").bounds.x);
    assert.equal(variant.timeX, object("time").bounds.x + object("time").bounds.width);
    assert.equal(variant.cocoCompositionSystem.rendererZones.doors.y, variant.timeY);
    assert.equal(object("time").binding.size, "timeSize");
    assert.equal(variant.timeSize, object("time").typography.fontSizePx);
    assert.equal(variant.date, "APR\n25");
    assert.equal(variant.time, "09\nPM");
    assert.equal(variant.price, "$25");
    assert.equal(variant.venueAddress, "234 West Avenue Street City");
    assert.equal(variant.leftRailLabel, "R.S.V.P");
    assert.equal(variant.leftRail, "0088 235 0089");
    assert.equal(variant.cocoEventBrief.address, "234 WEST AVENUE STREET CITY");
    assert.equal(variant.cocoEventBrief.rsvpContact, "0088 235 0089");
    assert.equal(variant.cocoCssCompiler.semanticObjects.footerAddress.stateField, "venueAddress");
    assert.equal(variant.cocoCssCompiler.semanticObjects.footerContact.stateField, "leftRail");
    assert.equal(variant.cocoCssCompiler.semanticObjects.footerContactLabel.stateField, "leftRailLabel");
    assert.equal(variant.subtag, "FRIDAY");
    assert.deepEqual(variant.subtagGlyphColors, [
      "rgb(0, 255, 153)",
      "rgb(0, 216, 200)",
      "rgb(255, 140, 40)",
      "rgb(255, 73, 160)",
      "rgb(198, 48, 218)",
      "rgb(185, 28, 255)",
    ]);
    for (const [field, value] of Object.entries(expected.fields)) {
      assert.deepEqual(
        variant[field],
        value,
        `${format} session must preserve the edited ${field} value`,
      );
    }
    assert.deepEqual(
      variant.emojiList.map((asset: any) => asset.id),
      expected.assetIds,
    );
    assert.deepEqual(variant.portraits, variant.emojiList);
    const compiledAssets = variant.emojiList.filter(
      (asset: any) => typeof asset.cocoCompiledObjectId === "string",
    );
    const authoredAdditions = variant.emojiList.filter(
      (asset: any) => typeof asset.cocoCompiledObjectId !== "string",
    );
    assert.equal(compiledAssets.length, 7);
    assert.equal(
      new Set(compiledAssets.map((asset: any) => asset.cocoCompiledObjectId)).size,
      compiledAssets.length,
      "every editable compiled asset needs a stable one-to-one object identity",
    );
    assert.ok(
      compiledAssets.every((asset: any) =>
        variant.cocoCompositionSystem.compiledDocument.objects.some(
          (object: any) => object.id === asset.cocoCompiledObjectId,
        ),
      ),
      "every compiler-owned editor asset must point back to its compiled CSS object",
    );
    assert.deepEqual(
      authoredAdditions.map(authoredAssetSnapshot),
      expected.additions,
    );
    assert.equal(
      variant.emojiList.some(
        (asset: any) =>
          asset.cocoCompiledObjectId === "smoke-frame" || asset.cocoAssetRole === "smokeFrame",
      ),
      false,
      "the edited master removes smoke from the live canvas asset list",
    );
    for (const [objectId, patch] of Object.entries(expected.compiledAssetPatches)) {
      const asset = compiledAssets.find(
        (item: any) => item.cocoCompiledObjectId === objectId,
      );
      assert.ok(asset, `${format} must retain the ${objectId} compiler-owned asset`);
      for (const [field, value] of Object.entries(patch)) {
        assert.deepEqual(
          asset[field],
          value,
          `${format} ${objectId} must preserve its edited ${field}`,
        );
      }
    }
    assert.equal(
      variant.emojiList.find((asset: any) => asset.cocoAssetRole === "subject")?.url,
      "/scene-assets/sugar-rush/subject-cutout.png",
    );
    const footer = variant.emojiList.find((asset: any) => asset.cocoAssetRole === "footerBand");
    assert.match(footer?.url, /^data:image\/svg\+xml;base64,/);
    assert.equal(footer?.isTexture, false);
    for (const role of ["glow-wash", "subjectGlow", "edgeLineLeft", "edgeLineRight", "footerBand"]) {
      const asset = variant.emojiList.find((item: any) => item.cocoAssetRole === role);
      const svg = Buffer.from(String(asset?.url).split(",")[1] ?? "", "base64").toString("utf8");
      assert.match(svg, /fill="transparent"/);
      assert.doesNotMatch(svg, /#ffffff/i);
    }
    assert.match(object("footer-band").paint.backgroundImage, /^linear-gradient\(105deg/);
    assert.match(object("background").paint.backgroundImage, /^radial-gradient/);
    assert.equal(object("smoke-frame").image.naturalWidth, 941);
    assert.equal(object("subject").image.fit, "contain");
    assert.equal(variant.headBehindPortrait, true);
    assert.deepEqual(variant.textLayerOffset, {
      headline: 5,
      headline2: 5,
      details: 5,
      details2: 26,
      venue: 31,
      subtag: 25,
    });
    assert.equal(variant.detailsX, object("link-word").bounds.x + object("link-word").bounds.width / 2);
    assert.equal(variant.subtagX, object("friday").bounds.x + object("friday").bounds.width / 2);
    assert.equal(variant.details2X, object("lineup").bounds.x + object("lineup").bounds.width / 2);
    assert.equal(object("footer-contact-label").binding.x, "leftRailLabelX");
    assert.equal(object("footer-contact-label").binding.y, "leftRailLabelY");
    assert.equal(object("footer-contact-label").binding.initial.x, variant.leftRailLabelX);
    assert.equal(object("footer-contact-value").binding.initial.x, variant.leftRailX);
    assert.notEqual(object("footer-contact-label").binding.initial.x, object("footer-contact-value").binding.initial.x);
    assert.equal(object("footer-address").binding.x, "venueAddressX");
    assert.equal(object("footer-address").binding.y, "venueAddressY");
    assert.equal(object("footer-address").binding.size, "venueAddressSize");
    assert.equal(object("footer-address").binding.initial.x, variant.venueAddressX);
    assert.notEqual(object("footer-address").binding.initial.x, object("venue").binding.initial.x);
    assert.deepEqual(
      variant.cocoCompositionSystem.compiledObjectOverrides,
      expected.overrides,
    );
    assert.equal(
      variant.cocoCompositionSystem.compiledObjectOverrides["smoke-frame"].removed,
      true,
    );
    assert.equal(variant.cocoCompositionSystem.authority.layout, "compiled-document-ir");
    assert.deepEqual(variant.cocoCompositionSystem.compiledDocument, ir);
    assert.ok(
      variant.cocoCompositionSystem.layerOrder.indexOf("dark-title") <
        variant.cocoCompositionSystem.layerOrder.indexOf("subject"),
    );
    assert.deepEqual(
      state.cocoLayoutSessions[format][variant.cocoCenterLayoutOptionId],
      variant,
    );
  }
  assert.notDeepEqual(
    state.session.square.cocoCssCompiler.ir.objects.find((item: any) => item.id === "subject").bounds,
    state.session.story.cocoCssCompiler.ir.objects.find((item: any) => item.id === "subject").bounds,
  );
  assert.equal(GLOW_IN_THE_DARK_RECIPE.runtime.authority.layout.genericTemplateMayOverride, false);
  assert.equal(GLOW_IN_THE_DARK_RECIPE.runtime.authority.palette.generatedPaletteMayOverride, false);
  assert.equal(GLOW_IN_THE_DARK_RECIPE.runtime.authority.assets.generatedBackgroundAllowed, false);
});

test("materialized CSS recipes can render Date and Time as independent objects", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const cocoIndependentTimeObjectActive =/);
  assert.match(page, /function hasCocoSemanticTimeObject/);
  assert.match(page, /entry\?\.semanticRole === "time"/);
  assert.match(page, /\{cocoIndependentTimeObjectActive && \(timeLabel \|\| time\)/);
  assert.match(page, /text=\{cocoIndependentTimeObjectActive \? date/);
  assert.match(page, /rendererZones\?\.doors\?\.width/);
  assert.match(page, /const authoredCocoTimeSize = Number\(activeCocoDateVariant\.timeSize\)/);
  assert.match(page, /timeSize: cocoRushDateStyles\.timeSize/);
  assert.match(page, /timeSize: value,[\s\S]{0,120}?cocoRushDateStyles: \{ \.\.\.current, timeSize: value \}/);
  assert.match(page, /Stepper label="Time Size" value=\{activeCocoTimeSize\} setValue=\{setActiveCocoTimeSize\}/);
  assert.match(page, /selectedCompiledTextObjectId && byPanel === "date" && byMove === "time"/);
  assert.match(page, /merged\.bgUrl \?\? merged\.backgroundUrl/);
  assert.match(page, /cocoGlowWeekdayGlyphColors/);
  assert.match(page, /data-coco-glyph-index=\{glyphIndex\}/);
  assert.match(page, /colorIndex\+\+ % cocoGlowWeekdayGlyphColors\.length/);
  assert.match(page, /cocoGoldenHeroEditorialActive \|\| cocoNeonNightShiftActive \|\| cocoGlowInTheDarkActive/);
  assert.match(page, /isCocoNeonNightShiftVariant\(updatedVariant\) \|\| isCocoGlowInTheDarkVariant\(updatedVariant\)/);
  assert.match(page, /function migrateCocoGlowInTheDarkProjectState/);
  assert.match(page, /const importedNativeReferenceTemplateId = \(data as any\)\.cocoNativeReferenceTemplateId/);
  assert.match(page, /setCocoNativeReferenceTemplateId\([\s\S]{0,220}?importedNativeReferenceTemplateId[\s\S]{0,220}?: null/);
  assert.match(page, /cocoCssCompiler\?\.schemaVersion\) >= 2[\s\S]{0,120}?Boolean\(v\?\.gradient\)/);
  assert.match(page, /backgroundImage: head2Fx\.gradient/);
  assert.match(page, /gradientStops\.map\(\(stop: any\)/);
  assert.match(page, /data-text-glyph-index/);
  assert.match(page, /perGlyph = false/);
  assert.match(page, /!hideUiForExport && !cocoGlowInTheDarkActive/);
  assert.match(page, /const cocoCompiledRendererActive =/);
  assert.match(page, /data-coco-compiled-document="true"/);
  assert.match(page, /cocoCompiledDocument\?\.objects\?\.map\(renderCompiledObject\)/);
  assert.match(page, /data-coco-compiled-object=\{object\.id\}/);
  assert.match(page, /object\.paint\?\.background/);
  const compiledVisualStyle = page.match(
    /const visualStyle: React\.CSSProperties = \{[\s\S]*?\n      \};/
  )?.[0] ?? "";
  assert.ok(compiledVisualStyle, "compiled shape renderer should define a visual style object");
  assert.doesNotMatch(
    compiledVisualStyle,
    /\n\s*background\s*:/,
    "compiled shapes must not mix the background shorthand with backgroundColor during rerenders",
  );
  assert.match(compiledVisualStyle, /backgroundColor:/);
  assert.match(compiledVisualStyle, /backgroundImage:/);
  assert.match(compiledVisualStyle, /backgroundClip:/);
  assert.match(page, /object\.image\?\.fit/);
  assert.match(page, /data-coco-compiled-active=/);
  assert.match(page, /cocoCompiledTextDrag/);
  assert.match(page, /selectedCompiledTextObjectId/);
  assert.match(page, /const canvasTextSelectionNode = cocoCompiledRendererActive/);
  assert.match(page, /data-node=\{object\.id\}/);
  assert.match(page, /const commitCompiledObjectPosition =/);
  assert.match(page, /compiledObjectOverrides: nextOverrides/);
  assert.doesNotMatch(page, /moveCallback\(finalX, finalY\)/);
  assert.match(page, /const compiledTarget = Array\.from/);
  assert.match(
    page,
    /const root = rootRef\.current;\s+if \(!root\)[\s\S]{0,180}?root\.querySelectorAll/,
  );
  assert.match(page, /const isCompilerOwnedCanvasAsset =/);
  assert.match(page, /assetIds\.add\(`coco_css_\$\{documentId\}_\$\{documentFormat\}_\$\{objectId\}`\)/);
  assert.equal(
    (page.match(/!isCompilerOwnedCanvasAsset\(item, cocoCompiledAssetIdentity\)/g) || []).length,
    3,
    "compiled assets must be excluded from portrait, flare, and emoji legacy renderers",
  );
});

test("compiled editor routes subheadline selection and venue address sizing to live controls", async () => {
  const [page, materializer] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/lib/coco-materializer.mjs", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const panelKey = key === "headline2" \? "head2" : key;/);
  assert.match(page, /const panel = binding\.panel[\s\S]{0,120}?resolveTemplateCanvasSelectionPanel/);
  assert.match(page, /id="head2-panel"/);
  assert.doesNotMatch(page, /id="subheadline-panel"/);
  assert.match(materializer, /headline2:[^\n]+panel: "head2"/);
  assert.match(page, /venueAddressSize: cocoRushVenueStyles\.addressSize/);
  assert.match(page, /const authoredCocoVenueAddressSize = Number\(activeCocoVenueVariant\.venueAddressSize\)/);
  assert.match(
    page,
    /Number\.isFinite\(authoredCocoVenueAddressSize\)[\s\S]{0,140}?authoredCocoVenueAddressSize/,
  );
});

test("compiled text uses painted glyph hit testing with one measured selection box", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /function TextObjectSelectionBox/);
  assert.match(page, /data-text-object-selection-box=\{nodeId\}/);
  assert.match(page, /document\.createTreeWalker\(target, NodeFilter\.SHOW_TEXT\)/);
  assert.match(page, /range\.selectNodeContents\(textNode\)/);
  assert.match(page, /target\.querySelectorAll<SVGElement>\('\[data-text-glyph-box="true"\]'\)/);
  assert.doesNotMatch(page, /data-text-pixel-selection="true"/);
  assert.doesNotMatch(page, /active && perGlyph/);
  assert.match(page, /!hideUiForExport && \([\s\S]{0,100}?<TextObjectSelectionBox/);
  assert.doesNotMatch(page, /outline: active && !perGlyph/);
});

test("compiled Glow keeps interactive canvas auxiliaries and legacy subject assets working", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /const cocoGlowInTheDarkActive =[\s\S]{0,180}?isCocoGlowInTheDarkVariant\(cocoActiveFormatVariant\)/);
  assert.match(page, /item\?\.cocoCompiledObjectId === object\.id \|\|[\s\S]{0,260}?object\.semanticRole === "subject" && item\?\.isExtracted/);
  assert.match(page, /object\.semanticRole === "price" && cocoGlowInTheDarkActive/);
  assert.match(page, /priceEnabled && price && \(!cocoTypographyStackOwns\("price"\) \|\| cocoNeonNightShiftActive \|\| cocoGlowInTheDarkActive\)/);
  assert.match(page, /data-node="price"[\s\S]{0,100}?data-coco-runtime-overlay="true"/);
  assert.match(page, /data-node="priceLabel"/);
  assert.match(page, /const cocoRenderedPriceGapEm =/);
  assert.match(page, /gap: `\$\{cocoRenderedPriceGapEm\}em`/);
  assert.match(page, /data-coco-price-text="true"[\s\S]{0,500}?flexDirection: "column"[\s\S]{0,500}?overflow: "visible"/);
  assert.match(page, /const cocoRenderedPriceAlignItems =/);
  assert.match(page, /alignItems: cocoRenderedPriceAlignItems/);
  assert.match(page, /\[data-coco-runtime-overlay="true"\] \[data-node\]/);
  assert.match(page, /enabled && priceRingAlpha <= 0[\s\S]{0,180}?setPriceRingAlpha\(0\.72\)/);
  assert.match(page, /data-node="qr"[\s\S]{0,100}?data-coco-runtime-overlay="true"/);
  assert.match(page, /id="flare-layer-root"[\s\S]{0,100}?data-coco-runtime-overlay="true"/);
  assert.match(page, /setSessionValue\(format, "qrEnabled", next\)/);
  assert.match(page, /restoreCompiledAssetIdentity/);
  assert.match(page, /cocoCompiledObjectId: matches\[0\]\.id/);
  assert.match(page, /data-portrait-area=\{asset \? "true" : undefined\}/);
  assert.match(page, /data-hit-source="true"/);
  assert.match(page, /onTransparentAssetPointer\?\.\(event, event\.currentTarget\)/);
  assert.match(page, /pointerEvents: "none",[\s\S]{0,900}?<TextPixelHitLayer[\s\S]{0,700}?perGlyph/);
});

test("compiled Glow uses one live canvas layer order for CSS objects and runtime additions", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /type CocoCompiledObjectOverride = \{[\s\S]{0,100}?layerZ\?: number/);
  assert.match(
    page,
    /compiledLiveValue\(object, "layerZ", asset\?\.layerOffset \?\? authoredLayerZ\)/,
  );
  assert.match(page, /zIndex: COCO_COMPILED_LAYER_BASE \+ liveLayerZ/);
  assert.match(page, /compiledObjectOverrides:[\s\S]{0,180}?layerZ: nudgeCocoLayerZ/);
  assert.match(page, /selectedCompiledTextObjectId=\{selectedCompiledTextObjectId\}/);
  assert.match(page, /onSelectedCompiledTextObjectIdChange=\{setSelectedCompiledTextObjectId\}/);
  assert.match(page, /COCO_RUNTIME_QR_LAYER_ID, runtimeQrLayerFallback, "up"/);
  assert.match(page, /COCO_RUNTIME_QR_LAYER_ID, runtimeQrLayerFallback, "down"/);
  assert.match(
    page,
    /mt !== "icon" && mt !== "portrait" && mt !== "logo" && mt !== "qr"/,
  );
  assert.match(
    page,
    /activeAssetControls\.onLayerUp\?\.\(\);[\s\S]{0,160}?requestAnimationFrame\(\(\) => showMobileFloat\("asset"\)\)/,
  );
  assert.match(
    page,
    /activeAssetControls\.onLayerDown\?\.\(\);[\s\S]{0,160}?requestAnimationFrame\(\(\) => showMobileFloat\("asset"\)\)/,
  );
  assert.doesNotMatch(page, /effectiveZ \* 1000/);
  assert.doesNotMatch(page, /z-index: 650 !important/);
  assert.doesNotMatch(
    page,
    /data-coco-compiled-document="true"[\s\S]{0,300}?zIndex: 500/,
  );
  assert.doesNotMatch(
    page,
    /data-coco-compiled-document="true"[\s\S]{0,300}?isolation: "isolate"/,
  );
});

test("deleting a compiled Glow asset removes its live CSS fallback and persists that removal", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const state = await readFile(new URL("../app/state/flyerState.ts", import.meta.url), "utf8");
  const library = await readFile(
    new URL("../components/editor/LibraryPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    page,
    /type CocoCompiledObjectOverride = \{[\s\S]{0,140}?removed\?: boolean/,
  );
  assert.match(
    page,
    /const renderCompiledObject = \(object: any\) => \{[\s\S]{0,260}?if \(objectOverride\.removed === true\) return null/,
  );
  assert.match(
    state,
    /cocoCompiledObjectId[\s\S]{0,900}?compiledObjectOverrides[\s\S]{0,500}?removed: true/,
  );
  assert.match(
    state,
    /removePortrait: \(fmt, id, opts\)[\s\S]{0,700}?buildRemovedCompiledAssetSessionState/,
  );
  assert.match(
    state,
    /removeEmoji: \(fmt, id, opts\)[\s\S]{0,900}?buildRemovedCompiledAssetSessionState/,
  );
  assert.match(
    state,
    /buildAssetSessionState[\s\S]{0,1600}?cocoLayoutSessions:[\s\S]{0,500}?activeLayoutId/,
  );
  assert.match(
    state,
    /markCompiledAssetRemoved\(activeLayout\)/,
  );
  assert.match(
    page,
    /cocoAssetRole: \(e as any\)\.cocoAssetRole[\s\S]{0,220}?cocoCompiledObjectId: \(e as any\)\.cocoCompiledObjectId/,
  );
  assert.match(
    page,
    /const compiledAssetInteractive = Boolean\(asset\)/,
  );
  assert.match(
    page,
    /object\.kind === "text" \? object\.editable : compiledAssetInteractive/,
  );
  assert.match(page, /const isCompiledAsset =/);
  assert.match(
    page,
    /showPosition:\s*\n\s*isCompiledAsset \|\|/,
  );
  assert.match(page, /const compiledAssetFilter = \[/);
  assert.match(library, /title="Compiled Canvas Layers"/);
  assert.match(library, /data-compiled-layer-picker="true"/);
  assert.match(library, /aria-label=\{`Select \$\{objectId\} layer`\}/);
  assert.match(library, /data-compiled-layer-controls=\{objectId\}/);
  assert.match(
    library,
    /label="X"[\s\S]{0,500}?updatePortraitRaf\.current\?\.\(sel\.id, \{ x: next \}\)/,
  );
  assert.match(
    library,
    /aria-label=\{`Delete \$\{objectId\} layer`\}[\s\S]{0,300}?removePortrait\(format, sel\.id\)/,
  );
});
