import { GLASS_HEADLINE_PRESET } from "../headline-presets/glass";

export type HeadlineRenderAlign = "left" | "center" | "right";

export type HeadlineRenderPreset = {
  name: string;
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: number;

  fill: {
    top: string;
    mid: string;
    bottom: string;
  };

  stroke?: {
    color: string;
    width: number;
  };

  innerStroke?: {
    color: string;
    width: number;
    alpha: number;
  };

  hotRim?: {
    color: string;
    width: number;
    alpha: number;
  };

  shadow?: {
    color: string;
    blur: number;
    x: number;
    y: number;
    alpha: number;
  };

  extrusion?: {
    color: string;
    steps: number;
    x: number;
    y: number;
    alpha: number;
  };

  glow?: {
    color: string;
    blur: number;
    alpha: number;
  };

  rimGlow?: {
    color: string;
    blur: number;
    alpha: number;
  };

  bevel?: {
    topColor: string;
    bottomColor: string;
    strength: number;
  };

  darkCavity?: {
    alpha: number;
    color: string;
  };

  reflectionPanels?: {
    alpha: number;
    angle: number;
    colorA: string;
    colorB: string;
  };

  refractionPanels?: {
    alpha: number;
    offsetX: number;
    offsetY: number;
    colorA: string;
    colorB: string;
  };

  svgReflections?: {
    alpha: number;
    colorA: string;
    colorB: string;
    colorC: string;
  };

  shine?: {
    color: string;
    alpha: number;
    angle: number;
  };

  glints?: {
    color: string;
    alpha: number;
    size: number;
  };

  texture?: {
    noiseAlpha: number;
  };
};

export type HeadlineTextureResult = {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  logicalWidth: number;
  logicalHeight: number;
  padX: number;
  padY: number;
};

function clampExportAlpha(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((x) => x + x).join("") : m;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorWithAlpha(color: string, alpha: number) {
  const trimmed = String(color || "").trim();
  if (trimmed.startsWith("#")) return hexToRgba(trimmed, alpha);

  const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbaMatch) return trimmed;

  const parts = rgbaMatch[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return trimmed;

  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function easeLuxeGlow(value: number, max = 72) {
  const normalized = Math.max(0, Math.min(1, value / max));
  return Math.pow(normalized, 1.45);
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trackedCanvasTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacingPx: number
) {
  const chars = Array.from(text);
  return ctx.measureText(text).width + Math.max(0, chars.length - 1) * letterSpacingPx;
}

function drawTrackedCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingPx: number,
  mode: "fill" | "stroke"
) {
  if (!letterSpacingPx) {
    if (mode === "stroke") ctx.strokeText(text, x, y);
    else ctx.fillText(text, x, y);
    return;
  }

  const chars = Array.from(text);
  const totalWidth = trackedCanvasTextWidth(ctx, text, letterSpacingPx);
  const align = ctx.textAlign;

  let cursor =
    align === "center"
      ? x - totalWidth / 2
      : align === "right" || align === "end"
        ? x - totalWidth
        : x;

  chars.forEach((ch) => {
    if (mode === "stroke") ctx.strokeText(ch, cursor, y);
    else ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + letterSpacingPx;
  });
}

function createAngledCanvasGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number
) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const len = Math.hypot(width, height);
  const dx = (Math.cos(rad) * len) / 2;
  const dy = (Math.sin(rad) * len) / 2;
  return ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
}

function toCanvasFontFamilyList(fontFamily: string) {
  const genericFamilies = new Set([
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
    "ui-serif",
    "ui-sans-serif",
    "ui-monospace",
  ]);

  return String(fontFamily || "Impact, sans-serif")
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      if (/^['"].*['"]$/.test(trimmed)) return trimmed;
      if (genericFamilies.has(trimmed.toLowerCase())) return trimmed;
      return `"${trimmed.replace(/"/g, '\\"')}"`;
    })
    .filter(Boolean)
    .join(", ");
}

export async function renderPremiumHeadlineTexture({
  text,
  preset,
  fontSize,
  maxWidth,
  pixelRatio = 1,
  align = "center",
  lineHeight = 0.92,
  fontStyle = "normal",
  skewX = 0,
}: {
  text: string;
  preset: HeadlineRenderPreset;
  fontSize: number;
  maxWidth: number;
  pixelRatio?: number;
  align?: HeadlineRenderAlign;
  lineHeight?: number;
  fontStyle?: string;
  skewX?: number;
}): Promise<HeadlineTextureResult> {
  const lines = text.replace(/\r/g, "").split("\n").map((line) => line || " ");
  const ratio = Math.max(1, Math.min(2, Number(pixelRatio) || 1));

  const baseFontSize = Math.max(1, Number(fontSize) || 1);
  const baseLetterSpacing = Number(preset.letterSpacing || 0);
  const fontWeight = preset.fontWeight ?? 900;
  const fontFamily = toCanvasFontFamilyList(preset.fontFamily || "Impact, sans-serif");
  const makeFont = (size: number) =>
    `${fontStyle || "normal"} ${fontWeight} ${size}px ${fontFamily}`;

  try {
    await document.fonts?.ready;
    await document.fonts?.load?.(makeFont(baseFontSize));
  } catch {}

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Headline texture measure context unavailable");

  let effectiveFontSize = baseFontSize;
  let effectiveLetterSpacing = baseLetterSpacing;

  measureCtx.font = makeFont(effectiveFontSize);

  let maxLineWidth = Math.max(
    1,
    ...lines.map((line) => trackedCanvasTextWidth(measureCtx, line, effectiveLetterSpacing))
  );

  if (maxWidth > 0 && maxLineWidth > maxWidth) {
    const fitScale = Math.max(0.2, Math.min(1, maxWidth / maxLineWidth));
    effectiveFontSize = baseFontSize * fitScale;
    effectiveLetterSpacing = baseLetterSpacing * fitScale;
    measureCtx.font = makeFont(effectiveFontSize);

    maxLineWidth = Math.max(
      1,
      ...lines.map((line) => trackedCanvasTextWidth(measureCtx, line, effectiveLetterSpacing))
    );
  }

  const strokeWidth = Math.max(0, Number(preset.stroke?.width || 0));
  const innerStrokeWidth = Math.max(0, Number(preset.innerStroke?.width || 0));
  const hotRimWidth = Math.max(0, Number(preset.hotRim?.width || 0));
  const glowBlur = Math.max(0, Number(preset.glow?.blur || 0));
  const rimGlowBlur = Math.max(0, Number(preset.rimGlow?.blur || 0));
  const shadowBlur = Math.max(0, Number(preset.shadow?.blur || 0));
  const shadowX = Number(preset.shadow?.x || 0);
  const shadowY = Number(preset.shadow?.y || 0);

  const extrusion = preset.extrusion;
  const extrusionX = extrusion
    ? Math.abs(Number(extrusion.x || 0) * Math.max(0, extrusion.steps || 0))
    : 0;
  const extrusionY = extrusion
    ? Math.abs(Number(extrusion.y || 0) * Math.max(0, extrusion.steps || 0))
    : 0;

  const skewPadX =
    Math.abs(Math.tan(((Number(skewX) || 0) * Math.PI) / 180)) *
    effectiveFontSize *
    0.72;

  const padX = Math.ceil(
    Math.max(
      effectiveFontSize * 0.24,
      strokeWidth * 4,
      innerStrokeWidth * 3,
      hotRimWidth * 4,
      glowBlur,
      rimGlowBlur,
      shadowBlur + Math.abs(shadowX),
      extrusionX
    ) +
      skewPadX +
      10
  );

  const padY = Math.ceil(
    Math.max(
      effectiveFontSize * 0.28,
      strokeWidth * 4,
      innerStrokeWidth * 3,
      hotRimWidth * 4,
      glowBlur * 0.8,
      rimGlowBlur,
      shadowBlur + Math.abs(shadowY),
      extrusionY
    ) + 10
  );

  const lineHeightPx = effectiveFontSize * Math.max(0.55, Number(lineHeight) || 0.92);
  const textBlockHeight = effectiveFontSize + Math.max(0, lines.length - 1) * lineHeightPx;

  const logicalWidth = Math.ceil(maxLineWidth + padX * 2);
  const logicalHeight = Math.ceil(textBlockHeight + padY * 2);
  const width = Math.max(1, Math.ceil(logicalWidth * ratio));
  const height = Math.max(1, Math.ceil(logicalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Headline texture context unavailable");

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.font = makeFont(effectiveFontSize);
  ctx.textAlign = align === "right" ? "right" : align === "left" ? "left" : "center";
  ctx.textBaseline = "alphabetic";

  const textX =
    align === "left" ? padX : align === "right" ? logicalWidth - padX : logicalWidth / 2;

  const firstBaseline = padY + effectiveFontSize * 0.82;

  const applyTextTransform = (draw: () => void) => {
    ctx.save();
    const skew = Number(skewX) || 0;

    if (Math.abs(skew) > 0.01) {
      ctx.translate(logicalWidth / 2, logicalHeight / 2);
      ctx.transform(1, 0, Math.tan((skew * Math.PI) / 180), 1, 0, 0);
      ctx.translate(-logicalWidth / 2, -logicalHeight / 2);
    }

    draw();
    ctx.restore();
  };

  const forEachLine = (draw: (line: string, x: number, y: number) => void) => {
    lines.forEach((line, index) => {
      draw(line, textX, firstBaseline + index * lineHeightPx);
    });
  };

  const drawPass = (mode: "fill" | "stroke") => {
    forEachLine((line, x, y) => {
      drawTrackedCanvasText(ctx, line, x, y, effectiveLetterSpacing, mode);
    });
  };

  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;

  const maskCtx = mask.getContext("2d");

  if (maskCtx) {
    maskCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    maskCtx.font = makeFont(effectiveFontSize);
    maskCtx.textAlign = ctx.textAlign;
    maskCtx.textBaseline = "alphabetic";
    maskCtx.fillStyle = "#fff";
    maskCtx.strokeStyle = "#fff";
    maskCtx.lineJoin = "round";
    maskCtx.lineWidth = Math.max(1, strokeWidth);

    maskCtx.save();

    const skew = Number(skewX) || 0;

    if (Math.abs(skew) > 0.01) {
      maskCtx.translate(logicalWidth / 2, logicalHeight / 2);
      maskCtx.transform(1, 0, Math.tan((skew * Math.PI) / 180), 1, 0, 0);
      maskCtx.translate(-logicalWidth / 2, -logicalHeight / 2);
    }

    lines.forEach((line, index) => {
      const y = firstBaseline + index * lineHeightPx;
      drawTrackedCanvasText(maskCtx, line, textX, y, effectiveLetterSpacing, "fill");
      if (strokeWidth > 0) {
        drawTrackedCanvasText(maskCtx, line, textX, y, effectiveLetterSpacing, "stroke");
      }
    });

    maskCtx.restore();
  }

  const drawMaskedOverlay = (
    paint: (overlayCtx: CanvasRenderingContext2D) => void,
    alpha: number,
    composite: GlobalCompositeOperation = "source-over"
  ) => {
    if (!maskCtx) return;

    const overlay = document.createElement("canvas");
    overlay.width = width;
    overlay.height = height;

    const overlayCtx = overlay.getContext("2d");
    if (!overlayCtx) return;

    overlayCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint(overlayCtx);

    overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    overlayCtx.globalCompositeOperation = "destination-in";
    overlayCtx.drawImage(mask, 0, 0);

    ctx.save();
    ctx.globalAlpha = clampExportAlpha(alpha);
    ctx.globalCompositeOperation = composite;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  // 1. Drop shadow
  if (preset.shadow) {
    ctx.save();
    ctx.globalAlpha = preset.shadow.alpha;
    ctx.shadowColor = preset.shadow.color;
    ctx.shadowBlur = preset.shadow.blur;
    ctx.fillStyle = preset.shadow.color;

    applyTextTransform(() => {
      forEachLine((line, x, y) => {
        drawTrackedCanvasText(
          ctx,
          line,
          x + preset.shadow!.x,
          y + preset.shadow!.y,
          effectiveLetterSpacing,
          "fill"
        );
      });
    });

    ctx.restore();
  }

  // 2. Extruded back wall
  if (preset.extrusion) {
    ctx.save();
    ctx.globalAlpha = preset.extrusion.alpha;
    ctx.fillStyle = preset.extrusion.color;

    applyTextTransform(() => {
      for (let step = preset.extrusion!.steps; step > 0; step -= 1) {
        forEachLine((line, x, y) => {
          drawTrackedCanvasText(
            ctx,
            line,
            x + preset.extrusion!.x * step,
            y + preset.extrusion!.y * step,
            effectiveLetterSpacing,
            "fill"
          );
        });
      }
    });

    ctx.restore();
  }

  // 4. Soft outer bloom
  if (preset.glow) {
    ctx.save();
    ctx.globalAlpha = clampExportAlpha(preset.glow.alpha * 0.62);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = preset.glow.color;
    ctx.shadowBlur = preset.glow.blur * 0.86;
    ctx.strokeStyle = preset.glow.color;
    ctx.lineWidth = Math.max(6, Math.min(18, strokeWidth + preset.glow.blur * 0.08));
    ctx.lineJoin = "round";
    applyTextTransform(() => drawPass("stroke"));
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = preset.glow.alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = preset.glow.color;
    ctx.shadowBlur = preset.glow.blur;
    ctx.fillStyle = preset.glow.color;
    applyTextTransform(() => drawPass("fill"));
    ctx.restore();
  }

  // 5. Dark outer rim first
  if (preset.stroke) {
    ctx.save();
    ctx.strokeStyle = preset.stroke.color;
    ctx.lineWidth = preset.stroke.width;
    ctx.lineJoin = "round";
    applyTextTransform(() => drawPass("stroke"));
    ctx.restore();
  }

  // 6. Transparent/dark glass body
  const fillGradient = ctx.createLinearGradient(0, padY, 0, logicalHeight - padY);
  fillGradient.addColorStop(0, preset.fill.top);
  fillGradient.addColorStop(0.32, preset.fill.mid);
  fillGradient.addColorStop(0.58, "rgba(0,0,0,0)");
  fillGradient.addColorStop(1, preset.fill.bottom);

  ctx.save();
  ctx.fillStyle = fillGradient;
  applyTextTransform(() => drawPass("fill"));
  ctx.restore();

  // 7. Dark cavity inside text
  if (preset.darkCavity) {
    drawMaskedOverlay((overlayCtx) => {
      const cavity = overlayCtx.createRadialGradient(
        logicalWidth * 0.48,
        logicalHeight * 0.5,
        0,
        logicalWidth * 0.48,
        logicalHeight * 0.5,
        Math.max(logicalWidth, logicalHeight) * 0.55
      );

      cavity.addColorStop(0, preset.darkCavity!.color);
      cavity.addColorStop(0.42, "rgba(10,0,28,0.42)");
      cavity.addColorStop(0.72, "rgba(255,43,191,0.08)");
      cavity.addColorStop(1, "rgba(255,43,191,0)");

      overlayCtx.fillStyle = cavity;
      overlayCtx.fillRect(0, 0, logicalWidth, logicalHeight);
    }, preset.darkCavity.alpha, "multiply");
  }

  // 8. Bevel lighting
  if (preset.bevel) {
    drawMaskedOverlay((overlayCtx) => {
      const bevelGradient = overlayCtx.createLinearGradient(0, padY, 0, logicalHeight - padY);

      bevelGradient.addColorStop(0, preset.bevel!.topColor);
      bevelGradient.addColorStop(0.24, "rgba(255,160,245,0.18)");
      bevelGradient.addColorStop(0.46, "rgba(255,255,255,0)");
      bevelGradient.addColorStop(0.72, "rgba(10,0,32,0.28)");
      bevelGradient.addColorStop(1, preset.bevel!.bottomColor);

      overlayCtx.fillStyle = bevelGradient;
      overlayCtx.fillRect(0, 0, logicalWidth, logicalHeight);
    }, preset.bevel.strength, "screen");
  }

  // 9. Hard reflection panels
  if (preset.reflectionPanels) {
    drawMaskedOverlay(
      (overlayCtx) => {
        const g = createAngledCanvasGradient(
          overlayCtx,
          logicalWidth,
          logicalHeight,
          preset.reflectionPanels!.angle
        );

        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.2, "rgba(255,255,255,0)");
        g.addColorStop(0.27, preset.reflectionPanels!.colorA);
        g.addColorStop(0.33, "rgba(255,60,215,0.08)");
        g.addColorStop(0.42, "rgba(255,255,255,0)");
        g.addColorStop(0.58, "rgba(255,255,255,0)");
        g.addColorStop(0.66, preset.reflectionPanels!.colorB);
        g.addColorStop(0.73, "rgba(150,80,255,0.08)");
        g.addColorStop(0.84, "rgba(255,255,255,0)");

        overlayCtx.fillStyle = g;
        overlayCtx.fillRect(0, 0, logicalWidth, logicalHeight);
      },
      preset.reflectionPanels.alpha,
      "screen"
    );
  }

  if (preset.refractionPanels) {
    drawMaskedOverlay(
      (overlayCtx) => {
        const g = createAngledCanvasGradient(
          overlayCtx,
          logicalWidth,
          logicalHeight,
          -8
        );

        g.addColorStop(0.0, "rgba(255,255,255,0)");
        g.addColorStop(0.22, preset.refractionPanels!.colorA);
        g.addColorStop(0.34, "rgba(255,255,255,0)");
        g.addColorStop(0.52, preset.refractionPanels!.colorB);
        g.addColorStop(0.64, "rgba(255,255,255,0)");
        g.addColorStop(0.82, "rgba(255,210,255,0.18)");
        g.addColorStop(1.0, "rgba(255,255,255,0)");

        overlayCtx.translate(
          preset.refractionPanels!.offsetX,
          preset.refractionPanels!.offsetY
        );

        overlayCtx.fillStyle = g;
        overlayCtx.fillRect(0, 0, logicalWidth, logicalHeight);
      },
      preset.refractionPanels.alpha,
      "screen"
    );
  }

  // 10. Clean glass reflection planes
  if (preset.svgReflections) {
    drawMaskedOverlay(
      (overlayCtx) => {
        const facetGradient = createAngledCanvasGradient(
          overlayCtx,
          logicalWidth,
          logicalHeight,
          18
        );

        facetGradient.addColorStop(0, "rgba(255,255,255,0)");
        facetGradient.addColorStop(0.24, "rgba(255,255,255,0)");
        facetGradient.addColorStop(0.38, preset.svgReflections!.colorA);
        facetGradient.addColorStop(0.5, preset.svgReflections!.colorB);
        facetGradient.addColorStop(0.66, preset.svgReflections!.colorC);
        facetGradient.addColorStop(0.8, "rgba(255,255,255,0)");
        facetGradient.addColorStop(1, "rgba(255,255,255,0)");

        const drawFacet = (points: Array<[number, number]>, alpha: number) => {
          overlayCtx.save();
          overlayCtx.globalAlpha = alpha;
          overlayCtx.beginPath();
          points.forEach(([x, y], index) => {
            if (index === 0) overlayCtx.moveTo(x, y);
            else overlayCtx.lineTo(x, y);
          });
          overlayCtx.closePath();
          overlayCtx.fillStyle = facetGradient;
          overlayCtx.fill();
          overlayCtx.restore();
        };

        const textLeft = padX;
        const textTop = padY;
        const textWidth = Math.max(1, maxLineWidth);
        const textHeight = Math.max(1, textBlockHeight);
        const px = (x: number) => textLeft + textWidth * x;
        const py = (y: number) => textTop + textHeight * y;
        const drawReflectionPlane = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          leadThickness: number,
          tailThickness: number,
          alpha: number
        ) => {
          const ax = px(x1);
          const ay = py(y1);
          const bx = px(x2);
          const by = py(y2);
          const dx = bx - ax;
          const dy = by - ay;
          const length = Math.max(1, Math.hypot(dx, dy));
          const leadX = (-dy / length) * textHeight * leadThickness;
          const leadY = (dx / length) * textHeight * leadThickness;
          const tailX = (-dy / length) * textHeight * tailThickness;
          const tailY = (dx / length) * textHeight * tailThickness;

          drawFacet(
            [
              [ax + leadX, ay + leadY],
              [bx + tailX, by + tailY],
              [bx - tailX, by - tailY],
              [ax - leadX, ay - leadY],
            ],
            alpha
          );
        };

        drawReflectionPlane(-0.08, 0.18, 0.88, 0.56, 0.09, 0.13, 0.62);
        drawReflectionPlane(0.34, 0.0, 1.02, 0.38, 0.05, 0.08, 0.42);
      },
      preset.svgReflections.alpha,
      "screen"
    );
  }

  // 11. Thin shine band
  if (preset.shine) {
    drawMaskedOverlay(
      (overlayCtx) => {
        const shineGradient = createAngledCanvasGradient(
          overlayCtx,
          logicalWidth,
          logicalHeight,
          preset.shine!.angle
        );

        shineGradient.addColorStop(0.35, "rgba(255,255,255,0)");
        shineGradient.addColorStop(0.48, preset.shine!.color);
        shineGradient.addColorStop(0.56, "rgba(255,90,225,0.08)");
        shineGradient.addColorStop(0.62, "rgba(255,255,255,0)");

        overlayCtx.fillStyle = shineGradient;
        overlayCtx.fillRect(0, 0, logicalWidth, logicalHeight);
      },
      preset.shine.alpha,
      "screen"
    );
  }

  // 12. Inner dark rim
  if (preset.innerStroke) {
    ctx.save();
    ctx.globalAlpha = preset.innerStroke.alpha;
    ctx.strokeStyle = preset.innerStroke.color;
    ctx.lineWidth = preset.innerStroke.width;
    ctx.lineJoin = "round";
    applyTextTransform(() => drawPass("stroke"));
    ctx.restore();
  }

  // 13. Hot pink rim
  if (preset.hotRim) {
    ctx.save();
    ctx.globalAlpha = preset.hotRim.alpha;
    ctx.strokeStyle = preset.hotRim.color;
    ctx.lineWidth = preset.hotRim.width;
    ctx.lineJoin = "round";
    applyTextTransform(() => drawPass("stroke"));
    ctx.restore();
  }

  // 14. Tight rim glow
  if (preset.rimGlow) {
    ctx.save();
    ctx.globalAlpha = preset.rimGlow.alpha;
    ctx.shadowColor = preset.rimGlow.color;
    ctx.shadowBlur = preset.rimGlow.blur;
    ctx.strokeStyle = preset.rimGlow.color;
    ctx.lineWidth = Math.max(0.8, hotRimWidth);
    ctx.lineJoin = "round";
    applyTextTransform(() => drawPass("stroke"));
    ctx.restore();
  }

  // 15. Small glints
  if (preset.glints) {
    ctx.save();
    ctx.globalAlpha = preset.glints.alpha;
    ctx.fillStyle = preset.glints.color;
    ctx.shadowColor = preset.glints.color;
    ctx.shadowBlur = preset.glints.size * 2;

    const s = preset.glints.size;
    const points = [
      [logicalWidth * 0.12, logicalHeight * 0.2],
      [logicalWidth * 0.36, logicalHeight * 0.18],
      [logicalWidth * 0.56, logicalHeight * 0.22],
      [logicalWidth * 0.82, logicalHeight * 0.24],
    ];

    for (const [x, y] of points) {
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s);
      ctx.lineTo(x, y + s);
      ctx.lineWidth = Math.max(1, s * 0.22);
      ctx.strokeStyle = preset.glints.color;
      ctx.stroke();
    }

    ctx.restore();
  }

  // 16. Noise texture
  if (preset.texture?.noiseAlpha) {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const noiseAlpha = Math.max(0, Math.min(0.2, preset.texture.noiseAlpha));

      let seed = 2166136261;
      for (const ch of `${text}|${preset.name}`) {
        seed ^= ch.charCodeAt(0);
        seed = Math.imul(seed, 16777619);
      }

      const rand = mulberry32(seed >>> 0);

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] <= 4) continue;

        const noise = (rand() - 0.5) * 255 * noiseAlpha;

        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }

      ctx.putImageData(imageData, 0, 0);
    } catch {}
  }

  return {
    canvas,
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
    logicalWidth,
    logicalHeight,
    padX,
    padY,
  };
}

export function buildLuxeGlassHeadlinePreset(args: {
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing: number;
  primary: string;
  secondary: string;
  highlight: string;
  edge?: string;
  strokeWidth: number;
  blur?: number;
  glow: number;
  fontSize: number;
  fillAlpha?: number;
}): HeadlineRenderPreset {
  return buildLuxeGlassHeadlineRenderPreset(args);
}

export function buildLuxeGlassHeadlineRenderPreset({
  fontFamily,
  fontWeight,
  letterSpacing,
  fontSize,
  primary,
  secondary,
  highlight,
  edge,
  strokeWidth,
  blur,
  glow,
  fillAlpha,
}: {
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing: number;
  fontSize: number;
  primary?: string;
  secondary?: string;
  highlight?: string;
  edge?: string;
  strokeWidth?: number;
  blur?: number;
  glow?: number;
  fillAlpha?: number;
}): HeadlineRenderPreset {
  const g = GLASS_HEADLINE_PRESET.glass;
  const unit = Math.max(0.45, fontSize / 180);

  const primaryColor = primary || g.primaryColor;
  const secondaryColor = secondary || g.secondaryColor;
  const highlightColor = highlight || g.highlightColor;
  const edgeColor = edge || g.edgeColor || g.rimColor || primaryColor;

  const edgeWidth = Math.max(
    0,
    Number.isFinite(Number(strokeWidth)) ? Number(strokeWidth) : g.stroke
  );

  const glowPx = Math.max(
    0,
    Number.isFinite(Number(glow)) ? Number(glow) : g.glow
  );

  const blurPx = Math.max(
    0,
    Number.isFinite(Number(blur)) ? Number(blur) : g.blur
  );

  const bodyAlpha = Math.max(
    0,
    Math.min(0.12, Number.isFinite(Number(fillAlpha)) ? Number(fillAlpha) : 0.08)
  );
  const glowAmount = easeLuxeGlow(glowPx);
  const glowRenderPx = glowAmount * 72;
  const edgeAmount = Math.min(1, edgeWidth / 1.7);
  const rimWidth = edgeWidth * unit;

  return {
    name: "Luxe Glass",
    fontFamily,
    fontWeight,
    letterSpacing,

    // GLASS BODY: almost no solid color
    fill: {
      top: `rgba(255,255,255,${bodyAlpha * 0.7})`,
      mid: `rgba(4,0,18,${bodyAlpha * 0.45})`,
      bottom: hexToRgba(primaryColor, bodyAlpha * 0.55),
    },

    // COLOR OUTER EDGE
    stroke: {
      color: colorWithAlpha(edgeColor, 0.78),
      width: Math.max(0.25, rimWidth * 1.08),
    },

    // SOFT INNER EDGE
    innerStroke: {
      color: colorWithAlpha(edgeColor, 0.58),
      width: Math.max(0.2, rimWidth * 0.58),
      alpha: Math.min(0.62, 0.28 + edgeAmount * 0.34),
    },

    // HOT GLASS RIM
    hotRim: {
      color: colorWithAlpha(edgeColor, 0.98),
      width: Math.max(0.22, rimWidth * 0.42),
      alpha: 1,
    },

    shadow: {
      color: "rgba(6,0,22,0.88)",
      blur: blurPx * 8,
      x: 0,
      y: Math.max(2, 7 * unit),
      alpha: Math.min(0.42, 0.08 + blurPx * 0.18),
    },

    // REAL GLOW MUST BE VISIBLE
    glow: {
      color: hexToRgba(primaryColor, 0.9),
      blur: glowRenderPx * 1.1 * unit,
      alpha: 0.46 * glowAmount,
    },

    rimGlow: {
      color: colorWithAlpha(edgeColor, 0.95),
      blur: glowRenderPx * 0.42 * unit,
      alpha: 0.38 * glowAmount,
    },

    bevel: {
      topColor: hexToRgba(highlightColor, 0.72),
      bottomColor: "rgba(5,0,24,0.76)",
      strength: 0.48,
    },

    darkCavity: {
      alpha: Math.min(0.22, bodyAlpha * 2.5),
      color: "rgba(0,0,10,0.92)",
    },

    // HARD REFLECTIONS
    reflectionPanels: {
      alpha: 0.46,
      angle: -18,
      colorA: "rgba(255,245,255,0.95)",
      colorB: "rgba(255,90,225,0.5)",
    },

    // FAKE REFRACTION
    refractionPanels: {
      alpha: 0.24,
      offsetX: 3.2 * unit,
      offsetY: -2.1 * unit,
      colorA: hexToRgba(secondaryColor, 0.45),
      colorB: hexToRgba(primaryColor, 0.42),
    },

    svgReflections: {
      alpha: 0.44,
      colorA: "rgba(255,255,255,0.82)",
      colorB: hexToRgba(highlightColor, 0.48),
      colorC: hexToRgba(primaryColor, 0.28),
    },

    shine: {
      color: hexToRgba(highlightColor, 0.66),
      alpha: 0.28,
      angle: -18,
    },

    texture: {
      noiseAlpha: 0.006,
    },
  };
}
