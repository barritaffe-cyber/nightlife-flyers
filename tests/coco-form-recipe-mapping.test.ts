import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materializeCocoPortableRecipeVariant, type CocoPortableRecipeId} from '../lib/coco/portableRecipeRuntime.ts';
import {COCO_EVENT_FIELD_LABELS} from '../lib/coco/eventBriefFields.ts';
const recipes=JSON.parse(readFileSync(new URL('../lib/template-data/registered-recipes.json',import.meta.url),'utf8'));
const brief={presenterName:'Nova Events',date:'Dec 1 2026',startTime:'9 PM',endTime:'2 AM',venueName:'Nova Room',address:'47 Grand Avenue',djs:'DJ Ana\nDJ Bea\nDJ Cee\nDJ Dee',hosts:'MC Joy',musicPolicy:'R&B / Afro House',entryFee:'£15.50',ageRequirement:'All ages',rsvpContact:'+1 212 555 0100',bookingContact:'+1 212 555 0200',eventDetails:'Celebrate with us',dressCode:'White on jeans',mainPromotion:'Two for one',website:'https://example.com',email:'info@example.com',ticketLink:'https://example.com/tickets',qrDestination:'https://example.com/scan',qrLabel:'Tickets',socials:'@nova'};
function render(id:string,format='square',facts:Record<string,any>=brief){return materializeCocoPortableRecipeVariant(id as CocoPortableRecipeId,recipes.find((r:any)=>r.recipeId===id).formats[format],{fieldMappingVersion:1,eventName:'Nova Nights',eventBrief:facts});}
function ink(v:any){return v.cocoCompositionSystem?.compiledDocument ? Object.values(v.cocoCompositionSystem.compiledObjectOverrides).map((o:any)=>o.text??'').join('\n'):Object.values(v).filter(x=>typeof x==='string').join('\n');}
for(const recipe of recipes)for(const format of ['square','story'])test(`${recipe.recipeId}/${format}: every supplied fact is placed or explicitly reported, with its draft preserved`,()=>{
 const original=JSON.stringify(recipe.formats[format]);
 const v=render(recipe.recipeId,format);
 assert.deepEqual(v.cocoEventBrief,brief);assert.equal(v.cocoFormMappingVersion,1);
 assert.equal(JSON.stringify(recipe.formats[format]),original,'cached master is immutable');
 const report=v.cocoFormMappingReport;const output=ink(v);
 for(const [key,value] of Object.entries(brief)){
  assert.ok(report.mappedFields.includes(key)||report.unplacedFields.includes(key),`${key} silently lost`);
  if(key==='qrDestination' && report.mappedFields.includes(key)){assert.equal(v.portraits.find((a:any)=>a.id==='coco-form-qr')?.cocoQrDestination,value);continue;}
  if(report.mappedFields.includes(key)&&key!=='date' && !(recipe.recipeId==='brunch-saturday' && key==='startTime'))for(const line of value.split('\n'))assert.ok(output.replace(/\s/g,'').includes(line.replace(/\s/g,'')),`${key}: missing ${line}`);
 }
 assert.equal(v.qrEnabled,false,'never reuse a sample QR for a new destination');
});
test('Ladies Rose maps each exact fact to its authored object',()=>{
 const v=render('ladies-night-rose');const o=v.cocoCompositionSystem.compiledObjectOverrides;
 assert.equal(o.headline.text,'Nova');assert.equal(o.head2.text,'Nights');
 assert.equal(o.weekday.text,'TUE');assert.equal(o.month.text,'DEC');assert.equal(o.date.text,'1');
 assert.equal(o.time.text,'9 PM\n2 AM');assert.equal(o.lineup.text,brief.djs);
 assert.ok(o.contact.text.includes(brief.rsvpContact)&&o.contact.text.includes(brief.bookingContact));
 assert.equal(o.offer.text,'Two for one');assert.equal(v.priceEnabled,true);
});
test('Reggae keeps hosts, DJs and dress code in their own objects',()=>{
 const v=render('reggae-jams','story');const o=v.cocoCompositionSystem.compiledObjectOverrides;
 assert.equal(o.year.text,'DEC');assert.equal(o.date.text,'1');assert.equal(o.hosts.text,'MC Joy');assert.equal(o.lineup.text,brief.djs);assert.equal(o.dressCode.text,'White on jeans');
});
test('clearing an edited field clears its text and does not revive master copy',()=>{
 const v=render('ladies-night-rose');
 const next=materializeCocoPortableRecipeVariant('ladies-night-rose',v,{eventName:'New Party',eventBrief:{...brief,djs:'',venueName:'',mainPromotion:''}},{cloneSource:false});
 assert.equal(next.cocoCompositionSystem.compiledObjectOverrides.lineup.text,'');assert.equal(next.venue,'');
 assert.equal(next.cocoEventBrief.mainPromotion,'');assert.ok(!ink(next).includes('Two for one'));
 assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.lineup.text,brief.djs);
});
test('a blank brief cannot leak sample dates, venues, contacts, or offers',()=>{
 for(const r of recipes){const v=render(r.recipeId,'square',{});if(!v.cocoCompositionSystem?.compiledDocument)continue;
 for(const o of v.cocoCompositionSystem.compiledDocument.objects.filter((o:any)=>o.kind==='text')){
 const value=v.cocoCompositionSystem.compiledObjectOverrides[o.id]?.text;
 assert.ok(['Nova','Nights','Nova Nights','Nova\nNights',''].includes(value),`${r.recipeId}/${o.id}: sample copy ${value}`);
 }}
});
test('prices retain currency and decimals, and free entry is not converted to a dollar sign',()=>{
 for(const entryFee of ['£15.50','Free','$25.00','€12,50']){const v=render('grey-rave-festival','square',{entryFee});assert.equal(v.price,entryFee);}
});
test('schema includes every user-editable text fact',()=>{
 for(const key of Object.keys(brief))assert.ok(key in COCO_EVENT_FIELD_LABELS,key);
});

test('split time retains both the hour and meridiem',()=>{const v=render('brunch-saturday');const o=v.cocoCompositionSystem.compiledObjectOverrides;assert.equal(o.time.text,'9');assert.equal(o.meridiem.text,'PM');});

test('long copy fits its box and an explicit Fine Tune size remains authoritative',()=>{
 const v=render('ladies-night-rose','square',{rsvpContact:'A very long reservation contact to fit'});
 const o=v.cocoCompositionSystem.compiledObjectOverrides.contact;
 assert.ok(o.size<12.5);assert.equal(o.cocoFormAutoSize,o.size);
 const manual={...v,cocoCompositionSystem:{...v.cocoCompositionSystem,compiledObjectOverrides:{...v.cocoCompositionSystem.compiledObjectOverrides,contact:{...o,size:11}}}};
 const edited=materializeCocoPortableRecipeVariant('ladies-night-rose',manual,{eventName:'New Party',eventBrief:{rsvpContact:'Another contact'}},{cloneSource:false});
 assert.equal(edited.cocoCompositionSystem.compiledObjectOverrides.contact.size,11);
});
