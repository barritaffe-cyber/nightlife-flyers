import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; load it through the portable recipe runtime.
export const BRUNCH_VIBES_RECIPE = {
  "id": "brunch-vibes",
  "name": "Brunch Vibes",
  "version": 2,
  "reference": "brunch-vibes-compiled-portrait-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Terrace brunch editorial with gold serif lettering, a brush accent, and individually editable event details.",
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
      "id": "presents-label",
      "purpose": "presents",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "weekday",
      "purpose": "weekday",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "day-numeral",
      "purpose": "day",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "month",
      "purpose": "month",
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
      "id": "details",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time-start",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time-to",
      "purpose": "timeConnector",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "time-end",
      "purpose": "endTime",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "venue",
      "purpose": "venue",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "venue-description",
      "purpose": "subtag",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
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
    "Portable master: brunch-vibes-compiled-portrait-updated.nflyer",
    "Square and Story use the saved sessions."
  ],
  "runtime": {
    "directionId": "brunch-vibes",
    "compositionPattern": "luxury-tropical-brunch",
    "styleId": "terrace-brunch",
    "formats": {
      "square": {
        "canvas": {
          "width": 1024,
          "height": 1536
        }
      },
      "story": {
        "canvas": {
          "width": 1024,
          "height": 1536
        }
      }
    }
  }
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
