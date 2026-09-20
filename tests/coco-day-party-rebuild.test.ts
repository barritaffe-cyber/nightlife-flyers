import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const variants=JSON.parse(readFileSync(new URL('../lib/template-data/day-party-v2.json',import.meta.url),'utf8'));
test('Day Party has independent format assets and editable body/label owners',()=>{
  for(const [format,v] of Object.entries(variants) as [string,any][]){
    const doc=v.cocoCompositionSystem.compiledDocument;
    assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='story'?1920:1080);
    assert.equal(doc.report.unsupported,0);assert.deepEqual(doc.report.warnings,[]);
    const texts=doc.objects.filter((o:any)=>o.kind==='text');
    assert.equal(texts.length,19);assert.equal(new Set(texts.map((o:any)=>o.binding.text)).size,19);
    for(const object of texts){assert.equal(object.editable,true);assert.ok(object.binding.panel);assert.equal(object.binding.pixelHitBounds,true);}
    for(const [body,label] of [['details','detailsLabel'],['dj1','musicLabel'],['dj2','musicLabel'],['dj3','musicLabel']]){
      assert.equal(texts.find((o:any)=>o.id===body).binding.labelObjectId,label);
      assert.ok(texts.find((o:any)=>o.id===label));
    }
    const background=doc.objects.filter((o:any)=>o.kind==='image');assert.equal(background.length,1);
    assert.equal(decodeURI(background[0].image.src),`/generated-flyers/assets/day party-${format==='story'?'story.jpg':'square.png'}`);
    assert.match(v.bgUrl,/^data:image\/svg\+xml,/);
    assert.match(texts.find((o:any)=>o.id==='headline').paint.backgroundImage,/day-party-title-texture/);
    assert.doesNotMatch(texts.find((o:any)=>o.id==='headline').paint.backgroundImage,/127\.0\.0\.1|localhost/);
  }
});
test('Day Party gallery and portable sessions agree',()=>{
 const project=JSON.parse(readFileSync(new URL('../public/generated-flyers/day-party.nflyer',import.meta.url),'utf8'));
 assert.deepEqual(project.state.session,variants);
});
