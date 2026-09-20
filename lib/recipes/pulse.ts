import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild it from the CSS source.
export const PULSE_RECIPE = {
  "id": "pulse",
  "name": "Pulse Sunday",
  "version": 2,
  "reference": "pulse.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Pink statue poster with a gradient Sunday headline and compact event details.",
  "layerStack": [
    "Saved background and foreground artwork.",
    "Individually editable compiled text.",
    "Saved object overrides and effects."
  ],
  "textZones": [
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
      "id": "month",
      "purpose": "month",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "pulse",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer",
      "purpose": "price",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "details",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "rsvp",
      "purpose": "rsvp",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "terms",
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
    "Portable master: pulse.nflyer",
    "Square and Story use the updated saved sessions."
  ],
  "runtime": {
    "directionId": "pulse",
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
