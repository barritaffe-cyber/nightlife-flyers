import type { VisualRecipe } from "./types.ts";

// Authoritative user-updated save; never rebuild over this project.
export const SUMMER_SUNSET_RECIPE = {
  "id": "summer-sunset",
  "name": "Summer Sunset",
  "version": 2,
  "reference": "summer-sunset-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Orange sunset palm flyer with editable white and yellow split lettering, striped frame and preserved Square/Story artwork.",
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
      "id": "price",
      "purpose": "price",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "contactLabel",
      "purpose": "rsvpLabel",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "contact",
      "purpose": "rsvp",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "sunset",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "djs",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "website",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "date",
      "purpose": "date",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
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
    "Portable master: summer-sunset-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "summer-sunset",
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
