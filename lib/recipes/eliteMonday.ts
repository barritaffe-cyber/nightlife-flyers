import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild over it.
export const ELITE_MONDAY_RECIPE = {
  "id": "elite-monday",
  "name": "Elite Monday",
  "version": 2,
  "reference": "elite-monday-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Dark blue classical hall, suited statue, silver condensed headline and accepted editable event details.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
    {
      "id": "brand",
      "purpose": "presenter",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "tagline",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "corporate",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "special",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "featuring",
      "purpose": "footerDetails",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "dj",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "artist",
      "purpose": "venue",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "ordinal",
      "purpose": "weekday",
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
      "id": "onwards",
      "purpose": "timeConnector",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "reservation",
      "purpose": "rsvp",
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
    "Portable master: elite-monday-updated.nflyer",
    "Accepted editor saves own Square and Story layout, artwork, text styles and overrides."
  ],
  "runtime": {
    "directionId": "elite-monday",
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
