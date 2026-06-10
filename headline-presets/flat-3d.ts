export const HEADLINE_FLAT_3D_DEFAULTS = {
  layers: 22,
  zStep: 1.35,
  frame: 0.65,

  faceColor: "#FFFFFF",
  faceHighlightColor: "#F7FBFF",
  edgeColor: "#0077EA",
  edgeDarkColor: "#00366B",
  shadowColor: "#001C38",

  rimColor: "rgba(255,255,255,0.72)",
  faceShadowColor: "rgba(0,20,50,0.28)",

  glow: 0,
  glowColor: "rgba(0,119,234,0.34)",
} as const;

export const HEADLINE_PURE_3D_DEFAULTS = HEADLINE_FLAT_3D_DEFAULTS;

export const FLAT_3D_HEADLINE_PRESET = {
  textStyle: {
    align: "center",
  },

  textFx: {
    uppercase: false,
    bold: true,
    italic: false,
    tracking: -0.02,

    gradient: false,
    color: HEADLINE_FLAT_3D_DEFAULTS.faceColor,
    gradFrom: HEADLINE_FLAT_3D_DEFAULTS.faceHighlightColor,
    gradTo: HEADLINE_FLAT_3D_DEFAULTS.faceColor,

    strokeWidth: 0.65,
    strokeColor: HEADLINE_FLAT_3D_DEFAULTS.rimColor,

    glow: HEADLINE_FLAT_3D_DEFAULTS.glow,
    glowColor: HEADLINE_FLAT_3D_DEFAULTS.glowColor,

    shadowEnabled: false,
  },

  flat3d: {
    enabled: true,
    paletteLinked: true,

    layers: HEADLINE_FLAT_3D_DEFAULTS.layers,
    zStep: HEADLINE_FLAT_3D_DEFAULTS.zStep,
    frame: HEADLINE_FLAT_3D_DEFAULTS.frame,

    faceColor: HEADLINE_FLAT_3D_DEFAULTS.faceColor,
    faceHighlightColor: HEADLINE_FLAT_3D_DEFAULTS.faceHighlightColor,

    edgeColor: HEADLINE_FLAT_3D_DEFAULTS.edgeColor,
    edgeDarkColor: HEADLINE_FLAT_3D_DEFAULTS.edgeDarkColor,
    shadowColor: HEADLINE_FLAT_3D_DEFAULTS.shadowColor,

    rimColor: HEADLINE_FLAT_3D_DEFAULTS.rimColor,
    faceShadowColor: HEADLINE_FLAT_3D_DEFAULTS.faceShadowColor,

    glow: HEADLINE_FLAT_3D_DEFAULTS.glow,
    glowColor: HEADLINE_FLAT_3D_DEFAULTS.glowColor,

    lighting: {
      enabled: true,
      topLight: 0.72,
      sideLight: 0.46,
      bottomShade: 0.62,
      bevelStrength: 0.48,
    },

    mobile: {
      layers: 14,
      zStep: 1.1,
      frame: 0.5,
      glow: 0,
      lighting: {
        topLight: 0.62,
        sideLight: 0.38,
        bottomShade: 0.52,
        bevelStrength: 0.36,
      },
    },
  },

  transform: {
    skew: 0,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 0,
    extrudeDistance: 0,
    extrudeColor: HEADLINE_FLAT_3D_DEFAULTS.edgeColor,

    align: "center",
    lineHeight: 0.68,
    mobileStyleFocus: "pure3d",
  },
} as const;

export type Flat3dPaletteSource = {
  neutral?: string;
  primary?: string;
  accent?: string;
  bgTo?: string;
  secondary?: string;
  highlight?: string;
};

export type Flat3dPaletteResolvers = {
  normalizePaletteHexString: (value: string, fallback: string) => string;
  normalizeGlassGlowColor: (value: string, fallback: string) => string;
  darkenHex: (hex: string, amount: number) => string;
  lightenHex?: (hex: string, amount: number) => string;
};

function colorWithAlpha(color: string, alpha: number) {
  const trimmed = String(color || "").trim();
  const safeAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));

  if (trimmed.startsWith("#")) {
    const raw = trimmed.slice(1);
    const full =
      raw.length === 3
        ? raw
            .split("")
            .map((part) => part + part)
            .join("")
        : raw.slice(0, 6);
    const parsed = Number.parseInt(full, 16);

    if (Number.isFinite(parsed)) {
      const r = (parsed >> 16) & 255;
      const g = (parsed >> 8) & 255;
      const b = parsed & 255;
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    }
  }

  const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbaMatch) return trimmed || `rgba(0,119,234,${safeAlpha})`;

  const parts = rgbaMatch[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return trimmed;

  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${safeAlpha})`;
}

export function resolveFlat3dPaletteColors(
  source: Partial<Flat3dPaletteSource> | null | undefined,
  resolvers: Flat3dPaletteResolvers
) {
  const paletteSource = source || {};

  const faceColor = resolvers.normalizePaletteHexString(
    String(
      paletteSource.neutral ||
        paletteSource.highlight ||
        paletteSource.primary ||
        HEADLINE_FLAT_3D_DEFAULTS.faceColor
    ),
    HEADLINE_FLAT_3D_DEFAULTS.faceColor
  );

  const faceHighlightColor = resolvers.normalizePaletteHexString(
    String(
      paletteSource.highlight ||
        resolvers.lightenHex?.(faceColor, 16) ||
        HEADLINE_FLAT_3D_DEFAULTS.faceHighlightColor
    ),
    HEADLINE_FLAT_3D_DEFAULTS.faceHighlightColor
  );

  const edgeColor = resolvers.normalizeGlassGlowColor(
    String(
      paletteSource.accent ||
        paletteSource.primary ||
        paletteSource.bgTo ||
        HEADLINE_FLAT_3D_DEFAULTS.edgeColor
    ),
    HEADLINE_FLAT_3D_DEFAULTS.edgeColor
  );

  const edgeDarkColor = resolvers.normalizePaletteHexString(
    resolvers.darkenHex(edgeColor, 28),
    HEADLINE_FLAT_3D_DEFAULTS.edgeDarkColor
  );

  const fallbackShadow = resolvers.darkenHex(edgeColor, 48);

  const shadowColor = resolvers.normalizePaletteHexString(
    String(paletteSource.bgTo || paletteSource.secondary || fallbackShadow),
    fallbackShadow
  );

  return {
    faceColor,
    faceHighlightColor,
    edgeColor,
    edgeDarkColor,
    shadowColor,

    rimColor: HEADLINE_FLAT_3D_DEFAULTS.rimColor,
    faceShadowColor: HEADLINE_FLAT_3D_DEFAULTS.faceShadowColor,
    glowColor: colorWithAlpha(edgeColor, 0.34),
  };
}

export function buildFlat3dHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...FLAT_3D_HEADLINE_PRESET,
    textFx: {
      ...textFx,
      ...FLAT_3D_HEADLINE_PRESET.textFx,
    },
  };
}
