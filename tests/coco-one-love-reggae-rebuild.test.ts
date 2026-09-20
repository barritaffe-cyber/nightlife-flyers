import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/one-love-reggae-v2.json',import.meta.url),'utf8'));
test('One Love Reggae preserves both backgrounds, cream and gold typography and independent bindings',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/one-L-${format}.jpg`);
  const title=doc.objects.find((o:any)=>o.id==='headline');
  assert.equal(title.typography.fontFamily,'Drift Brush SVG');assert.equal(title.text,'ONE');assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').typography.fontFamily,'Drift Brush SVG');assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').text,'LOVE');
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,9);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,9);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.equal(v[o.binding.text],o.text,o.id);if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id);}
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').binding.tracking,'head2Tracking');
  assert.equal(doc.objects.find((o:any)=>o.id==='genres').binding.labelObjectId,'detailsLabel');
  assert.equal(v.qrEnabled,false);assert.equal(v.qrImageUrl,null);assert.equal(doc.objects.some((o:any)=>o.id==='qrPlaceholder'),false);
 }
});
test('One Love Reggae portable sessions equal gallery variants',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/one-love-reggae.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(sessions.square,variants.square);assert.deepEqual(sessions.story,variants.story);
 assert.notDeepEqual(variants.square.cocoCompositionSystem.compiledDocument.objects,variants.story.cocoCompositionSystem.compiledDocument.objects);
 const registry=readFileSync(new URL('../lib/templates.ts',import.meta.url),'utf8');
 assert.match(registry,/id:'one_love_reggae'/);
 assert.match(registry,/One Love — Reggae Night/);
});
