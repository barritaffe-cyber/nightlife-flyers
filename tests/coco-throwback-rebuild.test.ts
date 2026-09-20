import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/throwback-v2.json',import.meta.url),'utf8'));
test('Throwback has separate square/story geometry and editable event fields',()=>{
 for(const [format,height] of [['square',1080],['story',1920]] as const){
  const doc=variants[format].cocoCompositionSystem.compiledDocument;
  assert.equal(doc.canvas.height,height);assert.equal(doc.canvas.width,1080);
  assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
  for(const id of ['headline','subtag','date','djs','venue','address']){const o=doc.objects.find((x:any)=>x.id===id);assert.equal(o.kind,'text');assert.equal(o.editable,true);assert.ok(o.binding.text,id);}
 }
 const title=(f:string)=>variants[f].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='headline');
 assert.notEqual(title('square').bounds.y,title('story').bounds.y);
 assert.equal(title('square').typography.fontFamily,'Road Rage');
 assert.equal(title('story').typography.fontFamily,'Road Rage');
});
test('Throwback uses the finished background without duplicating its decorations',()=>{
 for(const [format,v] of Object.entries(variants) as [string,any][]){const objects=v.cocoCompositionSystem.compiledDocument.objects;
  assert.equal(objects.find((o:any)=>o.id==='background').image.src,format==='story'?'/generated-flyers/assets/throwback-bg-story.jpg':'/generated-flyers/assets/throwback-bg.png');
  if(format==='story'){assert.equal(objects.find((o:any)=>o.id==='background').bounds.height,100);assert.equal(objects.find((o:any)=>o.id==='venue').paint.color,'rgb(33, 20, 34)');}
  for(const id of ['crown','rail','lower','genrePaper','oldschool','different','dots']) assert.equal(objects.some((o:any)=>o.id===id),false,id);
  assert.match(objects.find((o:any)=>o.id==='swash').paint.clipPath,/polygon/);
  assert.equal(v.palette.accent,'#ee00aa');
 }
});

test('every Throwback text object has an independent editor binding',()=>{
 for(const v of Object.values(variants) as any[]){
  const texts=v.cocoCompositionSystem.compiledDocument.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,15);
  const fields=texts.map((o:any)=>{assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);assert.equal(o.editable,true,o.id);return o.binding.text;});
  assert.equal(new Set(fields).size,fields.length,'labels must not overwrite another text field');
  for(const id of ['presents','day','month','motto','genres','musicBy','club']){const o=texts.find((o:any)=>o.id===id);assert.equal(o.binding.mappedControls,true,id);assert.ok(o.binding.uiField,id);}
  assert.equal(v.detailsEnabled,true);
 }
});

test('gallery sessions exactly preserve the authoritative user save',()=>{
 const source=readFileSync(new URL('../public/generated-flyers/throwback-saturdays.nflyer',import.meta.url));
 const updated=readFileSync(new URL('../public/generated-flyers/throwback-saturdays-updated.nflyer',import.meta.url));
 assert.deepEqual(updated,source);
 const sessions=JSON.parse(source.toString()).state.session;
 assert.deepEqual(variants.square,sessions.square);assert.deepEqual(variants.story,sessions.story);
 assert.equal(variants.story.qrEnabled,true);
});
