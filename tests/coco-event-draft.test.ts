import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeCocoEventDraft } from '../lib/coco/eventDraft.ts';

test('changing designs keeps facts the intermediate design cannot display', () => {
  const original = { venueName: 'CLUB NOVA', dressCode: 'ALL WHITE', date: 'Oct 24 2026' };
  const throughLimitedDesign = mergeCocoEventDraft(original, { venueName: '', dressCode: '', date: 'Oct 25 2026' }, ['date']);
  assert.deepEqual(throughLimitedDesign, { ...original, date: 'Oct 25 2026' });
});

test('clearing an available answer stays cleared across design changes', () => {
  assert.equal(mergeCocoEventDraft({ venueName: 'CLUB NOVA' }, { venueName: '' }, ['venueName']).venueName, '');
});

test('recipe routing is not copied across designs and social choices follow the answer', () => {
  const next = mergeCocoEventDraft({ socialPlatforms: ['instagram'] }, {
    socials: '@nova', socialPlatforms: ['tiktok'], recipeFieldBindings: {}, fieldFormats: { socials: ['story'] },
  }, ['socials']);
  assert.deepEqual(next, { socials: '@nova', socialPlatforms: ['tiktok'] });
});
