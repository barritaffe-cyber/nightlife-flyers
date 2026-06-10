import {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
} from "./headline-final-renderer";
import { MIAMI_HEAT_COLOR_STOPS } from "./miami-heat";

export type MiamiHeatMobileFinalRenderConfig = HeadlineFinalRenderConfig;

export const MIAMI_HEAT_MOBILE_FINAL_RENDER_PAINT_PADDING_PX = 220;

type ExportRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type TextShadowLayer = {
  x: number;
  y: number;
  blur: number;
  color: string;
};

type LinearGradientStop = {
  color: string;
  offset: number;
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function nextFrame() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function twoFrames() {
  await nextFrame();
  await nextFrame();
}

async function waitForImage(src: string) {
  if (!src) return;
  await new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function parseCssPx(value: string | null | undefined, fallback = 0) {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveLineHeightPx(style: CSSStyleDeclaration, fontSize: number) {
  const raw = style.lineHeight;
  if (!raw || raw === "normal") return fontSize * 1.15;
  if (raw.endsWith("px")) return parseCssPx(raw, fontSize * 1.15);
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return fontSize * 1.15;
  return numeric < 8 ? numeric * fontSize : numeric;
}

function parseTransformOriginPx(value: string, width: number, height: number) {
  const parts = String(value || "").split(/\s+/).filter(Boolean);
  const parsePart = (part: string | undefined, size: number) => {
    if (!part) return size / 2;
    if (part.endsWith("%")) {
      const pct = Number.parseFloat(part);
      return Number.isFinite(pct) ? (pct / 100) * size : size / 2;
    }
    if (part === "left" || part === "top") return 0;
    if (part === "right" || part === "bottom") return size;
    if (part === "center") return size / 2;
    return parseCssPx(part, size / 2);
  };

  return {
    x: parsePart(parts[0], width),
    y: parsePart(parts[1], height),
  };
}

function getLayoutRectInRoot(node: HTMLElement, root: HTMLElement): ExportRect {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = node;

  while (current && current !== root) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  const nodeRect = node.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  if (!Number.isFinite(x) || !Number.isFinite(y) || current !== root) {
    x = nodeRect.left - rootRect.left;
    y = nodeRect.top - rootRect.top;
  }

  return {
    x,
    y,
    w: Math.max(1, node.offsetWidth || nodeRect.width),
    h: Math.max(1, node.offsetHeight || nodeRect.height),
  };
}

function splitCssList(input: string): string[] {
  const out: string[] = [];
  let buffer = "";
  let depth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const ch = input[index];
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      const part = buffer.trim();
      if (part) out.push(part);
      buffer = "";
      continue;
    }
    buffer += ch;
  }

  const tail = buffer.trim();
  if (tail) out.push(tail);
  return out;
}

function parseTextShadow(textShadow: string): TextShadowLayer[] {
  if (!textShadow || textShadow === "none") return [];

  return splitCssList(textShadow)
    .map((part) => {
      const colorMatch = part.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
      const lengthMatch = part.match(/(-?\d*\.?\d+)px\s+(-?\d*\.?\d+)px(?:\s+(-?\d*\.?\d+)px)?/);
      if (!lengthMatch) return null;
      return {
        x: Number(lengthMatch[1]) || 0,
        y: Number(lengthMatch[2]) || 0,
        blur: Number(lengthMatch[3]) || 0,
        color: colorMatch?.[0] || "rgba(0,0,0,0.45)",
      };
    })
    .filter((layer): layer is TextShadowLayer => !!layer);
}

function isTransparentPaint(value: string | null | undefined) {
  const paint = String(value || "").trim().toLowerCase();
  return (
    !paint ||
    paint === "none" ||
    paint === "transparent" ||
    paint === "rgba(0, 0, 0, 0)" ||
    paint === "rgba(0,0,0,0)"
  );
}

function parseLinearGradientStops(backgroundImage: string): LinearGradientStop[] {
  const raw = String(backgroundImage || "").trim();
  const gradientMatch = raw.match(/linear-gradient\((.*)\)/i);
  if (!gradientMatch) {
    return [];
  }

  const parts = splitCssList(gradientMatch[1]);
  const stopParts = parts[0] && /(?:deg|rad|turn|to\s+)/i.test(parts[0])
    ? parts.slice(1)
    : parts;
  const stops = stopParts
    .map((part, index) => {
      const colorMatch = part.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
      if (!colorMatch) return null;
      const afterColor = part.slice(colorMatch.index! + colorMatch[0].length);
      const percentMatch = afterColor.match(/(-?\d*\.?\d+)%/);
      const fallbackOffset = stopParts.length <= 1 ? 0 : index / (stopParts.length - 1);
      const offset = percentMatch
        ? clampNumber(Number.parseFloat(percentMatch[1]) / 100, 0, 1, fallbackOffset)
        : fallbackOffset;
      return {
        color: colorMatch[0],
        offset,
      };
    })
    .filter((stop): stop is LinearGradientStop => !!stop);

  if (stops.length >= 2) return stops;

  return [
    { color: MIAMI_HEAT_COLOR_STOPS.top, offset: 0 },
    { color: MIAMI_HEAT_COLOR_STOPS.top, offset: 0.28 },
    { color: MIAMI_HEAT_COLOR_STOPS.mid, offset: 0.58 },
    { color: MIAMI_HEAT_COLOR_STOPS.base, offset: 0.88 },
    { color: MIAMI_HEAT_COLOR_STOPS.base, offset: 1 },
  ];
}

function createMiamiHeatCssGradientFill(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  backgroundImage: string
) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + Math.max(1, height));
  parseLinearGradientStops(backgroundImage).forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });
  return gradient;
}

function resolveTextFillColor(style: CSSStyleDeclaration, fallback: string) {
  const computedFill =
    style.getPropertyValue("-webkit-text-fill-color") ||
    (style as CSSStyleDeclaration & { webkitTextFillColor?: string }).webkitTextFillColor ||
    style.color;

  return isTransparentPaint(computedFill) ? fallback : computedFill || fallback;
}

function canvasTextWidth(ctx: CanvasRenderingContext2D, text: string, letterSpacingPx: number) {
  const chars = Array.from(text);
  if (chars.length <= 1 || Math.abs(letterSpacingPx) < 0.001) {
    return ctx.measureText(text).width;
  }
  return chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    Math.max(0, chars.length - 1) * letterSpacingPx;
}

function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  mode: "fill" | "stroke"
) {
  const chars = Array.from(text);
  if (chars.length <= 1 || Math.abs(letterSpacingPx) < 0.001) {
    if (mode === "stroke") ctx.strokeText(text, x, y);
    else ctx.fillText(text, x, y);
    return;
  }

  const align = ctx.textAlign;
  let cursor = x;
  const measuredWidth = canvasTextWidth(ctx, text, letterSpacingPx);
  if (align === "center") cursor -= measuredWidth / 2;
  if (align === "right" || align === "end") cursor -= measuredWidth;

  const originalAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, index) => {
    if (mode === "stroke") ctx.strokeText(ch, cursor, y);
    else ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + (index < chars.length - 1 ? letterSpacingPx : 0);
  });
  ctx.textAlign = originalAlign;
}

function getLineElements(textEl: HTMLElement) {
  const first = textEl.firstElementChild;
  if (first instanceof HTMLElement) {
    const children = Array.from(first.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    if (children.length) return children;
  }

  return [textEl];
}

function getLocalOffset(child: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = child;

  while (current && current !== ancestor) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  if (current === ancestor) return { x, y };

  const childRect = child.getBoundingClientRect();
  const ancestorRect = ancestor.getBoundingClientRect();
  return {
    x: childRect.left - ancestorRect.left,
    y: childRect.top - ancestorRect.top,
  };
}

function resolveCanvasBaselineOffset(
  fontSize: number,
  lineBoxHeight: number,
  lineHeightPx: number
) {
  const boxHeight = Math.max(1, lineBoxHeight || lineHeightPx || fontSize);
  const leading = Math.max(0, boxHeight - fontSize) / 2;
  return leading + fontSize * 0.82;
}

function getBackgroundImage(style: CSSStyleDeclaration) {
  return style.backgroundImage && style.backgroundImage !== "none"
    ? style.backgroundImage
    : "";
}

function drawMiamiHeatHeadlineToCanvas(
  node: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx: number;
    captureWidth: number;
    captureHeight: number;
  }
) {
  const textEl = node.querySelector<HTMLElement>("h1") || node;
  const textStyle = getComputedStyle(textEl);
  const fontSize = Math.max(1, parseCssPx(textStyle.fontSize, 64));
  const fontWeight = textStyle.fontWeight || "900";
  const fontStyle = textStyle.fontStyle && textStyle.fontStyle !== "normal"
    ? `${textStyle.fontStyle} `
    : "";
  const fontFamily = textStyle.fontFamily || "Impact, sans-serif";
  const lineHeightPx = resolveLineHeightPx(textStyle, fontSize);
  const opacity = clampNumber(textStyle.opacity, 0, 1, 1);
  const textOffset = getLocalOffset(textEl, node);
  const pixelRatio = Math.max(1, Math.min(3, opts.pixelRatio || 1));
  const width = Math.max(1, Math.ceil(opts.captureWidth + opts.paintPaddingPx * 2));
  const height = Math.max(1, Math.ceil(opts.captureHeight + opts.paintPaddingPx * 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Miami Heat mobile headline canvas unavailable.");

  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = (textStyle.textAlign || getComputedStyle(node).textAlign || "left") as CanvasTextAlign;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const textBackgroundImage = getBackgroundImage(textStyle);
  const textFallbackFill = resolveTextFillColor(textStyle, MIAMI_HEAT_COLOR_STOPS.base);
  const textStrokeWidth = Math.max(
    0,
    parseCssPx(
      textStyle.getPropertyValue("-webkit-text-stroke-width") ||
        (textStyle as CSSStyleDeclaration & { webkitTextStrokeWidth?: string }).webkitTextStrokeWidth,
      0
    )
  );
  const textStrokeColor =
    textStyle.getPropertyValue("-webkit-text-stroke-color") ||
    (textStyle as CSSStyleDeclaration & { webkitTextStrokeColor?: string }).webkitTextStrokeColor ||
    "rgba(80,12,0,0.8)";
  const textShadowLayers = parseTextShadow(textStyle.textShadow || "");

  getLineElements(textEl).forEach((lineEl, index) => {
    const lineStyle = getComputedStyle(lineEl);
    const text = String(lineEl.textContent || "").replace(/\u00a0/g, " ");
    if (!text.trim()) return;

    const lineOffset = getLocalOffset(lineEl, node);
    const lineFontSize = parseCssPx(lineStyle.fontSize, fontSize);
    const lineHeight = resolveLineHeightPx(lineStyle, lineFontSize);
    const lineLetterSpacing = parseCssPx(lineStyle.letterSpacing, parseCssPx(textStyle.letterSpacing, 0));
    const lineWidth = Math.max(
      1,
      lineEl.offsetWidth || canvasTextWidth(ctx, text, lineLetterSpacing)
    );
    const lineBoxHeight = Math.max(1, lineEl.offsetHeight || lineHeight);
    const align = String(lineStyle.textAlign || textStyle.textAlign || getComputedStyle(node).textAlign || "left").toLowerCase();
    const x = opts.paintPaddingPx +
      (align === "center"
        ? lineOffset.x + lineWidth / 2
        : align === "right" || align === "end"
          ? lineOffset.x + lineWidth
          : lineOffset.x);
    const fallbackY = opts.paintPaddingPx + textOffset.y + resolveCanvasBaselineOffset(lineFontSize, lineHeight, lineHeight) + index * lineHeightPx;
    const y = opts.paintPaddingPx + lineOffset.y + resolveCanvasBaselineOffset(lineFontSize, lineBoxHeight, lineHeight) || fallbackY;
    const lineOpacity = clampNumber(lineStyle.opacity, 0, 1, 1);
    const paintOpacity = opacity * lineOpacity;
    const lineBackgroundImage = getBackgroundImage(lineStyle);
    const backgroundImage = lineBackgroundImage || textBackgroundImage;
    const gradientSourceIsLine = Boolean(lineBackgroundImage);
    const gradientY = opts.paintPaddingPx + (gradientSourceIsLine ? lineOffset.y : textOffset.y);
    const gradientHeight = gradientSourceIsLine
      ? lineBoxHeight
      : Math.max(1, textEl.offsetHeight || opts.captureHeight);
    const lineFill = resolveTextFillColor(lineStyle, textFallbackFill);
    const paintFill = /linear-gradient\(/i.test(backgroundImage)
      ? createMiamiHeatCssGradientFill(ctx, gradientY, gradientHeight, backgroundImage)
      : lineFill;
    const paintStrokeWidth = Math.max(
      0,
      parseCssPx(
        lineStyle.getPropertyValue("-webkit-text-stroke-width") ||
          (lineStyle as CSSStyleDeclaration & { webkitTextStrokeWidth?: string }).webkitTextStrokeWidth,
        textStrokeWidth
      )
    );
    const paintStrokeColor =
      lineStyle.getPropertyValue("-webkit-text-stroke-color") ||
      (lineStyle as CSSStyleDeclaration & { webkitTextStrokeColor?: string }).webkitTextStrokeColor ||
      textStrokeColor;
    const lineShadowLayers =
      lineStyle.textShadow && lineStyle.textShadow !== "none"
        ? parseTextShadow(lineStyle.textShadow)
        : textShadowLayers;

    ctx.font = `${fontStyle}${fontWeight} ${lineFontSize}px ${fontFamily}`;
    ctx.textAlign = align === "center" ? "center" : align === "right" || align === "end" ? "right" : "left";

    [...lineShadowLayers].reverse().forEach((shadow) => {
      ctx.save();
      ctx.globalAlpha = paintOpacity;
      try {
        ctx.filter = shadow.blur > 0 ? `blur(${shadow.blur}px)` : "none";
      } catch {}
      ctx.fillStyle = shadow.color;
      drawTextLine(ctx, text, x + shadow.x, y + shadow.y, lineLetterSpacing, "fill");
      ctx.restore();
    });

    if (paintStrokeWidth > 0.01) {
      ctx.save();
      ctx.globalAlpha = paintOpacity;
      ctx.lineWidth = paintStrokeWidth;
      ctx.strokeStyle = paintStrokeColor;
      drawTextLine(ctx, text, x, y, lineLetterSpacing, "stroke");
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = paintOpacity;
    ctx.fillStyle = paintFill;
    drawTextLine(ctx, text, x, y, lineLetterSpacing, "fill");
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}

async function rasterizeMiamiHeatMobileHeadlineNodesForExport(
  root: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx?: number;
    onStage?: (label: string) => void;
    onProgress?: (p: number) => void;
  }
) {
  const headline = root.querySelector<HTMLElement>('[data-node="headline"]');
  if (!headline) return () => {};

  const headlineRect = headline.getBoundingClientRect();
  const headlineStyle = getComputedStyle(headline);
  if (
    headlineRect.width <= 0 ||
    headlineRect.height <= 0 ||
    headlineStyle.display === "none" ||
    headlineStyle.visibility === "hidden"
  ) {
    return () => {};
  }

  const exportRect = getLayoutRectInRoot(headline, root);
  const exportTransform = headlineStyle.transform || "none";
  const captureWidth = Math.max(
    1,
    Math.ceil(headline.offsetWidth || headline.scrollWidth || headlineRect.width)
  );
  const captureHeight = Math.max(
    1,
    Math.ceil(headline.offsetHeight || headline.scrollHeight || headlineRect.height)
  );
  const paintPaddingPx = Math.max(0, Math.ceil(Number(opts.paintPaddingPx || 0)));
  const paddedCaptureWidth = captureWidth + paintPaddingPx * 2;
  const paddedCaptureHeight = captureHeight + paintPaddingPx * 2;
  const exportOrigin = parseTransformOriginPx(
    headlineStyle.transformOrigin,
    exportRect.w,
    exportRect.h
  );
  const originalStyle = {
    height: headline.style.height,
    minHeight: headline.style.minHeight,
    overflow: headline.style.overflow,
  };
  const childStyles = Array.from(headline.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .map((child) => ({
      child,
      display: child.style.display,
    }));

  opts.onStage?.("Rasterizing Miami Heat mobile headline...");
  await twoFrames();

  const rasterUrl = drawMiamiHeatHeadlineToCanvas(headline, {
    pixelRatio: Math.max(1, Math.min(3, opts.pixelRatio || 1)),
    paintPaddingPx,
    captureWidth,
    captureHeight,
  });

  const img = document.createElement("img");
  img.src = rasterUrl;
  img.alt = "";
  img.setAttribute("data-export-rasterized-headline", "true");
  img.dataset.exportRasterizedHeadline = "true";
  img.dataset.exportX = String(exportRect.x - paintPaddingPx);
  img.dataset.exportY = String(exportRect.y - paintPaddingPx);
  img.dataset.exportW = String(paddedCaptureWidth);
  img.dataset.exportH = String(paddedCaptureHeight);
  img.dataset.exportTransform = exportTransform;
  img.dataset.exportOriginX = String(exportOrigin.x + paintPaddingPx);
  img.dataset.exportOriginY = String(exportOrigin.y + paintPaddingPx);
  Object.assign(img.style, {
    position: "absolute",
    left: `${-paintPaddingPx}px`,
    top: `${-paintPaddingPx}px`,
    width: `${paddedCaptureWidth}px`,
    height: `${paddedCaptureHeight}px`,
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "contain",
    display: "block",
    pointerEvents: "none",
  });

  headline.style.height = `${captureHeight}px`;
  headline.style.minHeight = `${captureHeight}px`;
  headline.style.overflow = "visible";
  childStyles.forEach(({ child }) => {
    child.style.display = "none";
  });
  headline.appendChild(img);
  await waitForImage(rasterUrl);
  await twoFrames();
  opts.onProgress?.(72);

  return () => {
    try { img.remove(); } catch {}
    childStyles.forEach(({ child, display }) => {
      child.style.display = display;
    });
    headline.style.height = originalStyle.height;
    headline.style.minHeight = originalStyle.minHeight;
    headline.style.overflow = originalStyle.overflow;
  };
}

async function rasterizeMiamiHeatMobileFinalNodesForExport(
  root: HTMLElement,
  opts: {
    pixelRatio: number;
    fontEmbedCss?: string;
    paintPaddingPx?: number;
    onStage?: (label: string) => void;
    onProgress?: (p: number) => void;
  },
  rasterizeDefaultHeadlineNodes: HeadlineFinalRenderRasterizer
) {
  const restores: Array<() => void> = [];
  const headline = root.querySelector<HTMLElement>('[data-node="headline"]');
  const originalHeadlineDisplay = headline?.style.display ?? "";

  try {
    if (headline) {
      headline.style.display = "none";
      await twoFrames();
    }
    const restoreDefault = await rasterizeDefaultHeadlineNodes(root, opts);
    restores.push(restoreDefault);
  } finally {
    if (headline) {
      headline.style.display = originalHeadlineDisplay;
      await twoFrames();
    }
  }

  const restoreMiamiHeadline = await rasterizeMiamiHeatMobileHeadlineNodesForExport(root, opts);
  restores.push(restoreMiamiHeadline);

  return () => {
    for (let index = restores.length - 1; index >= 0; index -= 1) {
      try {
        restores[index]?.();
      } catch {}
    }
  };
}

export function shouldRenderMiamiHeatMobileFinalHeadline(
  config: Pick<MiamiHeatMobileFinalRenderConfig, "enabled" | "headlineHidden" | "headline">
) {
  return shouldRenderHeadlineFinalRaster(config);
}

export function renderMiamiHeatMobileFinalHeadline(config: MiamiHeatMobileFinalRenderConfig) {
  const rasterizeDefaultHeadlineNodes = config.rasterizeHeadlineNodesForExport;

  return renderHeadlineFinalRaster({
    ...config,
    paintPaddingPx: config.paintPaddingPx ?? MIAMI_HEAT_MOBILE_FINAL_RENDER_PAINT_PADDING_PX,
    rasterizeHeadlineNodesForExport: (root, opts) =>
      rasterizeMiamiHeatMobileFinalNodesForExport(root, opts, rasterizeDefaultHeadlineNodes),
  });
}
