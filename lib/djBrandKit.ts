export type SafeZone = "top-left" | "bottom-center" | "bottom-right";

export type DJBrandMainFacePlacement = {
  x: number;
  y: number;
  scale: number;
  filterPreset?: "none" | "mono" | "contrast" | "halftone" | "poster" | "pop";
  filterStrength?: number;
};

export type DJBrandKit = {
  v: 1;
  id: string;
  label: string;
  djName: string;
  logos: string[];
  primaryPortrait: string | null;
  primaryPortraitPlacement: DJBrandMainFacePlacement;
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

export type DJBrandKitCollection = {
  v: 1;
  activeId: string;
  kits: DJBrandKit[];
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
const DJ_BRAND_KIT_COLLECTION_KEY = "nightlife-flyers.dj-brandkit.collection.v1";
const LEGACY_BRAND_KIT_KEY = "nightlife-flyers.brandkit.v1";

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

function createBrandKitId(): string {
  return `brand_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultBrandKit(label = "Brand 1"): DJBrandKit {
  return {
    v: 1,
    id: createBrandKitId(),
    label,
    djName: "",
    logos: ["", "", "", ""],
    primaryPortrait: null,
    primaryPortraitPlacement: {
      x: 50,
      y: 50,
      scale: 0.85,
      filterPreset: "none",
      filterStrength: 0.85,
    },
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
}

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

function asFiniteNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function normalizeMainFacePlacement(v: unknown, fallback: DJBrandMainFacePlacement): DJBrandMainFacePlacement {
  if (!isObject(v)) return fallback;
  const rawPreset = asString(v.filterPreset, fallback.filterPreset ?? "none");
  const filterPreset =
    rawPreset === "mono" || rawPreset === "contrast" || rawPreset === "halftone" || rawPreset === "poster" || rawPreset === "pop"
      ? rawPreset
      : "none";
  return {
    x: Math.max(0, Math.min(100, asFiniteNumber(v.x, fallback.x))),
    y: Math.max(0, Math.min(100, asFiniteNumber(v.y, fallback.y))),
    scale: Math.max(0.1, Math.min(5, asFiniteNumber(v.scale, fallback.scale))),
    filterPreset,
    filterStrength: Math.max(0, Math.min(1, asFiniteNumber(v.filterStrength, fallback.filterStrength ?? 0.85))),
  };
}

function toDjBrandKit(raw: unknown, fallbackLabel = "Brand 1"): DJBrandKit {
  const base = buildDefaultBrandKit(fallbackLabel);
  if (!isObject(raw)) return base;

  const preferredFonts = isObject(raw.preferredFonts) ? raw.preferredFonts : {};
  const brandPalette = isObject(raw.brandPalette) ? raw.brandPalette : {};
  const social = isObject(raw.social) ? raw.social : {};

  return {
    v: 1,
    id: asString(raw.id, base.id),
    label: asString(raw.label, fallbackLabel),
    djName: asString(raw.djName, ""),
    logos: normalizeLogos(raw.logos),
    primaryPortrait: asString(raw.primaryPortrait, "") || null,
    primaryPortraitPlacement: normalizeMainFacePlacement(
      raw.primaryPortraitPlacement,
      base.primaryPortraitPlacement
    ),
    preferredFonts: {
      headline: asString(preferredFonts.headline, base.preferredFonts.headline),
      body: asString(preferredFonts.body, base.preferredFonts.body),
    },
    brandPalette: {
      main: asString(brandPalette.main, base.brandPalette.main),
      accent: asString(brandPalette.accent, base.brandPalette.accent),
      glow: asString(brandPalette.glow, base.brandPalette.glow),
    },
    social: {
      handle: asString(social.handle, ""),
      alwaysShowBottomRight:
        typeof social.alwaysShowBottomRight === "boolean"
          ? social.alwaysShowBottomRight
          : base.social.alwaysShowBottomRight,
    },
  };
}

function fromLegacyBrandKit(raw: unknown): DJBrandKit | null {
  if (!isObject(raw)) return null;
  if (raw.v !== 1) return null;

  const fonts = isObject(raw.fonts) ? raw.fonts : {};
  const colors = isObject(raw.colors) ? raw.colors : {};
  const maybeLogo = asString(raw.logoDataUrl, "");
  const base = buildDefaultBrandKit("Brand 1");

  return {
    ...base,
    preferredFonts: {
      headline: asString(fonts.headlineFamily, base.preferredFonts.headline),
      body: asString(fonts.detailsFamily, base.preferredFonts.body),
    },
    brandPalette: {
      main: asString(colors.headlineFill, base.brandPalette.main),
      accent: asString(colors.subtagBgColor, base.brandPalette.accent),
      glow: asString(colors.gradTo, base.brandPalette.glow),
    },
    logos: [maybeLogo, "", "", ""],
  };
}

function normalizeKitLabel(raw: string, index: number): string {
  const clean = String(raw || "").trim();
  return clean || `Brand ${index + 1}`;
}

function normalizeCollection(raw: unknown): DJBrandKitCollection {
  const fallbackKit = buildDefaultBrandKit("Brand 1");

  if (!isObject(raw)) {
    return { v: 1, activeId: fallbackKit.id, kits: [fallbackKit] };
  }

  const list = Array.isArray(raw.kits) ? raw.kits : [];
  const kits = list.map((item, index) => {
    const normalized = toDjBrandKit(item, `Brand ${index + 1}`);
    return { ...normalized, label: normalizeKitLabel(normalized.label, index) };
  });

  const safeKits = kits.length ? kits : [fallbackKit];
  const activeId = asString(raw.activeId, safeKits[0].id);
  const hasActive = safeKits.some((kit) => kit.id === activeId);

  return {
    v: 1,
    activeId: hasActive ? activeId : safeKits[0].id,
    kits: safeKits,
  };
}

function persistCollection(collection: DJBrandKitCollection): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeCollection(collection);
    localStorage.setItem(DJ_BRAND_KIT_COLLECTION_KEY, JSON.stringify(normalized));
    const activeKit =
      normalized.kits.find((kit) => kit.id === normalized.activeId) || normalized.kits[0];
    if (activeKit) {
      localStorage.setItem(DJ_BRAND_KIT_KEY, JSON.stringify(activeKit));
    }
  } catch {}
}

export function createDefaultDjBrandKit(label = "Brand 1"): DJBrandKit {
  return buildDefaultBrandKit(label);
}

export function createDefaultDjBrandKitCollection(): DJBrandKitCollection {
  const first = buildDefaultBrandKit("Brand 1");
  return {
    v: 1,
    activeId: first.id,
    kits: [first],
  };
}

export function readDjBrandKitCollection(): DJBrandKitCollection {
  if (typeof window === "undefined") return createDefaultDjBrandKitCollection();

  try {
    const raw = localStorage.getItem(DJ_BRAND_KIT_COLLECTION_KEY);
    if (raw) return normalizeCollection(JSON.parse(raw));
  } catch {}

  try {
    const rawSingle = localStorage.getItem(DJ_BRAND_KIT_KEY);
    if (rawSingle) {
      const kit = toDjBrandKit(JSON.parse(rawSingle), "Brand 1");
      const collection = { v: 1 as const, activeId: kit.id, kits: [kit] };
      persistCollection(collection);
      return collection;
    }
  } catch {}

  try {
    const rawLegacy = localStorage.getItem(LEGACY_BRAND_KIT_KEY);
    if (rawLegacy) {
      const mapped = fromLegacyBrandKit(JSON.parse(rawLegacy));
      if (mapped) {
        const collection = { v: 1 as const, activeId: mapped.id, kits: [mapped] };
        persistCollection(collection);
        return collection;
      }
    }
  } catch {}

  return createDefaultDjBrandKitCollection();
}

export function writeDjBrandKitCollection(collection: DJBrandKitCollection): void {
  persistCollection(collection);
}

export function readDjBrandKit(): DJBrandKit | null {
  const collection = readDjBrandKitCollection();
  return collection.kits.find((kit) => kit.id === collection.activeId) || collection.kits[0] || null;
}

export function writeDjBrandKit(kit: DJBrandKit): void {
  const current = readDjBrandKitCollection();
  const nextKits = current.kits.some((item) => item.id === kit.id)
    ? current.kits.map((item) => (item.id === kit.id ? toDjBrandKit(kit, item.label) : item))
    : [...current.kits, toDjBrandKit(kit, `Brand ${current.kits.length + 1}`)];
  persistCollection({
    v: 1,
    activeId: kit.id,
    kits: nextKits,
  });
}

export function clearDjBrandKit(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DJ_BRAND_KIT_KEY);
  } catch {}
  try {
    localStorage.removeItem(DJ_BRAND_KIT_COLLECTION_KEY);
  } catch {}
}

export function normalizeDjHandle(input: string): string {
  const cleaned = String(input || "").trim().replace(/\s+/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

export function getSafeZonePosition(zone: SafeZone): { x: number; y: number } {
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
