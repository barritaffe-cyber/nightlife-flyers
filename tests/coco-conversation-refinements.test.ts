import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoTextPalette } from '../lib/coco/conversationPalette.ts';
import { cocoAddEditorText, cocoAddedTextAppearance, cocoStyleAddedText } from '../lib/coco/editorTextObjects.ts';
import { withCompiledEditorText } from '../lib/coco/compiledTextSelection.ts';
import { cocoCompiledTextEdit } from '../lib/coco/compiledTextEditing.ts';
import { cocoRecipeFormCapabilities, mapCocoFormToRecipe } from '../lib/coco/formRecipeMapping.ts';
import { cocoGuidedUndo } from '../lib/coco/guidedQuickEdit.ts';

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const source = recipes.find((r: any) => r.recipeId === 'slow-jamz').formats.square;

test('palette changes solid text, preserves source texture/assets and undoes without losing later copy', () => {
  const before = JSON.stringify(source);
  const next = cocoTextPalette(source, 'rose');
  assert.notDeepEqual(next.cocoCompositionSystem.compiledObjectOverrides, source.cocoCompositionSystem.compiledObjectOverrides);
  assert.equal(next.cocoCompositionSystem.compiledDocument, source.cocoCompositionSystem.compiledDocument);
  assert.equal(next.textFx, source.textFx);
  for (const object of source.cocoCompositionSystem.compiledDocument.objects) {
    if (object.kind !== 'text' || object.paint?.backgroundImage && object.paint.backgroundImage !== 'none') {
      assert.deepEqual(next.cocoCompositionSystem.compiledObjectOverrides?.[object.id], source.cocoCompositionSystem.compiledObjectOverrides?.[object.id]);
    }
  }
  const current = { ...next, venue: 'NEW VENUE' };
  const undone = cocoGuidedUndo(current, source, next);
  assert.equal(undone.venue, 'NEW VENUE');
  for (const object of withCompiledEditorText(source.cocoCompositionSystem)) {
    assert.equal(undone.cocoCompositionSystem.compiledObjectOverrides?.[object.id]?.color, source.cocoCompositionSystem.compiledObjectOverrides?.[object.id]?.color);
  }
  assert.equal(JSON.stringify(source), before);
});

test('new text remains independent through form updates, wording edits and project JSON roundtrips', () => {
  const added = cocoAddEditorText(source, 'user-text-test');
  const second = cocoAddEditorText(added, 'user-text-second');
  const object = withCompiledEditorText(second.cocoCompositionSystem).find(o => o.id === 'user-text-test');
  assert.ok(object);
  assert.equal(object.text, '', 'new details have no saved placeholder text');
  assert.equal(second.cocoCompositionSystem.editorTextObjects.length, 2);
  assert.equal(second.cocoCompositionSystem.compiledDocument, source.cocoCompositionSystem.compiledDocument);
  const changed = { ...second, ...cocoCompiledTextEdit(second, object, 'DOORS OPEN AT NINE') };
  const caps = cocoRecipeFormCapabilities('slow-jamz', { square: changed });
  assert.ok(!Object.values(caps.bindings).some(binding => binding.targets.square?.includes(object.id)));
  const mapped = mapCocoFormToRecipe('slow-jamz', changed, 'Slow Jamz', { date: 'Nov 7 2026', venueName: 'VELVET', recipeFieldBindings: caps.bindings }, { day: '07', month: 'NOV', weekday: 'SAT' });
  const reopened = JSON.parse(JSON.stringify({ ...changed, cocoCompositionSystem: mapped.system }));
  assert.equal(withCompiledEditorText(reopened.cocoCompositionSystem).filter(o => o.editorAdded).length, 2);
  assert.equal(reopened.cocoCompositionSystem.compiledObjectOverrides[object.id].text, 'DOORS OPEN AT NINE');
  assert.equal(source.cocoCompositionSystem.editorTextObjects, undefined);
});


test('advanced added-text appearance stays independent and survives form updates and project reload', () => {
  const first = cocoAddEditorText(source, 'user-first');
  const second = cocoAddEditorText(first, 'user-second');
  const original = JSON.stringify(second);
  const styled = cocoStyleAddedText(second, 'user-first', {
    tracking: .08, bold: true, italic: true, uppercase: true, opacity: .6, shadowEnabled: true, shadowStrength: 3,
  });
  const object = styled.cocoCompositionSystem.editorTextObjects[0];
  assert.equal(object.typography.fontWeight, 700);
  assert.equal(object.typography.fontStyle, 'italic');
  assert.equal(object.typography.textTransform, 'uppercase');
  assert.equal(object.paint.opacity, .6);
  assert.equal(object.paint.textShadow, '0 3px 12px rgba(0,0,0,.65)');
  assert.equal(styled.cocoCompositionSystem.compiledObjectOverrides['user-first'].tracking, .08);
  assert.equal(styled.cocoCompositionSystem.editorTextObjects[1], second.cocoCompositionSystem.editorTextObjects[1]);
  assert.equal(styled.cocoCompositionSystem.compiledDocument, second.cocoCompositionSystem.compiledDocument);
  assert.equal(JSON.stringify(second), original);
  assert.equal(cocoStyleAddedText(second, 'headline', { bold: true }), second, 'authored text cannot be restyled through added controls');
  const mapped = mapCocoFormToRecipe('slow-jamz', styled, 'Slow Jamz', { venueName: 'NEW VENUE' }, { day: '07', month: 'NOV', weekday: 'SAT' });
  const reopened = JSON.parse(JSON.stringify({ ...styled, cocoCompositionSystem: mapped.system }));
  assert.deepEqual(cocoAddedTextAppearance(reopened, 'user-first'), cocoAddedTextAppearance(styled, 'user-first'));
  const noShadow = cocoStyleAddedText(reopened, 'user-first', { shadowEnabled: false });
  assert.equal(noShadow.cocoCompositionSystem.editorTextObjects[0].paint.textShadow, 'none');
  assert.equal(cocoAddedTextAppearance(noShadow, 'user-first').shadowStrength, 3);
  const zero = cocoStyleAddedText(noShadow, 'user-first', { shadowEnabled: true, shadowStrength: 0 });
  assert.equal(cocoAddedTextAppearance(zero, 'user-first').shadowEnabled, true, 'zero strength does not turn off the toggle');
  const restored = cocoStyleAddedText(zero, 'user-first', { shadowStrength: 2, bold: false, italic: false, uppercase: false });
  assert.equal(restored.cocoCompositionSystem.editorTextObjects[0].paint.textShadow, '0 2px 8px rgba(0,0,0,.65)');
  assert.deepEqual(restored.cocoCompositionSystem.editorTextObjects[0].typography, { ...object.typography, fontWeight: 400, fontStyle: 'normal', textTransform: 'none' });
});
