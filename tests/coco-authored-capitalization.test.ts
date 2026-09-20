import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authoredFormText } from '../lib/coco/authoredFormText.ts';
import { cocoBriefForCapabilities, cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';

test('capitalization follows the saved design independently of input case', () => {
  const examples = [
    ['ENJOY 15% OFF', 'Save on entry', 'SAVE ON ENTRY'],
    ['Ladies', 'summers', 'Summers'],
    ['Club Woods', 'ocean lounge', 'Ocean Lounge'],
    ['baressito', 'OCEAN LOUNGE', 'ocean lounge'],
    ['Keep the date', 'SAVE THE DATE', 'Save the date'],
    ['A Different Kind of Saturday', 'a new kind of night', 'A New Kind of Night'],
    ['DJ Hype X\nDJ Kenzo', 'dj flip\ndj flop', 'DJ Flip\nDJ Flop'],
    ['DJ Ab', 'dj jo', 'DJ Jo'],
    ['Doors Open\n5PM', 'doors open\n9pm', 'Doors Open\n9PM'],
    ['oFFSHORE', 'FESTIVAL', 'fESTIVAL'],
    ['MOJITo', 'FESTIVAL', 'FESTIVAl'],
    ['Élite Lounge', 'café nights', 'Café Nights'],
  ];
  for (const [saved, value, expected] of examples) {
    assert.equal(authoredFormText(saved, value.toLowerCase()), expected);
    assert.equal(authoredFormText(saved, value.toUpperCase()), expected);
    assert.equal(authoredFormText(saved, expected), expected, 'repeated edits retain formatting');
  }
});

test('formatting preserves functional link/email case, whitespace, and punctuation', () => {
  assert.equal(authoredFormText('VISIT US', 'https://Example.com/TicketAbC'), 'https://Example.com/TicketAbC');
  assert.equal(authoredFormText('CONTACT US', 'Team@Example.com'), 'Team@Example.com');
  assert.equal(authoredFormText('Club Woods', '  OCEAN\nLOUNGE!  '), '  Ocean\nLounge!  ');
  assert.equal(authoredFormText('$25', '$35'), '$35');
  assert.equal(authoredFormText('Ladies', ''), '');
});

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
test('mixed input case paints authored headline and field styles in both formats while saving the raw answers', () => {
  const master = recipes.find((r: any) => r.recipeId === 'city-nights');
  const caps = cocoRecipeFormCapabilities('city-nights', master.formats);
  const brief = cocoBriefForCapabilities({ theme: 'Urban', venueName: 'oCEAN lOUNGE', presenterName: 'nOVA eVENTS', djs: 'dJ fLIP\nDj fLOP', startTime: '9pm' }, caps);
  const result: Record<string, any> = {};
  for (const format of ['square', 'story']) {
    const first = materialize('city-nights', master.formats[format], { eventName: 'cItY nIgHtS', eventBrief: brief, fieldMappingVersion: 1 });
    const o = first.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(o.headline.text, 'City');
    assert.equal(o.headline2.text, 'Nights');
    assert.equal(o.venue.text, 'Ocean Lounge');
    assert.equal(o.presenter.text, 'Nova Events Presents');
    assert.equal(o['dj-lineup'].text, 'DJ Flip\nDJ Flop');
    assert.equal(o.doors.text, 'Doors\nOpen\n9PM');
    assert.equal(first.cocoEventBrief.venueName, 'oCEAN lOUNGE');
    const restored = JSON.parse(JSON.stringify(first));
    result[format] = materialize('city-nights', restored, { eventName: 'CITY NIGHTS', eventBrief: { ...brief, venueName: 'OCEAN LOUNGE' }, fieldMappingVersion: 1 });
    assert.equal(result[format].cocoCompositionSystem.compiledObjectOverrides.venue.text, 'Ocean Lounge');
    assert.deepEqual(result[format].cocoCompositionSystem.compiledObjectOverrides.venue.size, o.venue.size);
  }
  assert.deepEqual(cocoRecipeFormCapabilities('city-nights', result), caps, 'saved wording plus ten still determines limits');
});
