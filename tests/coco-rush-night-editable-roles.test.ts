import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getRushNightFormatRecipe } from "../lib/recipes/rushNight.ts";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
const projectUrl = new URL(
  "../public/generated-flyers/rush-night-coco.nflyer",
  import.meta.url
);

const near = (actual: unknown, expected: number, tolerance = 0.001) =>
  Number.isFinite(Number(actual)) && Math.abs(Number(actual) - expected) <= tolerance;

test("Rush Night exposes independent editable copy roles and their controls", async () => {
  const source = await readFile(pageUrl, "utf8");
  const has = (pattern: RegExp, message: string) =>
    assert.ok(pattern.test(source), message);
  const lacks = (pattern: RegExp, message: string) =>
    assert.equal(pattern.test(source), false, message);

  has(/subtag:\s*primaryEntry/, "primary admission uses Subtag");
  has(/rightRail:\s*secondaryEntry/, "secondary admission uses Right Rail");
  has(/price,\s*\n\s*priceEnabled:\s*Boolean\(price\)/, "price uses the native Price object");
  has(/compliance,\s*\n\s*complianceEnabled:\s*false/, "Compliance retains optional age copy");
  lacks(
    /subtag:\s*\[primaryEntry,\s*secondaryEntry\]\.join/,
    "Subtag must not recombine the two admission conditions"
  );

  has(/data-price-ring-enabled=\{priceRingEnabled \? "true" : "false"\}/, "canvas exposes ring state");
  has(/if \(priceRingEnabled && priceRingAlpha > 0\)/, "export obeys ring state");
  has(/Ring \{priceRingEnabled \? "On" : "Off"\}/, "Fine Tune exposes the ring toggle");
  has(/label="Ring opacity"/, "Fine Tune exposes ring opacity");
  has(/applyIfDefined\(data\.priceRingEnabled, setPriceRingEnabled\)/, "project load restores ring state");
  has(/priceScale, priceRingEnabled, priceRingAlpha/, "project save persists ring state");

  has(/fonts:\s*HEADLINE2_FONTS_LOCAL/, "floating Subheadline editor exposes display fonts");
  has(/options=\{HEADLINE2_FONTS_LOCAL\}/, "desktop Subheadline editor exposes display fonts");
  has(/setSessionValue\(format, "head2Family", nextFamily\)/, "Subheadline font saves to the format session");

  has(/data-node="djLineupLabel"/, "MUSIC BY has a distinct rendered node");
  has(/color:\s*djLineupLabelColor/, "MUSIC BY renders its selected color");
  has(/setSessionValue\(format, "djLineupLabel" as any, value\)/, "MUSIC BY text persists");
  has(/setSessionValue\(format, "djLineupLabelColor" as any, color\)/, "MUSIC BY color persists");
  has(/label="Label Size"/, "MUSIC BY exposes an independent size slider");
  has(/setSessionValue\(format, "djLineupLabelSize" as any, value\)/, "MUSIC BY size persists");
  lacks(
    /id="template-labels-panel"[\s\S]{0,1800}?<Chip[\s\S]{0,300}?>\s*DJs\s*<\/Chip>/,
    "Template Labels does not duplicate the standalone DJ Lineup panel"
  );
  has(/djLineupLabelColor,\s*\n\s*djLineupLabelBgColor/, "MUSIC BY styling enters the live snapshot");
  has(
    /justifyItems:\s*\n?\s*dateAlign === "right"[\s\S]{0,180}?dateAlign === "center"/,
    "Rush date rail applies left, center, and right alignment to its internal rows"
  );
  has(/textAlign:\s*dateAlign/, "Rush date rail applies alignment to its text content");
  has(
    /justifyItems:\s*\n?\s*venueAlign === "right"[\s\S]{0,180}?venueAlign === "center"/,
    "Rush venue applies left, center, and right alignment to both internal rows"
  );
  has(/textAlign:\s*venueAlign/, "Rush venue applies alignment to its text content");
  has(
    /justifyContent:\s*cocoLadiesCssEditorialActive \|\| cocoRushNightActive[\s\S]{0,260}?head2Align === "right"[\s\S]{0,160}?head2Align === "center"/,
    "Rush Sub Headline alignment moves the text inside its authored zone"
  );
  has(/active=\{head2Align === "left"\}/, "Sub Headline alignment buttons use the rendered alignment state");
  has(
    /const setHead2SizeFromUser = React\.useCallback\([\s\S]{0,700}?head2Size:\s*next,[\s\S]{0,80}?head2SizePx:\s*next/,
    "Sub Headline size writes both session fields atomically so it cannot snap back"
  );
  has(/value=\{head2SizePx\}[\s\S]{0,100}?setValue=\{setHead2SizeFromUser\}/, "desktop Sub Headline uses the durable size setter");
  has(/onSize:\s*\(v: number\)[\s\S]{0,100}?setHead2SizeFromUser\(v\)/, "floating Sub Headline uses the durable size setter");
  has(/data-text-glyph-box="true"/, "editable text exposes measured glyph-sized interaction boxes");
  has(
    /data-text-glyph-box="true"[\s\S]{0,700}?filter: "none",[\s\S]{0,100}?textShadow: "none"/,
    "glyph hit geometry cannot inherit and repaint a text shadow above the visible glyphs"
  );
  has(
    /letterSpacing=\{cocoLadiesCssEditorialActive \? "-0\.05em" : cocoFashionClubRailActive \? "0\.32em" : undefined\}/,
    "Fashion Club Subtag hit bounds measure the same tracking as its rendered glyphs"
  );
  has(
    /display: cocoFashionClubRailActive \|\| cocoSubjectLayoutId === "subject-center"[\s\S]{0,100}?\? 'block'/,
    "Fashion Club Subtag uses a block text container so alignment moves glyphs inside the recipe zone"
  );
  lacks(
    /justifyContent: cocoFashionClubRailActive \? "space-between"/,
    "Fashion Club Subtag no longer lets flex positioning override text alignment"
  );
  has(/active=\{moveTarget === "headline2" \|\| selectedPanel === "head2"\}/, "Sub Headline selects its glyph box instead of its recipe zone");
  has(/flexShrink:\s*0,[\s\S]{0,100}?maxWidth:\s*cocoRushNightActive \? 'none'/, "Rush Sub Headline glyphs can grow beyond the authored alignment guide");
  has(/label="Label Size" value=\{detailsLabelSize\}/, "Event Details uses the shared label-size control pattern");
  has(/label="Address Size"/, "Rush venue exposes an independent address size slider");
  has(
    /const activeCocoSplitVenue = cocoEditorSurface === "fine"/,
    "the Fine Tune Venue panel always exposes split controls throughout session transitions"
  );
  has(
    /fontSize: `\$\{cocoRushVenueStyles\.addressSize \/ Math\.max\(1, venueSize\)\}em`/,
    "the address slider changes the rendered address glyph size"
  );
  has(/color: cocoRushVenueStyles\.addressColor/, "the address color controls the rendered address");
  has(/label="Gap" value=\{activeCocoRushVenueStyles\.gap\}/, "Venue exposes a dedicated inter-object gap slider");
  has(/columnGap: `\$\{cocoRushVenueStyles\.gap\}%`/, "Fashion Club applies Venue gap horizontally");
  has(
    /gridTemplateColumns: venueAddress \? "max-content minmax\(0, 1fr\)" : "1fr"/,
    "Fashion Club Venue starts the address after the actual Venue Name width rather than a fixed empty column"
  );
  has(/gap: `\$\{cocoRushVenueStyles\.gap \/ 10\}em`/, "stacked Venue layouts apply the same saved gap control");
  has(
    /data-node="venueName"[\s\S]{0,900}?<TextPixelHitLayer[\s\S]{0,300}?fontSize=\{cocoRushVenueStyles\.venueNameSize\}/,
    "Fashion Club Venue Name uses its own measured glyph hit box"
  );
  has(
    /data-node="venueAddress"[\s\S]{0,1000}?<TextPixelHitLayer[\s\S]{0,300}?fontSize=\{cocoRushVenueStyles\.addressSize\}/,
    "Fashion Club Address uses its own measured glyph hit box"
  );
  has(
    /cocoCenterLayoutOptionId === "subject-center-rail" \|\| cocoRushNightActive[\s\S]{0,80}?\? \{\}[\s\S]{0,80}?: textCanvasBox/,
    "split Venue recipes do not draw a fixed recipe-zone selection box"
  );
  has(/setActiveCocoRushVenueStyle\("venueNameColor", c\)/, "Rush venue name color is editable");
  has(/setActiveCocoRushVenueStyle\("addressColor", color\)/, "Rush address color is editable");

  has(
    /field === "entry"[\s\S]{0,400}?patch\.price = normalizeCocoRushNightPrice\(clean\)/,
    "Quick Edit entry routes to Price"
  );
  has(
    /field === "age"[\s\S]{0,220}?patch\.compliance = rushRecipeActive && rushAge \? `\$\{rushAge\}\+` : clean/,
    "Quick Edit age routes to Compliance"
  );
  has(/migrateCocoRushNightProjectState/, "legacy v8 projects receive a conservative migration");
  has(
    /const importedSubjectLayoutId = \(data as any\)\.cocoSubjectLayoutId;[\s\S]{0,420}?setCocoSubjectLayoutId\(importedSubjectLayoutId\)/,
    "project load restores the saved Coco subject composition"
  );
  has(
    /const importedCenterLayoutOptionId = \(data as any\)\.cocoCenterLayoutOptionId;[\s\S]{0,480}?setCocoCenterLayoutOptionId\(importedCenterLayoutOptionId\)/,
    "project load restores the saved Coco center-layout option"
  );
  has(
    /const detailsEnabled = normalizeFormatToggle\([\s\S]{0,160}?"detailsEnabled"[\s\S]{0,900}?const venueEnabled = normalizeFormatToggle\([\s\S]{0,160}?"venueEnabled"/,
    "project load normalizes initially visible Details and Venue into per-format toggles"
  );
  const migrationStart = source.indexOf("function migrateCocoRushNightEditableRoleVariant");
  const migrationEnd = source.indexOf("function migrateCocoRushNightProjectState", migrationStart);
  const migration = source.slice(migrationStart, migrationEnd);
  assert.ok(migrationStart >= 0 && migrationEnd > migrationStart, "Rush migration source is discoverable");
  assert.equal(/rightRailEnabled:\s*true/.test(migration), false, "migration preserves a disabled entry group");
  assert.ok(/migratedPriceEnabled/.test(migration), "migration preserves legacy price visibility");
  assert.ok(/migratedCompliance/.test(migration), "migration preserves real age/compliance text");
  assert.ok(/allBlocks:\s*blocks/.test(migration), "migration rebuilds allBlocks with clean entry roles");
  assert.ok(/blocks,\s*\n\s*rendererZones/.test(migration), "migration rebuilds blocks with clean entry roles");
  assert.ok(/\^#22d3ee\$/i.test(migration), "migration removes the stale cyan MUSIC BY pill");
  has(
    /id:\s*"rightRail"[\s\S]{0,360}?exportRushNightActive[\s\S]{0,180}?getRushNightFormatRecipe\(format\)\.zones\.entry\.width/,
    "Rush explicit export retains the authored secondary-admission width"
  );
});

test("the saved Rush Night master uses the clean v12 editable-role contract", async () => {
  const project = JSON.parse(await readFile(projectUrl, "utf8"));
  const state = project.state ?? project;
  const variants = [
    ["root", state.format === "story" ? "story" : "square", state],
    ["square", "square", state.session?.square],
    ["story", "story", state.session?.story],
  ] as const;

  for (const [name, format, variant] of variants) {
    assert.ok(variant, `${name} variant must exist`);
    assert.equal(variant.cocoVisualRecipeId, "rush-night-css", `${name} recipe id`);
    assert.equal(variant.cocoVisualRecipeVersion, 12, `${name} recipe version`);
    assert.equal(variant.cocoVisualRecipeMaterializedVersion, 12, `${name} materialized version`);
    if (name === "root") {
      assert.deepEqual(variant.detailsEnabled, { square: true, story: true }, "root Details visibility is format-safe");
      assert.deepEqual(variant.venueEnabled, { square: true, story: true }, "root Venue visibility is format-safe");
    }
    assert.deepEqual(variant.cocoRushDateStyles, {
      metaSize: 23,
      daySize: 48,
      openingSize: 11,
      metaColor: "#F8F5EE",
      dayColor: "#FF5A0A",
      openingColor: "#FF5A0A",
      ruleColor: "#FF5A0A",
    }, `${name} editable Rush date styles`);
    assert.deepEqual(variant.cocoRushVenueStyles, {
      venueNameSize: 8,
      addressSize: 8,
      venueNameColor: "#F8F5EE",
      addressColor: "#FF5A0A",
    }, `${name} editable Rush venue styles`);

    assert.equal(variant.subtag, "ENTRY UNTIL 00H30", `${name} primary entry`);
    assert.equal(String(variant.subtag).includes("\n"), false, `${name} primary entry is one line`);
    assert.equal(variant.rightRail, "AFTER 00H30 $30", `${name} secondary entry`);
    assert.equal(variant.rightRailEnabled, true, `${name} secondary entry enabled`);
    assert.equal(variant.price, "$20", `${name} native price`);
    assert.equal(variant.priceEnabled, true, `${name} price enabled`);
    assert.equal(variant.priceRingEnabled, false, `${name} price ring disabled`);
    assert.ok(near(variant.priceRingAlpha, 0.72), `${name} price ring alpha`);
    assert.equal(variant.compliance, "21+", `${name} compliance retains age`);
    assert.equal(variant.complianceEnabled, false, `${name} age remains optional`);
    assert.equal(variant.djLineupLabel, "MUSIC BY", `${name} lineup label`);
    assert.equal(variant.detailsLabelSize, 8, `${name} details label size`);
    assert.equal(variant.djLineupLabelSize, 8, `${name} lineup label size`);
    assert.equal(variant.djLineupLabelColor, "#FF5A0A", `${name} lineup label color`);
    assert.equal(variant.djLineupLabelBgColor, "transparent", `${name} lineup label background`);

    const recipe = getRushNightFormatRecipe(format);
    const entry = recipe.zones.entry;
    const price = recipe.assets.pricePill;
    const primary = {
      x: entry.x,
      y: entry.y,
      width: price.x - entry.x,
      height: entry.height * 0.64,
    };
    const secondary = {
      x: entry.x,
      y: entry.y + entry.height * 0.64,
      width: entry.width,
      height: entry.height * 0.36,
    };

    for (const [zoneName, actual, expected] of [
      ["subtag", variant.textZones?.subtag, primary],
      ["rightRail", variant.textZones?.rightRail, secondary],
      ["price", variant.textZones?.price, price],
      ["renderer subtag", variant.cocoCompositionSystem?.rendererZones?.subtag, primary],
      ["renderer rightRail", variant.cocoCompositionSystem?.rendererZones?.rightRail, secondary],
      ["renderer price", variant.cocoCompositionSystem?.rendererZones?.price, price],
    ] as const) {
      assert.ok(actual, `${name} ${zoneName} zone exists`);
      for (const key of ["x", "y", "width", "height"] as const) {
        assert.ok(near(actual[key], expected[key]), `${name} ${zoneName}.${key}`);
      }
    }
    assert.equal(variant.textZones?.compliance, undefined, `${name} compliance is not a price zone`);
    assert.equal(
      variant.cocoCompositionSystem?.rendererZones?.compliance,
      undefined,
      `${name} compliance is not a renderer price zone`
    );

    for (const collectionName of ["blocks", "allBlocks"] as const) {
      const sources = (variant.cocoCompositionSystem?.[collectionName] ?? []).map(
        (block: { source?: string }) => block.source
      );
      assert.ok(sources.includes("subtag"), `${name} ${collectionName} contains primary entry`);
      assert.ok(sources.includes("rightRail"), `${name} ${collectionName} contains secondary entry`);
      assert.ok(sources.includes("price"), `${name} ${collectionName} contains price`);
      assert.equal(sources.includes("compliance"), false, `${name} ${collectionName} excludes compliance`);
    }
  }

  for (const format of ["square", "story"] as const) {
    const portraits = state.session?.[format]?.portraits ?? [];
    const expectedTotal = format === "square" ? 14 : 15;
    const expectedRecipeAssets = format === "square" ? 8 : 9;
    assert.equal(portraits.length, expectedTotal, `${format} retains the updated editable asset set`);
    assert.equal(
      portraits.filter((asset: { id?: string }) => String(asset.id ?? "").startsWith("coco_rush_night_")).length,
      expectedRecipeAssets,
      `${format} retains its authored recipe assets`
    );
    assert.equal(
      portraits.filter((asset: { id?: string }) => String(asset.id ?? "").startsWith("coco_recipe_subject_")).length,
      1,
      `${format} retains the replaceable subject`
    );
    assert.equal(
      portraits.filter((asset: { id?: string }) => String(asset.id ?? "").startsWith("sticker_")).length,
      3,
      `${format} retains the three user-added social marks`
    );
    assert.equal(
      portraits.filter((asset: { id?: string }) => String(asset.id ?? "").startsWith("flare_")).length,
      2,
      `${format} retains the two user-added flare assets`
    );
    assert.deepEqual(
      (state.portraits?.[format] ?? []).map((asset: { id?: string }) => asset.id),
      portraits.map((asset: { id?: string }) => asset.id),
      `${format} root asset collection matches its format session`
    );
  }
});
