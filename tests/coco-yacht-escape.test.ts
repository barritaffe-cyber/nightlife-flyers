import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/yacht-escape-v2.json',import.meta.url),'utf8'));
test('Yacht uses the supplied format-specific backgrounds and editable text bindings',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/yacht-${format}.${format==='story'?'jpg':'png'}`);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,21);
  for(const o of texts){assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);assert.equal(o.editable,true,o.id);}
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,21);
  assert.equal(texts.find((o:any)=>o.id==='headline').typography.fontFamily,'Didot');
  assert.equal(texts.find((o:any)=>o.id==='script').typography.fontFamily,'Dear Script (Demo_Font)');
  for(const id of ['day','month','boardingLabel','sailingLabel','sailing','club'])assert.equal(texts.find((o:any)=>o.id===id).binding.mappedControls,true,id);
 }
});
test('Yacht gallery preserves the authoritative saved layouts exactly',()=>{
 const source=readFileSync(new URL('../public/generated-flyers/yacht-escape.nflyer',import.meta.url));
 assert.deepEqual(readFileSync(new URL('../public/generated-flyers/yacht-escape-updated.nflyer',import.meta.url)),source);
 const sessions=JSON.parse(source.toString()).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
 assert.equal(variants.story.qrEnabled,true);
});
