export const HEADLINE_LINE_DEFAULTS = {
  frontOffsetX: 0,
  frontOffsetY: 0,
  backOffsetX: 8,
  backOffsetY: 7,

  highlightOffsetX: -2,
  highlightOffsetY: -2,
  shadowOffsetX: 3,
  shadowOffsetY: 4,
} as const;

export const LINE_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: true,
    tracking: -0.055,

    gradient: true,
    color: "#22e7ff",
    gradFrom: "#8ff7ff",
    gradTo: "#009fd8",

    strokeWidth: 2.5,
    strokeColor: "#ffffff",

    glow: 10,
    glowColor: "rgba(34, 231, 255, 0.45)",

    shadowEnabled: true,
    shadowColor: "rgba(4, 0, 18, 0.55)",
    shadowBlur: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 7,
  },

  line: {
    enabled: true,

    frontOffsetX: HEADLINE_LINE_DEFAULTS.frontOffsetX,
    frontOffsetY: HEADLINE_LINE_DEFAULTS.frontOffsetY,

    backOffsetX: HEADLINE_LINE_DEFAULTS.backOffsetX,
    backOffsetY: HEADLINE_LINE_DEFAULTS.backOffsetY,

    frontColor: "#ffffff",
    frontOpacity: 0.95,

    backColor: "#ff0a8a",
    backOpacity: 0.9,

    highlightColor: "rgba(255,255,255,0.85)",
    highlightOffsetX: HEADLINE_LINE_DEFAULTS.highlightOffsetX,
    highlightOffsetY: HEADLINE_LINE_DEFAULTS.highlightOffsetY,

    shadowColor: "rgba(80,0,60,0.55)",
    shadowOffsetX: HEADLINE_LINE_DEFAULTS.shadowOffsetX,
    shadowOffsetY: HEADLINE_LINE_DEFAULTS.shadowOffsetY,

    blendMode: "source-over",
    filter: "none",
  },

  transform: {
    skew: -7,
    rotate: 0,

    extrudeDepth: 16,
    extrudeAngle: 36,
    extrudeDistance: 18,
    extrudeColor: "rgba(255, 10, 138, 0.82)",

    secondaryExtrudeColor: "rgba(20, 0, 60, 0.6)",
    secondaryExtrudeDepth: 5,
    secondaryExtrudeDistance: 6,

    align: "center",
    lineHeight: 0.9,
    mobileStyleFocus: "line",
  },
} as const;

export function buildLineHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...LINE_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...LINE_HEADLINE_PRESET.textFx,
    },
  };
}