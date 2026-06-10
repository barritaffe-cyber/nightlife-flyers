'use client';
/* eslint-disable @next/next/no-img-element */

import React, { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

type PixiModule = typeof import("pixi.js");

type GlassLayerConfig = {
  enabled?: boolean;
  opacity?: number;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  color?: string;
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  width?: number;
  size?: number;
  positions?: ReadonlyArray<{ readonly x?: number; readonly y?: number }>;
};

type GlassPresetConfig = {
  primaryColor?: string;
  secondaryColor?: string;
  highlightColor?: string;
  edgeColor?: string;
  rimColor?: string;
  shadowColor?: string;
  bevelStrength?: number;
  refraction?: number;
  reflectionOpacity?: number;
  rimLight?: number;
  glow?: number;
  fillAlpha?: number;
  layers?: {
    depthShadow?: GlassLayerConfig;
    backWall?: GlassLayerConfig;
    rimStroke?: GlassLayerConfig;
    rimHotEdge?: GlassLayerConfig;
    outerGlow?: GlassLayerConfig;
    glints?: GlassLayerConfig;
    hotRimGlow?: GlassLayerConfig;
  };
};

type GlassHeadlinePixiRendererProps = {
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
  bleedX: number;
  bleedY: number;
  glass: GlassPresetConfig;
  className?: string;
  style?: CSSProperties;
  fallback?: ReactNode;
};

type TextMaskLayout = {
  canvas: HTMLCanvasElement;
  scale: number;
  width: number;
  height: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  textBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const FILTER_VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}`;

const GLASS_FRAGMENT = `in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uAlpha;
uniform float uBevel;
uniform float uRimPower;
uniform float uRefraction;
uniform float uReflection;
uniform float uRimLight;
uniform float uTime;
uniform float uFillAlpha;
uniform vec3 uPink;
uniform vec3 uPurple;
uniform vec3 uHighlight;
uniform vec3 uEdge;

float textMask(vec2 uv)
{
  return texture(uTexture, uv).a;
}

float specularBand(float value, float center, float width)
{
  return smoothstep(center - width, center, value) * (1.0 - smoothstep(center, center + width, value));
}

void main()
{
  vec2 uv = vTextureCoord;
  float alpha = textMask(uv);

  if (alpha < 0.012) {
    discard;
  }

  float bevel = max(uBevel, 0.0008);
  float left = textMask(uv - vec2(bevel, 0.0));
  float right = textMask(uv + vec2(bevel, 0.0));
  float up = textMask(uv - vec2(0.0, bevel));
  float down = textMask(uv + vec2(0.0, bevel));

  vec2 gradient = vec2(right - left, down - up);
  float gradientStrength = min(1.0, length(gradient) * 3.2);
  vec2 normal = length(gradient) > 0.0001 ? normalize(gradient) : vec2(0.0, 0.0);

  float edge = clamp(gradientStrength * 1.55 + (1.0 - smoothstep(0.08, 0.98, alpha)) * 0.28, 0.0, 1.0);
  float rim = pow(edge, max(0.7, uRimPower));
  float topLight = max(dot(normal, normalize(vec2(-0.58, -0.82))), 0.0) * gradientStrength;
  float lowerShade = max(dot(normal, normalize(vec2(0.62, 0.78))), 0.0) * gradientStrength;

  vec3 darkCavity = vec3(0.012, 0.0, 0.045);
  vec3 body = mix(uPurple, uPink, smoothstep(0.05, 0.96, uv.y));
  float interior = smoothstep(0.12, 0.92, alpha) * (1.0 - edge * 0.55);
  vec3 color = darkCavity + body * (0.09 + uFillAlpha * 0.48) * interior;

  float refractedX = uv.x + normal.x * uRefraction * 0.11;
  float refractedY = uv.y + normal.y * uRefraction * 0.07;
  float planeCoord = refractedY - refractedX * 0.34;
  float hardReflection = specularBand(planeCoord, 0.19, 0.032);
  float lowerReflection = specularBand(planeCoord, 0.47, 0.04);
  float upperSheen = specularBand(uv.y + uv.x * 0.11, 0.18, 0.095) * (1.0 - smoothstep(0.18, 0.82, uv.y));
  float edgeFlash = specularBand(fract((uv.x * 1.8 - uv.y * 0.42) * 2.6), 0.62, 0.025) * edge;

  vec3 rimColor = mix(uEdge, uHighlight, clamp(0.28 + topLight * 0.72, 0.0, 1.0));
  color += rim * rimColor * (1.34 * uRimLight);
  color += topLight * uHighlight * 0.88;
  color += hardReflection * uHighlight * (0.92 * uReflection);
  color += lowerReflection * mix(uHighlight, uPink, 0.22) * (0.46 * uReflection);
  color += upperSheen * uHighlight * (0.26 * uReflection);
  color += edgeFlash * mix(uPink, uPurple, 0.38) * (0.22 * uReflection);
  color -= lowerShade * vec3(0.022, 0.0, 0.064) * 1.5;

  float reflectionAlpha = hardReflection * 0.24 + lowerReflection * 0.14 + upperSheen * 0.08 + edgeFlash * 0.08;
  float glassAlpha = alpha * uAlpha * clamp((uFillAlpha * 1.08) * interior + rim * 0.56 + topLight * 0.15 + reflectionAlpha, 0.025, 0.86);
  finalColor = vec4(color * glassAlpha, glassAlpha);
}`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function colorToRgb(color: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!color) return fallback;
  const trimmed = color.trim();

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
      return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255];
    }
  }

  const channels = trimmed.match(/rgba?\(([^)]+)\)/i)?.[1]?.split(",").map((part) => Number.parseFloat(part));
  if (channels && channels.length >= 3 && channels.slice(0, 3).every(Number.isFinite)) {
    return [clamp(channels[0], 0, 255) / 255, clamp(channels[1], 0, 255) / 255, clamp(channels[2], 0, 255) / 255];
  }

  return fallback;
}

function colorToHex(color: string | undefined, fallback: number) {
  const [r, g, b] = colorToRgb(color, [
    ((fallback >> 16) & 255) / 255,
    ((fallback >> 8) & 255) / 255,
    (fallback & 255) / 255,
  ]);
  return (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
}

function layerOpacity(layer: GlassLayerConfig | undefined, fallback: number, alpha: number) {
  if (layer?.enabled === false) return 0;
  return clamp((Number(layer?.opacity ?? fallback) || fallback) * alpha, 0, 1);
}

function getCanvasFont(
  fontStyle: CSSProperties["fontStyle"],
  fontWeight: number | string,
  fontSize: number,
  fontFamily: string
) {
  const family = fontFamily.includes(" ") ? `"${fontFamily.replaceAll('"', "")}"` : fontFamily;
  return `${fontStyle || "normal"} ${fontWeight || 900} ${fontSize}px ${family}`;
}

function measureTrackedText(ctx: CanvasRenderingContext2D, text: string, letterSpacingPx: number) {
  if (!text) return 0;
  let width = 0;
  for (let i = 0; i < text.length; i += 1) {
    width += ctx.measureText(text[i]).width;
    if (i < text.length - 1) width += letterSpacingPx;
  }
  return width;
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number
) {
  let cursor = x;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + (i < text.length - 1 ? letterSpacingPx : 0);
  }
}

function buildTextMask({
  width,
  height,
  text,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  lineHeight,
  letterSpacingEm,
  align,
  uppercase,
  bleedX,
  bleedY,
}: Omit<GlassHeadlinePixiRendererProps, "glass" | "fallback" | "className" | "style" | "alpha"> & {
  width: number;
  height: number;
}): TextMaskLayout {
  const scale = clamp(window.devicePixelRatio || 1, 1, 2.5);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable for Glass headline mask.");
  }

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = getCanvasFont(fontStyle, fontWeight, fontSize, fontFamily);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";

  const lines = (uppercase ? text.toUpperCase() : text).split("\n");
  const letterSpacingPx = letterSpacingEm * fontSize;
  const lineAdvance = Math.max(fontSize * 0.5, fontSize * lineHeight);
  const probe = ctx.measureText("HMgjyp");
  const ascent = probe.actualBoundingBoxAscent || fontSize * 0.78;
  const descent = probe.actualBoundingBoxDescent || fontSize * 0.22;
  const glyphHeight = ascent + descent;
  const baselineOffset = Math.max(ascent, (lineAdvance - glyphHeight) * 0.5 + ascent);
  const contentX = Math.max(0, bleedX);
  const contentY = Math.max(0, bleedY);
  const contentWidth = Math.max(1, width - contentX * 2);
  const contentHeight = Math.max(1, height - contentY * 2);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  lines.forEach((line, index) => {
    const lineWidth = measureTrackedText(ctx, line, letterSpacingPx);
    const x =
      align === "right"
        ? contentX + contentWidth - lineWidth
        : align === "left"
        ? contentX
        : contentX + (contentWidth - lineWidth) * 0.5;
    const baseline = contentY + baselineOffset + index * lineAdvance;

    drawTrackedText(ctx, line, x, baseline, letterSpacingPx);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + lineWidth);
    minY = Math.min(minY, baseline - ascent);
    maxY = Math.max(maxY, baseline + descent);
  });

  return {
    canvas,
    scale,
    width,
    height,
    contentX,
    contentY,
    contentWidth,
    contentHeight,
    textBounds: {
      x: Number.isFinite(minX) ? minX : contentX,
      y: Number.isFinite(minY) ? minY : contentY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    },
  };
}

function createGlassFilter(
  PIXI: PixiModule,
  layout: TextMaskLayout,
  glass: GlassPresetConfig,
  alpha: number
) {
  const pink = colorToRgb(glass.primaryColor || glass.rimColor, [1, 0.12, 0.78]);
  const purple = colorToRgb(glass.secondaryColor, [0.45, 0.12, 1]);
  const highlight = colorToRgb(glass.highlightColor, [1, 0.84, 1]);
  const edge = colorToRgb(glass.edgeColor || glass.rimColor || glass.primaryColor, [1, 0.2, 0.84]);
  const minDimension = Math.max(1, Math.min(layout.width, layout.height));
  const bevelPx = 1.5 + clamp(Number(glass.bevelStrength ?? 0.9), 0.1, 1.8) * 5.5;

  return new PIXI.Filter({
    glProgram: PIXI.GlProgram.from({
      vertex: FILTER_VERTEX,
      fragment: GLASS_FRAGMENT,
      name: "nightlife-glass-headline-filter",
    }),
    resources: {
      glassUniforms: new PIXI.UniformGroup({
        uAlpha: { value: clamp(alpha, 0, 1), type: "f32" },
        uBevel: { value: clamp(bevelPx / minDimension, 0.001, 0.03), type: "f32" },
        uRimPower: { value: 2.35, type: "f32" },
        uRefraction: { value: clamp(Number(glass.refraction ?? 0.32), 0, 1.4), type: "f32" },
        uReflection: { value: clamp(Number(glass.reflectionOpacity ?? 0.48), 0, 1.5), type: "f32" },
        uRimLight: { value: clamp(Number(glass.rimLight ?? 0.95), 0.25, 1.8), type: "f32" },
        uTime: { value: 0, type: "f32" },
        uFillAlpha: { value: clamp(Number(glass.fillAlpha ?? 0.12), 0.01, 0.42), type: "f32" },
        uPink: { value: pink, type: "vec3<f32>" },
        uPurple: { value: purple, type: "vec3<f32>" },
        uHighlight: { value: highlight, type: "vec3<f32>" },
        uEdge: { value: edge, type: "vec3<f32>" },
      }),
    },
    padding: Math.max(36, Number(glass.glow ?? 18) * 2),
    antialias: "on",
  });
}

function createMaskSprite(PIXI: PixiModule, texture: import("pixi.js").Texture, alpha = 1) {
  const sprite = new PIXI.Sprite({ texture });
  sprite.alpha = alpha;
  return sprite;
}

function drawGlints(
  PIXI: PixiModule,
  layout: TextMaskLayout,
  glass: GlassPresetConfig,
  alpha: number
) {
  const glintLayer = glass.layers?.glints;
  if (glintLayer?.enabled === false) return null;

  const container = new PIXI.Container();
  const color = colorToHex(glintLayer?.color, 0xfff5ff);
  const opacity = layerOpacity(glintLayer, 0.58, alpha);
  const size = Math.max(3, Math.min(18, (Number(glintLayer?.size ?? 0.052) || 0.052) * layout.textBounds.height * 0.55));
  const positions =
    glintLayer?.positions && glintLayer.positions.length
      ? glintLayer.positions
      : [
          { x: 0.1, y: 0.1 },
          { x: 0.45, y: 0.16 },
          { x: 0.82, y: 0.2 },
        ];

  positions.forEach((point) => {
    const x = layout.textBounds.x + clamp(Number(point.x ?? 0.5), 0, 1) * layout.textBounds.width;
    const y = layout.textBounds.y + clamp(Number(point.y ?? 0.5), 0, 1) * layout.textBounds.height;
    const g = new PIXI.Graphics();
    g.moveTo(x - size, y);
    g.lineTo(x + size, y);
    g.moveTo(x, y - size);
    g.lineTo(x, y + size);
    g.stroke({ color, alpha: opacity, width: Math.max(1, size * 0.16) });
    g.circle(x, y, Math.max(1.2, size * 0.16)).fill({ color, alpha: Math.min(1, opacity * 0.9) });
    container.addChild(g);
  });

  return container;
}

function destroyPixiApp(app: import("pixi.js").Application | null) {
  if (!app) return;
  try {
    app.destroy(
      { removeView: false },
      { children: true, texture: true, textureSource: true }
    );
  } catch {
    try {
      app.destroy();
    } catch {
      // Pixi teardown can throw after a renderer init failure. The canvas node is owned by React.
    }
  }
}

export default function GlassHeadlinePixiRenderer({
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
  bleedX,
  bleedY,
  glass,
  className,
  style,
  fallback,
}: GlassHeadlinePixiRendererProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let app: import("pixi.js").Application | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let renderToken = 0;

    const isCurrentRender = (
      token: number,
      candidateApp: import("pixi.js").Application
    ) => !cancelled && token === renderToken && app === candidateApp;

    const render = async (token: number) => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (!root || !canvas) return;

      const rect = root.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (width <= 1 || height <= 1) return;

      const PIXI = await import("pixi.js");
      if (cancelled || token !== renderToken) return;

      destroyPixiApp(app);
      app = null;
      const localApp = new PIXI.Application();
      app = localApp;

      await localApp.init({
        canvas,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: clamp(window.devicePixelRatio || 1, 1, 2.5),
        preference: "webgl",
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });

      if (!isCurrentRender(token, localApp)) {
        destroyPixiApp(localApp);
        return;
      }

      const layout = buildTextMask({
        width,
        height,
        text,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        lineHeight,
        letterSpacingEm,
        align,
        uppercase,
        bleedX,
        bleedY,
      });
      const texture = PIXI.Texture.from(layout.canvas);

      const depthLayer = glass.layers?.depthShadow;
      const backLayer = glass.layers?.backWall;
      const rimLayer = glass.layers?.rimStroke;
      const outerGlowLayer = glass.layers?.outerGlow;
      const hotGlowLayer = glass.layers?.hotRimGlow;
      const glowStrength = clamp(Number(glass.glow ?? 0) / 72, 0, 1.4);

      const depth = createMaskSprite(PIXI, texture, layerOpacity(depthLayer, 0.55, alpha));
      depth.tint = colorToHex(depthLayer?.color || glass.shadowColor, 0x080018);
      depth.x = Number(depthLayer?.offsetX ?? 0);
      depth.y = Number(depthLayer?.offsetY ?? 10);
      depth.blendMode = "multiply";
      depth.filters = [new PIXI.BlurFilter({ strength: Math.max(4, Number(depthLayer?.blur ?? 14)), quality: 3 })];
      localApp.stage.addChild(depth);

      const wideBloom = createMaskSprite(
        PIXI,
        texture,
        layerOpacity(outerGlowLayer, 0.46, alpha) * (0.52 + glowStrength * 0.24)
      );
      wideBloom.tint = colorToHex(outerGlowLayer?.color || hotGlowLayer?.color || glass.primaryColor, 0xff2bbf);
      wideBloom.blendMode = "screen";
      wideBloom.filters = [
        new PIXI.BlurFilter({
          strength: Math.max(24, Math.min(72, Number(glass.glow ?? 48) * 1.05)),
          quality: 4,
        }),
      ];
      localApp.stage.addChild(wideBloom);

      const bloom = createMaskSprite(
        PIXI,
        texture,
        layerOpacity(hotGlowLayer, 0.26, alpha) * (0.3 + glowStrength * 0.22)
      );
      bloom.tint = colorToHex(hotGlowLayer?.color || rimLayer?.color || glass.primaryColor, 0xff2bbf);
      bloom.blendMode = "screen";
      bloom.filters = [
        new PIXI.BlurFilter({
          strength: Math.max(10, Math.min(34, Number(hotGlowLayer?.blur ?? glass.glow ?? 10))),
          quality: 3,
        }),
      ];
      localApp.stage.addChild(bloom);

      for (let i = 2; i >= 1; i -= 1) {
        const wall = createMaskSprite(PIXI, texture, layerOpacity(backLayer, 0.12, alpha) * (0.07 + i * 0.035));
        wall.tint = colorToHex(backLayer?.strokeColor || glass.shadowColor || glass.secondaryColor, 0x120022);
        wall.x = Number(backLayer?.offsetX ?? 2.5) * i * 0.45;
        wall.y = Number(backLayer?.offsetY ?? 2.5) * i * 0.52;
        wall.blendMode = "multiply";
        localApp.stage.addChild(wall);
      }

      const main = createMaskSprite(PIXI, texture, 1);
      const glassFilter = createGlassFilter(PIXI, layout, glass, alpha);
      main.filters = [glassFilter];
      main.blendMode = "normal";
      localApp.stage.addChild(main);

      const rim = createMaskSprite(PIXI, texture, layerOpacity(rimLayer, 0.08, alpha) * 0.36);
      rim.tint = colorToHex(rimLayer?.color || glass.rimColor || glass.highlightColor, 0xffd6ff);
      rim.blendMode = "screen";
      rim.filters = [new PIXI.BlurFilter({ strength: 0.45, quality: 1 })];
      localApp.stage.addChild(rim);

      const renderFreeGlints = false;
      const glints = renderFreeGlints ? drawGlints(PIXI, layout, glass, alpha) : null;
      if (glints) {
        glints.blendMode = "screen";
        localApp.stage.addChild(glints);
      }

      localApp.render();
      if (isCurrentRender(token, localApp)) {
        try {
          const nextSnapshot = canvas.toDataURL("image/png");
          setSnapshot(nextSnapshot);
          setFailed(false);
        } catch {
          setSnapshot(null);
        } finally {
          destroyPixiApp(localApp);
          if (app === localApp) app = null;
        }
      } else {
        destroyPixiApp(localApp);
      }
    };

    const scheduleRender = () => {
      const token = ++renderToken;
      setSnapshot(null);
      render(token).catch((error) => {
        console.error("Glass Pixi renderer failed", error);
        if (!cancelled && token === renderToken) setFailed(true);
      });
    };

    setFailed(false);
    scheduleRender();
    resizeObserver = new ResizeObserver(scheduleRender);
    if (rootRef.current) resizeObserver.observe(rootRef.current);
    document.fonts?.ready.then(() => {
      if (!cancelled) scheduleRender();
    });

    return () => {
      cancelled = true;
      renderToken += 1;
      resizeObserver?.disconnect();
      destroyPixiApp(app);
      app = null;
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
    alpha,
    bleedX,
    bleedY,
    glass,
  ]);

  return (
    <div
      ref={rootRef}
      className={className}
      data-glass-renderer={failed ? "dom-fallback" : "pixi-webgl"}
      style={style}
    >
      <canvas
        ref={canvasRef}
        data-nonexport="true"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: failed || snapshot ? "none" : "block",
          pointerEvents: "none",
        }}
      />
      {snapshot && !failed ? (
        <img
          src={snapshot}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : null}
      {failed ? fallback : null}
    </div>
  );
}
