import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG_GLYPH_COLLECTIONS,isPngGlyphFamily} from '../lib/pngGlyphCollections.ts';
import {FONT_FILE_MAP,TEMPLATE_ONLY_FONT_FAMILIES} from '../lib/localFontMap.ts';
import {getVisualRecipe} from '../lib/visualRecipes.ts';
import {COCO_CURATED_ART_DIRECTION_LIBRARY} from '../components/coco/artDirections/library.ts';
import {cocoRecipeFormCapabilities} from '../lib/coco/formRecipeMapping.ts';
import {cocoHeadlineAssignments,cocoHeadlineMatches} from '../lib/coco/recipeCompatibility.ts';
import {materializeCocoPortableRecipeVariant,COCO_PORTABLE_RECIPE_PROJECT_URLS} from '../lib/coco/portableRecipeRuntime.ts';
const id='ycee-live';
const formats=JSON.parse(readFileSync('public/generated-flyers/ycee-live.nflyer','utf8')).state.session;
const caps=cocoRecipeFormCapabilities(id,formats);
const variants=['square','story'] as const;
test('Spotlight Gold exposes the 62 supplied glyphs in the reusable picker',()=>{
 const family='Spotlight Gold PNG',folder='public/generated-flyers/assets/png-glyphs/spotlight-gold';
 const metrics=JSON.parse(readFileSync(`${folder}/metrics.json`,'utf8'));
 assert.equal(metrics.family,family);
 assert.deepEqual(Object.keys(metrics.glyphs).sort(),Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789').sort());
 for(const source of metrics.sources)assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);
 for(const [char,g] of Object.entries(metrics.glyphs) as [string,any][]){assert.equal(readFileSync(`${folder}/${g.nativeGlyph}`).subarray(1,4).toString(),'PNG',char);assert.ok(g.sourceScale>=1,char);}
 assert.ok(PNG_GLYPH_COLLECTIONS.some(f=>f.family===family));assert.ok(isPngGlyphFamily(family));assert.equal(TEMPLATE_ONLY_FONT_FAMILIES.has(family),false);
 assert.equal(readFileSync(`public${FONT_FILE_MAP[family].split('?')[0]}`).subarray(0,4).toString(),'wOF2');
});
test('YCEE Live registers both formats with a separate editable subject and portrait echo',()=>{
 assert.equal(getVisualRecipe(id)?.name,'YCEE Live');assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[id],'/generated-flyers/ycee-live.nflyer');
 assert.equal(COCO_CURATED_ART_DIRECTION_LIBRARY.find(d=>d.id===id)?.containsSubject,true);
 for(const format of variants){const v=formats[format],doc=v.cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/artist:dj/01-${format}.jpg`);
  const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,18);assert.equal(new Set(text.map((o:any)=>o.binding.text)).size,18);
  for(const o of text){assert.ok(o.editable,o.id);assert.ok(o.binding.panel,o.id);}
  assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Spotlight Gold PNG');
  const subject=v.portraits.find((o:any)=>o.cocoCompiledObjectId==='subject'),echo=v.portraits.find((o:any)=>o.cocoCompiledObjectId==='ghost');
  assert.equal(subject.locked,false);assert.equal(subject.isExtracted,true);assert.equal(echo.locked,false);
  assert.ok(echo.opacity<.3);assert.notEqual(subject.id,echo.id);
 }
});
test('date, venue, contacts and logo copy map to the right owners in both formats',()=>{
 for(const [field,owners]of Object.entries({presenterName:['presenter'],date:['day','month','date'],startTime:['time'],ageRequirement:['age'],rsvpContact:['contact'],venueName:['venue'],address:['address'],'recipe:brandName':['brandName'],'recipe:brandCity':['brandCity']}))assert.deepEqual(caps.bindings[field]?.targets,{square:owners,story:owners},field);
 assert.ok(cocoHeadlineMatches(id,formats,'YCEE Live'));
 for(const format of variants){
  assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'YCEE Live'),{headline:'YCEE',subtitle:'Live'});
  const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'YCEE Live',fieldMappingVersion:1,eventBrief:{theme:'Elegant',fieldFormats:caps.fieldFormats,recipeFieldBindings:caps.bindings,presenterName:'NOVA EVENTS',date:'August 17, 2030',startTime:'11PM',ageRequirement:'25+',venueName:'CLUB NOVA',address:'12 MAIN ST',rsvpContact:'555 123 4567','recipe:brandName':'NOVA','recipe:brandCity':'MIAMI'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const [owner,value]of Object.entries({presenter:'NOVA EVENTS',date:'17',day:'SAT',month:'AUG',ordinal:'TH',time:'11PM',age:'25+',venue:'CLUB NOVA',address:'12 MAIN ST',contact:'555 123 4567',brandName:'NOVA',brandCity:'MIAMI'}))assert.equal(edits[owner]?.text,value,`${format}/${owner}`);
  assert.equal(edits.motto.text,'MUSIC\nPEOPLE\nDRINKS\nVIBES');assert.deepEqual(result.cocoFormMappingReport.unplacedFields,[]);
 }
});
test('empty fields hide their labels, rules, logo monogram and age badge text',()=>{
 for(const format of variants){const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'YCEE Live',fieldMappingVersion:1,eventBrief:{theme:'Elegant'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const owner of ['presenter','presents','time','doors','age','contact','contactLabel','ordinal','brandName','brandCity'])assert.equal(edits[owner]?.text,'',`${format}/${owner}`);
  for(const owner of ['rDate','rVenue','rContact','brandMark'])assert.equal(edits[owner]?.removed,true,`${format}/${owner}`);
 }
});
