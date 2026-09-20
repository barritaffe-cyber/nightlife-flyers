import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getVisualRecipe} from '../lib/visualRecipes.ts';
import {COCO_RECIPE_CATALOG} from '../lib/coco/recipeCatalog.ts';
import {COCO_CURATED_ART_DIRECTION_LIBRARY} from '../components/coco/artDirections/library.ts';
import {cocoRecipeFormCapabilities} from '../lib/coco/formRecipeMapping.ts';
import {cocoHeadlineAssignments,cocoHeadlineMatches} from '../lib/coco/recipeCompatibility.ts';
import {materializeCocoPortableRecipeVariant,COCO_PORTABLE_RECIPE_PROJECT_URLS} from '../lib/coco/portableRecipeRuntime.ts';
const id='brunch-sundays';
const formats=JSON.parse(readFileSync('public/generated-flyers/brunch-sundays.nflyer','utf8')).state.session;
const caps=cocoRecipeFormCapabilities(id,formats);
const variants=['square','story'] as const;
test('Brunch Sundays registers both supplied backgrounds and live Whimsical SVG text',()=>{
 assert.equal(getVisualRecipe(id)?.name,'Brunch Sundays');
 assert.equal(COCO_PORTABLE_RECIPE_PROJECT_URLS[id],'/generated-flyers/brunch-sundays.nflyer');
 assert.deepEqual(COCO_RECIPE_CATALOG[id].themes,['Brunch','Tropical','R&B / Lounge']);
 assert.ok(COCO_CURATED_ART_DIRECTION_LIBRARY.some(d=>d.id===id));
 for(const format of variants){
  const doc=formats[format].cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/brunch-${format}.jpg`);
  const text=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(text.length,22);assert.equal(new Set(text.map((o:any)=>o.binding.text)).size,22);
  for(const o of text){assert.ok(o.editable,o.id);assert.ok(o.binding.panel,o.id);}
  assert.equal(text.find((o:any)=>o.id==='headline').text,'Brunch');
  assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Whimsical SVG');
 }
});
test('Brunch form maps each event fact to its own canvas object',()=>{
 for(const [field,owners] of Object.entries({presenterName:['presenter'],date:['day','month','date'],djs:['dj1','dj2','dj3'],mainPromotion:['offer'],eventDetails:['included'],drinkSpecials:['drinks'],venueName:['venue'],address:['address'],rsvpContact:['contact'],ageRequirement:['age'],'recipe:venueCaption':['venueCaption']})){
  assert.deepEqual(caps.bindings[field]?.targets,{square:owners,story:owners},field);
 }
 const all=Object.values(caps.bindings).flatMap(b=>Object.values(b.targets).flat());
 for(const owner of ['mood','motto','tagline','mug','headline','subtitle'])assert.ok(!all.includes(owner),owner);
});
test('Brunch personalization preserves decorative copy and routes the package and three DJs independently',()=>{
 assert.equal(cocoHeadlineMatches(id,formats,'Brunch Sundays'),true);
 for(const format of variants){
  assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'Brunch Sundays'),{headline:'Brunch',subtitle:'Sundays'});
  const input=structuredClone(formats[format]);
  const result=materializeCocoPortableRecipeVariant(id,input,{eventName:'Brunch Sundays',fieldMappingVersion:1,eventBrief:{theme:'Brunch',fieldFormats:caps.fieldFormats,recipeFieldBindings:caps.bindings,date:'June 5, 2033',presenterName:'NOVA PRESENTS',djs:'DJ ONE\nDJ TWO\nDJ THREE',mainPromotion:'BRUNCH $45 PER PERSON',eventDetails:'TWO COURSES INCLUDED',drinkSpecials:'MIMOSAS FOR TWO HOURS',venueName:'NOVA',address:'12 MAIN ST',rsvpContact:'123.456.7890',ageRequirement:'21+','recipe:venueCaption':'RESTAURANT'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const [owner,value] of Object.entries({presenter:'NOVA PRESENTS',dj1:'DJ ONE',dj2:'DJ TWO',dj3:'DJ THREE',offer:'BRUNCH $45 PER PERSON',included:'TWO COURSES INCLUDED',drinks:'MIMOSAS FOR TWO HOURS',venue:'Nova',address:'12 MAIN ST',contact:'123.456.7890',age:'21+',venueCaption:'RESTAURANT'}))assert.equal(edits[owner]?.text,value,`${format}/${owner}`);
  assert.equal(edits.date.text,'5');assert.equal(edits.day.text,'SUN');assert.equal(edits.month.text,'JUN');
  for(const owner of ['mood','motto','tagline','mug'])assert.equal(edits[owner]?.text,input.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id===owner).text);
  assert.deepEqual(result.cocoFormMappingReport.unplacedFields,[]);
  assert.deepEqual(input,formats[format]);
 }
});
test('Empty DJ entries hide their separator artwork',()=>{
 for(const format of variants){
  const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'Brunch Sundays',fieldMappingVersion:1,eventBrief:{theme:'Brunch'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  for(const owner of ['dj1','dj2','dj3','contact','age'])assert.equal(edits[owner]?.text,'',`${format}/${owner}`);
  for(const owner of ['b1','b2'])assert.equal(edits[owner]?.removed,true,`${format}/${owner}`);
 }
});
