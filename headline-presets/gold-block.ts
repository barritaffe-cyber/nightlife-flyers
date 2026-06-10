export const HEADLINE_GOLD_BLOCK_DEFAULTS = {
  lightColor: "#FFF3A6",
  midColor: "#F3B11C",
  darkColor: "#7A3604",

  highlightColor: "#FFFFFF",
  amberColor: "#FFCF3A",
  burnColor: "#3A1400",

  strokeColor: "#050505",
  strokeWidth: 14,

  bevel: 0.72,
  shine: 0.58,
  texture: 0.72,
  roughness: 0.46,
  shadow: 0.62,
} as const;

export const GOLD_BLOCK_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: false,
    tracking: -0.045,

    gradient: true,
    color: HEADLINE_GOLD_BLOCK_DEFAULTS.lightColor,
    gradFrom: HEADLINE_GOLD_BLOCK_DEFAULTS.highlightColor,
    gradMid: HEADLINE_GOLD_BLOCK_DEFAULTS.midColor,
    gradTo: HEADLINE_GOLD_BLOCK_DEFAULTS.darkColor,

    strokeWidth: 0,
    strokeColor: HEADLINE_GOLD_BLOCK_DEFAULTS.strokeColor,

    glow: 0,
    shadowEnabled: false,
  },

  goldBlock: {
    enabled: true,
    paletteLinked: true,

    lightColor: HEADLINE_GOLD_BLOCK_DEFAULTS.lightColor,
    midColor: HEADLINE_GOLD_BLOCK_DEFAULTS.midColor,
    darkColor: HEADLINE_GOLD_BLOCK_DEFAULTS.darkColor,

    highlightColor: HEADLINE_GOLD_BLOCK_DEFAULTS.highlightColor,
    amberColor: HEADLINE_GOLD_BLOCK_DEFAULTS.amberColor,
    burnColor: HEADLINE_GOLD_BLOCK_DEFAULTS.burnColor,

    strokeColor: HEADLINE_GOLD_BLOCK_DEFAULTS.strokeColor,
    strokeWidth: HEADLINE_GOLD_BLOCK_DEFAULTS.strokeWidth,

    bevel: HEADLINE_GOLD_BLOCK_DEFAULTS.bevel,
    shine: HEADLINE_GOLD_BLOCK_DEFAULTS.shine,
    texture: HEADLINE_GOLD_BLOCK_DEFAULTS.texture,
    roughness: HEADLINE_GOLD_BLOCK_DEFAULTS.roughness,
    shadow: HEADLINE_GOLD_BLOCK_DEFAULTS.shadow,

    layers: {
      backShadow: {
        enabled: true,
        color: "rgba(0,0,0,0.72)",
        blur: 14,
        offsetX: 0,
        offsetY: 8,
        opacity: 0.72,
      },

      blockStroke: {
        enabled: true,
        color: "#050505",
        width: 14,
        opacity: 1,
      },

      outerGoldEdge: {
        enabled: true,
        color: "#8A4706",
        width: 5,
        opacity: 0.95,
      },

      faceFill: {
        enabled: true,
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #FFF3A6 12%, #F3B11C 44%, #B76508 68%, #5A2202 100%)",
        opacity: 1,
      },

      bevelHighlight: {
        enabled: true,
        color: "rgba(255,255,255,0.72)",
        opacity: 0.58,
        offsetX: -1,
        offsetY: -2,
        blur: 1.2,
      },

      bevelShadow: {
        enabled: true,
        color: "rgba(40,12,0,0.72)",
        opacity: 0.62,
        offsetX: 1,
        offsetY: 2,
        blur: 2,
      },

      shineBand: {
        enabled: true,
        opacity: 0.42,
        angle: -18,
        background:
          "linear-gradient(115deg, transparent 0%, transparent 30%, rgba(255,255,255,0.74) 38%, rgba(255,220,95,0.22) 46%, transparent 58%, transparent 100%)",
      },

      metalTexture: {
        enabled: true,
        opacity: 0.18,
        roughness: 0.46,
      },

      innerBurn: {
        enabled: true,
        color: "rgba(58,20,0,0.42)",
        opacity: 0.34,
      },

      rimHotspot: {
        enabled: true,
        color: "rgba(255,250,210,0.9)",
        opacity: 0.55,
      },
    },

    mobile: {
      strokeWidth: 9,
      texture: 0.38,
      roughness: 0.32,
      shine: 0.36,
      shadow: 0.48,

      layers: {
        backShadow: {
          blur: 8,
          opacity: 0.55,
        },
        blockStroke: {
          width: 9,
        },
        outerGoldEdge: {
          width: 3,
        },
        shineBand: {
          opacity: 0.28,
        },
        metalTexture: {
          opacity: 0.08,
        },
      },
    },
  },

  transform: {
    skew: 0,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 0,
    extrudeDistance: 0,
    extrudeColor: HEADLINE_GOLD_BLOCK_DEFAULTS.strokeColor,

    align: "center",
    lineHeight: 0.94,
    mobileStyleFocus: "goldblock",
  },
} as const;

export type GoldBlockPaletteSource = {
  neutral?: string;
  primary?: string;
  accent?: string;
  bgTo?: string;
  secondary?: string;
  highlight?: string;
};

export type GoldBlockPaletteResolvers = {
  normalizePaletteHexString: (value: string, fallback: string) => string;
  darkenHex: (hex: string, amount: number) => string;
  lightenHex?: (hex: string, amount: number) => string;
};

export function resolveGoldBlockPaletteColors(
  source: Partial<GoldBlockPaletteSource> | null | undefined,
  resolvers: GoldBlockPaletteResolvers
) {
  const paletteSource = source || {};

  const midColor = resolvers.normalizePaletteHexString(
    String(
      paletteSource.accent ||
        paletteSource.primary ||
        HEADLINE_GOLD_BLOCK_DEFAULTS.midColor
    ),
    HEADLINE_GOLD_BLOCK_DEFAULTS.midColor
  );

  const lightColor = resolvers.normalizePaletteHexString(
    String(
      paletteSource.highlight ||
        paletteSource.neutral ||
        resolvers.lightenHex?.(midColor, 24) ||
        HEADLINE_GOLD_BLOCK_DEFAULTS.lightColor
    ),
    HEADLINE_GOLD_BLOCK_DEFAULTS.lightColor
  );

  const darkColor = resolvers.normalizePaletteHexString(
    String(
      paletteSource.bgTo ||
        paletteSource.secondary ||
        resolvers.darkenHex(midColor, 46)
    ),
    HEADLINE_GOLD_BLOCK_DEFAULTS.darkColor
  );

  const amberColor = resolvers.normalizePaletteHexString(
    String(resolvers.lightenHex?.(midColor, 10) || HEADLINE_GOLD_BLOCK_DEFAULTS.amberColor),
    HEADLINE_GOLD_BLOCK_DEFAULTS.amberColor
  );

  const burnColor = resolvers.normalizePaletteHexString(
    String(resolvers.darkenHex(darkColor, 32)),
    HEADLINE_GOLD_BLOCK_DEFAULTS.burnColor
  );

  return {
    lightColor,
    midColor,
    darkColor,
    amberColor,
    burnColor,
    highlightColor: HEADLINE_GOLD_BLOCK_DEFAULTS.highlightColor,
  };
}

export function buildGoldBlockHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...GOLD_BLOCK_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...GOLD_BLOCK_HEADLINE_PRESET.textFx,
    },
  };
}