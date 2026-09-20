import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/fantasy-v2.json',import.meta.url),'utf8'));
test('Fantasy keeps the supplied backgrounds, editable copy and a transparent canvas base',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,format==='story'?'/generated-flyers/assets/fantassy-story.png':'/templates/fantasy-editor.jpg');
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,24);
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,24);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);}
  for(const id of ['dj1','dj3'])assert.equal(texts.find((o:any)=>o.id===id).binding.uiField,'details2');
  assert.match(v.bgUrl,/^data:image\/svg\+xml,/);assert.equal(v.backgroundUrl,v.bgUrl);
  assert.equal(v.subtagEnabled,false);assert.equal(v.priceEnabled,false);
 }
});
test('Fantasy gallery matches both portable project sessions',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/fantasy.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
});
