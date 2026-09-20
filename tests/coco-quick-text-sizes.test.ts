import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { cocoQuickTextSizeOwners, cocoQuickTextSizePatch } from '../lib/coco/quickTextSizes.ts';
const project = JSON.parse(readFileSync('public/generated-flyers/slow-jamz.nflyer', 'utf8'));
const capabilities = cocoRecipeFormCapabilities('slow-jamz', project.state.session);
const brief = { theme: 'R&B / Lounge', venueName: 'VELVET ROOM', address: 'MIAMI, FL', musicPolicy: 'R&B Only', socials: '@theloft', date: 'Nov 7 2026', fieldFormats: capabilities.fieldFormats, recipeFieldBindings: capabilities.bindings };
for (const format of ['square','story']) test(`Quick Edit ${format}: size targets the field and persists through form edits and JSON roundtrip`, () => {
  const original = materialize('slow-jamz', project.state.session[format], { eventName: 'Slow Jamz', eventBrief: brief, fieldMappingVersion: 1 });
  const before = JSON.stringify(original);
  for (const field of ['eventName','venueName','address','musicPolicy','socials','date']) {
    const owners = cocoQuickTextSizeOwners(original, field, capabilities.bindings[field]);
    assert.ok(owners.length, `${field} has size controls`);
    assert.ok(!owners.some((o: any) => o.id==='year'), 'hidden year has no slider');
    for (const owner of owners) {
      const size = Math.round(owner.size*1.2*2)/2;
      const edited = {...original, ...cocoQuickTextSizePatch(original,owner.id,size)};
      const next = materialize('slow-jamz', JSON.parse(JSON.stringify(edited)), { eventName: 'Slow Jamz', eventBrief: {...brief,musicPolicy:'Soul & R&B'}, fieldMappingVersion:1 });
      assert.equal(cocoQuickTextSizeOwners(next,field,capabilities.bindings[field]).find((o:any)=>o.id===owner.id)?.size,size);
      for (const other of original.cocoCompositionSystem.compiledDocument.objects) if(other.id!==owner.id) {
        const beforeEdit = original.cocoCompositionSystem.compiledObjectOverrides[other.id] ?? {};
        const afterEdit = edited.cocoCompositionSystem.compiledObjectOverrides[other.id] ?? {};
        // Neighbours may move to make room; wording, size and paint stay theirs.
        const { left: _left, top: _top, ...beforeStyle } = beforeEdit;
        const { left: _nextLeft, top: _nextTop, ...afterStyle } = afterEdit;
        assert.deepEqual(afterStyle, beforeStyle);
        if (beforeEdit.left !== afterEdit.left || beforeEdit.top !== afterEdit.top)
          assert.ok(edited.cocoCompositionSystem.cocoContentLayout.positions[other.id], 'offset has reversible layout provenance');
      }
    }
  }
  assert.equal(JSON.stringify(original),before);
});

test('empty fields do not offer ineffective size controls',()=>{
 const v=materialize('slow-jamz',project.state.session.square,{eventName:'Slow Jamz',eventBrief:{theme:'R&B / Lounge'},fieldMappingVersion:1});
 for(const field of ['venueName','address','musicPolicy','socials']) assert.deepEqual(cocoQuickTextSizeOwners(v,field,capabilities.bindings[field]),[]);
});
