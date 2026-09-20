import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/new-york-v2.json',import.meta.url),'utf8'));
test('New York preserves distinct supplied backgrounds and independent editable copy',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){
  const doc=v.cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,format==='story'?1920:1080);
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/new-york-${format}.${format==='story'?'jpg':'png'}`);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,25);
  for(const o of texts){assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);assert.equal(o.editable,true,o.id);}
  assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,25);
  assert.equal(texts.find((o:any)=>o.id==='headline').typography.fontFamily,'Didot');
  assert.equal(texts.find((o:any)=>o.id==='script').typography.fontFamily,'Dear Script (Demo_Font)');
  for(const id of ['day','month','presents','dj1','dj3','entryNote','dress','dressNote','rsvp','rsvpNote'])assert.equal(texts.find((o:any)=>o.id===id).binding.mappedControls,true,id);
 }
});
test('New York gallery and portable project contain the same authored sessions',()=>{
 const sessions=JSON.parse(readFileSync(new URL('../public/generated-flyers/new-york.nflyer',import.meta.url),'utf8')).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
});
test('accepted New York save changes only the unwanted preview background',()=>{
 const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url));
 const meta=JSON.parse(read('lib/template-data/new-york-saved-source.json').toString());
 const original=JSON.parse(read(meta.submittedPath).toString());
 const corrected=JSON.parse(read(meta.source).toString());
 assert.deepEqual(read(meta.source),read('public/generated-flyers/new-york-updated.nflyer'));
 for(const state of [original.state,original.state.session.square,original.state.session.story]){
  state.bgUrl=corrected.state.bgUrl;state.backgroundUrl=corrected.state.backgroundUrl;
 }
 assert.deepEqual(corrected,original);
 for(const state of [corrected.state,...Object.values(corrected.state.session)] as any[]){
  assert.match(state.bgUrl,/^data:image\/svg\+xml,/);
  assert.equal(state.backgroundUrl,state.bgUrl);
 }
});
