import {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
} from "./headline-final-renderer";
import { ACRYLIC_GLASS_HEADLINE_PRESET } from "./acrylic-glass";

export type AcrylicGlassMobileFinalRenderConfig = HeadlineFinalRenderConfig;

export const ACRYLIC_GLASS_MOBILE_FINAL_RENDER_PAINT_PADDING_PX = 280;

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

function extractFirstLinearGradient(input: string) {
  const css = String(input || "");
  const start = css.toLowerCase().indexOf("linear-gradient(");
  if (start < 0) return "";

  let depth = 0;
  for (let index = start; index < css.length; index += 1) {
    const ch = css[index];
    if (ch === "(") depth += 1;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return css.slice(start, index + 1);
    }
  }

  return "";
}

function parseLinearGradientStops(
  backgroundImage: string,
  fallbackStops: LinearGradientStop[]
): LinearGradientStop[] {
  const raw = extractFirstLinearGradient(backgroundImage);
  const gradientMatch = raw.match(/linear-gradient\((.*)\)/i);
  if (!gradientMatch) return fallbackStops;

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

  return stops.length >= 2 ? stops : fallbackStops;
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

function getLineElements(layerEl: HTMLElement) {
  const first = layerEl.firstElementChild;
  if (first instanceof HTMLElement) {
    const children = Array.from(first.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    if (children.length) return children;
  }

  return [layerEl];
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

function normalizeCanvasText(text: string, transform: string) {
  if (/uppercase/i.test(transform)) return text.toUpperCase();
  if (/lowercase/i.test(transform)) return text.toLowerCase();
  return text;
}

function getElementOpacity(el: HTMLElement, stopAt: HTMLElement) {
  let opacity = 1;
  let current: HTMLElement | null = el;
  while (current) {
    const style = getComputedStyle(current);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    opacity *= clampNumber(style.opacity, 0, 1, 1);
    if (current === stopAt) break;
    current = current.parentElement;
  }
  return clampNumber(opacity, 0, 1, 1);
}

function toCanvasCompositeOperation(mode?: string): GlobalCompositeOperation {
  const normalized = String(mode || "source-over").toLowerCase();
  if (normalized === "normal") return "source-over";
  if (normalized === "plus-lighter" || normalized === "lighter") return "lighter";
  if (
    normalized === "source-over" ||
    normalized === "multiply" ||
    normalized === "screen" ||
    normalized === "overlay" ||
    normalized === "darken" ||
    normalized === "lighten" ||
    normalized === "color-dodge" ||
    normalized === "color-burn" ||
    normalized === "hard-light" ||
    normalized === "soft-light" ||
    normalized === "difference" ||
    normalized === "exclusion" ||
    normalized === "hue" ||
    normalized === "saturation" ||
    normalized === "color" ||
    normalized === "luminosity"
  ) {
    return normalized as GlobalCompositeOperation;
  }
  return "source-over";
}

function getTextFillColor(style: CSSStyleDeclaration, fallback: string) {
  const fill =
    style.getPropertyValue("-webkit-text-fill-color") ||
    String((style as CSSStyleDeclaration & { webkitTextFillColor?: string }).webkitTextFillColor || "") ||
    style.color;

  return isTransparentPaint(fill) ? fallback : fill || fallback;
}

function getTextStrokeWidth(style: CSSStyleDeclaration) {
  return Math.max(
    0,
    parseCssPx(
      style.getPropertyValue("-webkit-text-stroke-width") ||
        String((style as CSSStyleDeclaration & { webkitTextStrokeWidth?: string }).webkitTextStrokeWidth || ""),
      0
    )
  );
}

function getTextStrokeColor(style: CSSStyleDeclaration, fallback: string) {
  const stroke =
    style.getPropertyValue("-webkit-text-stroke-color") ||
    String((style as CSSStyleDeclaration & { webkitTextStrokeColor?: string }).webkitTextStrokeColor || "");
  return isTransparentPaint(stroke) ? fallback : stroke || fallback;
}

function getBackgroundImage(style: CSSStyleDeclaration) {
  return style.backgroundImage && style.backgroundImage !== "none"
    ? style.backgroundImage
    : "";
}

function getCanvasFilter(style: CSSStyleDeclaration) {
  const filter = String(style.filter || "none").trim();
  if (!filter || filter === "none" || filter.includes("url(")) return "none";
  return filter;
}

function createVerticalGradient(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  stops: LinearGradientStop[]
) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + Math.max(1, height));
  stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));
  return gradient;
}

function createDiagonalGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: LinearGradientStop[]
) {
  const gradient = ctx.createLinearGradient(x, y + height, x + width, y);
  stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));
  return gradient;
}

function getLayerOpacityBoost(layerKey: string) {
  if (layerKey === "glow") return 1.18;
  if (layerKey === "main") return 1.12;
  if (layerKey === "reflections") return 1.36;
  if (layerKey === "upper-bloom") return 0.72;
  if (layerKey === "highlight") return 1.18;
  if (layerKey === "translucent-3d") return 1.08;
  return 1;
}

function createLayerFill(
  ctx: CanvasRenderingContext2D,
  layerKey: string,
  style: CSSStyleDeclaration,
  fallbackFill: string,
  x: number,
  y: number,
  width: number,
  height: number
): string | CanvasGradient {
  const backgroundImage = getBackgroundImage(style);
  const a = ACRYLIC_GLASS_HEADLINE_PRESET.acrylic;

  if (layerKey === "reflections") {
    return createDiagonalGradient(ctx, x, y, width, height, [
      { color: "rgba(255,255,255,0)", offset: 0 },
      { color: a.softHighlight, offset: 0.18 },
      { color: "rgba(255,255,255,0)", offset: 0.32 },
      { color: a.topHighlight, offset: 0.48 },
      { color: "rgba(255,255,255,0)", offset: 0.62 },
      { color: a.edgeTint, offset: 0.78 },
      { color: "rgba(255,255,255,0)", offset: 1 },
    ]);
  }

  if (/linear-gradient\(/i.test(backgroundImage)) {
    const fallbackStops =
      layerKey === "highlight"
        ? [
            { color: a.topHighlight, offset: 0 },
            { color: a.softHighlight, offset: 0.1 },
            { color: "rgba(255,255,255,0)", offset: 0.32 },
            { color: "rgba(255,255,255,0)", offset: 1 },
          ]
        : [
            { color: "rgba(255,255,255,.42)", offset: 0 },
            { color: a.fill, offset: 0.42 },
            { color: "rgba(255,255,255,.08)", offset: 0.72 },
            { color: a.edgeTint, offset: 1 },
          ];

    return createVerticalGradient(
      ctx,
      y,
      height,
      parseLinearGradientStops(backgroundImage, fallbackStops)
    );
  }

  return fallbackFill;
}

function drawAcrylicLineFill(
  ctx: CanvasRenderingContext2D,
  layerKey: string,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  fill: string | CanvasGradient,
  lineBox: { x: number; y: number; w: number; h: number }
) {
  if (typeof fill === "string" && isTransparentPaint(fill)) return;

  ctx.fillStyle = fill;
  drawTextLine(ctx, text, x, y, letterSpacingPx, "fill");

  if (layerKey === "highlight") {
    const a = ACRYLIC_GLASS_HEADLINE_PRESET.acrylic;
    ctx.save();
    ctx.globalAlpha *= 0.78;
    ctx.fillStyle = createDiagonalGradient(ctx, lineBox.x, lineBox.y, lineBox.w, lineBox.h, [
      { color: "rgba(255,255,255,0)", offset: 0 },
      { color: "rgba(255,255,255,0)", offset: 0.34 },
      { color: "rgba(255,255,255,.86)", offset: 0.44 },
      { color: a.softHighlight, offset: 0.52 },
      { color: "rgba(255,255,255,0)", offset: 0.66 },
      { color: "rgba(255,255,255,0)", offset: 1 },
    ]);
    drawTextLine(ctx, text, x, y, letterSpacingPx, "fill");
    ctx.restore();
  }
}

function parseAcrylicCanvasColor(value: string): [number, number, number, number] {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "transparent") return [0, 0, 0, 0];

  const hex = raw.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const expand = (part: string) => Number.parseInt(part.length === 1 ? part + part : part, 16);
    if (hex.length === 3 || hex.length === 4) {
      return [
        expand(hex[0]),
        expand(hex[1]),
        expand(hex[2]),
        hex.length === 4 ? expand(hex[3]) / 255 : 1,
      ];
    }
    return [
      expand(hex.slice(0, 2)),
      expand(hex.slice(2, 4)),
      expand(hex.slice(4, 6)),
      hex.length >= 8 ? expand(hex.slice(6, 8)) / 255 : 1,
    ];
  }

  const rgb = raw.match(/^rgba?\(([^)]+)\)$/i)?.[1];
  if (rgb) {
    const parts = rgb.split(",").map((part) => part.trim());
    return [
      clampNumber(Number.parseFloat(parts[0]), 0, 255, 255),
      clampNumber(Number.parseFloat(parts[1]), 0, 255, 255),
      clampNumber(Number.parseFloat(parts[2]), 0, 255, 255),
      parts[3] == null ? 1 : clampNumber(Number.parseFloat(parts[3]), 0, 1, 1),
    ];
  }

  return [255, 255, 255, 1];
}

function blurAcrylicAlpha(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.max(0, Math.round(radius));
  if (r < 1) return alpha;

  const tmp = new Uint8ClampedArray(alpha.length);
  const out = new Uint8ClampedArray(alpha.length);
  const size = r * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let ix = -r; ix <= r; ix += 1) {
      sum += alpha[row + Math.max(0, Math.min(width - 1, ix))];
    }
    for (let x = 0; x < width; x += 1) {
      tmp[row + x] = Math.round(sum / size);
      const removeX = Math.max(0, x - r);
      const addX = Math.min(width - 1, x + r + 1);
      sum += alpha[row + addX] - alpha[row + removeX];
    }
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let iy = -r; iy <= r; iy += 1) {
      sum += tmp[Math.max(0, Math.min(height - 1, iy)) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = Math.round(sum / size);
      const removeY = Math.max(0, y - r);
      const addY = Math.min(height - 1, y + r + 1);
      sum += tmp[addY * width + x] - tmp[removeY * width + x];
    }
  }

  return out;
}

type AcrylicAlphaFadeBand = {
  topY: number;
  solidHeight: number;
  featherHeight: number;
};

function acrylicAlphaFadeBandGate(cssY: number, band: AcrylicAlphaFadeBand, featherScale = 1) {
  const solidBottom = band.topY + Math.max(0, band.solidHeight);
  if (cssY <= solidBottom) return 1;

  const featherHeight = Math.max(1, band.featherHeight * featherScale);
  return clampNumber(1 - (cssY - solidBottom) / featherHeight, 0, 1, 0);
}

function drawAcrylicFilteredTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  mode: "fill" | "stroke",
  opts: {
    color: string;
    blur: number;
    fontSize: number;
    offsetX?: number;
    offsetY?: number;
    alphaFadeBand?: AcrylicAlphaFadeBand;
  }
) {
  if (isTransparentPaint(opts.color)) return;

  if (opts.blur > 0.01) {
    const pixelRatio = Math.max(1, Math.min(4, Math.abs(ctx.getTransform().a) || 1));
    const align = ctx.textAlign;
    const textWidth = canvasTextWidth(ctx, text, letterSpacingPx);
    const drawX = x + (opts.offsetX || 0);
    const drawY = y + (opts.offsetY || 0);
    const left =
      align === "center"
        ? drawX - textWidth / 2
        : align === "right" || align === "end"
        ? drawX - textWidth
        : drawX;
    const strokePad = mode === "stroke" ? Math.max(1, ctx.lineWidth || 1) * 2.4 : 0;
    const pad = Math.ceil(Math.max(10, opts.blur * 2.8 + strokePad + opts.fontSize * 0.08));
    const rect = {
      x: Math.floor(left - pad),
      y: Math.floor(drawY - opts.fontSize * 1.08 - pad),
      w: Math.ceil(textWidth + pad * 2),
      h: Math.ceil(opts.fontSize * 1.55 + pad * 2),
    };
    if (rect.w <= 0 || rect.h <= 0) return;

    const mask = document.createElement("canvas");
    mask.width = Math.max(1, Math.ceil(rect.w * pixelRatio));
    mask.height = Math.max(1, Math.ceil(rect.h * pixelRatio));
    const maskCtx = mask.getContext("2d", { willReadFrequently: true });
    if (!maskCtx) return;

    maskCtx.scale(pixelRatio, pixelRatio);
    maskCtx.font = ctx.font;
    maskCtx.textAlign = ctx.textAlign;
    maskCtx.textBaseline = ctx.textBaseline;
    maskCtx.lineJoin = ctx.lineJoin;
    maskCtx.miterLimit = ctx.miterLimit;
    maskCtx.lineWidth = ctx.lineWidth;
    maskCtx.fillStyle = "#fff";
    maskCtx.strokeStyle = "#fff";
    drawTextLine(maskCtx, text, drawX - rect.x, drawY - rect.y, letterSpacingPx, mode);

    const imageData = maskCtx.getImageData(0, 0, mask.width, mask.height);
    const data = imageData.data;
    const alpha = new Uint8ClampedArray(mask.width * mask.height);
    for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
      const py = Math.floor(pixel / mask.width);
      const cssY = rect.y + (py + 0.5) / pixelRatio;
      const bandGate = opts.alphaFadeBand
        ? acrylicAlphaFadeBandGate(cssY, opts.alphaFadeBand)
        : 1;
      alpha[pixel] = Math.round(data[index + 3] * bandGate);
    }

    const blurredAlpha = blurAcrylicAlpha(alpha, mask.width, mask.height, opts.blur * pixelRatio);
    const [r, g, b, a] = parseAcrylicCanvasColor(opts.color);
    for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
      const py = Math.floor(pixel / mask.width);
      const cssY = rect.y + (py + 0.5) / pixelRatio;
      const postGate = opts.alphaFadeBand
        ? acrylicAlphaFadeBandGate(cssY, opts.alphaFadeBand, 1.35)
        : 1;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = Math.round(blurredAlpha[pixel] * a * postGate);
    }
    maskCtx.putImageData(imageData, 0, 0);

    ctx.save();
    try {
      ctx.filter = "none";
    } catch {}
    ctx.drawImage(mask, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return;
  }

  ctx.save();
  try {
    ctx.filter = "none";
  } catch {}
  if (mode === "stroke") ctx.strokeStyle = opts.color;
  else ctx.fillStyle = opts.color;
  drawTextLine(
    ctx,
    text,
    x + (opts.offsetX || 0),
    y + (opts.offsetY || 0),
    letterSpacingPx,
    mode
  );
  ctx.restore();
}

function drawAcrylicGlowPasses(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  fontSize: number,
  strokeWidth: number
) {
  const a = ACRYLIC_GLASS_HEADLINE_PRESET.acrylic;
  const glowBlur = Math.max(a.glowBlur, fontSize * 0.06);

  ctx.save();
  try {
    ctx.globalCompositeOperation = "screen";
  } catch {}

  ctx.save();
  ctx.globalAlpha *= 0.92;
  ctx.lineWidth = Math.max(strokeWidth * 4.2, fontSize * 0.085, 6);
  drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacingPx, "stroke", {
    color: a.glowColor,
    blur: Math.max(18, glowBlur * 4.4, fontSize * 0.22),
    fontSize,
  });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.86;
  ctx.lineWidth = Math.max(strokeWidth * 2.4, fontSize * 0.052, 3.5);
  drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacingPx, "stroke", {
    color: a.edgeTint,
    blur: Math.max(9, glowBlur * 2.1, fontSize * 0.11),
    fontSize,
  });
  ctx.restore();

  ctx.restore();
}

function drawAcrylicUpperBloomPasses(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  fontSize: number,
  strokeWidth: number
) {
  const a = ACRYLIC_GLASS_HEADLINE_PRESET.acrylic;
  const bloomBlur = Math.max(a.upperBloomBlur, fontSize * 0.08);
  const metrics = ctx.measureText(text);
  const ascent = Number.isFinite(metrics.actualBoundingBoxAscent) && metrics.actualBoundingBoxAscent > 0
    ? metrics.actualBoundingBoxAscent
    : fontSize * 0.82;
  const fadeBand = {
    topY: y - ascent,
    solidHeight: Math.max(fontSize * 0.14, fontSize * (a.upperBloomBand / 100)),
    featherHeight: Math.max(fontSize * 0.12, fontSize * (a.upperBloomFeather / 100)),
  };

  ctx.save();
  try {
    ctx.globalCompositeOperation = "screen";
  } catch {}

  ctx.save();
  ctx.globalAlpha *= 0.52;
  drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacingPx, "fill", {
    color: a.topHighlight,
    blur: Math.max(7, bloomBlur * 0.92, fontSize * 0.065),
    fontSize,
    alphaFadeBand: fadeBand,
  });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.28;
  ctx.lineWidth = Math.max(strokeWidth * 1.4, fontSize * 0.028, 2);
  drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacingPx, "stroke", {
    color: a.edgeTint,
    blur: Math.max(10, bloomBlur * 1.35, fontSize * 0.09),
    fontSize,
    alphaFadeBand: {
      ...fadeBand,
      solidHeight: fadeBand.solidHeight * 0.82,
      featherHeight: fadeBand.featherHeight * 1.18,
    },
  });
  ctx.restore();

  ctx.restore();
}

function drawAcrylicGlassHeadlineToCanvas(
  node: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx: number;
    captureWidth: number;
    captureHeight: number;
  }
) {
  const headlineRect = node.getBoundingClientRect();
  const pixelRatio = Math.max(1, Math.min(3, opts.pixelRatio || 1));
  const width = Math.max(1, Math.ceil(opts.captureWidth + opts.paintPaddingPx * 2));
  const height = Math.max(1, Math.ceil(opts.captureHeight + opts.paintPaddingPx * 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Acrylic glass mobile headline canvas unavailable.");

  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const layers = Array.from(
    node.querySelectorAll<HTMLElement>("[data-acrylic-glass-layer]")
  ).filter((layer) => {
    const style = getComputedStyle(layer);
    return style.display !== "none" && style.visibility !== "hidden";
  });

  if (!layers.length) {
    throw new Error("Acrylic glass mobile headline layers unavailable.");
  }

  const acrylic = ACRYLIC_GLASS_HEADLINE_PRESET.acrylic;

  layers.forEach((layerEl) => {
    const layerKey = String(layerEl.dataset.acrylicGlassLayer || "");
    const layerStyle = getComputedStyle(layerEl);
    const layerFilter = getCanvasFilter(layerStyle);
    const layerComposite = toCanvasCompositeOperation(layerStyle.mixBlendMode);
    const layerOpacityBoost = getLayerOpacityBoost(layerKey);
    const lineEls = getLineElements(layerEl);

    lineEls.forEach((lineEl) => {
      const lineStyle = getComputedStyle(lineEl);
      const text = normalizeCanvasText(
        String(lineEl.textContent || "").replace(/\u00a0/g, " "),
        lineStyle.textTransform || layerStyle.textTransform || ""
      );
      if (!text.trim()) return;

      const lineRect = lineEl.getBoundingClientRect();
      if (lineRect.width <= 0 || lineRect.height <= 0) return;

      const fontSize = parseCssPx(lineStyle.fontSize, parseCssPx(layerStyle.fontSize, 64));
      const fontWeight = lineStyle.fontWeight || layerStyle.fontWeight || "900";
      const fontStyle = lineStyle.fontStyle && lineStyle.fontStyle !== "normal"
        ? `${lineStyle.fontStyle} `
        : layerStyle.fontStyle && layerStyle.fontStyle !== "normal"
        ? `${layerStyle.fontStyle} `
        : "";
      const fontFamily = lineStyle.fontFamily || layerStyle.fontFamily || "Impact, sans-serif";
      const lineHeight = resolveLineHeightPx(lineStyle, fontSize);
      const letterSpacing = parseCssPx(lineStyle.letterSpacing, parseCssPx(layerStyle.letterSpacing, 0));
      const align = String(
        lineStyle.textAlign || layerStyle.textAlign || getComputedStyle(node).textAlign || "left"
      ).toLowerCase();
      const lineX = opts.paintPaddingPx + lineRect.left - headlineRect.left;
      const lineY = opts.paintPaddingPx + lineRect.top - headlineRect.top;
      const lineBox = {
        x: lineX,
        y: lineY,
        w: Math.max(1, lineRect.width),
        h: Math.max(1, lineRect.height),
      };
      const x = align === "center"
        ? lineBox.x + lineBox.w / 2
        : align === "right" || align === "end"
        ? lineBox.x + lineBox.w
        : lineBox.x;
      const y = lineBox.y + resolveCanvasBaselineOffset(fontSize, lineBox.h, lineHeight);
      const opacity = clampNumber(getElementOpacity(lineEl, node) * layerOpacityBoost, 0, 1, 1);
      if (opacity <= 0.001) return;

      const fillFallback =
        layerKey === "translucent-3d"
          ? acrylic.depthFill
          : layerKey === "upper-bloom"
          ? acrylic.topHighlight
          : layerKey === "inner-dark" || layerKey === "glow"
          ? "transparent"
          : acrylic.fill;
      const fillColor = getTextFillColor(lineStyle, getTextFillColor(layerStyle, fillFallback));
      const strokeWidth = Math.max(getTextStrokeWidth(lineStyle), getTextStrokeWidth(layerStyle));
      const strokeColor = getTextStrokeColor(
        lineStyle,
        getTextStrokeColor(
          layerStyle,
          layerKey === "inner-dark"
            ? acrylic.innerDark
            : layerKey === "translucent-3d"
            ? acrylic.depthEdge
            : acrylic.edgeLight
        )
      );
      const fill = createLayerFill(
        ctx,
        layerKey,
        lineStyle,
        fillColor,
        lineBox.x,
        lineBox.y,
        lineBox.w,
        lineBox.h
      );
      const shadows = parseTextShadow(lineStyle.textShadow || layerStyle.textShadow || "");

      ctx.save();
      ctx.font = `${fontStyle}${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = align === "center" ? "center" : align === "right" || align === "end" ? "right" : "left";
      ctx.globalCompositeOperation = layerComposite;
      ctx.globalAlpha = opacity;
      try {
        ctx.filter = layerKey === "glow" || layerKey === "upper-bloom" ? "none" : layerFilter;
      } catch {}

      if (layerKey === "glow") {
        drawAcrylicGlowPasses(ctx, text, x, y, letterSpacing, fontSize, strokeWidth);
      }

      if (layerKey === "upper-bloom") {
        drawAcrylicUpperBloomPasses(ctx, text, x, y, letterSpacing, fontSize, strokeWidth);
        ctx.restore();
        return;
      }

      shadows.slice().reverse().forEach((shadow) => {
        ctx.save();
        drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacing, "fill", {
          color: shadow.color,
          blur: shadow.blur,
          fontSize,
          offsetX: shadow.x,
          offsetY: shadow.y,
        });
        ctx.restore();
      });

      if (layerKey !== "glow" && strokeWidth > 0.01 && !isTransparentPaint(strokeColor)) {
        ctx.save();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        drawTextLine(ctx, text, x, y, letterSpacing, "stroke");
        ctx.restore();
      }

      drawAcrylicLineFill(ctx, layerKey, text, x, y, letterSpacing, fill, lineBox);

      if (layerKey === "reflections") {
        ctx.save();
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = createDiagonalGradient(ctx, lineBox.x, lineBox.y, lineBox.w, lineBox.h, [
          { color: "rgba(255,255,255,0)", offset: 0 },
          { color: "rgba(255,255,255,.84)", offset: 0.22 },
          { color: "rgba(255,255,255,0)", offset: 0.3 },
          { color: "rgba(180,245,255,.5)", offset: 0.68 },
          { color: "rgba(255,255,255,0)", offset: 0.8 },
          { color: "rgba(255,255,255,0)", offset: 1 },
        ]);
        drawTextLine(ctx, text, x, y, letterSpacing, "fill");
        ctx.restore();
      }

      if (layerKey === "glow") {
        ctx.save();
        ctx.globalAlpha *= 0.52;
        ctx.lineWidth = Math.max(1.8, fontSize * 0.034);
        drawAcrylicFilteredTextLine(ctx, text, x, y, letterSpacing, "stroke", {
          color: acrylic.softHighlight,
          blur: Math.max(7, fontSize * 0.075),
          fontSize,
        });
        ctx.restore();
      }

      ctx.restore();
    });
  });

  return canvas.toDataURL("image/png");
}

function findAcrylicGlassHeadline(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-node="headline"]')).find(
    (node) => !!node.querySelector("[data-acrylic-glass-layer]")
  ) || null;
}

async function rasterizeAcrylicGlassMobileHeadlineNodesForExport(
  root: HTMLElement,
  opts: {
    pixelRatio: number;
    paintPaddingPx?: number;
    onStage?: (label: string) => void;
    onProgress?: (p: number) => void;
  }
) {
  const headline = findAcrylicGlassHeadline(root);
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

  opts.onStage?.("Rasterizing acrylic glass mobile headline...");
  await twoFrames();

  const rasterUrl = drawAcrylicGlassHeadlineToCanvas(headline, {
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

async function rasterizeAcrylicGlassMobileFinalNodesForExport(
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
  const headline = findAcrylicGlassHeadline(root);

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

  const restoreAcrylicHeadline = await rasterizeAcrylicGlassMobileHeadlineNodesForExport(root, opts);
  restores.push(restoreAcrylicHeadline);

  return () => {
    for (let index = restores.length - 1; index >= 0; index -= 1) {
      try {
        restores[index]?.();
      } catch {}
    }
  };
}

export function shouldRenderAcrylicGlassMobileFinalHeadline(
  config: Pick<AcrylicGlassMobileFinalRenderConfig, "enabled" | "headlineHidden" | "headline">
) {
  return shouldRenderHeadlineFinalRaster(config);
}

export function renderAcrylicGlassMobileFinalHeadline(
  config: AcrylicGlassMobileFinalRenderConfig
) {
  const rasterizeDefaultHeadlineNodes = config.rasterizeHeadlineNodesForExport;

  return renderHeadlineFinalRaster({
    ...config,
    paintPaddingPx: config.paintPaddingPx ?? ACRYLIC_GLASS_MOBILE_FINAL_RENDER_PAINT_PADDING_PX,
    rasterizeHeadlineNodesForExport: (root, opts) =>
      rasterizeAcrylicGlassMobileFinalNodesForExport(root, opts, rasterizeDefaultHeadlineNodes),
  });
}
