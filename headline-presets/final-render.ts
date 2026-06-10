import * as htmlToImage from "html-to-image";
import {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
} from "./headline-final-renderer";
import {
  applyFinalColorGradeToCanvas,
  normalizeFinalFilmGrade,
} from "./final-grade";

export {
  renderHeadlineFinalRaster,
  shouldRenderHeadlineFinalRaster,
  type HeadlineFinalRenderConfig,
  type HeadlineFinalRenderRasterizer,
};

export type AcrylicGlassFinalRenderConfig = HeadlineFinalRenderConfig;
export type AcrylicGlassFinalRenderRasterizer = HeadlineFinalRenderRasterizer;

export type FinalRenderFormat = "png" | "jpg";

export type FinalRenderResult = {
  dataUrl: string;
  renderer: string;
  rendererLabel: string;
  rendererDetail: string;
};

export type FinalRenderMetadata = Omit<FinalRenderResult, "dataUrl"> & {
  format: FinalRenderFormat;
  scale: number;
  mobile: boolean;
  story: boolean;
  mobileStory: boolean;
};

type RestoreFn = () => void;

type InlineExportResult = {
  restore: RestoreFn;
  missing?: string[];
};

type FinalDomCaptureOptions = {
  captureNode: HTMLElement;
  exportWidth: number;
  exportHeight: number;
  scale: number;
  format: FinalRenderFormat;
  forcedStyle: Record<string, unknown>;
  isMobileExport: boolean;
  isMobileStoryExport: boolean;
  useMobileBackgroundComposite: boolean;
  bgSrcForExport?: string | null;
  bgUploadUrl?: string | null;
  bgUrl?: string | null;
  logoUrl?: string | null;
  masterFilter?: string;
  finalFilmGrade?: number;
  fontEmbedCss?: string;
  forceProxy?: boolean;
  families: Array<string | undefined>;
  withExternalStylesDisabled: <T>(fn: () => Promise<T>) => Promise<T>;
  forceFontRender: (families: Array<string | undefined>) => Promise<void>;
  applyTextShadowFallbackForExport: (root: HTMLElement) => RestoreFn | null;
  applyLuxeGlassGlowFallbackForExport: (root: HTMLElement) => RestoreFn | null;
  waitForImageUrlBrief: (url?: string | null, timeoutMs?: number) => Promise<unknown>;
  waitForImages: (root: HTMLElement) => Promise<unknown>;
  waitForBackgroundImages: (root: HTMLElement) => Promise<unknown>;
  inlineImagesForExport: (
    root: HTMLElement,
    opts: { forceProxy: boolean; sameOriginDirect: boolean }
  ) => Promise<InlineExportResult>;
  inlineBackgroundImagesForExport: (
    root: HTMLElement,
    opts: { forceProxy: boolean; sameOriginDirect: boolean }
  ) => Promise<InlineExportResult>;
  onStage?: (label: string) => void;
  onProgress?: (progress: number) => void;
};

export const FINAL_RENDER_TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

export const ACRYLIC_GLASS_FINAL_RENDER_PAINT_PADDING_PX = 260;

export function shouldRenderAcrylicGlassFinalHeadline(
  config: Pick<AcrylicGlassFinalRenderConfig, "enabled" | "headlineHidden" | "headline">
) {
  return shouldRenderHeadlineFinalRaster(config);
}

export function renderAcrylicGlassFinalHeadline(config: AcrylicGlassFinalRenderConfig) {
  return renderHeadlineFinalRaster({
    ...config,
    paintPaddingPx: config.paintPaddingPx ?? ACRYLIC_GLASS_FINAL_RENDER_PAINT_PADDING_PX,
  });
}

function shouldCaptureFinalRenderNode(node: HTMLElement) {
  if (!node) return true;

  const skip =
    node.dataset?.nonexport === "true" ||
    node.classList?.contains("debug-grid") ||
    node.classList?.contains("bounding-box") ||
    node.classList?.contains("text-bounding") ||
    node.classList?.contains("text-outline") ||
    node.classList?.contains("highlight-box") ||
    node.classList?.contains("drag-handle") ||
    node.classList?.contains("resize-handle") ||
    node.classList?.contains("portrait-handle") ||
    node.classList?.contains("portrait-bounding") ||
    node.classList?.contains("portrait-outline") ||
    node.classList?.contains("portrait-border") ||
    node.classList?.contains("portrait-slot") ||
    node.classList?.contains("overlay-grid") ||
    node.tagName === "BUTTON" ||
    node.tagName === "INPUT" ||
    node.tagName === "TEXTAREA";

  return !skip;
}

function buildFinalDomCaptureOptions({
  exportWidth,
  exportHeight,
  scale,
  forcedStyle,
}: Pick<
  FinalDomCaptureOptions,
  "exportWidth" | "exportHeight" | "scale" | "forcedStyle"
>) {
  return {
    cacheBust: true,
    imagePlaceholder: FINAL_RENDER_TRANSPARENT_PIXEL,
    backgroundColor: "#000",
    pixelRatio: scale,
    width: exportWidth,
    height: exportHeight,
    canvasWidth: exportWidth,
    canvasHeight: exportHeight,
    skipAutoScale: true,
    style: forcedStyle,
    filter: (node: HTMLElement) => shouldCaptureFinalRenderNode(node as HTMLElement),
  };
}

function waitForFinalRenderImage(img: HTMLImageElement) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      resolve();
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Final render image failed to load"));
    };
  });
}

async function loadFinalRenderImage(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = src;
  await waitForFinalRenderImage(img);
  return img;
}

async function applyFinalFilmGradeToDataUrl(
  src: string,
  format: FinalRenderFormat,
  finalFilter?: string,
  finalFilmGrade?: number
) {
  const normalizedFilter = String(finalFilter || "none").trim();
  const hasFilter = !!normalizedFilter && normalizedFilter !== "none";
  if (!hasFilter && normalizeFinalFilmGrade(finalFilmGrade) <= 0.001) return src;

  const img = await loadFinalRenderImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, img.naturalWidth || img.width || 1);
  canvas.height = Math.max(1, img.naturalHeight || img.height || 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const output = applyFinalColorGradeToCanvas(canvas, normalizedFilter, finalFilmGrade);
  if (output === canvas) return src;

  return format === "jpg"
    ? output.toDataURL("image/jpeg", 0.99)
    : output.toDataURL("image/png");
}

export async function compositeFinalRenderBackgroundWithForeground(
  backgroundSrc: string,
  foregroundSrc: string,
  width: number,
  height: number,
  scale: number,
  format: FinalRenderFormat,
  finalFilter = "none"
) {
  const ratio = Math.max(1, scale || 1);
  const source = document.createElement("canvas");
  source.width = Math.max(1, Math.round(width * ratio));
  source.height = Math.max(1, Math.round(height * ratio));
  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) throw new Error("Canvas compositor unavailable");

  sourceCtx.fillStyle = "#000";
  sourceCtx.fillRect(0, 0, source.width, source.height);

  const bg = await loadFinalRenderImage(backgroundSrc);
  sourceCtx.drawImage(bg, 0, 0, source.width, source.height);

  const foreground = await loadFinalRenderImage(foregroundSrc);
  sourceCtx.drawImage(foreground, 0, 0, source.width, source.height);

  const normalizedFilter = String(finalFilter || "none").trim();
  if (!normalizedFilter || normalizedFilter === "none") {
    return format === "jpg"
      ? source.toDataURL("image/jpeg", 0.99)
      : source.toDataURL("image/png");
  }

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas compositor unavailable");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  try {
    ctx.filter = normalizedFilter;
  } catch {}
  ctx.drawImage(source, 0, 0);
  try {
    ctx.filter = "none";
  } catch {}

  return format === "jpg"
    ? canvas.toDataURL("image/jpeg", 0.99)
    : canvas.toDataURL("image/png");
}

export async function captureFinalDomRender({
  captureNode,
  exportWidth,
  exportHeight,
  scale,
  format,
  forcedStyle,
  isMobileExport,
  isMobileStoryExport,
  useMobileBackgroundComposite,
  bgSrcForExport,
  bgUploadUrl,
  bgUrl,
  logoUrl,
  masterFilter = "none",
  finalFilmGrade = 0,
  fontEmbedCss = "",
  forceProxy = false,
  families,
  withExternalStylesDisabled,
  forceFontRender,
  applyTextShadowFallbackForExport,
  applyLuxeGlassGlowFallbackForExport,
  waitForImageUrlBrief,
  waitForImages,
  waitForBackgroundImages,
  inlineImagesForExport,
  inlineBackgroundImagesForExport,
  onStage,
  onProgress,
}: FinalDomCaptureOptions): Promise<FinalRenderResult> {
  const captureOptions = buildFinalDomCaptureOptions({
    exportWidth,
    exportHeight,
    scale,
    forcedStyle,
  });
  const shouldInlineProxy = !!(isMobileExport || forceProxy);

  const dataUrl = await withExternalStylesDisabled(async () => {
    let restoreTextShadowFallback: RestoreFn | null = null;
    let restoreLuxeGlassGlowFallback: RestoreFn | null = null;
    let restoreInlineImages: RestoreFn | null = null;
    let restoreInlineBg: RestoreFn | null = null;

    try {
      await forceFontRender(families);
      restoreTextShadowFallback = applyTextShadowFallbackForExport(captureNode);
      restoreLuxeGlassGlowFallback = applyLuxeGlassGlowFallbackForExport(captureNode);
      onStage?.("Checking final image layers...");
      await waitForImageUrlBrief(bgUploadUrl || bgUrl);
      await waitForImageUrlBrief(logoUrl);

      if (shouldInlineProxy) {
        onStage?.("Making mobile-safe image copies...");
        const inlineImgs = await inlineImagesForExport(captureNode, {
          forceProxy: true,
          sameOriginDirect: isMobileExport && !forceProxy,
        });
        restoreInlineImages = inlineImgs.restore;

        const inlineBg = await inlineBackgroundImagesForExport(captureNode, {
          forceProxy: true,
          sameOriginDirect: isMobileExport && !forceProxy,
        });
        restoreInlineBg = inlineBg.restore;
      }

      if (!isMobileExport) {
        await waitForImages(captureNode);
        await waitForBackgroundImages(captureNode);
      }

      onStage?.("Merging final flyer...");
      onProgress?.(70);

      const capture = async () => {
        const finalCaptureOptions = isMobileStoryExport && fontEmbedCss
          ? {
              ...captureOptions,
              fontEmbedCSS: fontEmbedCss,
            }
          : captureOptions;

        if (useMobileBackgroundComposite && bgSrcForExport) {
          onStage?.("Compositing mobile background...");
          const foregroundDataUrl = await htmlToImage.toPng(captureNode, {
            ...finalCaptureOptions,
            backgroundColor: "transparent",
            style: {
              ...(finalCaptureOptions as any).style,
              background: "transparent",
              backgroundColor: "transparent",
            },
            filter: (node: HTMLElement) => {
              const el = node as HTMLElement;
              if (el.closest?.('[data-export-temp-bg="true"]')) return false;
              const baseFilter = (finalCaptureOptions as any).filter;
              return typeof baseFilter === "function" ? baseFilter(node) : true;
            },
          });

          return await compositeFinalRenderBackgroundWithForeground(
            bgSrcForExport,
            foregroundDataUrl,
            exportWidth,
            exportHeight,
            scale,
            format,
            "none"
          );
        }

        if (format === "jpg") {
          return await htmlToImage.toJpeg(captureNode, {
            ...finalCaptureOptions,
            quality: isMobileStoryExport ? 0.99 : isMobileExport ? 0.94 : 0.96,
          });
        }

        return await htmlToImage.toPng(captureNode, finalCaptureOptions);
      };

      const needsWarmup = format !== "jpg" && !!(bgUploadUrl || bgUrl || logoUrl);
      if (!needsWarmup) return await capture();

      await capture();
      onProgress?.(85);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const out = await capture();
      onProgress?.(96);
      return out;
    } finally {
      if (restoreLuxeGlassGlowFallback) restoreLuxeGlassGlowFallback();
      if (restoreTextShadowFallback) restoreTextShadowFallback();
      if (restoreInlineImages) restoreInlineImages();
      if (restoreInlineBg) restoreInlineBg();
    }
  });

  const finalDataUrl = await applyFinalFilmGradeToDataUrl(dataUrl, format, masterFilter, finalFilmGrade);
  const rendererDetail = useMobileBackgroundComposite
    ? "html-to-image foreground capture with separate background compositing."
    : "html-to-image DOM capture path.";

  return {
    dataUrl: finalDataUrl,
    renderer: useMobileBackgroundComposite ? "dom-composite" : "dom",
    rendererLabel: useMobileBackgroundComposite ? "DOM composite" : "DOM capture",
    rendererDetail,
  };
}

export function markFinalExportRenderer({
  renderer,
  rendererLabel,
  rendererDetail,
  format,
  scale,
  mobile,
  story,
  mobileStory,
}: FinalRenderMetadata) {
  try {
    (window as any).__NF_LAST_EXPORT_RENDERER__ = {
      renderer,
      rendererLabel,
      rendererDetail,
      format,
      scale,
      mobile,
      story,
      mobileStory,
      at: new Date().toISOString(),
    };
    console.info(`[Nightlife Flyers export] ${rendererLabel}: ${rendererDetail}`);
  } catch {}
}
