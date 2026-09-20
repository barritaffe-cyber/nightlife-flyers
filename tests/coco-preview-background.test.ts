import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { cocoNativePreviewBackground, cocoPreviewBackgroundGeometry, withCocoRecipeBackground } from '../lib/coco/recipeBackground.ts';
import { materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';

const recipe = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8')).find((r: any) => r.recipeId === 'brunch-saturday');

test('Brunch Saturday Story previews its saved upload, while Square retains its compiled background', () => {
  const before = JSON.stringify(recipe);
  for (const format of ['square', 'story']) {
    const source = recipe.formats[format];
    const v = materializeCocoPortableRecipeVariant('brunch-saturday', source, { eventName: 'Ladies Night', eventBrief: {}, fieldMappingVersion: 1 });
    assert.equal(cocoNativePreviewBackground(v), format === 'story' ? source.bgUploadUrl : '');
    assert.deepEqual(v.cocoCompositionSystem.compiledObjectOverrides.background, source.cocoCompositionSystem.compiledObjectOverrides.background);
    const chosen = withCocoRecipeBackground(v, { backgroundSrc: '/new-scene.jpg', backgroundSelectionExplicit: true });
    assert.equal(cocoNativePreviewBackground(chosen), '', 'explicit scene replacement renders through the compiled background');
  }
  assert.equal(JSON.stringify(recipe), before, 'accepted recipe untouched');
});

test('native preview respects upload precedence and empty background slots', () => {
  assert.equal(cocoNativePreviewBackground({}), '');
  assert.equal(cocoNativePreviewBackground({ bgUrl: 'library.jpg' }), 'library.jpg');
  assert.equal(cocoNativePreviewBackground({ bgUrl: 'library.jpg', bgUploadUrl: 'upload.png' }), 'upload.png');
});

test('preview background uses the editor fit, scale, pan and rotation geometry', () => {
  const image = { width: 1000, height: 1000 };
  const v = { bgFitMode: true, bgScale: 1, bgPosX: 25, bgPosY: 70, bgRotate: 17, bgX: 0, bgY: 0 };
  assert.deepEqual(cocoPreviewBackgroundGeometry(v, 'story', image), { width: 540, height: 540, x: 0, y: 294, rotation: 17 });
  assert.deepEqual(cocoPreviewBackgroundGeometry({ ...v, bgFitMode: false }, 'story', image), { width: 960, height: 960, x: -105, y: 0, rotation: 17 });
  assert.deepEqual(cocoPreviewBackgroundGeometry({ ...v, bgScale: 2 }, 'square', image), { width: 1080, height: 1080, x: -135, y: -378, rotation: 17 });
});
