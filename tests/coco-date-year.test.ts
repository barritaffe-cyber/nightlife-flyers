import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { authoredStackedDate, cocoDisplayDate } from '../lib/coco/authoredFormText.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';

test('date display removes only the year and its dangling separators', () => {
  for (const [input, expected] of [
    ['Nov 7, 2026', 'Nov 7'], ['2026-11-07', '11-07'], ['11/07/2026', '11/07'],
    ['2026, Nov 7', 'Nov 7'], ['SAT\nNOV\n07\n2026', 'SAT\nNOV\n07'],
    ['Nov 7', 'Nov 7'], ['Every Friday', 'Every Friday'], ['', ''], ['2026', ''],
  ]) assert.equal(cocoDisplayDate(input), expected);
  assert.equal(authoredStackedDate('SAT\nNOV\n07\n2025', 'Nov 7, 2026', { day: '7', month: 'NOV', weekday: 'SATURDAY' }), 'SAT\nNOV\n07');
});

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
for (const recipe of recipes) test(`${recipe.recipeId}: the form retains the year but neither format paints it`, () => {
  const capabilities = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
  for (const format of ['square', 'story']) {
    const source = recipe.formats[format];
    const before = JSON.stringify(source);
    const brief = { theme: 'Urban', date: 'Nov 7, 2026', fieldFormats: capabilities.fieldFormats, recipeFieldBindings: capabilities.bindings };
    const variant = materialize(recipe.recipeId, source, { eventName: source.headline || 'Party', eventBrief: brief, fieldMappingVersion: 1 });
    assert.equal(variant.cocoEventBrief.date, brief.date);
    const system = variant.cocoCompositionSystem;
    for (const object of system?.compiledDocument?.objects ?? []) {
      if (object.kind !== 'text') continue;
      const edit = system.compiledObjectOverrides?.[object.id];
      if (!edit?.cocoFormFields?.includes('date')) continue;
      const text = compiledObjectValue(system.compiledObjectOverrides, compiledPreviewFields(variant), object, 'text', object.text);
      assert.doesNotMatch(String(text), /\b\d{4}\b/, `${format}/${object.id}`);
    }
    assert.equal(JSON.stringify(source), before, 'the authored master is unchanged');
  }
});

test('changing only the year updates the derived weekday while keeping the year off the flyer', () => {
  const recipe = recipes.find((r: any) => r.recipeId === 'city-nights');
  for (const format of ['square', 'story']) {
    let variant = recipe.formats[format];
    for (const [year, weekday] of [[2026, 'Saturday'], [2027, 'Sunday']] as const) {
      variant = materialize('city-nights', variant, { eventName: 'City Nights', eventBrief: { theme: 'Urban', date: `Nov 7, ${year}` }, fieldMappingVersion: 1 });
      assert.equal(variant.cocoEventBrief.date, `Nov 7, ${year}`);
      assert.equal(variant.cocoCompositionSystem.compiledObjectOverrides.date.text, `${weekday}\n7\nNov`);
    }
  }
});
