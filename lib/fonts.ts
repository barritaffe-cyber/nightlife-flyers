import { FONT_FILE_MAP } from "./localFontMap";

function sortFontNames(fonts: string[]) {
  return [...fonts].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" })
  );
}

// Every font name is now auto-generated
export const HEADLINE_FONTS_LOCAL = sortFontNames(Object.keys(FONT_FILE_MAP));
export const HEADLINE2_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const BODY_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const BODY_FONTS2_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const VENUE_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const SUBTAG_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];

export type FontUseCaseGroup = {
  id: string;
  label: string;
  hint: string;
  fonts: string[];
};

const FONT_USE_CASES: FontUseCaseGroup[] = [
  {
    id: "hero-headlines",
    label: "Hero Headlines",
    hint: "Big event names, artist names, club titles",
    fonts: [
      "Anton",
      "Antone DEMO",
      "Antonio",
      "Bebas Neue",
      "BebasNeue-Regular",
      "Brigends Expanded",
      "Coolvetica Hv Comp",
      "Coolvetica Rg Cond",
      "Coolvetica Rg Cram",
      "DIMITRI_",
      "LEMONMILK-Bold",
      "LEMONMILK-BoldItalic",
      "LEMONMILK-Medium",
      "Magiel Black",
      "Monoton",
      "Newake",
      "Nexa-Heavy",
      "Octin College Rg",
    ],
  },
  {
    id: "script-brush-accents",
    label: "Script / Brush Accents",
    hint: "Handwritten names, VIP notes, ladies-night accents",
    fonts: [
      "Adelia Alternate",
      "Aqilah-JRYXK",
      "Bigtimes",
      "ChettaVissto",
      "Dear Script (Demo_Font)",
      "Good Brush",
      "Lacheyard Script",
      "Mitshuka",
      "OpenScript",
      "Paint the town",
      "Road Rage",
    ],
  },
  {
    id: "tech-futuristic",
    label: "Tech / Futuristic",
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
      "Minecrafter",
      "Minecrafter Alt",
      "Moderniz",
      "Techno Hideo",
      "Techno Hideo Bold",
      "TR2N",
    ],
  },
  {
    id: "luxury-rnb",
    label: "Luxury / R&B",
    hint: "Upscale lounges, premium artist flyers, smooth events",
    fonts: [
      "Atlantis Famingo DEMO VERSION",
      "Avigea",
      "Avigea Italic",
      "Brich",
      "LEMONMILK-Light",
      "Magiel Black",
      "Maglisto",
      "Nexa-ExtraLight",
      "Tropical Avenue",
      "Vartigo",
    ],
  },
  {
    id: "details-body-copy",
    label: "Details / Body Copy",
    hint: "Dates, venue, price, small readable flyer info",
    fonts: [
      "Asectica Simple Demo",
      "Antonio",
      "Bebas Neue",
      "BebasNeue-Regular",
      "Coolvetica Rg Cond",
      "LEMONMILK-Light",
      "LEMONMILK-Medium",
      "LEMONMILK-Regular",
      "Nexa-ExtraLight",
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
    id: "theme-novelty",
    label: "Themed / Novelty Looks",
    hint: "Street, horror, college, afro, retro, game-style posters",
    fonts: [
      "African",
      "BAD GRUNGE",
      "Bad Coma",
      "Broken Glass",
      "Doctor Glitch",
      "edosz",
      "Grunge Manifesto",
      "jelani",
      "Monoton",
      "Nancy Spungen",
      "Nancy Spungen Basic",
      "Oups",
      "PaybAck",
      "Pixel Digivolve",
      "Pixel Digivolve Italic",
      "raidercrusader",
      "who asks satan",
    ],
  },
];

export function groupFontsByUseCase(options: string[]): FontUseCaseGroup[] {
  const available = new Set(options);
  const categorized = new Set<string>();
  const groups = FONT_USE_CASES.map((group) => {
    const fonts = sortFontNames(group.fonts.filter((font) => {
      if (!available.has(font)) return false;
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
