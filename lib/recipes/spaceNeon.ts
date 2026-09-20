import type { VisualRecipe } from "./types.ts";

// Accepted editor save is authoritative; never rebuild it from the CSS source.
export const SPACE_NEON_RECIPE = {
  "id": "space-neon",
  "name": "Space Neon",
  "version": 2,
  "reference": "space-neon.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Cosmic guitar astronaut, neon outline headline, script accent, and editable event details.",
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
      "id": "guestLabel",
      "purpose": "footerDetails",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "guest",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer",
      "purpose": "price",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "lineup",
      "purpose": "djLineup",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "space",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "subtag",
      "purpose": "subtag",
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
    "Portable master: space-neon.nflyer",
    "Square and Story use the updated saved sessions."
  ],
  "runtime": {
    "directionId": "space-neon",
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
