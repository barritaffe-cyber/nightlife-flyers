import {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
} from "./headline-final-renderer";

export type NeonPulseMobileFinalRenderConfig = HeadlineFinalRenderConfig;

export const NEON_PULSE_MOBILE_FINAL_RENDER_PAINT_PADDING_PX = 280;

type ExportRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type DropShadowLayer = {
  x: number;
  y: number;
  blur: number;
  color: string;
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
  const raw = String(value || "").trim();
  if (!raw || raw === "normal") return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCssLengthPx(value: string | null | undefined, fontSize: number, fallback = 0) {
  const raw = String(value || "").trim();
  if (!raw || raw === "normal") return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (raw.endsWith("em")) return parsed * fontSize;
  if (raw.endsWith("rem")) return parsed * fontSize;
  return parsed;
}

function resolveLineHeightPx(style: CSSStyleDeclaration, fontSize: number) {
  const raw = String(style.lineHeight || "").trim();
  if (!raw || raw === "normal") return fontSize * 1.15;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fontSize * 1.15;
  return raw.endsWith("px") ? parsed : parsed < 8 ? parsed * fontSize : parsed;
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

function parseDropShadowFilter(filter: string): DropShadowLayer[] {
  const css = String(filter || "").trim();
  if (!css || css === "none") return [];

  const parts: string[] = [];
  const re = /drop-shadow\(/gi;
  while (re.exec(css)) {
    let depth = 1;
    let index = re.lastIndex;
    for (; index < css.length; index += 1) {
      const ch = css[index];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth === 0) {
      parts.push(css.slice(re.lastIndex, index).trim());
      re.lastIndex = index + 1;
    }
  }

  return parts
    .map((match) => {
      const raw = String(match || "").trim();
      const colorMatch = raw.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
      const withoutColor = colorMatch ? raw.replace(colorMatch[0], " ") : raw;
      const lengths = withoutColor
        .trim()
        .split(/\s+/)
        .map((part) => Number.parseFloat(part))
        .filter((part) => Number.isFinite(part));
      if (lengths.length < 2) return null;
      return {
        x: lengths[0] || 0,
        y: lengths[1] || 0,
        blur: lengths[2] || 0,
        color: colorMatch?.[0] || "rgba(255,255,255,0.45)",
      };
    })
    .filter((layer): layer is DropShadowLayer => !!layer);
}

function parseBlurFilter(filter: string) {
  const match = String(filter || "").match(/blur\((-?\d*\.?\d+)px\)/i);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getTextLinesForCanvas(el: HTMLElement) {
  const raw = el.innerText || el.textContent || "";
  return raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, arr) => line.length > 0 || (index > 0 && index < arr.length - 1));
}

function normalizeText(text: string, transform: string) {
  if (/uppercase/i.test(transform)) return text.toUpperCase();
  if (/lowercase/i.test(transform)) return text.toLowerCase();
  return text;
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

function estimateTextWidth(ctx: CanvasRenderingContext2D, text: string, letterSpacingPx: number) {
  const chars = Array.from(text);
  if (!letterSpacingPx || chars.length <= 1) return ctx.measureText(text).width;
  return chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    Math.max(0, chars.length - 1) * letterSpacingPx;
}

function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  mode: "fill" | "stroke" = "stroke"
) {
  const chars = Array.from(text);
  const paint = (value: string, px: number) => {
    if (mode === "fill") ctx.fillText(value, px, y);
    else ctx.strokeText(value, px, y);
  };

  if (!letterSpacingPx || chars.length <= 1) {
    paint(text, x);
    return;
  }

  const align = ctx.textAlign;
  const lineWidth = estimateTextWidth(ctx, text, letterSpacingPx);
  let cursor =
    align === "center"
      ? x - lineWidth / 2
      : align === "right" || align === "end"
      ? x - lineWidth
      : x;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";
  try {
    chars.forEach((ch, index) => {
      paint(ch, cursor);
      cursor += ctx.measureText(ch).width + (index < chars.length - 1 ? letterSpacingPx : 0);
    });
  } finally {
    ctx.textAlign = previousAlign;
  }
}

function toCanvasCompositeOperation(mode?: string): GlobalCompositeOperation {
  const normalized = String(mode || "source-over").toLowerCase();
  if (normalized === "normal") return "source-over";
  if (
    normalized === "source-over" ||
    normalized === "screen" ||
    normalized === "lighter" ||
    normalized === "multiply" ||
    normalized === "overlay" ||
    normalized === "soft-light"
  ) {
    return normalized as GlobalCompositeOperation;
  }
  return "source-over";
}

function findNeonPulseHeadline(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-node="headline"]')).find(
    (node) => !!node.querySelector("[data-neon-pulse-dom-layer]")
  ) || null;
}

function drawNeonPulseHeadlineToCanvas(
  headline: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx: number;
    captureWidth: number;
    captureHeight: number;
  }
) {
  const pixelRatio = Math.max(1, Math.min(3, opts.pixelRatio || 1));
  const paintPaddingPx = Math.max(0, Math.ceil(opts.paintPaddingPx || 0));
  const canvas = document.createElement("canvas");
  const cssWidth = Math.max(1, opts.captureWidth + paintPaddingPx * 2);
  const cssHeight = Math.max(1, opts.captureHeight + paintPaddingPx * 2);
  canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
  canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textBaseline = "alphabetic";

  const layers = Array.from(headline.querySelectorAll<HTMLElement>("[data-neon-pulse-dom-layer]"));
  if (!layers.length) return "";

  for (const layer of layers) {
    const style = getComputedStyle(layer);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const fontSize = parseCssPx(style.fontSize, 16);
    const lineHeight = resolveLineHeightPx(style, fontSize);
    const letterSpacingPx = parseCssLengthPx(style.letterSpacing, fontSize, 0);
    const strokeWidth = parseCssPx(style.getPropertyValue("-webkit-text-stroke-width"), 0);
    const strokeColor =
      style.getPropertyValue("-webkit-text-stroke-color") ||
      style.color ||
      "rgba(255,255,255,0.9)";
    const textFillColor = style.getPropertyValue("-webkit-text-fill-color");
    const fillColor = !isTransparentPaint(textFillColor)
      ? textFillColor
      : !isTransparentPaint(style.color)
      ? style.color
      : "transparent";
    const opacity = clampNumber(Number.parseFloat(style.opacity || "1"), 0, 1, 1);
    if (opacity <= 0.001 || strokeWidth <= 0.001) continue;

    const align: CanvasTextAlign =
      style.textAlign === "center"
        ? "center"
        : style.textAlign === "right" || style.textAlign === "end"
        ? "right"
        : "left";
    const x =
      align === "center"
        ? paintPaddingPx + opts.captureWidth / 2
        : align === "right"
        ? paintPaddingPx + opts.captureWidth
        : paintPaddingPx;
    const lines = getTextLinesForCanvas(layer);
    const dropShadows = parseDropShadowFilter(style.filter);
    const blur = parseBlurFilter(style.filter);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = toCanvasCompositeOperation(style.mixBlendMode);
    ctx.font = `${style.fontStyle || "normal"} ${style.fontWeight || "700"} ${fontSize}px ${style.fontFamily || "sans-serif"}`;
    ctx.textAlign = align;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    try {
      ctx.filter = blur > 0 ? `blur(${blur.toFixed(1)}px)` : "none";
    } catch {}

    lines.forEach((line, index) => {
      const y = paintPaddingPx + fontSize * 0.82 + index * lineHeight;
      const text = normalizeText(line, style.textTransform || "");

      for (const shadow of dropShadows) {
        ctx.save();
        ctx.shadowColor = shadow.color;
        ctx.shadowBlur = shadow.blur;
        ctx.shadowOffsetX = shadow.x;
        ctx.shadowOffsetY = shadow.y;
        drawTextLine(ctx, text, x, y, letterSpacingPx, "stroke");
        ctx.restore();
      }

      drawTextLine(ctx, text, x, y, letterSpacingPx, "stroke");
      if (!isTransparentPaint(fillColor)) {
        drawTextLine(ctx, text, x, y, letterSpacingPx, "fill");
      }
    });

    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

async function rasterizeNeonPulseMobileHeadlineNodesForExport(
  root: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx?: number;
    onStage?: (label: string) => void;
    onProgress?: (p: number) => void;
  }
) {
  const headline = findNeonPulseHeadline(root);
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
    Math.ceil(Math.max(headline.offsetWidth || 0, headline.scrollWidth || 0, headlineRect.width))
  );
  const captureHeight = Math.max(
    1,
    Math.ceil(Math.max(headline.offsetHeight || 0, headline.scrollHeight || 0, headlineRect.height))
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

  opts.onStage?.("Rasterizing Neon Ink mobile headline...");
  await twoFrames();

  const rasterUrl = drawNeonPulseHeadlineToCanvas(headline, {
    pixelRatio: Math.max(1, Math.min(3, opts.pixelRatio || 1)),
    paintPaddingPx,
    captureWidth,
    captureHeight,
  });

  if (!rasterUrl) return () => {};

  const img = document.createElement("img");
  img.src = rasterUrl;
  img.alt = "";
  img.setAttribute("data-export-rasterized-headline", "true");
  img.dataset.exportLayerOwner = "headline";
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

async function rasterizeNeonPulseMobileFinalNodesForExport(
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
  const headline = findNeonPulseHeadline(root);

  if (!headline) {
    return rasterizeDefaultHeadlineNodes(root, opts);
  }

  const originalHeadlineDisplay = headline.style.display;

  try {
    headline.style.display = "none";
    await twoFrames();
    const restoreDefault = await rasterizeDefaultHeadlineNodes(root, opts);
    restores.push(restoreDefault);
  } finally {
    headline.style.display = originalHeadlineDisplay;
    await twoFrames();
  }

  const restoreNeonHeadline = await rasterizeNeonPulseMobileHeadlineNodesForExport(root, opts);
  restores.push(restoreNeonHeadline);

  return () => {
    for (let index = restores.length - 1; index >= 0; index -= 1) {
      try {
        restores[index]?.();
      } catch {}
    }
  };
}

export function shouldRenderNeonPulseMobileFinalHeadline(
  config: Pick<NeonPulseMobileFinalRenderConfig, "enabled" | "headlineHidden" | "headline">
) {
  return shouldRenderHeadlineFinalRaster(config);
}

export function renderNeonPulseMobileFinalHeadline(
  config: NeonPulseMobileFinalRenderConfig
) {
  const rasterizeDefaultHeadlineNodes = config.rasterizeHeadlineNodesForExport;

  return renderHeadlineFinalRaster({
    ...config,
    paintPaddingPx: config.paintPaddingPx ?? NEON_PULSE_MOBILE_FINAL_RENDER_PAINT_PADDING_PX,
    rasterizeHeadlineNodesForExport: (root, opts) =>
      rasterizeNeonPulseMobileFinalNodesForExport(root, opts, rasterizeDefaultHeadlineNodes),
  });
}
