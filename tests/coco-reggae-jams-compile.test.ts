import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {FONT_FILE_MAP,TEMPLATE_ONLY_FONT_FAMILIES} from '../lib/localFontMap.ts';
import {isPngGlyphFamily,PNG_GLYPH_COLLECTIONS} from '../lib/pngGlyphCollections.ts';
const project=JSON.parse(readFileSync('public/generated-flyers/reggae-jams.nflyer','utf8'));
for(const format of ['square','story'])test(`Reggae Jams ${format} preserves editable text and independent artwork`,()=>{
 const v=project.state.session[format],doc=v.cocoCompositionSystem.compiledDocument;
 assert.equal(doc.canvas.width,1080);assert.equal(doc.canvas.height,format==='square'?1080:1920);
 const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,20);
 for(const o of text){assert.ok(o.editable);assert.ok(o.binding.panel,o.id);assert.ok(o.binding.text,o.id);assert.doesNotMatch(o.typography.fontFamily,/^Reg(?:Display|Bold|Light|Cond|Script)$/);}
 const expected={headline:'headline',jams:'head2',musicLabel:'details2',lineup:'details2',hostLabel:'details',hosts:'details',attractions:'details',motto:'rightRail',dressCode:'details',venue:'venue',address:'venue',contactLabel:'leftRail',contact:'leftRail',weekday:'date',year:'date',time:'date',endTime:'date'};
 for(const [id,panel] of Object.entries(expected))assert.equal(text.find((o:any)=>o.id===id).binding.panel,panel,id);
 const headline=text.find((o:any)=>o.id==='headline');assert.equal(headline.typography.fontFamily,'Anton');assert.equal(headline.paint.textEffect,'reggae-stucco-v1');assert.match(headline.paint.backgroundImage,/reggae-jams-stucco\.svg/);
 const jams=text.find((o:any)=>o.id==='jams');assert.equal(jams.text,'Jams');assert.equal(jams.typography.fontFamily,'Reggae Jams Script PNG');assert.equal(jams.typography.textTransform,'none');
 for(const id of ['background','subject']){
  const src=doc.objects.find((o:any)=>o.id===id).image.src;
  assert.match(src,/^(?:data:image\/webp;base64,|\/generated-flyers\/assets\/registered-recipes\/[a-f0-9]+\.webp$)/);
  if(src.startsWith('/'))assert.ok(existsSync(`public${src}`),src);
 }
 assert.equal(doc.objects.find((o:any)=>o.id==='background').editable,false);
 assert.equal(doc.objects.find((o:any)=>o.id==='subject').editable,true);
 assert.ok(v.emojiList.some((a:any)=>a.cocoCompiledObjectId==='subject'));
 assert.equal(v.cocoCssCompiler.report.unsupported,0);
});
test('Square and Story use distinct supplied backgrounds',()=>{
 const bg=(f:string)=>project.state.session[f].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='background').image.src;
 assert.notEqual(bg('square'),bg('story'));
});
test('supplied Jams alphabet is template scoped and complete',()=>{
 assert.equal(FONT_FILE_MAP['Reggae Jams Script PNG'],'/fonts/ReggaeJamsScriptPNG.woff2?v=2');
 assert.equal(TEMPLATE_ONLY_FONT_FAMILIES.has('Reggae Jams Script PNG'),true);
 assert.equal(isPngGlyphFamily('Reggae Jams Script PNG'),true);
 assert.equal(PNG_GLYPH_COLLECTIONS.some(c=>c.family==='Reggae Jams Script PNG'),false);
 const metrics=JSON.parse(readFileSync('public/generated-flyers/assets/png-glyphs/reggae-jams-script/metrics.json','utf8'));
 assert.equal(Object.keys(metrics.glyphs).length,62);
 for(const char of 'Jams')assert.ok(metrics.glyphs[char],char);
 assert.ok(metrics.glyphs.J.sourceBounds[3]>=280,'uppercase J retains its full supplied descender');
});
