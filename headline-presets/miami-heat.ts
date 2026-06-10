import type { CSSProperties } from "react";

import {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
} from "./headline-final-renderer";

export const MIAMI_HEAT_COLOR_STOPS = {
  top: "#FFE06A",
  mid: "#FF9700",
  base: "#B92A00",
} as const;

export const MIAMI_HEAT_MANUAL_DEFAULTS = {
  bloom: {
    color: "#f4010d",
    strokeWidth: 6.0,
    blur: 72,
    opacity: 0.46,
  },
  innerGlow: {
    color: "transparent",
    blur: 0,
    opacity: 0,
  },
  depthShadow: {
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    opacity: 0,
  },
  faceHighlight: {
    opacity: 0,
  },
} as const;

export const MIAMI_HEAT_HEADLINE_PRESET = {
  transform: {
    mobileStyleFocus: "premium-heat-block",
  },
} as const;

export function buildMiamiHeatHeadlinePreset<TTextFx extends object>(
  textFx: TTextFx
) {
  return {
    ...MIAMI_HEAT_HEADLINE_PRESET,
    textFx,
  };
}

export type MiamiHeatTextFx = {
  alpha?: number;
  gradient?: boolean;
  color?: string;
  gradFrom?: string;
  gradMid?: string;
  gradTo?: string;
  strokeWidth?: number;
  strokeColor?: string;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
};

export type MiamiHeatCanvasLayerSpec = {
  key: string;
  style: CSSProperties;
  lineStyle: CSSProperties;
};

export type MiamiHeatCanvasRenderConfig = {
  textFx: MiamiHeatTextFx;
  dragging?: boolean;
  shadowEnabled?: boolean;
  shadowText?: string;
};

export type MiamiHeatCanvasRenderState = {
  layerSpecs: MiamiHeatCanvasLayerSpec[];
};

function finiteNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function paintLineStyle(style: CSSProperties): CSSProperties {
  return {
    color: style.color,
    WebkitTextFillColor: style.WebkitTextFillColor,
    WebkitTextStrokeWidth: style.WebkitTextStrokeWidth,
    WebkitTextStrokeColor: style.WebkitTextStrokeColor,
    paintOrder: style.paintOrder,
    textShadow: style.textShadow,
    mixBlendMode: style.mixBlendMode,
    opacity: style.opacity,
    zIndex: style.zIndex,
  };
}

export function buildMiamiHeatCanvasRenderState({
  textFx,
  dragging = false,
  shadowEnabled,
  shadowText = "none",
}: MiamiHeatCanvasRenderConfig): MiamiHeatCanvasRenderState {
  const textAlpha = finiteNumber(textFx.alpha, 1);
  const faceColor = textFx.color || textFx.gradMid || "#FFFFFF";
  const strokeWidth = Math.max(0, finiteNumber(textFx.strokeWidth, 0));
  const shouldRenderShadow =
    !dragging &&
    shadowEnabled !== false &&
    String(shadowText || "").trim() !== "" &&
    String(shadowText || "").trim().toLowerCase() !== "none";

  const paintStyle: CSSProperties = {
    color: faceColor,
    WebkitTextFillColor: faceColor,
  };

  const layerSpecs = [
    {
      key: "headline-miami-heat-main",
      enabled: true,
      style: {
        ...paintStyle,
        WebkitTextStrokeWidth: strokeWidth > 0 ? `${strokeWidth}px` : undefined,
        WebkitTextStrokeColor: strokeWidth > 0 ? textFx.strokeColor : undefined,
        paintOrder: strokeWidth > 0 ? "stroke fill" : undefined,
        textShadow: shouldRenderShadow ? shadowText : undefined,
        opacity: textAlpha,
        zIndex: 1,
      } satisfies CSSProperties,
    },
  ];

  return {
    layerSpecs: layerSpecs
      .filter((layer) => layer.enabled)
      .map((layer) => ({
        key: layer.key,
        style: layer.style,
        lineStyle: paintLineStyle(layer.style),
      })),
  };
}

export type MiamiHeatFinalRenderRasterizer = HeadlineFinalRenderRasterizer;
export type MiamiHeatFinalRenderConfig = HeadlineFinalRenderConfig;

export const MIAMI_HEAT_FINAL_RENDER_PAINT_PADDING_PX = 180;

export function shouldRenderMiamiHeatFinalHeadline(
  config: Pick<MiamiHeatFinalRenderConfig, "enabled" | "headlineHidden" | "headline">
) {
  return shouldRenderHeadlineFinalRaster(config);
}

export function renderMiamiHeatFinalHeadline(config: MiamiHeatFinalRenderConfig) {
  return renderHeadlineFinalRaster({
    ...config,
    paintPaddingPx: config.paintPaddingPx ?? MIAMI_HEAT_FINAL_RENDER_PAINT_PADDING_PX,
  });
}
