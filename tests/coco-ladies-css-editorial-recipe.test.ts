import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getLadiesCssEditorialFormatRecipe,
  LADIES_CSS_EDITORIAL_RECIPE,
  LADIES_CSS_MASTER_GEOMETRY,
} from "../lib/recipes/ladiesCssEditorial.ts";

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return;
  const object = value as object;
  if (seen.has(object)) return;
  seen.add(object);
  assert.equal(Object.isFrozen(object), true);
  for (const key of Reflect.ownKeys(object)) {
    assertDeepFrozen((object as Record<PropertyKey, unknown>)[key], seen);
  }
}

const masterUrl = new URL(
  "../public/generated-flyers/ladies-reference-master.html",
  import.meta.url
);

test("Ladies CSS recipe preserves the standalone master as exact provenance", async () => {
  const html = await readFile(masterUrl, "utf8");
  const geometryMatch = html.match(
    /<script\s+type="application\/json"\s+id="ladies-css-master-geometry">([\s\S]*?)<\/script>/
  );
  assert.ok(geometryMatch, "the CSS master must retain its embedded geometry contract");
  const embedded = JSON.parse(geometryMatch[1]) as unknown;
  const sha256 = createHash("sha256").update(html).digest("hex");

  assert.deepEqual(embedded, LADIES_CSS_MASTER_GEOMETRY);
  assert.equal(sha256, LADIES_CSS_EDITORIAL_RECIPE.source.sha256);
  assert.equal(
    LADIES_CSS_EDITORIAL_RECIPE.source.publicPath,
    "/generated-flyers/ladies-reference-master.html"
  );
  assert.equal(
    LADIES_CSS_EDITORIAL_RECIPE.source.geometryScriptId,
    "ladies-css-master-geometry"
  );
  assert.equal(LADIES_CSS_EDITORIAL_RECIPE.source.regionAttribute, "data-region");
  assert.equal(LADIES_CSS_EDITORIAL_RECIPE.id, "ladies-css-editorial");
  assert.equal(LADIES_CSS_EDITORIAL_RECIPE.version, 4);
  assert.doesNotMatch(JSON.stringify(LADIES_CSS_EDITORIAL_RECIPE), /tropical/i);
});

test("Ladies Venue uses current split controls and per-glyph interaction bounds", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /cocoLadiesCssEditorialActive[\s\S]{0,900}?justifyItems:[\s\S]{0,180}?venueAlign === "right"[\s\S]{0,160}?venueAlign === "center"/,
    "Venue alignment must move Ladies text inside its recipe zone"
  );
  assert.match(
    source,
    /cocoLadiesCssEditorialActive[\s\S]{0,1800}?data-node="venueName"[\s\S]{0,900}?<TextPixelHitLayer[\s\S]{0,300}?fontSize=\{cocoRushVenueStyles\.venueNameSize\}/,
    "Ladies Venue Name must use its measured glyph box"
  );
  assert.match(
    source,
    /data-node="venueAddress"[\s\S]{0,1000}?fontSize=\{cocoRushVenueStyles\.addressSize\}/,
    "Ladies Address must use its independent saved size and glyph box"
  );
});

test("Ladies circular CSS copy maps to Coco's editable Circular Text controls", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /function buildCocoCircularComplianceSvg\(text: string, color: string, fontSize = 16\)/,
    "Circular Text exposes a real editable font-size input"
  );
  assert.match(
    source,
    /if \(isCircularTextAsset\)[\s\S]{0,500}?labelSize: v[\s\S]{0,160}?svgTemplate: circularTemplate/,
    "changing Circular Text size rebuilds its editable SVG"
  );
  assert.match(source, /migrateCocoLadiesCssProjectState/, "existing Ladies project files receive the asset migration");
});

test("Ladies Details is wired to multiline glyph bounds and durable editor state", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /cocoLadiesCssEditorialActive \? \{\} : textCanvasBox\(moveTarget === "details"\)/,
    "Ladies Details must not expose the fixed CSS zone as its text box"
  );
  assert.match(
    source,
    /data-node="detailsValue"[\s\S]{0,240}?textAlign: detailsAlign[\s\S]{0,100}?whiteSpace: "pre-wrap"[\s\S]{0,500}?<TextPixelHitLayer[\s\S]{0,220}?align=\{detailsAlign\}/,
    "Ladies Details alignment and selection must follow its multiline glyphs"
  );
  assert.match(
    source,
    /wrapWidth=\{[\s\S]{0,180}?cocoTextFitZones\.leftInfo\.width[\s\S]{0,80}?\* 540/,
    "Ladies Details hit geometry must wrap to the authored legal-copy zone"
  );
  assert.match(
    source,
    /value=\{details\}[\s\S]{0,700}?setDetails\(lockup.value\);[\s\S]{0,100}?setSessionValue\(format, "details" as any, lockup.value\)/,
    "the desktop Details field must persist to the active format session"
  );
  assert.match(
    source,
    /case "details":[\s\S]{0,260}?sizeMin: 1,[\s\S]{0,80}?sizeStep: 0\.5/,
    "the floating Details editor must allow recipe-scale type below ten"
  );
  assert.match(
    source,
    /<Stepper[\s\S]{0,80}?label="Size"[\s\S]{0,400}?setSessionValue\(format, "detailsSize" as any, value\)[\s\S]{0,180}?min=\{1\}[\s\S]{0,80}?step=\{0\.5\}/,
    "the Details collapsible must use the same saved low-size range"
  );
  assert.match(
    source,
    /case "details":[\s\S]{0,1200}?onText:[\s\S]{0,100}?setSessionValue\(format, "details" as any, v\)/,
    "the floating Details field must persist to the active format session"
  );
});

test("Ladies DJ Lineup and Admission edits persist through their native controls", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /case "details2":[\s\S]{0,1300}?setDetails2\(v\);[\s\S]{0,100}?setSessionValue\(format, "details2" as any, v\)/,
    "the floating DJ Lineup editor must persist its text"
  );
  assert.match(
    source,
    /value=\{details2\}[\s\S]{0,800}?setDetails2\(lockup.value\);[\s\S]{0,100}?setSessionValue\(format, "details2" as any, lockup.value\)/,
    "the DJ Lineup collapsible must persist its text"
  );
  assert.match(
    source,
    /cocoLadiesCssEditorialActive && cocoTextFitZones\?\.rightInfo[\s\S]{0,120}?cocoTextFitZones\.rightInfo\.width/,
    "Ladies DJ Lineup selection geometry must wrap to its authored zone"
  );
  assert.match(
    source,
    /activeCocoQuickLadiesCss \? "Admission" : "Entry Price"[\s\S]{0,4000}?activeCocoQuickRushNight \|\| activeCocoQuickLadiesCss[\s\S]{0,300}?setSessionValue\(format, "price", e\.target\.value\)/,
    "Ladies Admission must accept free text instead of the generic numeric-only price input"
  );
});

test("the saved Ladies master contains editable Circular Text in both formats", async () => {
  const project = JSON.parse(
    await readFile(new URL("../public/generated-flyers/ladies-css-coco.nflyer", import.meta.url), "utf8")
  );
  const state = project.state ?? project;
  for (const [format, variant] of [["square", state.session?.square], ["story", state.session?.story]] as const) {
    assert.equal(variant?.cocoVisualRecipeVersion, 4);
    assert.equal(variant?.cocoVisualRecipeMaterializedVersion, 4);
    const ring = variant?.portraits?.find(
      (asset: { id?: string }) => asset.id === `coco_ladies_css_date_ring_${format}`
    );
    assert.equal(ring?.isCircularText, true);
    assert.equal(ring?.isShapeGraphic, false);
    assert.equal(ring?.label, "LA VIDA · LA VIDA · LA VIDA · LA VIDA ·");
    assert.ok(Number(ring?.labelSize) > 0, `${format} Circular Text must preserve its saved editable size`);
  }
});

test("Ladies CSS source geometry records the authored 900 by 1200 regions", () => {
  const source = LADIES_CSS_MASTER_GEOMETRY;

  assert.deepEqual(source.canvas, { width: 900, height: 1200, ratio: "3:4" });
  assert.deepEqual(source.photo, {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fit: "cover",
    positionX: 50,
    positionY: 0,
  });
  assert.deepEqual(source.photoContrast, {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    kind: "two-axis-photo-control",
  });
  assert.deepEqual(source.headline, {
    x: 8,
    y: 8.2,
    width: 84,
    height: 16.8,
    font: "Avigea",
    fontSizePx: 210,
    trackingEm: -0.058,
  });
  assert.deepEqual(source.script, {
    x: 15.5,
    y: 73,
    width: 72,
    height: 12.5,
    font: "Open Script",
    fontSizePx: 142,
    rotationDeg: -2.1,
  });
  assert.deepEqual(source.footerContrast, {
    x: 0,
    y: 74,
    width: 100,
    height: 26,
    kind: "transparent-to-solid-fade",
  });
  assert.deepEqual(source.footerRule, { x: 7.6, y: 85.8, width: 84.8, heightPx: 1 });
  assert.deepEqual(source.signoff, {
    x: 8,
    y: 96.7,
    width: 84,
    height: 1,
    bottom: 2.3,
  });
  assert.deepEqual(source.zOrder, [
    "photo",
    "photo-contrast",
    "footer-contrast",
    "headline",
    "headline-swash",
    "presenter",
    "policies",
    "date",
    "script",
    "footer-rule",
    "venue",
    "legal",
    "age",
    "time",
    "signoff",
  ]);
});

test("Square and Story use explicit CSS-derived adaptations for their aspect ratios", () => {
  const square = getLadiesCssEditorialFormatRecipe("square");
  const story = getLadiesCssEditorialFormatRecipe("story");

  assert.deepEqual(square.canvas, { width: 540, height: 540 });
  assert.deepEqual(story.canvas, { width: 540, height: 960 });
  assert.deepEqual(Object.keys(square.zones), Object.keys(story.zones));
  assert.deepEqual(square.zones.headline, {
    x: 8,
    y: 7,
    width: 84,
    height: 22.4,
  });
  assert.deepEqual(story.zones.headline, {
    x: 8,
    y: 6.15,
    width: 84,
    height: 12.6,
  });
  assert.deepEqual(story.zones.script, {
    x: 15.5,
    y: 79.75,
    width: 72,
    height: 9.375,
  });
  assert.deepEqual(story.zones.footerContrast, {
    x: 0,
    y: 80.5,
    width: 100,
    height: 19.5,
  });
  assert.equal(square.zones.footerRule.height, 100 / 540);
  assert.equal(story.zones.footerRule.height, 100 / 960);
  assert.equal(square.imageFit.mode, "cover");
  assert.equal(story.imageFit.mode, "cover");
  assert.equal(square.imageFit.positionX, 50);
  assert.equal(story.imageFit.positionY, 0);
  assert.equal(square.imageFit.preserveUserScale, true);
  assert.equal(story.imageFit.preserveUserScale, true);
  assert.equal(square.variant.headlineFamily, "Avigea");
  assert.equal(story.variant.headlineFamily, "Avigea");
  assert.equal(square.variant.head2Family, "OpenScript");
  assert.equal(story.variant.head2Family, "OpenScript");
  assert.equal(square.variant.headX, square.zones.headline.x);
  assert.equal(story.variant.headY, story.zones.headline.y);
  assert.equal(square.variant.head2X, square.zones.script.x);
  assert.equal(story.variant.head2Y, story.zones.script.y);
  assert.deepEqual(square.variant.cocoRushVenueStyles, {
    venueNameSize: 22.8,
    addressSize: 6,
    gap: 4,
    venueNameColor: "#F8F6F0",
    addressColor: "#F8F6F0",
  });
  assert.deepEqual(story.assets.scriptUnderline, {
    x: 50.78,
    y: 87.15625,
    width: 30.96,
    height: 0.1875,
    rotation: -5.1,
  });
  assert.deepEqual(square.assets.scriptUnderline, {
    x: 50.78,
    y: 72.693,
    width: 30.96,
    height: 0.3333333333333333,
    rotation: -5.1,
  });
});

test("the recipe explicitly owns layout, palette, SVG assets and crop", () => {
  const authority = LADIES_CSS_EDITORIAL_RECIPE.runtime.authority;

  assert.deepEqual(authority.downstreamMustObey, [
    "recipe-format-zones",
    "recipe-palette",
    "recipe-assets",
    "recipe-image-fit",
  ]);
  assert.equal(authority.layout.owner, "recipe-format-zones");
  assert.equal(authority.layout.genericTemplateMayOverride, false);
  assert.equal(authority.palette.owner, "recipe-palette");
  assert.equal(authority.palette.generatedPaletteMayOverride, false);
  assert.equal(authority.assets.owner, "recipe-assets");
  assert.equal(authority.assets.genericDecorationAllowed, false);
  assert.equal(authority.assets.generatedBackgroundAllowed, false);
  assert.equal(authority.crop.owner, "recipe-image-fit");
  assert.equal(authority.crop.genericCropMayOverride, false);
  assert.deepEqual(LADIES_CSS_EDITORIAL_RECIPE.runtime.assetPolicy, {
    allowOnlyRecipeAssets: true,
    autoAddGenericSocialIcons: false,
    autoAddPriceBadge: false,
    autoAddQr: false,
    autoAddTexture: false,
    autoGenerateBackground: false,
  });
  assert.equal(LADIES_CSS_EDITORIAL_RECIPE.targetAssets?.backgroundUrl, undefined);
  assert.match(
    LADIES_CSS_EDITORIAL_RECIPE.targetAssets?.notes?.join("\n") ?? "",
    /replaceable user-photo placeholder/i
  );
});

test("the composition remains semantic, editable and deeply immutable", () => {
  const composition = LADIES_CSS_EDITORIAL_RECIPE.composition;
  assert.ok(composition);

  assert.deepEqual(
    composition.roles.map((role) => role.id),
    [
      "photo",
      "photoControl",
      "footerContrast",
      "headline",
      "headlineSwash",
      "presenter",
      "policies",
      "date",
      "script",
      "scriptUnderline",
      "footerRule",
      "venue",
      "legal",
      "age",
      "time",
      "signoff",
    ]
  );
  assert.ok(composition.roles.every((role) => role.editable === true));
  assert.deepEqual(
    composition.roles.filter((role) => role.required).map((role) => role.id),
    ["photo", "photoControl", "footerContrast", "headline", "date", "script", "venue", "time"]
  );
  assert.match(composition.layoutRules.join("\n"), /generic template placer/i);
  assert.match(composition.generationSteps.join("\n"), /seven unlocked recipe SVG assets/i);
  assertDeepFrozen(LADIES_CSS_MASTER_GEOMETRY);
  assertDeepFrozen(LADIES_CSS_EDITORIAL_RECIPE);
  assertDeepFrozen(getLadiesCssEditorialFormatRecipe("square"));
  assertDeepFrozen(getLadiesCssEditorialFormatRecipe("story"));

  assert.throws(() => {
    (getLadiesCssEditorialFormatRecipe("story").zones.headline as { x: number }).x = 0;
  }, TypeError);
  assert.equal(getLadiesCssEditorialFormatRecipe("story").zones.headline.x, 8);
});


test("rebuilt Ladies formats keep independent editable fields and visible circular text", async () => {
  const project=JSON.parse(await readFile(new URL("../public/generated-flyers/ladies-css-coco.nflyer",import.meta.url),"utf8"));
  for(const format of ["square","story"]){
    const variant=project.state.session[format];
    const objects=variant.cocoCompositionSystem.compiledDocument.objects;
    assert.equal(variant.headlineFamily,"Avigea");
    assert.equal(variant.head2Family,"OpenScript");
    assert.equal(variant.head2Fx.uppercase,false);
    assert.equal(variant.headShadow,true);
    assert.equal(variant.head2Shadow,true);
    const editable=objects.filter((o:any)=>o.kind==="text");
    assert.equal(new Set(editable.map((o:any)=>o.binding.text)).size,editable.length);
    for(const id of ["venue","venueSuffix","address","musicLabel","music","hypeLabel","hype"]){
      const object=editable.find((o:any)=>o.id===id);
      assert.ok(object?.binding.mappedControls,id+" has editor controls");
      assert.ok(object?.binding.pixelHitBounds,id+" uses glyph selection");
    }
    const ring=variant.portraits.find((a:any)=>a.isCircularText);
    const photo=variant.portraits.find((a:any)=>a.cocoCompiledObjectId==="photo");
    assert.ok(ring.layerOffset>photo.layerOffset,"date ring stays above photograph");
    assert.equal(ring.scale,1,"compiled ring geometry is not scaled twice");
    assert.equal(variant.cocoCssCompiler.report.unsupported,0);
  }
});

test("Ladies portable recipe preserves its master and replaces supplied event fields", async () => {
  const {materializeCocoPortableRecipeVariant,COCO_PORTABLE_RECIPE_PROJECT_URLS}=await import('../lib/coco/portableRecipeRuntime.ts');
  assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS['ladies-css-editorial'],'/generated-flyers/ladies-css-coco.nflyer');
  const project=JSON.parse(await readFile(new URL('../public/generated-flyers/ladies-css-coco.nflyer',import.meta.url),'utf8'));
  for(const format of ['square','story']){
    const source=project.state.session[format];
    const target=materializeCocoPortableRecipeVariant('ladies-css-editorial',source,{
      eventName:'GIRLS NIGHT',eventBrief:{venueName:'NEW VENUE',address:'NEW ADDRESS',date:'August 28, 2026'},
      backgroundSrc:'/replacement.jpg',backgroundSelectionExplicit:true,
    });
    assert.equal(target.headline,'GIRLS NIGHT');
    assert.equal(target.head2line,'Wednesday');
    assert.equal(target.venue,'NEW VENUE');
    assert.equal(target.ladiesVenueSuffix,'');
    assert.equal(target.venueAddress,'NEW ADDRESS');
    assert.match(target.date,/28/);
    assert.equal(target.portraits.find((a:any)=>a.cocoCompiledObjectId==='photo').url,'/replacement.jpg');
    assert.equal(source.headline,'LADIES');
  }
});
