import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
type Value = Record<string, any>;

export const isWeOutsideAgeBadge = (asset: Value) => !asset.cocoCompiledObjectId && String(asset.id).startsWith('circular_text_');

export function hideWeOutsideAgeBadge(variant: Value): boolean {
  const system = variant.cocoCompositionSystem;
  if (system?.compiledDocument?.id !== 'we-outside') return false;
  const age = system.compiledDocument.objects.find((object: Value) => object.id === 'legal');
  if (!age || system.compiledObjectOverrides?.legal?.removed) return true;
  const live = (property: string, fallback: unknown) => compiledObjectValue(system.compiledObjectOverrides ?? {}, compiledPreviewFields(variant), age, property, fallback);
  return live('enabled', true) === false || !String(live('text', age.text ?? '')).trim();
}

/** The authored speech bubble fits a short slogan; longer wording stands alone. */
export function hideWeOutsideSloganHolder(document: Value | undefined, overrides: Value,
  live: (object: Value, property: string, fallback: unknown) => any): boolean {
  if (document?.id !== 'we-outside') return false;
  const slogan = document.objects?.find((object: Value) => object.id === 'we');
  if (!slogan || overrides.we?.removed || live(slogan, 'enabled', true) === false) return true;
  const text = String(live(slogan, 'text', slogan.text ?? '')).trim();
  return !text || Array.from(text).length > 5;
}

/** Native circular stickers already paint on canvas/export; preview needs their saved art too. */
export function weOutsidePreviewBadges(variant: Value, format: 'square' | 'story'): Value[] {
  if (variant.cocoCompositionSystem?.compiledDocument?.id !== 'we-outside' || hideWeOutsideAgeBadge(variant)) return [];
  const assets: Value[] = variant.portraits ?? variant.emojiList ?? [];
  return assets.filter(asset => isWeOutsideAgeBadge(asset) && asset.url).map(asset => {
    const size = 128 * Number(asset.scale ?? 1);
    const width = size / 540 * 100;
    const height = size / (format === 'story' ? 960 : 540) * 100;
    const bounds = { x: Number(asset.x) - width / 2, y: Number(asset.y) - height / 2, width, height };
    return { id: `preview-${asset.id}`, kind: 'image', semanticRole: 'badge',
      assetRole: `preview-${asset.id}`, editable: false, bounds, paintBounds: bounds,
      image: { src: asset.url, fit: 'contain' },
      paint: { opacity: asset.opacity ?? 1, blendMode: asset.blendMode ?? 'normal' },
      transform: { rotate: asset.rotation ?? 0 },
      stacking: { order: asset.layerOffset ?? 55, zIndex: asset.layerOffset ?? 55 } };
  });
}
