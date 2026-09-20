import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cocoHeadlineAssignments,cocoHeadlineMatches,cocoThemeAllowsRecipe} from '../lib/coco/recipeCompatibility.ts';
import {cocoRecipeFormCapabilities} from '../lib/coco/formRecipeMapping.ts';
import {materializeCocoPortableRecipeVariant} from '../lib/coco/portableRecipeRuntime.ts';
const id='grills-and-groove';
const formats=JSON.parse(readFileSync('public/generated-flyers/grills-and-groove.nflyer','utf8')).state.session;
test('Grills title keeps the connector separate and supports a two-word replacement',()=>{
 assert.equal(cocoHeadlineMatches(id,formats,'Grills & Groove'),true);
 assert.equal(cocoHeadlineMatches(id,formats,'Dinner Dance'),true);
 assert.equal(cocoHeadlineMatches(id,formats,'One Two Three Four'),false);
 for(const format of ['square','story']){
  assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'Grills & Groove'),{headline:'Grills',ampersand:'&',subtitle:'Groove'});
  assert.deepEqual(cocoHeadlineAssignments(id,formats[format],'Dinner Dance'),{headline:'Dinner',ampersand:'',subtitle:'Dance'});
 }
 assert.equal(cocoThemeAllowsRecipe('Elegant',id),true);
 assert.equal(cocoThemeAllowsRecipe('Brunch',id),true);
});
test('Both formats use supplied artwork and independent editable text with textured gold GRILLS',()=>{
 for(const format of ['square','story']){
  const doc=formats[format].cocoCompositionSystem.compiledDocument;
  assert.deepEqual(doc.canvas,{width:1080,height:format==='square'?1080:1920});
  assert.equal(doc.objects.find((o:any)=>o.id==='background').image.src,`/generated-flyers/assets/bar-b-q-${format}.jpg`);
  const text=doc.objects.filter((o:any)=>o.kind==='text');
  assert.equal(text.length,19);
  assert.equal(new Set(text.map((o:any)=>o.binding.text)).size,text.length);
  for(const o of text){assert.ok(o.editable);assert.ok(o.binding.panel);}
  assert.equal(text.find((o:any)=>o.id==='headline').typography.fontFamily,'Textured Gold Serif PNG');
  assert.equal(text.find((o:any)=>o.id==='headline').text,'GRILLS');
  assert.ok(text.find((o:any)=>o.id==='detailsLabel'));
  assert.ok(text.find((o:any)=>o.id==='djLabel'));
 }
});
test('The form maps DJs, music, specials, venue and title without modifying layout',()=>{
 const caps=cocoRecipeFormCapabilities(id,formats);
 assert.deepEqual(caps.bindings.djs.targets,{square:['dj1','dj2'],story:['dj1','dj2']});
 assert.deepEqual(caps.bindings.drinkSpecials.targets,{square:['specials'],story:['specials']});
 assert.deepEqual(caps.bindings.musicPolicy.targets,{square:['genres'],story:['genres']});
 for(const format of ['square','story']){
  const result=materializeCocoPortableRecipeVariant(id,formats[format],{eventName:'Grills & Groove',fieldMappingVersion:1,eventBrief:{theme:'Elegant',djs:'DJ NOVA\nDJ ORBIT',venueName:'CLUB NOVA',address:'12 MAIN STREET',drinkSpecials:'DINNER FROM 6PM\nCOCKTAILS UNTIL 8PM'}});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(edits.headline.text,'GRILLS');assert.equal(edits.subtitle.text,'GROOVE');assert.equal(edits.ampersand.text,'&');
  assert.equal(edits.dj1.text,'DJ NOVA');assert.equal(edits.dj2.text,'DJ ORBIT');
  assert.equal(edits.venue.text,'CLUB NOVA');assert.equal(edits.address.text,'12 MAIN STREET');
  assert.deepEqual(result.cocoCompositionSystem.compiledDocument,formats[format].cocoCompositionSystem.compiledDocument);
 }
});

test('Existing Glow optional connector behavior is preserved',()=>{
 const glow=JSON.parse(readFileSync('public/generated-flyers/glow.nflyer','utf8')).state.session;
 for(const format of ['square','story']){
  assert.deepEqual(cocoHeadlineAssignments('glow-in-the-dark',glow[format],'Glow In The Dark'),{headline:'Glow',connector:'In The',subtitle:'Dark'});
  assert.deepEqual(cocoHeadlineAssignments('glow-in-the-dark',glow[format],'Neon Nights'),{headline:'Neon',connector:'',subtitle:'Nights'});
 }
});
