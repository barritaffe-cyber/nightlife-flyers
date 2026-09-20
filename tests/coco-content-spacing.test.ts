import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoContentBox, cocoContentIntersects, prepareCocoContentLayout, withCocoContentLayout } from '../lib/coco/contentAwareLayout.ts';
import { withCocoSocialRecipeAssets } from '../lib/coco/socialRecipeAssets.ts';
import { COCO_SOCIAL_PLATFORMS } from '../lib/coco/eventBriefFields.ts';
import { cocoQuickTextSizePatch } from '../lib/coco/quickTextSizes.ts';
import { cocoFormDisplayLabel, cocoFormFieldGuidance } from '../lib/coco/formFieldGuidance.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { cocoGuidedUndo } from '../lib/coco/guidedQuickEdit.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const recipe = (id: string) => recipes.find((r: any) => r.recipeId === id);
const iconBoxes = (v: any) => v.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.semanticRole === 'social-icon').map((o: any) => cocoContentBox(v, o));
const box = (v: any, id: string) => cocoContentBox(v, v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === id));

for (const format of ['square', 'story']) test(`Afro Sunset ${format}: six socials stay aligned and clear of the footer; shrinking restores space`, () => {
  const r = recipe('afro-sunset'), master = r.formats[format], snapshot = JSON.stringify(master);
  const brief = { date: 'Dec 1 2026', venueName: 'THE LOFT', address: 'DOWNTOWN, MIAMI FL', musicPolicy: 'HIP HOP | AFROBEATS | REGGAE', subtitle: 'CITY NIGHTS' };
  const render = (source: any, count: number) => materialize(r.recipeId, source, { eventName: 'Ladies Night', fieldMappingVersion: 1, eventBrief: { ...brief, socialPlatforms: COCO_SOCIAL_PLATFORMS.slice(0, count) } });
  let v = render(master, 1);
  const edge = iconBoxes(v)[0].x;
  const before = box(v, 'motto');
  for (const count of [6, 2, 6, 1, 0, 6]) {
    v = render(JSON.parse(JSON.stringify(v)), count);
    const icons = iconBoxes(v);
    assert.equal(icons.length, count);
    for (const b of icons) {
      assert.ok(b.x >= 1 && b.x + b.width <= 99 && b.y >= 0 && b.y + b.height <= 100);
      for (const id of ['motto', 'r4', 'age', 'address', 'venue']) assert.ok(!cocoContentIntersects(b, box(v, id)), `${format}/${count} overlaps ${id}`);
    }
    if (count && format === 'square') assert.ok(Math.abs(icons[0].x - edge) < .02, 'Square left edge stays fixed as the row grows');
    if (count && format === 'story') assert.ok(Math.abs((icons[0].x + icons.at(-1)!.x + icons.at(-1)!.width) / 2 - 50) < .02, 'Story stays centered as the row grows');
    if (count <= 1) assert.deepEqual(box(v, 'motto'), count === 0 ? box(render(master, 0), 'motto') : before, 'slogan returns to the slot for the current row');
    const repeated = render(v, count);
    assert.deepEqual(iconBoxes(repeated), icons, 'no drift after unrelated edits');
    assert.deepEqual(box(repeated, 'motto'), box(v, 'motto'));
  }
  assert.equal(JSON.stringify(master), snapshot);
});

test('right-aligned social rows grow left and move neighbouring copy inward', () => {
  const text = { id: 'copy', kind: 'text', text: 'OUR CLUB', bounds: { x: 70, y: 90, width: 12, height: 3 }, typography: { fontSizePx: 12, align: 'right' } };
  const v: any = { format: 'square', cocoCompositionSystem: { compiledDocument: { canvas: { width: 1080, height: 1080 }, objects: [text,
    { id: 'social', kind: 'image', bounds: { x: 86, y: 90, width: 8, height: 3 } },
    { id: 'column', kind: 'text', text: 'VENUE', bounds: { x: 64, y: 80, width: 30, height: 4 }, typography: { fontSizePx: 12, align: 'right' } },
  ] } } };
  const create = (source: any, count: number) => withCocoContentLayout(withCocoSocialRecipeAssets(prepareCocoContentLayout(source), { socialPlatforms: COCO_SOCIAL_PLATFORMS.slice(0, count) }));
  let next = create(v, 1);
  const end = iconBoxes(next).at(-1)!.x + iconBoxes(next).at(-1)!.width;
  next = create(next, 6);
  const boxes = iconBoxes(next);
  assert.ok(Math.abs(boxes.at(-1)!.x + boxes.at(-1)!.width - end) < .01);
  assert.ok(box(next, 'copy').x < text.bounds.x);
  assert.ok(boxes.every((b: any) => !cocoContentIntersects(b, box(next, 'copy'))));
  assert.equal(box(create(next, 1), 'copy').x, text.bounds.x);
});

test('generated right/center rails retain their anchor when the icon count changes', () => {
  for (const align of ['right', 'center']) {
    const source: any = { format: 'square', cocoFormSocialAlignment: align, cocoFormSocialRowBox: { x: align === 'right' ? 72 : 40, y: 90, width: 20, height: 5 },
      cocoCompositionSystem: { compiledDocument: { canvas: { width: 1080, height: 1080 }, objects: [] } } };
    const anchor = (v: any) => { const b = iconBoxes(v); return align === 'right' ? b.at(-1)!.x + b.at(-1)!.width : (b[0].x + b.at(-1)!.x + b.at(-1)!.width) / 2; };
    let v = withCocoSocialRecipeAssets(source, { socialPlatforms: COCO_SOCIAL_PLATFORMS.slice(0, 1) });
    const expected = anchor(v);
    for (const count of [6, 2, 1]) { v = withCocoSocialRecipeAssets(v, { socialPlatforms: COCO_SOCIAL_PLATFORMS.slice(0, count) }); assert.ok(Math.abs(anchor(v) - expected) < .01); }
  }
});

test('text growth nudges a column, restores it when reduced, and respects deliberate moves', () => {
  const text = (id: string, y: number) => ({ id, kind: 'text', text: id, bounds: { x: 5, y, width: 35, height: 4 }, typography: { fontSizePx: 10, align: 'left' } });
  const original: any = { cocoCompositionSystem: { compiledDocument: { canvas: { width: 1080, height: 1080 }, objects: [text('venue', 70), text('address', 75), text('footer', 80),
    { id: 'background', kind: 'image', bounds: { x: 0, y: 0, width: 100, height: 100 } }] } } };
  const resized = { ...original, ...cocoQuickTextSizePatch(original, 'venue', 24) };
  assert.ok(box(resized, 'address').y > 79);
  assert.ok(box(resized, 'footer').y > 84);
  const reduced = { ...resized, ...cocoQuickTextSizePatch(resized, 'venue', 10) };
  assert.equal(box(reduced, 'address').y, 75);
  assert.equal(box(reduced, 'footer').y, 80);
  const moved = structuredClone(resized);
  moved.cocoCompositionSystem.compiledObjectOverrides.address.top = 60;
  const rerun = { ...moved, ...cocoQuickTextSizePatch(moved, 'venue', 26) };
  assert.equal(box(rerun, 'address').y, 60, 'manual drag remains authoritative');
  assert.deepEqual(rerun.cocoCompositionSystem.compiledDocument.objects, original.cocoCompositionSystem.compiledDocument.objects, 'master geometry untouched');
});

test('a blocked rail finds a nearby band without moving pinned copy', () => {
  const v: any = { format: 'square', cocoCompositionSystem: { compiledDocument: { canvas: { width: 1080, height: 1080 }, objects: [
    { id: 'social', kind: 'image', bounds: { x: 5, y: 90, width: 12, height: 3 } },
    { id: 'copy', kind: 'text', text: 'PINNED COPY', locked: true, bounds: { x: 18, y: 90, width: 60, height: 4 }, typography: { fontSizePx: 12, align: 'left' } },
  ] } } };
  const next = withCocoContentLayout(withCocoSocialRecipeAssets(prepareCocoContentLayout(v), { socialPlatforms: [...COCO_SOCIAL_PLATFORMS] }));
  assert.deepEqual(box(next, 'copy'), box(v, 'copy'));
  for (const b of iconBoxes(next)) assert.ok(!cocoContentIntersects(b, box(next, 'copy')));
});

test('Undo restores nudged assets after later form clones without undoing manual styling', () => {
  const original: any = { cocoCompositionSystem: { compiledDocument: { canvas: { width: 1080, height: 1080 }, objects: [
    { id: 'text', kind: 'text', text: 'VENUE', bounds: { x: 5, y: 70, width: 35, height: 4 }, typography: { fontSizePx: 10, align: 'left' } },
    { id: 'rule', kind: 'shape', bounds: { x: 5, y: 76, width: 30, height: 1 } },
  ] } }, portraits: [{ id: 'rule-asset', cocoCompiledObjectId: 'rule', x: 20, y: 76.5, scale: 1, color: 'gold' }] };
  const after = { ...original, ...cocoQuickTextSizePatch(original, 'text', 25) };
  assert.ok(after.portraits[0].y > original.portraits[0].y);
  const current = JSON.parse(JSON.stringify(after));
  current.portraits[0].color = 'rose';
  current.portraits.push({ id: 'later-added', x: 80, y: 80 });
  const undone = cocoGuidedUndo(current, original, after);
  assert.equal(undone.portraits[0].y, original.portraits[0].y);
  assert.equal(undone.portraits[0].color, 'rose');
  assert.equal(undone.portraits[1].id, 'later-added');
});

test('form guidance names taglines and distinguishes single-box and split genres', () => {
  assert.equal(cocoFormDisplayLabel('Subtitle / tagline'), 'Tagline');
  assert.match(cocoFormFieldGuidance('subtitle'), /tagline.*short phrase/i);
  for (const id of ['afro-sunset', 'soft-life']) {
    const caps = cocoRecipeFormCapabilities(id, recipe(id).formats);
    if (!caps.bindings.musicPolicy) continue;
    const binding = caps.bindings.musicPolicy;
    const guidance = cocoFormFieldGuidance('musicPolicy', binding, caps.limits.musicPolicy.maxLines);
    assert.match(guidance, caps.limits.musicPolicy.maxLines > 1 ? /per box/ : /separate genres.*\|/i);
  }
});
