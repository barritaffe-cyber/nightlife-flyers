import { COCO_SOCIAL_PLATFORMS, type CocoEventBriefInput } from './eventBriefFields.ts';
import { COCO_SOCIAL_GRAPHICS } from './socialGraphics.ts';

const PREFIX = 'coco-form-social-';
const HANDLE = `${PREFIX}handle`;
const SCALE = 0.15;
type RecordValue = Record<string, any>;
type Box = { x: number; y: number; width: number; height: number };
/** Saved Library icons also define a form slot, even without a compiled strip. */
export function cocoNativeSocialSamples(source: RecordValue): RecordValue[] {
  const assets = source.portraits ?? source.emojiList ?? [];
  const savedIds = source.cocoFormSocialNativeAnchor?.ids;
  return assets.filter((asset: RecordValue) => !asset.cocoCompiledObjectId &&
    !String(asset.id).startsWith(PREFIX) &&
    (savedIds ? savedIds.includes(asset.id) : asset.isSocialIcon && COCO_SOCIAL_PLATFORMS.includes(asset.socialPlatform)));
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const isStory = (source: RecordValue) => {
  const doc = source.cocoCompositionSystem?.compiledDocument;
  return source.format === 'story' || doc?.format === 'story' || (doc?.canvas?.height > doc?.canvas?.width);
};

/** Keep an authored inline footer inline; other handles follow below their icons. */
export function cocoSocialHandleLayoutPatch(source: RecordValue, assets: RecordValue[] = source.portraits ?? []): RecordValue {
  const doc = source.cocoCompositionSystem?.compiledDocument;
  const overrides = source.cocoCompositionSystem?.compiledObjectOverrides ?? {};
  const icons = assets.filter(a => String(a.id).startsWith(PREFIX) && a.id !== HANDLE && !overrides[a.cocoCompiledObjectId]?.removed);
  const text = String(source.cocoEventBrief?.socials ?? '').trim();
  if (!icons.length || !text) return {};
  const ratio = doc ? doc.canvas.width / doc.canvas.height : source.format === 'story' ? 9 / 16 : 1;
  const boxes = icons.map(a => {
    const object = doc?.objects.find((o: RecordValue) => o.id === a.cocoCompiledObjectId);
    const width = object ? object.bounds.width * a.scale : 128 * a.scale / 540 * 100;
    const height = object ? object.bounds.height * a.scale : width * ratio;
    return { left: a.x - width / 2, right: a.x + width / 2, top: a.y - height / 2, bottom: a.y + height / 2 };
  });
  const left = Math.min(...boxes.map(b => b.left)), right = Math.max(...boxes.map(b => b.right));
  const center = (left + right) / 2;
  const inline = !isStory(source) && Boolean(source.cocoFormSocialInlineAnchor);
  const auto = icons.every(a => a.cocoSocialAutoPosition && Math.abs(a.x - a.cocoSocialAutoPosition.x) < .01 && Math.abs(a.y - a.cocoSocialAutoPosition.y) < .01);
  const align = inline ? 'left' : auto && source.cocoFormSocialAlignment ? source.cocoFormSocialAlignment : center < 100 / 3 ? 'left' : center > 200 / 3 ? 'right' : 'center';
  const object = doc?.objects.find((o: RecordValue) => o.kind === 'text' && (['social', 'handle'].includes(o.semanticRole) || /^(socialHandle|handle)$/i.test(o.id)));
  const edit = overrides[object?.id] ?? {};
  const width = inline
    ? Math.max(right - left, clamp(text.length * 1.2, 18, 48))
    : clamp(Math.max(right - left, text.length * 1.2, object?.bounds.width ?? 18), 18, 94);
  const height = Math.max(object?.bounds.height ?? 0, 2.6 * ratio);
  const top = inline
    ? clamp((Math.min(...boxes.map(b => b.top)) + Math.max(...boxes.map(b => b.bottom))) / 2 - height / 2, 2, 99 - height)
    : clamp(Math.max(...boxes.map(b => b.bottom)) + 1.2 * ratio, 2, 98 - height);
  const x = clamp(inline ? right + 1.2 : align === 'left' ? left : align === 'right' ? right - width : center - width / 2, 2, 98 - width);
  if (object) {
    if (edit.left === x && edit.top === top && edit.align === align && object.bounds.width === width && object.bounds.height === height) return {};
    return { cocoCompositionSystem: { ...source.cocoCompositionSystem,
      compiledDocument: { ...doc, objects: doc.objects.map((o: RecordValue) => o.id === object.id ? { ...o, bounds: { ...o.bounds, width, height }, paintBounds: { ...o.paintBounds, width, height } } : o) },
      compiledObjectOverrides: { ...overrides, [object.id]: { ...edit, left: x, top, align } },
    } };
  }
  if (!doc) {
    const anchor = align === 'right' ? x + width : align === 'center' ? x + width / 2 : x;
    if (source.cocoSocialHandleX === anchor && source.cocoSocialHandleY === top && source.cocoSocialHandleAlign === align) return {};
    return { cocoSocialHandleX: anchor, socialHandleX: anchor, cocoSocialHandleY: top, socialHandleY: top, cocoSocialHandleAlign: align, socialHandleAlign: align, socialHandleGroupWidth: width };
  }
  return {};
}

function artwork(platform: string, color: string) {
  const id = `${platform === 'x' ? 'twitter' : platform}_logo`;
  const graphic = COCO_SOCIAL_GRAPHICS.find(g => g.id === id)!;
  const fill = 'renderMode' in graphic && graphic.renderMode === 'fill';
  const paths = graphic.paths.map(d => `<path d="${d}" ${fill ? 'fill="{{COLOR}}"' : 'fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"'}/>`).join('');
  const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="${graphic.opticalViewBox}">${paths}</svg>`;
  return {
    editorGraphicId: id, svgTemplate,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTemplate.replaceAll('{{COLOR}}', color))}`,
    label: platform === 'x' ? 'X' : graphic.label,
  };
}

function liveBounds(object: RecordValue, overrides: RecordValue): Box {
  const edit = overrides[object.id] ?? {};
  return { ...object.bounds, x: edit.left ?? object.bounds.x, y: edit.top ?? object.bounds.y };
}

/** A single icon beside a handle is an authored footer, not a stacked icon rail. */
function inlineSocialAnchor(source: RecordValue, objects: RecordValue[], ratio: number) {
  if (source.cocoFormSocialInlineAnchor) return source.cocoFormSocialInlineAnchor;
  const handle = objects.find(o => o.kind === 'text' && (['social', 'handle'].includes(o.semanticRole) || /^(socialHandle|handle)$/i.test(o.id)));
  if (!handle || handle.id === HANDLE) return null;
  const icon = objects.find(o => o.kind === 'image' && /^(social|socialIcons?|instagram)$/i.test(o.id) &&
    o.bounds.width > 0 && Math.abs(o.bounds.height / ratio / o.bounds.width - 1) < .2 &&
    o.bounds.x + o.bounds.width <= handle.bounds.x &&
    Math.abs(o.bounds.y + o.bounds.height / 2 - handle.bounds.y - handle.bounds.height / 2) < Math.max(o.bounds.height, handle.bounds.height));
  return icon ? { left: icon.bounds.x, right: handle.bounds.x + handle.bounds.width, align: (icon.bounds.x + handle.bounds.x + handle.bounds.width) / 2 > 200 / 3 ? 'right' : 'left', centerY: icon.bounds.y + icon.bounds.height / 2, iconWidth: icon.bounds.width } : null;
}

/** Snap an outside rail to the nearby text column, not to its growing center. */
function columnEdge(objects: RecordValue[], overrides: RecordValue, box: Box, align: string) {
  const original = align === 'right' ? box.x + box.width : box.x;
  if (align === 'center') return box.x + box.width / 2;
  const edges = objects.filter(o => o.kind === 'text' && !overrides[o.id]?.removed && !String(o.id).startsWith(PREFIX) &&
    (align === 'left' ? ['left', 'start'] : ['right', 'end']).includes(overrides[o.id]?.align ?? o.typography?.align))
    .map(o => { const b = liveBounds(o, overrides); return align === 'right' ? b.x + b.width : b.x; }).filter(x => Math.abs(x - original) <= 3);
  return edges.sort((a, b) => edges.filter(x => Math.abs(x - b) < .3).length - edges.filter(x => Math.abs(x - a) < .3).length || Math.abs(a - original) - Math.abs(b - original))[0] ?? original;
}

// Choose a quiet footer band for recipes without a social-handle owner. Only
// visible text participates; a full-canvas background is not an obstruction.
function footerBox(objects: RecordValue[], overrides: RecordValue, height: number, width: number): Box {
  const occupied = objects.filter(o => o.kind === 'text' && o.id !== HANDLE && !overrides[o.id]?.removed && (overrides[o.id]?.text ?? o.text));
  const candidates = [96, 91, 86, 81].flatMap(bottom => [3, (100 - width) / 2, 97 - width].map(x => ({ x, y: bottom - height, width, height })));
  const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.width, b.x + b.width + 1) - Math.max(a.x, b.x - 1)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height + 1) - Math.max(a.y, b.y - 1));
  return candidates.map((box, index) => ({ box, cost: occupied.reduce((sum, o) => sum + overlap(box, liveBounds(o, overrides)), 0) + index * 0.001 })).sort((a, b) => a.cost - b.cost)[0].box;
}

/** Materialize form selections as the same editable SVG assets used by Library. */
export function withCocoSocialRecipeAssets(source: RecordValue, brief: CocoEventBriefInput): RecordValue {
  const requested = [...new Set((brief.socialPlatforms ?? []).map(p => String(p).toLowerCase().trim()).map(p => p === 'twitter' ? 'x' : p))];
  const platforms = COCO_SOCIAL_PLATFORMS.filter(p => requested.includes(p));
  const handle = String(brief.socials ?? '').trim();
  const system = source.cocoCompositionSystem;
  const doc = system?.compiledDocument;
  const overrides = { ...system?.compiledObjectOverrides };
  let objects: RecordValue[] = [...(doc?.objects ?? [])];
  const oldAssets: RecordValue[] = source.emojiList ?? source.portraits ?? [];
  const variant = { ...source };
  const ratio = doc ? doc.canvas.width / doc.canvas.height : source.format === 'story' ? 9 / 16 : 1;
  const story = isStory(source);
  const nativeSamples = cocoNativeSocialSamples(source);
  let nativeAnchor = source.cocoFormSocialNativeAnchor;
  if (!nativeAnchor && nativeSamples.length) {
    const left = Math.min(...nativeSamples.map(a => a.x - 128 * a.scale / 540 * 50));
    const right = Math.max(...nativeSamples.map(a => a.x + 128 * a.scale / 540 * 50));
    nativeAnchor = { ids: nativeSamples.map(a => a.id), x: left, width: right - left,
      centerY: nativeSamples.reduce((sum, a) => sum + a.y, 0) / nativeSamples.length };
  }
  if (nativeAnchor) variant.cocoFormSocialNativeAnchor = nativeAnchor;
  const authoredInlineAnchor = inlineSocialAnchor(source, objects, ratio);
  const inlineAnchor = story ? null : authoredInlineAnchor;
  if (story) delete variant.cocoFormSocialInlineAnchor;
  if (inlineAnchor) variant.cocoFormSocialInlineAnchor = inlineAnchor;
  const authoredSocial = objects.find(o => o.kind !== 'text' && /^(social|socialIcons?|instagram)$/i.test(o.id));
  const iconWidth = nativeAnchor ? 128 * SCALE / 540 * 100 : authoredInlineAnchor?.iconWidth ?? (authoredSocial ? Math.min(4.5, authoredSocial.bounds.height / ratio) : doc ? 4.5 : 128 * SCALE / 540 * 100);
  const iconHeight = iconWidth * ratio, step = iconWidth + 1;
  const iconsWidth = platforms.length ? platforms.length * step - 1 : 0;
  const gap = iconsWidth && handle ? 1.2 * ratio : 0;
  const handleWidth = handle ? clamp(handle.length * 1.2, 18, 48) : 0;
  const owned = (id: unknown) => typeof id === 'string' && id.startsWith(PREFIX);
  const selectedIds = new Set(platforms.map(p => `${PREFIX}${p}`));

  // Replace authored sample social strips. Their baked-in platforms cannot
  // represent the user's selection. Manually inserted Library icons are kept.
  const sampleIds = new Set(objects.filter(o => o.kind !== 'text' && /^(social|socialIcons?|instagram)$/i.test(o.id)).map(o => o.id));
  sampleIds.forEach(id => { overrides[id] = { ...overrides[id], cocoFormSocialWasRemoved: overrides[id]?.cocoFormSocialWasRemoved ?? overrides[id]?.removed ?? false, removed: true }; });
  objects = objects.filter(o => !owned(o.id) || o.id === HANDLE || selectedIds.has(o.id));
  for (const id of Object.keys(overrides)) if (owned(id) && id !== HANDLE && !selectedIds.has(id)) delete overrides[id];
  let handleObject = objects.find(o => o.kind === 'text' && (['social', 'handle'].includes(o.semanticRole) || /^(socialHandle|handle)$/i.test(o.id)));
  const generatedHandle = !handleObject || handleObject.id === HANDLE;
  const handleHeight = story ? Math.max(handleObject?.bounds.height ?? 0, 2.6 * ratio) : 2.6 * ratio;
  const rowWidth = Math.max(iconWidth, iconsWidth, handleWidth, story && handle ? handleObject?.bounds.width ?? 0 : 0);
  const rowHeight = (iconsWidth ? iconHeight : 0) + gap + (handle ? handleHeight : 0);
  const authoredStrip = generatedHandle
    ? objects.find(o => sampleIds.has(o.id) && !overrides[o.id]?.cocoFormSocialWasRemoved)
    : null;
  const stripBox = authoredStrip ? liveBounds(authoredStrip, overrides) : nativeAnchor
    ? { x: nativeAnchor.x, y: nativeAnchor.centerY - iconHeight / 2, width: nativeAnchor.width, height: iconHeight } : null;
  const authoredAlign = stripBox ? stripBox.x + stripBox.width / 2 < 100 / 3 ? 'left' : stripBox.x + stripBox.width / 2 > 200 / 3 ? 'right' : 'center' : null;
  const edge = stripBox ? columnEdge(objects, overrides, stripBox, authoredAlign!) : 0;
  const previousRow = source.cocoFormSocialRowBox;
  const previousAlign = source.cocoFormSocialAlignment ?? (previousRow ? previousRow.x + previousRow.width / 2 < 100 / 3 ? 'left' : previousRow.x + previousRow.width / 2 > 200 / 3 ? 'right' : 'center' : 'left');
  // Story always has a centered footer, independent of its Square treatment.
  const row = story
    ? { x: (100 - rowWidth) / 2, y: 98 - rowHeight, width: rowWidth, height: rowHeight }
    : stripBox
    ? { x: clamp(authoredAlign === 'left' ? edge : authoredAlign === 'right' ? edge - rowWidth : edge - rowWidth / 2, 2, 98 - rowWidth), y: stripBox.y + stripBox.height / 2 - rowHeight / 2, width: rowWidth, height: rowHeight }
    : generatedHandle
    ? previousRow
      ? { ...previousRow, x: clamp(previousRow.x + (previousAlign === 'right' ? previousRow.width - rowWidth : previousAlign === 'center' ? (previousRow.width - rowWidth) / 2 : 0), 3, 97 - rowWidth), width: rowWidth, height: rowHeight }
      : footerBox(objects, overrides, rowHeight, rowWidth)
    : liveBounds(handleObject!, overrides);
  if ((generatedHandle || story) && (handle || platforms.length)) variant.cocoFormSocialRowBox = row;
  const rowCenter = row.x + row.width / 2;
  const handleAlign = !generatedHandle ? overrides[handleObject!.id]?.align ?? handleObject!.typography?.align : null;
  const align = story ? 'center' : authoredAlign ?? (handleAlign === 'start' ? 'left' : handleAlign === 'end' ? 'right' : handleAlign) ?? source.cocoFormSocialAlignment ?? (rowCenter < 100 / 3 ? 'left' : rowCenter > 200 / 3 ? 'right' : 'center');
  variant.cocoFormSocialAlignment = inlineAnchor ? inlineAnchor.align ?? 'right' : align;
  let iconX = align === 'left' ? row.x : align === 'right' ? row.x + row.width - iconsWidth : rowCenter - iconsWidth / 2;
  let iconY = row.y + iconHeight / 2;
  if (!generatedHandle && !story) {
    iconX = clamp(iconX, 3, 97 - iconsWidth);
    iconY = Math.max(iconHeight / 2 + 3, row.y - iconHeight / 2 - gap);
  }
  if (inlineAnchor) {
    // Keep the outside edge anchored; left footers grow right, right footers left.
    iconX = clamp(inlineAnchor.align === 'left' ? inlineAnchor.left : inlineAnchor.right - iconsWidth - (handle ? 1.2 + Math.max(18, handleWidth, iconsWidth) : 0), 2, 98 - iconsWidth);
    iconY = inlineAnchor.centerY;
  }

  if (doc && generatedHandle && (handle || handleObject)) {
    const bounds = { x: row.x, y: row.y + (iconsWidth ? iconHeight + gap : 0), width: Math.max(18, handleWidth, iconsWidth), height: 2.6 * ratio };
    if (!handleObject) {
      handleObject = {
        id: HANDLE, kind: 'text', semanticRole: 'social', assetRole: null, editable: true,
        bounds, paintBounds: bounds, text: handle,
        typography: { fontFamily: 'LEMONMILK-Regular', fontSizePx: 9, fontWeight: '400', lineHeight: 1.2, letterSpacingEm: 0, align: 'left' },
        paint: { color: '#ffffff', opacity: 1, textShadow: '0 1px 2px rgba(0,0,0,.8)' },
        stacking: { order: 180, zIndex: 180 },
        binding: { text: 'cocoSocialHandle', enabled: 'cocoSocialHandleEnabled', panel: 'socialHandle', moveTarget: 'socialHandle', editable: true, initial: { x: bounds.x, y: bounds.y, size: 9, family: 'LEMONMILK-Regular', color: '#ffffff', align: 'left' } },
      };
      objects.push(handleObject);
    } else {
      // Bounds may reflow with the selection; explicit Fine Tune offsets stay.
      handleObject = { ...handleObject, bounds, paintBounds: bounds };
      objects = objects.map(o => o.id === HANDLE ? handleObject! : o);
    }
    overrides[HANDLE] = { ...overrides[HANDLE], text: handle, cocoFormFields: ['socials'] };
    Object.assign(variant, { cocoSocialHandle: handle, cocoSocialHandleEnabled: Boolean(handle) });
  } else if (!doc) {
    // Native recipes use the existing social handle controls and portrait stack.
    Object.assign(variant, { cocoSocialHandle: handle, socialHandle: handle, cocoSocialHandleEnabled: Boolean(handle), socialHandleEnabled: Boolean(handle) });
    const handleAuto = story ? { x: 50, y: 98 - handleHeight } : { x: row.x + iconsWidth + gap, y: row.y + (iconHeight - 2.6 * ratio) / 2 };
    const oldAuto = source.cocoFormSocialNativeRow;
    if (!oldAuto || (Math.abs(source.cocoSocialHandleX - oldAuto.x) < .01 && Math.abs(source.cocoSocialHandleY - oldAuto.y) < .01)) {
      for (const prefix of ['socialHandle', 'cocoSocialHandle']) Object.assign(variant, { [`${prefix}X`]: handleAuto.x, [`${prefix}Y`]: handleAuto.y });
    }
    if (!oldAuto) {
      for (const prefix of ['socialHandle', 'cocoSocialHandle']) Object.assign(variant, { [`${prefix}Size`]: 9, [`${prefix}Color`]: '#ffffff' });
    }
    if (story || !oldAuto) for (const prefix of ['socialHandle', 'cocoSocialHandle']) variant[`${prefix}Align`] = story ? 'center' : 'left';
    variant.cocoFormSocialNativeRow = handleAuto;
  }
  if (story && handleObject && handle) {
    // Also center handle-only footers, for which the icon-following patch has
    // no geometry. With icons, that patch still follows deliberate icon moves.
    const width = clamp(Math.max(handleObject.bounds.width, handleWidth, iconsWidth), 18, 94);
    objects = objects.map(o => o.id === handleObject!.id ? { ...o,
      bounds: { ...o.bounds, width, height: handleHeight },
      paintBounds: { ...o.paintBounds, width, height: handleHeight },
    } : o);
    overrides[handleObject.id] = { ...overrides[handleObject.id], left: (100 - width) / 2, top: 98 - handleHeight, align: 'center' };
  }
  const assets = oldAssets.filter(a => !owned(a.id) && !sampleIds.has(a.cocoCompiledObjectId) && !nativeAnchor?.ids.includes(a.id));
  for (const [index, platform] of platforms.entries()) {
    const id = `${PREFIX}${platform}`;
    const old = oldAssets.find(a => a.id === id);
    const auto = { x: clamp(iconX + index * step + iconWidth / 2, iconWidth / 2 + 2, 98 - iconWidth / 2), y: clamp(iconY, iconHeight / 2 + 2, (inlineAnchor ? 99 : 98) - iconHeight / 2) };
    const moved = old && (!old.cocoSocialAutoPosition || Math.abs(old.x - old.cocoSocialAutoPosition.x) > .01 || Math.abs(old.y - old.cocoSocialAutoPosition.y) > .01);
    const graphic = artwork(platform, old?.iconColor ?? '#ffffff');
    const asset = {
      ...graphic, id, kind: 'sticker', isSticker: true, isNightlifeGraphic: true,
      isSocialIcon: true, socialPlatform: platform, iconColor: '#ffffff',
      scale: SCALE, opacity: 1, rotation: 0, layerOffset: 180, showLabel: false,
      blendMode: 'normal', hitTestMode: 'alpha-bounds',
      ...old,
      ...(moved ? {} : auto), cocoSocialAutoPosition: auto,
      ...(doc ? { cocoCompiledObjectId: id, cocoAssetRole: id } : {}),
    };
    assets.push(asset);
    if (doc && authoredSocial && !moved && (!old || old.scale === SCALE)) {
      // Migrate old automatic 4.5%-wide icons to the authored footer size.
      // Explicitly moved/resized icons retain their user's geometry.
      objects = objects.map(o => o.id === id ? { ...o,
        bounds: { ...o.bounds, width: iconWidth / SCALE, height: iconHeight / SCALE },
        paintBounds: { ...o.paintBounds, width: iconWidth / SCALE, height: iconHeight / SCALE },
      } : o);
    }
    if (doc && !objects.some(o => o.id === id)) {
      const bounds = { x: auto.x - iconWidth / SCALE / 2, y: auto.y - iconHeight / SCALE / 2, width: iconWidth / SCALE, height: iconHeight / SCALE };
      objects.push({ id, kind: 'image', semanticRole: 'social-icon', assetRole: id, editable: true, bounds, paintBounds: bounds, paint: { opacity: 1 }, stacking: { order: 180, zIndex: 180 }, image: { src: graphic.url, naturalWidth: 128, naturalHeight: 128, fit: 'contain', position: '50% 50%' }, binding: { editable: true } });
    }
  }
  variant.emojiList = assets;
  variant.portraits = assets;
  if (doc) variant.cocoCompositionSystem = { ...system, compiledDocument: { ...doc, objects }, compiledObjectOverrides: overrides };
  const report = source.cocoFormMappingReport;
  if (report) {
    const placed = new Set<string>();
    if (handle) placed.add('socials');
    if (platforms.length && platforms.length === requested.length) placed.add('socialPlatforms');
    const unplacedFields = report.unplacedFields.filter((key: string) => !placed.has(key));
    variant.cocoFormMappingReport = { ...report, mappedFields: [...new Set([...report.mappedFields, ...placed])], unplacedFields, unplacedLabels: report.unplacedLabels.filter((_: string, i: number) => !placed.has(report.unplacedFields[i])) };
  }
  return { ...variant, ...cocoSocialHandleLayoutPatch(variant, assets) };
}
