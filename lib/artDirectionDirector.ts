import { createDirectedPalette, darkenHex } from "./colorPaletteDirector";

export type CreativePalette = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
};

export type CreativeDirection = {
  dominantColors: string[];
  secondaryColors: string[];
  skinToneType: "deep" | "medium" | "light" | "unknown";
  contrastLevel: "low" | "medium" | "high";
  brightness: "dark" | "balanced" | "bright";
  mood: "luxury" | "neon" | "fashion" | "warm" | "cool" | "moody";
  luxuryLevel: "standard" | "premium" | "luxury";
  genre: "afrobeat" | "latin" | "hip-hop" | "rnb" | "edm" | "fashion" | "nightlife";
  fashionStyle: "all-white" | "black-luxury" | "chrome" | "color-pop" | "streetwear" | "club-glam";
  lightingDirection: "left" | "right" | "center" | "mixed";
  visualTemperature: "warm" | "neutral" | "cool";
  palette: CreativePalette;
};

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

const DIRECTOR_CACHE = new Map<string, CreativeDirection>();

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function toHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const clean = String(hex || "").replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((x) => x + x)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16) || 0,
    g: Number.parseInt(full.slice(2, 4), 16) || 0,
    b: Number.parseInt(full.slice(4, 6), 16) || 0,
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

function colorLuma(rgb: Rgb) {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

function mix(a: string, b: string, amount: number) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return toHex({
    r: ar.r + (br.r - ar.r) * amount,
    g: ar.g + (br.g - ar.g) * amount,
    b: ar.b + (br.b - ar.b) * amount,
  });
}

export function tintHueForColor(hex: string) {
  return Math.round(rgbToHsl(hexToRgb(hex)).h - 38);
}

export function colorName(hex: string) {
  const hsl = rgbToHsl(hexToRgb(hex));
  if (hsl.l < 0.08) return "near-black";
  if (hsl.s < 0.1 && hsl.l > 0.85) return "white";
  if (hsl.s < 0.12) return hsl.l > 0.55 ? "silver gray" : "charcoal gray";
  const h = hsl.h;
  if (h >= 340 || h < 14) return "red";
  if (h < 38) return "orange";
  if (h < 55) return "gold";
  if (h < 76) return "yellow";
  if (h < 150) return "green";
  if (h < 178) return "teal";
  if (h < 205) return "cyan";
  if (h < 245) return "blue";
  if (h < 285) return "violet";
  if (h < 330) return "magenta";
  return "wine red";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load subject for art direction"));
    img.src = src;
  });
}

function quantize(rgb: Rgb) {
  return {
    r: Math.round(rgb.r / 24) * 24,
    g: Math.round(rgb.g / 24) * 24,
    b: Math.round(rgb.b / 24) * 24,
  };
}

function choosePalette(colors: Rgb[], lumaMean: number, lumaStd: number, satMean: number): CreativePalette {
  const brightNeutralRatio = colors.filter((rgb) => {
    const hsl = rgbToHsl(rgb);
    return hsl.s < 0.16 && hsl.l > 0.72;
  }).length / Math.max(colors.length, 1);

  if (brightNeutralRatio > 0.42 && satMean < 0.24 && lumaStd < 44) {
    return {
      primary: lumaMean > 168 ? "#F4C85A" : "#FF2FB3",
      secondary: lumaMean > 168 ? "#1B0710" : "#08090D",
      accent: lumaMean > 168 ? "#6E56FF" : "#33F4FF",
      neutral: "#F7EDE2",
    };
  }

  const directed = createDirectedPalette(
    colors.map((rgb, index) => ({
      hex: toHex(rgb),
      weight: Math.max(1, colors.length - index),
    }))
  );
  const atmospheric = directed.atmosphericColor ?? directed.dominant;
  const dominant =
    atmospheric.l > 60
      ? darkenHex(atmospheric.hex, 78)
      : atmospheric.hex;

  return {
    primary: directed.luxuryColor?.hex || directed.support.hex,
    secondary: dominant,
    accent: directed.energyColor?.hex || directed.accent.hex,
    neutral: directed.readabilityColor?.hex || directed.support.hex,
  };
}

export async function analyzeSubjectCreativeDirection(src: string): Promise<CreativeDirection> {
  const key = String(src || "").trim();
  const cached = DIRECTOR_CACHE.get(key);
  if (cached) return cached;

  if (typeof window === "undefined" || typeof document === "undefined" || !key) {
    return fallbackCreativeDirection();
  }

  try {
    const img = await loadImage(key);
    const maxSide = 220;
    const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
    const w = ratio >= 1 ? maxSide : Math.max(1, Math.round(maxSide * ratio));
    const h = ratio >= 1 ? Math.max(1, Math.round(maxSide / ratio)) : maxSide;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallbackCreativeDirection();
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const buckets = new Map<string, { rgb: Rgb; count: number }>();
    let count = 0;
    let lumaSum = 0;
    let lumaSq = 0;
    let satSum = 0;
    let warmCount = 0;
    let coolCount = 0;
    let leftLuma = 0;
    let rightLuma = 0;
    let leftCount = 0;
    let rightCount = 0;
    let skinLuma = 0;
    let skinCount = 0;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const a = data[i + 3];
        if (a < 32) continue;
        const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
        const hsl = rgbToHsl(rgb);
        const luma = colorLuma(rgb);
        if (luma < 10 || luma > 248) continue;
        count += 1;
        lumaSum += luma;
        lumaSq += luma * luma;
        satSum += hsl.s;
        if (hsl.h < 70 || hsl.h > 330) warmCount += 1;
        if (hsl.h >= 160 && hsl.h <= 260) coolCount += 1;
        if (x < w / 2) {
          leftLuma += luma;
          leftCount += 1;
        } else {
          rightLuma += luma;
          rightCount += 1;
        }
        if (hsl.h >= 8 && hsl.h <= 52 && hsl.s >= 0.16 && hsl.s <= 0.72 && hsl.l >= 0.18 && hsl.l <= 0.78) {
          skinLuma += luma;
          skinCount += 1;
        }
        const q = quantize(rgb);
        const bucketKey = `${q.r},${q.g},${q.b}`;
        const prev = buckets.get(bucketKey);
        buckets.set(bucketKey, {
          rgb: prev
            ? {
                r: (prev.rgb.r * prev.count + rgb.r) / (prev.count + 1),
                g: (prev.rgb.g * prev.count + rgb.g) / (prev.count + 1),
                b: (prev.rgb.b * prev.count + rgb.b) / (prev.count + 1),
              }
            : rgb,
          count: (prev?.count || 0) + 1,
        });
      }
    }

    const safeCount = Math.max(1, count);
    const lumaMean = lumaSum / safeCount;
    const satMean = satSum / safeCount;
    const lumaStd = Math.sqrt(Math.max(0, lumaSq / safeCount - lumaMean * lumaMean));
    const sortedColors = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 16)
      .map((item) => item.rgb);
    const palette = choosePalette(sortedColors, lumaMean, lumaStd, satMean);
    const primaryHsl = rgbToHsl(hexToRgb(palette.primary));
    const allWhite = palette.primary === "#FFFFFF";
    const visualTemperature =
      warmCount > coolCount * 1.18 ? "warm" : coolCount > warmCount * 1.18 ? "cool" : "neutral";
    const contrastLevel = lumaStd > 58 ? "high" : lumaStd > 34 ? "medium" : "low";
    const brightness = lumaMean > 158 ? "bright" : lumaMean < 86 ? "dark" : "balanced";
    const luxuryLevel = allWhite || primaryHsl.h < 58 || satMean < 0.28 ? "luxury" : contrastLevel === "high" ? "premium" : "standard";
    const mood =
      allWhite ? "fashion" :
      primaryHsl.h >= 170 && primaryHsl.h <= 315 && satMean > 0.32 ? "neon" :
      luxuryLevel === "luxury" ? "luxury" :
      visualTemperature === "warm" ? "warm" :
      visualTemperature === "cool" ? "cool" :
      brightness === "dark" ? "moody" : "fashion";
    const fashionStyle =
      allWhite ? "all-white" :
      satMean < 0.2 ? "black-luxury" :
      primaryHsl.h >= 190 && primaryHsl.h <= 285 ? "chrome" :
      satMean > 0.48 ? "color-pop" :
      brightness === "dark" ? "streetwear" : "club-glam";
    const genre =
      mood === "neon" ? "edm" :
      visualTemperature === "warm" && primaryHsl.h < 58 ? "afrobeat" :
      primaryHsl.h < 22 || primaryHsl.h > 330 ? "latin" :
      fashionStyle === "streetwear" ? "hip-hop" :
      luxuryLevel === "luxury" ? "rnb" : "nightlife";
    const skinToneType =
      skinCount < 8 ? "unknown" : skinLuma / skinCount < 92 ? "deep" : skinLuma / skinCount < 150 ? "medium" : "light";
    const leftAvg = leftLuma / Math.max(1, leftCount);
    const rightAvg = rightLuma / Math.max(1, rightCount);
    const lightingDirection =
      Math.abs(leftAvg - rightAvg) < 10 ? "center" : leftAvg > rightAvg ? "left" : "right";

    const direction: CreativeDirection = {
      dominantColors: sortedColors.slice(0, 5).map(toHex),
      secondaryColors: sortedColors.slice(5, 10).map(toHex),
      skinToneType,
      contrastLevel,
      brightness,
      mood,
      luxuryLevel,
      genre,
      fashionStyle,
      lightingDirection,
      visualTemperature,
      palette,
    };
    DIRECTOR_CACHE.set(key, direction);
    return direction;
  } catch {
    return fallbackCreativeDirection();
  }
}

export function fallbackCreativeDirection(): CreativeDirection {
  return {
    dominantColors: ["#F4F1EA", "#101014", "#18F0C8"],
    secondaryColors: ["#8A1E2D", "#D4A537"],
    skinToneType: "unknown",
    contrastLevel: "high",
    brightness: "dark",
    mood: "luxury",
    luxuryLevel: "premium",
    genre: "nightlife",
    fashionStyle: "club-glam",
    lightingDirection: "center",
    visualTemperature: "warm",
    palette: {
      primary: "#D4A537",
      secondary: "#07080C",
      accent: "#6E56FF",
      neutral: "#F7EDE2",
    },
  };
}

export function buildDirectedBackgroundPrompt(direction: CreativeDirection, format: "square" | "story") {
  const { palette } = direction;
  const base = colorName(palette.secondary);
  const accent = colorName(palette.accent);
  const support = colorName(palette.neutral);
  const formatRule =
    format === "story"
      ? "vertical 9:16 event flyer background plate"
      : "square 1:1 event flyer background plate";

  return [
    `Create a premium ${formatRule}.`,
    `Art direction is driven by the subject: ${direction.mood} mood, ${direction.genre} genre, ${direction.fashionStyle} fashion language, ${direction.visualTemperature} visual temperature, ${direction.contrastLevel} contrast.`,
    "Do not create washed-out palettes. This is for nightlife, luxury, club, and event flyers; colors must feel alive, premium, and high-contrast.",
    "Avoid pale, dusty, gray, beige, faded, or low-saturation palettes. If extracted image colors are muted, intensify them; if all extracted colors are similar, create a complementary accent.",
    "Background color must be rich and saturated, never smoky beige or weak gray. Use deep cinematic atmospheric color with visible color density, strong shadow depth, and controlled electric bloom.",
    `Use a cinematic color cast, not matching colors: 60% ${base} atmospheric color for background and overlays; 20% ${colorName(palette.primary)} luxury color for premium headline highlights; 12% ${support} readability color for body text and venue; 6% ${accent} energy color for subheadline, icons, glow, CTA, and date; 2% near-black shadow for vignette and depth.`,
    "Use warm/cool temperature contrast when the palette is too warm or same-tone. The palette should feel cinematic, expensive, bold, and flyer-ready.",
    "Keep the center clean and open for a cutout portrait; do not place objects in the subject area.",
    "Keep left and right side lanes darker for typography and metadata readability.",
    "Use cinematic fog diffusion, layered haze, subtle premium grain, soft glow falloff, reflective luxury club atmosphere, and editorial high-contrast lighting.",
    "Background only: no people, no faces, no bodies, no silhouettes, no text, no logos, no signage, no watermark, no foreground props.",
  ].join(" ");
}

export function lighten(hex: string, amount: number) {
  return mix(hex, "#FFFFFF", amount);
}

export function darken(hex: string, amount: number) {
  return mix(hex, "#000000", amount);
}
