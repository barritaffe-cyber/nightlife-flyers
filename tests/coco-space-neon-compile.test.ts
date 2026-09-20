import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/space-neon.nflyer','utf8'));
for(const format of ['square','story'])test(`Space Neon ${format} preserves editable text and portable art`,()=>{
 const v=project.state.session[format];
 const doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);
 assert.equal(doc.canvas.height,format==='square'?1080:1920);
 const text=doc.objects.filter((o:any)=>o.kind==='text');
 assert.equal(text.length,12);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.text,`${o.id}: text binding`);assert.ok(o.binding.panel,`${o.id}: existing panel`);}
 assert.equal(text.find((o:any)=>o.id==='day').typography.fontFamily,'LEMONMILK-Bold');
 assert.equal(text.find((o:any)=>o.id==='headline').paint.strokeColor,'#ff3187');
 const images=doc.objects.filter((o:any)=>o.kind==='image');
 assert.equal(images.length,2);
 for(const o of images)assert.match(o.image.src,/^data:image\/webp;base64,/);
 assert.equal(v.priceLabel,'');assert.equal(v.qrEnabled,false);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
