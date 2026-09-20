import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities, mapCocoFormToRecipe } from '../lib/coco/formRecipeMapping.ts';
import { cocoFieldLines, cocoAuthoredFieldValue } from '../lib/coco/formFieldLayout.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoCompiledTextEdit } from '../lib/coco/compiledTextEditing.ts';

const recipes: any[] = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));

test('existing built-in copy stays in both formats across the catalog, without form questions or new objects', () => {
  let checked = 0;
  for (const recipe of recipes) {
    const caps = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
    for (const format of ['square', 'story'] as const) {
      const source = recipe.formats[format];
      const objects = source.cocoCompositionSystem.compiledDocument?.objects ?? [];
      const automatic = objects.filter((o: any) => o.kind === 'text' && (/^(mood|motto|feeling|feelings|views|napkin|vibes|presents|presents-label)$/.test(o.id) || (recipe.recipeId === 'glow-in-the-dark' && o.id === 'bucket')));
      const destinations = Object.values(caps.bindings).flatMap(b => b.targets[format] ?? []);
      const result = materialize(recipe.recipeId, source, {eventName: 'Friday Night', fieldMappingVersion: 1, eventBrief: cocoBriefForCapabilities({theme:'Urban'}, caps)});
      assert.deepEqual(result.cocoCompositionSystem.compiledDocument?.objects.map((o: any) => o.id) ?? [], objects.map((o: any) => o.id), recipe.recipeId);
      for (const o of automatic) {
        checked++;
        assert.ok(!destinations.includes(o.id), `${recipe.recipeId}/${format}/${o.id}: no input`);
        const saved = source.cocoCompositionSystem.compiledObjectOverrides?.[o.id]?.text ?? o.text ?? '';
        assert.equal(result.cocoCompositionSystem.compiledObjectOverrides[o.id]?.text ?? saved, saved, `${recipe.recipeId}/${format}/${o.id}: saved copy including blanks`);
      }
    }
  }
  assert.ok(checked > 100);
});

test('PRESENTS inside a presenter block is fixed; names remain editable', () => {
  for (const original of ['CLUB WOODS\nPRESENTS', 'CLUB WOODS PRESENTS', 'Club Woods Presents']) {
    const lines = cocoFieldLines({label:'Presenter', group:'Event details', kind:'text', targets:{square:['presenter']}, originalText:{square:original}});
    assert.equal(lines.filter(line => !line.fixed).length, 1);
    assert.equal(cocoAuthoredFieldValue(original, 'Nova Events'), original.replace(/CLUB WOODS|Club Woods/, 'Nova Events'));
  }
  const r = recipes.find(r => r.recipeId === 'beat-therapy');
  const caps = cocoRecipeFormCapabilities(r.recipeId, r.formats);
  const result = materialize(r.recipeId, r.formats.square, {eventName:'Beat Therapy',fieldMappingVersion:1,eventBrief:cocoBriefForCapabilities({presenterName:'Nova Events'},caps)});
  assert.equal(result.cocoCompositionSystem.compiledObjectOverrides.presenter.text, 'NOVA EVENTS PRESENTS');
});

test('feeling owners and stale bindings keep only existing saved copy, including removed or empty owners', () => {
  const source = {format:'square', cocoCompositionSystem:{compiledDocument:{objects:[
    {id:'feeling',kind:'text',text:'FEEL THE MUSIC'},
    {id:'mood',kind:'text',text:''},
    {id:'motto',kind:'text',text:'REMOVED MOTTO'},
  ]},compiledObjectOverrides:{motto:{removed:true}}}};
  const binding = {label:'Feeling',group:'More details',kind:'text' as const,targets:{square:['feeling']},originalText:{square:'FEEL THE MUSIC'}};
  assert.deepEqual(cocoRecipeFormCapabilities('example',{square:source}).fields, []);
  const result = mapCocoFormToRecipe('example',source,'Party',{theme:'Urban','recipe:feeling':'REPLACE',recipeFieldBindings:{'recipe:feeling':binding}},{day:'',month:'',weekday:''});
  // Mapping returns field patches; automatic owners remain normal editable text.
  assert.ok(result);
  const edits = result.system.compiledObjectOverrides;
  assert.equal(edits.feeling.text,'FEEL THE MUSIC');
  assert.equal(edits.mood.text,'');
  assert.equal(edits.motto.removed,true);
  assert.equal(edits.presents,undefined);
});

test('automatic text stays editable and keeps editor edits after save and further form changes', () => {
  const r = recipes.find(r => r.recipeId === 'bad-girls');
  const caps = cocoRecipeFormCapabilities(r.recipeId, r.formats);
  for (const format of ['square','story']) {
    const brief = cocoBriefForCapabilities({presenterName:'Nova'}, caps);
    let v = materialize(r.recipeId,r.formats[format],{eventName:'Bad Girls',fieldMappingVersion:1,eventBrief:brief});
    for (const id of ['mood','motto','presents']) {
      const object = v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === id);
      for (const text of ['Changed copy','']) {
        v = JSON.parse(JSON.stringify({...v,...cocoCompiledTextEdit(v,object,text)}));
        v = materialize(r.recipeId,v,{eventName:'Bad Girls',fieldMappingVersion:1,eventBrief:{...brief,entryFee:'30'}});
        assert.equal(v.cocoCompositionSystem.compiledObjectOverrides[id].text,text);
      }
    }
  }
});
