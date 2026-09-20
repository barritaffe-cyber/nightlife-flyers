import { withCompiledEditorText } from './compiledTextSelection.ts';

export type CocoAddedTextAppearance = {
  tracking: number; bold: boolean; italic: boolean; uppercase: boolean;
  opacity: number; shadowEnabled: boolean; shadowStrength: number;
};

export function cocoAddedTextAppearance(variant: Record<string, any>, id: string): CocoAddedTextAppearance {
  const system = variant.cocoCompositionSystem;
  const object = system?.editorTextObjects?.find((o: any) => o.id === id);
  return {
    tracking: system?.compiledObjectOverrides?.[id]?.tracking ?? object?.typography?.letterSpacingEm ?? 0,
    bold: Number(object?.typography?.fontWeight) >= 700 || object?.typography?.fontWeight === 'bold',
    italic: object?.typography?.fontStyle === 'italic',
    uppercase: object?.typography?.textTransform === 'uppercase',
    opacity: object?.paint?.opacity ?? 1,
    shadowEnabled: object?.editorAppearance?.shadowEnabled ?? Boolean(object?.paint?.textShadow && object.paint.textShadow !== 'none'),
    shadowStrength: object?.editorAppearance?.shadowStrength ?? 1,
  };
}

/** Added-object appearance belongs to that object in every renderer and export. */
export function cocoStyleAddedText(variant: Record<string, any>, id: string, patch: Partial<CocoAddedTextAppearance>): Record<string, any> {
  const system = variant.cocoCompositionSystem;
  if (!system?.editorTextObjects?.some((o: any) => o.id === id && o.editorAdded)) return variant;
  const appearance = { ...cocoAddedTextAppearance(variant, id), ...patch };
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const shadowStrength = clamp(appearance.shadowStrength, 0, 8);
  return { ...variant, cocoCompositionSystem: { ...system,
    ...(patch.tracking === undefined ? {} : { compiledObjectOverrides: { ...system.compiledObjectOverrides,
      [id]: { ...system.compiledObjectOverrides?.[id], tracking: clamp(patch.tracking, -.1, .5) },
    } }),
    editorTextObjects: system.editorTextObjects.map((o: any) => o.id !== id ? o : { ...o,
      typography: { ...o.typography,
        ...(patch.bold === undefined ? {} : { fontWeight: patch.bold ? 700 : 400 }),
        ...(patch.italic === undefined ? {} : { fontStyle: patch.italic ? 'italic' : 'normal' }),
        ...(patch.uppercase === undefined ? {} : { textTransform: patch.uppercase ? 'uppercase' : 'none' }),
      },
      paint: { ...o.paint,
        ...(patch.opacity === undefined ? {} : { opacity: clamp(patch.opacity, 0, 1) }),
        ...(patch.shadowEnabled === undefined && patch.shadowStrength === undefined ? {} : {
          textShadow: appearance.shadowEnabled && shadowStrength > 0 ? `0 ${shadowStrength}px ${shadowStrength * 4}px rgba(0,0,0,.65)` : 'none',
        }),
      },
      ...(patch.shadowStrength === undefined && patch.shadowEnabled === undefined ? {} : { editorAppearance: { ...o.editorAppearance, shadowStrength, shadowEnabled: appearance.shadowEnabled } }),
    }),
  } };
}

/** User text is stored outside the authored recipe so form updates never repurpose it. */
export function cocoAddEditorText(variant: Record<string, any>, id: string): Record<string, any> {
  const system = variant.cocoCompositionSystem;
  if (!system?.compiledDocument) return variant;
  const objects = withCompiledEditorText(system);
  if (objects.some(object => object.id === id)) return variant;
  const previous = system.editorTextObjects ?? [];
  const y = 44 + (previous.length % 5) * 4;
  const height = variant.format === 'story' || system.compiledDocument.format === 'story' ? 6 : 10;
  const bounds = { x: 20, y, width: 60, height };
  const zIndex = Math.max(0, ...objects.map(object => Number(object.stacking?.effectiveZIndex ?? object.stacking?.zIndex ?? 0))) + 1;
  const object = {
    id, sourceObjectId: id, assetRole: id, kind: 'text', semanticRole: 'customText', editable: true,
    editorAdded: true, text: '', textRuns: [], bounds, paintBounds: { ...bounds },
    stacking: { zIndex, effectiveZIndex: zIndex },
    typography: { fontFamily: 'Arial', fontSizePx: 24, fontWeight: 500, fontStyle: 'normal', align: 'center', lineHeight: 1.2, letterSpacingEm: 0, textTransform: 'none' },
    paint: { color: '#FFFFFF', opacity: 1, backgroundImage: 'none', textShadow: '0 1px 4px rgba(0,0,0,.35)' },
    transform: { rotate: 0, scaleX: 1, scaleY: 1 },
    binding: { panel: 'details', moveTarget: 'details', mappedControls: true, label: 'More details' },
  };
  return { ...variant, cocoCompositionSystem: { ...system, editorTextObjects: [...previous, object] } };
}
