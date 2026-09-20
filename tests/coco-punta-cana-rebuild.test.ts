import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync('lib/template-data/punta-cana-v2.json','utf8'));
test('Punta Cana preserves editable copy and separate format backgrounds',()=>{
 for(const format of ['square','story']){
  const v=variants[format],doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/punta-cana-${format}.jpg`);
  assert.equal(doc.canvas.height,format==='square'?1080:1920);
  assert.equal(doc.objects.find((o:any)=>o.id==='headline').text,'Punta');
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').paint.textEffect,'sunset-foil-mask-v2');
  assert.equal(doc.objects.find((o:any)=>o.id==='subtitle').paint.backgroundImage,'url("/generated-flyers/assets/cana-metallic-surface-v6.png")');
  assert.equal(doc.objects.find((o:any)=>o.id==='headline').typography.fontFamily,'Avigea');
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,13);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,13);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.panel,o.id);assert.equal(v[o.binding.text],o.text,o.id);if(o.binding.enabled)assert.equal(v[o.binding.enabled],true,o.id);}
  assert.equal(v.textFx.uppercase,false);assert.equal(v.qrEnabled,false);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
 }
 const project=JSON.parse(readFileSync('public/generated-flyers/punta-cana.nflyer','utf8'));
 assert.deepEqual(project.state.session.square,variants.square);assert.deepEqual(project.state.session.story,variants.story);
});
