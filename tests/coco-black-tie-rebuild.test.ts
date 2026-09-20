import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/black-tie-v2.json',import.meta.url),'utf8'));
test('Black Tie preserves independent backgrounds, editable roles and an optional label in both formats',()=>{
  for(const [format,v] of Object.entries(variants) as [string,any][]){
    const doc=v.cocoCompositionSystem.compiledDocument;
    assert.equal(doc.canvas.width,1080);
    assert.equal(doc.canvas.height,format==='story'?1920:1080);
    assert.deepEqual(doc.report.warnings,[]);
    assert.equal(doc.report.unsupported,0);
    const texts=doc.objects.filter((o:any)=>o.kind==='text');
    assert.equal(texts.length,15);
    assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,15);
    for(const object of texts){assert.equal(object.editable,true);assert.ok(object.binding.panel);assert.equal(object.binding.pixelHitBounds,true);}
    const label=texts.find((o:any)=>o.id==='detailsLabel');
    assert.equal(label.binding.text,'detailsLabel');assert.equal(label.text,'');
    assert.equal(texts.find((o:any)=>o.id==='details').binding.labelObjectId,label.id);
    assert.equal(v.detailsTracking,v.bodyTracking);
    const backgrounds=doc.objects.filter((o:any)=>o.kind==='image');
    assert.equal(backgrounds.length,1);
    assert.equal(backgrounds[0].image.src,`/generated-flyers/assets/black-tie-${format==='story'?'story.jpg':'square.png'}`);
    assert.match(v.bgUrl,/^data:image\/svg\+xml,/);
    for(const id of ['headline','subtitle'])assert.match(texts.find((o:any)=>o.id===id).paint.backgroundImage,/linear-gradient/);
  }
});
test('Black Tie gallery data matches the portable project',()=>{
  const project=JSON.parse(readFileSync(new URL('../public/generated-flyers/black-tie.nflyer',import.meta.url),'utf8'));
  assert.deepEqual(project.state.session,variants);
});
test('Black Tie retains the accepted user file byte for byte',()=>{
  const metadata=JSON.parse(readFileSync(new URL('../lib/template-data/black-tie-saved-source.json',import.meta.url),'utf8'));
  assert.deepEqual(readFileSync(new URL('../'+metadata.source,import.meta.url)),readFileSync(new URL('../'+metadata.submittedPath,import.meta.url)));
});
