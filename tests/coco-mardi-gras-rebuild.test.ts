import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/mardi-gras-v2.json',import.meta.url),'utf8'));
test('Mardi Gras Carnival preserves supplied backgrounds and independent editable objects in both formats',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(v.leftRailEnabled,false);
  assert.equal(v.leftRail,'');
  assert.equal(v.presenterEnabled,true);
  assert.equal(v.qrEnabled,true);
  for(const key of ['portraits','emojiList'])assert.equal(v[key].some((o:any)=>o.id.endsWith('_qrPlaceholder')),false);assert.equal(v.qrImageUrl,null);
  assert.equal(doc.objects.some((o:any)=>o.id==='qrPlaceholder'),false);
  assert.ok(Math.abs(v.head2Fx.tracking-0)<1e-8);
  assert.equal(doc.objects.length,28);
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').binding.tracking,'head2Tracking');
  assert.doesNotMatch(doc.objects.find((o:any)=>o.id==='headline').paint.backgroundSize,/%/,'Per-glyph SVG textures require a shared full-word pixel size');
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/mardi-gras-${format}.jpg`);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,18);
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,18);
  for(const o of texts){assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);assert.equal(o.editable,true,o.id);assert.equal(v[o.binding.text],o.text,o.id+' initial text');if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id+' enabled');}
  assert.equal(texts.find((o:any)=>o.id==='headline').typography.fontFamily,'Didot');
  assert.equal(texts.find((o:any)=>o.id==='subtitle').typography.fontFamily,'Dear Script (Demo_Font)');
  assert.equal(texts.find((o:any)=>o.id==='address').binding.panel,'venue');
  assert.equal(texts.find((o:any)=>o.id==='genres').binding.labelObjectId,'detailsLabel');
  assert.match(texts.find((o:any)=>o.id==='headline').paint.backgroundImage,/^url\("\/generated-flyers\/assets\/mardi-gras-gold.svg"\)$/);
 }
});
test('Mardi Gras Carnival portable sessions equal gallery data',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/mardi-gras.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
 assert.notDeepEqual(variants.square.cocoCompositionSystem.compiledDocument.objects,variants.story.cocoCompositionSystem.compiledDocument.objects);
});
