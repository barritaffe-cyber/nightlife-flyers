import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild it from the CSS source.
export const BRUNCH_SATURDAY_RECIPE = {
  "id": "brunch-saturday",
  "name": "Brunch Saturday",
  "version": 2,
  "reference": "brunch-saturday-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Warm cocktail and fruit scene, tall textured headline, script Saturday accent, and a three-offer ribbon.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
    {
      "id": "presenter",
      "purpose": "presenter",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "script",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day-number",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "meridiem",
      "purpose": "meridiem",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "weekday",
      "purpose": "weekday",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-one-price",
      "purpose": "offerOnePrice",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-one-copy",
      "purpose": "offerOneCopy",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-two-price",
      "purpose": "offerTwoPrice",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-two-copy",
      "purpose": "offerTwoCopy",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-three-price",
      "purpose": "offerThreePrice",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer-three-copy",
      "purpose": "offerThreeCopy",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "band",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    }
  ],
  "typography": [
    "Preserve the saved font families, sizes, spacing, texture, and per-glyph shadows."
  ],
  "colorGrade": [
    "Use the saved palette and object fills."
  ],
  "avoid": [
    "Recompiling over the accepted saved project.",
    "Replacing existing sidebar mappings.",
    "Generic layout or palette replacement."
  ],
  "appNotes": [
    "Portable master: brunch-saturday-updated.nflyer",
    "Square and Story use the updated saved sessions."
  ],
  "runtime": {
    "directionId": "brunch-saturday",
    "compositionPattern": "luxury-tropical-brunch",
    "styleId": "terrace-brunch",
    "formats": {
      "square": {
        "canvas": {
          "width": 1000,
          "height": 1000
        }
      },
      "story": {
        "canvas": {
          "width": 1000,
          "height": 1777.765625
        }
      }
    }
  }
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
