import { FONT_FILE_MAP, TEMPLATE_ONLY_FONT_FAMILIES } from "./localFontMap";

function sortFontNames(fonts: string[]) {
  return [...fonts].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" })
  );
}

// Every font name is now auto-generated
export const HEADLINE_FONTS_LOCAL = sortFontNames(Object.keys(FONT_FILE_MAP).filter(family => !TEMPLATE_ONLY_FONT_FAMILIES.has(family)));
export const HEADLINE2_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];

const STRICT_BODY_FONT_NAMES = [
  "Bebas Neue",
  "BebasNeue-Regular",
  "Coolvetica Rg Cond",
  "LEMONMILK-Light",
  "LEMONMILK-Medium",
  "LEMONMILK-Regular",
  "LEMONMILK-Bold",
];
const STRICT_BODY_FONT_SET = new Set(STRICT_BODY_FONT_NAMES);

function availableBodyFonts(fonts: string[]) {
  return sortFontNames(
    fonts.filter(
      (font) => Object.prototype.hasOwnProperty.call(FONT_FILE_MAP, font)
    )
  );
}

export const BODY_FONTS_LOCAL = availableBodyFonts(STRICT_BODY_FONT_NAMES);
export const BODY_FONTS2_LOCAL = availableBodyFonts([
  "LEMONMILK-Light",
  "LEMONMILK-Regular",
  "LEMONMILK-Medium",
  "Bebas Neue",
  "BebasNeue-Regular",
]);
export const VENUE_FONTS_LOCAL = availableBodyFonts([
  "Bebas Neue",
  "BebasNeue-Regular",
  "Coolvetica Rg Cond",
  "LEMONMILK-Regular",
  "LEMONMILK-Medium",
  "LEMONMILK-Bold",
]);
export const SUBTAG_FONTS_LOCAL = availableBodyFonts([
  "Bebas Neue",
  "BebasNeue-Regular",
  "LEMONMILK-Regular",
  "LEMONMILK-Medium",
  "LEMONMILK-Bold",
]);

export type FontUseCaseGroup = {
  id: string;
  label: string;
  hint: string;
  fonts: string[];
};

const FONT_USE_CASES: FontUseCaseGroup[] = [
  {
    id: "hero-headlines",
    label: "Club / Poster Headlines",
    hint: "Big event names, artist names, club titles",
    fonts: [
      "Anton",
      "Antone DEMO",
      "Bebas Neue",
      "BebasNeue-Regular",
      "Brigends Expanded",
      "Coolvetica Hv Comp",
      "Coolvetica Rg Cond",
      "Coolvetica Rg Cram",
      "DIMITRI_",
      "Dabre Grunge",
      "Drift Brush SVG",
      "Bold Paint SVG",
      "Paint Splash Serif PNG",
      "Sunset Paint Brush PNG",
      "Euphoria Chrome PNG",
      "Mojito Serif PNG",
      "Textured Gold Serif PNG",
      "LEMONMILK-Bold",
      "LEMONMILK-BoldItalic",
      "LEMONMILK-Medium",
      "Lovelo Black",
      "Metropolis 1920",
      "Newake",
      "Nexa-Heavy",
      "Octin College Rg",
    ],
  },
  {
    id: "luxury-fashion-display",
    label: "Luxury / Fashion Display",
    hint: "Upscale lounges, fashion-forward titles, elegant poster accents",
    fonts: [
      "Rose Chrome Serif PNG",
      "Honey Gold Serif PNG",
      "Spotlight Gold PNG",
      "Clean Gold PNG",
      "Asectica Simple Demo",
      "Atlantis Famingo DEMO VERSION",
      "Avigea",
      "Avigea Italic",
      "Brich",
      "LEMONMILK-Light",
      "LEMONMILK-Regular",
      "Magiel Black",
      "Maglisto",
      "Metropolis 1920",
      "Nexa-ExtraLight",
      "Tropical Avenue",
      "Vartigo",
    ],
  },
  {
    id: "script-brush-accents",
    label: "Script / Brush Accents",
    hint: "Decorative accent words only; not for body copy",
    fonts: [
      "Whimsical SVG",
      "Adelia Alternate",
      "Antonio",
      "Aqilah-JRYXK",
      "Bigtimes",
      "Brittany Signature",
      "ChettaVissto",
      "Billion Dreams",
      "Muthiara",
      "Dopestyle",
      "Creamer",
      "Dear Script (Demo_Font)",
      "Good Brush",
      "Georgia Brush",
      "Hong Kong Script Brush",
      "Lacheyard Script",
      "Mitshuka",
      "Northwell",
      "Northwell Alt",
      "Northwell Swash",
      "OpenScript",
      "Paint the town",
      "Road Rage",
    ],
  },
  {
    id: "tech-futuristic",
    label: "Tech / Futuristic Display",
    hint: "EDM, cyber, digital, sci-fi and gaming flyers",
    fonts: [
      "Aliens Among Us",
      "Azonix",
      "BTSE PS2",
      "cubic",
      "Designer",
      "Digital Cards Demo",
      "DS-Digital",
      "Dune_Rise",
      "EdgeOfTheGalaxyRegular-OVEa6",
      "Galaxia Personal Used",
      "Game Of Squids",
      "Mandalore",
      "Mandalore 3D",
      "Mandalore 3D Italic",
      "Mandalore Condensed",
      "Mandalore Condensed Italic",
      "Mandalore Expanded",
      "Mandalore Expanded Italic",
      "Mandalore Gradient",
      "Mandalore Gradient Italic",
      "Mandalore Halftone",
      "Mandalore Halftone Italic",
      "Mandalore Italic",
      "Mandalore Laser",
      "Mandalore Laser Italic",
      "Mandalore Laser Leftalic",
      "Mandalore Laser Rough",
      "Mandalore Laser Rough Italic",
      "Mandalore Laser Semi-Italic",
      "Mandalore Laser Super-Italic",
      "Mandalore Laser Title",
      "Mandalore Laser Title Italic",
      "Mandalore Leftalic",
      "Mandalore Rough",
      "Mandalore Rough Italic",
      "Mandalore Semi-Italic",
      "Mandalore Super-Italic",
      "Mandalore Title",
      "Mandalore Title Italic",
      "Moderniz",
      "Techno Hideo",
      "Techno Hideo Bold",
      "TR2N",
    ],
  },
  {
    id: "street-grunge-horror",
    label: "Street / Grunge / Horror",
    hint: "Aggressive display faces for street, glitch, punk, and horror themes",
    fonts: [
      "Another Danger",
      "Another Danger Slanted",
      "BAD GRUNGE",
      "Bad Coma",
      "Broken Glass",
      "Doctor Glitch",
      "edosz",
      "Grunge Manifesto",
      "Nancy Spungen",
      "Nancy Spungen Basic",
      "Oups",
      "PaybAck",
      "who asks satan",
    ],
  },
  {
    id: "retro-novelty-game",
    label: "Retro / Novelty / Game",
    hint: "Retro signage, pixel, game, movie, and themed novelty display faces",
    fonts: [
      "Minecrafter",
      "Minecrafter Alt",
      "Monoton",
      "Lovelo Black",
      "Metropolis 1920",
      "Pixel Digivolve",
      "Pixel Digivolve Italic",
      "SF Hollywood Hills",
      "SF Hollywood Hills Bold",
      "SF Hollywood Hills Bold Italic",
      "SF Hollywood Hills Condensed",
      "SF Hollywood Hills Condensed Italic",
      "SF Hollywood Hills Extended",
      "SF Hollywood Hills Extended Italic",
      "SF Hollywood Hills Italic",
    ],
  },
  {
    id: "cultural-theme-display",
    label: "Cultural / Theme Display",
    hint: "Highly specific themed display faces for special concepts",
    fonts: [
      "African",
      "jelani",
      "raidercrusader",
    ],
  },
  {
    id: "details-body-copy",
    label: "Details / Body Copy",
    hint: "Dates, venue, price, small readable flyer info",
    fonts: STRICT_BODY_FONT_NAMES,
  },
];

function localFontsFrom(fonts: string[]) {
  const available = new Set(HEADLINE_FONTS_LOCAL);
  return sortFontNames(fonts.filter((font) => available.has(font)));
}

function fontsForUseCase(id: string) {
  return FONT_USE_CASES.find((group) => group.id === id)?.fonts ?? [];
}

function uniqueFontList(fonts: string[]) {
  const seen = new Set<string>();
  return fonts.filter((font) => {
    if (seen.has(font)) return false;
    seen.add(font);
    return true;
  });
}

const COCO_CLUB_HEADLINE_FONTS = localFontsFrom([
  "Bebas Neue",
  "LEMONMILK-Bold",
  "Lovelo Black",
  "Anton",
  "Nexa-Heavy",
  "Newake",
  "Brigends Expanded",
  "Coolvetica Hv Comp",
  "Octin College Rg",
]);

const COCO_LUXURY_HEADLINE_FONTS = localFontsFrom([
  "Avigea",
  "Avigea Italic",
  "Magiel Black",
  "Metropolis 1920",
  "Maglisto",
  "Brich",
  "LEMONMILK-Bold",
  "LEMONMILK-Regular",
  "Nexa-Heavy",
  "Nexa-ExtraLight",
  "Bebas Neue",
]);

const COCO_TROPICAL_HEADLINE_FONTS = localFontsFrom([
      "Tropical Avenue",
      "Transcity",
  "African",
  "Magiel Black",
  "Bebas Neue",
  "LEMONMILK-Bold",
  "Nexa-Heavy",
]);

const COCO_TECHNO_HEADLINE_FONTS = localFontsFrom([
  "Azonix",
  "Dune_Rise",
  "Moderniz",
  "Techno Hideo",
  "Techno Hideo Bold",
  "TR2N",
  "Aliens Among Us",
  "Designer",
  "Bebas Neue",
  "LEMONMILK-Bold",
]);

const COCO_RETRO_HEADLINE_FONTS = localFontsFrom([
  "Monoton",
  "Lovelo Black",
  "Metropolis 1920",
  "Coolvetica Hv Comp",
  "Coolvetica Rg Cond",
  "Octin College Rg",
  "SF Hollywood Hills",
  "SF Hollywood Hills Bold",
  "Bebas Neue",
  "LEMONMILK-Bold",
]);

const COCO_AGGRESSIVE_HEADLINE_FONTS = localFontsFrom([
  "DIMITRI_",
  "BAD GRUNGE",
  "Bad Coma",
  "Doctor Glitch",
  "Grunge Manifesto",
  "PaybAck",
  "Nexa-Heavy",
  "Anton",
  "Bebas Neue",
]);

export const COCO_HEADLINE_FONTS_LOCAL = localFontsFrom(
  uniqueFontList([
    ...fontsForUseCase("hero-headlines"),
    ...fontsForUseCase("luxury-fashion-display"),
    ...fontsForUseCase("tech-futuristic"),
    ...fontsForUseCase("street-grunge-horror"),
    ...fontsForUseCase("retro-novelty-game"),
    ...fontsForUseCase("cultural-theme-display"),
  ])
);

export function cocoHeadlineFontsForStyle(
  nightlifeStyle?: string | null,
  eventText = ""
) {
  const text = `${nightlifeStyle ?? ""} ${eventText}`.toLowerCase();
  const withClub = (fonts: string[]) =>
    localFontsFrom(uniqueFontList([...fonts, ...COCO_CLUB_HEADLINE_FONTS]));

  if (/(edm|house|techno|rave|bass|cyber|digital|neon)/.test(text)) {
    return withClub(COCO_TECHNO_HEADLINE_FONTS);
  }
  if (/(afro|afrobeats|latin|salsa|bachata|reggaeton|tropical|mojito|island|summer|beach|pool)/.test(text)) {
    return withClub(COCO_TROPICAL_HEADLINE_FONTS);
  }
  if (/(retro|throwback|old school|disco|90s|2000s)/.test(text)) {
    return withClub(COCO_RETRO_HEADLINE_FONTS);
  }
  if (/(vip|lux|luxe|luxury|black tie|champagne|premium|rnb|r&b|ladies|bottle-service|lounge|rooftop)/.test(text)) {
    return withClub(COCO_LUXURY_HEADLINE_FONTS);
  }
  if (/(hip-hop|hiphop|trap|urban|street|grunge|horror|punk|rage)/.test(text)) {
    return withClub(COCO_AGGRESSIVE_HEADLINE_FONTS);
  }

  return withClub([
    "Avigea",
    "Magiel Black",
    "Designer",
    "Moderniz",
  ]);
}

export function groupFontsByUseCase(options: string[]): FontUseCaseGroup[] {
  const available = new Set(options);
  if (options.length > 0 && options.every((font) => STRICT_BODY_FONT_SET.has(font))) {
    return [
      {
        id: "details-body-copy",
        label: "Details / Body Copy",
        hint: "Readable support fonts for dates, venue, price, and small flyer info",
        fonts: sortFontNames(options),
      },
    ];
  }

  const categorized = new Set<string>();
  const groups = FONT_USE_CASES.map((group) => {
    const fonts = sortFontNames(group.fonts.filter((font) => {
      if (!available.has(font)) return false;
      if (categorized.has(font)) return false;
      categorized.add(font);
      return true;
    }));
    return { ...group, fonts };
  }).filter((group) => group.fonts.length > 0);

  const uncategorized = sortFontNames(options.filter((font) => !categorized.has(font)));
  if (uncategorized.length) {
    groups.push({
      id: "experimental",
      label: "Experimental / Other",
      hint: "Extra display faces for specific poster moods",
      fonts: uncategorized,
    });
  }

  return groups;
}
