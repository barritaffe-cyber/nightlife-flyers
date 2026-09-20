import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const project=JSON.parse(readFileSync('public/generated-flyers/pulse.nflyer','utf8'));
for(const format of ['square','story'])test(`Pulse ${format} preserves its canvas, text bindings, and portable background`,()=>{
 const v=project.state.session[format];
 const doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);
 assert.equal(doc.canvas.height,format==='square'?1080:1920);
 assert.equal(doc.objects.length,15);
 assert.equal(v.priceLabel,'');
 assert.equal(v.textFx.compiledGradientEdited,false);
 assert.match(doc.objects.find((o:any)=>o.id==='background').image.src,/^data:image\/webp;base64,/);
 const text=doc.objects.filter((o:any)=>o.kind==='text'&&o.editable);
 assert.equal(text.length,10);
 for(const o of text){assert.ok(o.binding.text,o.id);assert.ok(o.binding.panel,o.id);}
 for(const id of ['ghost-one','ghost-two']){const o=doc.objects.find((o:any)=>o.id===id);assert.equal(o.binding.text,'headline');assert.equal(o.paint.strokeWidthPx,.5);}
 assert.match(doc.objects.find((o:any)=>o.id==='headline').paint.backgroundImage,/linear-gradient/);
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});

test('unregistered compiled offers suppress the native price overlay',()=>{
 const app=readFileSync('app/page.tsx','utf8');
 const guard=app.slice(app.indexOf('const cocoCompiledRendererOwnsPrice'),app.indexOf('const [rushMeasuredSvgBounds'));
 assert.match(guard,/hasCocoCompiledCanvas/);
 assert.doesNotMatch(guard,/cocoMaterializedVisualRecipeActive/);
});
