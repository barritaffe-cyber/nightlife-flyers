import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/taco-tuesday-v2.json',import.meta.url),'utf8'));
test('Taco Tuesday preserves both backgrounds, editable serif and script and independent bindings',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/taco-${format}.jpg`);
  const title=doc.objects.find((o:any)=>o.id==='headline');
  assert.equal(title.typography.fontFamily,'Textured Gold Serif PNG');assert.equal(title.text,format==='story'?'T\nA\nC\nO':'TACO');assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').text,'Tuesday');
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  if(format==='square'){
   const t=title.transform,angle=t.rotate*Math.PI/180,shear=Math.tan(t.skewX*Math.PI/180);
   assert.ok(Math.abs(Math.cos(angle)*t.scaleX-.54)<.00001);
   assert.ok(Math.abs(Math.sin(angle)*t.scaleX+.54*Math.tan(8*Math.PI/180))<.00001);
   assert.ok(Math.abs(t.scaleY*(Math.cos(angle)*shear-Math.sin(angle)))<.00001,'vertical stems match source skewY');
  }else{assert.equal(title.text.split('\n').join(''),'TACO');assert.equal(title.transform.rotate,0);}
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,18);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,18);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.equal(v[o.binding.text],o.text,o.id);if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id);}
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').binding.tracking,'head2Tracking');
  assert.equal(doc.objects.find((o:any)=>o.id==='genres').binding.labelObjectId,'detailsLabel');
  assert.equal(v.qrEnabled,false);assert.equal(v.qrImageUrl,null);assert.equal(doc.objects.some((o:any)=>o.id==='qrPlaceholder'),false);
 }
});
test('Taco Tuesday portable sessions equal gallery variants',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/taco-tuesday.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(sessions.square,variants.square);assert.deepEqual(sessions.story,variants.story);
 assert.notDeepEqual(variants.square.cocoCompositionSystem.compiledDocument.objects,variants.story.cocoCompositionSystem.compiledDocument.objects);
 const registry=readFileSync(new URL('../lib/templates.ts',import.meta.url),'utf8');
 assert.match(registry,/id:'taco_tuesday'/);
 assert.match(registry,/taco-tuesday-square-preview.png/);
});
