import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getVisualRecipe} from '../lib/visualRecipes.ts';
import {COCO_RECIPE_CATALOG} from '../lib/coco/recipeCatalog.ts';
import {COCO_CURATED_ART_DIRECTION_LIBRARY} from '../components/coco/artDirections/library.ts';
import {cocoRecipeFormCapabilities} from '../lib/coco/formRecipeMapping.ts';
import {cocoHeadlineAssignments,cocoHeadlineMatches} from '../lib/coco/recipeCompatibility.ts';
import {materializeCocoPortableRecipeVariant,COCO_PORTABLE_RECIPE_PROJECT_URLS} from '../lib/coco/portableRecipeRuntime.ts';
const id='girl-code';
const formats=JSON.parse(readFileSync('public/generated-flyers/girl-code.nflyer','utf8')).state.session;
const caps=cocoRecipeFormCapabilities(id,formats);
const variants=['square','story'] as const;
test('Girl Code registers both authored formats with its own assets',()=>{
 assert.equal(getVisualRecipe(id)?.name,'Girl Code');
 assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[id],'/generated-flyers/girl-code.nflyer');
 assert.deepEqual(COCO_RECIPE_CATALOG[id].themes,['Tropical','Urban','R&B / Lounge']);
 assert.ok(COCO_CURATED_ART_DIRECTION_LIBRARY.some(d=>d.id===id));
 for(const format of variants){
  const doc=formats[format].cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/girl-code-${format}.jpg`);
  const text=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(text.length,21);assert.equal(new Set(text.map((o:any)=>o.binding.text)).size,21);
  for(const o of text){assert.ok(o.editable,o.id);assert.ok(o.binding.panel,o.id);}
  assert.equal(text.find((o:any)=>o.id==='headline').paint.backgroundImage,'url("/generated-flyers/assets/girl-code-gold-paint.png")');
 }
});
test('Form asks for date, time, three DJs, genres, venue and reservations independently',()=>{
 for(const [field,owners] of Object.entries({date:['day','month','date'],startTime:['time'],endTime:['endTime'],djs:['dj1','dj2','dj3'],musicPolicy:['genres'],venueName:['venue'],address:['address'],rsvpContact:['contact'],'recipe:venueCaption':['venueCaption']})){
  assert.deepEqual(caps.bindings[field]?.targets,{square:owners,story:owners},field);
 }
 assert.equal(caps.bindings.rsvpContact.label,'Table reservations');
 const all=Object.values(caps.bindings).flatMap(b=>Object.values(b.targets).flat());
 for(const owner of ['mood','motto','tagline','djLabel','contactLabel','headline','subtitle'])assert.ok(!all.includes(owner),owner);
});
test('Personalization keeps the title split, background and decorative copy while updating event fields',()=>{
 assert.equal(cocoHeadlineMatches(id,formats,'Girl Code'),true);
 for(const format of variants){
  assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'Girl Code'),{headline:'Girl',subtitle:'Code'});
  const input=structuredClone(formats[format]);
  const result=materializeCocoPortableRecipeVariant(id,input,{eventName:'Girl Code',fieldMappingVersion:1,eventBrief:{theme:'Tropical',fieldFormats:caps.fieldFormats,recipeFieldBindings:caps.bindings,date:'August 17, 2030',startTime:'10PM',endTime:'LATE',djs:'DJ ONE\nDJ TWO\nDJ THREE',musicPolicy:'R&B · HOUSE',venueName:'NOVA',address:'12 MAIN ST',rsvpContact:'123.456.7890','recipe:venueCaption':'LOUNGE'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const [owner,value] of Object.entries({dj1:'DJ ONE',dj2:'DJ TWO',dj3:'DJ THREE',time:'10PM',endTime:'LATE',venue:'Nova',address:'12 MAIN ST',contact:'123.456.7890',venueCaption:'LOUNGE'}))assert.equal(edits[owner]?.text,value,`${format}/${owner}`);
  assert.equal(edits.date.text,'17');assert.equal(edits.day.text,'SAT');assert.equal(edits.month.text,'AUG');
  for(const owner of ['mood','motto','tagline'])assert.equal(edits[owner]?.text,input.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id===owner).text);
  assert.deepEqual(result.cocoFormMappingReport.unplacedFields,[]);
  assert.deepEqual(input,formats[format]);
 }
});
test('DJ and reservations labels hide with empty fields',()=>{
 for(const format of variants){
  const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'Girl Code',fieldMappingVersion:1,eventBrief:{theme:'Tropical'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const owner of ['dj1','dj2','dj3','djLabel','contact','contactLabel'])assert.equal(edits[owner]?.text,'',`${format}/${owner}`);
 }
});
