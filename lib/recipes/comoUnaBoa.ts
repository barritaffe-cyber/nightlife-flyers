import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild over it.
export const COMO_UNA_BOA_RECIPE = {
  "id": "como-una-boa",
  "name": "Eaden — The Garden Lounge",
  "version": 3,
  "reference": "eaden.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Latin nightlife theme with emerald jungle, snake and cocktail artwork, oversized gold lettering, and accepted editable copy.",
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
      "id": "presents",
      "purpose": "presents",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "prefix",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "weekday",
      "purpose": "weekday",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "lineupLabel",
      "purpose": "rsvp",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "lineup",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "hostLabel",
      "purpose": "footerDetails",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "host",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "sponsors",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "addressLabel",
      "purpose": "addressLabel",
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
    "Portable master: como-una-boa-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "como-una-boa",
    "compositionPattern": "center-poster-stack",
    "styleId": "black-electric",
    "formats": {
      "square": {
        "canvas": {
          "width": 1080,
          "height": 1080
        }
      },
      "story": {
        "canvas": {
          "width": 1080,
          "height": 1920
        }
      }
    }
  }
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
