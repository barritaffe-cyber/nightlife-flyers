import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";
import { createDocumentIR } from "./coco-document-ir.mjs";

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function serveCssMaster({ masterPath, publicRoot }) {
  const masterBytes = await readFile(masterPath);
  const absolutePublicRoot = resolve(publicRoot);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (url.pathname === "/__coco_css_master__.html") {
        response.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
        response.end(masterBytes);
        return;
      }
      const requestedPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const filePath = resolve(absolutePublicRoot, requestedPath);
      if (filePath !== absolutePublicRoot && !filePath.startsWith(`${absolutePublicRoot}${sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const info = await stat(filePath);
      if (!info.isFile()) throw Object.assign(new Error("Not a file"), { code: "ENOENT" });
      response.writeHead(200, {
        "content-type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-store",
      });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(error?.code === "ENOENT" ? 404 : 500).end(error?.message || "Request failed");
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/__coco_css_master__.html`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}

export async function extractCssMaster({
  id,
  masterPath,
  publicRoot,
  format,
  canvas,
  sourceHash,
  selector = "[data-region]",
}) {
  const staticServer = await serveCssMaster({ masterPath, publicRoot });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: {
        width: Math.max(1200, Number(canvas.width) + 96),
        height: Math.max(1200, Number(canvas.height) + 96),
      },
      deviceScaleFactor: 1,
    });
    const failures = [];
    const externalRequests = new Set();
    const masterOrigin = new URL(staticServer.url).origin;
    page.on("request", (request) => {
      try {
        const url = new URL(request.url());
        if (url.protocol === "http:" || url.protocol === "https:") {
          if (url.origin !== masterOrigin) externalRequests.add(url.href);
        }
      } catch {}
    });
    page.on("requestfailed", (request) => {
      const errorText = request.failure()?.errorText || "failed";
      // Format-aware masters may replace an image source during their startup
      // script. Chromium cancels the superseded same-page request even though
      // the replacement is loaded and decoded before extraction. The image
      // completeness gate below still rejects a missing replacement.
      if (errorText === "net::ERR_ABORTED") return;
      failures.push(`${request.url()}: ${errorText}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(`${response.url()}: HTTP ${response.status()}`);
    });
    await page.goto(`${staticServer.url}?format=${format}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(async (image) => {
        try { await image.decode(); } catch {}
      }));
      await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));
    });

    const result = await page.evaluate((regionSelector) => {
      const canvasNode = document.querySelector("[data-coco-canvas]") ?? document.querySelector(".canvas");
      if (!(canvasNode instanceof HTMLElement)) throw new Error("CSS master needs [data-coco-canvas]");
      const canvasRect = canvasNode.getBoundingClientRect();
      const px = (value, fallback = 0) => {
        const number = Number.parseFloat(String(value));
        return Number.isFinite(number) ? number : fallback;
      };
      const normalize = (rect) => ({
        x: ((rect.left - canvasRect.left) / canvasRect.width) * 100,
        y: ((rect.top - canvasRect.top) / canvasRect.height) * 100,
        width: (rect.width / canvasRect.width) * 100,
        height: (rect.height / canvasRect.height) * 100,
      });
      const textContent = (node) => {
        const visit = (current) => {
          if (current.nodeType === Node.TEXT_NODE) return current.nodeValue || "";
          if (current instanceof HTMLBRElement) return "\n";
          return Array.from(current.childNodes).map(visit).join("");
        };
        return visit(node)
          .replace(/\u00a0/g, " ")
          .split("\n")
          .map((line) => line.replace(/[\t ]+/g, " ").trim())
          .join("\n")
          .trim();
      };
      const parseTransform = (style) => {
        if (!style.transform || style.transform === "none") return { rotate: 0, scaleX: 1, scaleY: 1, skewX: 0 };
        const matrix = new DOMMatrixReadOnly(style.transform);
        const scaleX = Math.hypot(matrix.a, matrix.b) || 1;
        const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
        const scaleY = determinant / scaleX || 1;
        return {
          rotate: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI),
          scaleX,
          scaleY,
          skewX: Math.atan2(matrix.a * matrix.c + matrix.b * matrix.d, scaleX * scaleX) * (180 / Math.PI),
        };
      };
      const untransformedRect = (node) => {
        const previous = node.style.getPropertyValue("transform");
        const priority = node.style.getPropertyPriority("transform");
        node.style.setProperty("transform", "none", "important");
        const rect = node.getBoundingClientRect();
        if (previous) node.style.setProperty("transform", previous, priority);
        else node.style.removeProperty("transform");
        return rect;
      };
      const detectKind = (node) => {
        if (node.dataset.cocoKind) return node.dataset.cocoKind;
        if (node instanceof HTMLImageElement) return node.dataset.cocoAsset === "smokeFrame" ? "texture" : "image";
        if (node instanceof SVGElement || node.querySelector(":scope > svg")) return "svg";
        return textContent(node) ? "text" : "shape";
      };
      const sameOriginPath = (value) => {
        try {
          const url = new URL(value, location.href);
          return url.origin === location.origin ? `${url.pathname}${url.search}` : url.href;
        } catch { return value; }
      };
      const textRuns = (node) => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const runs = [];
        let textNode;
        while ((textNode = walker.nextNode())) {
          const value = (textNode.nodeValue || "").replace(/\u00a0/g, " ");
          if (!value.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(textNode);
          const parent = textNode.parentElement || node;
          const style = getComputedStyle(parent);
          runs.push({
            text: value,
            color: style.color,
            fontFamily: style.fontFamily,
            fontSizePx: px(style.fontSize),
            ...(parent !== node && px(style.marginLeft) ? { marginLeftEm: px(style.marginLeft) / Math.max(1, px(style.fontSize)) } : {}),
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            rects: Array.from(range.getClientRects()).map(normalize),
          });
        }
        return runs;
      };
      const stackingContextPath = (node) => {
        const path = [];
        let current = node;
        while (current && current !== canvasNode) {
          const style = getComputedStyle(current);
          const creates = style.zIndex !== "auto" || style.transform !== "none" || Number(style.opacity) < 1 || style.isolation === "isolate" || style.filter !== "none";
          if (creates) path.unshift({
            id: current.dataset?.region || current.id || current.tagName.toLowerCase(),
            zIndex: style.zIndex === "auto" ? 0 : Number(style.zIndex) || 0,
          });
          current = current.parentElement;
        }
        return path;
      };

      const allRegions = Array.from(canvasNode.querySelectorAll(regionSelector));
      const objects = [];
      allRegions.forEach((node, domOrder) => {
        if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
        const style = getComputedStyle(node);
        const paintRect = node.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || paintRect.width <= 0 || paintRect.height <= 0) return;
        const layoutRect = untransformedRect(node);
        // Translation belongs to the authored position. The remaining transform
        // is decomposed into rotation/scale/skew for editable Coco objects.
        const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
        const translatedBounds = normalize(layoutRect);
        translatedBounds.x += matrix.e / canvasRect.width * 100;
        translatedBounds.y += matrix.f / canvasRect.height * 100;
        const kind = detectKind(node);
        const origin = style.transformOrigin.split(/\s+/);
        const contextPath = stackingContextPath(node);
        const object = {
          id: node.dataset.region || node.id || `object-${domOrder}`,
          sourceObjectId: node.dataset.cocoObject || null,
          assetRole: node.dataset.cocoAsset || null,
          kind,
          semanticRole: node.dataset.cocoRole || null,
          editable: node.dataset.cocoEditable === "true" || Boolean(node.dataset.cocoObject),
          text: kind === "text" ? textContent(node) : undefined,
          textRuns: kind === "text" ? textRuns(node) : undefined,
          bounds: translatedBounds,
          paintBounds: normalize(paintRect),
          transform: {
            ...parseTransform(style),
            originX: layoutRect.width > 0 ? (px(origin[0], layoutRect.width / 2) / layoutRect.width) * 100 : 50,
            originY: layoutRect.height > 0 ? (px(origin[1], layoutRect.height / 2) / layoutRect.height) * 100 : 50,
          },
          paint: {
            opacity: Number(style.opacity),
            blendMode: style.mixBlendMode,
            color: style.color,
            background: style.background,
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            backgroundPosition: style.backgroundPosition,
            backgroundRepeat: style.backgroundRepeat,
            backgroundSize: style.backgroundSize,
            backgroundClip: style.backgroundClip,
            webkitBackgroundClip: style.webkitBackgroundClip,
            boxShadow: style.boxShadow,
            textShadow: style.textShadow,
            filter: style.filter,
            borderColor: style.borderColor,
            borderStyle: style.borderStyle,
            borderWidthPx: px(style.borderWidth),
            borderRadius: style.borderRadius,
            clipPath: style.clipPath,
            maskImage: style.maskImage,
            overflow: style.overflow,
          },
          stacking: {
            zIndex: style.zIndex === "auto" ? 0 : Number(style.zIndex) || 0,
            effectiveZIndex: contextPath.length
              ? contextPath[contextPath.length - 1].zIndex
              : style.zIndex === "auto" ? 0 : Number(style.zIndex) || 0,
            order: domOrder,
            contextPath,
          },
          compileStatus: "compiled",
          warnings: [],
        };
        if (kind === "text") {
          object.typography = {
            fontFamily: style.fontFamily,
            fontSizePx: px(style.fontSize),
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            lineHeightPx: style.lineHeight === "normal" ? null : px(style.lineHeight),
            lineHeight: style.lineHeight === "normal" ? 1 : px(style.lineHeight) / Math.max(1, px(style.fontSize)),
            letterSpacingPx: style.letterSpacing === "normal" ? 0 : px(style.letterSpacing),
            letterSpacingEm: style.letterSpacing === "normal" ? 0 : px(style.letterSpacing) / Math.max(1, px(style.fontSize)),
            align: style.textAlign,
            textTransform: style.textTransform,
            textDecoration: style.textDecorationLine,
            whiteSpace: style.whiteSpace,
          };
        }
        if ((kind === "image" || kind === "texture") && node instanceof HTMLImageElement) {
          object.image = {
            src: sameOriginPath(node.currentSrc || node.src),
            naturalWidth: node.naturalWidth,
            naturalHeight: node.naturalHeight,
            fit: style.objectFit,
            position: style.objectPosition,
          };
        }
        if (kind === "svg") {
          const svg = node instanceof SVGElement ? node : node.querySelector(":scope > svg");
          object.svg = { markup: svg?.outerHTML || "" };
        }
        objects.push(object);
      });
      return {
        canvas: { width: canvasRect.width, height: canvasRect.height },
        renderedFormat: canvasNode.dataset.format || null,
        fontFaces: Array.from(document.fonts).map((face) => ({
          family: face.family,
          status: face.status,
          style: face.style,
          weight: face.weight,
        })),
        objects,
      };
    }, selector);

    return createDocumentIR({
      id,
      format,
      canvas: result.canvas,
      objects: result.objects,
      warnings: failures,
      provenance: {
        sourceHash,
        extractor: "chromium-computed-style",
        viewport: await page.viewportSize(),
        renderedFormat: result.renderedFormat,
        fontFaces: result.fontFaces,
        externalRequests: [...externalRequests].sort(),
      },
    });
  } finally {
    if (browser) await browser.close();
    await staticServer.close();
  }
}
