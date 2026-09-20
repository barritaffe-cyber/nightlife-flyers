import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoSocialHandleLayoutPatch } from '../lib/coco/socialRecipeAssets.ts';
import { COCO_SOCIAL_PLATFORMS } from '../lib/coco/eventBriefFields.ts';
const project = JSON.parse(readFileSync('public/generated-flyers/slow-jamz.nflyer', 'utf8'));
const intersects = (a: any, b: any) => a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
for (const format of ['square', 'story']) test(`Slow Jamz ${format}: icons and handle share the authored footer without touching event copy`, () => {
  let source = project.state.session[format];
  const original = JSON.stringify(source);
  const authored = source.cocoCompositionSystem.compiledDocument.objects;
  const icon = authored.find((o: any) => o.id === 'instagram');
  for (const count of [1, 2, COCO_SOCIAL_PLATFORMS.length, 1, 0, 3]) {
    const brief = { theme: 'R&B / Lounge', date: 'Nov 7 2026', venueName: 'VELVET ROOM', address: 'MIAMI, FL', musicPolicy: 'CLASSIC R&B', socials: '@slow_jamz', socialPlatforms: COCO_SOCIAL_PLATFORMS.slice(0,count) };
    source = materialize('slow-jamz', source, { eventName: 'Slow Jamz', fieldMappingVersion: 1, eventBrief: brief });
    const system = source.cocoCompositionSystem, objects = system.compiledDocument.objects;
    const icons = source.portraits.filter((a: any) => a.isSocialIcon);
    assert.equal(icons.length, count);
    const handle = objects.find((o: any) => o.id === 'handle');
    const edit = system.compiledObjectOverrides.handle;
    const handleBox = { ...handle.bounds, x: edit.left ?? handle.bounds.x, y: edit.top ?? handle.bounds.y };
    const boxes = icons.map((a: any) => {
      const o = objects.find((o: any) => o.id === a.cocoCompiledObjectId);
      const width = o.bounds.width*a.scale, height = o.bounds.height*a.scale;
      assert.ok(Math.abs(width-icon.bounds.width)<.01, 'preserve authored icon size');
      return { x: a.x-width/2, y: a.y-height/2, width, height };
    });
    for (const box of [...boxes, handleBox]) {
      assert.ok(box.x >= 0 && box.x+box.width <= 100 && box.y >= 0 && box.y+box.height <= 100);
      for (const id of ['headline','subtitle','genres','venue','address']) {
        const o = objects.find((o: any) => o.id === id), e = system.compiledObjectOverrides[id] ?? {};
        assert.ok(!intersects(box, { ...o.bounds, x: e.left ?? o.bounds.x, y: e.top ?? o.bounds.y }), `${count} icons overlap ${id}`);
      }
    }
    for (const box of boxes) {
      assert.ok(!intersects(box,handleBox));
      if (format === 'square') assert.ok(Math.abs(box.y+box.height/2-handleBox.y-handleBox.height/2)<.01, 'Square handle stays beside icons');
      else assert.ok(box.y + box.height < handleBox.y, 'Story handle sits below icons');
    }
    if (format === 'story') {
      assert.equal(edit.align, 'center');
      assert.ok(Math.abs(handleBox.x + handleBox.width / 2 - 50) < .01);
      assert.ok(Math.abs(handleBox.y + handleBox.height - 98) < .01);
      if (count) assert.ok(Math.abs((boxes[0].x + boxes.at(-1).x + boxes.at(-1).width) / 2 - 50) < .01);
    }
    assert.deepEqual(cocoSocialHandleLayoutPatch(source, source.portraits), {}, 'layout settles');
    for (const id of ['headline','subtitle','genres','venue','address']) assert.deepEqual(objects.find((o: any) => o.id===id).bounds, authored.find((o: any) => o.id===id).bounds);
    source = JSON.parse(JSON.stringify(source));
  }
  assert.equal(JSON.stringify(project.state.session[format]), original);
});
