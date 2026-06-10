import * as htmlToImage from "html-to-image";
import React, { type CSSProperties } from "react";
import {
  ACRYLIC_GLASS_HEADLINE_PRESET,
  buildAcrylicGlassGlowStyle,
  buildAcrylicGlassHighlightStyle,
  buildAcrylicGlassInnerDarkStyle,
  buildAcrylicGlassMainStyle,
  buildAcrylicGlassReflectionStyle,
  buildAcrylicGlassTranslucent3DStyle,
  buildAcrylicGlassUpperBloomStyle,
} from "./acrylic-glass";
import { applyFinalFilmGradeToCanvas } from "./final-grade";

const MOBILE_EXPORT_TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const MOBILE_EXPORT_DEFAULT_LINE_HEIGHT = 0.86;

export type MobileCanvasRasterLayer = {
  kind: "raster";
  el: HTMLElement;
  id: string;
  src: string;
  rect: { x: number; y: number; w: number; h: number };
  placement: "visual-rect" | "layout-rect";
  transform?: string;
  originX?: number;
  originY?: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation | string;
  filter?: string;
};

type MobileCanvasLayer =
  | { kind: "image"; el: HTMLImageElement }
  | { kind: "svg"; el: SVGSVGElement }
  | { kind: "text"; el: HTMLElement }
  | MobileCanvasRasterLayer;

export type MobileCanvasCompositorOptions = {
  width: number;
  height: number;
  scale: number;
  format: "png" | "jpg";
  backgroundSrc?: string | null;
  overlays: { haze: number; grade: number; leak: number; vignette: number };
  finalFilter?: string;
  finalFilmGrade?: number;
  fontEmbedCss?: string;
  rasterLayers?: MobileCanvasRasterLayer[];
  onStage?: (label: string) => void;
  onProgress?: (p: number) => void;
};

function clampAlpha(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function canLoadCanvasSource(src?: string | null) {
  const value = String(src || "").trim();
  return !!value && !value.startsWith("about:") && !value.startsWith("javascript:");
}

function waitForMobileCanvasFrame() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      resolve();
    };
    const timeout = window.setTimeout(finish, 80);
    window.requestAnimationFrame(() => finish());
  });
}

async function waitForDecode(promise: Promise<void> | undefined | null, timeoutMs: number) {
  if (!promise || typeof promise.then !== "function") return;
  await Promise.race([
    promise.catch(() => undefined),
    new Promise<void>((resolve) => {
      if (typeof window !== "undefined") {
        window.setTimeout(resolve, timeoutMs);
      } else {
        setTimeout(resolve, timeoutMs);
      }
    }),
  ]);
}

async function loadMobileCanvasImage(src: string): Promise<HTMLImageElement> {
  if (!canLoadCanvasSource(src)) throw new Error("Missing image source");
  const img = new Image();
  if (!src.startsWith("data:") && !src.startsWith("blob:")) {
    img.crossOrigin = "anonymous";
  }
  img.decoding = "async";
  img.loading = "eager";

  await new Promise<void>((resolve, reject) => {
    const timeout = typeof window !== "undefined"
      ? window.setTimeout(() => {
          cleanup();
          reject(new Error("Image preload timed out"));
        }, 7000)
      : null;
    const cleanup = () => {
      if (timeout !== null) window.clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
    img.onload = () => {
      cleanup();
      resolve();
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Image failed to preload"));
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      cleanup();
      resolve();
    }
  });

  await waitForDecode((img as any).decode?.(), 1500);
  return img;
}

async function isMobileCanvasRasterSourceBlank(src: string) {
  try {
    const image = await loadMobileCanvasImage(src);
    const probe = document.createElement("canvas");
    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;
    const probeMax = 96;
    const scale = Math.min(1, probeMax / Math.max(naturalWidth, naturalHeight));
    probe.width = Math.max(1, Math.round(naturalWidth * scale));
    probe.height = Math.max(1, Math.round(naturalHeight * scale));
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(image, 0, 0, probe.width, probe.height);
    const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 8) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseCssPx(value: string | null | undefined, fallback = 0) {
  const raw = String(value || "").trim();
  if (!raw || raw === "normal") return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveLineHeightPx(style: CSSStyleDeclaration, fontSizePx: number) {
  const fallback = Math.max(1, fontSizePx * MOBILE_EXPORT_DEFAULT_LINE_HEIGHT);
  const parsed = parseCssPx(style.lineHeight, fallback);
  return parsed < fontSizePx * 0.42 ? fallback : parsed;
}

function normalizeCanvasText(text: string, transform: string) {
  if (/uppercase/i.test(transform)) return text.toUpperCase();
  if (/lowercase/i.test(transform)) return text.toLowerCase();
  return text;
}

function splitCssList(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < input.length; index += 1) {
    const ch = input[index];
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(input.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = input.slice(start).trim();
  if (tail) out.push(tail);
  return out;
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
  mode: "fill" | "stroke" = "fill"
) {
  const chars = Array.from(text);
  const paint = (value: string, px: number) => {
    if (mode === "stroke") ctx.strokeText(value, px, y);
    else ctx.fillText(value, px, y);
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

type MobileCanvasCssFilterOp = {
  name: "brightness" | "contrast" | "saturate" | "sepia" | "hue-rotate";
  value: number;
};

function parseMobileCanvasCssFilterOps(filterCss?: string) {
  const css = String(filterCss || "none").trim();
  if (!css || css === "none") return { ops: [] as MobileCanvasCssFilterOp[], fullySupported: true };

  const ops: MobileCanvasCssFilterOp[] = [];
  let fullySupported = true;
  const re = /([a-z-]+)\(([^()]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(css))) {
    const name = match[1].toLowerCase();
    const rawValue = String(match[2] || "").trim();
    const numeric = rawValue.match(/^([-+]?\d*\.?\d+)(%|deg|rad|turn)?$/i);
    if (!numeric) {
      fullySupported = false;
      continue;
    }

    const number = Number(numeric[1]);
    const unit = String(numeric[2] || "").toLowerCase();
    if (!Number.isFinite(number)) {
      fullySupported = false;
      continue;
    }

    let value = number;
    if (name === "hue-rotate") {
      if (unit === "rad") value = number * (180 / Math.PI);
      else if (unit === "turn") value = number * 360;
      else if (unit && unit !== "deg") {
        fullySupported = false;
        continue;
      }
    } else if (unit === "%") {
      value = number / 100;
    } else if (unit) {
      fullySupported = false;
      continue;
    }

    if (
      name === "brightness" ||
      name === "contrast" ||
      name === "saturate" ||
      name === "sepia" ||
      name === "hue-rotate"
    ) {
      ops.push({ name, value } as MobileCanvasCssFilterOp);
    } else {
      fullySupported = false;
    }
  }

  const unmatched = css.replace(re, " ").replace(/\s+/g, "").trim();
  if (unmatched) fullySupported = false;

  return { ops, fullySupported };
}

function buildMobileCanvasSepiaColorMatrix(amount: number) {
  const a = Math.max(0, Math.min(1, amount));
  const inv = 1 - a;
  return [
    inv + a * 0.393, a * 0.769, a * 0.189, 0, 0,
    a * 0.349, inv + a * 0.686, a * 0.168, 0, 0,
    a * 0.272, a * 0.534, inv + a * 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function multiplyMobileCanvasColorMatrices(a: number[], b: number[]) {
  const out = [...a];
  out[0] = a[0] * b[0] + a[1] * b[5] + a[2] * b[10] + a[3] * b[15];
  out[1] = a[0] * b[1] + a[1] * b[6] + a[2] * b[11] + a[3] * b[16];
  out[2] = a[0] * b[2] + a[1] * b[7] + a[2] * b[12] + a[3] * b[17];
  out[3] = a[0] * b[3] + a[1] * b[8] + a[2] * b[13] + a[3] * b[18];
  out[4] = a[0] * b[4] + a[1] * b[9] + a[2] * b[14] + a[3] * b[19] + a[4];
  out[5] = a[5] * b[0] + a[6] * b[5] + a[7] * b[10] + a[8] * b[15];
  out[6] = a[5] * b[1] + a[6] * b[6] + a[7] * b[11] + a[8] * b[16];
  out[7] = a[5] * b[2] + a[6] * b[7] + a[7] * b[12] + a[8] * b[17];
  out[8] = a[5] * b[3] + a[6] * b[8] + a[7] * b[13] + a[8] * b[18];
  out[9] = a[5] * b[4] + a[6] * b[9] + a[7] * b[14] + a[8] * b[19] + a[9];
  out[10] = a[10] * b[0] + a[11] * b[5] + a[12] * b[10] + a[13] * b[15];
  out[11] = a[10] * b[1] + a[11] * b[6] + a[12] * b[11] + a[13] * b[16];
  out[12] = a[10] * b[2] + a[11] * b[7] + a[12] * b[12] + a[13] * b[17];
  out[13] = a[10] * b[3] + a[11] * b[8] + a[12] * b[13] + a[13] * b[18];
  out[14] = a[10] * b[4] + a[11] * b[9] + a[12] * b[14] + a[13] * b[19] + a[14];
  out[15] = a[15] * b[0] + a[16] * b[5] + a[17] * b[10] + a[18] * b[15];
  out[16] = a[15] * b[1] + a[16] * b[6] + a[17] * b[11] + a[18] * b[16];
  out[17] = a[15] * b[2] + a[16] * b[7] + a[17] * b[12] + a[18] * b[17];
  out[18] = a[15] * b[3] + a[16] * b[8] + a[17] * b[13] + a[18] * b[18];
  out[19] = a[15] * b[4] + a[16] * b[9] + a[17] * b[14] + a[18] * b[19] + a[19];
  return out;
}

function buildMobileCanvasCssFilterMatrix(op: MobileCanvasCssFilterOp) {
  if (op.name === "brightness") {
    const b = Math.max(0, op.value);
    return [
      b, 0, 0, 0, 0,
      0, b, 0, 0, 0,
      0, 0, b, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "contrast") {
    const c = Math.max(0, op.value);
    const offset = 0.5 * (1 - c);
    return [
      c, 0, 0, 0, offset,
      0, c, 0, 0, offset,
      0, 0, c, 0, offset,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "saturate") {
    const s = Math.max(0, op.value);
    return [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  if (op.name === "sepia") {
    return buildMobileCanvasSepiaColorMatrix(op.value);
  }

  const rad = (op.value * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0,
    0,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0,
    0,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
    0,
    0,
    0, 0, 0, 1, 0,
  ];
}

function buildMobileCanvasCssColorMatrix(ops: MobileCanvasCssFilterOp[]) {
  let matrix = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];

  for (const op of ops) {
    matrix = multiplyMobileCanvasColorMatrices(buildMobileCanvasCssFilterMatrix(op), matrix);
  }

  return matrix;
}

function applyMobileCanvasCssColorFilter(
  canvas: HTMLCanvasElement,
  filterCss?: string
) {
  const parsed = parseMobileCanvasCssFilterOps(filterCss);
  if (!parsed.fullySupported || parsed.ops.length === 0) {
    return parsed.ops.length === 0 && parsed.fullySupported;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const matrix = buildMobileCanvasCssColorMatrix(parsed.ops);
    const clampChannel = (value: number) =>
      Math.max(0, Math.min(255, Math.round(value * 255)));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      data[i] = clampChannel(matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[4]);
      data[i + 1] = clampChannel(matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[9]);
      data[i + 2] = clampChannel(matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[14]);
    }

    ctx.putImageData(imageData, 0, 0);
    return true;
  } catch {
    return false;
  }
}

function isMobileCanvasEditorUi(el: Element) {
  if (el.closest('[data-nonexport="true"]')) return true;
  if (el.closest("button, input, textarea, select")) return true;
  if (el.closest('[role="button"], [data-mobile-float-lock="true"]')) return true;
  if (el.closest(".drag-handle, .resize-handle, .portrait-handle")) return true;
  return false;
}

function isInsideRasterizedMobileText(el: Element) {
  return !!el.closest('[data-export-rasterized-body-text="true"]');
}

function hasExportableSvgDescendant(el: Element) {
  return Array.from(el.querySelectorAll<SVGSVGElement>("svg")).some((svg) => {
    if (isMobileCanvasEditorUi(svg)) return false;
    if (svg.closest('[data-export-defs="true"]')) return false;
    return true;
  });
}

function getExportLayerOrderAnchor(el: Element) {
  const dataset = (el as HTMLElement).dataset;
  if (dataset?.exportLayerOwner || dataset?.exportRasterizedHeadline === "true") {
    return el.closest("[data-node]") || el;
  }
  return el;
}

function getExportLayerOrder(el: Element, root: HTMLElement, orderMap: Map<Element, number>) {
  let z = 0;
  let depth = 0;
  let current: Element | null = el;
  while (current && current !== root.parentElement) {
    const style = getComputedStyle(current);
    const parsed = Number.parseInt(style.zIndex || "", 10);
    if (Number.isFinite(parsed)) z += parsed * Math.pow(0.01, depth);
    if (current === root) break;
    current = current.parentElement;
    depth += 1;
  }
  const orderAnchor = getExportLayerOrderAnchor(el);
  return z * 100000 + (orderMap.get(orderAnchor) ?? orderMap.get(el) ?? 0);
}

function getCanvasBlendMode(el: Element, root: HTMLElement): GlobalCompositeOperation {
  let current: Element | null = el;
  while (current && current !== root.parentElement) {
    const mode = getComputedStyle(current).mixBlendMode;
    if (mode && mode !== "normal") {
      return toCanvasCompositeOperation(mode);
    }
    if (current === root) break;
    current = current.parentElement;
  }
  return "source-over";
}

function getCanvasFilter(el: Element, root: HTMLElement) {
  const filters: string[] = [];
  let current: Element | null = el;
  while (current && current !== root.parentElement) {
    const filter = getComputedStyle(current).filter;
    if (filter && filter !== "none" && !filter.includes("url(")) {
      filters.unshift(filter);
    }
    if (current === root) break;
    current = current.parentElement;
  }
  return filters.join(" ") || "none";
}

function getRectInExportRoot(el: Element, rootRect: DOMRect) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    w: rect.width,
    h: rect.height,
  };
}

function getUntransformedRectInExportRoot(
  el: HTMLElement,
  root: HTMLElement,
  rootRect: DOMRect
) {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = el;

  while (current && current !== root) {
    x += current.offsetLeft || 0;
    y += current.offsetTop || 0;
    current = current.offsetParent as HTMLElement | null;
  }

  const rect = el.getBoundingClientRect();
  if (current !== root || !Number.isFinite(x) || !Number.isFinite(y)) {
    x = rect.left - rootRect.left;
    y = rect.top - rootRect.top;
  }

  return {
    x,
    y,
    w: Math.max(1, el.offsetWidth || rect.width),
    h: Math.max(1, el.offsetHeight || rect.height),
  };
}

function isUsableExportRect(rect: { x: number; y: number; w: number; h: number }) {
  return (
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.w) &&
    Number.isFinite(rect.h) &&
    rect.w > 0.5 &&
    rect.h > 0.5
  );
}

function shouldKeepMobileCanvasRasterNode(node: HTMLElement) {
  if (node.dataset?.nonexport === "true") return false;
  if (node.classList?.contains("debug-grid")) return false;
  if (node.classList?.contains("bounding-box")) return false;
  if (node.classList?.contains("text-bounding")) return false;
  if (node.classList?.contains("text-outline")) return false;
  if (node.classList?.contains("highlight-box")) return false;
  if (node.classList?.contains("drag-handle")) return false;
  if (node.classList?.contains("resize-handle")) return false;
  if (node.classList?.contains("portrait-handle")) return false;
  if (node.classList?.contains("portrait-bounding")) return false;
  if (node.classList?.contains("portrait-outline")) return false;
  if (node.classList?.contains("portrait-border")) return false;
  if (node.classList?.contains("portrait-slot")) return false;
  if (node.classList?.contains("overlay-grid")) return false;
  if (node.tagName === "BUTTON" || node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
    return false;
  }
  return true;
}

function mobileCanvasRasterTargetHasPaint(target: HTMLElement) {
  if (String(target.innerText || target.textContent || "").trim()) return true;

  return Array.from(target.querySelectorAll<HTMLElement | SVGElement>("img, svg, canvas, video"))
    .some((el) => {
      if ((el as HTMLElement).dataset?.nonexport === "true") return false;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const opacity = Number.parseFloat(style.opacity || "1");
      return !Number.isFinite(opacity) || opacity > 0.001;
    });
}

function getMobileCanvasRasterPaintRect(target: HTMLElement) {
  const targetRect = target.getBoundingClientRect();
  let left = targetRect.left;
  let top = targetRect.top;
  let right = targetRect.right;
  let bottom = targetRect.bottom;

  [target, ...Array.from(target.querySelectorAll<HTMLElement>("*"))].forEach((node) => {
    if (!shouldKeepMobileCanvasRasterNode(node)) return;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return;
    const opacity = Number.parseFloat(style.opacity || "1");
    if (Number.isFinite(opacity) && opacity <= 0.001) return;

    const rect = node.getBoundingClientRect();
    if (rect.width <= 0.5 || rect.height <= 0.5) return;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  });

  const pad = 8;
  return {
    left: left - pad,
    top: top - pad,
    width: Math.max(1, right - left + pad * 2),
    height: Math.max(1, bottom - top + pad * 2),
  };
}

function shouldRasterizeMobileCanvasTextNode(node: HTMLElement, rootRect: DOMRect) {
  if (isMobileCanvasEditorUi(node)) return false;
  if (isInsideRasterizedMobileText(node)) return false;
  if (node.querySelector("[data-export-rasterized-headline]")) return false;
  const style = getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const opacity = Number.parseFloat(style.opacity || "1");
  if (Number.isFinite(opacity) && opacity <= 0.001) return false;
  if (!mobileCanvasRasterTargetHasPaint(node)) return false;
  return isUsableExportRect(getRectInExportRoot(node, rootRect));
}

async function rasterizeMobileCanvasTextNode(
  root: HTMLElement,
  node: HTMLElement,
  opts: {
    id: string;
    pixelRatio: number;
    fontEmbedCss?: string;
    paintPaddingPx?: number;
  }
): Promise<MobileCanvasRasterLayer | null> {
  const rootRect = root.getBoundingClientRect();
  const targetRect = node.getBoundingClientRect();
  const layoutRect = getUntransformedRectInExportRoot(node, root, rootRect);
  const targetStyle = getComputedStyle(node);
  const paintPaddingPx = Math.max(0, Math.ceil(Number(opts.paintPaddingPx || 0)));
  const basePaintRect = getMobileCanvasRasterPaintRect(node);
  const paintRect = {
    left: basePaintRect.left - paintPaddingPx,
    top: basePaintRect.top - paintPaddingPx,
    width: basePaintRect.width + paintPaddingPx * 2,
    height: basePaintRect.height + paintPaddingPx * 2,
  };
  const layoutWidth = Math.max(
    1,
    Math.ceil(node.offsetWidth || node.scrollWidth || layoutRect.w || targetRect.width)
  );
  const layoutHeight = Math.max(
    1,
    Math.ceil(node.offsetHeight || node.scrollHeight || layoutRect.h || targetRect.height)
  );
  const width = Math.max(1, Math.ceil(paintRect.width));
  const height = Math.max(1, Math.ceil(paintRect.height));

  if (rootRect.width <= 0 || rootRect.height <= 0 || width <= 0 || height <= 0) {
    return null;
  }

  const tempWrapper = document.createElement("div");
  const clone = node.cloneNode(true) as HTMLElement;
  const targetLayoutLeft = rootRect.left + layoutRect.x;
  const targetLayoutTop = rootRect.top + layoutRect.y;
  const targetOffsetX = targetLayoutLeft - paintRect.left;
  const targetOffsetY = targetLayoutTop - paintRect.top;
  const offscreenLeft = `-${Math.max(4096, width + 512)}px`;

  Object.assign(tempWrapper.style, {
    position: "fixed",
    left: offscreenLeft,
    top: "0px",
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: "none",
    maxHeight: "none",
    overflow: "visible",
    background: "transparent",
    backgroundColor: "transparent",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  Object.assign(clone.style, {
    position: "absolute",
    left: `${targetOffsetX}px`,
    top: `${targetOffsetY}px`,
    right: "auto",
    bottom: "auto",
    transform: targetStyle.transform || "none",
    transformOrigin: targetStyle.transformOrigin || "50% 50%",
    margin: "0",
    width: `${layoutWidth}px`,
    height: `${layoutHeight}px`,
    maxWidth: "none",
    maxHeight: "none",
    background: targetStyle.background || "transparent",
    backgroundColor: targetStyle.backgroundColor || "transparent",
    boxShadow: targetStyle.boxShadow || "none",
    borderRadius: targetStyle.borderRadius || "0px",
    overflow: "visible",
  } as Partial<CSSStyleDeclaration>);

  tempWrapper.appendChild(clone);
  document.body.appendChild(tempWrapper);
  await waitForMobileCanvasFrame();

  let src = "";
  try {
    src = await htmlToImage.toPng(tempWrapper, {
      cacheBust: true,
      imagePlaceholder: MOBILE_EXPORT_TRANSPARENT_PIXEL,
      backgroundColor: "transparent",
      pixelRatio: Math.max(1, Math.min(3, opts.pixelRatio || 1)),
      fontEmbedCSS: opts.fontEmbedCss || undefined,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      skipAutoScale: true,
      style: {
        position: "relative",
        left: "0px",
        top: "0px",
        right: "auto",
        bottom: "auto",
        transform: "none",
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: "none",
        maxHeight: "none",
        background: "transparent",
        backgroundColor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
        borderRadius: "0px",
        overflow: "visible",
      } as any,
      filter: (child: HTMLElement) => {
        const el = child as HTMLElement;
        if (!el) return true;
        return shouldKeepMobileCanvasRasterNode(el);
      },
    });
  } finally {
    tempWrapper.remove();
  }

  if (!src) return null;
  if (await isMobileCanvasRasterSourceBlank(src)) return null;

  return {
    kind: "raster",
    el: node,
    id: opts.id,
    src,
    rect: {
      x: paintRect.left - rootRect.left,
      y: paintRect.top - rootRect.top,
      w: width,
      h: height,
    },
    placement: "visual-rect",
    opacity: 1,
    blendMode: getCanvasBlendMode(node, root),
    filter: "none",
  };
}

async function rasterizeMobileCanvasTextNodes(
  root: HTMLElement,
  rootRect: DOMRect,
  opts: {
    pixelRatio: number;
    fontEmbedCss?: string;
    onProgress?: (p: number) => void;
  }
) {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"))
    .filter((node) => shouldRasterizeMobileCanvasTextNode(node, rootRect));
  const layers: MobileCanvasRasterLayer[] = [];
  const rasterizedElements = new Set<Element>();

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    try {
      const layer = await rasterizeMobileCanvasTextNode(root, node, {
        id: `dom-text-${node.dataset.node || index}`,
        pixelRatio: opts.pixelRatio,
        fontEmbedCss: opts.fontEmbedCss,
        paintPaddingPx: node.dataset.node === "headline" ? 180 : 18,
      });
      if (layer) {
        layers.push(layer);
        rasterizedElements.add(node);
      }
    } catch {
      // Fall back to the light canvas text renderer for this one node.
    }
    if (index % 3 === 0) {
      opts.onProgress?.(76 + Math.round((index / Math.max(1, nodes.length)) * 6));
      await waitForMobileCanvasFrame();
    }
  }

  return { layers, rasterizedElements };
}

function isInsideRasterizedMobileCanvasElement(
  el: Element,
  rasterizedElements: Set<Element>
) {
  const owner = el.closest("[data-node]");
  return !!owner && rasterizedElements.has(owner);
}

function getExportElementOpacity(el: HTMLElement | SVGElement, root: HTMLElement) {
  let opacity = 1;
  let current: HTMLElement | SVGElement | null = el;
  while (current && current !== root.parentElement) {
    const style = getComputedStyle(current as Element);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    opacity *= clampAlpha(Number.parseFloat(style.opacity || "1"));
    if (current === root) break;
    current = current.parentElement as HTMLElement | null;
  }
  return clampAlpha(opacity);
}

function getTextPaintElement(node: HTMLElement) {
  const visibleChildren = Array.from(node.querySelectorAll<HTMLElement>("h1, span, div, p"))
    .filter((child) => {
      if (child.closest('[data-nonexport="true"]')) return false;
      const text = child.innerText || child.textContent || "";
      if (!text.trim()) return false;
      const style = getComputedStyle(child);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  return visibleChildren[visibleChildren.length - 1] || node;
}

function getTextLinesForCanvas(el: HTMLElement) {
  const raw = el.innerText || el.textContent || "";
  return raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, arr) => line.length > 0 || (index > 0 && index < arr.length - 1));
}

function drawMobileCanvasOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: { haze: number; grade: number; leak: number; vignette: number }
) {
  const hazeAlpha = clampAlpha(opts.haze * 0.25);
  if (hazeAlpha > 0.001) {
    ctx.save();
    const hazeGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    hazeGradient.addColorStop(0, `rgba(0,0,0,${hazeAlpha})`);
    hazeGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const gradeAlpha = clampAlpha(opts.grade);
  if (gradeAlpha > 0.001) {
    ctx.save();
    try { ctx.globalCompositeOperation = "soft-light"; } catch {}
    ctx.globalAlpha = gradeAlpha;
    let g = ctx.createRadialGradient(width * 0.75, height * 0.15, 0, width * 0.75, height * 0.15, width * 0.95);
    g.addColorStop(0, "rgba(255,190,120,0.55)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    g = ctx.createRadialGradient(width * 0.15, height * 0.85, 0, width * 0.15, height * 0.85, width * 0.95);
    g.addColorStop(0, "rgba(70,130,255,0.55)");
    g.addColorStop(0.52, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const leakAlpha = clampAlpha(opts.leak);
  if (leakAlpha > 0.001) {
    ctx.save();
    try { ctx.globalCompositeOperation = "screen"; } catch {}
    ctx.globalAlpha = leakAlpha;
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.62);
    g.addColorStop(0, "rgba(255,80,0,0.45)");
    g.addColorStop(0.6, "rgba(255,80,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    g = ctx.createRadialGradient(width, height, 0, width, height, width * 0.68);
    g.addColorStop(0, "rgba(200,0,255,0.38)");
    g.addColorStop(0.58, "rgba(200,0,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const vignetteMid = Math.min(0.46, opts.vignette * 1.65);
  const vignetteEdge = Math.min(0.72, opts.vignette * 2.35);
  if (vignetteEdge > 0.001) {
    ctx.save();
    const r = Math.max(width, height) * 0.72;
    const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, r);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.68, `rgba(0,0,0,${vignetteMid})`);
    g.addColorStop(1, `rgba(0,0,0,${vignetteEdge})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

async function drawMobileCanvasImageLayer(
  ctx: CanvasRenderingContext2D,
  root: HTMLElement,
  rootRect: DOMRect,
  imgEl: HTMLImageElement
) {
  const isRasterizedHeadline = imgEl.dataset.exportRasterizedHeadline === "true";
  const rasterRect = isRasterizedHeadline
    ? {
        x: Number(imgEl.dataset.exportX),
        y: Number(imgEl.dataset.exportY),
        w: Number(imgEl.dataset.exportW),
        h: Number(imgEl.dataset.exportH),
      }
    : null;
  const rect = rasterRect && isUsableExportRect(rasterRect)
    ? rasterRect
    : getRectInExportRoot(imgEl, rootRect);
  if (!isUsableExportRect(rect)) return;

  const src = imgEl.currentSrc || imgEl.getAttribute("src") || "";
  if (!src || src === MOBILE_EXPORT_TRANSPARENT_PIXEL) return;

  const opacity = getExportElementOpacity(imgEl, root);
  if (opacity <= 0.001) return;
  const image = await loadMobileCanvasImage(src);

  ctx.save();
  ctx.globalAlpha = opacity;
  try { ctx.globalCompositeOperation = getCanvasBlendMode(imgEl, root); } catch {}
  try { ctx.filter = getCanvasFilter(imgEl, root); } catch {}
  if (isRasterizedHeadline) {
    const originX = Number(imgEl.dataset.exportOriginX);
    const originY = Number(imgEl.dataset.exportOriginY);
    const ox = Number.isFinite(originX) ? originX : rect.w / 2;
    const oy = Number.isFinite(originY) ? originY : rect.h / 2;
    const transform = imgEl.dataset.exportTransform || "none";
    ctx.translate(rect.x + ox, rect.y + oy);
    if (transform && transform !== "none" && typeof DOMMatrixReadOnly !== "undefined") {
      try {
        const matrix = new DOMMatrixReadOnly(transform);
        ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
      } catch {}
    }
    ctx.drawImage(image, -ox, -oy, rect.w, rect.h);
  } else {
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

async function drawMobileCanvasSvgLayer(
  ctx: CanvasRenderingContext2D,
  root: HTMLElement,
  rootRect: DOMRect,
  svgEl: SVGSVGElement
) {
  const rect = getRectInExportRoot(svgEl, rootRect);
  if (!isUsableExportRect(rect)) return;
  const opacity = getExportElementOpacity(svgEl, root);
  if (opacity <= 0.001) return;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("width")) clone.setAttribute("width", String(Math.ceil(rect.w)));
  if (!clone.getAttribute("height")) clone.setAttribute("height", String(Math.ceil(rect.h)));
  const serialized = new XMLSerializer().serializeToString(clone);
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  const image = await loadMobileCanvasImage(src);
  ctx.save();
  ctx.globalAlpha = opacity;
  try { ctx.globalCompositeOperation = getCanvasBlendMode(svgEl, root); } catch {}
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

async function drawMobileCanvasRasterLayer(
  ctx: CanvasRenderingContext2D,
  layer: MobileCanvasRasterLayer
) {
  if (!isUsableExportRect(layer.rect)) return;
  const image = await loadMobileCanvasImage(layer.src);
  ctx.save();
  ctx.globalAlpha = clampAlpha(layer.opacity ?? 1);
  try { ctx.globalCompositeOperation = toCanvasCompositeOperation(String(layer.blendMode || "source-over")); } catch {}
  try { ctx.filter = layer.filter || "none"; } catch {}

  if (layer.placement === "visual-rect") {
    ctx.drawImage(image, layer.rect.x, layer.rect.y, layer.rect.w, layer.rect.h);
  } else {
    const ox = Number.isFinite(layer.originX) ? layer.originX! : layer.rect.w / 2;
    const oy = Number.isFinite(layer.originY) ? layer.originY! : layer.rect.h / 2;
    ctx.translate(layer.rect.x + ox, layer.rect.y + oy);
    if (layer.transform && layer.transform !== "none" && typeof DOMMatrixReadOnly !== "undefined") {
      try {
        const matrix = new DOMMatrixReadOnly(layer.transform);
        ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
      } catch {}
    }
    ctx.drawImage(image, -ox, -oy, layer.rect.w, layer.rect.h);
  }

  ctx.restore();
}

function drawMobileCanvasTextLayer(
  ctx: CanvasRenderingContext2D,
  root: HTMLElement,
  rootRect: DOMRect,
  node: HTMLElement
) {
  if (node.querySelector("[data-export-rasterized-headline]")) return;
  if (node.dataset.node === "headline" && node.querySelector("img")) return;
  if (hasExportableSvgDescendant(node)) return;
  const paintEl = getTextPaintElement(node);
  const lines = getTextLinesForCanvas(paintEl);
  if (!lines.length) return;
  const rect = getRectInExportRoot(paintEl, rootRect);
  if (!isUsableExportRect(rect)) return;
  const opacity = getExportElementOpacity(paintEl, root);
  if (opacity <= 0.001) return;

  const style = getComputedStyle(paintEl);
  const fontSize = parseCssPx(style.fontSize, 16);
  const lineHeight = resolveLineHeightPx(style, fontSize);
  const color = style.color && style.color !== "transparent" ? style.color : "#ffffff";
  const strokeWidth = parseCssPx(style.getPropertyValue("-webkit-text-stroke-width"), 0);
  const strokeColor = style.getPropertyValue("-webkit-text-stroke-color") || "rgba(0,0,0,0.8)";
  const letterSpacingPx = parseCssPx(style.letterSpacing, 0);
  const textAlign = String(style.textAlign || getComputedStyle(node).textAlign || "left").toLowerCase();
  const align: CanvasTextAlign =
    textAlign === "center"
      ? "center"
      : textAlign === "right" || textAlign === "end"
      ? "right"
      : "left";
  const x = align === "center" ? rect.x + rect.w / 2 : align === "right" ? rect.x + rect.w : rect.x;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${style.fontStyle || "normal"} ${style.fontWeight || "600"} ${fontSize}px ${style.fontFamily || "sans-serif"}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  if (style.textShadow && style.textShadow !== "none") {
    const firstShadow = splitCssList(style.textShadow)[0] || "";
    const colorMatch = firstShadow.match(/rgba?\([^)]+\)|#[0-9a-f]+/i);
    const lengthMatch = firstShadow.match(/(-?\d*\.?\d+)px\s+(-?\d*\.?\d+)px(?:\s+(\d*\.?\d+)px)?/);
    if (colorMatch) ctx.shadowColor = colorMatch[0];
    if (lengthMatch) {
      ctx.shadowOffsetX = Number(lengthMatch[1]) || 0;
      ctx.shadowOffsetY = Number(lengthMatch[2]) || 0;
      ctx.shadowBlur = Number(lengthMatch[3]) || 0;
    }
  }

  lines.forEach((line, index) => {
    const baseline = rect.y + fontSize * 0.82 + index * lineHeight;
    const text = normalizeCanvasText(line, style.textTransform || "");
    if (strokeWidth > 0.01) {
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      drawTextLine(ctx, text, x, baseline, letterSpacingPx, "stroke");
      ctx.restore();
    }
    drawTextLine(ctx, text, x, baseline, letterSpacingPx);
  });
  ctx.restore();
}

function shouldDrawMobileCanvasTextNode(node: HTMLElement, rootRect: DOMRect) {
  if (isMobileCanvasEditorUi(node)) return false;
  if (isInsideRasterizedMobileText(node)) return false;
  if (node.querySelector("[data-export-rasterized-headline]")) return false;
  if (node.querySelector("img, svg, canvas, video")) return false;
  if (!String(node.innerText || node.textContent || "").trim()) return false;
  return isUsableExportRect(getRectInExportRoot(node, rootRect));
}

export async function renderMobileStoryCanvasCompositor(
  root: HTMLElement,
  opts: MobileCanvasCompositorOptions
) {
  const scale = Math.max(1, opts.scale || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(opts.width * scale));
  canvas.height = Math.max(1, Math.round(opts.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas compositor unavailable");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, opts.width, opts.height);

  opts.onStage?.("Compositing baked background...");
  if (opts.backgroundSrc) {
    const bg = await loadMobileCanvasImage(opts.backgroundSrc);
    ctx.drawImage(bg, 0, 0, opts.width, opts.height);
  }
  drawMobileCanvasOverlays(ctx, opts.width, opts.height, opts.overlays);
  opts.onProgress?.(76);

  const rootRect = root.getBoundingClientRect();
  const allElements = Array.from(root.querySelectorAll("*"));
  const orderMap = new Map<Element, number>();
  allElements.forEach((el, index) => orderMap.set(el, index));

  opts.onStage?.("Rasterizing live mobile text...");
  const {
    layers: domRasterLayers,
    rasterizedElements,
  } = await rasterizeMobileCanvasTextNodes(root, rootRect, {
    pixelRatio: scale,
    fontEmbedCss: opts.fontEmbedCss,
    onProgress: opts.onProgress,
  });

  const imageLayers: MobileCanvasLayer[] = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
    .filter((img) => {
      if (isMobileCanvasEditorUi(img)) return false;
      if (isInsideRasterizedMobileText(img)) return false;
      if (isInsideRasterizedMobileCanvasElement(img, rasterizedElements)) return false;
      if (img.closest('[data-export-live-bg="true"]')) return false;
      if (img.closest('[data-export-temp-bg="true"]')) return false;
      return isUsableExportRect(getRectInExportRoot(img, rootRect));
    })
    .map((el) => ({ kind: "image", el }));
  const svgLayers: MobileCanvasLayer[] = Array.from(root.querySelectorAll<SVGSVGElement>("svg"))
    .filter((svg) => {
      if (isMobileCanvasEditorUi(svg)) return false;
      if (isInsideRasterizedMobileText(svg)) return false;
      if (isInsideRasterizedMobileCanvasElement(svg, rasterizedElements)) return false;
      if (svg.closest('[data-export-defs="true"]')) return false;
      return isUsableExportRect(getRectInExportRoot(svg, rootRect));
    })
    .map((el) => ({ kind: "svg", el }));
  const textLayers: MobileCanvasLayer[] = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"))
    .filter((node) => !rasterizedElements.has(node) && shouldDrawMobileCanvasTextNode(node, rootRect))
    .map((el) => ({ kind: "text", el }));

  const layers = [
    ...imageLayers,
    ...svgLayers,
    ...textLayers,
    ...domRasterLayers,
    ...(opts.rasterLayers || []),
  ].sort(
    (a, b) => getExportLayerOrder(a.el, root, orderMap) - getExportLayerOrder(b.el, root, orderMap)
  );

  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index];
    try {
      if (layer.kind === "image") {
        await drawMobileCanvasImageLayer(ctx, root, rootRect, layer.el);
      } else if (layer.kind === "svg") {
        await drawMobileCanvasSvgLayer(ctx, root, rootRect, layer.el);
      } else if (layer.kind === "raster") {
        await drawMobileCanvasRasterLayer(ctx, layer);
      } else {
        drawMobileCanvasTextLayer(ctx, root, rootRect, layer.el);
      }
    } catch {
      // A single optional layer should not collapse the mobile export.
    }
    if (index % 4 === 0) {
      opts.onProgress?.(76 + Math.round((index / Math.max(1, layers.length)) * 16));
      await waitForMobileCanvasFrame();
    }
  }

  opts.onStage?.("Encoding final flyer...");
  opts.onProgress?.(94);
  let outputCanvas = canvas;
  const finalFilter = String(opts.finalFilter || "none").trim();
  if (finalFilter && finalFilter !== "none") {
    const manuallyApplied = applyMobileCanvasCssColorFilter(canvas, finalFilter);
    if (!manuallyApplied) {
      const filtered = document.createElement("canvas");
      filtered.width = canvas.width;
      filtered.height = canvas.height;
      const filteredCtx = filtered.getContext("2d");
      if (filteredCtx) {
        filteredCtx.fillStyle = "#000";
        filteredCtx.fillRect(0, 0, filtered.width, filtered.height);
        try {
          filteredCtx.filter = finalFilter;
        } catch {}
        filteredCtx.drawImage(canvas, 0, 0);
        try {
          filteredCtx.filter = "none";
        } catch {}
        outputCanvas = filtered;
      }
    }
  }

  outputCanvas = applyFinalFilmGradeToCanvas(outputCanvas, opts.finalFilmGrade);

  return opts.format === "jpg"
    ? outputCanvas.toDataURL("image/jpeg", 0.88)
    : outputCanvas.toDataURL("image/png");
}

export type AcrylicGlassTextFxLike = {
  alpha?: number;
  bold?: boolean;
  italic?: boolean;
  tracking: number;
  underline?: boolean;
  uppercase?: boolean;
};

export type AcrylicGlassRichTextRenderer = (
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

export type AcrylicGlassCanvasLayersProps = {
  align: "left" | "center" | "right";
  fontFamily: string;
  fontSize: number;
  headlineText: string;
  kerningFix: boolean;
  leadTrackDelta: number;
  lastTrackDelta: number;
  opticalMargin: boolean;
  renderHeadlineRich: AcrylicGlassRichTextRenderer;
  textFx: AcrylicGlassTextFxLike;
};

const ACRYLIC_GLASS_PAINT_BLEED = 96;

export function AcrylicGlassCanvasLayers({
  align,
  fontFamily,
  fontSize,
  headlineText,
  kerningFix,
  leadTrackDelta,
  lastTrackDelta,
  opticalMargin,
  renderHeadlineRich,
  textFx,
}: AcrylicGlassCanvasLayersProps) {
  const lineHeight = ACRYLIC_GLASS_HEADLINE_PRESET.transform.lineHeight;
  const linePaintStyleFromLayer = (
    style: CSSProperties,
    lineStyle: CSSProperties = {}
  ): CSSProperties => ({
    display: "block",
    width: "100%",
    backgroundImage: style.backgroundImage,
    backgroundSize: style.backgroundSize,
    backgroundPosition: style.backgroundPosition,
    backgroundRepeat: style.backgroundRepeat,
    WebkitBackgroundClip: style.WebkitBackgroundClip,
    backgroundClip: style.backgroundClip,
    color: style.color ?? "transparent",
    WebkitTextFillColor: style.WebkitTextFillColor ?? "transparent",
    WebkitTextStroke: style.WebkitTextStroke,
    WebkitTextStrokeWidth: style.WebkitTextStrokeWidth,
    WebkitTextStrokeColor: style.WebkitTextStrokeColor,
    paintOrder: style.paintOrder,
    textShadow: style.textShadow,
    ...lineStyle,
  });
  const renderLayer = (
    key: string,
    style: CSSProperties,
    lineStyle: CSSProperties = {}
  ) => {
    const hasLinePaintBackground =
      typeof style.backgroundImage === "string" &&
      style.backgroundImage.trim() !== "" &&
      style.backgroundImage !== "none";
    const wrapperPaintStyle: CSSProperties = hasLinePaintBackground
      ? {
          backgroundImage: undefined,
          backgroundSize: undefined,
          backgroundPosition: undefined,
          backgroundRepeat: undefined,
          WebkitBackgroundClip: undefined,
          backgroundClip: undefined,
        }
      : {};

    return React.createElement(
      "h1",
      {
        key: `headline-acrylic-glass-${key}`,
        "aria-hidden": true,
        "data-acrylic-glass-layer": key,
        className: "pointer-events-none absolute inset-0 font-black select-none",
        style: {
          position: "absolute",
          inset: 0,
          top: `-${ACRYLIC_GLASS_PAINT_BLEED}px`,
          bottom: `-${ACRYLIC_GLASS_PAINT_BLEED}px`,
          fontFamily,
          fontSize,
          lineHeight,
          whiteSpace: "pre-wrap",
          display: "block",
          width: "100%",
          boxSizing: "content-box",
          marginLeft: `-${ACRYLIC_GLASS_PAINT_BLEED}px`,
          paddingTop: `${ACRYLIC_GLASS_PAINT_BLEED}px`,
          paddingBottom: `${ACRYLIC_GLASS_PAINT_BLEED}px`,
          paddingLeft: `${ACRYLIC_GLASS_PAINT_BLEED}px`,
          paddingRight: `${ACRYLIC_GLASS_PAINT_BLEED}px`,
          minWidth: "fit-content",
          maxWidth: "none",
          letterSpacing: `${textFx.tracking}em`,
          textAlign: align,
          textTransform: textFx.uppercase ? "uppercase" : "none",
          fontWeight: textFx.bold ? 900 : 700,
          fontStyle: textFx.italic ? "italic" : "normal",
          textDecorationLine: textFx.underline ? "underline" : "none",
          pointerEvents: "none",
          userSelect: "none",
          overflow: "visible",
          WebkitFontSmoothing: "antialiased",
          textRendering: "geometricPrecision",
          ...style,
          ...wrapperPaintStyle,
        },
      },
      renderHeadlineRich(headlineText, {
        baseTrackEm: textFx.tracking,
        leadDeltaEm: leadTrackDelta,
        lastDeltaEm: lastTrackDelta,
        opticalMargin,
        kerningFix,
        lineHeight,
        lineStyle: linePaintStyleFromLayer(style, lineStyle),
      })
    );
  };

  return React.createElement(
    "div",
    { className: "relative", style: { zIndex: 3, isolation: "isolate", overflow: "visible" } },
    React.createElement(
      "h1",
      {
        "aria-hidden": true,
        className: "relative font-black select-none",
        style: {
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
        },
      },
      renderHeadlineRich(headlineText, {
        baseTrackEm: textFx.tracking,
        leadDeltaEm: leadTrackDelta,
        lastDeltaEm: lastTrackDelta,
        opticalMargin,
        kerningFix,
        lineHeight,
        lineStyle: { display: "block", width: "100%" },
      })
    ),
    React.createElement(
      "div",
      {
        "aria-hidden": true,
        className: "pointer-events-none absolute inset-0 overflow-visible",
        style: { opacity: textFx.alpha ?? 1, zIndex: 3 },
      },
      renderLayer("glow", buildAcrylicGlassGlowStyle({ zIndex: 1 })),
      renderLayer("translucent-3d", buildAcrylicGlassTranslucent3DStyle({ zIndex: 2 })),
      renderLayer("inner-dark", buildAcrylicGlassInnerDarkStyle({ zIndex: 3 })),
      renderLayer("main", buildAcrylicGlassMainStyle({ zIndex: 4 })),
      renderLayer("reflections", buildAcrylicGlassReflectionStyle({ zIndex: 5 })),
      renderLayer(
        "upper-bloom",
        buildAcrylicGlassUpperBloomStyle({ zIndex: 6 }),
        {
          color: ACRYLIC_GLASS_HEADLINE_PRESET.acrylic.topHighlight,
          WebkitTextFillColor: ACRYLIC_GLASS_HEADLINE_PRESET.acrylic.topHighlight,
        }
      ),
      renderLayer("highlight", buildAcrylicGlassHighlightStyle({ zIndex: 7 }))
    )
  );
}
