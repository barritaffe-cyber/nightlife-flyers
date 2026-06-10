export const HEADLINE_DASH_STROKE_DEFAULTS = {
  colors: ["#FF2E63", "#FFB000", "#F8F4E3", "#21E6C1", "#08AEEA"],
  dash: 84,
  gap: 14,
  strokeWidth: 3.4,
  frame: 0,
  glow: 18,
  shadow: 0.32,
  roundCaps: true,
} as const;

export const STROKE_HEADLINE_PRESET = {
  textStyle: {
    family: "Bebas Neue",
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: false,
    tracking: -0.035,

    gradient: true,
    color: "#F7F9FA",
    gradFrom: HEADLINE_DASH_STROKE_DEFAULTS.colors[2],
    gradTo: HEADLINE_DASH_STROKE_DEFAULTS.colors[3],

    strokeWidth: 0,
    strokeColor: HEADLINE_DASH_STROKE_DEFAULTS.colors[0],

    glow: 6,
    shadowEnabled: true,
    shadowColor: "rgba(0,0,0,0.42)",
    shadowBlur: 18,
    shadowOffsetX: 0,
    shadowOffsetY: 8,
  },

  stroke: {
    enabled: true,
    paletteLinked: true,

    colors: HEADLINE_DASH_STROKE_DEFAULTS.colors,
    dash: HEADLINE_DASH_STROKE_DEFAULTS.dash,
    gap: HEADLINE_DASH_STROKE_DEFAULTS.gap,
    strokeWidth: HEADLINE_DASH_STROKE_DEFAULTS.strokeWidth,
    frame: HEADLINE_DASH_STROKE_DEFAULTS.frame,

    glow: HEADLINE_DASH_STROKE_DEFAULTS.glow,
    shadow: HEADLINE_DASH_STROKE_DEFAULTS.shadow,
    roundCaps: HEADLINE_DASH_STROKE_DEFAULTS.roundCaps,
  },

  transform: {
    skew: 0,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 38,
    extrudeDistance: 0,
    extrudeColor: "#050812",

    align: "center",
    lineHeight: 0.9,
    mobileStyleFocus: "dash",
  },
} as const;

export type StrokePaletteSource = {
  bgFrom?: string;
  bgTo?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
};

export type StrokePaletteResolvers = {
  normalizeGlassGlowColor: (value: string, fallback: string) => string;
};

const uniquePremiumFallback = HEADLINE_DASH_STROKE_DEFAULTS.colors;

export function resolveStrokePaletteColors(
  source: Partial<StrokePaletteSource> | null | undefined,
  resolvers: StrokePaletteResolvers
) {
  const s = source || {};

  const candidates = [
    s.accent,
    s.primary,
    s.neutral,
    s.secondary,
    s.bgTo,
  ];

  return uniquePremiumFallback.map((fallback, index) => {
    const raw = candidates[index] || fallback;
    return resolvers.normalizeGlassGlowColor(String(raw), fallback).toUpperCase();
  });
}

export type StrokeRgb = { r: number; g: number; b: number };

export type StrokeFrameResolvers = {
  normalizePaletteHexString: (value: string, fallback: string) => string;
  hexToRgb: (hex: string | undefined | null) => StrokeRgb;
  mixRgb: (a: StrokeRgb, b: StrokeRgb, t: number) => StrokeRgb;
  rgbToHex: (rgb: StrokeRgb) => string;
};

const clamp01 = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

export function resolveStrokeFrameColors(
  colors: readonly string[] = HEADLINE_DASH_STROKE_DEFAULTS.colors,
  frame: number,
  resolvers: StrokeFrameResolvers
) {
  const normalized = HEADLINE_DASH_STROKE_DEFAULTS.colors.map((fallback, index) =>
    resolvers.normalizePaletteHexString(String(colors[index] || ""), fallback).toUpperCase()
  );

  const count = normalized.length;
  const f = clamp01(frame);

  const cycle = f * count;
  const step = Math.floor(cycle);
  const blend = cycle - step;

  return normalized.map((_, index) => {
    const from = normalized[(index + step) % count];
    const to = normalized[(index + step + 1) % count];

    return resolvers
      .rgbToHex(
        resolvers.mixRgb(
          resolvers.hexToRgb(from),
          resolvers.hexToRgb(to),
          blend
        )
      )
      .toUpperCase();
  });
}

export function buildStrokeHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx,
  colors: readonly string[] = HEADLINE_DASH_STROKE_DEFAULTS.colors
) {
  const strokeColors = HEADLINE_DASH_STROKE_DEFAULTS.colors.map(
    (fallback, index) => colors[index] || fallback
  );

  return {
    ...STROKE_HEADLINE_PRESET,

    textFx: {
      ...textFx,
      ...STROKE_HEADLINE_PRESET.textFx,

      gradFrom: strokeColors[2],
      gradTo: strokeColors[3],
      strokeColor: strokeColors[0],
    },

    stroke: {
      ...STROKE_HEADLINE_PRESET.stroke,
      colors: strokeColors,
    },
  };
}
