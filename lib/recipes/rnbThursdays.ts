import type { VisualRecipe } from "./types.ts";

// Authoritative user-updated save; do not rebuild over the accepted project.
export const RNB_THURSDAYS_RECIPE = {
  "id": "rnb-thursdays",
  "name": "R&B Thursdays",
  "version": 2,
  "reference": "rnb-thursdays-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Blue R&B lounge flyer with editable layered glass headline, separate seated subject, and preserved Square/Story artwork.",
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
      "id": "thursdays",
      "purpose": "headline2",
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
      "id": "time",
      "purpose": "time",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "endTime",
      "purpose": "endTime",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "attractions",
      "purpose": "footerDetails",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "recurrence",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "entry",
      "purpose": "price",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "entryLabel",
      "purpose": "priceLabel",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "address",
      "purpose": "address",
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
    "Portable master: rnb-thursdays-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "rnb-thursdays",
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
