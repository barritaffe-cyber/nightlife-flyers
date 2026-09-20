import type { CocoMoodId } from "../moodDirector";
import type { CocoTournamentLayoutId } from "../layoutTournament";
import type { TypePersonality } from "../typographyDirector";

export type CocoConceptDirectionId =
  | "black-gold-party"
  | "baddies-n-bundles"
  | "city-nights"
  | "pulse"
  | "space-neon"
  | "zona-de-perreo"
  | "summer-sunset"
  | "diabla-all-white"
  | "rnb-thursdays"
  | "reggae-jams"
  | "amapiano-night"
  | "como-una-boa"
  | "i-love-thursday"
  | "elite-monday"
  | "we-outside"
  | "brunch-saturday"
  | "brunch-vibes"
  | "grey-rave-festival"
  | "cinematic-lounge"
  | "fashion-club-vertical"
  | "glow-in-the-dark"
  | "golden-hero-editorial"
  | "high-energy-club"
  | "luxury-editorial"
  | "modern-minimal"
  | "neon-night-shift"
  | "punta-cana-sundays"
  | "retro-celebration"
  | "sensual-night"
  | "tropical-rooftop"
  | "underground-edge";

export type CocoConceptDirection = {
  effectsStyle:
    | "analog-glow"
    | "grain-glitch"
    | "haze-vignette"
    | "light-beams"
    | "soft-bloom"
    | "soft-glow"
    | "subtle-texture"
    | "sunset-haze";
  id: CocoConceptDirectionId;
  layoutId: CocoTournamentLayoutId;
  layoutStyle:
    | "asymmetric"
    | "bold-center"
    | "clean-grid"
    | "close-crop"
    | "right-hero-left-text"
    | "spacious"
    | "vertical-editorial";
  moodId: CocoMoodId;
  name: string;
  paletteStyle:
    | "black-electric"
    | "burgundy-rose"
    | "champagne-black"
    | "deep-red-gold"
    | "mono-accent"
    | "neon-contrast"
    | "retro-pop"
    | "tropical-emerald";
  secondaryMoodId?: CocoMoodId;
  typePersonality: TypePersonality;
};

export const COCO_CONCEPT_DIRECTIONS: CocoConceptDirection[] = [
  {
    effectsStyle: "light-beams",
    id: "high-energy-club",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "rave",
    name: "High Energy Club",
    paletteStyle: "neon-contrast",
    secondaryMoodId: "nightlife",
    typePersonality: "nightclub",
  },
  {
    effectsStyle: "subtle-texture",
    id: "black-gold-party",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "luxury",
    name: "Black Gold Party",
    paletteStyle: "champagne-black",
    secondaryMoodId: "nightlife",
    typePersonality: "luxury",
  },
  {
    effectsStyle: "light-beams",
    id: "fashion-club-vertical",
    layoutId: "subject-center",
    layoutStyle: "vertical-editorial",
    moodId: "nightlife",
    name: "Fashion Club Vertical",
    paletteStyle: "burgundy-rose",
    secondaryMoodId: "luxury",
    typePersonality: "editorial",
  },
  {
    effectsStyle: "soft-bloom",
    id: "sensual-night",
    layoutId: "subject-center",
    layoutStyle: "close-crop",
    moodId: "rnb",
    name: "Sensual Night",
    paletteStyle: "burgundy-rose",
    secondaryMoodId: "latin",
    typePersonality: "elegant",
  },
  {
    effectsStyle: "analog-glow",
    id: "neon-night-shift",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "rave",
    name: "Neon Night Shift",
    paletteStyle: "neon-contrast",
    secondaryMoodId: "nightlife",
    typePersonality: "nightclub",
  },
  {
    effectsStyle: "soft-bloom",
    id: "glow-in-the-dark",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "rave",
    name: "Glow in the Dark",
    paletteStyle: "neon-contrast",
    secondaryMoodId: "nightlife",
    typePersonality: "festival",
  },
  {
    effectsStyle: "sunset-haze",
    id: "punta-cana-sundays",
    layoutId: "subject-center",
    layoutStyle: "vertical-editorial",
    moodId: "afrobeats",
    name: "Punta Cana Sundays",
    paletteStyle: "tropical-emerald",
    secondaryMoodId: "latin",
    typePersonality: "latin",
  },
  {
    effectsStyle: "light-beams",
    id: "baddies-n-bundles",
    layoutId: "subject-right",
    layoutStyle: "asymmetric",
    moodId: "hiphop",
    name: "Baddies N Bundles",
    paletteStyle: "black-electric",
    secondaryMoodId: "nightlife",
    typePersonality: "aggressive",
  },
  {
    effectsStyle: "grain-glitch",
    id: "city-nights",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "hiphop",
    name: "City Nights",
    paletteStyle: "deep-red-gold",
    secondaryMoodId: "nightlife",
    typePersonality: "aggressive",
  },
  {
    effectsStyle: "grain-glitch",
    id: "grey-rave-festival",
    layoutId: "subject-center",
    layoutStyle: "bold-center",
    moodId: "techno",
    name: "Grey Rave Festival",
    paletteStyle: "black-electric",
    secondaryMoodId: "nightlife",
    typePersonality: "aggressive",
  },
{"id": "pulse", "name": "Pulse Sunday", "effectsStyle": "subtle-texture", "layoutId": "subject-center", "layoutStyle": "bold-center", "moodId": "nightlife", "paletteStyle": "neon-contrast", "typePersonality": "editorial"},
{"id":"zona-de-perreo","name":"Zona de Perreo","effectsStyle":"subtle-texture","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"neon-contrast","typePersonality":"nightclub"},
{"id":"summer-sunset","name":"Summer Sunset","effectsStyle":"sunset-haze","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"retro-pop","typePersonality":"editorial"},
{"id":"diabla-all-white","name":"Diabla All White","effectsStyle":"soft-glow","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"champagne-black","typePersonality":"editorial"},
{"id":"rnb-thursdays","name":"R&B Thursdays","effectsStyle":"soft-glow","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"black-electric","typePersonality":"editorial"},
{"id":"reggae-jams","name":"Reggae Jams","effectsStyle":"subtle-texture","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"deep-red-gold","typePersonality":"nightclub"},
{"id":"amapiano-night","name":"Amapiano Night","effectsStyle":"subtle-texture","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"deep-red-gold","typePersonality":"nightclub"},
{"id":"como-una-boa","name":"Como Una Boa","effectsStyle":"soft-glow","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"tropical-emerald","typePersonality":"nightclub"},
{"id":"i-love-thursday","name":"I Love Thursday","effectsStyle":"soft-glow","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"neon-contrast","typePersonality":"nightclub"},
{"id":"elite-monday","name":"Elite Monday","effectsStyle":"soft-glow","layoutId":"subject-center","layoutStyle":"bold-center","moodId":"nightlife","paletteStyle":"black-electric","typePersonality":"nightclub"},
{"id": "we-outside", "name": "We Outside Saturday", "effectsStyle": "soft-glow", "layoutId": "subject-center", "layoutStyle": "bold-center", "moodId": "nightlife", "paletteStyle": "burgundy-rose", "typePersonality": "nightclub"},
{"id": "space-neon", "name": "Space Neon", "effectsStyle": "subtle-texture", "layoutId": "subject-center", "layoutStyle": "bold-center", "moodId": "nightlife", "paletteStyle": "neon-contrast", "typePersonality": "editorial"},
{"id": "brunch-saturday", "name": "Brunch Saturday", "effectsStyle": "subtle-texture", "layoutId": "subject-center", "layoutStyle": "bold-center", "moodId": "nightlife", "paletteStyle": "deep-red-gold", "typePersonality": "editorial"},
{"id": "brunch-vibes", "name": "Brunch Vibes", "effectsStyle": "subtle-texture", "layoutId": "subject-center", "layoutStyle": "bold-center", "moodId": "nightlife", "paletteStyle": "deep-red-gold", "typePersonality": "editorial"},
];
