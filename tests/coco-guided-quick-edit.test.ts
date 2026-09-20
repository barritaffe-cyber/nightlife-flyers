import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoGuidedStyle, cocoGuidedUndo, cocoQuickColorControl, cocoQuickFinishIssues, cocoGuidedField } from '../lib/coco/guidedQuickEdit.ts';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as render } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoQuickTextSizeOwners } from '../lib/coco/quickTextSizes.ts';
const recipe = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8')).find((r: any) => r.recipeId === 'slow-jamz');
const caps = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
const session = Object.fromEntries(['square', 'story'].map(format => [format, { ...render('slow-jamz', recipe.formats[format], { fieldMappingVersion: 1, eventName: 'Slow Jamz', eventBrief: cocoBriefForCapabilities({ address: 'MIAMI', date: 'Nov 7 2026' }, caps) }), format }]));
test('size and color changes are reversible without overwriting later wording or photos', () => {
  const before = structuredClone(session.square);
  before.cocoCompositionSystem.compiledObjectOverrides.headline.family = 'Anton';
  const sized = cocoGuidedStyle(before, 'headline', 'size', 100);
  const after = cocoGuidedStyle(sized, 'headline', 'color', '#00ff00');
  assert.equal(cocoQuickTextSizeOwners(after, 'eventName')[0].size, 100);
  assert.equal(cocoQuickColorControl(after, 'headline')?.color, '#00ff00');
  const current = { ...after, backgroundUrl: 'new-photo.png', cocoCompositionSystem: { ...after.cocoCompositionSystem, compiledObjectOverrides: { ...after.cocoCompositionSystem.compiledObjectOverrides, headline: { ...after.cocoCompositionSystem.compiledObjectOverrides.headline, text: 'Later wording' } } } };
  const undone = cocoGuidedUndo(current, before, after);
  assert.equal(undone.backgroundUrl, 'new-photo.png');
  assert.equal(undone.cocoCompositionSystem.compiledObjectOverrides.headline.text, 'Later wording');
  assert.equal(cocoQuickTextSizeOwners(undone, 'eventName')[0].size, cocoQuickTextSizeOwners(before, 'eventName')[0].size);
  assert.equal(cocoQuickColorControl(undone, 'headline')?.color, cocoQuickColorControl(before, 'headline')?.color);
  assert.equal(cocoGuidedField(before, 'headline', caps), 'eventName');
});
test('both-format proportional sizes preserve each composition and survive JSON roundtrip', () => {
  const sizes = ['square', 'story'].map(f => cocoQuickTextSizeOwners(session[f], 'eventName')[0].size);
  for (const [index, format] of ['square', 'story'].entries()) {
    const v = cocoGuidedStyle(session[format], 'headline', 'size', sizes[index] * 1.1);
    assert.equal(cocoQuickTextSizeOwners(JSON.parse(JSON.stringify(v)), 'eventName')[0].size, sizes[index] * 1.1);
    assert.equal(session[format].cocoCompositionSystem.compiledObjectOverrides.headline.size, sizes[index]);
  }
});
test('PNG and textured materials stay intact when color editing is unavailable', () => {
  for (const material of ['png', 'texture']) {
    const v = structuredClone(session.square), o = v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'headline');
    if (material === 'png') v.cocoCompositionSystem.compiledObjectOverrides.headline.family = 'Textured Gold Serif PNG';
    else o.paint.backgroundImage = 'url(/gold-texture.png)';
    assert.equal(cocoQuickColorControl(v, 'headline')?.locked, true);
    assert.equal(cocoGuidedStyle(v, 'headline', 'color', '#00ff00'), v);
    assert.equal(cocoQuickTextSizeOwners(cocoGuidedStyle(v, 'headline', 'size', 120), 'eventName')[0].size, 120);
  }
});
test('finish checks flag only supported blank dates and visible editable text outside the canvas', () => {
  const v = structuredClone(session);
  assert.ok(!cocoQuickFinishIssues(v).some(i => i.kind === 'date'));
  for (const id of caps.bindings.date.targets.square ?? []) v.square.cocoCompositionSystem.compiledObjectOverrides[id] = { ...v.square.cocoCompositionSystem.compiledObjectOverrides[id], text: '' };
  v.story.cocoCompositionSystem.compiledObjectOverrides.headline.left = -10;
  const issues = cocoQuickFinishIssues(v);
  assert.ok(issues.some(i => i.format === 'square' && i.kind === 'date'));
  assert.ok(!issues.some(i => i.format === 'story' && i.kind === 'date'));
  assert.ok(issues.some(i => i.format === 'story' && i.field === 'eventName' && i.kind === 'bounds'));
  v.story.cocoCompositionSystem.compiledObjectOverrides.headline.removed = true;
  assert.ok(!cocoQuickFinishIssues(v).some(i => i.format === 'story' && i.field === 'eventName'));
});
