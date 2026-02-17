export type MoodStyleSignal = {
  stylePrompt: string;
  blurredReference: string | null;
};

const SIGNAL_CACHE = new Map<string, MoodStyleSignal>();

function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: clamp01(s), l: clamp01(l) };
}

function hueName(h: number) {
  if (h >= 330 || h < 20) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "amber";
  if (h < 95) return "yellow-green";
  if (h < 145) return "green";
  if (h < 185) return "teal";
  if (h < 215) return "cyan";
  if (h < 250) return "blue";
  if (h < 285) return "indigo";
  if (h < 330) return "magenta";
  return "mixed";
}

function pickPalette(hueBuckets: Map<string, number>) {
  const sorted = Array.from(hueBuckets.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "deep black with subtle colored highlights";
  if (sorted.length === 1) return `${sorted[0][0]} highlights on deep neutral base`;
  const first = sorted[0][0];
  const second = sorted.find((x) => x[0] !== first)?.[0] ?? sorted[1][0];
  return `${first} and ${second} accents on dark nightlife base`;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load mood sample"));
    img.src = src;
  });
}

function drawScaled(img: HTMLImageElement, maxSide: number) {
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const w = ratio >= 1 ? maxSide : Math.max(1, Math.round(maxSide * ratio));
  const h = ratio >= 1 ? Math.max(1, Math.round(maxSide / ratio)) : maxSide;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

function blurReferenceDataUrl(sourceCanvas: HTMLCanvasElement) {
  const out = document.createElement("canvas");
  out.width = 256;
  out.height = 256;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;

  const temp = document.createElement("canvas");
  temp.width = 96;
  temp.height = 96;
  const tempCtx = temp.getContext("2d");
  if (!tempCtx) return null;

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.drawImage(sourceCanvas, 0, 0, temp.width, temp.height);

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.filter = "blur(10px) saturate(1.08)";
  outCtx.drawImage(temp, 0, 0, out.width, out.height);
  outCtx.filter = "none";
  return out.toDataURL("image/png");
}

function buildStylePrompt(metrics: {
  lumaMean: number;
  lumaStd: number;
  satMean: number;
  edgeMean: number;
  palette: string;
}) {
  const contrast =
    metrics.lumaStd > 62 ? "high contrast" : metrics.lumaStd > 40 ? "medium contrast" : "soft contrast";
  const saturation =
    metrics.satMean > 0.52 ? "rich saturation" : metrics.satMean > 0.34 ? "balanced saturation" : "muted saturation";
  const energy =
    metrics.edgeMean > 24 ? "high energy" : metrics.edgeMean > 15 ? "moderate energy" : "calm energy";
  const lighting =
    metrics.lumaMean < 92
      ? "dark directional nightclub lighting with practical highlights"
      : metrics.lumaMean > 150
        ? "bright premium nightlife lighting with polished highlights"
        : "balanced low-light nightlife lighting";
  const texture =
    metrics.edgeMean > 21 ? "gritty cinematic texture" : "clean premium texture";
  const depth =
    metrics.lumaStd > 50 ? "shallow-to-medium depth cinematic focus" : "layered atmospheric depth";

  return [
    "style dna only",
    `palette mood: ${metrics.palette}`,
    `lighting: ${lighting}`,
    `contrast: ${contrast}`,
    `saturation: ${saturation}`,
    `energy: ${energy}`,
    `texture: ${texture}`,
    `depth: ${depth}`,
    "create a different scene",
    "do not copy subjects, pose, faces, camera angle, composition, or object placement from reference",
  ].join(", ");
}

export async function deriveMoodStyleSignal(referenceSrc: string): Promise<MoodStyleSignal> {
  const key = String(referenceSrc || "").trim();
  if (!key) {
    return {
      stylePrompt:
        "style dna only, nightlife lighting and palette guidance, create a different scene, do not copy structure",
      blurredReference: null,
    };
  }
  const cached = SIGNAL_CACHE.get(key);
  if (cached) return cached;

  if (typeof window === "undefined" || typeof document === "undefined") {
    const fallback = {
      stylePrompt:
        "style dna only, nightlife lighting and palette guidance, create a different scene, do not copy structure",
      blurredReference: null,
    };
    SIGNAL_CACHE.set(key, fallback);
    return fallback;
  }

  try {
    const img = await loadImage(key);
    const { canvas, ctx, w, h } = drawScaled(img, 256);
    const data = ctx.getImageData(0, 0, w, h).data;

    let px = 0;
    let lumaSum = 0;
    let lumaSqSum = 0;
    let satSum = 0;
    let edgeAcc = 0;
    let edgeCount = 0;
    const hueBuckets = new Map<string, number>();
    const lumaGrid = new Float32Array(w * h);

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        const a = data[i + 3];
        if (a < 16) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        lumaGrid[y * w + x] = luma;
        const hsl = rgbToHsl(r, g, b);
        px += 1;
        lumaSum += luma;
        lumaSqSum += luma * luma;
        satSum += hsl.s;
        if (hsl.s >= 0.2) {
          const keyHue = hueName(hsl.h);
          hueBuckets.set(keyHue, (hueBuckets.get(keyHue) || 0) + 1);
        }
      }
    }

    for (let y = 0; y < h - 1; y += 1) {
      for (let x = 0; x < w - 1; x += 1) {
        const idx = y * w + x;
        const l = lumaGrid[idx];
        if (l === 0) continue;
        const dx = Math.abs(l - lumaGrid[idx + 1]);
        const dy = Math.abs(l - lumaGrid[idx + w]);
        edgeAcc += dx + dy;
        edgeCount += 2;
      }
    }

    const count = Math.max(1, px);
    const lumaMean = lumaSum / count;
    const satMean = satSum / count;
    const variance = Math.max(0, lumaSqSum / count - lumaMean * lumaMean);
    const lumaStd = Math.sqrt(variance);
    const edgeMean = edgeCount > 0 ? edgeAcc / edgeCount : 0;
    const palette = pickPalette(hueBuckets);

    const signal: MoodStyleSignal = {
      stylePrompt: buildStylePrompt({ lumaMean, lumaStd, satMean, edgeMean, palette }),
      blurredReference: blurReferenceDataUrl(canvas),
    };

    SIGNAL_CACHE.set(key, signal);
    return signal;
  } catch {
    const fallback = {
      stylePrompt:
        "style dna only, preserve nightlife lighting and palette mood, keep a different composition and subject arrangement",
      blurredReference: null,
    };
    SIGNAL_CACHE.set(key, fallback);
    return fallback;
  }
}
