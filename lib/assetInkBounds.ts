import { isVisibleAssetPixel } from './canvasHitTesting.ts';

export type InkBounds = { x: number; y: number; width: number; height: number };
export function assetInkBounds(data: Uint8ClampedArray, width: number, height: number, blendMode = 'normal'): InkBounds | null {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (!isVisibleAssetPixel({ red: data[i], green: data[i + 1], blue: data[i + 2], alpha: data[i + 3], blendMode })) continue;
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return right < left ? null : { x: left / width, y: top / height, width: (right - left + 1) / width, height: (bottom - top + 1) / height };
}

/** Map natural-image ink into its CSS object-fit box (all current asset fits). */
export function fitAssetInk(ink: InkBounds, naturalWidth: number, naturalHeight: number, width: number, height: number, fit: string, position = '50% 50%'): InkBounds {
  const scale = fit === 'cover' ? Math.max(width / naturalWidth, height / naturalHeight) : Math.min(width / naturalWidth, height / naturalHeight);
  const w = fit === 'fill' ? width : naturalWidth * scale;
  const h = fit === 'fill' ? height : naturalHeight * scale;
  const parts = position.split(/\s+/);
  const offset = (value: string, free: number) => value?.endsWith('%') ? free * parseFloat(value) / 100 : parseFloat(value) || 0;
  const x = offset(parts[0], width - w) + ink.x * w, y = offset(parts[1] ?? parts[0], height - h) + ink.y * h;
  const left = Math.max(0, x), top = Math.max(0, y);
  return { x: left, y: top, width: Math.max(0, Math.min(width, x + ink.width * w) - left), height: Math.max(0, Math.min(height, y + ink.height * h) - top) };
}

const cache = new Map<string, InkBounds | null>();
export function loadedAssetInk(image: HTMLImageElement): InkBounds | null | undefined {
  if (!image.complete || !image.naturalWidth) return undefined;
  const blend = getComputedStyle(image).mixBlendMode;
  const key = `${image.currentSrc || image.src}:${blend}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const ratio = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const bounds = assetInkBounds(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, blend);
    if (cache.size > 256) cache.delete(cache.keys().next().value!);
    cache.set(key, bounds); return bounds;
  } catch { return undefined; } // Cross-origin artwork still gets its box target.
}
