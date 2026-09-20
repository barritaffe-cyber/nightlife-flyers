import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { VISUAL_RECIPES } from '../lib/visualRecipes.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS } from '../lib/coco/portableRecipeRuntime.ts';
import { GALLERY_TEMPLATE_RECIPES, GALLERY_TEMPLATE_RECIPE_IDS } from '../lib/recipes/galleryTemplateRecipes.ts';
const templates = JSON.parse(readFileSync(new URL('../lib/template-data/registered-recipes.json', import.meta.url), 'utf8'));
test('Every registered recipe has a unique gallery entry with both saved formats and a preview', () => {
 const recipeIds=VISUAL_RECIPES.map(r=>r.id).sort();
 assert.deepEqual(templates.map((t:any)=>t.recipeId).sort(),recipeIds);
 assert.deepEqual(Object.keys(COCO_PORTABLE_RECIPE_PROJECT_URLS).sort(),recipeIds);
 assert.equal(new Set(templates.map((t:any)=>t.id)).size, templates.length);
 for (const t of templates) {
  assert.ok(existsSync('public'+t.preview),t.recipeId+' preview');
  for(const format of ['square','story']) {
   const v=t.formats[format];
   assert.ok(v && Object.keys(v).length>20,t.recipeId+' '+format);
   assert.ok(v.backgroundUrl || v.bgUploadUrl || v.cocoCompositionSystem,t.recipeId+' authored canvas');
  }
 }
});
test('Every curated gallery-template mapping points to one registered portable recipe',()=>{
 const mappedIds=Object.values(GALLERY_TEMPLATE_RECIPE_IDS).sort();
 const galleryRecipeIds=GALLERY_TEMPLATE_RECIPES.map(recipe=>recipe.id).sort();
 assert.equal(new Set(Object.keys(GALLERY_TEMPLATE_RECIPE_IDS)).size,Object.keys(GALLERY_TEMPLATE_RECIPE_IDS).length);
 assert.equal(new Set(mappedIds).size,mappedIds.length);
 assert.deepEqual(mappedIds,galleryRecipeIds);
 for(const recipeId of mappedIds)assert.ok(COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId as keyof typeof COCO_PORTABLE_RECIPE_PROJECT_URLS],recipeId);
});
test('Recipe images are externalized to files that exist', () => {
 function visit(v:any) {
  if(typeof v==='string') {
   assert.ok(!/^data:image\/.+;base64,/.test(v),'embedded image in bundle');
   if(v.startsWith('/generated-flyers/assets/registered-recipes/')) assert.ok(existsSync('public'+v),v);
  } else if(Array.isArray(v)) v.forEach(visit);
  else if(v && typeof v==='object') Object.values(v).forEach(visit);
 }
 visit(templates);
});
