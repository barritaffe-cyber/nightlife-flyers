import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const project=JSON.parse(readFileSync('public/generated-flyers/i-love-thursday.nflyer','utf8'));
for(const format of ['square','story'])test(`I Love Thursday ${format} has portable fonts and editable sidebar text`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='square'?1080:1920);
 const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,14);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.panel,o.id);assert.ok(o.binding.text,o.id);assert.doesNotMatch(o.typography.fontFamily,/^Teddy/,'CSS-only aliases must not reach the editor');}
 assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Good Brush');
 assert.equal(text.find((o:any)=>o.id==='day').typography.fontFamily,'LEMONMILK-Bold');
 assert.equal(text.find((o:any)=>o.id==='ordinal').binding.panel,'date');
 assert.match(doc.objects.find((o:any)=>o.id==='background').image.src,/^data:image\/webp;base64,/);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
test('I Love Thursday keeps distinct supplied backgrounds for Square and Story',()=>{
 const bg=(format:string)=>project.state.session[format].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='background').image.src;
 assert.notEqual(bg('square'),bg('story'));
});
