import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FONT_FILE_MAP,TEMPLATE_ONLY_FONT_FAMILIES} from '../lib/localFontMap.ts';
import {isPngGlyphFamily,PNG_GLYPH_COLLECTIONS} from '../lib/pngGlyphCollections.ts';
import {getVisualRecipe} from '../lib/visualRecipes.ts';
import {COCO_PORTABLE_RECIPE_PROJECT_URLS} from '../lib/coco/portableRecipeRuntime.ts';

const project=JSON.parse(readFileSync('public/generated-flyers/ladies-night-rose.nflyer','utf8'));
test('Ladies Night Rose preserves independent supplied scenes and editable copy',()=>{
 for(const format of ['square','story']){
  const v=project.state.session[format];const doc=v.cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.length,21);assert.equal(v.cocoCssCompiler.report.unsupported,0);
  const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,18);
  for(const o of text){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.ok(o.binding.text,o.id);}
  const headline=text.find((o:any)=>o.id==='headline');assert.equal(headline.text,'Ladies');assert.equal(headline.typography.fontFamily,'Ladies Rose Gold PNG');assert.equal(headline.typography.textTransform,'none');
  assert.equal(v.subtagEnabled,false);assert.equal(v.priceLabel,'');assert.equal(v.rightRailEnabled,false);assert.equal(v.venueEnabled,false);
  assert.equal(text.find((o:any)=>o.id==='motto').binding.family,undefined);assert.equal(text.find((o:any)=>o.id==='venue').binding.family,undefined);
  assert.equal(text.filter((o:any)=>o.typography.fontFamily==='Ladies Rose Gold PNG').length,1);
  assert.equal(text.find((o:any)=>o.id==='head2').typography.fontFamily,'Ladies Night Pink PNG');
  assert.equal(headline.paint.textEffect,'rose-gold-glints-v1');
  assert.equal(v.headShadow,true);assert.equal(v.head2Shadow,true);
  assert.match(doc.objects.find((o:any)=>o.id==='background').image.src,/^data:image\/webp;base64,/);
 }
 assert.notEqual(project.state.session.square.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='background').image.src,project.state.session.story.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='background').image.src);
});
test('Ladies Rose Gold headline family is complete and template scoped',()=>{
 assert.equal(FONT_FILE_MAP['Ladies Rose Gold PNG'],'/fonts/LadiesRoseGoldPNG.woff2?v=3');
 assert.equal(TEMPLATE_ONLY_FONT_FAMILIES.has('Ladies Rose Gold PNG'),true);
 assert.equal(isPngGlyphFamily('Ladies Rose Gold PNG'),true);
 assert.equal(PNG_GLYPH_COLLECTIONS.some(c=>c.family==='Ladies Rose Gold PNG'),false);
 const metrics=JSON.parse(readFileSync('public/generated-flyers/assets/png-glyphs/ladies-night-rose/metrics.json','utf8'));
 assert.equal(Object.keys(metrics.glyphs).length,62);for(const char of 'Ladies')assert.ok(metrics.glyphs[char],char);
});
test('Ladies Night Rose is an active portable recipe',()=>{
 assert.equal(getVisualRecipe('ladies-night-rose')?.version,3);
 assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS['ladies-night-rose'],'/generated-flyers/ladies-night-rose.nflyer');
});

test('Four-sheet glyph package preserves isolated source art and normalized lowercase metrics',()=>{
 const dir='public/generated-flyers/assets/png-glyphs/ladies-night-rose/';
 const m=JSON.parse(readFileSync(dir+'metrics.json','utf8'));
 assert.equal(m.version,3);assert.equal(m.sources.length,4);
 const hashes=new Set();const cells=new Set();
 for(const g of Object.values(m.glyphs) as any[]){
  hashes.add(createHash('sha256').update(readFileSync(dir+g.nativeGlyph)).digest('hex'));
  cells.add(`${g.sheet}:${g.cell}`);
  assert.ok(g.sourceSize[0]>100 && g.sourceSize[1]>150,'Source glyph retains more than a thumbnail');
 }
 assert.equal(hashes.size,62);assert.equal(cells.size,62);
 assert.equal(m.glyphs.a.ascender,m.glyphs.s.ascender);
 assert.ok(m.glyphs.d.ascender>m.glyphs.a.ascender);
 assert.ok(m.glyphs.g.descender>0);assert.ok(m.glyphs.j.componentCount>=2);
});
test('Pink script family remains complete and private to the recipe',()=>{
 const family='Ladies Night Pink PNG';
 assert.ok(FONT_FILE_MAP[family]);assert.ok(TEMPLATE_ONLY_FONT_FAMILIES.has(family));
 assert.ok(isPngGlyphFamily(family));assert.equal(PNG_GLYPH_COLLECTIONS.some(c=>c.family===family),false);
 const m=JSON.parse(readFileSync('public/generated-flyers/assets/png-glyphs/ladies-night-pink/metrics.json','utf8'));
 assert.equal(Object.keys(m.glyphs).length,62);for(const c of 'Night')assert.ok(m.glyphs[c]);
});
