import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COCO_CURATED_ART_DIRECTION_LIBRARY as directions } from '../components/coco/artDirections/library.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { buildCocoRecipeChoices, isCocoRecipeChoiceEligible } from '../lib/coco/recipeChoices.ts';
import { materializeCocoPortableRecipeVariant as materialize, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));

test('portrait choices reject baked-in models and layouts missing a portrait in either format', () => {
  const direction = directions.find(d => d.visualRecipeId === 'black-gold-party')!;
  const composer = { subjectDataUrl: '/my-portrait.png' };
  const portrait = { cocoCompiledObjectId: 'subject', url: '/original.png' };
  assert.equal(isCocoRecipeChoiceEligible(direction, composer, {
    square: { portraits: [] }, story: { portraits: [] },
  }), false);
  assert.equal(isCocoRecipeChoiceEligible(direction, composer, {
    square: { portraits: [portrait] }, story: { portraits: [] },
  }), false);
  assert.equal(isCocoRecipeChoiceEligible(direction, composer, {
    square: { portraits: [portrait] }, story: { portraits: [portrait] },
  }), true);
});

test('a portrait request can produce five directions with portrait support and a usable details form', async () => {
  const composer = { eventName: 'Nova Nights', eventBrief: {}, fieldMappingVersion: 1 as const, subjectDataUrl: '/my-portrait.png', recipeSubjectDataUrl: '/my-portrait.png', subjectDecision: { intent: 'user', quality: 'strong' } as const };
  const eligible = directions.filter(d => isCocoRecipeChoiceEligible(d, composer, recipes.find((r: any) => r.recipeId === d.visualRecipeId)?.formats)).filter(d => cocoRecipeFormCapabilities(d.visualRecipeId!, recipes.find((r: any) => r.recipeId === d.visualRecipeId)?.formats ?? {}).fields.length);
  assert.ok(eligible.length >= 5);
  const choices = await buildCocoRecipeChoices(eligible, async d => {
    const recipe = recipes.find((r: any) => r.recipeId === d.visualRecipeId);
    const formats = Object.fromEntries(['square', 'story'].map(format => [format, materialize(d.visualRecipeId as CocoPortableRecipeId, recipe.formats[format], composer)]));
    for (const v of Object.values(formats)) {
      assert.ok(v.portraits.some((a: any) => a.url === composer.subjectDataUrl), `${d.id}: selected portrait must be placed`);
    }
    return { id: d.id, formats };
  });
  assert.equal(choices.length, 5);
  assert.equal(new Set(choices.map(c => c.id)).size, 5);
});

test('the guided details stage completes both formats without disturbing assets or storing sample copy', () => {
  const r = recipes.find((r: any) => r.recipeId === 'dodge-night-rides');
  const composer = { eventName: 'Beat Therapy', eventBrief: {}, fieldMappingVersion: 1 as const };
  for (const format of ['square', 'story']) {
    const chosen = materialize('dodge-night-rides', r.formats[format], composer);
    const brief = { venueName: 'The Loft', date: 'Dec 1 2026', djs: 'DJ Flip\nDJ Flop' };
    const finished = materialize('dodge-night-rides', chosen, { ...composer, eventBrief: brief });
    assert.deepEqual(finished.cocoEventBrief, brief);
    assert.deepEqual(finished.cocoFormMappingReport.unplacedFields, []);
    assert.deepEqual(finished.portraits, chosen.portraits);
    assert.equal(finished.cocoDetailsPanelBox, null);
  }
});
