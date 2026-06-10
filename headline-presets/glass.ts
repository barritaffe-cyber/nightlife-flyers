export const HEADLINE_GLASS_DEFAULTS = {
  primaryColor: "#FF2BBF",
  secondaryColor: "#9B5CFF",
  highlightColor: "#FFD6FF",
  edgeColor: "#FF37D7",

  rimColor: "rgba(255,55,215,0.92)",
  shadowColor: "rgba(10,0,26,0.82)",

  blur: 1.1,
  glow: 48,
  stroke: 1.7,
  fillAlpha: 0.18,

  bevelStrength: 0.92,
  innerGlow: 0.28,
  rimLight: 0.95,
  grain: 0.006,

  refraction: 0.32,
  edgeLines: 2,
  textureLines: 1,

  reflectionOpacity: 0.46,
  reflectionAngle: -18,
  reflectionBands: 4,

  glintOpacity: 0.62,
  causticOpacity: 0.14,
} as const;

export const HEADLINE_GLASS_MIN_LINE_HEIGHT = 0.72;
export const HEADLINE_GLASS_DEFAULT_LINE_HEIGHT = 0.88;
export const HEADLINE_GLASS_MAX_LINE_HEIGHT = 1.18;

export const GLASS_HEADLINE_PRESET = {
  textStyle: {
    family: "Bebas Neue",
    align: "center",
  },

  textFx: {
    alpha: 0.78,
    uppercase: true,
    bold: true,
    italic: true,
    tracking: -0.045,

    gradient: true,
    color: "rgba(255,80,220,0.08)",

    gradFrom: "rgba(255,160,255,0.22)",
    gradMid: "rgba(255,43,191,0.18)",
    gradTo: "rgba(40,0,80,0.62)",

    strokeWidth: 0.75,
    strokeColor: "rgba(255,70,220,0.88)",

    glow: 8,
    glowColor: "rgba(255,43,191,0.48)",

    shadowEnabled: true,
    shadowColor: HEADLINE_GLASS_DEFAULTS.shadowColor,
    shadowBlur: 18,
    shadowOffsetX: 0,
    shadowOffsetY: 10,
  },

  glass: {
    enabled: true,
    paletteLinked: false,

    primaryColor: HEADLINE_GLASS_DEFAULTS.primaryColor,
    secondaryColor: HEADLINE_GLASS_DEFAULTS.secondaryColor,
    highlightColor: HEADLINE_GLASS_DEFAULTS.highlightColor,
    edgeColor: HEADLINE_GLASS_DEFAULTS.edgeColor,

    rimColor: HEADLINE_GLASS_DEFAULTS.rimColor,
    shadowColor: HEADLINE_GLASS_DEFAULTS.shadowColor,

    blur: HEADLINE_GLASS_DEFAULTS.blur,
    glow: HEADLINE_GLASS_DEFAULTS.glow,
    stroke: HEADLINE_GLASS_DEFAULTS.stroke,
    fillAlpha: HEADLINE_GLASS_DEFAULTS.fillAlpha,

    bevelStrength: HEADLINE_GLASS_DEFAULTS.bevelStrength,
    innerGlow: HEADLINE_GLASS_DEFAULTS.innerGlow,
    rimLight: HEADLINE_GLASS_DEFAULTS.rimLight,
    grain: HEADLINE_GLASS_DEFAULTS.grain,

    refraction: HEADLINE_GLASS_DEFAULTS.refraction,
    edgeLines: HEADLINE_GLASS_DEFAULTS.edgeLines,
    textureLines: HEADLINE_GLASS_DEFAULTS.textureLines,

    reflectionOpacity: HEADLINE_GLASS_DEFAULTS.reflectionOpacity,
    reflectionAngle: HEADLINE_GLASS_DEFAULTS.reflectionAngle,
    reflectionBands: HEADLINE_GLASS_DEFAULTS.reflectionBands,

    glintOpacity: HEADLINE_GLASS_DEFAULTS.glintOpacity,
    causticOpacity: HEADLINE_GLASS_DEFAULTS.causticOpacity,

    blendMode: "screen",
    filter: "none",

    layers: {
      depthShadow: {
        enabled: true,
        opacity: 0.7,
        offsetX: 0,
        offsetY: 12,
        blur: 22,
        color: "rgba(8,0,24,0.86)",
      },

      backWall: {
        enabled: true,
        opacity: 0.48,
        offsetX: 3,
        offsetY: 3,
        strokeWidth: 2.2,
        strokeColor: "rgba(20,0,55,0.88)",
        fill: "rgba(45,0,80,0.24)",
      },

      sideWall: {
        enabled: true,
        opacity: 0.58,
        offsetX: 2,
        offsetY: 2,
        background:
          "linear-gradient(135deg, rgba(255,35,205,0.36) 0%, rgba(55,0,95,0.72) 48%, rgba(10,0,32,0.86) 100%)",
      },

      bodyFill: {
        opacity: 0.78,
        background:
          "linear-gradient(180deg, rgba(255,140,245,0.22) 0%, rgba(255,43,191,0.12) 28%, rgba(20,0,45,0.46) 52%, rgba(120,20,180,0.18) 72%, rgba(8,0,24,0.62) 100%)",
      },

      darkCavity: {
        enabled: true,
        opacity: 0.52,
        background:
          "radial-gradient(ellipse at 50% 48%, rgba(5,0,18,0.72) 0%, rgba(20,0,45,0.46) 34%, rgba(255,43,191,0.08) 68%, transparent 100%)",
      },

      refractionBands: {
        enabled: true,
        opacity: 0.34,
        offsetX: 2,
        offsetY: -1.5,
        blendMode: "screen",
        background:
          "linear-gradient(100deg, transparent 0%, rgba(150,80,255,0.2) 18%, transparent 28%, rgba(255,40,200,0.22) 44%, transparent 56%, rgba(255,185,255,0.18) 72%, transparent 86%)",
      },

      hardReflectionPanels: {
        enabled: true,
        opacity: 0.42,
        blendMode: "screen",
        background:
          "linear-gradient(118deg, transparent 0%, transparent 18%, rgba(255,210,255,0.46) 25%, rgba(255,80,220,0.12) 32%, transparent 40%, transparent 54%, rgba(255,235,255,0.34) 62%, rgba(155,92,255,0.12) 70%, transparent 78%)",
      },

      reflectionBands: {
        enabled: true,
        opacity: 0.46,
        angle: -18,
        blendMode: "screen",
        background:
          "linear-gradient(115deg, transparent 0%, transparent 20%, rgba(255,255,255,0) 24%, rgba(255,225,255,0.52) 29%, rgba(255,65,215,0.16) 35%, transparent 43%, transparent 58%, rgba(210,120,255,0.36) 66%, rgba(255,230,255,0.08) 72%, transparent 82%)",
      },

      innerShadow: {
        enabled: true,
        opacity: 0.68,
        offsetX: 0,
        offsetY: 4,
        blur: 6,
        color: "rgba(5,0,20,0.88)",
      },

      innerBevelDark: {
        enabled: true,
        width: 2.2,
        opacity: 0.54,
        color: "rgba(10,0,35,0.82)",
      },

      innerBevelLight: {
        enabled: true,
        width: 1.2,
        opacity: 0.62,
        color: "rgba(255,125,235,0.72)",
      },

      innerHighlight: {
        enabled: true,
        opacity: 0.34,
        offsetX: -1,
        offsetY: -2,
        blur: 1.5,
        color: "rgba(255,210,255,0.52)",
      },

      rimDarkEdge: {
        enabled: true,
        width: 2.2,
        opacity: 0.72,
        color: "rgba(8,0,30,0.9)",
      },

      rimStroke: {
        enabled: true,
        width: 1.05,
        opacity: 0.96,
        color: "rgba(255,45,215,0.96)",
      },

      rimHotEdge: {
        enabled: true,
        width: 0.45,
        opacity: 0.92,
        color: "rgba(255,225,255,0.82)",
      },

      topEdgeLight: {
        enabled: true,
        opacity: 0.64,
        offsetX: -0.5,
        offsetY: -1.2,
        blur: 1,
        color: "rgba(255,210,255,0.66)",
      },

      bottomEdgeShadow: {
        enabled: true,
        opacity: 0.58,
        offsetX: 0,
        offsetY: 1.6,
        blur: 2,
        color: "rgba(8,0,28,0.82)",
      },

      caustics: {
        enabled: true,
        opacity: 0.14,
        blendMode: "screen",
        background:
          "radial-gradient(circle at 18% 24%, rgba(255,210,255,0.3), transparent 18%), radial-gradient(circle at 70% 64%, rgba(255,43,191,0.24), transparent 24%), linear-gradient(130deg, transparent 16%, rgba(255,160,255,0.14) 42%, transparent 60%)",
      },

      glints: {
        enabled: true,
        opacity: 0.62,
        size: 0.052,
        color: "rgba(255,245,255,0.95)",
        shadow: "0 0 9px rgba(255,70,220,0.78)",
        positions: [
          { x: 0.08, y: 0.08 },
          { x: 0.34, y: 0.12 },
          { x: 0.58, y: 0.1 },
          { x: 0.88, y: 0.16 },
          { x: 0.47, y: 0.52 },
        ],
      },

      outerGlow: {
        enabled: true,
        opacity: 0.64,
        blur: 34,
        color: "rgba(255,43,191,0.48)",
      },

      hotRimGlow: {
        enabled: true,
        opacity: 0.5,
        blur: 14,
        color: "rgba(255,20,205,0.62)",
      },
    },

    mobile: {
      refraction: 0.18,
      reflectionOpacity: 0.34,
      causticOpacity: 0.08,
      glintOpacity: 0.42,
      textureLines: 0,
      grain: 0,
      blur: 0,
      filter: "none",
      blendMode: "source-over",

      layers: {
        depthShadow: {
          opacity: 0.56,
          blur: 14,
        },
        backWall: {
          opacity: 0.36,
          offsetX: 2,
          offsetY: 2,
        },
        sideWall: {
          opacity: 0.42,
        },
        bodyFill: {
          opacity: 0.7,
        },
        darkCavity: {
          opacity: 0.44,
        },
        refractionBands: {
          opacity: 0.22,
        },
        hardReflectionPanels: {
          opacity: 0.3,
        },
        reflectionBands: {
          opacity: 0.32,
        },
        innerShadow: {
          opacity: 0.52,
          blur: 4,
        },
        rimDarkEdge: {
          opacity: 0.62,
          width: 1.6,
        },
        rimStroke: {
          opacity: 0.84,
          width: 0.9,
        },
        rimHotEdge: {
          opacity: 0.68,
          width: 0.35,
        },
        caustics: {
          opacity: 0.06,
        },
        glints: {
          opacity: 0.38,
        },
        outerGlow: {
          opacity: 0.42,
          blur: 12,
        },
      },
    },
  },

  transform: {
    skew: -4,
    rotate: 0,

    extrudeDepth: 6,
    extrudeAngle: 38,
    extrudeDistance: 1.8,
    extrudeColor: "rgba(25,0,55,0.66)",

    align: "center",
    lineHeight: HEADLINE_GLASS_DEFAULT_LINE_HEIGHT,
    mobileStyleFocus: "acrylic-glass-rim-depth",
  },
} as const;

export function buildGlassHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...GLASS_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...GLASS_HEADLINE_PRESET.textFx,
    },
  };
}
