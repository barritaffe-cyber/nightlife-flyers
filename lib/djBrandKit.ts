export type SafeZone = "top-left" | "bottom-center" | "bottom-right";

export type DJBrandKit = {
  v: 1;
  djName: string;
  logos: string[];
  primaryPortrait: string | null;
  preferredFonts: {
    headline: string;
    body: string;
  };
  brandPalette: {
    main: string;
    accent: string;
    glow: string;
  };
  social: {
    handle: string;
    alwaysShowBottomRight: boolean;
  };
};

export type DJFontPreset = {
  id: string;
  label: string;
  headline: string;
  body: string;
};

export type DJColorPreset = {
  id: string;
  label: string;
  main: string;
  accent: string;
  glow: string;
};

const DJ_BRAND_KIT_KEY = "nightlife-flyers.dj-brandkit.v1";
const LEGACY_BRAND_KIT_KEY = "nightlife-flyers.brandkit.v1";

const DEFAULT_BRAND_KIT: DJBrandKit = {
  v: 1,
  djName: "",
  logos: ["", "", "", ""],
  primaryPortrait: null,
  preferredFonts: {
    headline: "Bebas Neue",
    body: "Inter",
  },
  brandPalette: {
    main: "#FFFFFF",
    accent: "#E23B2E",
    glow: "#00FFF0",
  },
  social: {
    handle: "",
    alwaysShowBottomRight: true,
  },
};

export const DJ_FONT_PRESETS: DJFontPreset[] = [
  { id: "grime-heavy", label: "Heavy Grime", headline: "Anton", body: "Bebas Neue" },
  { id: "clean-house", label: "Clean House", headline: "League Spartan", body: "Inter" },
  { id: "festival-neon", label: "Festival Neon", headline: "Bebas Neue", body: "Oswald" },
];

export const DJ_COLOR_PRESETS: DJColorPreset[] = [
  { id: "electric-cyan", label: "Electric Cyan", main: "#E8FCFF", accent: "#00C7BE", glow: "#00FFF0" },
  { id: "sunset-heat", label: "Sunset Heat", main: "#FFF1D6", accent: "#FF5A36", glow: "#FFB36B" },
  { id: "monochrome-gold", label: "Mono Gold", main: "#F5F5F5", accent: "#111111", glow: "#D4AF37" },
];

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeLogos(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : [];
  const safe = arr
    .slice(0, 4)
    .map((x) => (typeof x === "string" ? x : ""));
  while (safe.length < 4) safe.push("");
  return safe;
}

function toDjBrandKit(raw: unknown): DJBrandKit {
  if (!isObject(raw)) return { ...DEFAULT_BRAND_KIT, logos: [...DEFAULT_BRAND_KIT.logos] };

  const preferredFonts = isObject(raw.preferredFonts) ? raw.preferredFonts : {};
  const brandPalette = isObject(raw.brandPalette) ? raw.brandPalette : {};
  const social = isObject(raw.social) ? raw.social : {};

  return {
    v: 1,
    djName: asString(raw.djName, ""),
    logos: normalizeLogos(raw.logos),
    primaryPortrait: asString(raw.primaryPortrait, "") || null,
    preferredFonts: {
      headline: asString(preferredFonts.headline, DEFAULT_BRAND_KIT.preferredFonts.headline),
      body: asString(preferredFonts.body, DEFAULT_BRAND_KIT.preferredFonts.body),
    },
    brandPalette: {
      main: asString(brandPalette.main, DEFAULT_BRAND_KIT.brandPalette.main),
      accent: asString(brandPalette.accent, DEFAULT_BRAND_KIT.brandPalette.accent),
      glow: asString(brandPalette.glow, DEFAULT_BRAND_KIT.brandPalette.glow),
    },
    social: {
      handle: asString(social.handle, ""),
      alwaysShowBottomRight:
        typeof social.alwaysShowBottomRight === "boolean"
          ? social.alwaysShowBottomRight
          : DEFAULT_BRAND_KIT.social.alwaysShowBottomRight,
    },
  };
}

function fromLegacyBrandKit(raw: unknown): DJBrandKit | null {
  if (!isObject(raw)) return null;
  if (raw.v !== 1) return null;

  const fonts = isObject(raw.fonts) ? raw.fonts : {};
  const colors = isObject(raw.colors) ? raw.colors : {};
  const maybeLogo = asString(raw.logoDataUrl, "");

  return {
    ...DEFAULT_BRAND_KIT,
    preferredFonts: {
      headline: asString(fonts.headlineFamily, DEFAULT_BRAND_KIT.preferredFonts.headline),
      body: asString(fonts.detailsFamily, DEFAULT_BRAND_KIT.preferredFonts.body),
    },
    brandPalette: {
      main: asString(colors.headlineFill, DEFAULT_BRAND_KIT.brandPalette.main),
      accent: asString(colors.subtagBgColor, DEFAULT_BRAND_KIT.brandPalette.accent),
      glow: asString(colors.gradTo, DEFAULT_BRAND_KIT.brandPalette.glow),
    },
    logos: [maybeLogo, "", "", ""],
  };
}

export function createDefaultDjBrandKit(): DJBrandKit {
  return { ...DEFAULT_BRAND_KIT, logos: [...DEFAULT_BRAND_KIT.logos] };
}

export function readDjBrandKit(): DJBrandKit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DJ_BRAND_KIT_KEY);
    if (raw) return toDjBrandKit(JSON.parse(raw));
  } catch {}

  try {
    const rawLegacy = localStorage.getItem(LEGACY_BRAND_KIT_KEY);
    if (!rawLegacy) return null;
    const mapped = fromLegacyBrandKit(JSON.parse(rawLegacy));
    if (!mapped) return null;
    writeDjBrandKit(mapped);
    return mapped;
  } catch {}

  return null;
}

export function writeDjBrandKit(kit: DJBrandKit): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DJ_BRAND_KIT_KEY, JSON.stringify(toDjBrandKit(kit)));
  } catch {}
}

export function clearDjBrandKit(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DJ_BRAND_KIT_KEY);
  } catch {}
}

export function normalizeDjHandle(input: string): string {
  const cleaned = String(input || "").trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

export function getSafeZonePosition(zone: SafeZone): { x: number; y: number } {
  // y uses top-position percentages; 80 keeps a typical logo clear of edges.
  switch (zone) {
    case "top-left":
      return { x: 6, y: 6 };
    case "bottom-center":
      return { x: 50, y: 80 };
    case "bottom-right":
    default:
      return { x: 94, y: 80 };
  }
}

