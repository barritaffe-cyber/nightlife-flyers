import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getNeonNightShiftFormatRecipe, NEON_NIGHT_SHIFT_RECIPE } from "../lib/recipes/neonNightShift.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";

test("Neon Night Shift is one authoritative registered recipe", () => {
  assert.equal(NEON_NIGHT_SHIFT_RECIPE.version, 11);
  assert.equal(getVisualRecipe("neon-night-shift"), NEON_NIGHT_SHIFT_RECIPE);
  assert.equal(VISUAL_RECIPES.filter((recipe) => recipe.id === "neon-night-shift").length, 1);
});

test("CSS provenance and independently authored formats remain intact", async () => {
  const html = await readFile(new URL("../public/generated-flyers/neon-night-shift-reference-master.html", import.meta.url));
  assert.equal(createHash("sha256").update(html).digest("hex"), NEON_NIGHT_SHIFT_RECIPE.measurementReference?.measurements.sourceSha256);
  assert.deepEqual(getNeonNightShiftFormatRecipe("story").canvas, { width: 1080, height: 1920 });
  assert.deepEqual(getNeonNightShiftFormatRecipe("square").canvas, { width: 1080, height: 1080 });
  assert.notDeepEqual(getNeonNightShiftFormatRecipe("story").zones, getNeonNightShiftFormatRecipe("square").zones);
});

test("archived version 10 master retains its original root, Square and Story provenance", async () => {
  const project = JSON.parse(await readFile(new URL("../public/generated-flyers/neon-night-shift.nflyer", import.meta.url), "utf8"));
  const state = project.state;
  for (const variant of [state, state.session.square, state.session.story]) {
    assert.equal(variant.cocoVisualRecipeId, "neon-night-shift");
    assert.equal(variant.cocoVisualRecipeVersion, 10);
    assert.equal(variant.cocoVisualRecipeMaterializedVersion, 10);
    assert.equal(variant.cocoCompositionSystem.patternId, "neon-night-shift");
    assert.equal(variant.cocoCompositionMap.patternId, "neon-night-shift");
    assert.equal(variant.cocoCompositionSystem.rendererZones.headline.x, variant.headX);
    assert.ok(Number.isFinite(variant.timeX));
    assert.ok(Number.isFinite(variant.timeY));
    assert.equal(variant.cocoCompositionSystem.rendererZones.doors.x, variant.timeX);
    assert.equal(variant.cocoCompositionSystem.rendererZones.doors.y, variant.timeY);
    assert.ok((Array.isArray(variant.portraits) ? variant.portraits : variant.emojiList).length >= 21);
  }
  assert.equal(state.session.square.format, "square");
  assert.equal(state.session.story.format, "story");
  assert.equal(state.session.square.headline, "NIGHT");
  assert.equal(state.session.story.head2line, "Shift");
  assert.deepEqual(
    state.cocoLayoutSessions.square[state.session.square.cocoCenterLayoutOptionId],
    state.session.square,
  );
  assert.deepEqual(
    state.cocoLayoutSessions.story[state.session.story.cocoCenterLayoutOptionId],
    state.session.story,
  );
  assert.equal(state.cocoCampaignId, "coco-neon-night-shift-master");
  assert.doesNotMatch(JSON.stringify(project), /rush-night|coco-rush/i);
  for (const format of ["square", "story"] as const) {
    for (const asset of state.session[format].portraits) {
      assert.equal(typeof asset.url, "string");
      assert.ok(asset.url.length > 0, `${format} ${asset.id} has a renderable URL`);
      assert.equal(asset.src, undefined);
    }
  }
});

test("the live Coco renderer recognizes Neon Night Shift's authored editorial geometry", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /cocoMaterializedVisualRecipe\?\.id === NEON_NIGHT_SHIFT_RECIPE\.id/);
  assert.match(page, /const cocoRushNightActive =\s*\n\s*cocoMaterializedVisualRecipe\?\.id === RUSH_NIGHT_RECIPE\.id;/);
  assert.match(page, /const cocoNeonNightShiftActive =[\s\S]{0,120}?NEON_NIGHT_SHIFT_RECIPE\.id/);
  assert.match(page, /const cocoNeonNightShiftActive =[\s\S]{0,180}?isCocoNeonNightShiftVariant\(cocoActiveFormatVariant\)/);
  assert.match(page, /priceEnabled && price && \(!cocoTypographyStackOwns\("price"\) \|\| cocoNeonNightShiftActive \|\| cocoGlowInTheDarkActive\)/);
  assert.match(page, /if \(!isCocoComposerTemplateActive\) \{\s*setPriceText\(e\.target\.value\);/);
  assert.match(page, /isCocoNeonNightShiftVariant\(centerSessionVariant\)[\s\S]{0,260}?materialize: applyCocoNeonNightShiftVariant/);
  assert.match(page, /function applyCocoNeonNightShiftVariant\([\s\S]{0,9000}?headX: zones\.headline\.x/);
  assert.match(page, /function applyCocoNeonNightShiftVariant\([\s\S]{0,5000}?alreadyMaterialized[\s\S]{0,1400}?\.\.\.source/);
  assert.match(page, /CSS bounds seed the editable asset's dimensions[\s\S]{0,500}?left: `\$\{p\.x\}%`/);
  assert.match(page, /migrateCocoNeonNightShiftProjectState\([\s\S]{0,180}?migrateCocoLadiesCssProjectState/);
  assert.match(page, /function migrateCocoNeonNightShiftProjectState\([\s\S]{0,2200}?cocoLayoutSessions/);
  assert.match(page, /materializedCocoRecipeBlocksGenericLayout\([\s\S]{0,100}?session\?\.\[format\][\s\S]{0,180}?cocoLayoutDirty/);
  assert.match(page, /cocoIndependentTimeObjectActive && \(timeLabel \|\| time\)[\s\S]{0,700}?data-node="time"/);
  assert.match(page, /data-node="time"[\s\S]{0,260}?getTemplateLabelDragHandlers\("time", timeX, timeY, onTimeMove\)/);
  assert.match(page, /data-node="timeLabel"[\s\S]{0,700}?active=\{selectedPanel === "timeLabel"\}/);
  assert.match(page, /data-node="timeValue"[\s\S]{0,700}?active=\{selectedPanel === "time"\}/);
  assert.match(page, /text=\{cocoIndependentTimeObjectActive \? date : \[date, time\]\.filter\(Boolean\)\.join\("\\n"\)\}/);
  assert.match(page, /case "timeLabel":[\s\S]{0,1600}?label: "Time Label"/);
  assert.match(page, /case "time":[\s\S]{0,1500}?label: "Time"/);
  assert.match(page, /timeX=\{timeX\}[\s\S]{0,100}?timeY=\{timeY\}/);
  assert.match(page, /onTimeMove=\{onTimeMoveRafSafe\}/);
  assert.match(page, /eventBrief\.bottleSpecials[\s\S]{0,240}?eventBrief\.additionalOffers/);
  assert.match(page, /eventBrief\.rsvpContact \|\| eventBrief\.bookingContact/);
  assert.match(page, /activeCocoQuickNeonNightShift \? "Special Offer" : "Event Format \/ Music Policy"/);
  assert.equal((page.match(/renderTextLabelControls\(\{/g) ?? []).length, 7);
  assert.match(page, /leftRailLabel=\{leftRailLabel\}[\s\S]{0,220}?leftRailLabelBgColor=\{leftRailLabelBgColor\}/);
  assert.match(page, /rightRailLabel=\{rightRailLabel\}[\s\S]{0,220}?rightRailLabelBgColor=\{rightRailLabelBgColor\}/);
  assert.match(page, /timeLabel=\{timeLabel\}[\s\S]{0,220}?timeLabelBgColor=\{timeLabelBgColor\}/);
  assert.match(page, /priceLabel=\{priceLabel\}[\s\S]{0,220}?priceLabelBgColor=\{priceLabelBgColor\}/);
  assert.match(page, /complianceLabel=\{complianceLabel\}[\s\S]{0,220}?complianceLabelBgColor=\{complianceLabelBgColor\}/);
  assert.match(page, /cocoNeonNightShiftActive \? 150 : headlineLayerZ/);
  assert.match(page, /cocoNeonNightShiftActive \? 160 : head2LayerZ/);
  assert.equal(NEON_NIGHT_SHIFT_RECIPE.runtime.authority.layout.genericTemplateMayOverride, false);
  assert.equal(NEON_NIGHT_SHIFT_RECIPE.runtime.authority.palette.generatedPaletteMayOverride, false);
});
