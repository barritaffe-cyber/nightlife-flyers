import { COCO_RECIPE_CATALOG } from "../../../lib/coco/recipeCatalog.ts";
import type { CocoArtDirection, CocoArtDirectionId } from "./types.ts";

/** The only art directions Coco may offer: one entry per authored recipe. */
const LEGACY_ART_DIRECTIONS = [

{
  containsSubject: false,
  "id": "summer-sunset",
  "name": "Summer Sunset",
  "visualRecipeId": "summer-sunset",
  "effectsPolicy": {
    "id": "sunset-haze",
    "intensity": "restrained",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "rooftop"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "retro-pop",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "summer_splash"
    ],
    "story": [
      "summer_splash"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  "id": "diabla-all-white",
  "name": "Diabla All White",
  "visualRecipeId": "diabla-all-white",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "latin-night",
    "luxury-club",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "champagne-black",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "restrained",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "white_minimal"
    ],
    "story": [
      "white_minimal"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  "id": "rnb-thursdays",
  "name": "R&B Thursdays",
  "visualRecipeId": "rnb-thursdays",
  "effectsPolicy": {
    "id": "soft-bloom",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "rnb-lounge",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "black-electric",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "rnb_velvet"
    ],
    "story": [
      "rnb_velvet"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "preferred-hero",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  "id": "reggae-jams",
  "name": "Reggae Jams",
  "visualRecipeId": "reggae-jams",
  "effectsPolicy": {
    "id": "subtle-texture",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "black-electric",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "preferred-hero",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "amapiano-night",
  "name": "Amapiano Night",
  "visualRecipeId": "amapiano-night",
  "effectsPolicy": {
    "id": "subtle-texture",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "afrobeats"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "deep-red-gold",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "zona-de-perreo",
  "name": "Zona de Perreo",
  "visualRecipeId": "zona-de-perreo",
  "effectsPolicy": {
    "id": "subtle-texture",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "latin-night"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "neon-contrast",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  containsSubject: false,
  "id": "como-una-boa",
  "name": "Como Una Boa",
  "visualRecipeId": "como-una-boa",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "latin-night"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "tropical-emerald",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "i-love-thursday",
  "name": "I Love Thursday",
  "visualRecipeId": "i-love-thursday",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "hip-hop",
    "house",
    "ladies-night"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "neon-contrast",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "elite-monday",
  "name": "Elite Monday",
  "visualRecipeId": "elite-monday",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "house"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "black-electric",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "preferred-hero",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "we-outside",
  "name": "We Outside Saturday",
  "visualRecipeId": "we-outside",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "ladies-night",
    "hip-hop",
    "house"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "burgundy-rose",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "nightclub"
},
{
  "id": "pulse",
  "name": "Pulse Sunday",
  "visualRecipeId": "pulse",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "edm",
    "house",
    "techno",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "neon-contrast",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  "id": "space-neon",
  "name": "Space Neon",
  "visualRecipeId": "space-neon",
  "effectsPolicy": {
    "id": "soft-glow",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "edm",
    "house",
    "techno",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "neon-contrast",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "preferred-hero",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "festival"
},
{
  containsSubject: false,
  "id": "brunch-saturday",
  "name": "Brunch Saturday",
  "visualRecipeId": "brunch-saturday",
  "effectsPolicy": {
    "id": "subtle-texture",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "brunch",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "deep-red-gold",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  containsSubject: false,
  "id": "brunch-vibes",
  "name": "Brunch Vibes",
  "visualRecipeId": "brunch-vibes",
  "effectsPolicy": {
    "id": "subtle-texture",
    "intensity": "moderate",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "brunch",
    "general-nightlife"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "champagne-black",
    "maxStrongColors": 2,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "afrobeat_rooftop"
    ],
    "story": [
      "afrobeat_rooftop"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
  {
    containsSubject: true,
    id: "bad-girls",
    name: "Bad Girls",
    visualRecipeId: "bad-girls",
    effectsPolicy: { id: "grain-glitch", intensity: "moderate", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["ladies-night", "hip-hop", "afrobeats", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "deep-red-gold", maxStrongColors: 2, preserveSkinTone: true, saturation: "vivid", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_bad_girls"], story: ["recipe_bad_girls"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "preferred-hero", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "aggressive",
  },
  {
    containsSubject: false,
    id: "grills-and-groove",
    name: "Grills & Groove",
    visualRecipeId: "grills-and-groove",
    effectsPolicy: { id: "light-beams", intensity: "moderate", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "brunch", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "deep-red-gold", maxStrongColors: 2, preserveSkinTone: true, saturation: "vivid", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_grills_and_groove"], story: ["recipe_grills_and_groove"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "editorial",
  },
  {
    containsSubject: false,
    id: "soft-life",
    name: "Soft Life",
    visualRecipeId: "soft-life",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "burgundy-rose", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_soft_life"], story: ["recipe_soft_life"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "right", story: "right" } },
    typographyPersonality: "editorial",
  },
  {
    containsSubject: false,
    id: "girl-code",
    name: "Girl Code",
    visualRecipeId: "girl-code",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "tropical-emerald", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_girl_code"], story: ["recipe_girl_code"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "nightclub",
  },  {
    containsSubject: false,
    id: "girl-code-rose",
    name: "Girl Code — Rose",
    visualRecipeId: "girl-code-rose",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "burgundy-rose", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_girl_code_rose"], story: ["recipe_girl_code_rose"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "nightclub",
  },
  {
    containsSubject: true,
    id: "ycee-live",
    name: "YCEE Live",
    visualRecipeId: "ycee-live",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "champagne-black", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_ycee_live"], story: ["recipe_ycee_live"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "preferred-hero", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "nightclub",
  },
  {
    containsSubject: false,
    id: "honey-nights",
    name: "Honey Nights",
    visualRecipeId: "honey-nights",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "champagne-black", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_honey_nights"], story: ["recipe_honey_nights"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "nightclub",
  },
  {
    containsSubject: false,
    id: "brunch-sundays",
    name: "Brunch Sundays",
    visualRecipeId: "brunch-sundays",
    effectsPolicy: { id: "subtle-texture", intensity: "restrained", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["rnb-lounge", "ladies-night", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "left", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "retro-pop", maxStrongColors: 2, preserveSkinTone: true, saturation: "balanced", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_brunch_sundays"], story: ["recipe_brunch_sundays"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "nightclub",
  },
  {
    containsSubject: false,
    id: "beat-therapy",
    name: "Beat Therapy",
    visualRecipeId: "beat-therapy",
    effectsPolicy: { id: "light-beams", intensity: "moderate", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["house", "edm", "general-nightlife"],
    layoutByFormat: {
      square: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
    },
    palettePolicy: { id: "neon-contrast", maxStrongColors: 2, preserveSkinTone: true, saturation: "vivid", source: "direction-led" },
    referenceTemplateIds: { square: ["recipe_beat_therapy"], story: ["recipe_beat_therapy"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "aggressive",
  },
  {
  containsSubject: false,
    effectsPolicy: { id: "light-beams", intensity: "moderate", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["general-nightlife", "hip-hop", "house"],
    id: "dodge-night-rides",
    layoutByFormat: {
      square: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 3 },
    },
    name: "Dodge Night Rides",
    palettePolicy: { id: "deep-red-gold", maxStrongColors: 2, preserveSkinTone: true, saturation: "vivid", source: "direction-led" },
    referenceTemplateIds: { square: ["new-york", "square_center_hero_nightlife"], story: ["new-york", "edm_tunnel"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "aggressive",
    visualRecipeId: "dodge-night-rides",
  },
  {
    effectsPolicy: { id: "grain-glitch", intensity: "high-energy", oneSignatureEffect: true },
    eligibleNightlifeStyles: ["general-nightlife", "house", "techno"],
    id: "grey-rave-festival",
    layoutByFormat: {
      square: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 4 },
      story: { alignment: "center", compositionPattern: "center-poster-stack", density: "medium", layoutId: "subject-center", safeMarginPct: 3 },
    },
    name: "Grey Rave Festival",
    palettePolicy: { id: "black-electric", maxStrongColors: 2, preserveSkinTone: true, saturation: "vivid", source: "direction-led" },
    referenceTemplateIds: { square: ["edm_tunnel", "dnb_bunker", "secret_friday"], story: ["edm_tunnel", "dnb_bunker", "secret_friday"] },
    subjectPolicy: { faceProtection: "strict", headlineOverlap: "controlled", mode: "none", preserveIdentity: true, preferredPlacement: { square: "center", story: "center" } },
    typographyPersonality: "aggressive",
    visualRecipeId: "grey-rave-festival",
  },
  {
    effectsPolicy: {
      id: "light-beams",
      intensity: "high-energy",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "edm",
      "house",
      "general-nightlife",
      "ladies-night",
      "latin-night",
    ],
    id: "high-energy-club",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-hero-event-poster",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
      story: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 5,
      },
    },
    name: "High Energy Club",
    palettePolicy: {
      id: "neon-contrast",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "image-aware",
    },
    referenceTemplateIds: {
      square: ["edm_stage_co2", "sugar_rush", "disco_mirrorball"],
      story: ["edm_stage_co2", "sugar_rush", "disco_mirrorball"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "optional-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "nightclub",
    visualRecipeId: "rush-night-css",
  },
  {
    effectsPolicy: {
      id: "subtle-texture",
      intensity: "moderate",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "bottle-service",
      "general-nightlife",
      "hip-hop",
      "ladies-night",
      "luxury-club",
      "rnb-lounge",
    ],
    id: "black-gold-party",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 3,
      },
      story: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 3,
      },
    },
    name: "Black Gold Party",
    palettePolicy: {
      id: "champagne-black",
      maxStrongColors: 2,
      preserveSkinTone: true,
      saturation: "balanced",
      source: "direction-led",
    },
    referenceTemplateIds: {
      square: ["blk_tie", "la-lux", "rnb_velvet"],
      story: ["blk_tie", "la-lux", "rnb_velvet"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "luxury",
    visualRecipeId: "black-gold-party",
  },
  {
    effectsPolicy: {
      id: "light-beams",
      intensity: "high-energy",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "bottle-service",
      "general-nightlife",
      "hip-hop",
      "ladies-night",
      "luxury-club",
      "rnb-lounge",
    ],
    id: "fashion-club-vertical",
    layoutByFormat: {
      square: {
        alignment: "right",
        compositionPattern: "fashion-club-vertical",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
      story: {
        alignment: "right",
        compositionPattern: "fashion-club-vertical",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
    },
    name: "Fashion Club Vertical",
    palettePolicy: {
      id: "burgundy-rose",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "image-aware",
    },
    referenceTemplateIds: {
      square: ["secret_friday", "red_velvet_editorial", "miami_heat"],
      story: ["secret_friday", "red_velvet_editorial", "miami_heat"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "left", story: "left" },
    },
    typographyPersonality: "editorial",
    visualRecipeId: "fashion-club-vertical",
  },
  {
    effectsPolicy: {
      id: "soft-bloom",
      intensity: "restrained",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "ladies-night",
      "rnb-lounge",
      "latin-night",
      "luxury-club",
      "general-nightlife",
    ],
    id: "sensual-night",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "low",
        layoutId: "subject-center",
        safeMarginPct: 6,
      },
      story: {
        alignment: "center",
        compositionPattern: "bottom-lockup",
        density: "low",
        layoutId: "subject-center",
        safeMarginPct: 6,
      },
    },
    name: "Sensual Night",
    palettePolicy: {
      id: "burgundy-rose",
      maxStrongColors: 2,
      preserveSkinTone: true,
      saturation: "balanced",
      source: "image-aware",
    },
    referenceTemplateIds: {
      square: ["rnb_velvet", "red_velvet_editorial", "luxe"],
      story: ["rnb_velvet", "red_velvet_editorial", "luxe"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "elegant",
    visualRecipeId: "ladies-css-editorial",
  },
  {
    effectsPolicy: {
      id: "analog-glow",
      intensity: "high-energy",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "edm",
      "general-nightlife",
      "hip-hop",
      "house",
      "techno",
    ],
    id: "neon-night-shift",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-hero-event-poster",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
      story: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 5,
      },
    },
    name: "Neon Night Shift",
    palettePolicy: {
      id: "neon-contrast",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "direction-led",
    },
    referenceTemplateIds: {
      square: ["sugar_rush", "edm_stage_co2", "dnb_bunker"],
      story: ["sugar_rush", "edm_stage_co2", "dnb_bunker"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "nightclub",
    visualRecipeId: "neon-night-shift",
  },
  {
    effectsPolicy: {
      id: "soft-bloom",
      intensity: "moderate",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "edm",
      "general-nightlife",
      "house",
      "ladies-night",
      "throwback",
    ],
    id: "glow-in-the-dark",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
      story: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 5,
      },
    },
    name: "Glow in the Dark",
    palettePolicy: {
      id: "neon-contrast",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "direction-led",
    },
    referenceTemplateIds: {
      square: ["sugar_rush", "disco_mirrorball", "edm_stage_co2"],
      story: ["sugar_rush", "disco_mirrorball", "edm_stage_co2"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "festival",
    visualRecipeId: "glow-in-the-dark",
  },
  {
    effectsPolicy: {
      id: "sunset-haze",
      intensity: "moderate",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "afrobeats",
      "brunch",
      "general-nightlife",
      "latin-night",
      "rooftop",
    ],
    id: "punta-cana-sundays",
    layoutByFormat: {
      square: {
        alignment: "left",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 5,
      },
      story: {
        alignment: "left",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 5,
      },
    },
    name: "Punta Cana Sundays",
    palettePolicy: {
      id: "tropical-emerald",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "image-aware",
    },
    referenceTemplateIds: {
      square: ["latin_street_tropical", "afrobeat_rooftop", "summer_splash"],
      story: ["latin_street_tropical", "afrobeat_rooftop", "sunset_yacht"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "latin",
    visualRecipeId: "punta-cana-sundays",
  },
  {
    effectsPolicy: {
      id: "light-beams",
      intensity: "high-energy",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "bottle-service",
      "general-nightlife",
      "hip-hop",
      "ladies-night",
      "rnb-lounge",
    ],
    id: "baddies-n-bundles",
    layoutByFormat: {
      square: {
        alignment: "left",
        compositionPattern: "diagonal-energy",
        density: "medium",
        layoutId: "subject-right",
        safeMarginPct: 4,
      },
      story: {
        alignment: "left",
        compositionPattern: "diagonal-energy",
        density: "medium",
        layoutId: "subject-right",
        safeMarginPct: 5,
      },
    },
    name: "Baddies N Bundles",
    palettePolicy: {
      id: "black-electric",
      maxStrongColors: 3,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "direction-led",
    },
    referenceTemplateIds: {
      square: ["secret_friday", "miami_heat", "sugar_rush"],
      story: ["secret_friday", "miami_heat", "sugar_rush"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "controlled",
      mode: "preferred-hero",
      preserveIdentity: true,
      preferredPlacement: { square: "right", story: "right" },
    },
    typographyPersonality: "aggressive",
    visualRecipeId: "baddies-n-bundles",
  },
  {
  containsSubject: false,
    effectsPolicy: {
      id: "grain-glitch",
      intensity: "high-energy",
      oneSignatureEffect: true,
    },
    eligibleNightlifeStyles: [
      "bottle-service",
      "general-nightlife",
      "hip-hop",
      "house",
      "rnb-lounge",
    ],
    id: "city-nights",
    layoutByFormat: {
      square: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 4,
      },
      story: {
        alignment: "center",
        compositionPattern: "center-poster-stack",
        density: "medium",
        layoutId: "subject-center",
        safeMarginPct: 3,
      },
    },
    name: "City Nights",
    palettePolicy: {
      id: "deep-red-gold",
      maxStrongColors: 2,
      preserveSkinTone: true,
      saturation: "vivid",
      source: "direction-led",
    },
    referenceTemplateIds: {
      square: ["miami_heat", "dnb_bunker", "secret_friday"],
      story: ["miami_heat", "dnb_bunker", "secret_friday"],
    },
    subjectPolicy: {
      faceProtection: "strict",
      headlineOverlap: "none",
      mode: "none",
      preserveIdentity: true,
      preferredPlacement: { square: "center", story: "center" },
    },
    typographyPersonality: "aggressive",
    visualRecipeId: "city-nights",
  },
{
  "containsSubject": false,
  "id": "mojito-monday",
  "name": "Mojito Monday",
  "visualRecipeId": "mojito-monday",
  "effectsPolicy": {
    "id": "sunset-haze",
    "intensity": "restrained",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "rooftop"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "left",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "tropical-emerald",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "recipe_mojito_monday"
    ],
    "story": [
      "recipe_mojito_monday"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
},
{
  "containsSubject": false,
  "id": "yacht-escape",
  "name": "Yacht Escape",
  "visualRecipeId": "yacht-escape",
  "effectsPolicy": {
    "id": "sunset-haze",
    "intensity": "restrained",
    "oneSignatureEffect": true
  },
  "eligibleNightlifeStyles": [
    "general-nightlife",
    "rooftop"
  ],
  "layoutByFormat": {
    "square": {
      "alignment": "left",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    },
    "story": {
      "alignment": "center",
      "compositionPattern": "center-poster-stack",
      "density": "medium",
      "layoutId": "subject-center",
      "safeMarginPct": 3
    }
  },
  "palettePolicy": {
    "id": "champagne-black",
    "maxStrongColors": 3,
    "preserveSkinTone": true,
    "saturation": "vivid",
    "source": "direction-led"
  },
  "referenceTemplateIds": {
    "square": [
      "recipe_yacht_escape"
    ],
    "story": [
      "recipe_yacht_escape"
    ]
  },
  "subjectPolicy": {
    "faceProtection": "strict",
    "headlineOverlap": "controlled",
    "mode": "none",
    "preserveIdentity": true,
    "preferredPlacement": {
      "square": "center",
      "story": "center"
    }
  },
  "typographyPersonality": "editorial"
}
] as const satisfies readonly CocoArtDirection[];

/** All registered artwork participates in discovery; legacy styling/routing stays intact. */
export const COCO_CURATED_ART_DIRECTION_LIBRARY: readonly CocoArtDirection[] = [
  ...LEGACY_ART_DIRECTIONS.filter(direction => direction.visualRecipeId in COCO_RECIPE_CATALOG).map(direction => ({ ...direction,
    containsSubject: COCO_RECIPE_CATALOG[direction.visualRecipeId as keyof typeof COCO_RECIPE_CATALOG].containsSubject,
    subjectPolicy: { ...direction.subjectPolicy, mode: COCO_RECIPE_CATALOG[direction.visualRecipeId as keyof typeof COCO_RECIPE_CATALOG].containsSubject ? direction.subjectPolicy.mode : "none" },
  })),
  ...Object.entries(COCO_RECIPE_CATALOG)
    .filter(([id]) => !LEGACY_ART_DIRECTIONS.some(d => d.visualRecipeId === id))
    .map(([id, metadata]): CocoArtDirection => ({
      ...LEGACY_ART_DIRECTIONS[0],
      id: id as keyof typeof COCO_RECIPE_CATALOG,
      visualRecipeId: id as keyof typeof COCO_RECIPE_CATALOG,
      name: metadata.name,
      containsSubject: metadata.containsSubject,
      referenceTemplateIds: { square: [id], story: [id] },
      // These additional recipes use their authored backgrounds. Do not imply
      // baked portraits are replaceable with an uploaded subject.
      subjectPolicy: { ...LEGACY_ART_DIRECTIONS[0].subjectPolicy, mode: 'none' },
    })),
];

export const COCO_CURATED_ART_DIRECTION_IDS = COCO_CURATED_ART_DIRECTION_LIBRARY.map(
  (direction) => direction.id
) as readonly CocoArtDirectionId[];

/** Recipe-backed fallbacks retained for callers that still request a fixed trio. */
export const COCO_LAUNCH_ART_DIRECTION_IDS = [
  "space-neon",
  "fashion-club-vertical",
  "ladies-night-rose",
] as const satisfies readonly CocoArtDirectionId[];

const CURATED_DIRECTION_BY_ID = new Map<CocoArtDirectionId, CocoArtDirection>(
  COCO_CURATED_ART_DIRECTION_LIBRARY.map((direction) => [direction.id, direction])
);

function requireLibraryDirection(id: (typeof COCO_LAUNCH_ART_DIRECTION_IDS)[number]) {
  const direction = CURATED_DIRECTION_BY_ID.get(id);
  if (!direction) throw new Error(`Launch art direction is missing from curated library: ${id}`);
  return direction;
}

export const COCO_LAUNCH_ART_DIRECTIONS = [
  requireLibraryDirection("space-neon"),
  requireLibraryDirection("fashion-club-vertical"),
  requireLibraryDirection("ladies-night-rose"),
] as const satisfies readonly [CocoArtDirection, CocoArtDirection, CocoArtDirection];
