import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COCO_CURATED_ART_DIRECTION_LIBRARY as directions } from '../components/coco/artDirections/library.ts';
import { COCO_THEMES, cocoHeadlineMatches, cocoHeadlineAssignments } from '../lib/coco/recipeCompatibility.ts';
import { rankCocoMatchingDirections, buildCocoRecipeChoices } from '../lib/coco/recipeChoices.ts';
import { materializeCocoPortableRecipeVariant as materialize, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const formats = (id: string) => recipes.find((r: any) => r.recipeId === id)?.formats;

test('required themes have no automatic choice and keyword matches outrank unrelated names', () => {
  assert.ok(!COCO_THEMES.some(t => /choose/i.test(t)));
  const ranked = rankCocoMatchingDirections(directions, { eventName: 'City Nights', eventBrief: { theme: 'Urban' } }, formats);
  assert.equal(ranked[0].id, 'city-nights');
  assert.ok(ranked.some(d => d.id === 'dodge-night-rides'));
  assert.ok(ranked.some(d => d.id === 'miami-street'));
  assert.ok(ranked.every(d => !d.containsSubject));
  assert.equal(rankCocoMatchingDirections(directions, { eventName: 'City Nights', eventBrief: {} }, formats).length, 0);
  const portrait = rankCocoMatchingDirections(directions, { eventName: 'Reggae Jams', eventBrief: { theme: 'Reggae / Dancehall' }, subjectDataUrl: '/portrait.png' }, formats);
  assert.deepEqual(portrait.map(d => d.id), ['reggae-jams']);
});

test('two-word names exclude one-word artwork and keep the actual title structure', () => {
  for (const id of ['summer-sunset', 'como-una-boa']) assert.equal(cocoHeadlineMatches(id, formats(id), 'City Nights'), false, id);
  assert.equal(cocoHeadlineMatches('dodge-night-rides', formats('dodge-night-rides'), 'City Nights'), true);
  assert.equal(cocoHeadlineMatches('elite-monday', formats('elite-monday'), 'City Nights'), true);
  assert.deepEqual(cocoHeadlineAssignments('elite-monday', formats('elite-monday').square, 'City Nights'), { headline: 'City Nights' });
  assert.deepEqual(cocoHeadlineAssignments('space-neon', formats('space-neon').square, 'City Nights'), { space: 'City', headline: 'Nights' });
  assert.deepEqual(cocoHeadlineAssignments('baddies-n-bundles', formats('baddies-n-bundles').square, 'Beats And Bass'), { headline: 'Beats\nBass', connector: 'And' });
});

test('new themed builds retain headline words, sizes and styles when form values change', () => {
  const id = 'dodge-night-rides';
  const chosen: Record<string, any> = {};
  for (const format of ['square', 'story']) {
    const source = formats(id)[format];
    const first = materialize(id, source, { eventName: 'City Nights', eventBrief: { theme: 'Urban' }, fieldMappingVersion: 1 });
    chosen[format] = first;
    const edited = materialize(id, first, { eventName: 'City Nights', eventBrief: { theme: 'Urban', subtitle: 'After Dark', venueName: 'The Loft', djs: 'DJ Flip\nDJ Flop' }, fieldMappingVersion: 1 });
    const overrides = edited.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(overrides.headline.text, 'City');
    assert.equal(overrides.headline2.text, 'Nights');
    assert.equal(overrides.venue.text, 'The Loft');
    for (const o of source.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.kind === 'text')) {
      assert.equal(overrides[o.id]?.size, source.cocoCompositionSystem.compiledObjectOverrides?.[o.id]?.size ?? o.typography.fontSizePx, `${format}/${o.id} size`);
      assert.equal(overrides[o.id]?.family, source.cocoCompositionSystem.compiledObjectOverrides?.[o.id]?.family, `${format}/${o.id} family`);
      assert.deepEqual(edited.cocoCompositionSystem.compiledDocument.objects.find((x: any) => x.id === o.id).typography, o.typography);
    }
  }
  // The second title word is not offered as an editable subtitle.
  const cap = cocoRecipeFormCapabilities(id, chosen);
  const titleOnly = structuredClone(chosen);
  for (const v of Object.values(titleOnly) as any[]) v.cocoCompositionSystem.compiledDocument.objects = v.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => ['headline', 'headline2'].includes(o.id));
  assert.equal(cocoRecipeFormCapabilities(id, titleOnly).fields.includes('subtitle'), false);
  assert.ok(cap.fields.includes('venueName'));
});

test('every offered field in a themed form maps in both formats without resizing text', () => {
  for (const recipe of recipes) {
    const chosen = Object.fromEntries(['square','story'].map(format => [format, materialize(recipe.recipeId as CocoPortableRecipeId, recipe.formats[format], { eventName: 'City Nights', eventBrief: { theme: 'Urban' }, fieldMappingVersion: 1 })]));
    const cap = cocoRecipeFormCapabilities(recipe.recipeId, chosen);
    const brief = { theme: 'Urban', fieldFormats: cap.fieldFormats, recipeFieldBindings: cap.bindings, ...Object.fromEntries(cap.fields.map(key => [key, key === 'qrDestination' ? 'https://example.com' : key === 'date' ? 'Dec 1 2026' : 'A'])) };
    for (const format of ['square','story']) {
      const final = materialize(recipe.recipeId as CocoPortableRecipeId, chosen[format], { eventName: 'City Nights', eventBrief: brief, fieldMappingVersion: 1 });
      assert.deepEqual(final.cocoFormMappingReport.unplacedFields, [], `${recipe.recipeId}/${format}`);
    }
  }
});

test('partial choice sets stay relevant; an empty set gives an actionable message', async () => {
  assert.deepEqual(await buildCocoRecipeChoices(['a','b'], async id => id, 5, true), ['a','b']);
  await assert.rejects(buildCocoRecipeChoices([], async id => id, 5, true), /No designs currently match/);
});

test('stale Story size controls cannot override authored typography', () => {
  const v = materialize('city-nights', formats('city-nights').story, { eventName: 'City Nights', eventBrief: { theme: 'Urban' }, fieldMappingVersion: 1 });
  assert.equal(v.headManualPx, 148.5);
  assert.equal(v.head2SizePx, 85.32);
  assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.headline2.size, 85.32);
});
