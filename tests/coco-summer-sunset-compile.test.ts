import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/summer-sunset.nflyer','utf8'));
for(const format of ['square','story'])test(`Summer Sunset ${format} preserves assets, split lettering and controls`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.deepEqual([doc.canvas.width,doc.canvas.height],[1080,format==='square'?1080:1920]);
 const texts=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(texts.length,11);
 for(const o of texts){assert.ok(o.editable);assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);}
 const headline=texts.find((o:any)=>o.id==='headline');assert.equal(headline.text,'SUM\nMER');
 assert.deepEqual(headline.textRuns.filter((r:any)=>r.color==='rgb(255, 224, 0)').map((r:any)=>r.text),['M','M']);
 const bg=doc.objects.find((o:any)=>o.id==='background');
 assert.deepEqual(Buffer.from(bg.image.src.split(',')[1],'base64'),readFileSync(`public/generated-flyers/assets/sunset-${format}.png`));
 assert.equal(bg.editable,false);assert.ok(doc.objects.find((o:any)=>o.id==='frame'));
 assert.equal(v.detailsEnabled,false);assert.equal(v.details,'');assert.equal(v.qrEnabled,format==='story');assert.equal(v.priceLabel,'');
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
