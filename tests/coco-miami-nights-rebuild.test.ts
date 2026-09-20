import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/miami-nights-v2.json',import.meta.url),'utf8'));
test('Miami Sunset Sessions preserves supplied backgrounds and independent editable objects in both formats',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(v.leftRailEnabled,false);
  assert.equal(v.leftRail,'');
  assert.equal(v.presenterEnabled,false);
  assert.ok(Math.abs(v.head2Fx.tracking-(format==='story'?.55:.5))<1e-8);
  assert.equal(doc.objects.length,15);
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').binding.tracking,'head2Tracking');
  assert.doesNotMatch(doc.objects.find((o:any)=>o.id==='headline').paint.backgroundSize,/%/,'Per-glyph SVG textures require a shared full-word pixel size');
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/miami-nights-${format}.jpg`);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,10);
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,10);
  for(const o of texts){assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);assert.equal(o.editable,true,o.id);}
  assert.equal(texts.find((o:any)=>o.id==='headline').typography.fontFamily,'Didot');
  assert.equal(texts.find((o:any)=>o.id==='subtitle').typography.fontFamily,'LEMONMILK-Light');
  assert.equal(texts.find((o:any)=>o.id==='address').binding.panel,'venue');
  assert.equal(texts.find((o:any)=>o.id==='genres').binding.labelObjectId,'detailsLabel');
  assert.match(texts.find((o:any)=>o.id==='headline').paint.backgroundImage,/^url\("\/generated-flyers\/assets\/miami-nights-title-texture.svg"\)$/);
 }
});
test('Miami Sunset Sessions portable sessions equal gallery data',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/miami-nights.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
 assert.notDeepEqual(variants.square.cocoCompositionSystem.compiledDocument.objects,variants.story.cocoCompositionSystem.compiledDocument.objects);
});
