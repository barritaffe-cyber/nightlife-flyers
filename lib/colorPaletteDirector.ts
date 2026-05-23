export const PALETTE_RULES = {
  minAccentSaturation: 70,
  minAccentChroma: 45,
  minDominantDarkness: 32,
  minContrastRatio: 4.5,
  maxWashedOutLightness: 82,
  minMoodDepth: 18,
} as const;

export const CINEMATIC_RULES = {
  minSmallTextContrast: 6.2,
  minHeadlineContrast: 4.5,
  minHueSeparationAccent: 85,
  minTempVariance: 0.35,
  maxWashedOutSaturation: 38,
  maxWashedOutLightness: 82,
} as const;

export const MIN_HUE_DISTANCE = 35;
export const MIN_LIGHTNESS_DISTANCE = 28;
export const MIN_CONTRAST_RATIO = PALETTE_RULES.minContrastRatio;
export const MIN_EXTRACTED_ACCENT_SATURATION = PALETTE_RULES.minAccentSaturation;
export const MIN_FINAL_ACCENT_SATURATION = PALETTE_RULES.minAccentSaturation;
export const TARGET_ACCENT_SATURATION = 92;
export const MIN_COLORFUL_DOMINANT_SATURATION = 18;

type Rgb = { r: number; g: number; b: number };
type PaletteRole =
  | "dominant"
  | "accent"
  | "support"
  | "atmospheric"
  | "luxury"
  | "readability"
  | "energy"
  | "shadow";

export type DirectedPaletteInput =
  | string
  | {
      hex?: string;
      r?: number;
      g?: number;
      b?: number;
      h?: number;
      s?: number;
      l?: number;
      chroma?: number;
      weight?: number;
    };

export type DirectedPaletteColor = {
  hex: string;
  h: number;
  s: number;
  l: number;
  chroma: number;
  weight: number;
  generated?: boolean;
  reason?: string;
  role?: PaletteRole;
  usage?: string;
  percentage?: number;
};

export type DirectedPalette = {
  dominant: DirectedPaletteColor & {
    role: "dominant";
    usage: "background / atmosphere / large shapes";
    percentage: 65;
  };
  accent: DirectedPaletteColor & {
    role: "accent";
    usage: "headline / icons / glow / CTA";
    percentage: 25;
  };
  support: DirectedPaletteColor & {
    role: "support";
    usage: "small text / shadows / depth";
    percentage: 10;
  };
  atmosphericColor: DirectedPaletteColor;
  luxuryColor: DirectedPaletteColor;
  readabilityColor: DirectedPaletteColor;
  energyColor: DirectedPaletteColor;
  shadowColor: DirectedPaletteColor;
  usageMap: {
    background: string;
    headline: string;
    bodyText: string;
    smallText: string;
    smallTextOpacity: 0.92;
    icons: string;
    glow: string;
    overlays: string;
    shadow: string;
    shadows: string;
    backgroundOverlay: string;
    backgroundBlendMode: "soft-light" | "overlay";
    headlinePrimary: string;
    headlineHighlight: string;
    subHeadline: string;
    luxuryGlow: string;
    vignette: string;
    border: string;
  };
  backgroundTreatment: BackgroundTreatment;
  hierarchy: {
    atmosphericColor: "60%";
    luxuryColor: "20%";
    readabilityColor: "12%";
    energyColor: "6%";
    shadowColor: "2%";
  };
  contrastNotes: string[];
};

export type BackgroundTreatment = {
  preserveOriginalImage: true;
  filter: string;
  imageFilter: {
    contrast: number;
    saturation: number;
    brightness: number;
  };
  overlayBlendMode: "soft-light" | "overlay";
  overlayOpacity: number;
  preserveWarmCore: boolean;
  avoidFullMultiply: true;
};

export type DirectedPaletteOptions = {
  style?: "minimalist" | string;
  allowMinimalist?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHex(hex: string, fallback = "#111114") {
  const clean = String(hex || "").replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((part) => part + part)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback;
  return `#${full.toUpperCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function rgbToHsl({ r, g, b }: Rgb) {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;
  const l = ((max + min) / 2) * 100;
  let h = 0;
  let s = 0;

  if (diff) {
    s = (diff / (1 - Math.abs(2 * (l / 100) - 1))) * 100;
    if (max === rn) h = ((gn - bn) / diff) % 6;
    else if (max === gn) h = (bn - rn) / diff + 2;
    else h = (rn - gn) / diff + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: clamp(s, 0, 100), l: clamp(l, 0, 100) };
}

export function hslToHex(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex({
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  });
}

function hslChroma(s: number, l: number) {
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  return clamp((1 - Math.abs(2 * light - 1)) * sat * 100, 0, 100);
}

function mixHex(a: string, b: string, amount: number) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const t = clamp(amount, 0, 1);
  return rgbToHex({
    r: ar.r + (br.r - ar.r) * t,
    g: ar.g + (br.g - ar.g) * t,
    b: ar.b + (br.b - ar.b) * t,
  });
}

export function darkenHex(hex: string, amountPercent: number) {
  return mixHex(hex, "#000000", clamp(amountPercent, 0, 100) / 100);
}

export function lightenHex(hex: string, amountPercent: number) {
  return mixHex(hex, "#FFFFFF", clamp(amountPercent, 0, 100) / 100);
}

function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  const channel = (value: number) => {
    const next = value / 255;
    return next <= 0.03928 ? next / 12.92 : Math.pow((next + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(alpha, 0, 1)})`;
}

export function hueDistance(a: number, b: number) {
  const diff = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return Math.min(180, diff);
}

export function getBackgroundTreatment(sceneType: string, dominantHue: number): BackgroundTreatment {
  const normalizedHue = ((dominantHue % 360) + 360) % 360;
  const isFireOrWarmStage =
    ((normalizedHue >= 5 && normalizedHue <= 45) ||
      /edm_tunnel|fire|flame|pyro|co2|stage/i.test(sceneType || "")) &&
    !/minimal|minimalist|clean|white/i.test(sceneType || "");

  if (isFireOrWarmStage) {
    return {
      preserveOriginalImage: true,
      filter: "contrast(1.09) saturate(1.14) brightness(0.98)",
      imageFilter: {
        contrast: 1.09,
        saturation: 1.14,
        brightness: 0.98,
      },
      overlayBlendMode: "soft-light",
      overlayOpacity: 0.225,
      preserveWarmCore: true,
      avoidFullMultiply: true,
    };
  }

  return {
    preserveOriginalImage: true,
    filter: "contrast(1.06) saturate(1.09) brightness(0.97)",
    imageFilter: {
      contrast: 1.06,
      saturation: 1.09,
      brightness: 0.97,
    },
    overlayBlendMode: "overlay",
    overlayOpacity: 0.19,
    preserveWarmCore: false,
    avoidFullMultiply: true,
  };
}

function lightnessDistance(a: Pick<DirectedPaletteColor, "l">, b: Pick<DirectedPaletteColor, "l">) {
  return Math.abs(a.l - b.l);
}

function withHsl(
  color: Pick<DirectedPaletteColor, "h" | "s" | "l" | "weight" | "generated">,
  h: number,
  s: number,
  l: number
): DirectedPaletteColor {
  const nextH = ((h % 360) + 360) % 360;
  const nextS = clamp(s, 0, 100);
  const nextL = clamp(l, 0, 100);
  return {
    h: nextH,
    s: nextS,
    l: nextL,
    chroma: hslChroma(nextS, nextL),
    hex: hslToHex(nextH, nextS, nextL),
    weight: color.weight,
    generated: true,
  };
}

export function rejectWashedOutColor(c: Pick<DirectedPaletteColor, "s" | "l" | "chroma">) {
  return (
    c.s < 35 ||
    c.chroma < 25 ||
    c.l > PALETTE_RULES.maxWashedOutLightness
  );
}

function isFlatColor(color: Pick<DirectedPaletteColor, "s" | "l" | "chroma">) {
  return rejectWashedOutColor(color) || color.chroma < PALETTE_RULES.minAccentChroma;
}

function dominantMoodScore(color: DirectedPaletteColor) {
  const weightScore = Math.log2(color.weight + 1) * 10;
  const saturationScore = color.s * 1.15;
  const depthScore = Math.max(0, 44 - color.l) * 1.25;
  const muddyPenalty = color.s < 18 && color.l > 18 ? 36 : 0;
  const palePenalty = color.l > 60 ? 42 : 0;
  return weightScore + saturationScore + depthScore - muddyPenalty - palePenalty;
}

function temperatureScore(color: Pick<DirectedPaletteColor, "h" | "s">) {
  if (color.s < 12) return 0;
  const warmDistance = Math.min(hueDistance(color.h, 38), hueDistance(color.h, 350));
  const coolDistance = Math.min(hueDistance(color.h, 205), hueDistance(color.h, 265));
  const raw = (coolDistance - warmDistance) / 180;
  return clamp(raw, -1, 1);
}

function temperatureVariance(a: DirectedPaletteColor, b: DirectedPaletteColor) {
  return Math.abs(temperatureScore(a) - temperatureScore(b));
}

function luxuryScore(color: DirectedPaletteColor, atmospheric: DirectedPaletteColor) {
  const champagneHue = hueDistance(color.h, 43);
  const warmScore = Math.max(0, 80 - champagneHue) * 1.4;
  const saturationScore = clamp(color.s, 18, 72) * 0.7;
  const readableScore = contrastRatio(color.hex, atmospheric.hex) * 12;
  const lightnessScore = Math.max(0, 78 - Math.abs(color.l - 66));
  const muddyPenalty = color.s < 20 || color.l < 34 ? 36 : 0;
  return warmScore + saturationScore + readableScore + lightnessScore - muddyPenalty;
}

function accentEnergyScore(color: DirectedPaletteColor, dominant: DirectedPaletteColor) {
  const weightScore = Math.log2(color.weight + 1) * 5;
  const saturationScore = color.s * 1.45;
  const contrastScore = contrastRatio(color.hex, dominant.hex) * 14;
  const hueScore = hueDistance(color.h, dominant.h) * 0.55;
  const washedPenalty = isFlatColor(color) ? 44 : 0;
  const paleNeutralPenalty = color.s < 18 && color.l > 70 ? 58 : 0;
  return weightScore + saturationScore + contrastScore + hueScore - washedPenalty - paleNeutralPenalty;
}

function pickLuxuryColor(colors: DirectedPaletteColor[], atmospheric: DirectedPaletteColor) {
  const sorted = [...colors].sort((a, b) => luxuryScore(b, atmospheric) - luxuryScore(a, atmospheric));
  return sorted.find(
    (color) =>
      color.hex !== atmospheric.hex &&
      color.l >= 42 &&
      color.l <= 82 &&
      color.s >= 20 &&
      contrastRatio(color.hex, atmospheric.hex) >= CINEMATIC_RULES.minHeadlineContrast
  );
}

function createLuxuryColor(atmospheric: DirectedPaletteColor) {
  const warmHue = atmospheric.h >= 18 && atmospheric.h <= 65 ? atmospheric.h : 43;
  return withHsl(atmospheric, warmHue, 74, 68);
}

function enrichLuxury(color: DirectedPaletteColor, atmospheric: DirectedPaletteColor) {
  let next = withHsl(
    color,
    color.h,
    clamp(color.s + 16, 58, 88),
    clamp(color.l + 4, 58, 76)
  );

  if (contrastRatio(next.hex, atmospheric.hex) < CINEMATIC_RULES.minHeadlineContrast) {
    next = withHsl(next, next.h, next.s, 76);
  }

  return next;
}

function readableAccentFromHue(
  h: number,
  dominant: DirectedPaletteColor,
  sourceSaturation = TARGET_ACCENT_SATURATION
): DirectedPaletteColor {
  const s = clamp(Math.max(sourceSaturation, TARGET_ACCENT_SATURATION), MIN_FINAL_ACCENT_SATURATION, 100);
  const lightnessOptions =
    dominant.l <= 42
      ? [58, 62, 66, 68, 72]
      : [20, 26, 14, 32, 38];
  let best = withHsl({ h, s, l: lightnessOptions[0], weight: 0, generated: true }, h, s, lightnessOptions[0]);
  let bestContrast = contrastRatio(best.hex, dominant.hex);

  for (const l of lightnessOptions) {
    const candidate = withHsl({ h, s, l, weight: 0, generated: true }, h, s, l);
    const contrast = contrastRatio(candidate.hex, dominant.hex);
    if (contrast >= MIN_CONTRAST_RATIO) return candidate;
    if (contrast > bestContrast) {
      best = candidate;
      bestContrast = contrast;
    }
  }

  return best;
}

function deepenDominantForAccent(
  dominant: DirectedPaletteColor,
  accent: DirectedPaletteColor
): DirectedPaletteColor {
  const lightnessOptions = [dominant.l, 28, 24, 20, PALETTE_RULES.minMoodDepth, 14, 10, 8];
  let best = dominant;
  let bestContrast = contrastRatio(accent.hex, dominant.hex);

  for (const l of lightnessOptions) {
    const candidate = withHsl(dominant, dominant.h, dominant.s, Math.min(dominant.l, l));
    const contrast = contrastRatio(accent.hex, candidate.hex);
    if (contrast >= PALETTE_RULES.minContrastRatio) return candidate;
    if (contrast > bestContrast) {
      best = candidate;
      bestContrast = contrast;
    }
  }

  return best;
}

export function boostFlyerColor(
  color: DirectedPaletteColor,
  role: "dominant" | "accent" | "support"
): DirectedPaletteColor {
  if (role === "dominant") {
    const richHue =
      color.h >= 22 && color.h <= 72 && color.s < 72
        ? 338
        : color.h >= 72 && color.h <= 125 && color.s < 58
        ? 168
        : color.h;
    return withHsl(
      color,
      richHue,
      clamp(color.s + 30, 58, 90),
      clamp(color.l - 30, 7, 24)
    );
  }

  if (role === "accent") {
    return withHsl(
      color,
      color.h,
      clamp(color.s + 25, 75, 100),
      clamp(color.l + 8, 48, 68)
    );
  }

  return withHsl(
    color,
    color.h,
    clamp(color.s - 10, 8, 35),
    color.l > 50 ? 92 : 14
  );
}

export function isTooSimilar(a: Pick<DirectedPaletteColor, "h" | "l">, b: Pick<DirectedPaletteColor, "h" | "l">) {
  return (
    hueDistance(a.h, b.h) < MIN_HUE_DISTANCE &&
    Math.abs(a.l - b.l) < MIN_LIGHTNESS_DISTANCE
  );
}

export function generateComplement(color: Pick<DirectedPaletteColor, "h" | "s" | "l">): DirectedPaletteColor {
  const h = (color.h + 180) % 360;
  const s = clamp(Math.max(color.s + 28, TARGET_ACCENT_SATURATION), MIN_FINAL_ACCENT_SATURATION, 100);
  const l = color.l > 55 ? 24 : 72;
  return {
    h,
    s,
    l,
    chroma: hslChroma(s, l),
    hex: hslToHex(h, s, l),
    weight: 0,
    generated: true,
  };
}

export function generateElectricComplement(color: Pick<DirectedPaletteColor, "h">): DirectedPaletteColor {
  const h = (color.h + 165) % 360;
  const s = 92;
  const l = 58;
  return {
    h,
    s,
    l,
    chroma: hslChroma(s, l),
    hex: hslToHex(h, s, l),
    weight: 0,
    generated: true,
    reason: "Generated because extracted palette was too flat.",
  };
}

function createEnergyColor(h: number, reason: string): DirectedPaletteColor {
  const hue = ((h % 360) + 360) % 360;
  const s = 92;
  const l = 58;
  return {
    h: hue,
    s,
    l,
    chroma: hslChroma(s, l),
    hex: hslToHex(hue, s, l),
    weight: 0,
    generated: true,
    reason,
  };
}

function generateOpposingTemperatureAccent(
  atmospheric: DirectedPaletteColor,
  luxury: DirectedPaletteColor
): DirectedPaletteColor {
  const warmCast = temperatureScore(atmospheric) + temperatureScore(luxury) >= 0;
  const preferredHues = warmCast ? [250, 196, 344] : [344, 43, 196];
  let best = createEnergyColor(preferredHues[0], "Generated opposing temperature accent for cinematic tension.");
  let bestScore = -Infinity;

  for (const hue of preferredHues) {
    const candidate = createEnergyColor(hue, "Generated opposing temperature accent for cinematic tension.");
    const score =
      hueDistance(candidate.h, atmospheric.h) +
      hueDistance(candidate.h, luxury.h) +
      contrastRatio(candidate.hex, atmospheric.hex) * 18 +
      temperatureVariance(candidate, luxury) * 40;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function ensureEnergyContrast(
  energy: DirectedPaletteColor,
  atmospheric: DirectedPaletteColor,
  luxury: DirectedPaletteColor
) {
  const blendsIntoAtmosphere =
    hueDistance(energy.h, atmospheric.h) < 18 &&
    lightnessDistance(energy, atmospheric) < 22;
  const blendsIntoLuxury =
    hueDistance(energy.h, luxury.h) < CINEMATIC_RULES.minHueSeparationAccent ||
    lightnessDistance(energy, luxury) < 16;
  const tooWeak =
    energy.s < PALETTE_RULES.minAccentSaturation ||
    energy.chroma < PALETTE_RULES.minAccentChroma ||
    contrastRatio(energy.hex, atmospheric.hex) < CINEMATIC_RULES.minHeadlineContrast;
  const tooWarmMatched = temperatureVariance(energy, luxury) < CINEMATIC_RULES.minTempVariance;

  if (blendsIntoAtmosphere || blendsIntoLuxury || tooWeak || tooWarmMatched) {
    return generateOpposingTemperatureAccent(atmospheric, luxury);
  }

  return boostFlyerColor(energy, "accent");
}

function createShadowColor(atmospheric: DirectedPaletteColor) {
  return withHsl(atmospheric, atmospheric.h, clamp(atmospheric.s + 6, 24, 72), 5);
}

function ensureReadable(readable: DirectedPaletteColor, atmospheric: DirectedPaletteColor) {
  let next = withHsl(
    readable,
    readable.h,
    clamp(readable.s - 10, 6, 24),
    readable.l > 50 ? 92 : 14
  );

  if (next.l > 50) {
    next.hex = lightenHex(next.hex, 20);
    const hsl = rgbToHsl(hexToRgb(next.hex));
    next = {
      ...next,
      h: hsl.h,
      s: hsl.s,
      l: hsl.l,
      chroma: hslChroma(hsl.s, hsl.l),
    };
  }

  if (contrastRatio(next.hex, atmospheric.hex) < CINEMATIC_RULES.minSmallTextContrast) {
    next = withHsl(atmospheric, atmospheric.h, 9, atmospheric.l <= 42 ? 94 : 10);
  }

  return next;
}

function generateReadableSupport(dominant: DirectedPaletteColor): DirectedPaletteColor {
  const h = dominant.h;
  const s = clamp(dominant.s * 0.18, 5, 18);
  const l = dominant.l < 44 ? 92 : 12;
  return {
    h,
    s,
    l,
    chroma: hslChroma(s, l),
    hex: hslToHex(h, s, l),
    weight: 0,
    generated: true,
  };
}

export function analyzeSourceColors(sourceColors: DirectedPaletteInput[]): DirectedPaletteColor[] {
  return sourceColors
    .map((input, index) => {
      const objectInput = typeof input === "string" ? undefined : input;
      let hex = "";
      let weight = Math.max(1, sourceColors.length - index);

      if (typeof input === "string") {
        hex = normalizeHex(input);
      } else if (typeof input?.hex === "string") {
        hex = normalizeHex(input.hex);
        weight = Number.isFinite(input.weight) ? Math.max(0, Number(input.weight)) : weight;
      } else if (
        Number.isFinite(input?.r) &&
        Number.isFinite(input?.g) &&
        Number.isFinite(input?.b)
      ) {
        hex = rgbToHex({
          r: Number(input.r),
          g: Number(input.g),
          b: Number(input.b),
        });
        weight = Number.isFinite(input.weight) ? Math.max(0, Number(input.weight)) : weight;
      }

      if (!hex) return null;
      const hsl = rgbToHsl(hexToRgb(hex));
      const inputHue = objectInput?.h;
      const inputSaturation = objectInput?.s;
      const inputLightness = objectInput?.l;
      const nextS = Number.isFinite(inputSaturation)
        ? Number(inputSaturation) > 1
          ? clamp(Number(inputSaturation), 0, 100)
          : clamp(Number(inputSaturation) * 100, 0, 100)
        : hsl.s;
      const nextL = Number.isFinite(inputLightness)
        ? Number(inputLightness) > 1
          ? clamp(Number(inputLightness), 0, 100)
          : clamp(Number(inputLightness) * 100, 0, 100)
        : hsl.l;
      const inputChroma = objectInput?.chroma;
      return {
        hex,
        h: Number.isFinite(inputHue) ? Number(inputHue) : hsl.h,
        s: nextS,
        l: nextL,
        chroma: Number.isFinite(inputChroma)
          ? Number(inputChroma) > 1
            ? clamp(Number(inputChroma), 0, 100)
            : clamp(Number(inputChroma) * 100, 0, 100)
          : hslChroma(nextS, nextL),
        weight,
      };
    })
    .filter((color): color is DirectedPaletteColor => !!color);
}

function pickDominantMoodColor(colors: DirectedPaletteColor[]) {
  const sorted = [...colors].sort((a, b) => dominantMoodScore(b) - dominantMoodScore(a));
  const colorful = sorted.find(
    (color) =>
      color.s >= MIN_COLORFUL_DOMINANT_SATURATION &&
      color.l >= 8 &&
      color.l <= 62
  );
  const dominant = colorful || [...colors].sort((a, b) => b.weight - a.weight)[0] || {
    hex: "#111114",
    h: 0,
    s: 0,
    l: 7,
    chroma: 0,
    weight: 1,
  };
  return dominant;
}

function pickHighContrastColor(colors: DirectedPaletteColor[], dominant: DirectedPaletteColor) {
  return [...colors]
    .filter(
      (color) =>
        color.s >= MIN_EXTRACTED_ACCENT_SATURATION ||
        color.chroma >= PALETTE_RULES.minAccentChroma
    )
    .sort((a, b) => accentEnergyScore(b, dominant) - accentEnergyScore(a, dominant))
    .find(
      (color) =>
        color.hex !== dominant.hex &&
        !isTooSimilar(color, dominant)
    );
}

function pickNeutralOrDeepColor(colors: DirectedPaletteColor[], dominant: DirectedPaletteColor, accent: DirectedPaletteColor) {
  const sorted = [...colors].sort((a, b) => b.weight - a.weight);
  const preferredReadable = sorted.find(
    (color) =>
      color.hex !== dominant.hex &&
      color.hex !== accent.hex &&
      color.s <= 24 &&
      (dominant.l <= 42 ? color.l >= 78 : color.l <= 18) &&
      contrastRatio(color.hex, dominant.hex) >= MIN_CONTRAST_RATIO
  );
  if (preferredReadable) return preferredReadable;

  const readableNeutral = sorted.find(
    (color) =>
      color.hex !== dominant.hex &&
      color.hex !== accent.hex &&
      color.s <= 28 &&
      (dominant.l <= 42 ? color.l >= 70 : color.l <= 30) &&
      contrastRatio(color.hex, dominant.hex) >= MIN_CONTRAST_RATIO
  );
  if (readableNeutral) return readableNeutral;

  const deepNeutral = sorted.find(
    (color) =>
      color.hex !== dominant.hex &&
      color.hex !== accent.hex &&
      color.l < 28 &&
      color.s <= 42
  );
  if (deepNeutral && contrastRatio(deepNeutral.hex, dominant.hex) >= MIN_CONTRAST_RATIO) {
    return deepNeutral;
  }

  return generateReadableSupport(dominant);
}

export function createCinematicColorCast(
  extractedColors: DirectedPaletteColor[],
  options: DirectedPaletteOptions = {}
) {
  const allowMinimalist = options.allowMinimalist || options.style === "minimalist";
  const sorted = [...extractedColors].sort((a, b) => b.weight - a.weight);
  const usable = allowMinimalist ? sorted : sorted.filter((color) => !rejectWashedOutColor(color));
  const base = usable.length ? usable : sorted;

  let atmosphericColor = pickDominantMoodColor(base);
  let luxuryColor = pickLuxuryColor(base, atmosphericColor) || createLuxuryColor(atmosphericColor);
  let readabilityColor = pickNeutralOrDeepColor(base, atmosphericColor, luxuryColor);
  let energyColor = pickHighContrastColor(base, atmosphericColor) || generateOpposingTemperatureAccent(atmosphericColor, luxuryColor);

  if (!allowMinimalist) {
    atmosphericColor = boostFlyerColor(atmosphericColor, "dominant");
    luxuryColor = enrichLuxury(luxuryColor, atmosphericColor);
    readabilityColor = ensureReadable(readabilityColor, atmosphericColor);
    energyColor = ensureEnergyContrast(energyColor, atmosphericColor, luxuryColor);
  }

  if (
    hueDistance(luxuryColor.h, atmosphericColor.h) < 18 &&
    lightnessDistance(luxuryColor, atmosphericColor) < 22
  ) {
    energyColor = generateOpposingTemperatureAccent(atmosphericColor, luxuryColor);
  }

  if (temperatureVariance(energyColor, luxuryColor) < CINEMATIC_RULES.minTempVariance) {
    energyColor = generateOpposingTemperatureAccent(atmosphericColor, luxuryColor);
  }

  if (contrastRatio(energyColor.hex, atmosphericColor.hex) < CINEMATIC_RULES.minHeadlineContrast) {
    const deeperAtmosphere = deepenDominantForAccent(atmosphericColor, energyColor);
    if (contrastRatio(energyColor.hex, deeperAtmosphere.hex) >= CINEMATIC_RULES.minHeadlineContrast) {
      atmosphericColor = deeperAtmosphere;
    } else {
      energyColor = readableAccentFromHue(energyColor.h, atmosphericColor, TARGET_ACCENT_SATURATION);
    }
  }

  if (contrastRatio(readabilityColor.hex, atmosphericColor.hex) < CINEMATIC_RULES.minSmallTextContrast) {
    readabilityColor = ensureReadable(readabilityColor, atmosphericColor);
  }

  const shadowColor = createShadowColor(atmosphericColor);

  return {
    atmosphericColor: {
      ...atmosphericColor,
      role: "atmospheric",
      usage: "background cast / overlays",
      percentage: 60,
    } as DirectedPaletteColor,
    luxuryColor: {
      ...luxuryColor,
      role: "luxury",
      usage: "premium highlights / headline primary / champagne glow",
      percentage: 20,
    } as DirectedPaletteColor,
    readabilityColor: {
      ...readabilityColor,
      role: "readability",
      usage: "body text / venue / information",
      percentage: 12,
    } as DirectedPaletteColor,
    energyColor: {
      ...energyColor,
      role: "energy",
      usage: "subheadline / icons / glow / CTA tension",
      percentage: 6,
    } as DirectedPaletteColor,
    shadowColor: {
      ...shadowColor,
      role: "shadow",
      usage: "vignette / depth",
      percentage: 2,
    } as DirectedPaletteColor,
    rejectedCount: sorted.length - usable.length,
    allWashedOut: sorted.length > 0 && usable.length === 0,
  };
}

export function directFlyerPalette(
  extractedColors: DirectedPaletteColor[],
  options: DirectedPaletteOptions = {}
): DirectedPalette {
  const sourceDominant = [...extractedColors].sort((a, b) => b.weight - a.weight)[0];
  const warmStageColor = [...extractedColors]
    .sort((a, b) => b.weight - a.weight)
    .find((color) => color.h >= 5 && color.h <= 45 && color.s >= 35 && color.l >= 12);
  const cast = createCinematicColorCast(extractedColors, options);
  const backgroundTreatment = getBackgroundTreatment(
    options.style || "",
    warmStageColor?.h ?? sourceDominant?.h ?? cast.atmosphericColor.h
  );
  const contrastNotes: string[] = [];

  if (cast.rejectedCount > 0) {
    contrastNotes.push(
      `Rejected ${cast.rejectedCount} washed-out extracted color${cast.rejectedCount === 1 ? "" : "s"} before directing the cinematic palette.`
    );
  }

  if (cast.allWashedOut) {
    contrastNotes.push("All extracted colors were washed out; transformed them into a flyer-grade cinematic color cast.");
  }

  if (
    hueDistance(cast.luxuryColor.h, cast.atmosphericColor.h) < 18 &&
    lightnessDistance(cast.luxuryColor, cast.atmosphericColor) < 22
  ) {
    contrastNotes.push("Injected energy color because luxury text was too close to the atmospheric background.");
  }

  if (temperatureVariance(cast.energyColor, cast.luxuryColor) >= CINEMATIC_RULES.minTempVariance) {
    contrastNotes.push("Added opposing-temperature energy color for cinematic tension.");
  }

  const directedDominant = {
    ...cast.atmosphericColor,
    role: "dominant",
    usage: "background / atmosphere / large shapes",
    percentage: 65,
  } as DirectedPalette["dominant"];
  const directedAccent = {
    ...cast.energyColor,
    role: "accent",
    usage: "subheadline / icons / glow / CTA",
    percentage: 25,
  } as DirectedPalette["accent"];
  const directedSupport = {
    ...cast.readabilityColor,
    role: "support",
    usage: "small text / shadows / depth",
    percentage: 10,
  } as DirectedPalette["support"];

  if (!contrastNotes.length) {
    contrastNotes.push("Extracted palette passed cinematic color-cast checks with depth, readability, and energy separation.");
  }

  return {
    dominant: directedDominant,
    accent: directedAccent,
    support: directedSupport,
    atmosphericColor: cast.atmosphericColor,
    luxuryColor: cast.luxuryColor,
    readabilityColor: cast.readabilityColor,
    energyColor: cast.energyColor,
    shadowColor: cast.shadowColor,
    contrastNotes,
    usageMap: {
      background: directedDominant.hex,
      headline: cast.luxuryColor.hex,
      bodyText: directedSupport.hex,
      smallText: directedSupport.hex,
      smallTextOpacity: 0.92,
      icons: directedAccent.hex,
      glow: hexToRgba(directedAccent.hex, 0.5),
      overlays: directedDominant.hex,
      shadow: hexToRgba(cast.shadowColor.hex, 0.72),
      shadows: hexToRgba(cast.shadowColor.hex, 0.72),
      backgroundOverlay: backgroundTreatment.preserveWarmCore
        ? "rgba(255,91,18,0.17)"
        : hexToRgba(cast.atmosphericColor.hex, 0.19),
      backgroundBlendMode: backgroundTreatment.overlayBlendMode,
      headlinePrimary: cast.luxuryColor.hex,
      headlineHighlight: cast.readabilityColor.hex,
      subHeadline: cast.energyColor.hex,
      luxuryGlow: hexToRgba(cast.luxuryColor.hex, 0.38),
      vignette: hexToRgba(cast.shadowColor.hex, 0.75),
      border: hexToRgba(cast.luxuryColor.hex, 0.22),
    },
    backgroundTreatment,
    hierarchy: {
      atmosphericColor: "60%",
      luxuryColor: "20%",
      readabilityColor: "12%",
      energyColor: "6%",
      shadowColor: "2%",
    },
  };
}

export function directPalette(
  colors: DirectedPaletteColor[],
  options: DirectedPaletteOptions = {}
): DirectedPalette {
  return directFlyerPalette(colors, options);
}

export function createDirectedPalette(
  sourceColors: DirectedPaletteInput[],
  options: DirectedPaletteOptions = {}
): DirectedPalette {
  const palette = analyzeSourceColors(sourceColors);
  return directPalette(palette, options);
}

export function directedPaletteToFlyerPalette(sourceColors: DirectedPaletteInput[]) {
  const directed = createDirectedPalette(sourceColors);
  return {
    bgFrom: directed.atmosphericColor.hex,
    bgTo: directed.shadowColor.hex,
    secondary: directed.atmosphericColor.hex,
    primary: directed.luxuryColor.hex,
    accent: directed.energyColor.hex,
    neutral: directed.readabilityColor.hex,
    directed,
  };
}
