import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
import type { CocoRecipeFieldBinding } from './eventBriefFields.ts';
import { cocoHeadlineOwners } from './recipeCompatibility.ts';
import { prepareCocoContentLayout, withCocoContentLayout } from './contentAwareLayout.ts';

/** Resolve form fields to their actual visible text, including split dates/DJs. */
export function cocoQuickTextSizeOwners(variant: Record<string, any>, field: string, binding?: CocoRecipeFieldBinding) {
  const system = variant.cocoCompositionSystem;
  const overrides = system?.compiledObjectOverrides ?? {};
  const fields = compiledPreviewFields(variant);
  const ids = new Set(field === 'eventName'
    ? cocoHeadlineOwners(String(variant.cocoVisualRecipeId ?? ''), variant).map(o => o.id)
    : binding?.targets[variant.format as 'square' | 'story'] ?? []);
  return (system?.compiledDocument?.objects ?? []).filter((o: any) => o.kind === 'text' && o.editable !== false &&
    !overrides[o.id]?.removed && !overrides[o.id]?.cocoFormIsLabel &&
    (ids.has(o.id) || (!ids.size && field !== 'eventName' && overrides[o.id]?.cocoFormFields?.includes(field))) &&
    String(compiledObjectValue(overrides, fields, o, 'text', o.text ?? '')).trim()
  ).map((o: any) => ({
    id: String(o.id),
    text: String(compiledObjectValue(overrides, fields, o, 'text', o.text ?? '')).replace(/\s+/g, ' ').trim(),
    size: Number(compiledObjectValue(overrides, fields, o, 'size', o.typography?.fontSizePx ?? 16)),
    sizeField: o.binding?.size as string | undefined,
  }));
}

/** Store an explicit manual size, preserving unrelated objects and decorations. */
export function cocoQuickTextSizePatch(variant: Record<string, any>, id: string, value: number) {
  variant = prepareCocoContentLayout(variant);
  const system = variant.cocoCompositionSystem;
  const object = system?.compiledDocument?.objects?.find((o: any) => o.id === id && o.kind === 'text');
  if (!object || !Number.isFinite(value)) return {};
  const size = Math.max(1, Math.min(300, value));
  const overrides = { ...system.compiledObjectOverrides };
  for (const owner of system.compiledDocument.objects) {
    const copy = owner.kind === 'text' && owner.editable === false && object.binding?.text && owner.binding?.text === object.binding.text;
    if (owner.id === id || copy) overrides[owner.id] = { ...overrides[owner.id], size, cocoFormAutoSize: undefined, cocoFormBaseSize: undefined };
  }
  const next = withCocoContentLayout({ ...variant, cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides } });
  return { cocoCompositionSystem: next.cocoCompositionSystem, ...(next.portraits ? { portraits: next.portraits, emojiList: next.emojiList } : {}) };
}
