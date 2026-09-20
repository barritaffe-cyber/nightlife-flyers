import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities, cocoBriefForFormat } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const reggae = recipes.find((r: any) => r.recipeId === 'reggae-jams');

test('visible text allowances use the authored length plus ten and stay stable after editing', () => {
  const caps = cocoRecipeFormCapabilities(reggae.recipeId, reggae.formats);
  for (const format of ['square', 'story'] as const) {
    const presenter = reggae.formats[format].cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'presenter');
    assert.equal(caps.byFormat[format].presenterName.maxLength, presenter.text.length + 10);
  }
  const original = reggae.formats.story.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'dressCode');
  assert.equal(caps.limits.dressCode.maxLength, original.text.length + 10);
  const brief = cocoBriefForCapabilities({ theme: 'Tropical', presenterName: 'A longer name', dressCode: 'White on jeans' }, caps);
  const result = Object.fromEntries(['square', 'story'].map(format => [format, materialize('reggae-jams', reggae.formats[format], { eventName: 'Reggae Jams', eventBrief: brief, fieldMappingVersion: 1 })]));
  assert.deepEqual(cocoRecipeFormCapabilities('reggae-jams', result), caps, 'limits never grow from user-entered copy');
});

test('Story-only dress code is saved, rendered only on Story, editable and clearable', () => {
  const caps = cocoRecipeFormCapabilities('reggae-jams', reggae.formats);
  assert.deepEqual(caps.fieldFormats.dressCode, ['story']);
  const brief = cocoBriefForCapabilities({ theme: 'Tropical', dressCode: 'White on jeans', venueName: 'The Loft' }, caps);
  for (const format of ['square', 'story']) {
    const first = materialize('reggae-jams', reggae.formats[format], { eventName: 'Reggae Jams', eventBrief: brief, fieldMappingVersion: 1 });
    const edits = first.cocoCompositionSystem.compiledObjectOverrides;
    const visibleDress = Object.values(edits).filter((o: any) => !o.removed && o.text && o.cocoFormFields?.includes('dressCode'));
    assert.equal(visibleDress.length > 0, format === 'story');
    assert.deepEqual(first.cocoFormMappingReport.unplacedFields, []);
    assert.equal(first.cocoEventBrief.dressCode, brief.dressCode, 'full brief survives format switching');
    const restored = JSON.parse(JSON.stringify(first));
    const updated = materialize('reggae-jams', restored, { eventName: 'Reggae Jams', eventBrief: { ...restored.cocoEventBrief, dressCode: 'All white' }, fieldMappingVersion: 1 });
    assert.equal(updated.cocoCompositionSystem.compiledObjectOverrides.dressCode.text.includes('ALL WHITE'), format === 'story');
    const cleared = materialize('reggae-jams', updated, { eventName: 'Reggae Jams', eventBrief: { ...brief, dressCode: '' }, fieldMappingVersion: 1 });
    assert.equal(cleared.cocoCompositionSystem.compiledObjectOverrides.dressCode.text, '');
    assert.equal(cleared.cocoCompositionSystem.compiledObjectOverrides.dressBrush.removed, true);
  }
});

test('shared limits use the smaller format while Square-only fields remain available', () => {
  const formats = structuredClone(recipes.find((r: any) => r.recipeId === 'dodge-night-rides').formats);
  const squareVenue = formats.square.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'venue');
  const storyVenue = formats.story.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'venue');
  squareVenue.text = 'Club House'; storyVenue.text = 'Loft';
  assert.equal(cocoRecipeFormCapabilities('dodge-night-rides', formats).limits.venueName.maxLength, 14);
  formats.story.cocoCompositionSystem.compiledObjectOverrides.venue = { removed: true };
  const caps = cocoRecipeFormCapabilities('dodge-night-rides', formats);
  assert.deepEqual(caps.fieldFormats.venueName, ['square']);
  assert.equal(caps.limits.venueName.maxLength, 20);
  const brief = cocoBriefForCapabilities({ venueName: 'My venue', email: 'stale@example.com' }, caps);
  assert.equal(brief.email, '');
  assert.equal(cocoBriefForFormat(brief, 'square').venueName, 'My venue');
  assert.equal(cocoBriefForFormat(brief, 'story').venueName, undefined);
});

test('format routing also excludes QR links, captions, social icons and dates from the other canvas', () => {
  const brief = { date: 'Dec 1 2026', qrDestination: 'https://example.com', qrLabel: 'Tickets', socials: '@theclub', socialPlatforms: ['instagram'], fieldFormats: { date: ['story'], qrDestination: ['story'], qrLabel: ['story'], socials: ['story'] } } as const;
  const square = cocoBriefForFormat(structuredClone(brief) as any, 'square');
  assert.equal(square.date, undefined);
  assert.equal(square.qrDestination, undefined);
  assert.equal(square.qrLabel, undefined);
  assert.equal(square.socials, undefined);
  assert.deepEqual(square.socialPlatforms, []);
  assert.equal(cocoBriefForFormat(structuredClone(brief) as any, 'story').qrDestination, brief.qrDestination);
});
