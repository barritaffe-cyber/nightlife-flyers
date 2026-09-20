import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authoredFormText, authoredStackedDate, authoredTime } from '../lib/coco/authoredFormText.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoRecipeFormCapabilities, cocoTextBackdropAvailable } from '../lib/coco/formRecipeMapping.ts';
import { resolveCocoCompiledTextRuns } from '../lib/coco/compiledTextRuns.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));

test('removed supporting artwork excludes dependent form slots across recipes', () => {
  const box={x:10,y:10,width:30,height:5};
  const system={compiledDocument:{objects:[{id:'offer-banner',kind:'image',bounds:box}]},compiledObjectOverrides:{'offer-banner':{removed:true}}};
  assert.equal(cocoTextBackdropAvailable({bounds:box},system),false);
  assert.equal(cocoTextBackdropAvailable({bounds:{...box,y:50}},system),true);
  assert.deepEqual(cocoRecipeFormCapabilities('reggae-jams',recipes.find((r:any)=>r.recipeId==='reggae-jams').formats).fieldFormats.dressCode, ['story']);
});

test('empty backdrop visibility follows its text without resurrecting authored removals', () => {
  const recipe=recipes.find((r:any)=>r.recipeId==='reggae-jams');
  for(const format of ['square','story']) {
    const empty=materialize('reggae-jams',recipe.formats[format],{eventName:'Reggae Jams',eventBrief:{theme:'Tropical'},fieldMappingVersion:1});
    assert.equal(empty.cocoCompositionSystem.compiledObjectOverrides.dressBrush.removed,true);
    const full=materialize('reggae-jams',empty,{eventName:'Reggae Jams',eventBrief:{theme:'Tropical',dressCode:'White on jeans'},fieldMappingVersion:1});
    assert.equal(Boolean(full.cocoCompositionSystem.compiledObjectOverrides.dressBrush.removed),format==='square');
  }
});

test('shared formatting retains casing, calendar order, zero padding and time labels', () => {
  assert.equal(authoredFormText('REGGAE', 'Reggae'), 'REGGAE');
  assert.equal(authoredFormText('Jams', 'Jams'), 'Jams');
  const date = { day:'1',month:'DEC',weekday:'Tuesday' };
  assert.equal(authoredStackedDate('Saturday\n22\nJune','Dec 1 2026',date),'Tuesday\n1\nDEC');
  assert.equal(authoredStackedDate('MAR\n07','Dec 1 2026',date),'DEC\n01');
  assert.equal(authoredTime('Doors\nOpen\n10PM','9:30 PM'),'Doors\nOpen\n9:30 PM');
  assert.equal(authoredTime('7PM','9PM'),'9PM');
  assert.equal(authoredTime('Doors Open\n7PM',''), '');
});

test('City date keeps its large colored day; later position edits are preserved', () => {
  const source=recipes.find((r:any)=>r.recipeId==='city-nights').formats.square;
  const brief={ theme:'Urban',date:'Dec 1 2026',startTime:'10PM',musicPolicy:'Hip Hop' };
  const first=materialize('city-nights',source,{eventName:'City Nights',eventBrief:brief,fieldMappingVersion:1});
  const system=first.cocoCompositionSystem;
  assert.equal(system.compiledObjectOverrides.date.text,'Tuesday\n1\nDec');
  assert.equal(system.compiledObjectOverrides.doors.text,'Doors\nOpen\n10PM');
  const object=system.compiledDocument.objects.find((o:any)=>o.id==='date');
  const runs=resolveCocoCompiledTextRuns(object,system.compiledObjectOverrides.date.text)!;
  assert.equal(runs.length,3);
  assert.equal(runs[1].color,object.textRuns[1].color);
  assert.ok(runs[1].fontSizePx! > runs[0].fontSizePx! * 2);
  assert.equal(system.compiledObjectOverrides['music-policy'].top,undefined);
  system.compiledObjectOverrides.headline={...system.compiledObjectOverrides.headline,top:25,y:25};
  const edited=materialize('city-nights',first,{eventName:'City Nights',eventBrief:{...brief,startTime:'9PM'},fieldMappingVersion:1});
  assert.equal(edited.cocoCompositionSystem.compiledObjectOverrides.headline.top,25);
  assert.equal(edited.cocoEventBrief.date,brief.date);
});

for (const recipe of recipes) test(`${recipe.recipeId}: filled form preserves authored text styling in both formats`, () => {
  const chosen=Object.fromEntries(['square','story'].map(format=>[format,materialize(recipe.recipeId,recipe.formats[format],{eventName:'City Nights',eventBrief:{theme:'Urban'},fieldMappingVersion:1})]));
  const cap=cocoRecipeFormCapabilities(recipe.recipeId,chosen);
  const brief={theme:'Urban',fieldFormats:cap.fieldFormats,recipeFieldBindings:cap.bindings,...Object.fromEntries(cap.fields.map(key=>[key,key==='date'?'Dec 1 2026':key==='qrDestination'?'https://example.com/event':key==='startTime'||key==='endTime'?'7PM':'New']))};
  for (const format of ['square','story']) {
    const final=materialize(recipe.recipeId,chosen[format],{eventName:'City Nights',eventBrief:brief,fieldMappingVersion:1});
    assert.deepEqual(final.cocoFormMappingReport.unplacedFields,[]);
    assert.deepEqual(final.cocoEventBrief,brief);
    for (const original of (recipe.formats[format].cocoCompositionSystem.compiledDocument?.objects ?? []).filter((o:any)=>o.kind==='text')) {
      const actual=final.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id===original.id);
      assert.deepEqual(actual.typography,original.typography);
      assert.deepEqual(actual.paint,original.paint);
      assert.deepEqual(actual.textRuns,original.textRuns);
      assert.deepEqual(actual.bounds,original.bounds);
      const live=final.cocoCompositionSystem.compiledObjectOverrides[original.id];
      if (!live?.text) continue;
      const letters=String(recipe.formats[format].cocoCompositionSystem.compiledObjectOverrides?.[original.id]?.text ?? original.text ?? '').replace(/[^a-z]/gi,'');
      if (letters.length>1 && letters===letters.toUpperCase()) assert.equal(live.text,live.text.toUpperCase(),`${format}/${original.id}: casing`);
    }
  }
});
