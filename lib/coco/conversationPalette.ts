import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
import { withCompiledEditorText } from './compiledTextSelection.ts';
import { isPngGlyphFamily } from '../pngGlyphCollections.ts';
import type { LinkedPalette } from './paletteBindings.ts';

export const COCO_TEXT_PALETTES = [
  { id: 'pearl', label: 'Pearl', background: '#91A5B2', backgroundSecondary: '#526875', headline: '#F1F3F5', accent: '#B7CADA', details: '#D7DEE5' },
  { id: 'champagne', label: 'Champagne', background: '#9A682F', backgroundSecondary: '#4F2E19', headline: '#F4D7A1', accent: '#DAB570', details: '#F4EBDC' },
  { id: 'ice', label: 'Ice', background: '#247D91', backgroundSecondary: '#193F65', headline: '#B6E9F2', accent: '#7EBBCC', details: '#E1F0F3' },
  { id: 'rose', label: 'Rose', background: '#99455F', backgroundSecondary: '#4F2338', headline: '#F0B9C8', accent: '#DC8EA6', details: '#F6E4EA' },
  { id: 'ink', label: 'Ink', background: '#263A4D', backgroundSecondary: '#4B2535', headline: '#17212C', accent: '#713349', details: '#242B33' },
  { id: 'cobalt', label: 'Cobalt', background: '#254F9B', backgroundSecondary: '#311F68', headline: '#182B51', accent: '#254F9B', details: '#24364A' },
] as const;

/** The conversation palette owns both image hues and compiled-object colors. */
export function cocoConversationLinkedPalette(id: string): LinkedPalette | null {
  const palette = COCO_TEXT_PALETTES.find(option => option.id === id);
  if (!palette) return null;
  return {
    bgFrom: palette.background,
    bgTo: palette.backgroundSecondary,
    secondary: palette.background,
    primary: palette.headline,
    accent: palette.accent,
    neutral: palette.details,
  };
}

/** Only recolor solid text. Authored textures, gradients and photographs remain intact. */
export function cocoTextPalette(variant: Record<string, any>, id: string): Record<string, any> {
  const palette = COCO_TEXT_PALETTES.find(option => option.id === id);
  const system = variant.cocoCompositionSystem;
  if (!palette || !system?.compiledDocument) return variant;
  const overrides = { ...system.compiledObjectOverrides };
  const fields = compiledPreviewFields(variant);
  for (const object of withCompiledEditorText(system)) {
    if (object.kind !== 'text' || overrides[object.id]?.removed) continue;
    const family = compiledObjectValue(overrides, fields, object, 'family', object.typography?.fontFamily);
    if (isPngGlyphFamily(family) || (object.paint?.backgroundImage && object.paint.backgroundImage !== 'none')) continue;
    const fill = String(compiledObjectValue(overrides, fields, object, 'color', object.paint?.color ?? ''));
    if (fill === 'transparent' || /rgba\([^)]*,\s*0(?:\.0+)?\s*\)/.test(fill)) continue;
    const role = object.semanticRole;
    const color = role === 'headline' ? palette.headline
      : ['headline2', 'presenter', 'day', 'date', 'month', 'price'].includes(role) ? palette.accent : palette.details;
    overrides[object.id] = { ...overrides[object.id], color };
  }
  return { ...variant, cocoTextPaletteId: id, cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides } };
}
