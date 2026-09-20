import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/salsa-noche-v2.json',import.meta.url),'utf8'));
test('Salsa Noche preserves both backgrounds, cream and gold typography and independent bindings',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/salsa-${format}.jpg`);
  const title=doc.objects.find((o:any)=>o.id==='headline');
  assert.equal(title.typography.fontFamily,'Dear Script (Demo_Font)');assert.equal(title.text,'Salsa');assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').text,'NOCHE');
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,17);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,17);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.equal(v[o.binding.text],o.text,o.id);if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id);}
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').binding.tracking,'head2Tracking');
  assert.equal(doc.objects.find((o:any)=>o.id==='genres').binding.labelObjectId,'detailsLabel');
  assert.equal(v.qrEnabled,true);assert.equal(v.qrImageUrl,null);assert.equal(doc.objects.some((o:any)=>o.id==='qrPlaceholder'),false);
 }
});
test('Salsa Noche portable sessions equal gallery variants',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/salsa-noche.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(sessions.square,variants.square);assert.deepEqual(sessions.story,variants.story);
 assert.notDeepEqual(variants.square.cocoCompositionSystem.compiledDocument.objects,variants.story.cocoCompositionSystem.compiledDocument.objects);
 const registry=readFileSync(new URL('../lib/templates.ts',import.meta.url),'utf8');
 const hidden=registry.match(/const HIDDEN_TEMPLATE_IDS = new Set\(\[([\s\S]*?)\]\)/)?.[1];
 assert.ok(hidden);assert.doesNotMatch(hidden,/'latin_street_tropical'/);
 assert.match(registry,/id: 'latin_street_tropical'/);assert.match(registry,/salsaNocheRebuiltTemplate\.preview = '\/generated-flyers\/salsa-noche-square-preview.png'/);
});
