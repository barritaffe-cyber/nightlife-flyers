import type { VisualRecipe } from "./types.ts";

// Preserve the accepted editor save.
export const AMAPIANO_NIGHT_RECIPE = {
  "id": "amapiano-night",
  "name": "Amapiano Night",
  "version": 2,
  "reference": "amapiano-night-updated.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Amapiano nightlife flyer with orange palms, outlined portrait, script title and independent torn-paper footer.",
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
      "id": "presents",
      "purpose": "presents",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "headline",
      "purpose": "headline",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "night",
      "purpose": "headline2",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "date",
      "purpose": "date",
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
      "id": "hostLabel",
      "purpose": "hostLabel",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "hosts",
      "purpose": "hostMC",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offerLabel",
      "purpose": "detailsLabel",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "offer",
      "purpose": "details",
      "placement": "Saved compiled object bounds."
    },
    {
      "id": "venue",
      "purpose": "venue",
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
    "Portable master: amapiano-night-updated.nflyer",
    "Preserve accepted Square/Story sessions and their object overrides."
  ],
  "runtime": {
    "directionId": "amapiano-night",
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
