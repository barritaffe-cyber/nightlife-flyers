import { COCO_RECIPE_CATALOG } from "../../../lib/coco/recipeCatalog.ts";
import { REMOVED_COCO_RECIPE_IDS } from '../../../lib/coco/removedRecipes.ts';
import { getVisualRecipe } from '../../../lib/visualRecipes.ts';
import assert from "node:assert/strict";
import test from "node:test";
import {
  COCO_CURATED_ART_DIRECTION_LIBRARY,
  getCocoArtDirection,
  getCocoCuratedArtDirectionsForNightlifeStyle,
  selectCocoArtDirectionChoices,
} from "./index.ts";

const recipeDirectionContracts = [
  { directionId: "summer-sunset", recipeId: "summer-sunset", style: "general-nightlife" },
  { directionId: "diabla-all-white", recipeId: "diabla-all-white", style: "latin-night" },
  { directionId: "rnb-thursdays", recipeId: "rnb-thursdays", style: "rnb-lounge" },
  { directionId: "reggae-jams", recipeId: "reggae-jams", style: "general-nightlife" },
  { directionId: "amapiano-night", recipeId: "amapiano-night", style: "afrobeats" },
  { directionId: "zona-de-perreo", recipeId: "zona-de-perreo", style: "latin-night" },
  { directionId: "como-una-boa", recipeId: "como-una-boa", style: "latin-night" },
  { directionId: "i-love-thursday", recipeId: "i-love-thursday", style: "general-nightlife" },
  { directionId: "elite-monday", recipeId: "elite-monday", style: "general-nightlife" },
  { directionId: "we-outside", recipeId: "we-outside", style: "general-nightlife" },
  { directionId: "pulse", recipeId: "pulse", style: "general-nightlife" },
  { directionId: "space-neon", recipeId: "space-neon", style: "edm" },
  { directionId: "brunch-saturday", recipeId: "brunch-saturday", style: "brunch" },
  { directionId: "brunch-vibes", recipeId: "brunch-vibes", style: "brunch" },
  {
    directionId: "dodge-night-rides",
    recipeId: "dodge-night-rides",
    style: "general-nightlife",
  },
  {
    directionId: "grey-rave-festival",
    recipeId: "grey-rave-festival",
    style: "techno",
  },
  {
    directionId: "black-gold-party",
    recipeId: "black-gold-party",
    style: "luxury-club",
  },
  {
    directionId: "high-energy-club",
    recipeId: "rush-night-css",
    style: "edm",
  },
  {
    directionId: "fashion-club-vertical",
    recipeId: "fashion-club-vertical",
    style: "luxury-club",
  },
  {
    directionId: "sensual-night",
    recipeId: "ladies-css-editorial",
    style: "ladies-night",
  },
  {
    directionId: "neon-night-shift",
    recipeId: "neon-night-shift",
    style: "techno",
  },
  {
    directionId: "glow-in-the-dark",
    recipeId: "glow-in-the-dark",
    style: "edm",
  },
  {
    directionId: "punta-cana-sundays",
    recipeId: "punta-cana-sundays",
    style: "latin-night",
  },
  {
    directionId: "baddies-n-bundles",
    recipeId: "baddies-n-bundles",
    style: "ladies-night",
  },
  {
    directionId: "city-nights",
    recipeId: "city-nights",
    style: "hip-hop",
  },
  { directionId: "mojito-monday", recipeId: "mojito-monday", style: "general-nightlife" },
  { directionId: "yacht-escape", recipeId: "yacht-escape", style: "general-nightlife" },
] as const;

test("the active recipes are the complete, style-eligible art-direction library", () => {
  assert.equal(COCO_CURATED_ART_DIRECTION_LIBRARY.length, Object.keys(COCO_RECIPE_CATALOG).length);
  assert.deepEqual(new Set(COCO_CURATED_ART_DIRECTION_LIBRARY.map(d => d.visualRecipeId)), new Set(Object.keys(COCO_RECIPE_CATALOG)));

  const signatures = new Set<string>();
  const activeContracts = recipeDirectionContracts.filter(contract => !REMOVED_COCO_RECIPE_IDS.has(contract.recipeId));
  for (const contract of recipeDirectionContracts.filter(contract => REMOVED_COCO_RECIPE_IDS.has(contract.recipeId))) {
    assert.equal(getCocoArtDirection(contract.directionId), undefined);
    assert.equal(getVisualRecipe(contract.recipeId), undefined);
    assert.ok(!(contract.recipeId in COCO_RECIPE_CATALOG));
  }
  for (const contract of activeContracts) {
    const direction = getCocoArtDirection(contract.directionId);
    assert.ok(direction);
    assert.equal(direction.visualRecipeId, contract.recipeId);
    assert.ok(direction.eligibleNightlifeStyles.includes(contract.style));
    assert.equal(direction.subjectPolicy.preserveIdentity, true);
    assert.equal(direction.subjectPolicy.faceProtection, "strict");
    assert.ok(direction.referenceTemplateIds.square.length > 0);
    assert.ok(direction.referenceTemplateIds.story.length > 0);

    signatures.add(
      [
        direction.typographyPersonality,
        direction.palettePolicy.id,
        direction.effectsPolicy.id,
        direction.layoutByFormat.square.compositionPattern,
      ].join("|")
    );
  }
  assert.equal(signatures.size, activeContracts.length);

  assert.ok(
    getCocoCuratedArtDirectionsForNightlifeStyle("techno").some(
      ({ id }) => id === "neon-night-shift"
    )
  );
  assert.ok(
    getCocoCuratedArtDirectionsForNightlifeStyle("ladies-night").some(
      ({ id }) => id === "baddies-n-bundles"
    )
  );
});

const routingExamples = [
  {
    context: {
      eventDescription: "A cyan and magenta circular portrait on a wet black wall.",
      eventName: "Neon Night Shift",
      nightlifeStyle: "techno",
    },
    expected: ["neon-night-shift", "glow-in-the-dark", "space-neon"],
  },
  {
    context: {
      eventDescription: "A blacklight party with fluorescent body paint.",
      eventName: "Glow in the Dark",
      nightlifeStyle: "edm",
    },
    expected: ["glow-in-the-dark", "neon-night-shift", "space-neon"],
  },
  {
    context: {
      eventDescription: "A tropical Sunday party with a central portrait and vertical date rail.",
      eventName: "Punta Cana Sundays",
      nightlifeStyle: "latin-night",
    },
    expected: ["punta-cana-sundays", "fashion-club-vertical", "ladies-night-rose"],
  },
  {
    context: {
      eventDescription: "A neon lime beauty night with huge split type and hair bundles.",
      eventName: "Baddies N Bundles",
      nightlifeStyle: "ladies-night",
    },
    expected: ["baddies-n-bundles", "fashion-club-vertical", "ladies-night-rose"],
  },
  {
    context: {
      eventDescription: "A red city skyline and classic car with monumental urban type.",
      eventName: "City Nights",
      nightlifeStyle: "hip-hop",
    },
    expected: ["we-outside", "baddies-n-bundles", "space-neon"],
  },
] as const;

test("named CSS-master briefs route to deterministic, materially different shortlists", () => {
  for (const { context, expected } of routingExamples) {
    const first = selectCocoArtDirectionChoices(context);
    const second = selectCocoArtDirectionChoices(context);
    assert.deepEqual(first.map(({ id }) => id), expected);
    assert.deepEqual(second.map(({ id }) => id), expected);
    assert.equal(new Set(first.map(({ id }) => id)).size, 3);
    assert.equal(
      new Set(
        first.map((direction) =>
          [
            direction.typographyPersonality,
            direction.palettePolicy.id,
            direction.effectsPolicy.id,
            direction.layoutByFormat.square.compositionPattern,
          ].join("|")
        )
      ).size,
      3
    );
  }
});

test("generic and explicit styling language still resolves only to recipes", () => {
  assert.deepEqual(
    selectCocoArtDirectionChoices({
      eventDescription: "An exclusive champagne and VIP bottle service affair.",
      eventName: "Midnight Black Tie Gala",
      nightlifeStyle: "luxury-club",
    }).map(({ id }) => id),
    ["elite-monday", "fashion-club-vertical", "ladies-night-rose"]
  );

  assert.deepEqual(
    selectCocoArtDirectionChoices({
      eventDescription: "Keep the entire flyer all white and minimal.",
      eventName: "Neon Electric Mainstage",
      nightlifeStyle: "edm",
    }).map(({ id }) => id),
    ["ladies-night-rose", "fashion-club-vertical", "baddies-n-bundles"]
  );

  for (const direction of COCO_CURATED_ART_DIRECTION_LIBRARY) {
    assert.ok(direction.visualRecipeId, `${direction.id} must route to a recipe`);
  }
});
