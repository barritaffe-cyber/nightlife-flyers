import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { getVisualRecipe } from '../lib/visualRecipes.ts';
import { COCO_RECIPE_CATALOG } from '../lib/coco/recipeCatalog.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS } from '../lib/coco/portableRecipeRuntime.ts';
import { COCO_CURATED_ART_DIRECTION_LIBRARY as directions } from '../components/coco/artDirections/library.ts';
import { getCocoRecipePreviewExports } from '../components/coco/artDirections/recipePreviewExports.ts';
import { cocoHeadlineAssignments, cocoHeadlineMatches } from '../lib/coco/recipeCompatibility.ts';
import { rankCocoMatchingDirections, isCocoRecipeChoiceEligible } from '../lib/coco/recipeChoices.ts';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoFormFieldGuidance } from '../lib/coco/formFieldGuidance.ts';

const recipeId = 'beat-therapy';
const projectPath = `public${COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId]}`;
const savedFormats = () => {
  const project = JSON.parse(readFileSync(projectPath, 'utf8'));
  return (project.state ?? project).session;
};

test('Beat Therapy has one Neon direction, a portable source, and both preview routes', () => {
  assert.equal(getVisualRecipe(recipeId)?.version, 1);
  assert.equal(getVisualRecipe(recipeId)?.name, 'Beat Therapy');
  assert.deepEqual(COCO_RECIPE_CATALOG[recipeId].themes, ['Neon']);
  assert.equal(COCO_RECIPE_CATALOG[recipeId].containsSubject, false);
  assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId], '/generated-flyers/beat-therapy.nflyer');
  const matched = directions.filter(direction => direction.visualRecipeId === recipeId);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].subjectPolicy.mode, 'none');
  assert.equal(matched[0].palettePolicy.id, 'neon-contrast');
  assert.ok(matched[0].eligibleNightlifeStyles.includes('house'));
  assert.deepEqual(getCocoRecipePreviewExports(recipeId), {
    square: '/generated-flyers/beat-therapy-square-preview.png',
    story: '/generated-flyers/beat-therapy-story-preview.png',
  });
});

test('Beat Therapy discovery respects its two title words and baked DJ background', () => {
  const formats = savedFormats();
  const direction = directions.find(item => item.visualRecipeId === recipeId)!;
  assert.equal(isCocoRecipeChoiceEligible(direction, {}, formats), true);
  assert.equal(isCocoRecipeChoiceEligible(direction, { subjectDataUrl: '/user-portrait.png' }, formats), false);
  for (const name of ['Beat Therapy', 'Neon Glow']) assert.equal(cocoHeadlineMatches(recipeId, formats, name), true);
  for (const name of ['Beat', 'Beat Therapy Tonight']) assert.equal(cocoHeadlineMatches(recipeId, formats, name), false);
  for (const format of ['square', 'story'] as const) {
    assert.deepEqual(cocoHeadlineAssignments(recipeId, formats[format], 'Neon Glow'), { headline: 'Neon', subtitle: 'Glow' });
  }
  const templates = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
  const ranked = rankCocoMatchingDirections(directions, { eventName: 'Beat Therapy', eventBrief: { theme: 'Neon' } },
    id => templates.find((item: { recipeId: string }) => item.recipeId === id)?.formats);
  assert.equal(ranked[0]?.visualRecipeId, recipeId);
});

test('Beat Therapy ships independent format artwork and individually editable text', () => {
  const formats = savedFormats();
  const backgrounds: string[] = [];
  const previews = getCocoRecipePreviewExports(recipeId)!;
  for (const format of ['square', 'story'] as const) {
    const source = formats[format];
    const document = source.cocoCompositionSystem.compiledDocument;
    assert.equal(source.cocoVisualRecipeId, recipeId);
    assert.equal(source.cocoVisualRecipeMaterializedVersion, 1);
    assert.deepEqual(document.canvas, { width: 1080, height: format === 'square' ? 1080 : 1920 });
    const text = document.objects.filter((object: any) => object.kind === 'text');
    assert.ok(text.length >= 12, 'headline and supporting information remain separate editable objects');
    assert.equal(text.find((object: any) => object.id === 'headline')?.text, 'BEAT');
    assert.equal(text.find((object: any) => object.id === 'subtitle')?.text, 'THERAPY');
    for (const object of text) {
      assert.equal(object.editable, true, `${format}/${object.id}`);
      assert.ok(object.binding?.text, `${format}/${object.id} needs a text field`);
      assert.ok(object.binding?.panel, `${format}/${object.id} needs an editor panel`);
    }
    assert.equal(new Set(text.map((object: any) => object.binding.text)).size, text.length, 'independent copy must not share bindings');
    assert.equal(document.objects.some((object: any) => object.semanticRole === 'subject' || object.assetRole === 'subject'), false);
    const background = document.objects.find((object: any) => object.id === 'background')?.image?.src;
    assert.ok(background);
    backgrounds.push(background);
    assert.ok(existsSync(`public${previews[format]}`));
  }
  assert.notEqual(backgrounds[0], backgrounds[1], 'use the separately supplied Square and Story scenes');
});

test('Beat Therapy form keeps table availability, reservations, lineup, and title text independent', () => {
  const formats = savedFormats();
  const capabilities = cocoRecipeFormCapabilities(recipeId, formats);
  assert.deepEqual(capabilities.bindings['recipe:tables'].targets, { square: ['tables'], story: ['tables'] });
  assert.equal(capabilities.bindings['recipe:tables'].label, 'Table availability');
  assert.equal(cocoFormFieldGuidance('recipe:tables', capabilities.bindings['recipe:tables']), 'Add table info, like VIP Tables Available.');
  assert.deepEqual(capabilities.bindings.rsvpContact.targets, { square: ['contact'], story: ['contact'] });
  assert.deepEqual(capabilities.bindings.djs.targets, { square: ['dj1', 'dj2'], story: ['dj1', 'dj2'] });
  assert.deepEqual(capabilities.bindings.subtitle.targets, { square: ['tagline'], story: ['tagline'] });
  for (const field of ['recipe:subtitle', 'recipe:lineupLabel', 'recipe:detailsLabel', 'recipe:contact', 'bottleSpecials']) assert.ok(!capabilities.fields.includes(field), field);
  const brief = cocoBriefForCapabilities({ theme: 'Neon', 'recipe:tables': 'vip seating\navailable', rsvpContact: '555 123 4567', djs: 'dj nova\ndj orbit', subtitle: 'feel the music' }, capabilities);
  for (const format of ['square', 'story'] as const) {
    const final = materializeCocoPortableRecipeVariant(recipeId, formats[format], { eventName: 'night shift', eventBrief: brief, fieldMappingVersion: 1 });
    const edits = final.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(edits.headline.text, 'NIGHT');
    assert.equal(edits.subtitle.text, 'SHIFT');
    assert.equal(edits.tables.text, 'VIP SEATING\nAVAILABLE');
    assert.equal(edits.contact.text, '555 123 4567');
    assert.equal(edits.dj1.text, 'DJ NOVA');
    assert.equal(edits.dj2.text, 'DJ ORBIT');
    assert.equal(edits.tagline.text, 'FEEL THE MUSIC');
    assert.deepEqual(final.cocoFormMappingReport.unplacedFields, []);
    assert.deepEqual(final.cocoCompositionSystem.compiledDocument, formats[format].cocoCompositionSystem.compiledDocument, 'the form changes wording without rewriting authored objects');
    for (const field of capabilities.fields) {
      const saved = capabilities.bindings[field].originalText[format];
      if (saved !== undefined) assert.equal(capabilities.byFormat[format][field].maxLength, saved.length + 10);
    }
  }
});
