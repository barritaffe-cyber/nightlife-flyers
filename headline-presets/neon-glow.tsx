import React, { type CSSProperties } from "react";

export const NEON_GLOW_PRESET = {
  name: "Premium Neon Glow",

  textStyle: {
    family: "Anton",
    align: "center",
  },

  textFx: {
    uppercase: true,
    bold: true,
    italic: true,
    tracking: -0.055,

    gradient: true,
    color: "#ff2bd6",
    gradFrom: "#ff2bd6",
    gradMid: "#8f5cff",
    gradTo: "#00eaff",

    strokeWidth: 0,
    strokeColor: "transparent",

    glow: 0,
    shadowEnabled: false,
  },

  neon: {
    enabled: true,

    fillFrom: "#ff2bd6",
    fillMid: "#8f5cff",
    fillTo: "#00eaff",

    edgeFrom: "#ff23e6",
    edgeTo: "#00f0ff",

    offsetX: -1,
    offsetY: -2,

    edgeOpacity: 1,
    bloomOpacity: 0.82,
    bloomBlur: 18,
    gradientBlur: 4.5,
    topBloomOpacity: 0.74,
    topBloomBlurRatio: 0.7,
  },

  transform: {
    lineHeight: 0.86,
    tracking: -0.055,
    skew: -6,
    rotate: 0,

    extrudeDepth: 0,
    extrudeAngle: 38,
    extrudeDistance: 0,
    extrudeColor: "#050812",

    align: "center",
    mobileStyleFocus: "neon-glow",
  },
} as const;

export type NeonGlowPreset = typeof NEON_GLOW_PRESET;

export type NeonGlowTextFxLike = {
  alpha?: number;
  bold?: boolean;
  italic?: boolean;
  tracking: number;
  underline?: boolean;
  uppercase?: boolean;
};

export type NeonGlowRichTextRenderer = (
  text: string,
  opts: {
    baseTrackEm: number;
    leadDeltaEm: number;
    lastDeltaEm: number;
    opticalMargin: boolean;
    kerningFix: boolean;
    lineStyle?: CSSProperties;
    lineHeight?: CSSProperties["lineHeight"];
  }
) => React.ReactNode;

export type NeonGlowRenderConfig = {
  bloomBlur: number;
  bloomGradient: string;
  bloomOpacity: number;
  faceGradient: string;
  faceOpacity: number;
  fillOpacity: number;
  gradientBlurStrength: number;
  offsetGradient: string;
  offsetX: number;
  offsetY: number;
  shapeBlur: number;
  shapeLayerStyle: CSSProperties;
  shapeMaskBackground: string;
  shapeOpacity: number;
  topBloomBlur: number;
  topBloomOpacity: number;
};

function clamp(value: unknown, min: number, max: number, fallback = min) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : fallback;
  return Math.max(min, Math.min(max, safeValue));
}

function normalizeHexColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function lightenHexColor(value: unknown, amount: number, fallback: string) {
  const color = normalizeHexColor(value, fallback);
  const hex = color.slice(1);
  const channels = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const lifted = channels.map((channel) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0")
  );

  return `#${lifted.join("")}`;
}

function buildFaceGradient(blur: number, colors: { fillFrom: string; fillMid: string; fillTo: string }) {
  const { fillFrom, fillMid, fillTo } = colors;
  const svgBlur = Math.max(14, Math.min(52, 14 + blur * 2.1));
  const filterDef = `
        <filter id="b" x="-90" y="-90" width="280" height="280" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="${svgBlur.toFixed(2)}" edgeMode="duplicate" result="blurred"/>
          <feColorMatrix in="blurred" type="saturate" values="1.36"/>
        </filter>
      `;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${fillFrom}"/>
          <stop offset="24%" stop-color="${fillFrom}"/>
          <stop offset="24%" stop-color="${fillMid}"/>
          <stop offset="58%" stop-color="${fillMid}"/>
          <stop offset="58%" stop-color="${fillTo}"/>
          <stop offset="100%" stop-color="${fillTo}"/>
        </linearGradient>
        ${filterDef}
      </defs>
      <rect x="-90" y="-90" width="280" height="280" fill="url(#g)" filter="url(#b)"/>
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function buildNeonGlowHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...NEON_GLOW_PRESET,
    textFx: {
      ...textFx,
      ...NEON_GLOW_PRESET.textFx,
      tracking: NEON_GLOW_PRESET.transform.tracking,
    },
  };
}

export function buildNeonGlowRenderConfig({
  bloomBlur,
  bloomFrom,
  bloomMid,
  bloomTo,
  fillFrom,
  fillMid,
  fillTo,
  gradientBlur,
  faceOpacity,
  fillOpacity,
  shapeBlur,
  shapeLayerStyle,
  shapeMaskBackground,
  shapeOpacity,
}: {
  bloomBlur: unknown;
  bloomFrom?: string;
  bloomMid?: string;
  bloomTo?: string;
  fillFrom?: string;
  fillMid?: string;
  fillTo?: string;
  gradientBlur: unknown;
  faceOpacity?: unknown;
  fillOpacity?: unknown;
  shapeBlur?: unknown;
  shapeLayerStyle?: CSSProperties;
  shapeMaskBackground?: string;
  shapeOpacity?: unknown;
}): NeonGlowRenderConfig {
  const preset = NEON_GLOW_PRESET.neon;
  const safeBloomBlur = clamp(bloomBlur, 0, 32, preset.bloomBlur);
  const safeGradientBlur = clamp(gradientBlur, 0, 18, preset.gradientBlur);
  const safeFaceOpacity = clamp(faceOpacity, 0, 1, 1);
  const safeFillOpacity = clamp(fillOpacity, 0, 1, 0);
  const safeShapeBlur = clamp(shapeBlur, 0, 48, 0);
  const safeShapeOpacity = clamp(shapeOpacity, 0, 1, 0);
  const resolvedFillFrom = normalizeHexColor(fillFrom, preset.fillFrom);
  const resolvedFillMid = normalizeHexColor(fillMid, preset.fillMid);
  const resolvedFillTo = normalizeHexColor(fillTo, preset.fillTo);
  const resolvedBloomFrom = normalizeHexColor(bloomFrom, preset.edgeFrom);
  const resolvedBloomMid = normalizeHexColor(bloomMid, resolvedFillMid);
  const resolvedBloomTo = normalizeHexColor(bloomTo, resolvedFillTo);
  const offsetTop = lightenHexColor(resolvedFillFrom, 0.42, preset.fillFrom);
  const offsetBottom = lightenHexColor(resolvedFillFrom, 0.18, preset.fillFrom);

  return {
    bloomBlur: safeBloomBlur,
    bloomGradient: `linear-gradient(135deg, ${resolvedBloomFrom} 0%, ${resolvedBloomMid} 46%, ${resolvedBloomTo} 100%)`,
    bloomOpacity: preset.bloomOpacity * safeFaceOpacity,
    faceGradient: buildFaceGradient(safeGradientBlur, {
      fillFrom: resolvedFillFrom,
      fillMid: resolvedFillMid,
      fillTo: resolvedFillTo,
    }),
    faceOpacity: safeFaceOpacity,
    fillOpacity: safeFillOpacity,
    gradientBlurStrength: safeGradientBlur,
    offsetGradient: `linear-gradient(180deg, ${offsetTop} 0%, ${offsetBottom} 100%)`,
    offsetX: preset.offsetX,
    offsetY: preset.offsetY,
    shapeBlur: safeShapeBlur,
    shapeLayerStyle: shapeLayerStyle || {},
    shapeMaskBackground: shapeMaskBackground || "none",
    shapeOpacity: safeShapeOpacity,
    topBloomBlur: Math.max(0, Math.min(18, safeBloomBlur * preset.topBloomBlurRatio)),
    topBloomOpacity: preset.topBloomOpacity * safeFaceOpacity,
  };
}

export function buildNeonGlowBaseTextStyle(
  fontSize: CSSProperties["fontSize"],
  overrides: CSSProperties = {},
  preset: NeonGlowPreset = NEON_GLOW_PRESET
): CSSProperties {
  const transform = preset.transform;

  return {
    fontFamily: `"${preset.textStyle.family}", Impact, "Arial Black", sans-serif`,
    fontSize,
    fontWeight: 900,
    fontStyle: "italic",
    lineHeight: transform.lineHeight,
    letterSpacing: `${transform.tracking}em`,
    textTransform: "uppercase",
    whiteSpace: "pre-line",
    ...overrides,
  };
}

export function buildNeonGlowLayerBase(
  overrides: CSSProperties = {}
): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    whiteSpace: "pre-line",
    pointerEvents: "none",
    ...overrides,
  };
}

export function NeonGlowHeadlineLayers({
  align,
  config,
  fontFamily,
  fontSize,
  headlineText,
  kerningFix,
  leadTrackDelta,
  lastTrackDelta,
  opticalMargin,
  renderHeadlineRich,
  textShadow,
  textFx,
}: {
  align: "left" | "center" | "right";
  config: NeonGlowRenderConfig;
  fontFamily: string;
  fontSize: number;
  headlineText: string;
  kerningFix: boolean;
  leadTrackDelta: number;
  lastTrackDelta: number;
  opticalMargin: boolean;
  renderHeadlineRich: NeonGlowRichTextRenderer;
  textShadow?: CSSProperties["textShadow"];
  textFx: NeonGlowTextFxLike;
}) {
  const lineHeight = NEON_GLOW_PRESET.transform.lineHeight;
  const paintBleedPx = Math.ceil(
    Math.max(
      18,
      config.bloomBlur + 10,
      config.gradientBlurStrength * 2 + 8,
      Math.abs(Number(textFx.tracking) || 0) * fontSize * 2.5
    )
  );
  const layerBase: CSSProperties = {
    position: "absolute",
    inset: 0,
    fontFamily,
    fontSize,
    lineHeight,
    whiteSpace: "pre-wrap",
    display: "block",
    width: "100%",
    boxSizing: "content-box",
    marginLeft: `-${paintBleedPx}px`,
    minWidth: "fit-content",
    maxWidth: "none",
    paddingLeft: `${paintBleedPx}px`,
    paddingRight: `${paintBleedPx}px`,
    letterSpacing: `${textFx.tracking}em`,
    textAlign: align,
    textTransform: textFx.uppercase ? "uppercase" : "none",
    fontWeight: textFx.bold ? 900 : 700,
    fontStyle: textFx.italic ? "italic" : "normal",
    textDecorationLine: textFx.underline ? "underline" : "none",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    pointerEvents: "none",
    userSelect: "none",
    overflow: "visible",
    WebkitFontSmoothing: "antialiased",
    textRendering: "geometricPrecision",
  };
  const renderTextLayer = (
    key: string,
    style: CSSProperties,
    lineStyle: CSSProperties = {}
  ) => (
    <h1
      key={`headline-neon-glow-${key}`}
      aria-hidden="true"
      data-neon-glow-layer={key}
      className="pointer-events-none absolute inset-0 font-black select-none"
      style={{ ...layerBase, ...style }}
    >
      {renderHeadlineRich(headlineText, {
        baseTrackEm: textFx.tracking,
        leadDeltaEm: leadTrackDelta,
        lastDeltaEm: lastTrackDelta,
        opticalMargin,
        kerningFix,
        lineHeight,
        lineStyle: {
          display: "block",
          width: "100%",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          ...lineStyle,
        },
      })}
    </h1>
  );
  const clippedGradientStyle = (backgroundImage: string): CSSProperties => ({
    backgroundImage,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  });
  const shadowVisible = !!textShadow && textShadow !== "none";

  return (
    <div className="relative" style={{ zIndex: 3, isolation: "isolate" }}>
      <h1
        aria-hidden="true"
        className="relative font-black select-none"
        style={{
          fontFamily,
          fontSize,
          lineHeight,
          whiteSpace: "pre-wrap",
          display: "block",
          minWidth: "fit-content",
          maxWidth: "100%",
          letterSpacing: `${textFx.tracking}em`,
          textTransform: textFx.uppercase ? "uppercase" : "none",
          fontWeight: textFx.bold ? 900 : 700,
          fontStyle: textFx.italic ? "italic" : "normal",
          textDecorationLine: textFx.underline ? "underline" : "none",
          visibility: "hidden",
        }}
      >
        {renderHeadlineRich(headlineText, {
          baseTrackEm: textFx.tracking,
          leadDeltaEm: leadTrackDelta,
          lastDeltaEm: lastTrackDelta,
          opticalMargin,
          kerningFix,
          lineHeight,
          lineStyle: { display: "block", width: "100%" },
        })}
      </h1>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-visible"
        style={{ opacity: textFx.alpha ?? 1, zIndex: 3 }}
      >
        {shadowVisible &&
          renderTextLayer(
            "shadow",
            {
              zIndex: 0,
              color: "rgba(0,0,0,0.01)",
              WebkitTextFillColor: "rgba(0,0,0,0.01)",
              textShadow,
            },
            {
              color: "rgba(0,0,0,0.01)",
              WebkitTextFillColor: "rgba(0,0,0,0.01)",
              textShadow,
            }
          )}
        {renderTextLayer("bloom", {
          zIndex: 1,
          ...clippedGradientStyle(config.bloomGradient),
          filter: `blur(${config.bloomBlur.toFixed(1)}px) saturate(1.85) brightness(1.18)`,
          opacity: config.bloomOpacity,
          transform: `translate(${config.offsetX.toFixed(1)}px, ${config.offsetY.toFixed(1)}px)`,
          mixBlendMode: "screen",
        })}
        {config.fillOpacity > 0 &&
          renderTextLayer(
            "fill",
            {
              zIndex: 2,
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              filter: "saturate(1.05)",
              opacity: config.fillOpacity,
              mixBlendMode: "screen",
            },
            {
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
            }
          )}
        {config.shapeOpacity > 0 && config.shapeMaskBackground !== "none" &&
          renderTextLayer("shape-mask", {
            zIndex: 2,
            ...clippedGradientStyle(config.shapeMaskBackground),
            backgroundSize: "100% 100%",
            opacity: config.shapeOpacity,
            ...config.shapeLayerStyle,
          })}
        {renderTextLayer("face", {
          zIndex: 3,
          ...clippedGradientStyle(config.faceGradient),
          filter: "saturate(1.12)",
          opacity: config.faceOpacity,
          mixBlendMode: "normal",
        })}
        {renderTextLayer("highlight", {
          zIndex: 2,
          ...clippedGradientStyle(config.offsetGradient),
          filter: "brightness(1.14) saturate(1.2)",
          opacity: 0.86 * config.faceOpacity,
          transform: `translate(${config.offsetX.toFixed(1)}px, ${config.offsetY.toFixed(1)}px)`,
          mixBlendMode: "screen",
        })}
        {renderTextLayer("top-bloom", {
          zIndex: 4,
          ...clippedGradientStyle(config.bloomGradient),
          filter: `blur(${config.topBloomBlur.toFixed(1)}px) saturate(2) brightness(1.22)`,
          opacity: config.topBloomOpacity,
          mixBlendMode: "screen",
        })}
      </div>
    </div>
  );
}
