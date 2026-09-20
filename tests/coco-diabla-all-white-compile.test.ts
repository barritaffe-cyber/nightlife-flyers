import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/diabla-all-white.nflyer','utf8'));
for(const format of ['square','story'])test(`Diabla ${format} retains supplied background and editable controls`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.deepEqual([doc.canvas.width,doc.canvas.height],[1080,format==='square'?1080:1920]);
 const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,10);
 for(const o of text){assert.ok(o.editable,o.id);assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);}
 const source=readFileSync(`public/generated-flyers/assets/all-white-${format}.${format==='square'?'png':'jpg'}`);
 const bg=doc.objects.find((o:any)=>o.id==='background');
 assert.deepEqual(Buffer.from(bg.image.src.split(',')[1],'base64'),source);
 assert.equal(bg.editable,false);assert.equal(doc.objects.some((o:any)=>o.semanticRole==='subject'),false);
 for(const id of ['headline','script'])assert.match(text.find((o:any)=>o.id===id).paint.backgroundImage,/linear-gradient/);
 assert.equal(text.find((o:any)=>o.id==='script').binding.panel,'head2');
 assert.equal(v.qrEnabled,false);assert.equal(v.priceLabel,'');assert.equal(v.presenterEnabled,false);

 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
test('Diabla adapts title placement independently for each supplied aspect',()=>{
 const headline=(f:string)=>project.state.session[f].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='headline');
 assert.ok(headline('square').bounds.y>45);assert.ok(headline('story').bounds.y<15);
});
