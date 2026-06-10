export const HEADLINE_KINETIC_DEFAULTS = {
  textColor: "#FFFFFF",
  topColor: "#FF2BD6",
  bottomColor: "#00EAFF",

  darkColor: "rgba(4,6,18,0.82)",
  shadowColor: "rgba(0,0,0,0.48)",
  highlightColor: "rgba(255,255,255,0.78)",

  sliceOffsetX: 28,
  sliceOffsetY: 3,
  sliceCount: 5,
  sliceGap: 2,

  motionBlur: 0.42,
  shadowOpacity: 0.72,
  echoOpacity: 0.34,
  streakOpacity: 0.48,
  edgeOpacity: 0.64,

  jitter: 0.18,
} as const;

export const KINETIC_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: false,
    tracking: -0.045,

    gradient: true,
    color: HEADLINE_KINETIC_DEFAULTS.textColor,
    gradFrom: HEADLINE_KINETIC_DEFAULTS.textColor,
    gradMid: "rgba(255,255,255,0.82)",
    gradTo: HEADLINE_KINETIC_DEFAULTS.textColor,

    strokeWidth: 0.6,
    strokeColor: HEADLINE_KINETIC_DEFAULTS.darkColor,

    glow: 0,
    shadowEnabled: true,
    shadowColor: HEADLINE_KINETIC_DEFAULTS.shadowColor,
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 5,
  },

  kinetic: {
    enabled: true,
    paletteLinked: true,

    textColor: HEADLINE_KINETIC_DEFAULTS.textColor,
    topColor: HEADLINE_KINETIC_DEFAULTS.topColor,
    bottomColor: HEADLINE_KINETIC_DEFAULTS.bottomColor,

    darkColor: HEADLINE_KINETIC_DEFAULTS.darkColor,
    shadowColor: HEADLINE_KINETIC_DEFAULTS.shadowColor,
    highlightColor: HEADLINE_KINETIC_DEFAULTS.highlightColor,

    sliceOffsetX: HEADLINE_KINETIC_DEFAULTS.sliceOffsetX,
    sliceOffsetY: HEADLINE_KINETIC_DEFAULTS.sliceOffsetY,
    sliceCount: HEADLINE_KINETIC_DEFAULTS.sliceCount,
    sliceGap: HEADLINE_KINETIC_DEFAULTS.sliceGap,

    motionBlur: HEADLINE_KINETIC_DEFAULTS.motionBlur,
    shadowOpacity: HEADLINE_KINETIC_DEFAULTS.shadowOpacity,
    echoOpacity: HEADLINE_KINETIC_DEFAULTS.echoOpacity,
    streakOpacity: HEADLINE_KINETIC_DEFAULTS.streakOpacity,
    edgeOpacity: HEADLINE_KINETIC_DEFAULTS.edgeOpacity,

    jitter: HEADLINE_KINETIC_DEFAULTS.jitter,

    layers: {
      backShadow: {
        enabled: true,
        color: "rgba(0,0,0,0.5)",
        opacity: 0.58,
        blur: 10,
        offsetX: 0,
        offsetY: 7,
      },

      cyanEcho: {
        enabled: true,
        color: "#00EAFF",
        opacity: 0.42,
        offsetX: -12,
        offsetY: 1,
        blur: 0,
      },

      magentaEcho: {
        enabled: true,
        color: "#FF2BD6",
        opacity: 0.38,
        offsetX: 12,
        offsetY: -1,
        blur: 0,
      },

      mainFace: {
        enabled: true,
        color: "#FFFFFF",
        opacity: 1,
      },

      darkEdge: {
        enabled: true,
        color: "rgba(4,6,18,0.82)",
        width: 1.2,
        opacity: 0.72,
      },

      topSlice: {
        enabled: true,
        color: "#FF2BD6",
        opacity: 0.92,
        offsetX: 28,
        offsetY: -3,
        heightRatio: 0.28,
      },

      bottomSlice: {
        enabled: true,
        color: "#00EAFF",
        opacity: 0.88,
        offsetX: -22,
        offsetY: 4,
        heightRatio: 0.3,
      },

      speedLines: {
        enabled: true,
        color: "rgba(255,255,255,0.62)",
        opacity: 0.42,
        angle: 0,
        count: 6,
        length: 0.18,
      },

      highlightCut: {
        enabled: true,
        color: "rgba(255,255,255,0.75)",
        opacity: 0.34,
        offsetX: -1,
        offsetY: -1,
      },
    },

    mobile: {
      sliceOffsetX: 18,
      sliceOffsetY: 2,
      sliceCount: 3,
      motionBlur: 0.2,
      shadowOpacity: 0.5,
      echoOpacity: 0.24,
      streakOpacity: 0.3,
      jitter: 0.08,

      layers: {
        backShadow: {
          blur: 6,
          opacity: 0.42,
        },
        cyanEcho: {
          offsetX: -7,
          opacity: 0.28,
        },
        magentaEcho: {
          offsetX: 7,
          opacity: 0.26,
        },
        topSlice: {
          offsetX: 18,
          opacity: 0.72,
        },
        bottomSlice: {
          offsetX: -14,
          opacity: 0.7,
        },
        speedLines: {
          opacity: 0.24,
          count: 4,
        },
      },
    },
  },

  transform: {
    skew: -2,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 38,
    extrudeDistance: 0,
    extrudeColor: "#050812",

    align: "center",
    lineHeight: 1.02,
    mobileStyleFocus: "kinetic-slice",
  },
} as const;

export type KineticPaletteSource = {
  neutral?: string;
  primary?: string;
  accent?: string;
  bgTo?: string;
  secondary?: string;
  highlight?: string;
};

export type KineticRgb = { r: number; g: number; b: number };

export type KineticPaletteResolvers = {
  normalizePaletteHexString: (value: string, fallback: string) => string;
  normalizeGlassGlowColor: (value: string, fallback: string) => string;
  hexToRgb: (hex: string | undefined | null) => KineticRgb;
  rgbDistance: (a: KineticRgb, b: KineticRgb) => number;
  luminanceOfRgb?: (color: KineticRgb) => number;
};

function kineticColorDistanceSafe(
  a: string,
  b: string,
  resolvers: KineticPaletteResolvers
) {
  try {
    return resolvers.rgbDistance(resolvers.hexToRgb(a), resolvers.hexToRgb(b));
  } catch {
    return 999;
  }
}

function kineticLuminanceSafe(
  color: string,
  resolvers: KineticPaletteResolvers
) {
  try {
    return resolvers.luminanceOfRgb?.(resolvers.hexToRgb(color)) ?? 255;
  } catch {
    return 255;
  }
}

export function resolveKineticPaletteColors(
  source: Partial<KineticPaletteSource> | null | undefined,
  resolvers: KineticPaletteResolvers
) {
  const paletteSource = source || {};

  const neutral = resolvers.normalizePaletteHexString(
    String(paletteSource.neutral || ""),
    ""
  );

  const textColor =
    neutral && kineticLuminanceSafe(neutral, resolvers) > 150
      ? neutral
      : HEADLINE_KINETIC_DEFAULTS.textColor;

  const topColor = resolvers.normalizeGlassGlowColor(
    String(
      paletteSource.accent ||
        paletteSource.primary ||
        HEADLINE_KINETIC_DEFAULTS.topColor
    ),
    HEADLINE_KINETIC_DEFAULTS.topColor
  );

  let bottomColor = resolvers.normalizeGlassGlowColor(
    String(
      paletteSource.secondary ||
        paletteSource.bgTo ||
        paletteSource.primary ||
        HEADLINE_KINETIC_DEFAULTS.bottomColor
    ),
    HEADLINE_KINETIC_DEFAULTS.bottomColor
  );

  if (kineticColorDistanceSafe(topColor, bottomColor, resolvers) < 44) {
    bottomColor = resolvers.normalizeGlassGlowColor(
      String(
        paletteSource.bgTo ||
          paletteSource.secondary ||
          HEADLINE_KINETIC_DEFAULTS.bottomColor
      ),
      HEADLINE_KINETIC_DEFAULTS.bottomColor
    );
  }

  if (kineticColorDistanceSafe(topColor, bottomColor, resolvers) < 44) {
    bottomColor = HEADLINE_KINETIC_DEFAULTS.bottomColor;
  }

  return {
    textColor,
    topColor,
    bottomColor,
  };
}

export function buildKineticHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx,
  colors: {
    textColor?: string;
    topColor?: string;
    bottomColor?: string;
  } = HEADLINE_KINETIC_DEFAULTS
) {
  const textColor = colors.textColor || HEADLINE_KINETIC_DEFAULTS.textColor;
  const topColor = colors.topColor || HEADLINE_KINETIC_DEFAULTS.topColor;
  const bottomColor = colors.bottomColor || HEADLINE_KINETIC_DEFAULTS.bottomColor;

  return {
    ...KINETIC_HEADLINE_PRESET,

    textFx: {
      ...textFx,
      ...KINETIC_HEADLINE_PRESET.textFx,
      color: textColor,
      gradFrom: textColor,
      gradMid: HEADLINE_KINETIC_DEFAULTS.highlightColor,
      gradTo: textColor,
      strokeColor: HEADLINE_KINETIC_DEFAULTS.darkColor,
    },

    kinetic: {
      ...KINETIC_HEADLINE_PRESET.kinetic,
      textColor,
      topColor,
      bottomColor,

      layers: {
        ...KINETIC_HEADLINE_PRESET.kinetic.layers,
        mainFace: {
          ...KINETIC_HEADLINE_PRESET.kinetic.layers.mainFace,
          color: textColor,
        },
        topSlice: {
          ...KINETIC_HEADLINE_PRESET.kinetic.layers.topSlice,
          color: topColor,
        },
        bottomSlice: {
          ...KINETIC_HEADLINE_PRESET.kinetic.layers.bottomSlice,
          color: bottomColor,
        },
        cyanEcho: {
          ...KINETIC_HEADLINE_PRESET.kinetic.layers.cyanEcho,
          color: bottomColor,
        },
        magentaEcho: {
          ...KINETIC_HEADLINE_PRESET.kinetic.layers.magentaEcho,
          color: topColor,
        },
      },
    },
  };
}