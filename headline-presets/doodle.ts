export const HEADLINE_DOODLE_STACK_DEFAULTS = {
  colors: ["#FFF8EC", "#FEB944", "#FE6842", "#DF5584", "#5A5CA8"],

  strokeColor: "#2F2F2F",
  strokeWidth: 2.4,

  shadowColor: "rgba(0,0,0,0.22)",
  highlightColor: "rgba(255,255,255,0.55)",

  layerCount: 5,
  angleX: -8,
  angleY: 4,
  rotate: -1.8,
  spread: 1,

  wobble: 0.65,
  offsetStep: 2.2,
  outlineJitter: 0.35,
  texture: 0.22,
} as const;

export const DOODLE_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: false,
    bold: true,
    italic: false,
    tracking: -0.035,

    gradient: false,
    color: HEADLINE_DOODLE_STACK_DEFAULTS.colors[0],
    gradFrom: HEADLINE_DOODLE_STACK_DEFAULTS.colors[0],
    gradTo: HEADLINE_DOODLE_STACK_DEFAULTS.colors[3],

    strokeWidth: HEADLINE_DOODLE_STACK_DEFAULTS.strokeWidth,
    strokeColor: HEADLINE_DOODLE_STACK_DEFAULTS.strokeColor,

    glow: 0,
    shadowEnabled: true,
    shadowColor: HEADLINE_DOODLE_STACK_DEFAULTS.shadowColor,
    shadowBlur: 0,
    shadowOffsetX: 3,
    shadowOffsetY: 4,
  },

  doodle: {
    enabled: true,
    paletteLinked: true,

    colors: HEADLINE_DOODLE_STACK_DEFAULTS.colors,
    strokeColor: HEADLINE_DOODLE_STACK_DEFAULTS.strokeColor,
    strokeWidth: HEADLINE_DOODLE_STACK_DEFAULTS.strokeWidth,

    shadowColor: HEADLINE_DOODLE_STACK_DEFAULTS.shadowColor,
    highlightColor: HEADLINE_DOODLE_STACK_DEFAULTS.highlightColor,

    layerCount: HEADLINE_DOODLE_STACK_DEFAULTS.layerCount,
    frame: 0,

    angleX: HEADLINE_DOODLE_STACK_DEFAULTS.angleX,
    angleY: HEADLINE_DOODLE_STACK_DEFAULTS.angleY,
    rotate: HEADLINE_DOODLE_STACK_DEFAULTS.rotate,
    spread: HEADLINE_DOODLE_STACK_DEFAULTS.spread,

    wobble: HEADLINE_DOODLE_STACK_DEFAULTS.wobble,
    offsetStep: HEADLINE_DOODLE_STACK_DEFAULTS.offsetStep,
    outlineJitter: HEADLINE_DOODLE_STACK_DEFAULTS.outlineJitter,
    texture: HEADLINE_DOODLE_STACK_DEFAULTS.texture,

    layers: {
      dropShadow: {
        enabled: true,
        color: "rgba(0,0,0,0.22)",
        offsetX: 5,
        offsetY: 6,
        blur: 0,
        opacity: 0.8,
      },

      backStack: {
        enabled: true,
        opacity: 1,
        stepScale: 1,
      },

      face: {
        enabled: true,
        opacity: 1,
      },

      sketchOutline: {
        enabled: true,
        color: "#2F2F2F",
        width: 2.4,
        jitter: 0.35,
        opacity: 1,
      },

      innerHighlight: {
        enabled: true,
        color: "rgba(255,255,255,0.55)",
        offsetX: -1,
        offsetY: -1,
        opacity: 0.45,
      },

      paperTexture: {
        enabled: true,
        opacity: 0.16,
        grain: 0.22,
      },
    },

    mobile: {
      layerCount: 4,
      strokeWidth: 1.8,
      wobble: 0.35,
      outlineJitter: 0.18,
      texture: 0.1,

      layers: {
        dropShadow: {
          offsetX: 3,
          offsetY: 4,
          opacity: 0.55,
        },
        sketchOutline: {
          width: 1.8,
          jitter: 0.18,
        },
        paperTexture: {
          opacity: 0.08,
        },
      },
    },
  },

  transform: {
    skew: 0,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 38,
    extrudeDistance: 0,
    extrudeColor: "#050812",

    align: "center",
    lineHeight: 0.82,
    mobileStyleFocus: "doodle-stack",
  },
} as const;

export function buildDoodleHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx,
  colors: string[] = [...HEADLINE_DOODLE_STACK_DEFAULTS.colors]
) {
  const stackColors = HEADLINE_DOODLE_STACK_DEFAULTS.colors.map(
    (fallback, index) => colors[index] || fallback
  );

  return {
    ...DOODLE_HEADLINE_PRESET,

    textFx: {
      ...textFx,
      ...DOODLE_HEADLINE_PRESET.textFx,
      color: stackColors[0],
      gradFrom: stackColors[0],
      gradTo: stackColors[3] || HEADLINE_DOODLE_STACK_DEFAULTS.colors[3],
      strokeColor: HEADLINE_DOODLE_STACK_DEFAULTS.strokeColor,
      strokeWidth: HEADLINE_DOODLE_STACK_DEFAULTS.strokeWidth,
    },

    doodle: {
      ...DOODLE_HEADLINE_PRESET.doodle,
      colors: stackColors,
      strokeColor: HEADLINE_DOODLE_STACK_DEFAULTS.strokeColor,
      strokeWidth: HEADLINE_DOODLE_STACK_DEFAULTS.strokeWidth,
    },
  };
}