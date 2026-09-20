import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities, cocoBriefForFormat } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { mergeCocoEventDraft } from '../lib/coco/eventDraft.ts';
const recipe = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8')).find((r: any) => r.recipeId === 'drift-kingz');
const platforms = ['instagram', 'tiktok', 'youtube', 'twitch'];

test('Elite Monday saved social stickers become optional 15-size form choices in both formats', () => {
  const elite = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8')).find((r: any) => r.recipeId === 'elite-monday');
  const capabilities = cocoRecipeFormCapabilities(elite.recipeId, elite.formats);
  assert.deepEqual(capabilities.fieldFormats.socialPlatforms, ['square', 'story']);
  const brief = cocoBriefForCapabilities({ socialPlatforms: platforms }, capabilities);
  const reopened: Record<string, any> = {};
  for (const format of ['square', 'story']) {
    const source = elite.formats[format];
    const render = (v: any, socialPlatforms: string[]) => materializeCocoPortableRecipeVariant(elite.recipeId, v, { fieldMappingVersion: 1, eventName: 'Ladies Night', eventBrief: { ...brief, socialPlatforms } });
    const blank = render(source, []);
    assert.ok(!blank.portraits.some((a: any) => a.isSocialIcon), 'unanswered socials hide saved sample stickers');
    const filled = render(blank, platforms);
    const icons = filled.portraits.filter((a: any) => a.isSocialIcon);
    assert.deepEqual(icons.map((a: any) => a.socialPlatform), platforms);
    assert.ok(icons.every((a: any) => a.scale === .15));
    assert.ok(!filled.portraits.some((a: any) => source.emojiList.some((old: any) => old.isSocialIcon && old.id === a.id)), 'sample stickers are replaced without duplicates');
    for (const icon of icons) {
      const object = filled.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === icon.cocoCompiledObjectId);
      assert.ok(Math.abs(object.bounds.width * icon.scale - 128 * .15 / 540 * 100) < .001, 'displayed icon shrinks along with its control value');
    }
    if (format === 'story') {
      assert.ok(Math.abs((icons[0].x + icons.at(-1).x) / 2 - 50) < .01);
      assert.ok(icons.every((a: any) => a.y > 95));
    }
    const edited = structuredClone(filled);
    edited.portraits = edited.emojiList = edited.portraits.map((a: any) => a.id === icons[0].id ? { ...a, scale: .21 } : a);
    const resized = render(edited, platforms);
    assert.equal(resized.portraits.find((a: any) => a.id === icons[0].id).scale, .21, 'manual resizing survives later form edits');
    const cleared = render(JSON.parse(JSON.stringify(filled)), []);
    assert.ok(!cleared.portraits.some((a: any) => a.isSocialIcon));
    reopened[format] = cleared;
  }
  assert.deepEqual(cocoRecipeFormCapabilities(elite.recipeId, reopened).fieldFormats.socialPlatforms, ['square', 'story'], 'blank/reopened forms keep the social question');
});

test('Drift Kingz offers icons without inventing a handle, preserves selections and the authored row in both formats', () => {
  const capabilities = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
  assert.ok(!capabilities.fields.includes('socials'));
  assert.deepEqual(capabilities.fieldFormats.socialPlatforms, ['square', 'story']);
  const brief = cocoBriefForCapabilities({ socialPlatforms: platforms }, capabilities);
  assert.deepEqual(brief.socialPlatforms, platforms);
  assert.deepEqual(mergeCocoEventDraft({}, brief, capabilities.fields).socialPlatforms, platforms);
  const materialized: Record<string, any> = {};
  for (const format of ['square', 'story']) {
    const source = recipe.formats[format];
    const snapshot = JSON.stringify(source);
    const v = materializeCocoPortableRecipeVariant('drift-kingz', source, { fieldMappingVersion: 1, eventName: 'Miami', eventBrief: brief });
    const icons = v.portraits.filter((a: any) => a.isSocialIcon);
    assert.deepEqual(icons.map((a: any) => a.socialPlatform), platforms);
    assert.ok(icons.every((a: any) => decodeURIComponent(a.url).includes('<svg') && a.svgTemplate.includes('{{COLOR}}')));
    const slot = source.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'social');
    const edit = source.cocoCompositionSystem.compiledObjectOverrides?.social ?? {};
    if (format === 'square') assert.ok(icons.every((a: any) => Math.abs(a.y - ((edit.top ?? slot.bounds.y) + slot.bounds.height / 2)) < .01));
    else {
      assert.ok(Math.abs((icons[0].x + icons.at(-1).x) / 2 - 50) < .01);
      assert.ok(icons.every((a: any) => a.y > 95));
    }
    assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.social.removed, true);
    assert.ok(!v.cocoCompositionSystem.compiledDocument.objects.some((o: any) => o.id === 'coco-form-social-handle'));
    assert.equal(JSON.stringify(source), snapshot);
    const reopened = JSON.parse(JSON.stringify(v));
    materialized[format] = reopened;
    const cleared = materializeCocoPortableRecipeVariant('drift-kingz', reopened, { fieldMappingVersion: 1, eventName: 'Miami', eventBrief: { ...brief, socialPlatforms: [] } });
    assert.ok(!cleared.portraits.some((a: any) => a.isSocialIcon));
  }
  assert.deepEqual(cocoRecipeFormCapabilities(recipe.recipeId, materialized), capabilities);
});

test('icon-only slots are format-scoped and deliberately removed strips do not expose choices', () => {
  const formats = structuredClone(recipe.formats);
  formats.story.cocoCompositionSystem.compiledObjectOverrides.social = { removed: true };
  const capabilities = cocoRecipeFormCapabilities(recipe.recipeId, formats);
  assert.deepEqual(capabilities.fieldFormats.socialPlatforms, ['square']);
  const brief = cocoBriefForCapabilities({ socialPlatforms: platforms }, capabilities);
  assert.deepEqual(cocoBriefForFormat(brief, 'story').socialPlatforms, []);
  assert.deepEqual(cocoBriefForFormat(brief, 'square').socialPlatforms, platforms);
  formats.square.cocoCompositionSystem.compiledObjectOverrides.social = { removed: true };
  assert.deepEqual(cocoBriefForCapabilities(brief, cocoRecipeFormCapabilities(recipe.recipeId, formats)).socialPlatforms, []);
});
