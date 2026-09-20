import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { withCocoRecipeBackground, selectedCocoRecipeBackground } from '../lib/coco/recipeBackground.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS, materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';

const url = '/backgrounds/user-chosen.jpg';
test('only a selected background overrides the recipe; upload wins over gallery', () => {
  const source = { backgroundUrl: '/recipe.jpg' };
  assert.equal(withCocoRecipeBackground(source, {}), source);
  assert.equal(withCocoRecipeBackground(source, {backgroundSrc: url, backgroundSelectionExplicit: false}), source);
  assert.equal(selectedCocoRecipeBackground({backgroundDataUrl:'data:image/png;base64,test',backgroundSrc:url}), 'data:image/png;base64,test');
});
for(const [id, path] of Object.entries(COCO_PORTABLE_RECIPE_PROJECT_URLS)) {
  test(`${id}: user background survives both recipe formats without changing text or subject`, () => {
    const project = JSON.parse(readFileSync(`public${path}`,'utf8'));
    for(const format of ['square','story']) {
      const source = project.state.session[format];
      const before = JSON.stringify(source);
      const result = materializeCocoPortableRecipeVariant(id as keyof typeof COCO_PORTABLE_RECIPE_PROJECT_URLS, source, {eventName:source.headline || 'Party',eventBrief:{},backgroundSrc:url,backgroundSelectionExplicit:true});
      assert.equal(result.backgroundUrl,url);
      assert.equal(result.bgUrl,url);
      assert.equal(result.bgUploadUrl,'');
      const backgrounds=(result.cocoCompositionSystem?.compiledDocument?.objects ?? []).filter((o:any)=>[o.id,o.semanticRole,o.assetRole].includes('background'));
      for(const object of backgrounds) {
        assert.equal(object.image.src,url);
        assert.equal(object.image.position,'50% 50%');
        const asset=result.emojiList?.find((a:any)=>a.cocoCompiledObjectId===object.id);
        if(asset) assert.equal(asset.url,url);
      }
      const patched=withCocoRecipeBackground(source,{backgroundSrc:url});
      const sourceObjects=source.cocoCompositionSystem?.compiledDocument?.objects ?? [];
      for(const object of patched.cocoCompositionSystem?.compiledDocument?.objects ?? []) {
        if(!backgrounds.some((bg:any)=>bg.id===object.id)) assert.deepEqual(object,sourceObjects.find((o:any)=>o.id===object.id));
      }
      assert.equal(JSON.stringify(source),before,'cached recipe master is unchanged');
    }
  });
}
