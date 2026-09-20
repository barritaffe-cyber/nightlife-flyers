import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
import { authoredFormText, authoredTime } from '../lib/coco/authoredFormText.ts';
import { cocoAuthoredFieldValue } from '../lib/coco/formFieldLayout.ts';

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const recipe = (id: string) => recipes.find((r: any) => r.recipeId === id);
const build = (id: string, format: string, answers: Record<string, string>) => {
  const master = recipe(id);
  const caps = cocoRecipeFormCapabilities(id, master.formats);
  return materialize(id as CocoPortableRecipeId, master.formats[format], {
    eventName: 'Pulse Sunday', fieldMappingVersion: 1,
    eventBrief: cocoBriefForCapabilities({ theme: 'Neon', ...answers }, caps),
  });
};

test('Pulse Sunday offers saved blocks, with 50 characters for event details', () => {
  const caps = cocoRecipeFormCapabilities('pulse', recipe('pulse').formats);
  const expected = {
    mainPromotion: ['offer', 'ENJOY 15% OFF'],
    eventDetails: ['details', 'ON ALL MENU ITEMS'],
    rsvpContact: ['rsvp', 'FOR RESERVATIONS : +971 50 836 2445'],
    address: ['address', 'CONCORDE CREEK VIEW HOTEL, GROUND FLOOR, AL SEEF, ABRA, BUR DUBAI'],
    entryRestrictions: ['terms', '* T & C APPLY'],
  };
  assert.deepEqual(new Set(caps.fields), new Set(['date', ...Object.keys(expected)]));
  assert.equal(caps.bindings.entryRestrictions.label, 'Terms and conditions');
  for (const [field, [id, wording]] of Object.entries(expected)) {
    assert.equal(caps.limits[field].maxLength, field === 'eventDetails' ? 50 : wording.length + 10, field);
    for (const format of ['square', 'story'] as const) {
      assert.deepEqual(caps.bindings[field].targets[format], [id]);
      assert.equal(caps.bindings[field].originalText[format], wording);
    }
  }
  assert.equal(caps.limits.date.maxLength, '14 SUN SEP'.length + 10);
});

test('built-in mood stays while invitation and Story answers reach their saved objects', () => {
  const caps = cocoRecipeFormCapabilities('black-tie', recipe('black-tie').formats);
  assert.equal(caps.bindings['recipe:details'].originalText.story, 'MUSIC, PEOPLE\nCULTURE AND CLASS');
  assert.deepEqual(caps.fieldFormats['recipe:details'], ['story'], 'author-cleared Square text is not a slot');
  assert.equal(caps.limits['recipe:details'].maxLength, 50);
  const answers = { eventDetails: 'JOIN US', 'recipe:details': 'STORY FACTS' };
  for (const format of ['square', 'story']) {
    const first = build('black-tie', format, answers);
    const o = first.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(o.mood.text, 'SAME\nCITY\nDIFFERENT\nLEVEL');
    assert.equal(o.invitation.text, 'JOIN US');
    assert.equal(o.details.text, format === 'story' ? 'STORY FACTS' : '');
    const restored = JSON.parse(JSON.stringify(first));
    const edited = materialize('black-tie', restored, { eventName: 'Black Tie', fieldMappingVersion: 1, eventBrief: { ...restored.cocoEventBrief, eventDetails: 'COME IN' } });
    assert.equal(edited.cocoCompositionSystem.compiledObjectOverrides.invitation.text, 'COME IN');
    assert.equal(edited.cocoCompositionSystem.compiledObjectOverrides.mood.text, 'SAME\nCITY\nDIFFERENT\nLEVEL');
  }
});

test('Disco keeps its saved one-line Story lineup separate from Square DJ boxes without reviving blank objects', () => {
  const caps = cocoRecipeFormCapabilities('disco', recipe('disco').formats);
  assert.deepEqual(caps.bindings.djs.targets, { square: ['dj1', 'dj2', 'dj3'] });
  assert.deepEqual(caps.bindings['recipe:story:djs'].targets, { story: ['dj1'] });
  assert.equal(caps.limits.djs.maxLength, 'DJ NOVA\nDJ KAY\nDJ ELLE'.length + 10);
  assert.equal(caps.limits['recipe:story:djs'].maxLines, 1);
  assert.equal(caps.limits['recipe:story:djs'].maxLength, 'DJ NOVA | DJ KAY | DJ ELLE'.length + 10);
  for (const format of ['square', 'story']) {
    const result = build('disco', format, { djs: 'DJ ANA\nDJ BEA\nDJ CEE', 'recipe:story:djs': 'DJ ANA | DJ BEA | DJ CEE' });
    const o = result.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(o.dj1.text, format === 'story' ? 'DJ ANA | DJ BEA | DJ CEE' : 'DJ ANA');
    assert.equal(o.dj2.text, format === 'story' ? '' : 'DJ BEA');
    assert.equal(o.dj3.text, format === 'story' ? '' : 'DJ CEE');
    assert.equal(o.musicLabel.text, 'MUSIC BY', 'heading follows its rendered DJs, including a format-only field');
  }
});

test('split hour and meridiem keep their authored destinations with bound forms', () => {
  for (const format of ['square', 'story']) {
    const o = build('brunch-saturday', format, { startTime: '9 PM' }).cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(o.time.text, '9');
    assert.equal(o.meridiem.text, 'PM');
  }
});

test('all compiled recipe text bindings paint distinct answers into the declared objects and survive serialization', () => {
  for (const master of recipes) {
    const caps = cocoRecipeFormCapabilities(master.recipeId, master.formats);
    const entries = Object.entries(caps.bindings).filter(([, b]) => b.kind === 'text' || b.kind === 'lines');
    const answers = Object.fromEntries(entries.map(([key, b], index) => [key, key === 'startTime' ? '9 PM' : b.kind === 'lines' ? Array.from({ length: caps.limits[key].maxLines }, (_, line) => `V${index} L${line}`).join('\n') : `VALUE ${index}`]));
    const result: Record<string, any> = {};
    for (const format of ['square', 'story'] as const) {
      result[format] = JSON.parse(JSON.stringify(build(master.recipeId, format, answers)));
      const objects = master.formats[format].cocoCompositionSystem.compiledDocument?.objects ?? [];
      const edits = result[format].cocoCompositionSystem.compiledObjectOverrides;
      const destinations = new Set<string>();
      for (const [key, binding] of entries) {
        const targets = binding.targets[format] ?? [];
        for (const [index, id] of targets.entries()) {
          assert.ok(!destinations.has(id), `${master.recipeId}/${format}/${id}: duplicate form destination`);
          destinations.add(id);
          const owner = objects.find((o: any) => o.id === id);
          const saved = master.formats[format].cocoCompositionSystem.compiledObjectOverrides?.[id]?.text ?? owner.text;
          let expected = answers[key];
          if (binding.kind === 'lines') {
            const length = (target: string) => String(master.formats[format].cocoCompositionSystem.compiledObjectOverrides?.[target]?.text ?? objects.find((o: any) => o.id === target).text).split('\n').length;
            const offset=targets.slice(0,index).reduce((sum,target)=>sum+length(target),0);
            expected = expected.split('\n').slice(offset,index === targets.length - 1 ? undefined : offset+length(id)).join('\n');
          }
          if (key === 'startTime') expected = authoredTime(saved, objects.some((o: any) => o.semanticRole === 'meridiem') ? '9' : expected);
          else if (key !== 'endTime') expected = cocoAuthoredFieldValue(saved, expected, binding.label === 'Dress code');
          assert.equal(edits[id].text, authoredFormText(saved, expected), `${master.recipeId}/${format}/${id}: exact answer`);
        }
      }
      assert.deepEqual(result[format].cocoFormMappingReport.unplacedFields, []);
    }
    assert.deepEqual(cocoRecipeFormCapabilities(master.recipeId, result), caps, `${master.recipeId}: saved schema is stable`);
  }
});
