import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { materializeCocoPortableRecipeVariant, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
import { cocoSocialHandleLayoutPatch, withCocoSocialRecipeAssets } from '../lib/coco/socialRecipeAssets.ts';
const recipes = JSON.parse(readFileSync(new URL('../lib/template-data/registered-recipes.json', import.meta.url), 'utf8'));
const iconAssets = (v: any) => v.portraits.filter((a: any) => a.id.startsWith('coco-form-social-'));
const render = (id: string, format: string, brief: any, source?: any) => materializeCocoPortableRecipeVariant(id as CocoPortableRecipeId, source ?? recipes.find((r: any) => r.recipeId === id).formats[format], { fieldMappingVersion: 1, eventName: 'Social Night', eventBrief: brief });

test('all recipes place four independent SVG icons in both formats, without mutating masters', () => {
  for (const recipe of recipes) for (const format of ['square', 'story']) {
    const original = JSON.stringify(recipe.formats[format]);
    const v = render(recipe.recipeId, format, { socials: '@clubwoods', socialPlatforms: ['instagram', 'tiktok', 'x', 'whatsapp'] });
    const assets = iconAssets(v);
    assert.equal(assets.length, 4, recipe.recipeId);
    if (format === 'story') {
      assert.ok(Math.abs((assets[0].x + assets.at(-1).x) / 2 - 50) < .02, `${recipe.recipeId}: centered Story row`);
      assert.ok(assets.every((a: any) => a.y >= 85), `${recipe.recipeId}: Story footer`);
      assert.ok(!v.cocoFormSocialInlineAnchor, 'Story never keeps a Square inline treatment');
    }
    assert.deepEqual(v.emojiList, v.portraits);
    assert.ok(!v.cocoFormMappingReport.unplacedFields.includes('socialPlatforms'));
    assert.ok(!v.cocoFormMappingReport.unplacedFields.includes('socials'));
    for (const a of assets) {
      assert.ok(a.x > 0 && a.x < 100 && a.y > 0 && a.y < 100);
      assert.ok(decodeURIComponent(a.url).includes('<svg'));
      assert.ok(!decodeURIComponent(a.url).includes('{{COLOR}}'));
      assert.ok(a.svgTemplate.includes('{{COLOR}}'), 'editable colour template');
      if (v.cocoCompositionSystem?.compiledDocument) {
        const doc = v.cocoCompositionSystem.compiledDocument;
        const object = doc.objects.find((o: any) => o.id === a.cocoCompiledObjectId);
        assert.equal(object.kind, 'image');
        assert.ok(Math.abs(object.bounds.width * doc.canvas.width - object.bounds.height * doc.canvas.height) < .01, 'icons keep square proportions');
      }
    }
    assert.equal(JSON.stringify(recipe.formats[format]), original);
  }
});

test('adding/removing platforms preserves manually moved and styled icons and unrelated artwork', () => {
  let v = render('reggae-jams', 'square', { socials: '@club', socialPlatforms: ['instagram', 'tiktok'] });
  const instagram = iconAssets(v)[0];
  Object.assign(instagram, { x: 61, y: 72, scale: .45, rotation: 15, iconColor: '#00ff00', opacity: .7 });
  v.portraits.push({ id: 'manually-added-social-logo', url: 'custom.svg', x: 30, y: 40 });
  const snapshot = JSON.stringify(v);
  v = render('reggae-jams', 'square', { socials: '@edited', socialPlatforms: ['instagram', 'whatsapp'] }, v);
  assert.equal(iconAssets(v).length, 2);
  assert.deepEqual(iconAssets(v)[0], instagram);
  assert.ok(v.portraits.some((a: any) => a.id === 'manually-added-social-logo'));
  assert.ok(!v.cocoCompositionSystem.compiledDocument.objects.some((o: any) => o.id === 'coco-form-social-tiktok'));
  const reopened = JSON.parse(JSON.stringify(v));
  const empty = render('reggae-jams', 'square', { socials: '@edited', socialPlatforms: [] }, reopened);
  assert.equal(iconAssets(empty).length, 0);
  assert.equal(empty.cocoCompositionSystem.compiledObjectOverrides['coco-form-social-handle'].text, '@edited');
  assert.ok(snapshot.includes('@club'));
});

test('icon-only requests, no selection, aliases and unknown platforms are handled explicitly', () => {
  const v = render('aura', 'story', { socialPlatforms: ['twitter', 'x', 'instagram'] });
  assert.deepEqual(iconAssets(v).map((a: any) => a.socialPlatform), ['instagram', 'x']);
  assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.social.removed, true, 'sample strip hidden');
  const unknown = render('aura', 'story', { socialPlatforms: ['instagram', 'unsupported'] });
  assert.ok(unknown.cocoFormMappingReport.unplacedFields.includes('socialPlatforms'));
  const blank = render('aura', 'story', {});
  assert.equal(iconAssets(blank).length, 0);
  assert.equal(blank.cocoCompositionSystem.compiledObjectOverrides.social.removed, true);
});

test('handle follows below icons and aligns left, center or right when the group moves', () => {
  for (const recipe of ['reggae-jams', 'aura', 'rush-night-css']) for (const format of ['square', 'story']) {
    const v = render(recipe, format, { socials: '@clubwoods', socialPlatforms: ['instagram', 'tiktok'] });
    for (const [center, align] of [[18, 'left'], [50, 'center'], [82, 'right']] as const) {
      const assets = iconAssets(v).map((a: any, i: number) => ({ ...a, x: center - 3 + i * 6, y: 70 }));
      const patch = cocoSocialHandleLayoutPatch(v, assets);
      const changed = { ...v, ...patch };
      const doc = changed.cocoCompositionSystem?.compiledDocument;
      if (doc) {
        const object = doc.objects.find((o: any) => o.kind === 'text' && ['social', 'handle'].includes(o.semanticRole));
        const edit = changed.cocoCompositionSystem.compiledObjectOverrides[object.id];
        const left = assets[0].x - 2.25, right = assets[1].x + 2.25;
        assert.equal(edit.align, align);
        assert.ok(edit.top > 70 + 2.25 * doc.canvas.width / doc.canvas.height);
        const expected = align === 'left' ? left : align === 'right' ? right : center;
        const actual = align === 'left' ? edit.left : align === 'right' ? edit.left + object.bounds.width : edit.left + object.bounds.width / 2;
        assert.ok(Math.abs(actual - expected) < .01, `${recipe}/${format}: ${align}`);
        assert.deepEqual(cocoSocialHandleLayoutPatch(changed, assets), {}, 'settled layout must not trigger another update');
      } else {
        assert.equal(changed.cocoSocialHandleAlign, align);
        assert.ok(changed.cocoSocialHandleY > 70);
      }
    }
  }
});


test('native handle-only footers center in Story and retain manual Square alignment', () => {
  const brief = { socials: '@club', socialPlatforms: [] };
  const source = { format: 'square', cocoEventBrief: brief, cocoFormSocialNativeRow: { x: 10, y: 90 },
    cocoSocialHandleX: 10, cocoSocialHandleY: 90, cocoSocialHandleAlign: 'right', socialHandleAlign: 'right' };
  const square = withCocoSocialRecipeAssets(source, brief);
  assert.equal(square.cocoSocialHandleAlign, 'right');
  const story = withCocoSocialRecipeAssets({ ...source, format: 'story' }, brief);
  assert.equal(story.cocoSocialHandleAlign, 'center');
  assert.equal(story.socialHandleAlign, 'center');
  assert.equal(story.cocoSocialHandleX, 50);
  assert.ok(story.cocoSocialHandleY > 95);
});
