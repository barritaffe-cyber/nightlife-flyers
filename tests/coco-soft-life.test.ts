import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COCO_CURATED_ART_DIRECTION_LIBRARY } from '../components/coco/artDirections/library.ts';
import { getCocoRecipePreviewExports } from '../components/coco/artDirections/recipePreviewExports.ts';
import { COCO_RECIPE_CATALOG } from '../lib/coco/recipeCatalog.ts';
import { cocoHeadlineAssignments, cocoHeadlineMatches, cocoThemeAllowsRecipe } from '../lib/coco/recipeCompatibility.ts';
import { rankCocoMatchingDirections } from '../lib/coco/recipeChoices.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS, materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { getVisualRecipe } from '../lib/visualRecipes.ts';

const id = 'soft-life';
const formats = JSON.parse(readFileSync('public/generated-flyers/soft-life.nflyer', 'utf8')).state.session;
const variants = ['square', 'story'] as const;
const decorative = ['tagline', 'motto', 'badgeTitle', 'badgeCaption', 'signoff'];

test('Soft Life is discoverable in both supported themes without an uploaded portrait', () => {
  assert.equal(getVisualRecipe(id)?.name, 'Soft Life');
  assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[id], '/generated-flyers/soft-life.nflyer');
  assert.deepEqual(COCO_RECIPE_CATALOG[id].themes, ['Elegant', 'R&B / Lounge']);
  assert.equal(COCO_RECIPE_CATALOG[id].containsSubject, false);
  const direction = COCO_CURATED_ART_DIRECTION_LIBRARY.find(item => item.id === id);
  assert.ok(direction);
  assert.equal(direction.subjectPolicy.mode, 'none');
  for (const format of variants) {
    assert.deepEqual(direction.referenceTemplateIds[format], ['recipe_soft_life']);
    assert.equal(getCocoRecipePreviewExports(id)?.[format], `/generated-flyers/soft-life-${format}-preview.png`);
  }
  for (const theme of ['Elegant', 'R&B / Lounge']) {
    assert.equal(cocoThemeAllowsRecipe(theme, id), true);
    assert.deepEqual(rankCocoMatchingDirections([direction], { eventName: 'Soft Life', eventBrief: { theme } }, () => formats).map(item => item.id), [id]);
  }
  assert.equal(cocoThemeAllowsRecipe('Tropical', id), false);
});

test('Both authored formats preserve supplied artwork and independent editable text owners', () => {
  const expectedOwners = ['presenter', 'presents', 'genres', 'headline', 'subtitle', 'day', 'month', 'date', 'time', 'tagline', 'djLabel', 'dj1', 'dj2', 'experience', 'entry', 'dressLabel', 'dress', 'venue', 'address', 'motto', 'badgeTitle', 'badgeCaption', 'signoff', 'detailsLabel'];
  for (const format of variants) {
    const doc = formats[format].cocoCompositionSystem.compiledDocument;
    assert.equal(formats[format].details2Enabled, true, 'DJ companion styling controls must be enabled');
    assert.deepEqual(doc.canvas, { width: 1080, height: format === 'square' ? 1080 : 1920 });
    assert.equal(doc.objects.find((object: any) => object.id === 'background').image.src, `/generated-flyers/assets/soft-life-${format === 'square' ? 'Sq' : 'St'}.jpg`);
    const text = doc.objects.filter((object: any) => object.kind === 'text');
    assert.deepEqual(text.map((object: any) => object.id).sort(), [...expectedOwners].sort());
    assert.equal(new Set(text.map((object: any) => object.binding.text)).size, text.length);
    for (const object of text) {
      assert.ok(object.editable, `${format}/${object.id} editable`);
      assert.ok(object.binding.text, `${format}/${object.id} text binding`);
      assert.ok(object.binding.panel, `${format}/${object.id} panel binding`);
    }
    assert.equal(text.find((object: any) => object.id === 'headline').text, 'SOFT');
    assert.equal(doc.objects.some((object: any) => object.id === 'foreground'), false, 'The subject must not cut off the T');
    assert.equal(text.find((object: any) => object.id === 'headline').paint.backgroundImage, 'url("/generated-flyers/assets/soft-life-crimson-material-v2.png")');
    assert.equal(text.find((object: any) => object.id === 'subtitle').text, 'Life');
    assert.equal(text.find((object: any) => object.id === 'detailsLabel').text, '');
  }
});

test('Soft Life retains its two-word title partition and excludes decorative copy from title matching', () => {
  assert.equal(cocoHeadlineMatches(id, formats, 'Soft Life'), true);
  assert.equal(cocoHeadlineMatches(id, formats, 'Velvet Nights'), true);
  assert.equal(cocoHeadlineMatches(id, formats, 'Soft'), false);
  assert.equal(cocoHeadlineMatches(id, formats, 'Soft After Dark'), false);
  for (const format of variants) {
    assert.deepEqual(cocoHeadlineAssignments(id, formats[format], 'Soft Life'), { headline: 'Soft', subtitle: 'Life' });
    assert.deepEqual(cocoHeadlineAssignments(id, formats[format], 'Velvet Nights'), { headline: 'Velvet', subtitle: 'Nights' });
  }
});

test('The form maps music, DJs, experience, admission and dress code while preserving the layout', () => {
  const caps = cocoRecipeFormCapabilities(id, formats);
  for (const [field, owners] of Object.entries({ djs: ['dj1', 'dj2'], musicPolicy: ['genres'], eventDetails: ['experience'], freeEntryCondition: ['entry'], dressCode: ['dress'] })) {
    assert.deepEqual(caps.bindings[field].targets, { square: owners, story: owners });
  }
  const formOwners = Object.values(caps.bindings).flatMap(binding => Object.values(binding.targets).flat());
  for (const owner of [...decorative, 'djLabel', 'dressLabel', 'detailsLabel', 'headline', 'subtitle']) assert.ok(!formOwners.includes(owner), `${owner} is not a separate form question`);
  const snapshot = structuredClone(formats);
  for (const format of variants) {
    const result = materializeCocoPortableRecipeVariant(id, formats[format], {
      eventName: 'Soft Life', fieldMappingVersion: 1,
      eventBrief: {
        theme: 'R&B / Lounge', fieldFormats: caps.fieldFormats, recipeFieldBindings: caps.bindings,
        presenterName: 'NOVA PRESENTS', djs: 'DJ NOVA\nDJ ORBIT', musicPolicy: 'R&B\nNEO SOUL\nSLOW JAMS\nSOUL CLASSICS',
        eventDetails: 'COCKTAILS\nCONVERSATION\nSOUL ALL NIGHT', freeEntryCondition: 'LADIES FREE\nBEFORE 9PM', dressCode: 'SMART & STYLISH',
        venueName: 'CLUB NOVA', address: '12 MAIN STREET',
      },
    });
    const edits = result.cocoCompositionSystem.compiledObjectOverrides;
    for (const [owner, value] of Object.entries({ headline: 'SOFT', subtitle: 'Life', dj1: 'DJ NOVA', dj2: 'DJ ORBIT', dress: 'SMART & STYLISH', venue: 'CLUB NOVA', address: '12 MAIN STREET' })) assert.equal(edits[owner].text, value, `${format}/${owner}`);
    assert.match(edits.genres.text, /NEO SOUL/);
    assert.match(edits.experience.text, /CONVERSATION/);
    assert.match(edits.entry.text, /BEFORE 9PM/);
    const doc = formats[format].cocoCompositionSystem.compiledDocument;
    for (const owner of [...decorative, 'djLabel', 'dressLabel']) assert.equal(edits[owner].text, doc.objects.find((object: any) => object.id === owner).text, `${format}/${owner} keeps its authored copy`);
    assert.deepEqual(result.cocoCompositionSystem.compiledDocument, doc);
    assert.deepEqual(result.cocoFormMappingReport.unplacedFields, []);
  }
  assert.deepEqual(formats, snapshot, 'Materializing does not mutate the master');
});

test('Bound music and dress labels clear with their fields and return independently', () => {
  for (const format of variants) {
    const empty = materializeCocoPortableRecipeVariant(id, formats[format], { eventName: 'Soft Life', fieldMappingVersion: 1, eventBrief: { theme: 'Elegant' } });
    assert.equal(empty.cocoCompositionSystem.compiledObjectOverrides.djLabel.text, '');
    assert.equal(empty.cocoCompositionSystem.compiledObjectOverrides.dressLabel.text, '');
    const populated = materializeCocoPortableRecipeVariant(id, empty, { eventName: 'Soft Life', fieldMappingVersion: 1, eventBrief: { theme: 'Elegant', djs: 'DJ NOVA', dressCode: 'ALL BLACK' } });
    assert.equal(populated.cocoCompositionSystem.compiledObjectOverrides.djLabel.text, 'MUSIC BY');
    assert.equal(populated.cocoCompositionSystem.compiledObjectOverrides.dressLabel.text, 'DRESS CODE:');
    assert.equal(populated.cocoCompositionSystem.compiledObjectOverrides.dj1.text, 'DJ NOVA');
    assert.equal(populated.cocoCompositionSystem.compiledObjectOverrides.dress.text, 'ALL BLACK');
  }
});
