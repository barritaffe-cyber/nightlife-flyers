import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoCompiledTextControl, cocoCompiledTextEdit } from '../lib/coco/compiledTextEditing.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { withCompiledEditorText } from '../lib/coco/compiledTextSelection.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const visibleText = (variant: any, object: any) => compiledObjectValue(variant.cocoCompositionSystem.compiledObjectOverrides ?? {}, compiledPreviewFields(variant), object, 'text', object.text);
const withoutText = (edit: Record<string, any>) => Object.fromEntries(Object.entries(edit).filter(([key]) => key !== 'text' && key !== 'cocoEditorText'));

test('Space Neon can add a DJ label and venue without replacing its lineup or address', () => {
  const recipe = recipes.find((r: any) => r.recipeId === 'space-neon');
  for (const format of ['square','story']) {
    let v = materialize(recipe.recipeId, recipe.formats[format], {eventName:'Space Neon',fieldMappingVersion:1,eventBrief:{theme:'Neon',djs:'DJ NOVA',address:'NIGHT AVE'}});
    const original = structuredClone(v.cocoCompositionSystem.compiledDocument);
    for (const [field, text] of [['djLineupLabel','MUSIC BY'],['venue','CLUB NOVA']]) {
      const owner = cocoCompiledTextControl(v,field,'address');
      assert.ok(owner?.editorCompanion,field);
      assert.equal(visibleText(v,owner),'');
      v = JSON.parse(JSON.stringify({...v,...cocoCompiledTextEdit(v,owner,text)}));
      assert.equal(visibleText(v,cocoCompiledTextControl(v,field)),text);
      assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.address.text,'NIGHT AVE');
      assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.lineup.text,'DJ NOVA');
    }
    assert.deepEqual(v.cocoCompositionSystem.compiledDocument,original);
  }
});

test('editor companion generation is stable across every recipe and never changes authored objects', () => {
  for (const recipe of recipes) for (const format of ['square','story']) {
    const system=recipe.formats?.[format]?.cocoCompositionSystem;
    if (!system?.compiledDocument) continue;
    const before=JSON.stringify(system);
    const objects=withCompiledEditorText(system);
    assert.equal(new Set(objects.map((o:any)=>o.id)).size,objects.length,`${recipe.recipeId}/${format}`);
    assert.equal(JSON.stringify(system),before);
    for (const object of objects.filter((o:any)=>o.editorCompanion)) {
      assert.equal(object.text,'');
      assert.equal(compiledObjectValue({},recipe.formats[format],object,'text',object.text),'');
      assert.ok(object.bounds.y>=0 && object.bounds.y+object.bounds.height<=100);
      assert.equal(objects.filter((o:any)=>o.kind==='text'&&o.binding?.text===object.binding.text).length,1);
    }
  }
});

test('a loaded Coco headline edits the rendered override, including clearing and reload', () => {
  const recipe = recipes.find((r: any) => r.recipeId === 'glow-in-the-dark');
  for (const format of ['square', 'story']) {
    let v = materialize('glow-in-the-dark', recipe.formats[format], { eventName:'Neon Glow', fieldMappingVersion:1, eventBrief:{theme:'Neon',presenterName:'Club',dressCode:'Wear white'} });
    const original = structuredClone(v);
    const title = cocoCompiledTextControl(v, 'headline', 'headline');
    assert.equal(visibleText(v, title), 'NEON');
    for (const text of ['NOVA', '', 'NOVA\nNIGHT']) {
      v = JSON.parse(JSON.stringify({ ...v, ...cocoCompiledTextEdit(v, title, text) }));
      assert.equal(visibleText(v, title), text);
      assert.equal(v.headline, text);
      assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.subtitle.text, 'GLOW');
      assert.deepEqual(v.cocoCompositionSystem.compiledDocument, original.cocoCompositionSystem.compiledDocument);
      assert.deepEqual(v.cocoAuthoredText, original.cocoAuthoredText);
      const style = withoutText(v.cocoCompositionSystem.compiledObjectOverrides.headline);
      const savedStyle = withoutText(original.cocoCompositionSystem.compiledObjectOverrides.headline);
      assert.deepEqual(style, JSON.parse(JSON.stringify(savedStyle)));
    }
  }
});

test('selected fragments and neighboring inputs resolve to their own text objects', () => {
  const v = recipes.find((r: any) => r.recipeId === 'glow-in-the-dark').formats.square;
  assert.equal(cocoCompiledTextControl(v, 'date', 'month').id, 'month');
  assert.equal(cocoCompiledTextControl(v, 'time', 'month').id, 'time');
  assert.equal(cocoCompiledTextControl(v, 'presenter', 'presents').id, 'presents');
  assert.equal(cocoCompiledTextControl(v, 'head2', 'subtitle').id, 'subtitle');
  assert.equal(cocoCompiledTextControl(v, 'details', 'bucket').id, 'bucket');
  assert.equal(cocoCompiledTextControl(v, 'headline', 'bucket').id, 'headline');
  assert.equal(cocoCompiledTextControl({}, 'headline'), undefined);
});

test('headline echoes update together while independent fragments stay separate', () => {
  const objects = [
    {id:'headline',kind:'text',semanticRole:'headline',text:'OLD',binding:{text:'headline'}},
    {id:'echo',kind:'text',semanticRole:null,editable:false,text:'OLD',binding:{text:'headline'}},
    {id:'day',kind:'text',semanticRole:'day',text:'FRI',binding:{text:'date'}},
    {id:'month',kind:'text',semanticRole:'month',text:'OCT',binding:{text:'date'}},
  ];
  const v = {cocoCompositionSystem:{compiledDocument:{objects},compiledObjectOverrides:{echo:{text:'OLD',alpha:.2},month:{text:'OCT'}}}};
  const edited = {...v,...cocoCompiledTextEdit(v, objects[0], 'NEW')};
  assert.equal(visibleText(edited, objects[1]), 'NEW');
  assert.equal(edited.cocoCompositionSystem.compiledObjectOverrides.echo.alpha, .2);
  const fragment = {...v,...cocoCompiledTextEdit(v, objects[2], 'SAT')};
  assert.equal(visibleText(fragment, objects[2]), 'SAT');
  assert.equal(visibleText(fragment, objects[3]), 'OCT');
  assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.echo.text, 'OLD');
});

test('Pulse decorative titles follow Fine Tune in both formats', () => {
  const recipe = recipes.find((r: any) => r.recipeId === 'pulse');
  for (const format of ['square','story']) {
    const v = materialize('pulse',recipe.formats[format],{eventName:'Pulse Sunday',fieldMappingVersion:1,eventBrief:{theme:'Neon'}});
    const headline = cocoCompiledTextControl(v,'headline','headline');
    const next = {...v,...cocoCompiledTextEdit(v,headline,'FRIDAY')};
    for (const object of v.cocoCompositionSystem.compiledDocument.objects.filter((o: any)=>o.binding?.text==='headline')) {
      assert.equal(visibleText(next,object),'FRIDAY',`${format}/${object.id}`);
    }
    assert.equal(next.cocoCompositionSystem.compiledObjectOverrides.pulse.text,v.cocoCompositionSystem.compiledObjectOverrides.pulse.text);
  }
});

for (const recipe of recipes) for (const format of ['square', 'story']) {
  const v = recipe.formats?.[format];
  const objects = v?.cocoCompositionSystem?.compiledDocument?.objects?.filter((o: any) => o.kind === 'text') ?? [];
  if (!objects.length) continue;
  test(`${recipe.recipeId}/${format}: every compiled text object accepts a persisted edit without altering its style`, () => {
    for (const object of objects) {
      const source = {...v,cocoCompositionSystem:{...v.cocoCompositionSystem,compiledObjectOverrides:{...v.cocoCompositionSystem.compiledObjectOverrides,[object.id]:{...v.cocoCompositionSystem.compiledObjectOverrides?.[object.id],text:'SAVED TEXT'}}}};
      const before = JSON.stringify(source);
      const next = JSON.parse(JSON.stringify({...source,...cocoCompiledTextEdit(source,object,'Edited\ncopy')}));
      assert.equal(visibleText(next,object),'Edited\ncopy',object.id);
      assert.equal(JSON.stringify(source),before,'source remains unchanged');
      assert.deepEqual(next.cocoCompositionSystem.compiledDocument,source.cocoCompositionSystem.compiledDocument);
      const style = withoutText(next.cocoCompositionSystem.compiledObjectOverrides[object.id]);
      const savedStyle = withoutText(source.cocoCompositionSystem.compiledObjectOverrides[object.id]);
      assert.deepEqual(style,savedStyle);
    }
  });
}
