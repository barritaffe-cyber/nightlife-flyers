// lib/cleanupCutoutUrl.ts

export type CleanupParams = {
  shrinkPx: number;
  featherPx: number;
  alphaBoost: number;
  decontaminate: number;
  alphaSmoothPx: number;
  edgeGamma: number;
  spillSuppress: number;
  alphaFill: number;
  edgeClamp: number;
};

export const PREMIUM_CUTOUT_CLEANUP: CleanupParams = {
  shrinkPx: 1,
  featherPx: 1,
  alphaBoost: 1.5,
  decontaminate: 0.72,
  alphaSmoothPx: 1,
  edgeGamma: 0.94,
  spillSuppress: 0.58,
  alphaFill: 0.12,
  edgeClamp: 0.14,
};

// Small helper: clamp
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Input: a PNG/DataURL/objectURL that already has transparency.
 * Output: a DataURL PNG with improved edges.
 */
export async function cleanupCutoutUrl(
  sourceUrl: string,
  params: CleanupParams
): Promise<string> {
  // ✅ GUARD: Check for empty URL before starting
  if (!sourceUrl) {
    throw new Error("cleanupCutoutUrl: No source URL provided");
  }

  const img = await loadImage(sourceUrl);

  const w = img.naturalWidth || (img as any).width;
  const h = img.naturalHeight || (img as any).height;

  if (w === 0 || h === 0) {
    throw new Error("cleanupCutoutUrl: Image has 0 dimensions");
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // read pixels
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  // --- PARAMS (clamped defaults) ---
  const alphaBoost = clamp(params.alphaBoost ?? PREMIUM_CUTOUT_CLEANUP.alphaBoost, 0.5, 3.0);
  const alphaSmoothPx = Math.round(clamp(params.alphaSmoothPx ?? 0, 0, 6));
  const shrinkPx = Math.round(clamp(params.shrinkPx ?? 0, 0, 12));
  const alphaFill = clamp(params.alphaFill ?? PREMIUM_CUTOUT_CLEANUP.alphaFill, 0, 0.25);
  const featherPx = Math.round(clamp(params.featherPx ?? 0, 0, 24));
  const edgeGamma = clamp(params.edgeGamma ?? PREMIUM_CUTOUT_CLEANUP.edgeGamma, 0.7, 1.5);
  const edgeClamp = clamp(params.edgeClamp ?? PREMIUM_CUTOUT_CLEANUP.edgeClamp, 0, 1);
  const decon = clamp(params.decontaminate ?? PREMIUM_CUTOUT_CLEANUP.decontaminate, 0, 1);
  const spillSuppress = clamp(params.spillSuppress ?? PREMIUM_CUTOUT_CLEANUP.spillSuppress, 0, 1);
  const snapStrength = clamp(
    0.18 + edgeClamp * 0.9 + Math.max(0, alphaBoost - 1) * 0.14 + spillSuppress * 0.08,
    0,
    0.92
  );

  // ------------------------------------------------------------
  // 1) Alpha boost (makes hair/edges more solid)
  // ------------------------------------------------------------
  if (alphaBoost !== 1) {
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      const boosted = 1 - Math.pow(1 - a, alphaBoost);
      d[i + 3] = clamp(Math.round(boosted * 255), 0, 255);
    }
  }

  // ------------------------------------------------------------
  // 2) Alpha smooth — blur only alpha
  // ------------------------------------------------------------
  if (alphaSmoothPx > 0) {
    blurAlphaBox(d, w, h, alphaSmoothPx);
  }

  // ------------------------------------------------------------
  // 3) Shrink alpha edge (tighten cutout)
  // ------------------------------------------------------------
  if (shrinkPx > 0) {
    erodeAlpha(d, w, h, shrinkPx);
  }

  // ------------------------------------------------------------
  // 4) Snap semi-transparent edge pixels to cleaner mask boundaries
  // ------------------------------------------------------------
  if (snapStrength > 0) {
    despeckleAlpha(d, w, h);
    snapAlphaEdges(d, w, h, snapStrength);
  }

  // ------------------------------------------------------------
  // 5) Alpha fill — close near-opaque pinholes
  // ------------------------------------------------------------
  if (alphaFill > 0) {
    const t = 1 - alphaFill; 
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      if (a >= t) d[i + 3] = 255;
    }
  }

  // commit pre-feather pixel changes
  ctx.putImageData(id, 0, 0);

  // ------------------------------------------------------------
  // 6) Feather (blur ONLY alpha edge via destination-in blur)
  // ------------------------------------------------------------
  if (featherPx > 0) {
    const mask = document.createElement("canvas");
    mask.width = w;
    mask.height = h;

    const mctx = mask.getContext("2d")!;
    mctx.clearRect(0, 0, w, h);

    // alpha mask from current canvas
    mctx.drawImage(canvas, 0, 0);
    mctx.globalCompositeOperation = "source-in";
    mctx.fillStyle = "white";
    mctx.fillRect(0, 0, w, h);

    const blurred = document.createElement("canvas");
    blurred.width = w;
    blurred.height = h;
    const bctx = blurred.getContext("2d")!;
    bctx.filter = `blur(${featherPx}px)`;
    bctx.drawImage(mask, 0, 0);
    bctx.filter = "none";

    // apply mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(blurred, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  // ------------------------------------------------------------
  // 7) Edge gamma + edge clamp
  // ------------------------------------------------------------
  if (edgeGamma !== 1.0 || edgeClamp > 0) {
    const id3 = ctx.getImageData(0, 0, w, h);
    const p = id3.data;
    const edgeMin = 0.02;
    const edgeMax = 0.98;

    for (let i = 0; i < p.length; i += 4) {
      const a = p[i + 3] / 255;
      if (a > edgeMin && a < edgeMax) {
        let ag = a;
        if (edgeGamma !== 1.0) ag = Math.pow(a, edgeGamma);
        if (edgeClamp > 0) ag = Math.max(ag, edgeClamp);
        p[i + 3] = clamp(Math.round(ag * 255), 0, 255);
      }
    }
    ctx.putImageData(id3, 0, 0);
  }

  // ------------------------------------------------------------
  // 8) Decontaminate — pull edge RGB toward neutral
  // ------------------------------------------------------------
  if (decon > 0) {
    const id2 = ctx.getImageData(0, 0, w, h);
    const p = id2.data;

    for (let i = 0; i < p.length; i += 4) {
      const a = p[i + 3] / 255;
      if (a > 0.05 && a < 0.95) {
        const r = p[i], g = p[i + 1], b = p[i + 2];
        const avg = (r + g + b) / 3;
        p[i]     = clamp(Math.round(r + (avg - r) * decon), 0, 255);
        p[i + 1] = clamp(Math.round(g + (avg - g) * decon), 0, 255);
        p[i + 2] = clamp(Math.round(b + (avg - b) * decon), 0, 255);
      }
    }
    ctx.putImageData(id2, 0, 0);
  }

  // ------------------------------------------------------------
  // 9) Spill suppress — pull edge RGB toward nearest solid pixels
  // ------------------------------------------------------------
  if (spillSuppress > 0) {
    const id4 = ctx.getImageData(0, 0, w, h);
    const p = id4.data;
    const SOLID_A = 0.98;
    const EDGE_MIN = 0.05;
    const EDGE_MAX = 0.95;
    const R = 3;
    const idx = (x: number, y: number) => (y * w + x) * 4;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y);
        const a = p[i + 3] / 255;
        if (a <= EDGE_MIN || a >= EDGE_MAX) continue;

        let found = false;
        let sr = 0, sg = 0, sb = 0;
        let count = 0;

        for (let oy = -R; oy <= R; oy++) {
          const yy = y + oy;
          if (yy < 0 || yy >= h) continue;
          for (let ox = -R; ox <= R; ox++) {
            const xx = x + ox;
            if (xx < 0 || xx >= w) continue;
            const j = idx(xx, yy);
            const na = p[j + 3] / 255;
            if (na >= SOLID_A) {
              sr += p[j]; sg += p[j + 1]; sb += p[j + 2];
              count++; found = true;
            }
          }
        }
        if (!found || count === 0) continue;

        const nr = sr / count;
        const ng = sg / count;
        const nb = sb / count;

        p[i]     = clamp(Math.round(p[i]     + (nr - p[i])     * spillSuppress), 0, 255);
        p[i + 1] = clamp(Math.round(p[i + 1] + (ng - p[i + 1]) * spillSuppress), 0, 255);
        p[i + 2] = clamp(Math.round(p[i + 2] + (nb - p[i + 2]) * spillSuppress), 0, 255);
      }
    }
    ctx.putImageData(id4, 0, 0);
  }

  return canvas.toDataURL("image/png");
}

// ✅ FIX: Robust Image Loader
// Prevents silent crashes by providing real error messages
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    // Only use CrossOrigin if it's NOT a data/blob URL to avoid taint issues
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => resolve(img);
    
    // Return a real Error object, not the generic Event
    img.onerror = () => reject(new Error(`Failed to load image at: ${src.substring(0, 30)}...`));
    
    img.src = src;
  });
}

/**
 * Erode alpha by N pixels
 */
function erodeAlpha(data: Uint8ClampedArray, w: number, h: number, radius: number) {
  const copy = new Uint8ClampedArray(data);
  const getA = (x: number, y: number) => copy[(y * w + x) * 4 + 3];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let minA = 255;
      for (let oy = -radius; oy <= radius; oy++) {
        const yy = y + oy;
        if (yy < 0 || yy >= h) continue;
        for (let ox = -radius; ox <= radius; ox++) {
          const xx = x + ox;
          if (xx < 0 || xx >= w) continue;
          const a = getA(xx, yy);
          if (a < minA) minA = a;
          if (minA === 0) break;
        }
        if (minA === 0) break;
      }
      data[(y * w + x) * 4 + 3] = minA;
    }
  }
}

/**
 * Blur alpha only using a lightweight box blur
 */
function blurAlphaBox(data: Uint8ClampedArray, w: number, h: number, radius: number) {
  if (radius <= 0) return;

  const copy = new Uint8ClampedArray(data);
  const idxA = (x: number, y: number) => (y * w + x) * 4 + 3;

  const tempA = new Uint8ClampedArray(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let ox = -radius; ox <= radius; ox++) {
        const xx = x + ox;
        if (xx < 0 || xx >= w) continue;
        sum += copy[idxA(xx, y)];
        count++;
      }
      tempA[y * w + x] = Math.round(sum / Math.max(1, count));
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let oy = -radius; oy <= radius; oy++) {
        const yy = y + oy;
        if (yy < 0 || yy >= h) continue;
        sum += tempA[yy * w + x];
        count++;
      }
      data[idxA(x, y)] = Math.round(sum / Math.max(1, count));
    }
  }
}

function despeckleAlpha(data: Uint8ClampedArray, w: number, h: number) {
  const copy = new Uint8ClampedArray(data);
  const idxA = (x: number, y: number) => (y * w + x) * 4 + 3;
  const visibleCut = 28;
  const solidCut = 214;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idxA(x, y);
      const a = copy[i];
      if (a === 0 || a === 255) continue;

      let visible = 0;
      let solid = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const na = copy[idxA(x + ox, y + oy)];
          if (na >= visibleCut) visible++;
          if (na >= solidCut) solid++;
        }
      }

      if (a < visibleCut && visible <= 2) {
        data[i] = 0;
      } else if (a >= solidCut && solid >= 5) {
        data[i] = 255;
      }
    }
  }
}

function snapAlphaEdges(data: Uint8ClampedArray, w: number, h: number, amount: number) {
  if (amount <= 0) return;

  const copy = new Uint8ClampedArray(data);
  const idxA = (x: number, y: number) => (y * w + x) * 4 + 3;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idxA(x, y);
      const base = copy[i] / 255;
      if (base <= 0.01 || base >= 0.99) continue;

      let sum = 0;
      let count = 0;
      let solids = 0;
      let empties = 0;
      let maxDelta = 0;

      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const n = copy[idxA(x + ox, y + oy)] / 255;
          sum += n;
          count++;
          if (n >= 0.92) solids++;
          else if (n <= 0.08) empties++;
          maxDelta = Math.max(maxDelta, Math.abs(n - base));
        }
      }

      const mean = sum / Math.max(1, count);
      const bias = Math.abs(solids - empties) / Math.max(1, count);
      const target =
        solids > empties ? 1 : empties > solids ? 0 : mean >= 0.5 ? 1 : 0;
      const localAmount = clamp(amount * (0.58 + maxDelta * 1.25 + bias * 0.9), 0, 0.98);
      const softened = base + (mean - base) * 0.18;
      const snapped = softened + (target - softened) * localAmount;

      data[i] = clamp(Math.round(snapped * 255), 0, 255);
    }
  }
}
