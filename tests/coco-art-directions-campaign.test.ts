import assert from "node:assert/strict";
import test from "node:test";
import {
  COCO_ART_DIRECTIONS,
  COCO_ART_DIRECTION_IDS,
  COCO_CURATED_ART_DIRECTION_IDS,
  COCO_CURATED_ART_DIRECTION_LIBRARY,
  COCO_LAUNCH_ART_DIRECTION_IDS,
  COCO_LAUNCH_ART_DIRECTIONS,
  getCocoArtDirection,
  getCocoArtDirectionsForNightlifeStyle,
  getCocoLaunchArtDirectionChoices,
  selectCocoArtDirectionChoices,
} from "../components/coco/artDirections/index.ts";
import {
  createCocoCampaignSpec,
  validateCocoCampaignSpec,
  type CocoCampaignSharedSpec,
} from "../components/coco/campaign/index.ts";
import { VISUAL_RECIPES } from "../lib/visualRecipes.ts";

const recipeDirectionIds = [
  "high-energy-club",
  "black-gold-party",
  "fashion-club-vertical",
  "sensual-night",
  "neon-night-shift",
  "glow-in-the-dark",
  "punta-cana-sundays",
  "baddies-n-bundles",
  "city-nights",
] as const;

test("Coco exposes exactly the nine active recipe-backed art directions", () => {
  assert.deepEqual(COCO_CURATED_ART_DIRECTION_IDS, recipeDirectionIds);
  assert.deepEqual(COCO_ART_DIRECTION_IDS, recipeDirectionIds);
  assert.equal(COCO_CURATED_ART_DIRECTION_LIBRARY.length, 9);
  assert.equal(COCO_ART_DIRECTIONS, COCO_CURATED_ART_DIRECTION_LIBRARY);
  assert.equal(new Set(COCO_ART_DIRECTION_IDS).size, 9);

  const registeredRecipeIds = VISUAL_RECIPES.map(({ id }) => id).sort();
  const directionRecipeIds = COCO_ART_DIRECTIONS.map(({ visualRecipeId }) =>
    String(visualRecipeId)
  ).sort();
  assert.deepEqual(directionRecipeIds, registeredRecipeIds);

  for (const direction of COCO_ART_DIRECTIONS) {
    assert.equal(getCocoArtDirection(direction.id), direction);
    assert.ok(direction.visualRecipeId);
    assert.equal(direction.subjectPolicy.preserveIdentity, true);
    assert.equal(direction.subjectPolicy.faceProtection, "strict");
    assert.ok(direction.referenceTemplateIds.square.length > 0);
    assert.ok(direction.referenceTemplateIds.story.length > 0);
  }

  for (const removedId of [
    "luxury-editorial",
    "underground-edge",
    "cinematic-lounge",
    "modern-minimal",
    "tropical-rooftop",
    "retro-celebration",
    "golden-hero-editorial",
  ]) {
    assert.equal(getCocoArtDirection(removedId), undefined);
  }
});

test("the fixed fallback trio is also recipe-backed", () => {
  assert.deepEqual(COCO_LAUNCH_ART_DIRECTION_IDS, [
    "high-energy-club",
    "fashion-club-vertical",
    "sensual-night",
  ]);
  assert.equal(COCO_LAUNCH_ART_DIRECTIONS.length, 3);
  assert.equal(getCocoLaunchArtDirectionChoices(), COCO_LAUNCH_ART_DIRECTIONS);
  assert.ok(COCO_LAUNCH_ART_DIRECTIONS.every(({ visualRecipeId }) => visualRecipeId));
});

test("style filtering cannot return a non-recipe direction", () => {
  for (const style of ["techno", "rooftop", "luxury-club", "ladies-night"] as const) {
    const directions = getCocoArtDirectionsForNightlifeStyle(style);
    assert.ok(directions.length > 0);
    assert.ok(directions.every(({ visualRecipeId }) => visualRecipeId));
  }
});

test("all selector branches return three distinct recipes", () => {
  const examples = [
    {
      eventName: "Neon Night Shift",
      eventDescription: "Cyan and magenta light on a wet black wall.",
      nightlifeStyle: "techno" as const,
    },
    {
      eventName: "Glow in the Dark",
      eventDescription: "Blacklight party with fluorescent body paint.",
      nightlifeStyle: "edm" as const,
    },
    {
      eventName: "Punta Cana Sundays",
      eventDescription: "Tropical island party with a side date rail.",
      nightlifeStyle: "latin-night" as const,
    },
    {
      eventName: "Baddies N Bundles",
      eventDescription: "Acid lime beauty night with hair bundles.",
      nightlifeStyle: "ladies-night" as const,
    },
    {
      eventName: "All White Minimal",
      eventDescription: "Keep the flyer clean, white, and minimal.",
      nightlifeStyle: "house" as const,
    },
    {
      eventName: "Midnight Gala",
      eventDescription: "Classy black and gold bottle service.",
      nightlifeStyle: "luxury-club" as const,
    },
  ];

  for (const example of examples) {
    const choices = selectCocoArtDirectionChoices(example);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(({ id }) => id)).size, 3);
    assert.ok(choices.every(({ visualRecipeId }) => visualRecipeId), example.eventName);
    assert.ok(
      choices.every(({ id }) => recipeDirectionIds.includes(id as (typeof recipeDirectionIds)[number]))
    );
  }
});

test("specific recipe names outrank vague styling instructions", () => {
  assert.equal(
    selectCocoArtDirectionChoices({
      eventName: "Glow in the Dark",
      eventDescription: "Make it clean and simple, with fluorescent body paint.",
      nightlifeStyle: "edm",
    })[0].id,
    "glow-in-the-dark"
  );
  assert.equal(
    selectCocoArtDirectionChoices({
      eventName: "Friday Fashion Fever",
      eventDescription: "A premium minimal high-fashion club night.",
      nightlifeStyle: "luxury-club",
    })[0].id,
    "fashion-club-vertical"
  );
});

const goldenShared: CocoCampaignSharedSpec = {
  assets: [
    {
      id: "hero",
      preserveAcrossFormats: true,
      role: "subject",
      src: "data:image/png;base64,hero",
    },
  ],
  copy: {
    date: "SATURDAY · 10PM",
    headline: "Tribal Night",
    venue: "The Grand Lounge",
  },
  directionId: "golden-hero-editorial",
  effects: {
    glow: 0.16,
    intensity: "moderate",
    policyId: "haze-vignette",
  },
  fonts: {
    accent: "Good Brush",
    body: "LEMONMILK-Regular",
    headline: "DM Serif Display",
    maxFamilies: 3,
    personality: "afrobeats",
    utility: "Bebas Neue",
  },
  palette: {
    accent: "#C9A94F",
    backgroundFrom: "#09070B",
    backgroundTo: "#211510",
    details: "#F4F1EA",
    headline: "#F8E7A5",
    neutral: "#FFFFFF",
    policyId: "champagne-black",
    utility: "#FFFFFF",
  },
};

test("campaign specs accept active recipe directions and reject removed directions", () => {
  const campaign = createCocoCampaignSpec({
    id: "fashion-night",
    shared: {
      ...goldenShared,
      directionId: "fashion-club-vertical",
      effects: { ...goldenShared.effects, policyId: "light-beams" },
      fonts: { ...goldenShared.fonts, personality: "editorial" },
      palette: { ...goldenShared.palette, policyId: "burgundy-rose" },
    },
  });
  assert.equal(campaign.shared.directionId, "fashion-club-vertical");
  assert.equal(campaign.layouts.square.layoutId, "subject-center");
  assert.equal(campaign.layouts.story.layoutId, "subject-center");
  assert.deepEqual(validateCocoCampaignSpec(campaign), []);

  assert.throws(
    () => createCocoCampaignSpec({ id: "tribal-night", shared: goldenShared }),
    /unknown coco art direction/i
  );

  assert.throws(
    () =>
      createCocoCampaignSpec({
        id: "removed-direction",
        shared: { ...goldenShared, directionId: "luxury-editorial" },
      }),
    /unknown coco art direction/i
  );
});
