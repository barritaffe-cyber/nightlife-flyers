import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getCocoArtDirection } from "../components/coco/artDirections/index.ts";
import { buildCocoCompositionSystemFromLayout } from "../components/coco/compositionDirector.ts";
import type {
  CocoCreativeBrief,
  CocoTournamentZoneMap,
} from "../components/coco/layoutTournament/types.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
  splitFashionClubVerticalHeadline,
} from "../lib/recipes/fashionClubVertical.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";

test("the public registry contains only authored Coco recipes", () => {
  assert.deepEqual(
    VISUAL_RECIPES.map((recipe) => recipe.id),
    [
      "fashion-club-vertical",
      "ladies-css-editorial",
      "rush-night-css",
      "neon-night-shift",
      "glow-in-the-dark",
      "punta-cana-sundays",
      "baddies-n-bundles",
    ]
  );
  assert.equal(getVisualRecipe("triple-hero-takeover-red-system"), undefined);
  assert.equal(getVisualRecipe("center-hero-subject-title-system"), undefined);
  assert.equal(getVisualRecipe("sample01-fantasy-portrait-flyer"), undefined);
});

test("the saved Fashion Club v2 master contains clean Square and Story recipe sessions", async () => {
  const project = JSON.parse(
    await readFile(new URL("../public/generated-flyers/fashion-club-vertical.nflyer", import.meta.url), "utf8")
  );
  const state = project.state ?? project;
  assert.equal(state.cocoVisualRecipeVersion, 2);
  assert.equal(state.cocoVisualRecipeMaterializedVersion, 2);
  for (const format of ["square", "story"] as const) {
    const variant = state.session?.[format];
    assert.equal(variant?.cocoVisualRecipeId, "fashion-club-vertical");
    assert.equal(variant?.cocoVisualRecipeVersion, 2);
    assert.equal(variant?.cocoVisualRecipeMaterializedVersion, 2);
    assert.equal(variant?.cocoCompositionSystem?.patternId, "fashion-club-vertical");
    const ids = (state.portraits?.[format] ?? []).map((asset: { id?: string }) => asset.id);
    assert.ok(ids.includes(`coco_fashion_club_arrow_${format}`));
    assert.ok(ids.includes(`coco_fashion_club_circles_${format}`));
    assert.ok(ids.every((id: string) => !/_[0-9]{10,}_/.test(id)));
  }
});

test("Fashion Club exposes its footer assurance as editable Compliance copy", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(
    source,
    /const complianceUsesAgeInput =[\s\S]{0,180}!isCocoFashionClubVerticalVariant\(session\?\.\[format\]\)/,
    "Fashion compliance must use the normal text editor rather than the age-only input"
  );
  assert.match(
    source,
    /value=\{complianceUsesAgeInput \? complianceText\.replace\(\/\[\^0-9\]\/g, ""\) : complianceText\}/,
    "the Compliance textarea must display the saved Fashion footer copy"
  );
  assert.match(source, /rows=\{complianceUsesAgeInput \? 1 : 3\}/, "Fashion compliance accepts multiple lines");
  assert.match(
    source,
    /data-node="complianceValue"[\s\S]{0,260}?textAlign: complianceAlign[\s\S]{0,120}?whiteSpace: "pre-wrap"[\s\S]{0,80}?width: "100%"/,
    "Compliance alignment applies to multiline text inside the authored zone"
  );
  assert.match(
    source,
    /data-node="complianceValue"[\s\S]{0,650}?<TextPixelHitLayer[\s\S]{0,260}?align=\{complianceAlign\}/,
    "Compliance exposes a measured glyph hit box"
  );
  assert.match(
    source,
    /isCocoCircularComplianceLayout[\s\S]{0,60}\|\| cocoFashionClubRailActive[\s\S]{0,60}\? \{\}[\s\S]{0,60}: textCanvasBox/,
    "Fashion compliance does not draw its fixed recipe zone as the text box"
  );
  assert.match(
    source,
    /setSessionValue\(format, "compliance" as any, value\)/,
    "Compliance edits persist immediately to the active format session"
  );
});

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

test("Fashion Club is one versioned registry recipe linked from its art direction", () => {
  const direction = getCocoArtDirection("fashion-club-vertical");
  assert.ok(direction);
  assert.equal(direction.visualRecipeId, FASHION_CLUB_VERTICAL_RECIPE.id);

  const registered = VISUAL_RECIPES.filter(
    (recipe) => recipe.id === FASHION_CLUB_VERTICAL_RECIPE.id
  );
  assert.equal(registered.length, 1);
  assert.equal(registered[0], FASHION_CLUB_VERTICAL_RECIPE);
  assert.equal(getVisualRecipe(direction.visualRecipeId), FASHION_CLUB_VERTICAL_RECIPE);
  assert.equal(FASHION_CLUB_VERTICAL_RECIPE.version, 2);
  assert.equal(FASHION_CLUB_VERTICAL_RECIPE.referenceMode, "measurement-only");
  assert.equal(FASHION_CLUB_VERTICAL_RECIPE.measurementReference?.mode, "measurement-only");
  assert.ok(
    FASHION_CLUB_VERTICAL_RECIPE.measurementReference?.deniedUses.includes(
      "flattened finished artwork"
    )
  );
  assert.ok(
    FASHION_CLUB_VERTICAL_RECIPE.composition?.deniedReferenceUses?.includes(
      "flattened canvas"
    )
  );
});

test("Fashion Club stores editable semantic roles rather than flattened artwork", () => {
  const composition = FASHION_CLUB_VERTICAL_RECIPE.composition;
  assert.ok(composition);

  assert.deepEqual(
    composition.roles.map((role) => role.id),
    [
      "heroPhoto",
      "contrastFloor",
      "magentaGlow",
      "lightPaint",
      "headlinePrimary",
      "headlineSecondary",
      "presenter",
      "social",
      "talentPolicy",
      "date",
      "doors",
      "venue",
      "optionalBadge",
      "footerFrame",
      "reservation",
      "compliance",
    ]
  );
  assert.ok(composition.roles.every((role) => role.editable === true));
  assert.deepEqual(
    composition.roles.filter((role) => role.required).map((role) => role.id),
    ["heroPhoto", "contrastFloor", "headlinePrimary", "venue"]
  );
  assert.equal(
    composition.roles.find((role) => role.id === "headlinePrimary")?.kind,
    "headline"
  );
  assert.equal(
    composition.roles.find((role) => role.id === "headlineSecondary")?.kind,
    "headline"
  );
  assert.match(FASHION_CLUB_VERTICAL_RECIPE.appNotes.join("\n"), /unlocked/i);
});

test("Fashion Club keeps one coordinated Square and Story campaign grammar", () => {
  const square = getFashionClubVerticalFormatRecipe("square");
  const story = getFashionClubVerticalFormatRecipe("story");
  const measurements = FASHION_CLUB_VERTICAL_RECIPE.measurementReference?.measurements;
  assert.ok(measurements);

  assert.deepEqual(Object.keys(square.zones), Object.keys(story.zones));
  assert.deepEqual(square.subjectRect, story.subjectRect);
  assert.equal(FASHION_CLUB_VERTICAL_RECIPE.runtime.railRotation, -90);
  assert.equal(square.variant.headRotate, FASHION_CLUB_VERTICAL_RECIPE.runtime.railRotation);
  assert.equal(square.variant.head2Rotate, FASHION_CLUB_VERTICAL_RECIPE.runtime.railRotation);
  assert.equal(story.variant.headRotate, FASHION_CLUB_VERTICAL_RECIPE.runtime.railRotation);
  assert.equal(story.variant.head2Rotate, FASHION_CLUB_VERTICAL_RECIPE.runtime.railRotation);

  assert.deepEqual(measurements.squarePrimaryRailRect, square.zones.headlinePrimary);
  assert.deepEqual(measurements.squareSecondaryRailRect, square.zones.headlineSecondary);
  assert.deepEqual(measurements.squareTalentPolicyRect, square.zones.talentPolicy);
  assert.deepEqual(measurements.squareDateRect, square.zones.date);
  assert.deepEqual(measurements.squareReservationRect, square.zones.reservation);
  assert.deepEqual(measurements.storyPrimaryRailRect, story.zones.headlinePrimary);
  assert.deepEqual(measurements.storySecondaryRailRect, story.zones.headlineSecondary);
  assert.deepEqual(measurements.storyTalentPolicyRect, story.zones.talentPolicy);
  assert.deepEqual(measurements.storyDateRect, story.zones.date);
  assert.deepEqual(measurements.storyReservationRect, story.zones.reservation);

  for (const format of [square, story]) {
    assert.ok(format.zones.headlinePrimary.height > format.zones.headlinePrimary.width * 3);
    assert.ok(format.zones.headlineSecondary.height > format.zones.headlineSecondary.width * 3);
    assert.ok(format.zones.talentPolicy.x < format.zones.date.x);
    assert.ok(format.zones.doors.y > format.zones.date.y + format.zones.date.height);
    assert.ok(format.zones.reservation.y > format.zones.venue.y + format.zones.venue.height);
    assert.ok(format.zones.compliance.y > format.zones.reservation.y);
  }
});

test("Fashion Club owns one canonical image-fit contract for each format", () => {
  const square = getFashionClubVerticalFormatRecipe("square");
  const story = getFashionClubVerticalFormatRecipe("story");

  assert.deepEqual(square.imageFit, {
    focalTarget: { x: 35, y: 24 },
    scale: 1.25,
    preserveUserScale: true,
  });
  assert.deepEqual(story.imageFit, {
    focalTarget: { x: 31, y: 14 },
    scale: 1.32,
    preserveUserScale: true,
  });
  assert.notDeepEqual(square.imageFit.focalTarget, story.imageFit.focalTarget);
  assert.ok(story.imageFit.scale > square.imageFit.scale);
});

test("Fashion Club headline splitting preserves one word and balances multiword rails", () => {
  assert.deepEqual(splitFashionClubVerticalHeadline(""), {
    primary: "",
    secondary: "",
  });
  assert.deepEqual(splitFashionClubVerticalHeadline("Friday"), {
    primary: "Friday",
    secondary: "",
  });
  assert.deepEqual(splitFashionClubVerticalHeadline("  Friday   Fever  "), {
    primary: "Friday",
    secondary: "Fever",
  });
  assert.deepEqual(splitFashionClubVerticalHeadline("THE FRIDAY NIGHT FEVER"), {
    primary: "THE FRIDAY",
    secondary: "NIGHT FEVER",
  });

  const measuredWidths: Record<string, number> = {
    RED: 100,
    "HOT FRIDAY": 102,
    "RED HOT": 120,
    FRIDAY: 1,
  };
  const measured = splitFashionClubVerticalHeadline(
    "RED HOT FRIDAY",
    (copy) => measuredWidths[copy] ?? copy.length
  );
  assert.deepEqual(measured, {
    primary: "RED",
    secondary: "HOT FRIDAY",
  });
  assert.equal(
    FASHION_CLUB_VERTICAL_RECIPE.runtime.copyPolicy.headlineSplit,
    "balanced-glyph-width"
  );
  assert.equal(
    FASHION_CLUB_VERTICAL_RECIPE.runtime.copyPolicy.oneWordHeadline,
    "hide-secondary-rail"
  );
});

test("Fashion Club stores its type, palette, assets, and clean-default rules", () => {
  const recipe = FASHION_CLUB_VERTICAL_RECIPE;
  assert.equal(recipe.runtime.fonts.headline, "Aliens Among Us");
  assert.equal(recipe.runtime.fonts.support, "Bebas Neue");
  assert.equal(recipe.runtime.fonts.utility, "LEMONMILK-Regular");
  assert.equal(recipe.runtime.palette.primary, "#F20A58");
  assert.equal(recipe.runtime.palette.secondary, "#FFF8E8");
  assert.equal(recipe.runtime.palette.accent, "#EAF238");
  assert.equal(recipe.runtime.formats.square.assets.paintRotation, -12);
  assert.equal(recipe.runtime.formats.story.assets.paintRotation, -12);
  assert.deepEqual(recipe.runtime.assetPolicy, {
    autoAddComplianceRing: false,
    autoAddFooterFlare: false,
    autoAddGenericSocialIcons: false,
    autoAddPriceBadge: false,
    autoAddQr: false,
  });
  assert.match(recipe.typography.join("\n"), /no gradient, stroke, bevel, chrome or glow/i);
  assert.match(recipe.avoid.join("\n"), /QR, price badges or generic icons/i);
  assert.match(recipe.targetAssets?.notes?.join("\n") ?? "", /ordinary unlocked Coco objects/i);
});

test("Fashion Club's canonical recipe and format accessors are deeply immutable", () => {
  const square = getFashionClubVerticalFormatRecipe("square");
  const story = getFashionClubVerticalFormatRecipe("story");

  assert.equal(square, FASHION_CLUB_VERTICAL_RECIPE.runtime.formats.square);
  assert.equal(story, FASHION_CLUB_VERTICAL_RECIPE.runtime.formats.story);
  assertDeepFrozen(FASHION_CLUB_VERTICAL_RECIPE);
  assertDeepFrozen(square);
  assertDeepFrozen(story);

  assert.throws(() => {
    (square.zones.headlinePrimary as { x: number }).x = 0;
  }, TypeError);
  assert.equal(square.zones.headlinePrimary.x, 55);

  assert.throws(() => {
    (FASHION_CLUB_VERTICAL_RECIPE.runtime.palette as { accent: string }).accent = "#000000";
  }, TypeError);
  assert.equal(FASHION_CLUB_VERTICAL_RECIPE.runtime.palette.accent, "#EAF238");
});

test("the standalone composition director consumes Fashion Club hierarchy and rhythm", () => {
  const recipe = getFashionClubVerticalFormatRecipe("story");
  const zones: CocoTournamentZoneMap = {
    date: recipe.zones.date,
    headline: recipe.zones.headlinePrimary,
    leftInfo: recipe.zones.primaryMeta,
    presenter: recipe.zones.presenter,
    price: recipe.zones.optionalBadge,
    rightInfo: recipe.zones.talentPolicy,
    script: recipe.zones.primaryMeta,
    subject: recipe.subjectRect,
    subtag: recipe.zones.doors,
    venue: recipe.zones.venue,
  };
  const composition = buildCocoCompositionSystemFromLayout({
    brief: {
      counterweight: { reason: "Fashion portrait is weighted left.", side: "right" },
      recommendedComposition: FASHION_CLUB_VERTICAL_RECIPE.runtime.compositionPattern,
      scene: { subjectPosition: "left" },
      typographyColumn: {
        alignment: "right",
        role: "counterweight",
        side: "right",
      },
    } as unknown as CocoCreativeBrief,
    format: "story",
    hasSubject: true,
    layoutId: "subject-center",
    subjectZone: recipe.subjectRect,
    zones,
  });
  const rhythm = FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm;

  assert.deepEqual(
    composition.hierarchy,
    FASHION_CLUB_VERTICAL_RECIPE.runtime.hierarchy
  );
  assert.deepEqual(composition.rhythm, {
    accentToMeta: rhythm.accentToMeta,
    dateTimeToVenue: rhythm.dateTimeToVenue,
    headlineToAccent: rhythm.headlineToAccent,
    metaToDateTime: rhythm.metaToDateTime,
  });
});
