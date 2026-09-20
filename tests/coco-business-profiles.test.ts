import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBusiness,businessBrief,readBusinessProfile,saveBusinessProfile,updateBusinessFromFlyer,type BusinessProfile} from '../lib/coco/businessProfiles.ts';
import {withCocoPresenterLogo} from '../lib/coco/presenterLogo.ts';
const venue:BusinessProfile={id:'ignored',kind:'venue',name:'Aura Lounge',details:{address:'234 West Avenue',socials:'@aura',presenterLogo:JSON.stringify({url:'data:image/png;base64,test',aspect:1,scale:.5}),date:'2026-10-01',djs:'Guest DJ'}};
test('one record per email account; saving edits replaces it and accounts stay isolated',()=>{
 const storage=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}});
 saveBusinessProfile('account-a',venue);
 saveBusinessProfile('account-a',{...venue,id:'attempt-second-id',name:'Aura Rooftop'});
 assert.equal(readBusinessProfile('account-a')?.name,'Aura Rooftop');
 assert.equal(readBusinessProfile('account-a')?.id,'account-a');
 assert.equal(storage.size,1);
 assert.equal(readBusinessProfile('account-b'),null);
 assert.equal(readBusinessProfile(''),null);
 assert.throws(()=>saveBusinessProfile('',venue),/Sign in/);
 saveBusinessProfile('account-b',{...venue,name:'Other venue'});
 assert.equal(readBusinessProfile('account-a')?.name,'Aura Rooftop');
 storage.set('coco-brand:legacy',JSON.stringify({venueName:'Legacy venue',address:'Old address'}));
 assert.equal(readBusinessProfile('legacy')?.name,'Legacy venue');
 storage.set('coco-business:broken','invalid json');
 assert.equal(readBusinessProfile('broken'),null);
});
test('profile applies stable defaults without overwriting event details or storing event dates',()=>{
 const result=applyBusiness({address:'Tonight’s location',date:'2026-10-24'},venue);
 assert.equal(result.venueName,'Aura Lounge');assert.equal(result.address,'Tonight’s location');
 assert.equal(result.date,'2026-10-24');assert.equal(result.djs,undefined);
 assert.equal(venue.name,'Aura Lounge');
 const refreshed=applyBusiness({...businessBrief(venue),address:'Tonight’s location'},{...venue,name:'Aura Rooftop',details:{...venue.details,socials:'@rooftop'}},venue);
 assert.equal(refreshed.venueName,'Aura Rooftop');assert.equal(refreshed.socials,'@rooftop');assert.equal(refreshed.address,'Tonight’s location');
 const updated=updateBusinessFromFlyer(venue,{venueName:'New name',address:'',date:'2027-01-01'});
 assert.equal(updated.name,'New name');assert.equal(updated.details.address,'');
 assert.equal(updated.details.socials,'@aura');assert.equal(updated.details.date,undefined);
 const filtered=updateBusinessFromFlyer(venue,{venueName:'New name',socials:'',website:''},['venueName']);
 assert.equal(filtered.details.socials,'@aura','Unsupported slots cleared by a recipe must not erase the saved business');
 assert.equal(updateBusinessFromFlyer(venue,{presenterLogo:''},['venueName']).details.presenterLogo,'','Explicit logo removal can update the shared logo slot');
});
test('business roles route names and logos to matching text in Square and Story',()=>{
 for(const kind of ['venue','promoter','artist'] as const){
  const profile={...venue,kind};const brief=businessBrief(profile);
  assert.equal(brief[kind==='venue'?'venueName':kind==='artist'?'djs':'presenterName'],venue.name);
  if(kind!=='venue')assert.equal(brief.address,undefined);
  for(const format of ['square','story']){
   const source={format,cocoCompositionSystem:{compiledDocument:{objects:[{id:'presenter',kind:'text',bounds:{x:30,y:5,width:40,height:4}},{id:'venue',kind:'text',bounds:{x:30,y:90,width:40,height:4}},{id:'djs',kind:'text',semanticRole:'djs',bounds:{x:30,y:70,width:40,height:4}}]}}};
   const placed=withCocoPresenterLogo(source,brief),logo=placed.portraits[0];
   assert.equal(logo.cocoBusinessLogoAnchor,kind==='promoter'?'presenter':kind);
   assert.equal(logo.y,kind==='venue'?92:kind==='artist'?72:format==='square'?8:7);
   const resized=withCocoPresenterLogo(placed,{...brief,presenterLogo:JSON.stringify({...JSON.parse(brief.presenterLogo!),scale:.2})});
   assert.equal(resized.portraits[0].x,logo.x);assert.equal(resized.portraits[0].y,logo.y);
  }
 }
});
