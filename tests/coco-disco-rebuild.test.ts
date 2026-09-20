import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/disco-v2.json',import.meta.url),'utf8'));
test('Disco keeps the supplied backgrounds, editable copy and a transparent canvas base',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,format==='story'?'/generated-flyers/assets/disco-story.jpg':'/generated-flyers/assets/disco-square.png');
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,20);
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,20);
  for(const o of texts){assert.equal(o.editable,true,o.id);assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);}
  for(const id of ['dj1','dj3'])assert.equal(texts.find((o:any)=>o.id===id).binding.uiField,'details2');
  assert.match(v.bgUrl,/^data:image\/svg\+xml,/);assert.equal(v.backgroundUrl,v.bgUrl);
  assert.equal(v.subtagEnabled,false);assert.equal(v.priceEnabled,false);
 }
});
test('Disco gallery matches both portable project sessions',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/disco.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
});
test('Disco preserves the accepted user save byte for byte',()=>{
 const metadata=JSON.parse(readFileSync(new URL('../lib/template-data/disco-saved-source.json',import.meta.url),'utf8'));
 const before=readFileSync(new URL('../'+metadata.submittedPath,import.meta.url));
 const after=readFileSync(new URL('../public/generated-flyers/disco.nflyer',import.meta.url));
 assert.deepEqual(after,before);
});
