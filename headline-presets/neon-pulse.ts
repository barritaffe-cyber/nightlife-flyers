export const HEADLINE_NEON_PULSE_DEFAULTS = {
  intensity: 0.26,
  edge: 9,
  core: 0.34,
  glow: 0.48,

  primaryColor: "#d8fbff",
  midColor: "#4ddfff",
  endColor: "#0aa8ff",
  coreColor: "#f7ffff",

  legacyPrimaryColor: "#ff2bd6",
  legacyMidColor: "#8b4dff",
  legacyEndColor: "#00eaff",
  legacyCoreColor: "#fff5ff",

  lineHeight: 0.9,
} as const;

export const NEON_PULSE_HEADLINE_PRESET = {
  textStyle: {
    family: "TR2N",
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: false,
    tracking: 0.02,

    gradient: false,
    color: HEADLINE_NEON_PULSE_DEFAULTS.coreColor,
    gradFrom: HEADLINE_NEON_PULSE_DEFAULTS.primaryColor,
    gradTo: HEADLINE_NEON_PULSE_DEFAULTS.endColor,

    strokeWidth: 0,
    strokeColor: "#ffffff",

    glow: 0,
    shadowEnabled: false,
  },

  neonPulse: {
    enabled: true,

    intensity: HEADLINE_NEON_PULSE_DEFAULTS.intensity,
    edge: HEADLINE_NEON_PULSE_DEFAULTS.edge,
    core: HEADLINE_NEON_PULSE_DEFAULTS.core,
    glow: HEADLINE_NEON_PULSE_DEFAULTS.glow,

    primaryColor: HEADLINE_NEON_PULSE_DEFAULTS.primaryColor,
    midColor: HEADLINE_NEON_PULSE_DEFAULTS.midColor,
    endColor: HEADLINE_NEON_PULSE_DEFAULTS.endColor,
    coreColor: HEADLINE_NEON_PULSE_DEFAULTS.coreColor,

    blendMode: "screen",
    filter: "none",

    mobile: {
      glow: 0.32,
      intensity: 0.2,
      edge: 7,
      core: 0.28,
      liteGlowMode: true,
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
    lineHeight: HEADLINE_NEON_PULSE_DEFAULTS.lineHeight,
    mobileStyleFocus: "neon-tube",
  },
} as const;

export type NeonPulseRenderAlign = "left" | "center" | "right";

export type NeonPulseLayerSpec = {
  key: string;
  stroke: string;
  domStroke?: string;
  strokeWidth: number;
  opacity: number;
  filter: string;
  fill?: string;
};

export type NeonPulseRenderConfig = {
  primaryColor: string;
  midColor: string;
  endColor: string;
  coreColor: string;
  gradientId: string;
  glowFilterId: string;
  lineHeight: number;
  lines: string[];
  pad: number;
  lineAdvance: number;
  svgHeight: number;
  firstLineY: number;
  liteGlowMode: boolean;
  svgGlowActive: boolean;
  svgX: string;
  textAnchor: "start" | "middle" | "end";
  glowBlurA: number;
  glowBlurB: number;
  glowBlurC: number;
  layers: NeonPulseLayerSpec[];
};

function clamp(value: number, min: number, max: number) {
  const n = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function normalizeColor(value: string | undefined, legacy: string, fallback: string) {
  const raw = String(value || "").trim();
  const normalized = raw.toLowerCase();

  if (!raw) return fallback;
  if (normalized === legacy.toLowerCase()) return fallback;

  return raw;
}

export function resolveNeonPulseColors({
  primaryColor,
  midColor,
  endColor,
  coreColor,
}: {
  primaryColor?: string;
  midColor?: string;
  endColor?: string;
  coreColor?: string;
}) {
  return {
    primaryColor: normalizeColor(
      primaryColor,
      HEADLINE_NEON_PULSE_DEFAULTS.legacyPrimaryColor,
      HEADLINE_NEON_PULSE_DEFAULTS.primaryColor
    ),
    midColor: normalizeColor(
      midColor,
      HEADLINE_NEON_PULSE_DEFAULTS.legacyMidColor,
      HEADLINE_NEON_PULSE_DEFAULTS.midColor
    ),
    endColor: normalizeColor(
      endColor,
      HEADLINE_NEON_PULSE_DEFAULTS.legacyEndColor,
      HEADLINE_NEON_PULSE_DEFAULTS.endColor
    ),
    coreColor: normalizeColor(
      coreColor,
      HEADLINE_NEON_PULSE_DEFAULTS.legacyCoreColor,
      HEADLINE_NEON_PULSE_DEFAULTS.coreColor
    ),
  };
}

export function colorWithAlpha(color: string, alpha: number) {
  const trimmed = String(color || "").trim();
  const safeAlpha = clamp(alpha, 0, 1);

  if (trimmed.startsWith("#")) {
    const raw = trimmed.slice(1);
    const hex =
      raw.length === 3
        ? raw
            .split("")
            .map((part) => part + part)
            .join("")
        : raw.slice(0, 6);

    const parsed = Number.parseInt(hex, 16);

    if (Number.isFinite(parsed)) {
      const r = (parsed >> 16) & 255;
      const g = (parsed >> 8) & 255;
      const b = parsed & 255;
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    }
  }

  const match = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return trimmed;

  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return trimmed;

  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${safeAlpha})`;
}

export function buildNeonPulseRenderConfig({
  text,
  fontSize,
  lineHeight,
  intensity,
  edge,
  core,
  glow,
  align,
  idSuffix,
  liteGlowMode,
  primaryColor,
  midColor,
  endColor,
  coreColor,
}: {
  text: string;
  fontSize: number;
  lineHeight: number;
  intensity: number;
  edge: number;
  core: number;
  glow: number;
  align: NeonPulseRenderAlign;
  idSuffix: string;
  liteGlowMode: boolean;
  primaryColor?: string;
  midColor?: string;
  endColor?: string;
  coreColor?: string;
}): NeonPulseRenderConfig {
  const colors = resolveNeonPulseColors({
    primaryColor,
    midColor,
    endColor,
    coreColor,
  });

  const safeFontSize = Math.max(1, Number(fontSize) || 1);
  const safeLineHeight = Math.max(
    0.55,
    Number.isFinite(Number(lineHeight))
      ? Number(lineHeight)
      : HEADLINE_NEON_PULSE_DEFAULTS.lineHeight
  );

  const safeIntensity = clamp(Number(intensity), 0, 1);
  const safeEdge = clamp(Number(edge), 0, 32);
  const safeCore = clamp(Number(core), 0, 1);
  const safeGlow = clamp(Number(glow), 0, 1);

  const safeId = String(idSuffix || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `headline-neon-pulse-gradient-${safeId}`;
  const glowFilterId = `headline-neon-pulse-glow-${safeId}`;

  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line || " ");

  const glowPad = liteGlowMode ? safeGlow * 0.18 : safeGlow * 0.34;
  const pad = Math.max(18, safeFontSize * (0.16 + glowPad));

  const lineAdvance = safeFontSize * safeLineHeight;
  const svgHeight =
    safeFontSize + Math.max(0, lines.length - 1) * lineAdvance + pad * 2;
  const firstLineY = pad + safeFontSize * 0.78;

  const svgGlowActive = safeGlow > 0.015 && !liteGlowMode;
  const liteGlowActive = safeGlow > 0.015 && liteGlowMode;

  const wideStroke = Math.max(2.2, 2.6 + safeIntensity * 3.8 + safeGlow * 6.2);
  const outerTubeStroke = Math.max(2.0, 2.2 + safeIntensity * 2.4 + safeGlow * 1.4);
  const rimStroke = Math.max(1.4, 1.6 + safeIntensity * 1.6);
  const tubeStroke = Math.max(1.0, 1.22 + safeIntensity * 1.55);
  const coreStroke = Math.max(0.42, 0.5 + safeCore * 0.95);
  const edgeStroke = Math.max(0.25, 0.34 + safeEdge * 0.026);

  const svgX = align === "left" ? "0%" : align === "right" ? "100%" : "50%";
  const textAnchor =
    align === "left" ? "start" : align === "right" ? "end" : "middle";

  const gradientStroke = `url(#${gradientId})`;

  const liteTubeGlow = liteGlowActive
    ? `drop-shadow(0 0 ${(1.4 + safeGlow * 3.2).toFixed(1)}px ${colorWithAlpha(
        colors.midColor,
        0.46
      )}) drop-shadow(0 0 ${(3.2 + safeGlow * 5.8).toFixed(1)}px ${colorWithAlpha(
        colors.endColor,
        0.28
      )})`
    : "none";

  const liteCoreGlow = liteGlowActive
    ? `drop-shadow(0 0 ${(0.9 + safeGlow * 2.2).toFixed(
        1
      )}px rgba(255,255,255,0.58))`
    : "none";

  const coreGlow = svgGlowActive
    ? `drop-shadow(0 0 ${(0.9 + safeGlow * 2.4).toFixed(
        1
      )}px rgba(255,255,255,0.62)) drop-shadow(0 0 ${(1.8 + safeGlow * 5.4).toFixed(
        1
      )}px ${colorWithAlpha(colors.midColor, 0.42)})`
    : "none";

  const darkRim = "rgba(0,8,20,0.82)";
  const innerCut = "rgba(1,16,30,0.48)";
  const whiteEdge = "rgba(255,255,255,0.9)";

  const liteLayers: NeonPulseLayerSpec[] = [
    {
      key: "halo",
      stroke: gradientStroke,
      domStroke: colorWithAlpha(colors.endColor, 0.72),
      strokeWidth: wideStroke,
      opacity: Math.min(0.2, Math.max(0.06, safeGlow * 0.18)),
      filter: "none",
    },
    {
      key: "outer-rim",
      stroke: darkRim,
      strokeWidth: outerTubeStroke,
      opacity: 0.62,
      filter: "none",
    },
    {
      key: "tube",
      stroke: gradientStroke,
      domStroke: colors.midColor,
      strokeWidth: tubeStroke,
      opacity: 0.98,
      filter: liteTubeGlow,
    },
    {
      key: "inner-cut",
      stroke: innerCut,
      strokeWidth: Math.max(0.55, tubeStroke * 0.42),
      opacity: 0.46,
      filter: "none",
    },
    {
      key: "core",
      stroke: colors.coreColor,
      strokeWidth: coreStroke,
      opacity: 0.86,
      filter: liteCoreGlow,
    },
    {
      key: "edge-spark",
      stroke: whiteEdge,
      strokeWidth: edgeStroke,
      opacity: 0.42 + safeIntensity * 0.14,
      filter: "none",
    },
  ];

  const fullLayers: NeonPulseLayerSpec[] = [
    {
      key: "wide-glow",
      stroke: gradientStroke,
      domStroke: colorWithAlpha(colors.endColor, 0.86),
      strokeWidth: wideStroke,
      opacity: safeGlow * 0.3,
      filter: `blur(${(2.4 + safeGlow * 8).toFixed(1)}px)`,
    },
    {
      key: "secondary-glow",
      stroke: colorWithAlpha(colors.midColor, 0.9),
      strokeWidth: Math.max(1.6, wideStroke * 0.58),
      opacity: safeGlow * 0.24,
      filter: `blur(${(1.4 + safeGlow * 5.2).toFixed(1)}px)`,
    },
    {
      key: "outer-rim",
      stroke: darkRim,
      strokeWidth: outerTubeStroke,
      opacity: 0.68,
      filter: "none",
    },
    {
      key: "rim-color",
      stroke: gradientStroke,
      domStroke: colors.primaryColor,
      strokeWidth: rimStroke,
      opacity: 0.78,
      filter: "none",
    },
    {
      key: "tube",
      stroke: gradientStroke,
      domStroke: colors.midColor,
      strokeWidth: tubeStroke,
      opacity: 0.96,
      filter: svgGlowActive ? `url(#${glowFilterId})` : "none",
    },
    {
      key: "inner-cut",
      stroke: innerCut,
      strokeWidth: Math.max(0.5, tubeStroke * 0.38),
      opacity: 0.42,
      filter: "none",
    },
    {
      key: "core",
      stroke: colors.coreColor,
      strokeWidth: coreStroke,
      opacity: 0.84,
      filter: coreGlow,
    },
    {
      key: "edge-spark",
      stroke: whiteEdge,
      strokeWidth: edgeStroke,
      opacity: 0.4 + safeIntensity * 0.16,
      filter: "none",
    },
  ];

  return {
    ...colors,
    gradientId,
    glowFilterId,
    lineHeight: safeLineHeight,
    lines,
    pad,
    lineAdvance,
    svgHeight,
    firstLineY,
    liteGlowMode,
    svgGlowActive,
    svgX,
    textAnchor,
    glowBlurA: 0.22 + safeGlow * 0.95,
    glowBlurB: 1.05 + safeGlow * 3.4,
    glowBlurC: 2.6 + safeGlow * 7.8,
    layers: liteGlowMode ? liteLayers : fullLayers,
  };
}

export function buildNeonPulseHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...NEON_PULSE_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...NEON_PULSE_HEADLINE_PRESET.textFx,
    },
  };
}
