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
const id='honey-nights';
const formats=JSON.parse(readFileSync('public/generated-flyers/honey-nights.nflyer','utf8')).state.session;
const caps=cocoRecipeFormCapabilities(id,formats);
const variants=['square','story'] as const;
test('Honey Gold Serif exposes the 62 supplied glyphs in the reusable picker',()=>{
 const family='Honey Gold Serif PNG',folder='public/generated-flyers/assets/png-glyphs/honey-gold-serif';
 const metrics=JSON.parse(readFileSync(`${folder}/metrics.json`,'utf8'));
 assert.equal(metrics.family,family);
 assert.deepEqual(Object.keys(metrics.glyphs).sort(),Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789').sort());
 for(const source of metrics.sources)assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);
 for(const [char,g] of Object.entries(metrics.glyphs) as [string,any][]){assert.equal(readFileSync(`${folder}/${g.nativeGlyph}`).subarray(1,4).toString(),'PNG',char);assert.ok(g.sourceScale>=1,char);}
 assert.ok(PNG_GLYPH_COLLECTIONS.some(f=>f.family===family));assert.ok(isPngGlyphFamily(family));assert.equal(TEMPLATE_ONLY_FONT_FAMILIES.has(family),false);
 assert.equal(readFileSync(`public${FONT_FILE_MAP[family].split('?')[0]}`).subarray(0,4).toString(),'wOF2');
});
test('Honey Nights registers independent Square and Story with editable text',()=>{
 assert.equal(getVisualRecipe(id)?.name,'Honey Nights');assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[id],'/generated-flyers/honey-nights.nflyer');
 assert.ok(COCO_CURATED_ART_DIRECTION_LIBRARY.some(d=>d.id===id));
 for(const format of variants){const doc=formats[format].cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/honey-${format}.jpg`);
  const text=doc.objects.filter((o:any)=>o.kind==='text');assert.equal(text.length,18);assert.equal(new Set(text.map((o:any)=>o.binding.text)).size,18);
  for(const o of text){assert.ok(o.editable,o.id);assert.ok(o.binding.panel,o.id);}
  assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Honey Gold Serif PNG');
  for(const label of ['presenter','presents'])assert.ok(text.find((o:any)=>o.id===label).stacking.zIndex>text.find((o:any)=>o.id==='headline').stacking.zIndex,`${label}: stays clickable above bitmap headline hit geometry`);
 }
});
test('Form binds event fields independently and preserves decorative copy',()=>{
 for(const [field,owners] of Object.entries({presenterName:['presenter'],date:['day','month','date'],startTime:['time'],ageRequirement:['age'],djs:['dj1'],musicPolicy:['genres'],venueName:['venue'],address:['address']}))assert.deepEqual(caps.bindings[field]?.targets,{square:owners,story:owners},field);
 assert.ok(cocoHeadlineMatches(id,formats,'Honey Nights'));
 assert.equal(caps.limits.djs.maxLines,1);assert.equal(caps.limits.musicPolicy.maxLines,1);
 for(const format of variants){assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'Honey Nights'),{headline:'Honey',subtitle:'Nights'});
  const input=structuredClone(formats[format]);
  const result=materializeCocoPortableRecipeVariant(id,input,{eventName:'Honey Nights',fieldMappingVersion:1,eventBrief:{theme:'Elegant',fieldFormats:caps.fieldFormats,recipeFieldBindings:caps.bindings,presenterName:'NOVA EVENTS',date:'August 17, 2030',startTime:'11PM',ageRequirement:'25+',djs:'DJ NOVA × DJ KAY',musicPolicy:'HOUSE',venueName:'CLUB NOVA',address:'12 MAIN ST'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const owner of ['dj1','genres']){assert.equal(edits[owner]?.top,undefined);assert.equal(edits[owner]?.left,undefined);}
  for(const [owner,value] of Object.entries({presenter:'NOVA EVENTS',date:'17',day:'SAT',month:'AUG',time:'11PM',age:'25+',dj1:'DJ NOVA × DJ KAY',genres:'HOUSE',venue:'CLUB NOVA',address:'12 MAIN ST'}))assert.equal(edits[owner]?.text,value,`${format}/${owner}`);
  for(const owner of ['mood','motto','tagline'])assert.equal(edits[owner]?.text,input.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id===owner).text);
  assert.deepEqual(result.cocoFormMappingReport.unplacedFields,[]);assert.deepEqual(input,formats[format]);
 }
});
test('Empty presenter, DJ, time and age hide their conditional labels or rules',()=>{
 for(const format of variants){const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'Honey Nights',fieldMappingVersion:1,eventBrief:{theme:'Elegant'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const owner of ['presenter','presents','dj1','djLabel','time','age'])assert.equal(edits[owner]?.text,'',`${format}/${owner}`);
  for(const owner of ['rAge','rTime','rDjs'])assert.equal(edits[owner]?.removed,true,`${format}/${owner}`);
 }
});
