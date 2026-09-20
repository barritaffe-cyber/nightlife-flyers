import { COCO_RECIPE_CATALOG } from "../../../lib/coco/recipeCatalog.ts";
import type { CocoArtDirectionVisualRecipeId } from "./types.ts";

export type CocoRecipePreviewExports = Readonly<{
  square?: string;
  story?: string;
}>;

const RECIPE_EXPORT_ROOT = "/coco-references/recipe-exports";

/**
 * Finished recipe exports used by the choice screen as visual truth. The
 * generated DOM preview remains the fallback when a format has not been
 * exported yet.
 */
export const COCO_RECIPE_PREVIEW_EXPORTS: Readonly<
  Partial<Record<CocoArtDirectionVisualRecipeId, CocoRecipePreviewExports>>
> = {
  ...Object.fromEntries(Object.keys(COCO_RECIPE_CATALOG).map(id => [id, {
    square: `/generated-flyers/${id}-square-preview.png`,
    story: `/generated-flyers/${id}-story-preview.png`,
  }])),
  "black-gold-party": {
    square: `${RECIPE_EXPORT_ROOT}/black-gold-party-square.png`,
    story: `${RECIPE_EXPORT_ROOT}/black-gold-party-story.jpg`,
  },
  "baddies-n-bundles": {
    square: `${RECIPE_EXPORT_ROOT}/baddies-n-bundles-square.png`,
    story: `${RECIPE_EXPORT_ROOT}/baddies-n-bundles-story.jpg`,
  },
  "city-nights": {
    square: `${RECIPE_EXPORT_ROOT}/city-nights-square.png`,
    story: `${RECIPE_EXPORT_ROOT}/city-nights-story.jpg`,
  },
  "dodge-night-rides": {
    square: "/generated-flyers/dodge-night-rides-square-preview.png",
    story: "/generated-flyers/dodge-night-rides-story-preview.png",
  },
  "grills-and-groove": {square:"/generated-flyers/grills-and-groove-square-preview.png",story:"/generated-flyers/grills-and-groove-story-preview.png"},
  "brunch-sundays": { square: "/generated-flyers/brunch-sundays-square-preview.png", story: "/generated-flyers/brunch-sundays-story-preview.png" },
  "girl-code": { square: "/generated-flyers/girl-code-square-preview.png", story: "/generated-flyers/girl-code-story-preview.png" },
  "honey-nights": {square:"/generated-flyers/honey-nights-square-preview.png",story:"/generated-flyers/honey-nights-story-preview.png"},
  "girl-code-rose": {square:"/generated-flyers/girl-code-rose-square-preview.png",story:"/generated-flyers/girl-code-rose-story-preview.png"},
  "soft-life": { square: "/generated-flyers/soft-life-square-preview.png", story: "/generated-flyers/soft-life-story-preview.png" },
  "bad-girls": {square:"/generated-flyers/bad-girls-square-preview.png",story:"/generated-flyers/bad-girls-story-preview.png"},
  "beat-therapy": {
    square: "/generated-flyers/beat-therapy-square-preview.png",
    story: "/generated-flyers/beat-therapy-story-preview.png",
  },
  "mojito-monday": {
    square: "/generated-flyers/mojito-monday-square-preview.png",
    story: "/generated-flyers/mojito-monday-story-preview.png",
  },
  "yacht-escape": {
    square: "/generated-flyers/yacht-escape-square-preview.png",
    story: "/generated-flyers/yacht-escape-story-preview.png",
  },
  "pulse": { square: `${RECIPE_EXPORT_ROOT}/pulse-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/pulse-story-v2.png` },
  "zona-de-perreo": { square: `${RECIPE_EXPORT_ROOT}/zona-de-perreo-square-v3.png`, story: `${RECIPE_EXPORT_ROOT}/zona-de-perreo-story-v3.png` },
  "summer-sunset": { square: `${RECIPE_EXPORT_ROOT}/summer-sunset-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/summer-sunset-story-v2.png` },
  "diabla-all-white": { square: `${RECIPE_EXPORT_ROOT}/diabla-all-white-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/diabla-all-white-story-v2.png` },
  "rnb-thursdays": { square: `${RECIPE_EXPORT_ROOT}/rnb-thursdays-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/rnb-thursdays-story-v2.png` },
  "reggae-jams": { square: `${RECIPE_EXPORT_ROOT}/reggae-jams-square-v2-subject-b352c062.png`, story: `${RECIPE_EXPORT_ROOT}/reggae-jams-story-v2-subject-b352c062.png` },
  "amapiano-night": { square: `${RECIPE_EXPORT_ROOT}/amapiano-night-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/amapiano-night-story-v2.png` },
  "como-una-boa": { square: "/generated-flyers/eaden-square-preview.png", story: "/generated-flyers/eaden-story-preview.png" },
  "i-love-thursday": { square: `${RECIPE_EXPORT_ROOT}/i-love-thursday-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/i-love-thursday-story-v2.png` },
  "elite-monday": { square: `${RECIPE_EXPORT_ROOT}/elite-monday-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/elite-monday-story-v2.png` },
  "we-outside": { square: `${RECIPE_EXPORT_ROOT}/we-outside-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/we-outside-story-v2.png` },
  "space-neon": { square: `${RECIPE_EXPORT_ROOT}/space-neon-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/space-neon-story-v2.png` },
  "brunch-saturday": { square: `${RECIPE_EXPORT_ROOT}/brunch-saturday-square-v2.png`, story: `${RECIPE_EXPORT_ROOT}/brunch-saturday-story-v2.png` },
  "brunch-vibes": { square: `${RECIPE_EXPORT_ROOT}/brunch-vibes-square.png`, story: `${RECIPE_EXPORT_ROOT}/brunch-vibes-story.png` },
  "grey-rave-festival": {
    square: `${RECIPE_EXPORT_ROOT}/grey-rave-festival-square.png`,
    story: `${RECIPE_EXPORT_ROOT}/grey-rave-festival-story.jpg`,
  },
  "fashion-club-vertical": {
    square: "/generated-flyers/friday-fever-square-preview.png",
    story: "/generated-flyers/friday-fever-story-preview.png",
  },
  "glow-in-the-dark": {
    square: `${RECIPE_EXPORT_ROOT}/glow-in-the-dark-square.png`,
    story: `${RECIPE_EXPORT_ROOT}/glow-in-the-dark-story.jpg`,
  },
  "ladies-css-editorial": {
    square: `${RECIPE_EXPORT_ROOT}/ladies-css-coco-square.jpg`,
    story: `${RECIPE_EXPORT_ROOT}/ladies-css-coco-story.jpg`,
  },
  "neon-night-shift": {
    square: "/generated-flyers/neon-night-square-preview.png",
    story: "/generated-flyers/neon-night-story-preview.png",
  },
  "punta-cana-sundays": {
    square: "/generated-flyers/punta-cana-square-preview.png",
    story: "/generated-flyers/punta-cana-story-preview.png",
  },
  "rush-night-css": {
    square: `${RECIPE_EXPORT_ROOT}/rush-night-square.jpg`,
    story: `${RECIPE_EXPORT_ROOT}/rush-night-story.jpg`,
  },
};

export function getCocoRecipePreviewExports(
  recipeId: CocoArtDirectionVisualRecipeId | undefined
): CocoRecipePreviewExports | undefined {
  return recipeId ? COCO_RECIPE_PREVIEW_EXPORTS[recipeId] : undefined;
}
