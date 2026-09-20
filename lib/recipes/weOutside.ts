import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild over it.
export const WE_OUTSIDE_RECIPE = {
  "id": "we-outside",
  "name": "We Outside Saturday",
  "version": 2,
  "reference": "we-outside.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Purple fashion portrait, angled headline, editable speech bubble, script Saturday, and compiled arrow divider.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
    {
      "id": "brand",
      "purpose": "footerDetails",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "presenter",
      "purpose": "presenter",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "weekday",
      "purpose": "weekday",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "we",
      "purpose": "subtag",
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
      "id": "host",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "lineup",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "legal",
      "purpose": "compliance",
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
    "Portable master: we-outside.nflyer",
    "Use accepted square/story sessions, preserving overrides and SVG assets."
  ],
  "runtime": {
    "directionId": "we-outside",
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
