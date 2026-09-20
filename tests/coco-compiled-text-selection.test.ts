import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

test('all delivered Saturday text layers have selection controls without rewriting the project', () => {
 const state = JSON.parse(readFileSync('public/generated-flyers/brunch-saturday.nflyer', 'utf8')).state;
 for (const format of ['square', 'story']) {
  const source = state.session[format].cocoCompositionSystem.compiledDocument.objects;
  const before = JSON.stringify(source);
  const text = source.filter((o: any) => o.kind === 'text').map(withCompiledTextSelection);
  assert.equal(text.length, 16);
  for (const object of text) {
   assert.ok(object.binding.panel, object.id);
   assert.ok(object.binding.moveTarget, object.id);
  }
  assert.ok(text.find((o: any) => o.id === 'offer-one-price').binding.mappedControls);
  assert.ok(text.find((o: any) => o.id === 'address').binding.mappedControls);
  assert.equal(JSON.stringify(source), before);
 }
});
test('existing headline controls and locked objects retain their bindings', () => {
 for (const object of [
  {kind:'text', editable:true, semanticRole:'headline', binding:{panel:'headline',moveTarget:'headline'}},
  {kind:'text', editable:false, binding:{}},
  {kind:'image', editable:true, binding:{}},
 ]) assert.equal(withCompiledTextSelection(object), object);
});

 test('date, offer and venue fragments use their established panels', () => {
  for(const [role,panel,field] of [
   ['weekday','date','date'],['day','date','date'],['month','date','date'],
   ['meridiem','date','time'],['endTime','date','time'],['timeConnector','date','time'],
   ['presents','presenter','presenter'],['offerOnePrice','price','price'],
   ['offerOneCopy','price','priceLabel'],['address','venue','venueAddress'],
  ]) {
   const object=withCompiledTextSelection({kind:'text',editable:true,semanticRole:role,binding:{}});
   assert.equal(object.binding.panel,panel,role);
   assert.equal(object.binding.uiField,field,role);
   assert.equal(object.binding.genericControls,undefined);
  }
 });
 test('desktop cannot render the mobile floating text editor',()=>{
  const source=readFileSync('app/page.tsx','utf8');
  assert.match(source,/isMobileView && activeTextControls && floatingEditorVisible/);
  assert.doesNotMatch(source,/renderFloatingTextControls/);
 });
