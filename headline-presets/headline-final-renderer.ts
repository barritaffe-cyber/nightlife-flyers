export type HeadlineFinalRenderRasterizer = (
  root: HTMLElement,
  opts: {
    pixelRatio: number;
    fontEmbedCss?: string;
    paintPaddingPx?: number;
    onStage?: (label: string) => void;
    onProgress?: (p: number) => void;
  }
) => Promise<() => void>;

export type HeadlineFinalRenderConfig = {
  enabled: boolean;
  headlineHidden: boolean;
  headline: string;
  captureNode: HTMLElement;
  scale: number;
  fontEmbedCss?: string;
  paintPaddingPx?: number;
  rasterizeHeadlineNodesForExport: HeadlineFinalRenderRasterizer;
  onStage?: (label: string) => void;
  onProgress?: (p: number) => void;
  afterRasterize?: () => Promise<void> | void;
};

const HEADLINE_EXPORT_CLASS = "headline-final-exporting";

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

async function waitForFonts() {
  if (typeof document === "undefined") return;

  const fontSet = document.fonts;
  if (!fontSet?.ready) return;

  try {
    await fontSet.ready;
  } catch {
    // Keep the export moving if browser font readiness fails.
  }
}

async function prepareHeadlineExportFrame(captureNode: HTMLElement) {
  captureNode.classList.add(HEADLINE_EXPORT_CLASS);
  captureNode.setAttribute("data-headline-final-export", "true");

  await waitForFonts();
  await nextFrame();
  await nextFrame();

  return () => {
    captureNode.classList.remove(HEADLINE_EXPORT_CLASS);
    captureNode.removeAttribute("data-headline-final-export");
  };
}

export function shouldRenderHeadlineFinalRaster({
  enabled,
  headlineHidden,
  headline,
}: Pick<HeadlineFinalRenderConfig, "enabled" | "headlineHidden" | "headline">) {
  return Boolean(enabled && !headlineHidden && String(headline || "").trim());
}

export async function renderHeadlineFinalRaster({
  enabled,
  headlineHidden,
  headline,
  captureNode,
  scale,
  fontEmbedCss,
  paintPaddingPx = 180,
  rasterizeHeadlineNodesForExport,
  onStage,
  onProgress,
  afterRasterize,
}: HeadlineFinalRenderConfig): Promise<null | (() => void)> {
  if (!shouldRenderHeadlineFinalRaster({ enabled, headlineHidden, headline })) {
    return null;
  }

  if (!captureNode) {
    return null;
  }

  const pixelRatio = clampNumber(scale, 1, 3, 1);
  let cleanupExportFrame: null | (() => void) = null;
  let restoreRasterizedHeadline: null | (() => void) = null;

  try {
    onStage?.("Preparing headline texture");
    onProgress?.(62);

    cleanupExportFrame = await prepareHeadlineExportFrame(captureNode);

    onStage?.("Rasterizing headline from canvas");
    onProgress?.(66);

    restoreRasterizedHeadline = await rasterizeHeadlineNodesForExport(captureNode, {
      pixelRatio,
      fontEmbedCss,
      paintPaddingPx,
      onStage,
      onProgress,
    });

    onStage?.("Finalizing headline texture");
    onProgress?.(74);

    await afterRasterize?.();

    cleanupExportFrame?.();
    cleanupExportFrame = null;

    return () => {
      restoreRasterizedHeadline?.();
    };
  } catch (error) {
    restoreRasterizedHeadline?.();
    cleanupExportFrame?.();
    throw error;
  }
}
