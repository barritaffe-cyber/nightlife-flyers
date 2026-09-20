import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/rnb-thursdays.nflyer','utf8'));
const subject=readFileSync('public/generated-flyers/assets/r&b-subject.png');
for(const format of ['square','story'])test(`R&B Thursdays ${format} keeps editable fields and exact supplied subject`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='square'?1080:1920);
 const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,14);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.panel,o.id);assert.ok(o.binding.text,o.id);}
 const expected={headline:'headline',thursdays:'head2',month:'date',date:'date',time:'date',endTime:'date',recurrence:'details',entry:'price',entryLabel:'price',attractions:'rightRail',address:'venue',contactLabel:'leftRail',contact:'leftRail'};
 for(const [id,panel] of Object.entries(expected))assert.equal(text.find((o:any)=>o.id===id).binding.panel,panel,id);
 const image=doc.objects.find((o:any)=>o.id==='subject');assert.equal(image.editable,true);
 assert.deepEqual(Buffer.from(image.image.src.split(',')[1],'base64'),subject);
 assert.equal(doc.objects.find((o:any)=>o.id==='background').editable,false);
 assert.ok(v.emojiList.some((a:any)=>a.cocoCompiledObjectId==='subject'));
 assert.equal(v.qrEnabled,true);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
 assert.equal(v.cocoCssCompiler.report.warnings.length,0);
 assert.match(text.find((o:any)=>o.id==='headline').paint.backgroundImage,/linear-gradient/);
});
test('R&B has separate supplied backgrounds and independently authored aspect layouts',()=>{
 const get=(f:string)=>project.state.session[f].cocoCompositionSystem.compiledDocument;
 assert.notEqual(get('square').objects.find((o:any)=>o.id==='background').image.src,get('story').objects.find((o:any)=>o.id==='background').image.src);
 assert.notDeepEqual(get('square').objects.find((o:any)=>o.id==='subject').bounds,get('story').objects.find((o:any)=>o.id==='subject').bounds);
});
