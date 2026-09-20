import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/amapiano-night.nflyer','utf8'));
for(const format of ['square','story'])test(`Amapiano Night ${format} has portable fonts and editable sidebar text`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='square'?1080:1920);
 assert.equal(v.head2Enabled,true);assert.equal(v.presenterEnabled,true);
 const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,15);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.panel,o.id);assert.ok(o.binding.text,o.id);assert.doesNotMatch(o.typography.fontFamily,/^Ama/,'CSS-only aliases must not reach the editor');}
 assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Lacheyard Script');
 assert.equal(text.find((o:any)=>o.id==='headline').paint.strokeColor,'#ffffff');
 for(const id of ['musicBanner','hostBanner','offerBanner'])assert.ok(doc.objects.some((o:any)=>o.id===id));
 assert.equal(text.find((o:any)=>o.id==='lineup').typography.fontFamily,'LEMONMILK-Bold');
 assert.equal(text.find((o:any)=>o.id==='date').binding.panel,'date');
 assert.match(doc.objects.find((o:any)=>o.id==='background').image.src,/^data:image\/webp;base64,/);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
test('Amapiano Night keeps distinct supplied backgrounds for Square and Story',()=>{
 const bg=(format:string)=>project.state.session[format].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='background').image.src;
 assert.notEqual(bg('square'),bg('story'));
});

test('paper footer remains an independent portable image when background changes',()=>{
 for(const format of ['square','story']) {
  const doc=structuredClone(project.state.session[format].cocoCompositionSystem.compiledDocument);
  const tear=doc.objects.find((o:any)=>o.id==='paperTear');
  assert.ok(tear?.editable);assert.notEqual(tear.semanticRole,'background');
  assert.match(tear.image.src,/^data:image\/webp;base64,/);
  const before=JSON.stringify(tear);
  doc.objects.find((o:any)=>o.id==='background').image.src='replacement.jpg';
  assert.equal(JSON.stringify(tear),before);
  assert.ok(doc.objects.some((o:any)=>o.id==='footerBacking'));
 }
});

test('Amapiano maps flyer copy to the appropriate panels',()=>{
 for(const f of ['square','story']) {
  const objects=project.state.session[f].cocoCompositionSystem.compiledDocument.objects;
  const expected={presenter:'presenter',presents:'presenter',headline:'headline',night:'head2',date:'date',musicLabel:'details2',lineup:'details2',hostLabel:'details',hosts:'details',offerLabel:'details',offer:'details',venue:'venue',address:'venue',contactLabel:'leftRail',contact:'leftRail'};
  for(const [id,panel] of Object.entries(expected))assert.equal(objects.find((o:any)=>o.id===id).binding.panel,panel,id);
  assert.equal(objects.find((o:any)=>o.id==='contactLabel').binding.text,'leftRailLabel');
 }
});
