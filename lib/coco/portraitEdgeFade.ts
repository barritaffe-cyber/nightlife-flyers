// Alpha fades belong to the portrait, not the canvas: percentages follow every
// move/resize, and the same style is used by previews and the export DOM.
export const PORTRAIT_EDGE_MASK =
  'linear-gradient(to bottom, transparent 0%, #000 2%, #000 72%, transparent 100%), linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)';

export const PORTRAIT_EDGE_FADE_STYLE = Object.freeze({
  maskImage: PORTRAIT_EDGE_MASK,
  WebkitMaskImage: PORTRAIT_EDGE_MASK,
  WebkitMaskComposite: 'source-in' as const,
  // Standard value must be last: Chromium aliases the prefixed property, and
  // serializing `source-in` in the standard mask shorthand drops masks in PNGs.
  maskComposite: 'intersect' as const,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
});

export function hasPortraitEdgeFade(asset: any, semanticRole?: string): boolean {
  if (asset?.isLogo || String(asset?.id ?? '').startsWith('logo_')) return false;
  if (['background', 'logo'].includes(semanticRole ?? asset?.cocoAssetRole)) return false;
  return Boolean(asset?.isExtracted || asset?.isBrandFace ||
    ['subject', 'portrait', 'portraitEcho'].includes(semanticRole ?? asset?.cocoAssetRole));
}

// The mobile scene renderer uses Canvas/Pixi instead of DOM masks. Bake the
// same alpha ramp into a temporary texture; keep the uploaded original intact.
export function createPortraitEdgeTexture(image: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Portrait edge fade requires a canvas context');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-in';
  const vertical = ctx.createLinearGradient(0, 0, 0, canvas.height);
  for (const [stop, alpha] of [[0, 0], [.02, 1], [.72, 1], [1, 0]]) vertical.addColorStop(stop, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const horizontal = ctx.createLinearGradient(0, 0, canvas.width, 0);
  for (const [stop, alpha] of [[0, 0], [.07, 1], [.93, 1], [1, 0]]) horizontal.addColorStop(stop, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}
