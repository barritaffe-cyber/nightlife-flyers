import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COCO_RECIPE_CATALOG } from '../lib/coco/recipeCatalog.ts';
import { COCO_CURATED_ART_DIRECTION_LIBRARY as directions } from '../components/coco/artDirections/library.ts';
import { COCO_THEMES, cocoHeadlineMatches, cocoHeadlineAssignments } from '../lib/coco/recipeCompatibility.ts';
import { rankCocoMatchingDirections, isCocoRecipeChoiceEligible } from '../lib/coco/recipeChoices.ts';
import { getVisualRecipe } from '../lib/visualRecipes.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS } from '../lib/coco/portableRecipeRuntime.ts';

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const formats = (id: string) => recipes.find((r: any) => r.recipeId === id)?.formats;

test('every registered recipe participates in categorized, loadable Coco discovery', () => {
  const ids = recipes.map((r: any) => r.recipeId);
  assert.deepEqual(new Set(Object.keys(COCO_RECIPE_CATALOG)), new Set(ids));
  assert.deepEqual(new Set(directions.map(d => d.visualRecipeId)), new Set(ids));
  assert.equal(directions.length, ids.length, 'one choice per recipe');
  for (const [id, metadata] of Object.entries(COCO_RECIPE_CATALOG)) {
    assert.ok(metadata.themes.length > 0, `${id} needs a theme`);
    assert.ok(metadata.themes.every(theme => COCO_THEMES.includes(theme)));
    assert.ok(getVisualRecipe(id), `${id} must materialize its authored recipe`);
    assert.ok(COCO_PORTABLE_RECIPE_PROJECT_URLS[id as keyof typeof COCO_PORTABLE_RECIPE_PROJECT_URLS]);
  }
});

for (const theme of COCO_THEMES) test(`${theme} has non-portrait two-word choices`, () => {
  const choices = rankCocoMatchingDirections(directions, { eventName: 'Glow Mania', eventBrief: { theme }, subjectDecision: { intent: 'none' } as any }, formats);
  assert.ok(choices.length, `${theme} must not be empty`);
  assert.ok(choices.every(d => cocoHeadlineMatches(d.visualRecipeId!, formats(d.visualRecipeId!), 'Glow Mania')));
  assert.ok(choices.every(d => !d.containsSubject));
});

test('baked people are non-portrait; editable subjects require a portrait', () => {
  for (const direction of directions) {
    const id = direction.visualRecipeId!;
    const noPortrait = isCocoRecipeChoiceEligible(direction, {}, formats(id));
    const uploaded = isCocoRecipeChoiceEligible(direction, { subjectDataUrl: '/user.png' }, formats(id));
    assert.equal(noPortrait, !direction.containsSubject, `${id}: no portrait`);
    assert.equal(uploaded, direction.containsSubject, `${id}: uploaded portrait`);
  }
  for (const id of ['neon-night-shift', 'ladies-secret', 'sugar-rush', 'ladies-night-rose']) {
    assert.equal(directions.find(d => d.visualRecipeId === id)?.containsSubject, false, id);
  }
});

test('newly discovered recipes distinguish title words, taglines and split lettering', () => {
  assert.equal(cocoHeadlineMatches('mind-state', formats('mind-state'), 'Glow Mania'), true);
  assert.deepEqual(cocoHeadlineAssignments('mind-state', formats('mind-state').square, 'Glow Mania'), { headline: 'Glow\nMania' });
  assert.equal(cocoHeadlineMatches('aura', formats('aura'), 'Glow Mania'), false);
  assert.equal(cocoHeadlineMatches('throwback-saturdays', formats('throwback-saturdays'), 'Glow Mania'), true);
  assert.deepEqual(cocoHeadlineAssignments('throwback-saturdays', formats('throwback-saturdays').square, 'Glow Mania'), { headline: 'Glow', subtag: 'Mania' });
  assert.deepEqual(cocoHeadlineAssignments('electric-sunset', formats('electric-sunset').square, 'Glow Mania'), { subtitle: 'Glow', headline: 'Man\nia' });
});

test('new recipe names participate in keyword ranking', () => {
  const choices = rankCocoMatchingDirections(directions, { eventName: 'Sugar Rush', eventBrief: { theme: 'Neon' } }, formats);
  assert.equal(choices[0].visualRecipeId, 'sugar-rush');
});
