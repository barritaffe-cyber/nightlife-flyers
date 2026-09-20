import type { VisualRecipe } from "./types.ts";

type GalleryRecipeSeed = Readonly<{
  id: string;
  name: string;
  summary: string;
}>;

const GALLERY_RECIPE_SEEDS: ReadonlyArray<GalleryRecipeSeed> = [
  { id: "afro-sunset", name: "Afro Sunset — Skyline Rooftop", summary: "A warm rooftop nightlife composition with a sunset palette, dominant portrait, and compact event information." },
  { id: "afrobeat-rooftop", name: "Afrobeat Rooftop", summary: "An Afrobeat rooftop flyer with bold display type, warm city atmosphere, and structured supporting copy." },
  { id: "aura", name: "Aura — Elevated Nightlife", summary: "A polished center-hero nightlife poster with luminous accents and a strong title-to-subject relationship." },
  { id: "bass-pressure", name: "Bass Pressure — Concrete", summary: "An industrial bass-night poster with concrete texture, compressed typography, and hard-edged club energy." },
  { id: "black-tie", name: "Black Tie — Maison", summary: "A formal black-tie composition with restrained luxury, elegant typography, and a controlled monochrome palette." },
  { id: "branch-happy-hour", name: "Happy Hour — The Branch Rathskeller", summary: "A premium happy-hour flyer built around cocktails, warm hospitality, and concise offer information." },
  { id: "day-party", name: "Day Party — Offshore", summary: "A bright day-party composition with a large lifestyle subject, open-air color, and high-impact event type." },
  { id: "disco", name: "Disco — Y2K", summary: "A Y2K disco composition with reflective materials, dance-floor energy, and a prominent party headline." },
  { id: "drift-kingz", name: "Miami — Drift Kingz", summary: "An automotive Miami-night poster with a dominant car scene, aggressive type, and neon street color." },
  { id: "electric-sunset", name: "Electric Sunset — Golden Sky", summary: "A vivid sunset flyer balancing warm horizon light, electric accents, and clean event hierarchy." },
  { id: "en-blanc", name: "En Blanc — The Rooftop", summary: "A clean all-white rooftop event design with editorial spacing, dark type, and refined supporting details." },
  { id: "euphoria", name: "Euphoria — The Underground", summary: "An underground electronic flyer with dimensional neon type, dark atmosphere, and a central club subject." },
  { id: "fantasy", name: "Fantasy — Euphoria", summary: "A surreal nightlife composition with luminous fantasy color, expressive type, and layered atmospheric depth." },
  { id: "in-crowd", name: "The In Crowd — Peachtree Rooftop", summary: "An upscale rooftop flyer with editorial portrait placement and crisp metropolitan event information." },
  { id: "karaoke-night", name: "Karaoke Night — Neon Lounge", summary: "A neon karaoke poster with a clear entertainment headline, lounge atmosphere, and accessible event details." },
  { id: "ladies-secret", name: "Ladies Night — Neon Chrome", summary: "A women-led nightlife poster with chrome lettering, saturated neon light, and compact promotional copy." },
  { id: "mardi-gras", name: "Mardi Gras — Carnival of Colors", summary: "A carnival-night composition with jewel colors, celebratory detail, and a bold Mardi Gras headline." },
  { id: "martini-night", name: "Martini Night — Velvet Room", summary: "A cocktail-led lounge flyer with dark velvet atmosphere, elegant type, and warm glass highlights." },
  { id: "miami-nights", name: "Miami Nights — Sunset Sessions", summary: "A Miami sunset-night flyer with tropical color, prominent portraiture, and high-contrast club typography." },
  { id: "miami-ocean-nights", name: "Miami Nights — Ocean Drive", summary: "An Ocean Drive nightlife composition with tropical neon, luxury styling, and clear event hierarchy." },
  { id: "miami-street", name: "Miami Street — Nights", summary: "A street-luxury Miami poster with energetic brush lettering, automotive atmosphere, and bold nightlife color." },
  { id: "mind-state", name: "Mind State — Arctic Metal", summary: "A techno poster with arctic metallic typography, industrial staging, and a tightly controlled cool palette." },
  { id: "mojito-monday", name: "Mojito Monday — Mint Lounge", summary: "A fresh cocktail-night composition with mint color, polished lounge imagery, and playful promotional type." },
  { id: "new-york", name: "New York", summary: "A metropolitan nightlife flyer with dense city atmosphere, bold headline structure, and concise venue details." },
  { id: "nocturne-muse", name: "Nocturne — Midnight Muse", summary: "A fashion-led nocturne poster with a dark floral atmosphere, elegant display type, and refined event copy." },
  { id: "one-love-reggae", name: "One Love — Reggae Night", summary: "A Caribbean reggae-night flyer with warm color, rhythmic typography, and a relaxed social atmosphere." },
  { id: "salsa-noche", name: "Salsa Noche — La Fiesta", summary: "A tropical Latin-night design with lively movement, warm saturated color, and dance-focused information." },
  { id: "sip-and-paint", name: "Sip and Paint — The Social Lounge", summary: "A social art-night flyer balancing creative imagery, drinks, and an easy-to-scan event hierarchy." },
  { id: "slow-jamz", name: "Slow Jamz — Velvet Room", summary: "A moody R&B flyer with soft luxury, intimate portraiture, and elegant late-night typography." },
  { id: "soiree-dream-house", name: "Soiree — Dream House", summary: "An elegant dream-house flyer with teal atmosphere, refined type, and a spacious premium composition." },
  { id: "sugar-rush", name: "Sugar Rush — Suite 5", summary: "A bright nightlife composition with playful candy color, bold headline scale, and energetic party details." },
  { id: "sunset-yacht", name: "Sunset Yacht — Sunset Sessions", summary: "A yacht-party flyer with warm ocean light, upscale styling, and clean sunset-session information." },
  { id: "taco-tuesday", name: "Taco Tuesday — Velvet Room", summary: "A food-and-drinks nightlife poster with warm gold details, appetizing imagery, and direct weekly promotion." },
  { id: "throwback-saturdays", name: "Throwback Saturdays", summary: "A retro Saturday-night flyer with nostalgic music cues, bold period styling, and structured event details." },
  { id: "yacht-escape", name: "Yacht Escape", summary: "A luxury yacht-event flyer with open-water atmosphere, premium type, and compact booking information." },
];

export const GALLERY_TEMPLATE_RECIPE_IDS: Readonly<Record<string, string>> = {
  luxe: "afro-sunset",
  afrobeat_rooftop: "afrobeat-rooftop",
  square_center_hero_nightlife: "aura",
  dnb_bunker: "bass-pressure",
  blk_tie: "black-tie",
  branch_happy_hour: "branch-happy-hour",
  day_party: "day-party",
  disco_mirrorball: "disco",
  miami_heat: "drift-kingz",
  "la-lux": "electric-sunset",
  white_minimal: "en-blanc",
  edm_tunnel: "euphoria",
  fantasy: "fantasy",
  atlanta: "in-crowd",
  karaokee: "karaoke-night",
  secret_friday: "ladies-secret",
  mardi_gras: "mardi-gras",
  martini: "martini-night",
  miami2: "miami-nights",
  miami_ocean_nights: "miami-ocean-nights",
  miami_st: "miami-street",
  edm_stage_co2: "mind-state",
  kpop_pastel_led: "mojito-monday",
  "new-york": "new-york",
  nocturne_midnight_muse: "nocturne-muse",
  one_love_reggae: "one-love-reggae",
  latin_street_tropical: "salsa-noche",
  sip_and_paint: "sip-and-paint",
  rnb_velvet: "slow-jamz",
  soiree_dream_house: "soiree-dream-house",
  sugar_rush: "sugar-rush",
  sunset_yacht: "sunset-yacht",
  taco_tuesday: "taco-tuesday",
  throwback_cassette: "throwback-saturdays",
  yacht_escape: "yacht-escape",
};

function galleryRecipe(seed: GalleryRecipeSeed): VisualRecipe {
  return {
    id: seed.id,
    name: seed.name,
    version: 2,
    reference: `/generated-flyers/${seed.id}.nflyer`,
    referenceMode: "visual-inheritance",
    summary: seed.summary,
    layerStack: [
      "authored background",
      "authored scene and subject assets",
      "editable typography",
      "foreground details",
    ],
    textZones: [
      { id: "headline", purpose: "Primary event identity.", placement: "Use the authored Square and Story positions." },
      { id: "headline2", purpose: "Secondary title or theme.", placement: "Keep its authored relationship to the headline." },
      { id: "details", purpose: "Event facts and offers.", placement: "Preserve the authored information lane." },
      { id: "venue", purpose: "Venue and location.", placement: "Preserve the authored footer or venue lane." },
    ],
    typography: [
      "Preserve the authored font roles, scale contrast, tracking, and alignment.",
      "Keep all user-facing copy editable through its mapped controls.",
    ],
    colorGrade: ["Preserve the authored palette, image treatment, and contrast hierarchy."],
    avoid: [
      "Replacing the authored Square or Story layout with a generic composition.",
      "Flattening editable text into the background.",
      "Importing backup or submitted project files as separate recipes.",
    ],
    appNotes: [
      "The saved .nflyer project is the executable recipe master.",
      "Square and Story are independent authored variants.",
    ],
  };
}

export const GALLERY_TEMPLATE_RECIPES: ReadonlyArray<VisualRecipe> =
  GALLERY_RECIPE_SEEDS.map(galleryRecipe);
