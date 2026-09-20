import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild over it.
export const I_LOVE_THURSDAY_RECIPE = {
  "id": "i-love-thursday",
  "name": "I Love Thursday",
  "version": 2,
  "reference": "i-love-thursday-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Purple teddy-bear lounge, white brush headline, orange Thursday banner, and accepted editable event copy.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
    {
      "id": "weekday",
      "purpose": "weekday",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "ordinal",
      "purpose": "dateOrdinal",
      "placement": "Saved compiled object bounds."
    },
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
      "id": "thursday",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "city",
      "purpose": "venue",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "prices",
      "purpose": "price",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "host",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "contact",
      "purpose": "rsvp",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "brand",
      "purpose": "subtag",
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
    "Portable master: i-love-thursday-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "i-love-thursday",
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
