import {withCocoRecipeBackground} from '../lib/coco/recipeBackground.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {getVisualRecipe,getMaterializedCocoVisualRecipe} from '../lib/visualRecipes.ts';
import {COCO_PORTABLE_RECIPE_PROJECT_URLS,materializeCocoPortableRecipeVariant} from '../lib/coco/portableRecipeRuntime.ts';
import {getCocoArtDirection,selectCocoArtDirectionChoices} from '../components/coco/artDirections/registry.ts';
for(const id of ['brunch-saturday','pulse','space-neon','we-outside','elite-monday','i-love-thursday','como-una-boa','zona-de-perreo','amapiano-night','reggae-jams','rnb-thursdays','diabla-all-white','summer-sunset'] as const)test(`${id} uses the updated save without replacing its design`,()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS[id],'utf8'));
 assert.equal(getVisualRecipe(id)?.version,id==='zona-de-perreo'?3:2);
 assert.equal(getCocoArtDirection(id)?.visualRecipeId,id);
 for(const f of ['square','story']){
  const source=p.state.session[f];
  assert.equal(getMaterializedCocoVisualRecipe(source)?.id,id);
  const before=JSON.stringify(source);
  const unchanged=materializeCocoPortableRecipeVariant(id,source,{eventName:'',eventBrief:{}});
  assert.deepEqual(unchanged.cocoCompositionSystem,source.cocoCompositionSystem);
  const changed=materializeCocoPortableRecipeVariant(id,source,{eventName:'NEW EVENT',eventBrief:{subtitle:'New subtitle',address:'42 Ocean Drive',date:'2026-09-13'}});
  assert.deepEqual(changed.cocoCompositionSystem.compiledDocument,source.cocoCompositionSystem.compiledDocument);
  assert.equal(changed.cocoCompositionSystem.compiledObjectOverrides.headline.text,'NEW EVENT');
  for(const [key,value] of Object.entries(source.cocoCompositionSystem.compiledObjectOverrides||{})){
   const {text,...style}=value as any;const {text:updated,...next}=changed.cocoCompositionSystem.compiledObjectOverrides[key];assert.deepEqual(next,style);
  }
  assert.equal(JSON.stringify(source),before);
 }
});
test('new recipes can be selected by their names',()=>{
 for(const [name,id] of [['Summer Sunset','summer-sunset'],['Diabla All White','diabla-all-white'],['R&B Thursdays','rnb-thursdays'],['Reggae Jams','reggae-jams'],['Amapiano Night','amapiano-night'],['Diabla','zona-de-perreo'],['Zona de Perreo','zona-de-perreo'],['Como Una Boa','como-una-boa'],['I Love Thursday','i-love-thursday'],['Elite Monday','elite-monday'],['We Outside Saturday','we-outside'],['Pulse Sunday','pulse'],['Space Neon astronaut','space-neon']])assert.ok(selectCocoArtDirectionChoices({eventName:name,eventDescription:'',nightlifeStyle:'general-nightlife'}).some(d=>d.id===id));
});
test('Elite Monday keeps an ordinal suffix when the brief changes its date',()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['elite-monday'],'utf8'));
 for(const [day,suffix] of [['01','ST'],['02','ND'],['03','RD'],['11','TH'],['12','TH'],['13','TH'],['21','ST']]){
  const v=materializeCocoPortableRecipeVariant('elite-monday',p.state.session.square,{eventName:'',eventBrief:{date:`2026-09-${day}`}});
  assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.ordinal.text,suffix);
 }
});

test('I Love Thursday updates its separate ordinal without replacing the weekday',()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['i-love-thursday'],'utf8'));
 const v=materializeCocoPortableRecipeVariant('i-love-thursday',p.state.session.square,{eventName:'',eventBrief:{date:'2026-10-01'}});
 assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.ordinal.text,'st');
 assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.weekday.text.toUpperCase(),'THU');
});

test('Boa is offered for Latin briefs and updates the existing venue slot',()=>{
 assert.ok(selectCocoArtDirectionChoices({eventName:'Latin Reggaeton',eventDescription:'',nightlifeStyle:'latin-night'}).some(d=>d.id==='como-una-boa'));
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['como-una-boa'],'utf8'));
 for(const format of ['square','story']) {
  const v=materializeCocoPortableRecipeVariant('como-una-boa',p.state.session[format],{eventName:'',eventBrief:{venueName:'CLUB LATIN'}});
  assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.addressLabel.text,'CLUB LATIN');
 }
});

test('Amapiano retains accepted paper and footer when background changes',()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['amapiano-night'],'utf8'));
 for(const format of ['square','story']) {
  const source=p.state.session[format];
  const changed=withCocoRecipeBackground(source,{backgroundSrc:'replacement.jpg',backgroundSelectionExplicit:true});
  for(const id of ['paperTear','footerBacking']) {
   const get=(v:any)=>v.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id===id);
   assert.ok(get(source));assert.deepEqual(get(changed),get(source));
   assert.deepEqual(changed.cocoCompositionSystem.compiledObjectOverrides[id],source.cocoCompositionSystem.compiledObjectOverrides[id]);
  }
 }
});

test('Reggae Jams maps hosts, reservations caption and the stacked date independently',()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['reggae-jams'],'utf8'));
 for(const format of ['square','story']) {
  const v=materializeCocoPortableRecipeVariant('reggae-jams',p.state.session[format],{eventName:'',eventBrief:{hosts:'MC NEW',reservationLabel:'TABLE BOOKINGS',date:'2027-10-21'}});
  const o=v.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(o.hosts.text,'MC NEW');assert.equal(o.contactLabel.text,'TABLE BOOKINGS');
  assert.equal(o.date.text,'21ST\nOCTOBER');assert.equal(o.weekday.text,'THURSDAY');assert.equal(o.year.text,'2027');
 }
});

test('R&B maps the separate day, month, entry caption and reservation caption',()=>{
 const p=JSON.parse(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['rnb-thursdays'],'utf8'));
 for(const format of ['square','story']){
  const source=p.state.session[format];
  const v=materializeCocoPortableRecipeVariant('rnb-thursdays',source,{eventName:'SOUL NIGHT',eventBrief:{date:'2027-10-21',ticketLabel:'EARLY ARRIVAL',reservationLabel:'BOOK TABLES',endTime:'5AM'}});
  const o=v.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(o.date.text,'21');assert.equal(o.month.text,'OCT');
  assert.equal(o.entryLabel.text,'EARLY ARRIVAL');assert.equal(o.contactLabel.text,'BOOK TABLES');assert.equal(o.endTime.text,'5AM');
  assert.equal(v.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='headline').paint.textEffect,'cyan-glass-v1');
 }
});

test('Diabla preserves its exact accepted save and maps weekday and dress code separately',()=>{
 const sourceBytes=readFileSync('public/generated-flyers/diabla-all-white.nflyer');
 assert.deepEqual(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['diabla-all-white']),sourceBytes);
 const p=JSON.parse(sourceBytes.toString());
 for(const format of ['square','story']) {
  const v=materializeCocoPortableRecipeVariant('diabla-all-white',p.state.session[format],{eventName:'',eventBrief:{date:'2027-10-21',startTime:'9PM',entryFee:'$20',dressCode:'WHITE & GOLD',additionalOffers:'DANCE • CONNECT'}});
  const o=v.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(o.date.text,'21');assert.equal(o.month.text,'OCT');assert.equal(o.weekday.text,'THU');
  assert.equal(o.dress.text,'WHITE & GOLD');assert.equal(o.footer.text,'DANCE • CONNECT');
 }
});

test('Summer Sunset preserves its accepted bytes and updates subtitle, date and contact fields',()=>{
 const source=readFileSync('public/generated-flyers/summer-sunset.nflyer');
 assert.deepEqual(readFileSync('public'+COCO_PORTABLE_RECIPE_PROJECT_URLS['summer-sunset']),source);
 const p=JSON.parse(source.toString());
 for(const format of ['square','story']) {
  const v=materializeCocoPortableRecipeVariant('summer-sunset',p.state.session[format],{eventName:'',eventBrief:{subtitle:'BEACH PARTY',date:'2027-07-24',startTime:'7 PM',entryFee:'$25',reservationLabel:'BOOKINGS:',rsvpContact:'555 123 4567'}});
  const o=v.cocoCompositionSystem.compiledObjectOverrides;
  assert.equal(o.sunset.text,'BEACH PARTY');assert.equal(o.date.text,'24');assert.equal(o.month.text,'JUL');
  assert.equal(o.time.text,'STARTS AT 7 PM');assert.equal(o.price.text,'ENTRY $25');
  assert.equal(o.contactLabel.text,'BOOKINGS:');assert.equal(o.contact.text,'555 123 4567');
  assert.equal(v.head2line,p.state.session[format].head2line);
 }
});
