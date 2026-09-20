import type { VisualRecipe } from "./types.ts";

// Version 2 remains archived byte-for-byte; version 5 adds the supplied Story update.
export const REGGAE_JAMS_RECIPE = {
  "id": "reggae-jams",
  "name": "Reggae Jams",
  "version": 5,
  "reference": "reggae-jams.nflyer",
  "referenceMode": "visual-inheritance",
  "summary": "Reggae lounge flyer with a supplied transparent portrait, independent Square and Story scenes, a stucco red-gold-green headline and editable supplied cream-gold script lettering for Jams.",
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
    "id": "jams",
    "purpose": "headline2",
    "placement": "Saved compiled object bounds."
  },
  {
    "id": "entry",
    "purpose": "price",
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
    "id": "dressCode",
    "purpose": "subtag",
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
    "purpose": "detailsLabel",
    "placement": "Saved compiled object bounds."
  },
  {
    "id": "hosts",
    "purpose": "details",
    "placement": "Saved compiled object bounds."
  },
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
    "id": "year",
    "purpose": "year",
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
    "id": "attractions",
    "purpose": "footerDetails",
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
    "Active portable master: reggae-jams.nflyer",
    "Version 2 accepted save is archived under public/generated-flyers/archive/reggae-jams-v2-accepted/.",
    "Version 4 promotes the supplied reggae.nflyer Square session only; Story remains from version 3.",
    "Version 5 promotes the later supplied Story session while preserving the accepted version 4 Square.",
    "Reggae Jams Script PNG is template scoped and preserves the supplied bitmap alphabet."
  ],
  "runtime": {
    "directionId": "reggae-jams",
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
