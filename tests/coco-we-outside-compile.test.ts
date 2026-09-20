import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer','utf8'));
for(const format of ['square','story'])test(`We Outside ${format} preserves editable text and portable art`,()=>{
 const v=project.state.session[format];
 const doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);
 assert.equal(doc.canvas.height,format==='square'?1080:1920);
 const text=doc.objects.filter((o:any)=>o.kind==='text' && o.editable);
 assert.equal(text.length,12);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.text,`${o.id}: text binding`);assert.ok(o.binding.panel,`${o.id}: existing panel`);}
 assert.equal(text.find((o:any)=>o.id==='day').typography.fontFamily,'Anton');
 const images=doc.objects.filter((o:any)=>o.kind==='image');
 assert.equal(images.length,3);
 for(const o of images)assert.match(o.image.src,/^data:image\/(webp|svg\+xml);base64,/);
 const badge=images.find((o:any)=>o.id==='weBadge');
 const svg=Buffer.from(badge.image.src.split(',')[1],'base64').toString();
 assert.match(svg,/<path /);assert.doesNotMatch(svg,/<(?:text|image)\b/);
 assert.equal(text.find((o:any)=>o.id==='we').binding.text,'subtag');
 const divider=images.find((o:any)=>o.id==='divider');assert.ok(divider.editable);assert.equal(divider.binding.panel,undefined);assert.equal(divider.binding.text,undefined);
 assert.equal(v.leftRailEnabled,false);assert.equal(v.priceEnabled,false);assert.equal(v.qrEnabled,false);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
