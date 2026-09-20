export type CocoRecipeBackgroundChoice = {
  backgroundDataUrl?: string;
  backgroundSrc?: string;
  backgroundSelectionExplicit?: boolean;
};

export function selectedCocoRecipeBackground(choice: CocoRecipeBackgroundChoice) {
  if (choice.backgroundSelectionExplicit === false) return '';
  return choice.backgroundDataUrl || choice.backgroundSrc || '';
}

/** A saved upload can replace a removed compiled background without changing the master. */
export function cocoNativePreviewBackground(source: Record<string, any>): string {
  const system = source.cocoCompositionSystem;
  const assets = [...(source.portraits ?? []), ...(source.emojiList ?? [])];
  const visibleBackground = system?.compiledDocument?.objects?.some((object: any) => {
    if (![object.id, object.semanticRole, object.assetRole].includes('background')) return false;
    if (system.compiledObjectOverrides?.[object.id]?.removed) return false;
    const asset = assets.find((a: any) => a.cocoCompiledObjectId === object.id);
    return Number(asset?.opacity ?? object.paint?.opacity ?? 1) > 0;
  });
  return visibleBackground ? '' : linkedPaletteNativeSource(system, source.bgUploadUrl || source.bgUrl) || '';
}

/** Same image geometry as the editor's native background pan/zoom layer. */
export function cocoPreviewBackgroundGeometry(source: Record<string, any>, format: 'square' | 'story', image: { width: number; height: number }) {
  const canvas = { width: 540, height: format === 'story' ? 960 : 540 };
  const base = source.bgFitMode ? Math.min(canvas.width / image.width, canvas.height / image.height) : Math.max(canvas.width / image.width, canvas.height / image.height);
  const scale = base * Number(source.bgScale ?? 1);
  const width = image.width * scale, height = image.height * scale;
  return { width, height, x: (canvas.width - width) * Number(source.bgPosX ?? 50) / 100,
    y: (canvas.height - height) * Number(source.bgPosY ?? 50) / 100, rotation: Number(source.bgRotate ?? 0) };
}

/** Replace only background artwork, including compiled layers that cover the canvas base. */
export function withCocoRecipeBackground<T extends Record<string, any>>(source: T, choice: CocoRecipeBackgroundChoice): T {
  const url = selectedCocoRecipeBackground(choice);
  if (!url) return source;
  const isBackground = (item: any) => [item?.id, item?.semanticRole, item?.assetRole, item?.cocoAssetRole, item?.binding?.semanticRole]
    .some(role => role === 'background');
  const system = source.cocoCompositionSystem;
  const document = system?.compiledDocument;
  const backgroundIds = new Set<string>((document?.objects ?? []).filter(isBackground).map((object: any) => object.id));
  const bounds = { x: 0, y: 0, width: 100, height: 100 };
  const assetLists: Record<string, any> = {};
  for (const key of ['emojiList', 'portraits', 'emojis']) {
    if (!Array.isArray(source[key])) continue;
    assetLists[key] = source[key].map((asset: any) => isBackground(asset) || backgroundIds.has(asset.cocoCompiledObjectId)
      ? { ...asset, url, x: 50, y: 50, scale: 1, rotation: 0, cocoCssBounds: { ...bounds, centerX: 50, centerY: 50 }, cocoCssFit: 'cover' }
      : asset);
  }
  const overrides = { ...system?.compiledObjectOverrides };
  for (const id of backgroundIds) {
    if (overrides[id]) {
      const { left, top, width, height, rotation, removed, ...rest } = overrides[id];
      overrides[id] = rest;
    }
  }
  return {
    ...source, ...assetLists,
    backgroundUrl: url, bgUrl: url, bgUploadUrl: choice.backgroundDataUrl || '',
    bgPosX: 50, bgPosY: 50, bgScale: 1, bgRotate: 0,
    ...(document ? { cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides,
      compiledDocument: { ...document, objects: document.objects.map((object: any) => backgroundIds.has(object.id)
        ? { ...object, kind: 'image', bounds, paintBounds: bounds,
          transform: { ...object.transform, rotate: 0, scaleX: 1, scaleY: 1, skewX: 0 },
          paint: { ...object.paint, backgroundImage: 'none', clipPath: 'none', maskImage: 'none' },
          image: { src: url, fit: 'cover', position: '50% 50%' } }
        : object) } } } : {}),
  };
}
import { linkedPaletteNativeSource } from './linkedPalette.ts';
