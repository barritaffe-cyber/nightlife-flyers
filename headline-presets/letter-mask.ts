import type { CSSProperties } from "react";

export type LetterMaskTextFx = {
  alpha?: number;
  color?: string;
  gradFrom?: string;
  gradMid?: string;
  gradTo?: string;
  strokeWidth?: number;
  strokeColor?: string;
};

export type LetterMaskLayerSpec = {
  key: string;
  style: CSSProperties;
  lineStyle: CSSProperties;
  glyphStyle: CSSProperties;
};

export type LetterMaskRenderConfig = {
  textFx: LetterMaskTextFx;
  shadowText?: string;
};

export type LetterMaskRenderState = {
  layerSpecs: LetterMaskLayerSpec[];
  gradient: string;
};

function finiteNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function buildLetterMaskRenderState({
  textFx,
  shadowText = "none",
}: LetterMaskRenderConfig): LetterMaskRenderState {
  const textAlpha = finiteNumber(textFx.alpha, 1);
  const fillColor = textFx.color || "#FFFFFF";
  const gradFrom = textFx.gradFrom || fillColor;
  const gradMid = textFx.gradMid || gradFrom;
  const gradTo = textFx.gradTo || fillColor;
  const strokeWidth = Math.max(0, finiteNumber(textFx.strokeWidth, 0));
  const hasShadow =
    String(shadowText || "").trim() !== "" &&
    String(shadowText || "").trim().toLowerCase() !== "none";

  const gradient = `linear-gradient(180deg, ${gradFrom} 0%, ${gradFrom} 28%, ${gradMid} 52%, ${gradTo} 76%, ${gradTo} 100%)`;

  return {
    gradient,
    layerSpecs: [
      {
        key: "headline-letter-mask-main",
        style: {
          opacity: textAlpha,
          zIndex: 1,
        },
        lineStyle: {},
        glyphStyle: {
          color: "transparent",
          WebkitTextFillColor: "transparent",
          backgroundImage: gradient,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextStrokeWidth: strokeWidth > 0 ? `${strokeWidth}px` : undefined,
          WebkitTextStrokeColor: strokeWidth > 0 ? textFx.strokeColor : undefined,
          paintOrder: strokeWidth > 0 ? "stroke fill" : undefined,
          textShadow: hasShadow ? shadowText : undefined,
        },
      },
    ],
  };
}
