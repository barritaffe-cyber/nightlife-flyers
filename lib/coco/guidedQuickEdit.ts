import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
import { cocoQuickTextSizeOwners, cocoQuickTextSizePatch } from './quickTextSizes.ts';
import { cocoRecipeFormCapabilities } from './formRecipeMapping.ts';
import { isPngGlyphFamily } from '../pngGlyphCollections.ts';

type Variant = Record<string, any>;
export type CocoGuideSection = 'headline' | 'details' | 'socials' | 'photos' | 'finish';
export type CocoFinishIssue = { id: string; format: 'square' | 'story'; field: string; objectId?: string; message: string; kind: 'date' | 'bounds' };
export function cocoQuickColorControl(v: Variant, id: string) {
  const s = v.cocoCompositionSystem, o = s?.compiledDocument?.objects.find((o: any) => o.id === id);
  if (!o) return null;
  const value = (key: string, fallback: any) => compiledObjectValue(s.compiledObjectOverrides ?? {}, compiledPreviewFields(v), o, key, fallback);
  const material = isPngGlyphFamily(value('family', o.typography?.fontFamily)) || (o.paint?.backgroundImage && o.paint.backgroundImage !== 'none');
  const rawColor = String(value('color', o.paint?.color ?? '#ffffff'));
  const rgb = rawColor.match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);
  const color = rgb ? '#' + rgb.slice(1, 4).map(n => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('') : rawColor;
  return { color, locked: Boolean(material) };
}

/** Same explicit size/color owners as the editor; retain textures and other paint. */
export function cocoGuidedStyle(v: Variant, id: string, property: 'size' | 'color', value: number | string): Variant {
  const s = v.cocoCompositionSystem, o = s?.compiledDocument?.objects.find((o: any) => o.id === id);
  if (!o || (property === 'color' && cocoQuickColorControl(v, id)?.locked)) return v;
  if (property === 'size') {
    const size = Math.max(1, Math.min(300, Number(value)));
    if (!Number.isFinite(size)) return v;
    const native = o.binding?.size === 'headManualPx' ? { headSizeAuto: false, headManualPx: size, headMaxPx: size, headSize: size, headlineSize: size }
      : o.binding?.size === 'head2SizePx' ? { head2SizePx: size, head2Size: size } : {};
    return { ...v, ...native, ...cocoQuickTextSizePatch(v, id, size) };
  }
  if (!/^#[0-9a-f]{6}$/i.test(String(value))) return v;
  const overrides = { ...s.compiledObjectOverrides };
  for (const owner of s.compiledDocument.objects) {
    if (owner.id === id || (owner.kind === 'text' && owner.editable === false && o.binding?.text && owner.binding?.text === o.binding.text)) {
      overrides[owner.id] = { ...overrides[owner.id], color: value };
    }
  }
  return { ...v, cocoCompositionSystem: { ...s, compiledObjectOverrides: overrides } };
}

export function cocoGuidedField(v: Variant, id: string, capabilities: ReturnType<typeof cocoRecipeFormCapabilities>): string | undefined {
  if (cocoQuickTextSizeOwners(v, 'eventName').some((o: { id: string }) => o.id === id)) return 'eventName';
  return Object.entries(capabilities.bindings).find(([, binding]) => binding.targets[v.format as 'square' | 'story']?.includes(id))?.[0];
}

/** Revert only this action's changed leaves. Later wording/photo edits survive. */
export function cocoGuidedUndo(current: any, before: any, after: any): any {
  if (before === after) return current;
  // Reflow can move asset rows. Later wording edits clone those arrays, so
  // reconcile surviving IDs/property changes while keeping later user edits.
  const keyed = (list: any) => Array.isArray(list) && list.every(item => item && typeof item === 'object' && typeof item.id === 'string') && new Set(list.map(item => item.id)).size === list.length;
  if (keyed(current) && keyed(before) && keyed(after)) {
    const old = new Map(before.map((item: any) => [item.id, item])), applied = new Map(after.map((item: any) => [item.id, item]));
    return current.map((item: any) => old.has(item.id) && applied.has(item.id) ? cocoGuidedUndo(item, old.get(item.id), applied.get(item.id)) : item);
  }
  const plain = (x: any) => x && typeof x === 'object' && !Array.isArray(x);
  if (plain(before ?? {}) && plain(after ?? {})) {
    const next = { ...(current ?? {}) };
    for (const key of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
      if (before?.[key] === after?.[key]) continue;
      const value = cocoGuidedUndo(current?.[key], before?.[key], after?.[key]);
      if (value === undefined) delete next[key]; else next[key] = value;
    }
    return next;
  }
  return current === after ? before : current;
}

export function cocoQuickFinishIssues(session: Record<string, any>): CocoFinishIssue[] {
  const recipe = String(session.square?.cocoVisualRecipeId ?? session.story?.cocoVisualRecipeId ?? '');
  const capabilities = cocoRecipeFormCapabilities(recipe, session);
  const issues: CocoFinishIssue[] = [];
  for (const format of ['square', 'story'] as const) {
    const v = session[format]; if (!v) continue;
    for (const [field, binding] of Object.entries(capabilities.bindings)) {
      if (binding.kind === 'date' && binding.targets[format]?.length && !binding.targets[format]?.some(id => {
        const system = v.cocoCompositionSystem, object = system?.compiledDocument?.objects.find((o: any) => o.id === id);
        return object && !system.compiledObjectOverrides?.[id]?.removed && String(compiledObjectValue(system.compiledObjectOverrides ?? {}, compiledPreviewFields(v), object, 'text', object.text ?? '')).trim();
      }))
        issues.push({ id: `${format}:date:${field}`, format, field, kind: 'date', message: 'The date is blank.' });
    }
    const s = v.cocoCompositionSystem;
    for (const o of s?.compiledDocument?.objects ?? []) {
      const edit = s.compiledObjectOverrides?.[o.id] ?? {};
      if (o.kind !== 'text' || o.editable === false || edit.removed || !String(compiledObjectValue(s.compiledObjectOverrides ?? {}, compiledPreviewFields(v), o, 'text', o.text ?? '')).trim()) continue;
      const field = cocoGuidedField({ ...v, format }, o.id, capabilities); if (!field) continue;
      const x = edit.left ?? o.bounds.x, y = edit.top ?? o.bounds.y;
      if (x < -.1 || y < -.1 || x + o.bounds.width > 100.1 || y + o.bounds.height > 100.1)
        issues.push({ id: `${format}:bounds:${o.id}`, format, field, objectId: o.id, kind: 'bounds', message: `${field === 'eventName' ? 'Headline' : capabilities.bindings[field]?.label ?? 'Text'} extends outside the canvas.` });
    }
  }
  return issues;
}
