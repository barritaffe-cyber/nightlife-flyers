import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {TEMPLATE_ONLY_FONT_FAMILIES,FONT_FILE_MAP} from '../lib/localFontMap.ts';
import {PNG_GLYPH_COLLECTIONS,isPngGlyphFamily} from '../lib/pngGlyphCollections.ts';
const variants=JSON.parse(readFileSync('lib/template-data/eaden-v2.json','utf8'));
test('Eaden preserves editable copy and separate format backgrounds',()=>{
 for(const format of ['square','story']){
  const v=variants[format],doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/eden-${format}.jpg`);
  assert.equal(doc.canvas.height,format==='square'?1080:1920);
  assert.equal(doc.objects.find((o:any)=>o.id==='headline').text,'Eaden');
  assert.equal(doc.objects.find((o:any)=>o.id==='headline').typography.fontFamily,'Eaden Gold PNG');
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,19);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,19);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.equal(v[o.binding.text],o.text,o.id);if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id);}
  assert.equal(v.textFx.uppercase,false);assert.equal(v.qrEnabled,false);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
 }
 const project=JSON.parse(readFileSync('public/generated-flyers/eaden.nflyer','utf8'));
 assert.deepEqual(project.state.session.square,variants.square);assert.deepEqual(project.state.session.story,variants.story);
});
test('Eaden font loads for the template but is excluded from both font menu systems',()=>{
 assert.equal(FONT_FILE_MAP['Eaden Gold PNG'],'/fonts/EadenGoldPNG.woff2?v=2');
 assert.equal(TEMPLATE_ONLY_FONT_FAMILIES.has('Eaden Gold PNG'),true);
 assert.equal(isPngGlyphFamily('Eaden Gold PNG'),true);
 assert.equal(PNG_GLYPH_COLLECTIONS.some(c=>c.family==='Eaden Gold PNG'),false);
 const fontLists=readFileSync('lib/fonts.ts','utf8');
 assert.match(fontLists,/filter\(family => !TEMPLATE_ONLY_FONT_FAMILIES.has\(family\)\)/);
 assert.match(fontLists,/HEADLINE2_FONTS_LOCAL = \[\.\.\.HEADLINE_FONTS_LOCAL\]/);
 const metrics=JSON.parse(readFileSync('public/generated-flyers/assets/png-glyphs/eaden-gold/metrics.json','utf8'));
 assert.equal(Object.keys(metrics.glyphs).length,62);
 assert.equal(metrics.version,2);
 assert.equal(metrics.sources.length,4);
 for(const [index,source] of metrics.sources.entries()) {
  assert.ok(source.path.endsWith(`gold-eden0${index+1}.png`));
  assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);
 }
 for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') assert.ok(metrics.glyphs[ch],ch);
});
