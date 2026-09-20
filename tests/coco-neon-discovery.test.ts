import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COCO_CURATED_ART_DIRECTION_LIBRARY as directions } from '../components/coco/artDirections/library.ts';
import { cocoHeadlineMatches, cocoHeadlineAssignments, cocoThemeAllowsRecipe } from '../lib/coco/recipeCompatibility.ts';
import { rankCocoMatchingDirections, buildCocoRecipeChoicePage } from '../lib/coco/recipeChoices.ts';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const formats = (id: string) => recipes.find((r: any) => r.recipeId === id)?.formats;

test('Neon Glow offers Glow in the Dark first and retains every compatible Neon result', () => {
  const composer = { eventName: 'neon glow', eventBrief: { theme: 'Neon' } };
  const ranked = rankCocoMatchingDirections(directions, composer, formats);
  assert.equal(ranked[0].visualRecipeId, 'glow-in-the-dark');
  assert.ok(ranked.length > 5, 'more matching directions remain discoverable');
  assert.ok(ranked.every(d => !d.containsSubject && cocoHeadlineMatches(d.visualRecipeId!, formats(d.visualRecipeId!), composer.eventName)));
  const generic = rankCocoMatchingDirections(directions, { ...composer, eventName: 'Nova Night' }, formats);
  assert.equal(generic[0].visualRecipeId, 'glow-in-the-dark', 'curated Neon preference wins over weak name overlaps');
  assert.equal(rankCocoMatchingDirections(directions, { ...composer, eventName: 'Pulse Sunday' }, formats)[0].visualRecipeId, 'pulse', 'strong explicit event matches stay relevant');
  assert.equal(cocoThemeAllowsRecipe('Neon', 'zona-de-perreo'), true, 'purple neon chrome also belongs in Neon');
  assert.equal(cocoThemeAllowsRecipe('Neon', 'karaoke-night'), false, 'a venue named Neon Lounge is not evidence of neon artwork');
});

test('Glow uses two main words and an optional title connector without changing its typography', () => {
  const source = formats('glow-in-the-dark');
  const fields = cocoRecipeFormCapabilities('glow-in-the-dark', source);
  assert.deepEqual(fields.bindings.dressCode.targets.square, ['genres']);
  assert.deepEqual(fields.bindings.eventDetails.targets.square, ['bucket']);
  assert.equal(fields.bindings.eventDetails.label, 'Motto');
  assert.ok(!fields.fields.includes('bottleSpecials'));
  assert.ok(!fields.fields.includes('musicPolicy'));
  for (const name of ['Neon Glow', 'Glow After Dark', 'Glow In The Dark']) assert.equal(cocoHeadlineMatches('glow-in-the-dark', source, name), true);
  for (const name of ['Glow', 'A Much Longer Event Name']) assert.equal(cocoHeadlineMatches('glow-in-the-dark', source, name), false);
  for (const format of ['square', 'story']) {
    assert.deepEqual(cocoHeadlineAssignments('glow-in-the-dark', source[format], 'Neon Glow'), { headline: 'Neon', connector: '', subtitle: 'Glow' });
    assert.deepEqual(cocoHeadlineAssignments('glow-in-the-dark', source[format], 'Glow In The Dark'), { headline: 'Glow', connector: 'In The', subtitle: 'Dark' });
    const preview = materialize('glow-in-the-dark', source[format], { eventName: 'neon glow', eventBrief: { theme: 'Neon' }, fieldMappingVersion: 1 });
    const caps = cocoRecipeFormCapabilities('glow-in-the-dark', { [format]: preview });
    assert.ok(!caps.fields.includes('recipe:connector'), 'title connector must not be requested again as event details');
    const brief = cocoBriefForCapabilities({ theme: 'Neon', venueName: 'Club Nova' }, caps);
    const final = materialize('glow-in-the-dark', preview, { eventName: 'neon glow', eventBrief: brief, fieldMappingVersion: 1 });
    const edits = final.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(edits.headline.text, 'NEON');
    assert.equal(edits.subtitle.text, 'GLOW');
    assert.equal(edits.connector.text, '');
    assert.deepEqual(final.cocoFormMappingReport.unplacedFields, []);
    for (const id of ['headline', 'subtitle']) {
      const original = source[format].cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === id);
      const actual = final.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === id);
      assert.deepEqual(actual, original);
    }
  }
});

test('show more continues past five, skips failures, and never repeats a choice', async () => {
  const tried: number[] = [];
  const build = async (n: number) => { tried.push(n); if (n === 2 || n === 8) throw new Error('Unavailable'); return n; };
  const first = await buildCocoRecipeChoicePage(Array.from({ length: 12 }, (_, i) => i), build);
  assert.deepEqual(first.choices, [0, 1, 3, 4, 5]);
  assert.deepEqual(first.remaining, [6, 7, 8, 9, 10, 11]);
  const second = await buildCocoRecipeChoicePage(first.remaining, build);
  assert.deepEqual(second.choices, [6, 7, 9, 10, 11]);
  assert.deepEqual(second.remaining, []);
  assert.equal(new Set(tried).size, tried.length);
  const failed = await buildCocoRecipeChoicePage([2, 8], build);
  assert.deepEqual(failed.choices, []);
  assert.deepEqual(failed.remaining, []);
  assert.deepEqual(failed.failures, ['Unavailable']);
});
