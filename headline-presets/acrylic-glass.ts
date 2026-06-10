import type { CSSProperties } from "react";
import { NEON_GLOW_PRESET } from "./neon-glow";

export const ACRYLIC_GLASS_STYLE_FOCUS = "acrylic-glass" as const;
export const ACRYLIC_GLASS_LEGACY_STYLE_FOCUS = "mobile-glass" as const;

export const ACRYLIC_GLASS_HEADLINE_PRESET = {
  ...NEON_GLOW_PRESET,
  name: "Acrylic Glass",

  textFx: {
    ...NEON_GLOW_PRESET.textFx,
    gradient: false,
    color: "rgba(255,255,255,.16)",
    strokeWidth: 1,
    strokeColor: "rgba(255,255,255,.92)",
    shadowEnabled: true,
    shadowColor: "rgba(0,0,0,.55)",
    shadowBlur: 12,
    shadowOffsetX: 0,
    shadowOffsetY: 8,
  },

  acrylic: {
    enabled: true,

    fill: "rgba(255,255,255,.16)",
    fillOpacity: 0.72,

    topHighlight: "rgba(255,255,255,.95)",
    softHighlight: "rgba(185,245,255,.32)",

    edgeLight: "rgba(255,255,255,.92)",
    edgeTint: "rgba(120,230,255,.38)",

    innerDark: "rgba(0,12,22,.55)",

    glowColor: "rgba(145,235,255,.32)",
    glowBlur: 6,
    glowOpacity: 0.42,

    depthFill: "rgba(255,255,255,.08)",
    depthEdge: "rgba(0,18,28,.48)",
    depthOffsetX: 3,
    depthOffsetY: 5,
    depthOpacity: 0.48,

    upperBloomBlur: 10,
    upperBloomOpacity: 0.24,
    upperBloomBand: 26,
    upperBloomFeather: 16,
    upperBloomOffsetX: 0,
    upperBloomOffsetY: 0,

    reflectionBlur: 5,
    reflectionOpacity: 0.42,
  },

  transform: {
    ...NEON_GLOW_PRESET.transform,
    mobileStyleFocus: ACRYLIC_GLASS_STYLE_FOCUS,
  },
} as const;

export type AcrylicGlassPreset = typeof ACRYLIC_GLASS_HEADLINE_PRESET;

const clip: CSSProperties = {
  color: "transparent",
  WebkitTextFillColor: "transparent",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
};

function clippedPaint(backgroundImage: string): CSSProperties {
  return {
    ...clip,
    backgroundImage,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
  };
}

function acrylicReflectionShapesBackground(
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
) {
  const a = preset.acrylic;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <filter id="reflection-blur" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="${a.reflectionBlur}" edgeMode="duplicate"/>
        </filter>
      </defs>
      <rect width="100" height="100" fill="transparent"/>
      <g filter="url(#reflection-blur)">
        <path d="M-6 28 C18 19 38 24 57 17 C76 10 91 13 108 19 L108 31 C84 25 69 27 50 36 C29 46 12 38 -6 47 Z" fill="${a.topHighlight}"/>
        <path d="M-8 60 C19 51 35 55 54 48 C73 40 88 41 108 49 L108 63 C86 56 72 58 53 69 C29 82 12 72 -8 82 Z" fill="${a.softHighlight}"/>
        <path d="M8 104 L34 16 L45 16 L19 104 Z" fill="${a.edgeTint}"/>
        <path d="M58 102 L92 8 L101 8 L68 102 Z" fill="${a.topHighlight}"/>
        <ellipse cx="31" cy="35" rx="21" ry="8" fill="${a.softHighlight}"/>
        <ellipse cx="74" cy="72" rx="24" ry="9" fill="${a.edgeTint}"/>
      </g>
    </svg>
  `;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function buildAcrylicGlassGlowStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    position: "absolute",
    inset: 0,
    color: "transparent",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: `2px ${a.glowColor}`,
    filter: `blur(${a.glowBlur}px)`,
    opacity: a.glowOpacity,
    mixBlendMode: "screen",
    pointerEvents: "none",
    ...overrides,
  };
}

export function buildAcrylicGlassInnerDarkStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    position: "absolute",
    inset: 0,
    color: "transparent",
    WebkitTextFillColor: "transparent",
    WebkitTextStroke: `1.25px ${a.innerDark}`,
    transform: "translate(1.5px, 2px)",
    opacity: 0.82,
    pointerEvents: "none",
    ...overrides,
  };
}

export function buildAcrylicGlassTranslucent3DStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    position: "absolute",
    inset: 0,
    color: a.depthFill,
    WebkitTextFillColor: a.depthFill,
    WebkitTextStroke: `2px ${a.depthEdge}`,
    opacity: a.depthOpacity,
    transform: `translate(${a.depthOffsetX}px, ${a.depthOffsetY}px)`,
    textShadow: `
      0 1px 0 rgba(255,255,255,.18),
      0 5px 10px rgba(0,0,0,.38)
    `,
    pointerEvents: "none",
    ...overrides,
  };
}

export function buildAcrylicGlassMainStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    ...clippedPaint(`
      linear-gradient(
        180deg,
        rgba(255,255,255,.34) 0%,
        ${a.fill} 42%,
        rgba(255,255,255,.06) 72%,
        rgba(120,230,255,.12) 100%
      )
    `),
    opacity: a.fillOpacity,
    WebkitTextStroke: `.85px ${a.edgeLight}`,
    textShadow: `
      0 1px 0 rgba(255,255,255,.68),
      0 -1px 0 ${a.edgeTint},
      0 8px 14px rgba(0,0,0,.45)
    `,
    ...overrides,
  };
}

export function buildAcrylicGlassHighlightStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    position: "absolute",
    inset: 0,
    ...clippedPaint(`
      linear-gradient(
        180deg,
        ${a.topHighlight} 0%,
        ${a.softHighlight} 7%,
        transparent 22%,
        transparent 100%
      ),
      linear-gradient(
        105deg,
        transparent 0%,
        transparent 35%,
        rgba(255,255,255,.82) 43%,
        ${a.softHighlight} 50%,
        transparent 61%,
        transparent 100%
      )
    `),
    opacity: 0.72,
    mixBlendMode: "screen",
    pointerEvents: "none",
    ...overrides,
  };
}

export function buildAcrylicGlassUpperBloomStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET,
  upperBloomBlur: number = preset.acrylic.upperBloomBlur
): CSSProperties {
  const a = preset.acrylic;
  const safeBlur = Math.max(0, Math.min(32, Number(upperBloomBlur) || 0));
  const band = Math.max(10, Math.min(48, Number(a.upperBloomBand) || 26));
  const feather = Math.max(4, Math.min(32, Number(a.upperBloomFeather) || 18));
  const fadeEnd = Math.min(100, band + feather);

  return {
    position: "absolute",
    inset: 0,
    ...clippedPaint(`
      linear-gradient(
        180deg,
        ${a.topHighlight} 0%,
        ${a.topHighlight} ${Math.max(1, band * 0.42).toFixed(1)}%,
        ${a.softHighlight} ${band}%,
        rgba(255,255,255,0) ${fadeEnd}%,
        rgba(255,255,255,0) 100%
      )
    `),
    WebkitTextStroke: `.7px ${a.softHighlight}`,
    filter: `blur(${safeBlur}px) brightness(1.08)`,
    opacity: a.upperBloomOpacity,
    transform: `translate(${a.upperBloomOffsetX}px, ${a.upperBloomOffsetY}px)`,
    mixBlendMode: "screen",
    textShadow: `
      0 0 ${Math.max(3, safeBlur * 0.72).toFixed(1)}px ${a.topHighlight},
      0 0 ${Math.max(6, safeBlur * 1.28).toFixed(1)}px ${a.edgeTint}
    `,
    pointerEvents: "none",
    ...overrides,
  };
}

export function buildAcrylicGlassReflectionStyle(
  overrides: CSSProperties = {},
  preset: AcrylicGlassPreset = ACRYLIC_GLASS_HEADLINE_PRESET
): CSSProperties {
  const a = preset.acrylic;

  return {
    position: "absolute",
    inset: 0,
    ...clippedPaint(acrylicReflectionShapesBackground(preset)),
    opacity: a.reflectionOpacity,
    mixBlendMode: "screen",
    pointerEvents: "none",
    ...overrides,
  };
}
