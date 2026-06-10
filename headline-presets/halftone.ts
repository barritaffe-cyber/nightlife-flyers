export const HEADLINE_HALFTONE_DEFAULTS = {
  dotSize: 7.8,
  dotSpacing: 9,
  fadeTop: 0.15,
  fadeBottom: 0.9,
  minDotScale: 0.35,
  maxDotScale: 1,
} as const;

export const HALFTONE_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: false,
    tracking: -0.085,

    gradient: true,
    color: "#ff2a45",
    gradFrom: "#ff3b55",
    gradTo: "#b90028",

    strokeWidth: 0,
    strokeColor: "transparent",

    glow: 10,
    glowColor: "rgba(255,42,69,0.55)",

    shadowEnabled: false,
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  },

  rush: {
    enabled: true,

    // main dot material
    dotColor: "#ff2a45",
    contrastColor: "#ffffff",

    // premium halftone controls
    dotSize: HEADLINE_HALFTONE_DEFAULTS.dotSize,
    dotSpacing: HEADLINE_HALFTONE_DEFAULTS.dotSpacing,
    minDotScale: HEADLINE_HALFTONE_DEFAULTS.minDotScale,
    maxDotScale: HEADLINE_HALFTONE_DEFAULTS.maxDotScale,

    // dot fade direction
    fadeTop: HEADLINE_HALFTONE_DEFAULTS.fadeTop,
    fadeBottom: HEADLINE_HALFTONE_DEFAULTS.fadeBottom,

    // depth
    shadowOffset: 0,
    shadowColor: "transparent",

    // highlights
    highlightColor: "rgba(255,255,255,0.18)",
    highlightOffset: -1.2,

    // export-safe
    blendMode: "source-over",
    filter: "none",
  },

  transform: {
    skew: 0,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 38,
    extrudeDistance: 0,
    extrudeColor: "transparent",

    align: "center",
    lineHeight: 1.05,
    mobileStyleFocus: "rush",
  },
} as const;

export function buildHalftoneHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...HALFTONE_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...HALFTONE_HEADLINE_PRESET.textFx,
    },
  };
}
