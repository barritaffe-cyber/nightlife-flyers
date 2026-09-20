import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
test('Glow replacement retains editable supplied lettering and independent backgrounds',()=>{
 const {state}=read('public/generated-flyers/glow.nflyer');
 for(const format of ['square','story']){
  const doc=state.session[format].cocoCompositionSystem.compiledDocument;
  const texts=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(texts.length,17);
  for(const [id,family] of [['headline','Glow Chrome PNG'],['subtitle','Neon Green PNG']]){
   const text=texts.find((o:any)=>o.id===id);assert.ok(text.binding.text);assert.equal(text.typography.fontFamily,family);
  }
  assert.ok(JSON.stringify(doc).includes('glow-'+format+'.jpg'));
  assert.ok(texts.find((o:any)=>o.id==='detailsLabel' && o.text===''));
 }
 const old='public/generated-flyers/glow-in-the-dark.nflyer';
 assert.equal(createHash('sha256').update(readFileSync(old)).digest('hex'),read('recipe-file-backups/glow-rebuild/manifest.json')[old]);
});

test('Glow Chrome uses all 62 supplied clean glyphs without downsampling',()=>{
 const metrics=read('public/generated-flyers/assets/png-glyphs/glow-chrome/metrics.json');
 assert.equal(metrics.version,2);assert.equal(metrics.bitmapPpem,600);
 assert.equal(Object.keys(metrics.glyphs).length,62);assert.equal(metrics.sources.length,4);
 for(const [index,source] of metrics.sources.entries()) {
  assert.ok(source.path.endsWith(`glow-neon0${index+1}.png`));
  assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);
 }
 for(const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  const glyph=metrics.glyphs[char];assert.ok(glyph,char);assert.ok(glyph.sourceScale>=1,char);
  assert.ok(readFileSync(`public/generated-flyers/assets/png-glyphs/glow-chrome/${glyph.nativeGlyph}`).length>0,char);
 }
 for(const char of 'ij')assert.equal(metrics.glyphs[char].componentCount,2,`${char} retains its dot`);
 for(const file of ['lib/localFontMap.ts','app/globals.css','public/generated-flyers/glow-master.html','public/generated-flyers/glow-font-specimens.html'])assert.ok(readFileSync(file,'utf8').includes('GlowChromePNG.woff2?v=2'),file);
});
