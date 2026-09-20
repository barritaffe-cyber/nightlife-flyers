/** Empty editor companions paint only after typing; they never enter the recipe form. */
export function withCompiledEditorText(composition: any): any[] {
  const objects = [...withLegacyDiscoLabel(composition), ...(composition?.editorTextObjects ?? [])];
  const doc = composition?.compiledDocument;
  if (!doc) return objects;
  const result = [...objects];
  for (const [field, sibling, panel, role, size] of [
    ['djLineupLabel', 'details2', 'details2', 'lineupLabel', 8],
    ['detailsLabel', 'details', 'details', 'detailsLabel', 8],
    ['venue', 'venueAddress', 'venue', 'venue', 14],
    ['venueAddress', 'venue', 'venue', 'address', 9],
  ] as const) {
    if (doc.id === 'baddies-n-bundles' && field.endsWith('Label')) continue;
    if (objects.some((o: any) => o.kind === 'text' && o.binding?.text === field)) continue;
    const body = objects.find((o: any) => o.kind === 'text' && o.binding?.text === sibling);
    if (!body?.bounds) continue;
    // Existing semantic headings belong to this block even when their storage
    // field has an old name. Do not overlay a duplicate heading.
    if (field.endsWith('Label') && (body.binding?.labelObjectId || objects.some((o: any) =>
      o.kind === 'text' && o.binding?.panel === panel && o.binding?.uiField === field))) continue;
    const height = size * 1.4 / (doc.canvas?.height === 1920 ? 960 : 540) * 100;
    const below = field === 'venueAddress';
    const position = composition.compiledObjectOverrides?.[body.id] ?? {};
    const bodyTop = position.top ?? body.bounds.y;
    const bounds = { ...body.bounds, x: position.left ?? body.bounds.x,
      y: Math.max(0, Math.min(100 - height,
      below ? bodyTop + body.bounds.height + .6 : bodyTop - height - .6)), height };
    const id = `editor-${field}`;
    result.push({ ...body, id, sourceObjectId: id, semanticRole: role,
      text: '', textRuns: [], editable: true, editorCompanion: true, bounds, paintBounds: bounds,
      typography: { ...body.typography, fontSizePx: size, lineHeight: 1.4, letterSpacingEm: 0 },
      paint: { ...body.paint, textShadow: 'none' },
      binding: { text: field, size: `${id}Size`, color: `${id}Color`,
        family: `${id}Family`, panel,
        moveTarget: panel, uiField: field, mappedControls: true,
        initial: { text: '', size, color: body.paint?.color } },
    });
  }
  return result;
}

/** Older Disco saves expose a details label field without a corresponding object. */
function withLegacyDiscoLabel(composition: any): any[] {
  const doc = composition?.compiledDocument;
  const objects = doc?.objects ?? [];
  if (doc?.id !== 'disco' || objects.some((o: any) => o.binding?.text === 'detailsLabel')) return objects;
  const body = objects.find((o: any) => o.id === 'genres');
  if (!body) return objects;
  const position = composition.compiledObjectOverrides?.[body.id] ?? {};
  const height = 16 / (doc.canvas?.height ?? 1080) * 100;
  const bounds = { ...body.bounds, x: position.left ?? body.bounds.x,
    y: Math.max(0, (position.top ?? body.bounds.y) - height - .6), height };
  return [...objects, { ...body, id: 'detailsLabel', sourceObjectId: 'detailsLabel',
    semanticRole: 'detailsLabel', text: '', textRuns: [], bounds, paintBounds: bounds,
    typography: { ...body.typography, fontSizePx: 8, lineHeight: 1.4 },
    binding: { text: 'detailsLabel', size: 'detailsLabelSize', color: 'detailsLabelColor',
      family: 'detailsFamily', panel: 'details', moveTarget: 'details', uiField: 'detailsLabel',
      mappedControls: true, initial: { text: '', size: 8, color: body.paint?.color } },
  }];
}

/** Route semantic CSS text to the existing editor panels, including older saves. */
export function withCompiledTextSelection(object: any): any {
  if (object.kind !== 'text' || !object.editable) return object;
  const binding = object.binding ?? {};
  const role = String(object.semanticRole || binding.semanticRole || '');
  let panel: string | undefined;
  let field: string | undefined;
  if (['day', 'month', 'weekday'].includes(role)) { panel = 'date'; field = 'date'; }
  if (['meridiem', 'timeConnector', 'endTime'].includes(role)) { panel = 'date'; field = 'time'; }
  if (role === 'presents') { panel = 'presenter'; field = 'presenter'; }
  if (/^offer.*Price$/.test(role)) { panel = 'price'; field = 'price'; }
  if (/^offer.*Copy$/.test(role)) { panel = 'price'; field = 'priceLabel'; }
  if (role === 'address') { panel = 'venue'; field = 'venueAddress'; }
  if (!panel || !field) return object;
  return {
    ...object,
    binding: { ...binding, panel, moveTarget: field === 'time' ? 'time' : panel,
      mappedControls: true, uiField: field, genericControls: undefined },
  };
}
