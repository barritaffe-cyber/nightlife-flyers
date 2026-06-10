'use client';
/* eslint-disable @next/next/no-img-element */

import React, { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import {
  buildLuxeGlassHeadlineRenderPreset,
  renderPremiumHeadlineTexture,
  type HeadlineTextureResult,
} from "../preset-renders/luxe-render";

type LuxeHeadlineCanvasRendererProps = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: CSSProperties["fontStyle"];
  lineHeight: number;
  letterSpacingEm: number;
  align: "left" | "center" | "right";
  uppercase: boolean;
  alpha: number;
  primary: string;
  secondary: string;
  highlight: string;
  edge: string;
  strokeWidth: number;
  blur: number;
  glow: number;
  fillAlpha: number;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
};

type RenderedTexture = HeadlineTextureResult & {
  rootWidth: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export default function LuxeHeadlineCanvasRenderer({
  text,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  lineHeight,
  letterSpacingEm,
  align,
  uppercase,
  alpha,
  primary,
  secondary,
  highlight,
  edge,
  strokeWidth,
  blur,
  glow,
  fillAlpha,
  className,
  style,
  fallback,
}: LuxeHeadlineCanvasRendererProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [texture, setTexture] = useState<RenderedTexture | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let frame: number | null = null;

    const render = async () => {
      const root = rootRef.current;
      if (!root) return;

      const measureNode = root.parentElement ?? root;
      const rect = measureNode.getBoundingClientRect();
      const rootWidth = Math.max(1, Math.round(rect.width));
      if (rootWidth <= 1) return;

      const cleanText = uppercase ? text.toUpperCase() : text;
      const preset = buildLuxeGlassHeadlineRenderPreset({
        fontFamily,
        fontWeight,
        letterSpacing: letterSpacingEm * fontSize,
        fontSize,
        primary,
        secondary,
        highlight,
        edge,
        strokeWidth,
        blur,
        glow,
        fillAlpha,
      });

      const rendered = await renderPremiumHeadlineTexture({
        text: cleanText,
        preset,
        fontSize,
        maxWidth: rootWidth,
        pixelRatio: clamp(window.devicePixelRatio || 1, 1, 2),
        align,
        lineHeight,
        fontStyle: String(fontStyle || "normal"),
      });

      if (!cancelled) {
        setTexture({ ...rendered, rootWidth });
        setFailed(false);
      }
    };

    const schedule = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        render().catch((error) => {
          console.error("Luxe headline canvas renderer failed", error);
          if (!cancelled) setFailed(true);
        });
      });
    };

    setFailed(false);
    schedule();
    resizeObserver = new ResizeObserver(schedule);
    if (rootRef.current) resizeObserver.observe(rootRef.current.parentElement ?? rootRef.current);
    document.fonts?.ready.then(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [
    text,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    lineHeight,
    letterSpacingEm,
    align,
    uppercase,
    primary,
    secondary,
    highlight,
    edge,
    strokeWidth,
    blur,
    glow,
    fillAlpha,
  ]);

  const left =
    texture == null
      ? 0
      : align === "right"
        ? texture.rootWidth - texture.logicalWidth + texture.padX
        : align === "center"
          ? (texture.rootWidth - texture.logicalWidth) / 2
          : -texture.padX;

  return (
    <div
      ref={rootRef}
      className={className}
      data-glass-renderer={failed ? "luxe-canvas-fallback" : "luxe-canvas"}
      style={{
        ...style,
        width: "100%",
        minWidth: 0,
        overflow: "visible",
      }}
    >
      {texture && !failed ? (
        <img
          src={texture.dataUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            left,
            top: -texture.padY,
            width: texture.logicalWidth,
            height: texture.logicalHeight,
            maxWidth: "none",
            maxHeight: "none",
            opacity: alpha,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
