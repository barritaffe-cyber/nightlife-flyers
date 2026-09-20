import type { VisualRecipe } from "./types.ts";

// Authoritative user-updated save; never rebuild over this project.
export const DIABLA_ALL_WHITE_RECIPE = {
  "id": "diabla-all-white",
  "name": "Diabla All White",
  "version": 2,
  "reference": "diabla-all-white-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "White and gold Latin night flyer with editable metallic serif and script lettering and preserved Square/Story artwork.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
    {
      "id": "weekday",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "date",
      "purpose": "date",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "genres",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "mood",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "dress",
      "purpose": "price",
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
      "id": "tagline",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "footer",
      "purpose": "footerDetails",
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
    "Portable master: diabla-all-white-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "diabla-all-white",
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
