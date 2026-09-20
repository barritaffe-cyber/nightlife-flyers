import { withCompiledTextSelection, withCompiledEditorText } from './compiledTextSelection.ts';

const canonicalField = (field: string) => field === 'head2' ? 'head2line' : field;

/** Manual title sizing replaces form fitting in the same persisted paint owners. */
export function cocoCompiledTitleSizeEdit(variant: Record<string, any>, role: 'headline' | 'headline2', size: number): Record<string, any> {
  const system = variant.cocoCompositionSystem;
  if (!system?.compiledDocument) return {};
  const field = role === 'headline' ? 'headManualPx' : 'head2SizePx';
  const overrides = { ...system.compiledObjectOverrides };
  for (const object of withCompiledEditorText(system)) {
    if (object.kind !== 'text' || object.binding?.size !== field) continue;
    overrides[object.id] = { ...overrides[object.id], size, cocoFormAutoSize: undefined, cocoFormBaseSize: undefined };
  }
  return { cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides } };
}

/** The selected fragment owns its control; other fields in the panel keep theirs. */
export function cocoCompiledTextControl(variant: Record<string, any>, field: string, selectedId?: string | null) {
  const objects = withCompiledEditorText(variant.cocoCompositionSystem).map(withCompiledTextSelection)
    .filter((o: any) => o.kind === 'text');
  const key = canonicalField(field);
  const selected = objects.find((o: any) => o.id === selectedId &&
    [o.binding?.text, o.binding?.uiField].some(f => f && canonicalField(f) === key));
  return selected ?? objects.find((o: any) => o.binding?.text && canonicalField(o.binding.text) === key);
}

/** User edits must update the override that both canvas and saved previews read. */
export function cocoCompiledTextEdit(variant: Record<string, any>, object: any, text: string): Record<string, any> {
  const system = variant.cocoCompositionSystem;
  if (!system?.compiledDocument || object?.kind !== 'text') return {};
  const overrides = { ...system.compiledObjectOverrides };
  const field = object.binding?.text;
  // A headline's decorative copies share its binding. Independent fragments
  // merely share a sidebar panel and must never receive each other's wording.
  const isTitle = ['headline', 'headline2'].includes(object.semanticRole);
  const owners = withCompiledEditorText(system).filter((o: any) => o.kind === 'text' &&
    (o.id === object.id || (isTitle && field && o.binding?.text === field &&
      (o.semanticRole === object.semanticRole || (!o.semanticRole && o.editable === false)))));
  if (!owners.some((o: any) => o.id === object.id)) owners.push(object);
  for (const owner of owners) overrides[owner.id] = { ...overrides[owner.id], text, cocoEditorText: true };
  return {
    ...(field ? { [field]: text } : {}),
    ...(field === 'head2line' || field === 'head2' ? { head2: text, head2line: text } : {}),
    cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides },
  };
}
