import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';

type Value = Record<string, any>;
export type CocoContentBox = { x: number; y: number; width: number; height: number };
type Reference = { box: CocoContentBox; size: number; lines: number };
type Placement = { left?: number; top?: number; autoLeft: number; autoTop: number; asset?: string; x?: number; y?: number };
type Layout = { baseline: Record<string, Reference>; positions: Record<string, Placement>; pinned: string[] };
type Node = { id: string; box: CocoContentBox; base?: CocoContentBox; members: Value[]; pinned: boolean; changed: boolean; rail?: boolean };
const PREFIX = 'coco-form-social-';
const close = (a: number, b: number) => Math.abs(a - b) < .02;
export const cocoContentIntersects = (a: CocoContentBox, b: CocoContentBox, gap = 0) =>
  a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
const union = (boxes: CocoContentBox[]): CocoContentBox => {
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) - x, height: Math.max(...boxes.map(b => b.y + b.height)) - y };
};
const objects = (v: Value): Value[] => [...(v.cocoCompositionSystem?.compiledDocument?.objects ?? []), ...(v.cocoCompositionSystem?.editorTextObjects ?? [])];
const assets = (v: Value): Value[] => v.portraits ?? v.emojiList ?? [];
const assetFor = (v: Value, o: Value) => o.kind !== 'text' ? assets(v).find(a => a.cocoCompiledObjectId === o.id) : undefined;

/** Saved geometry plus explicit text growth; full scenes remain composition layers. */
export function cocoContentBox(v: Value, o: Value, reference?: Reference): CocoContentBox {
  const overrides = v.cocoCompositionSystem?.compiledObjectOverrides ?? {}, edit = overrides[o.id] ?? {};
  const a = assetFor(v, o), scale = a?.scale ?? 1;
  const width = o.bounds.width * scale;
  let height = o.bounds.height * scale;
  if (o.kind === 'text' && reference) {
    const fields = compiledPreviewFields(v);
    const size = Number(compiledObjectValue(overrides, fields, o, 'size', o.typography?.fontSizePx ?? 16));
    const lines = String(compiledObjectValue(overrides, fields, o, 'text', o.text ?? '')).split('\n').length;
    height = reference.box.height * size / Math.max(1, reference.size) * lines / Math.max(1, reference.lines);
  }
  return { x: a ? a.x - width / 2 : edit.left ?? o.bounds.x, y: a ? a.y - height / 2 : edit.top ?? o.bounds.y, width, height };
}

/** Undo only our own offsets before recalculating. A user's drag becomes a pin. */
export function prepareCocoContentLayout(source: Value): Value {
  const system = source.cocoCompositionSystem;
  if (!system?.compiledDocument) return source;
  const saved: Layout = system.cocoContentLayout ?? { baseline: {}, positions: {}, pinned: [] };
  const overrides = { ...system.compiledObjectOverrides }, pinned = new Set(saved.pinned);
  let nextAssets = assets(source);
  for (const [id, p] of Object.entries(saved.positions)) {
    const edit = overrides[id] ?? {};
    if (p.asset) {
      const a = nextAssets.find(a => a.id === p.asset);
      if (!a) continue;
      if (a.locked || !close(a.x, p.autoLeft) || !close(a.y, p.autoTop)) { pinned.add(id); continue; }
      nextAssets = nextAssets.map(a => a.id === p.asset ? { ...a, x: p.x, y: p.y,
        ...(a.cocoSocialAutoPosition ? { cocoSocialAutoPosition: { x: p.x, y: p.y } } : {}) } : a);
    } else {
      if (edit.locked || !close(edit.left, p.autoLeft) || !close(edit.top, p.autoTop)) { pinned.add(id); continue; }
      const next = { ...edit };
      if (p.left === undefined) delete next.left; else next.left = p.left;
      if (p.top === undefined) delete next.top; else next.top = p.top;
      overrides[id] = next;
    }
  }
  const v = { ...source, ...(nextAssets.length ? { portraits: nextAssets, emojiList: nextAssets } : {}), cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides } };
  const baseline = { ...saved.baseline }, fields = compiledPreviewFields(v);
  for (const o of objects(v)) {
    if (!o.bounds || o.id.startsWith(PREFIX) || baseline[o.id]) continue;
    baseline[o.id] = { box: cocoContentBox(v, o), size: Number(compiledObjectValue(overrides, fields, o, 'size', o.typography?.fontSizePx ?? 16)),
      lines: String(compiledObjectValue(overrides, fields, o, 'text', o.text ?? '')).split('\n').length };
  }
  v.cocoCompositionSystem.cocoContentLayout = { baseline, positions: {}, pinned: [...pinned] };
  return v;
}

/** Reflow new/expanded foreground content, preserving authored overlaps and pins.
 * The same saved offsets feed the live preview, canvas, and both export formats.
 */
export function withCocoContentLayout(input: Value): Value {
  if (!input.cocoCompositionSystem?.compiledDocument) return input;
  const v = prepareCocoContentLayout(input), system = v.cocoCompositionSystem;
  const layout: Layout = system.cocoContentLayout, overrides = { ...system.compiledObjectOverrides };
  const fields = compiledPreviewFields(v), ratio = system.compiledDocument.canvas.width / system.compiledDocument.canvas.height;
  const storyFooter = ratio < 1 && v.cocoFormSocialAlignment === 'center';
  const gap = .7 * ratio, nodes: Node[] = [];
  for (const o of objects(v)) {
    const edit = overrides[o.id] ?? {}, a = assetFor(v, o), ref = layout.baseline[o.id];
    if (edit.removed || edit.opacity === 0 || a?.opacity === 0 || o.paint?.opacity === 0) continue;
    if (o.kind === 'text' && !String(compiledObjectValue(overrides, fields, o, 'text', o.text ?? '')).trim()) continue;
    const box = cocoContentBox(v, o, ref);
    // Photos, background washes, and headline textures intentionally underlay copy.
    if (o.kind !== 'text' && (box.width * box.height > 1800 || /background|subject|portrait/i.test(`${o.id} ${o.semanticRole ?? ''}`))) continue;
    const manual = ref && (!close(box.x, ref.box.x) || !close(box.y, ref.box.y));
    const social = o.id.startsWith(PREFIX) || (Boolean(v.cocoEventBrief?.socials) && ['social', 'handle'].includes(o.semanticRole));
    const pinned = Boolean(a?.locked || edit.locked || o.locked || layout.pinned.includes(o.id) || (!social && manual));
    nodes.push({ id: o.id, box, base: ref?.box, members: [o], pinned,
      changed: social || Boolean(ref && (box.height > ref.box.height + .1 || box.width > ref.box.width + .1)) });
  }
  // Icons/handle travel as a single row, never independently scatter around copy.
  const hasIcons = nodes.some(n => n.id.startsWith(PREFIX) && n.members[0].kind !== 'text');
  const rail = hasIcons || storyFooter ? nodes.filter(n => n.id.startsWith(PREFIX) || (Boolean(v.cocoEventBrief?.socials) && ['social', 'handle'].includes(n.members[0].semanticRole))) : [];
  if (rail.length) {
    const ids = new Set(rail.map(n => n.id));
    const moved = rail.some(n => { const a = assetFor(v, n.members[0]); return a && (!a.cocoSocialAutoPosition || !close(a.x, a.cocoSocialAutoPosition.x) || !close(a.y, a.cocoSocialAutoPosition.y)); });
    for (let i = nodes.length - 1; i >= 0; i--) if (ids.has(nodes[i].id)) nodes.splice(i, 1);
    nodes.push({ id: 'social-row', box: union(rail.map(n => n.box)), members: rail.flatMap(n => n.members), pinned: moved || rail.some(n => n.pinned), changed: true, rail: true });
  }
  const start = new Map(nodes.map(n => [n.id, { ...n.box }]));
  const intentional = (a: Node, b: Node) => Boolean(a.base && b.base && cocoContentIntersects(a.base, b.base));
  const collides = (a: Node, b: Node) => a !== b && !intentional(a, b) && cocoContentIntersects(a.box, b.box, Math.max(0, gap - .005));
  const within = (b: CocoContentBox) => b.x >= 1 && b.y >= .5 && b.x + b.width <= 99 && b.y + b.height <= 99.5;
  // Transactional propagation: if a chain hits a pinned object or an edge,
  // roll back the whole attempt and try another direction/nearby vacant band.
  const push = (n: Node, axis: 'x' | 'y', delta: number, trail: Set<string>): boolean => {
    if (n.pinned || trail.has(n.id)) return false;
    n.box = { ...n.box, [axis]: n.box[axis] + delta };
    if (!within(n.box) || Math.abs(n.box.y - start.get(n.id)!.y) > 12) return false;
    const next = new Set(trail).add(n.id);
    for (const other of nodes.filter(o => collides(n, o))) {
      if (!collides(n, other)) continue;
      const amount = delta > 0 ? n.box[axis] + n.box[axis === 'x' ? 'width' : 'height'] + gap - other.box[axis]
        : n.box[axis] - gap - other.box[axis] - other.box[axis === 'x' ? 'width' : 'height'];
      if (!push(other, axis, amount, next)) return false;
    }
    return true;
  };
  for (const n of nodes.filter(n => n.changed && !n.pinned)) {
    if (!nodes.some(other => collides(n, other))) continue;
    const align = v.cocoFormSocialAlignment ?? 'center';
    const directions: ['x' | 'y', number][] = n.rail && storyFooter ? [['y', -1], ['y', 1]]
      : n.rail && align !== 'center' ? [['x', align === 'right' ? -1 : 1], ['y', -1], ['y', 1]] : [['y', 1], ['y', -1]];
    for (const [axis, direction] of directions) {
      const snapshot = nodes.map(o => ({ ...o.box }));
      let ok = true;
      for (const other of nodes.filter(o => collides(n, o))) {
        if (!collides(n, other)) continue;
        const size = axis === 'x' ? 'width' : 'height';
        const delta = direction > 0 ? n.box[axis] + n.box[size] + gap - other.box[axis] : n.box[axis] - gap - other.box[axis] - other.box[size];
        if (!push(other, axis, delta, new Set([n.id]))) { ok = false; break; }
      }
      if (ok) break;
      nodes.forEach((o, i) => { o.box = snapshot[i]; });
    }
    if (!nodes.some(other => collides(n, other))) continue;
    const candidateYs = nodes.filter(o => o !== n).flatMap(o => [o.box.y - n.box.height - gap, o.box.y + o.box.height + gap]);
    candidateYs.sort((a, b) => Math.abs(a - n.box.y) - Math.abs(b - n.box.y));
    for (const y of candidateYs) {
      const box = { ...n.box, y };
      if (Math.abs(y - start.get(n.id)!.y) > 12 || !within(box)) continue;
      if (nodes.every(other => other === n || !cocoContentIntersects(box, other.box, gap / 2))) { n.box = box; break; }
    }
  }
  let nextAssets = assets(v);
  const positions: Layout['positions'] = {};
  for (const n of nodes) {
    const original = start.get(n.id)!, dx = n.box.x - original.x, dy = n.box.y - original.y;
    if (Math.abs(dx) < .01 && Math.abs(dy) < .01) continue;
    for (const o of n.members) {
      const edit = overrides[o.id] ?? {}, a = assetFor(v, o);
      if (a) {
        positions[o.id] = { asset: a.id, x: a.x, y: a.y, autoLeft: a.x + dx, autoTop: a.y + dy };
        nextAssets = nextAssets.map(item => item.id === a.id ? { ...item, x: a.x + dx, y: a.y + dy,
          ...(item.cocoSocialAutoPosition ? { cocoSocialAutoPosition: { x: a.x + dx, y: a.y + dy } } : {}) } : item);
      } else {
        const left = (edit.left ?? o.bounds.x) + dx, top = (edit.top ?? o.bounds.y) + dy;
        positions[o.id] = { left: edit.left, top: edit.top, autoLeft: left, autoTop: top };
        overrides[o.id] = { ...edit, left, top };
      }
    }
  }
  return { ...v, ...(nextAssets.length ? { portraits: nextAssets, emojiList: nextAssets } : {}),
    cocoCompositionSystem: { ...system, compiledObjectOverrides: overrides, cocoContentLayout: { ...layout, positions } } };
}
