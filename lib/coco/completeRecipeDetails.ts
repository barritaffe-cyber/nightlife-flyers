import { COCO_EVENT_FIELD_LABELS, type CocoEventBriefInput } from './eventBriefFields.ts';
import { cocoSocialHandleLayoutPatch } from './socialRecipeAssets.ts';
import { cocoQrCode } from './qrCode.ts';

type Value = Record<string, any>;
const PREFIX = 'coco-form-detail-';
const QR = 'coco-form-qr';
const owned = (id: string) => id.startsWith(PREFIX) || id.startsWith(QR);
const labels: Record<string, string> = { ...COCO_EVENT_FIELD_LABELS, presenterName: 'Presented by', venueName: 'Venue', address: 'Address', djs: 'Music by', hosts: 'Hosted by', musicPolicy: 'Music', entryFee: 'Entry', ageRequirement: 'Age', rsvpContact: 'RSVP', bookingContact: 'Tables', mainPromotion: 'Special', experienceFeatures: 'Experience' };
const intersects = (a: Value, b: Value) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Restore automatic title reflow before rebinding; preserve explicit edits. */
export function restoreCocoDetailLayout(source: Value): Value {
  const system = source.cocoCompositionSystem;
  if (!system?.cocoDetailsTitleLayout) return source;
  const overrides = { ...system.compiledObjectOverrides };
  const originals = system.cocoDetailsTitleLayout;
  const objects = system.compiledDocument.objects.map((o: Value) => {
    const saved = originals[o.id], edit = overrides[o.id];
    if (!saved) return o;
    if (['left', 'top', 'size'].some(k => edit?.[k] !== saved.auto[k])) return { ...o, cocoDetailsManuallyPlaced: true };
    overrides[o.id] = saved.override;
    return { ...o, bounds: saved.bounds, paintBounds: saved.paintBounds };
  });
  return { ...source, cocoCompositionSystem: { ...system, compiledDocument: { ...system.compiledDocument, objects }, compiledObjectOverrides: overrides, cocoDetailsTitleLayout: undefined } };
}

/** Wrap without discarding characters, including a long URL with no spaces. */
export function wrapCocoDetail(text: string, columns: number): string {
  return text.split('\n').map(line => {
    const lines: string[] = [];
    let current = '';
    for (const word of line.split(/\s+/)) {
      if (current && current.length + word.length + 1 > columns) { lines.push(current); current = ''; }
      let rest = word;
      while (rest.length > columns) { lines.push(rest.slice(0, columns)); rest = rest.slice(columns); }
      current += (current ? ' ' : '') + rest;
    }
    if (current) lines.push(current);
    return lines.join('\n');
  }).join('\n');
}

/** Keep authored text geometry. Only QR utilities may add new canvas owners. */
export function withCocoCompleteDetails(source: Value, brief: CocoEventBriefInput): Value {
  const system = source.cocoCompositionSystem, doc = system?.compiledDocument, report = source.cocoFormMappingReport;
  if (!doc || !report) return source;
  const ratio = doc.canvas.width / doc.canvas.height;
  const objects: Value[] = doc.objects.filter((o: Value) => !owned(o.id));
  const overrides = { ...system.compiledObjectOverrides };
  const oldAssets: Value[] = source.emojiList ?? source.portraits ?? [];
  const assets = oldAssets.filter(a => !owned(String(a.id)));
  const qr = cocoQrCode(brief);
  const qrReady = qr && !('error' in qr) ? qr : null;
  const placed = new Set<string>();
  if (qrReady) {
    const authored = objects.find(o => o.kind !== 'text' && /qr/i.test(`${o.id} ${o.assetRole ?? ''}`));
    const width = authored?.bounds.width ?? Math.max(14, (qrReady.modules + 8) * .36);
    const height = width * ratio;
    const occupied = objects.filter(o => o.kind === 'text' && !overrides[o.id]?.removed && (overrides[o.id]?.text ?? o.text)).map(o => ({
      ...o.bounds, x: overrides[o.id]?.left ?? o.bounds.x, y: overrides[o.id]?.top ?? o.bounds.y,
    }));
    // Use the template's QR slot first; otherwise only use vacant footer space.
    // Never move the headline or collect the event copy into a generic panel.
    const candidates = authored ? [{ ...authored.bounds, width, height }] : [82, 4, 43].map(x => ({ x: Math.min(x, 96 - width), y: 96 - height - 5 * ratio, width, height }));
    const bounds = candidates.find(b => b.x >= 0 && b.x + b.width <= 100 && b.y >= 0 && b.y + b.height + 5 * ratio <= 100 && !occupied.some(o => intersects({ ...b, height: b.height + 5 * ratio }, o)));
    if (bounds) {
      const old = oldAssets.find(a => a.id === QR);
      const auto = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const moved = old?.cocoDetailsAutoPosition && (Math.abs(old.x - old.cocoDetailsAutoPosition.x) > .01 || Math.abs(old.y - old.cocoDetailsAutoPosition.y) > .01);
      assets.push({ id: QR, kind: 'sticker', isSticker: true, scale: 1, opacity: 1, rotation: 0, layerOffset: 301, ...old, ...(moved ? {} : auto), url: qrReady.url, label: 'QR code', cocoCompiledObjectId: QR, cocoAssetRole: QR, cocoDetailsAutoPosition: auto, cocoQrDestination: qrReady.destination });
      objects.push({ id: QR, kind: 'image', semanticRole: 'qr', assetRole: QR, editable: true, bounds, paintBounds: bounds, paint: { opacity: 1 }, stacking: { order: 301, zIndex: 301 }, image: { src: qrReady.url, fit: 'fill' }, binding: { editable: true } });
      const caption = objects.find(o => o.kind === 'text' && /qr/i.test(o.id));
      const labelId = `${QR}-label`;
      const labelBounds = { x: bounds.x, y: bounds.y + bounds.height + ratio, width, height: 4 * ratio };
      const typography = { ...caption?.typography, fontFamily: caption?.typography?.fontFamily ?? 'Bebas Neue', fontSizePx: 9, lineHeight: 1.1, letterSpacingEm: 0, align: 'center' };
      const text = wrapCocoDetail(String(brief.qrLabel || 'Scan for details'), 24);
      objects.push({ id: labelId, kind: 'text', semanticRole: 'footerDetails', assetRole: null, editable: true, text, bounds: labelBounds, paintBounds: labelBounds, typography,
        paint: { color: caption?.paint?.color ?? '#fff8ee', opacity: 1 }, stacking: { order: 301, zIndex: 301 },
        binding: { text: labelId, enabled: `${labelId}Enabled`, panel: 'details', moveTarget: 'details', editable: true, initial: { x: labelBounds.x, y: labelBounds.y, size: 9, family: typography.fontFamily, color: caption?.paint?.color ?? '#fff8ee', align: 'center' } } });
      overrides[labelId] = { ...overrides[labelId], text, cocoFormFields: ['qrLabel'] };
      placed.add('qrDestination'); placed.add('qrLabel');
    }
  }
  const ids = new Set(objects.map(o => o.id));
  for (const id of Object.keys(overrides)) if (owned(id) && !ids.has(id)) delete overrides[id];
  const unplacedFields = report.unplacedFields.filter((key: string) => !placed.has(key));
  const nextReport = { ...report, mappedFields: [...new Set([...report.mappedFields, ...placed])], unplacedFields,
    unplacedLabels: unplacedFields.map((k: string) => labels[k] ?? k), layoutError: undefined, qrError: qr && 'error' in qr ? qr.error : undefined };
  const result = { ...source, portraits: assets, emojiList: assets, cocoDetailsPanelBox: null,
    cocoFormMappingReport: nextReport, cocoCompositionSystem: { ...system, compiledDocument: { ...doc, objects }, compiledObjectOverrides: overrides } };
  return { ...result, ...cocoSocialHandleLayoutPatch(result, assets) };
}
