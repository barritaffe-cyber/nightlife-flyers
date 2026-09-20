import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cocoRecipeFormCapabilities,cocoBriefForCapabilities} from '../lib/coco/formRecipeMapping.ts';
import {cocoFormFieldGuidance} from '../lib/coco/formFieldGuidance.ts';
import {COCO_FORM_OBJECT_CONTRACTS} from '../lib/coco/formObjectContracts.ts';
import {materializeCocoPortableRecipeVariant as materialize} from '../lib/coco/portableRecipeRuntime.ts';
import {cocoCompiledTextEdit} from '../lib/coco/compiledTextEditing.ts';
const recipes=JSON.parse(readFileSync('lib/template-data/registered-recipes.json','utf8'));
const recipe=(id:string)=>recipes.find((r:any)=>r.recipeId===id);

test('promoter answers preserve existing Presents wording without asking for that label',()=>{
 for(const id of ['bad-girls','beat-therapy','glow-in-the-dark','space-neon']) {
  const r=recipe(id),caps=cocoRecipeFormCapabilities(id,r.formats);
  assert.ok(caps.fields.includes('presenterName'),id);
  assert.ok(!Object.values(caps.bindings).some(b=>Object.values(b.targets).flat().includes('presents')));
  const brief=cocoBriefForCapabilities({theme:'Neon',presenterName:'Night Crew'},caps);
  for(const format of ['square','story']) {
   const result=materialize(id,r.formats[format],{eventName:id==='space-neon'?'Space Neon':'Night Party',eventBrief:brief,fieldMappingVersion:1});
   const edits=result.cocoCompositionSystem.compiledObjectOverrides;
   assert.match(edits.presenter.text,/NIGHT CREW/i);
   if(id==='beat-therapy')assert.match(edits.presenter.text,/PRESENTS/);
   if(id==='bad-girls'||id==='glow-in-the-dark')assert.equal(edits.presents.text.replace(/\s/g,''),'PRESENTS');
   if(id==='space-neon')assert.doesNotMatch(edits.presenter.text,/PRESENTS/);
  }
 }
});

test('an editor change to a saved label survives a later form edit',()=>{
 const r=recipe('ladies-night-rose'),caps=cocoRecipeFormCapabilities(r.recipeId,r.formats);
 const brief=cocoBriefForCapabilities({theme:'Elegant',musicPolicy:'HOUSE'},caps);
 for(const format of ['square','story']) {
  let result=materialize(r.recipeId,r.formats[format],{eventName:'Ladies Night',eventBrief:brief,fieldMappingVersion:1});
  const label=result.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='musicLabel');
  result={...result,...cocoCompiledTextEdit(result,label,'Music by')};
  result=materialize(r.recipeId,result,{eventName:'Ladies Night',eventBrief:{...brief,musicPolicy:'R&B'},fieldMappingVersion:1});
  assert.equal(result.cocoCompositionSystem.compiledObjectOverrides.musicLabel.text,'Music by');
 }
});

test('Space Neon asks for the guest and promoter while preserving the Special Guest heading',()=>{
 const r=recipe('space-neon'),caps=cocoRecipeFormCapabilities(r.recipeId,r.formats);
 assert.deepEqual(caps.bindings.performers.targets,{square:['guest'],story:['guest']});
 assert.deepEqual(caps.bindings.presenterName.targets,{square:['presenter'],story:['presenter']});
 assert.ok(!Object.values(caps.bindings).some(b=>Object.values(b.targets).flat().includes('guestLabel')));
 assert.equal(caps.bindings.entryFee.label,'Entry / ticket price');
 assert.equal(caps.bindings['recipe:contact'].label,'Social handle & website');
 for(const key of ['eventDetails','rsvpContact','subtitle','drinkSpecials'])assert.ok(!caps.fields.includes(key),key);
 const brief=cocoBriefForCapabilities({theme:'Neon',performers:'DJ NIGHT\nSHIFT',presenterName:'Night Crew',entryFee:'ENTRY\n$20',djs:'DJ NOVA\nDJ KAI\nDJ MOON\nDJ STAR','recipe:contact':'@nightcrew, nightcrew.com'},caps);
 for(const format of ['square','story']) {
  const result=materialize(r.recipeId,r.formats[format],{eventName:'Space Neon',eventBrief:brief,fieldMappingVersion:1});
  const edits=result.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(edits.guest.text,'DJ NIGHT\nSHIFT');assert.equal(edits.guestLabel.text,'Special Guest');
  assert.equal(edits.offer.text,'ENTRY\n$20');assert.match(edits.contact.text,/@NIGHTCREW/);
  assert.equal(edits.presenter.text,'NIGHT CREW');assert.equal(edits.subtag.text,'FEEL DEEP IMMERSION');
  assert.equal(edits.lineup.text,'DJ NOVA\nDJ KAI\nDJ MOON\nDJ STAR');
  assert.deepEqual(result.cocoFormMappingReport.unplacedFields,[]);
 }
});

test('genre lists, VIP tables and drinks receive their own questions despite misleading saved roles',()=>{
 for(const [id,owner,label]of [['day-party','details','Music genres / policy'],['ladies-night-rose','lineup','Music genres / policy'],['branch-happy-hour','genres','Drinks on offer'],['afrobeat-rooftop','invitation','Table availability'],['sunset-yacht','invitation','Table availability']]) {
  const caps=cocoRecipeFormCapabilities(id,recipe(id).formats);
  const binding=Object.values(caps.bindings).find(b=>b.targets.square?.includes(owner));
  assert.equal(binding?.label,label,`${id}/${owner}`);
 }
});

test('admission prices in generic details objects ask for entry price and preserve their wording',()=>{
 for(const copy of ['ENTRY $20','TICKETS $25','FREE ENTRY']) {
  const formats=structuredClone(recipe('pulse').formats);
  for(const format of ['square','story']) {
   const source=formats[format],owner=source.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='details');
   owner.text=copy;delete source.cocoAuthoredText?.details;delete source.cocoCompositionSystem.compiledObjectOverrides?.details;
  }
  // An unknown recipe exercises shared classification without reviewed overrides.
  const caps=cocoRecipeFormCapabilities('new-admission-design',formats);
  assert.equal(caps.bindings.entryFee.label,'Entry fee');
  assert.deepEqual(caps.bindings.entryFee.targets,{square:['details'],story:['details']});
  assert.match(cocoFormFieldGuidance('entryFee',caps.bindings.entryFee),/price/);
  assert.ok(!caps.fields.includes('eventDetails'));
 }
});

test('every reviewed question refers to a real text owner in the recipe',()=>{
 for(const [id,contracts]of Object.entries(COCO_FORM_OBJECT_CONTRACTS)) {
  const r=recipe(id);assert.ok(r,id);
  const owners=Object.values(r.formats).flatMap((s:any)=>s.cocoCompositionSystem.compiledDocument.objects);
  for(const key of Object.keys(contracts))assert.ok(owners.some((o:any)=>o.kind==='text'&&o.id.replace(/[-_]/g,'').toLowerCase()===key),`${id}/${key}`);
 }
});


test('reviewed music and host fields keep the heading attached to their actual text owner',()=>{
 for(const [id,field,owner,labelOwner,heading]of [
  ['ladies-night-rose','musicPolicy','lineup','musicLabel','SOUNDS BY'],
  ['ladies-secret','hosts','genres','detailsLabel','HYPE POLICY:'],
 ]) {
  const r=recipe(id),caps=cocoRecipeFormCapabilities(id,r.formats);
  const brief=cocoBriefForCapabilities({theme:'Elegant',[field]:'NOVA'},caps);
  for(const format of ['square','story']) {
   const result=materialize(r.recipeId,r.formats[format],{eventName:'Ladies Night',eventBrief:brief,fieldMappingVersion:1});
   const edits=result.cocoCompositionSystem.compiledObjectOverrides;
   assert.equal(edits[owner].text,'NOVA');assert.equal(edits[labelOwner].text,heading);
  }
 }
});
