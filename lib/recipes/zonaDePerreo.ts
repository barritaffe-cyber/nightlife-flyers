import type { VisualRecipe } from "./types.ts";

// Preserve the accepted editor save.
export const ZONA_DE_PERREO_RECIPE = {
  "id": "zona-de-perreo",
  "name": "Zona de Perreo",
  "version": 3,
  "reference": "zona-de-perreo-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Accepted Diabla / Una Noche Sin Reglas design: Latin / reggaeton flyer with purple chrome devil artwork, gold brush lettering, and accepted editable copy.",
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
      "id": "date",
      "purpose": "date",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "musicLabel",
      "purpose": "djLineupLabel",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "lineup",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "venue",
      "purpose": "venue",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "bar",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "details",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "start",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "end",
      "purpose": "endTime",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "age",
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
    "Portable master: zona-de-perreo-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "zona-de-perreo",
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
