import test from 'node:test';
import assert from 'node:assert/strict';
import {getBillingCatalogItem,resolveBillingSelection,isPublicBillingSelection,buildBillingCheckoutHref,computeBillingPeriodEnd} from '../lib/billing/catalog.ts';
import {resolveBillingAmount} from '../lib/billing/foundingOffer.ts';
import {studioCapabilities} from '../lib/billing/studioAccess.ts';
import {buildAccessSnapshot,reserveGenerationUnits,type ProfileQuotaRow} from '../lib/accessQuota.ts';

const profile=(plan:string):ProfileQuotaRow=>({id:'test',email:'test@example.test',status:'active',plan,current_period_end:'2099-01-01T00:00:00.000Z',generation_cycle_end:'2099-01-01T00:00:00.000Z',generation_used:0,founding_discount_percent:20,starter_generations_used:0,starter_uploads_used:0,starter_clean_exports_used:0});

test('Monthly access follows the calendar month, including short and leap months',()=>{
 const selection={kind:'plan',plan:'basic',billing:'monthly'} as const;
 for(const [start,end] of [['2026-01-31T14:00:00.000Z','2026-02-28T14:00:00.000Z'],['2028-01-31T14:00:00.000Z','2028-02-29T14:00:00.000Z'],['2026-12-18T14:00:00.000Z','2027-01-18T14:00:00.000Z']]){
  assert.equal(computeBillingPeriodEnd(selection,new Date(start)),end);
 }
});

test('Coco monthly plans have fixed public prices',()=>{
 for(const [plan,price] of [['basic',10],['full',15]] as const){
  const selection=resolveBillingSelection({plan});assert.ok(selection);
  assert.equal(isPublicBillingSelection(selection),true);
  assert.equal(getBillingCatalogItem(selection).price,price);
  assert.equal(buildBillingCheckoutHref(selection),`/billing/checkout?plan=${plan}&billing=monthly`);
  assert.equal(resolveBillingSelection({plan,billing:'yearly'}),null);
  const amount=resolveBillingAmount(selection,{totalSlots:50,claimedSlots:0,reservedSlots:0,remainingSlots:50,discountPercent:20,retainedForEmail:true});
  assert.equal(amount.effectivePrice,price);
  assert.equal(amount.foundingDiscountApplied,false);
 }
 for(const input of [{plan:'creator'},{plan:'studio',billing:'yearly'},{offer:'night-pass'},{offer:'weekend-pass'}]){
  const legacy=resolveBillingSelection(input);assert.ok(legacy,'legacy receipts remain resolvable');assert.equal(isPublicBillingSelection(legacy),false);
 }
});
test('Basic retains logo access and blocks scene, subject, artwork and AI changes',()=>{
 const basic=studioCapabilities('basic',true);
 assert.equal(basic.basic,true);assert.equal(basic.logoUpload,true);
 for(const key of ['artworkUpload','replaceScene','replaceSubject','aiTools','expandedStudio'] as const)assert.equal(basic[key],false,key);
 const full=studioCapabilities('full',true);
 for(const key of ['logoUpload','artworkUpload','replaceScene','replaceSubject','aiTools','expandedStudio'] as const)assert.equal(full[key],true,key);
 assert.equal(studioCapabilities('full',false).expandedStudio,false);
 assert.equal(studioCapabilities('studio',true).expandedStudio,true,'existing Studio keeps access');
 assert.equal(studioCapabilities('creator',true).artworkUpload,true,'existing Creator keeps access');
});
test('Basic is paid access without an AI allowance; Full inherits Studio allowance',()=>{
 const basic=buildAccessSnapshot(profile('basic')),full=buildAccessSnapshot(profile('full'));
 assert.equal(basic.status,'active');assert.equal(basic.generationLimit,0);
 assert.equal(full.generationLimit,buildAccessSnapshot(profile('studio')).generationLimit);
});
test('Direct AI requests from Basic are rejected before charging quota',async()=>{
 let updates=0;
 const query:any={select(){return this},eq(){return this},maybeSingle:async()=>({data:profile('basic'),error:null}),update(){updates++;return this}};
 const result=await reserveGenerationUnits({from:()=>query} as any,'test',1);
 assert.equal(result.ok,false);
 if(!result.ok){assert.equal(result.code,403);assert.match(result.message,/Coco \+ Studio/);}
 assert.equal(updates,0);
});

test('One Flyer is a single $5 purchase, never a recurring or discounted plan',()=>{
 const selection=resolveBillingSelection({offer:'one-flyer'});assert.ok(selection);
 assert.equal(selection.kind,'offer');assert.equal(isPublicBillingSelection(selection),true);
 assert.equal(getBillingCatalogItem(selection).price,5);
 assert.equal(getBillingCatalogItem(selection).cadence,'one-time');
 assert.equal(buildBillingCheckoutHref(selection),'/billing/checkout?offer=one-flyer');
 assert.equal(resolveBillingAmount(selection).effectivePrice,5);
 const capabilities=studioCapabilities('one_flyer',true);
 assert.equal(capabilities.logoUpload,true);assert.equal(capabilities.savedProjects,false);
 assert.equal(capabilities.rememberedBrand,false);assert.equal(capabilities.artworkUpload,false);
 for(const plan of ['basic','full'])assert.equal(studioCapabilities(plan,true).savedProjects,true);
});
test('One Flyer purchase credits are idempotent and do not overwrite a subscription',async()=>{
 const {applyBillingSelectionToProfile}=await import('../lib/billing/entitlements.ts');
 const rows=new Map();let updates=0;
 const admin:any={from:(table:string)=>table==='profiles'?{select(){return this},eq(){return this},limit(){return this},maybeSingle:async()=>({data:{id:'owner',email:'owner@example.test'},error:null}),update(){updates++;return this}}:{upsert:async(row:any,options:any)=>{assert.equal(options.ignoreDuplicates,true);if(!rows.has(row.payment_id))rows.set(row.payment_id,row);return{error:null}}}};
 const selection={kind:'offer',offer:'one-flyer'} as const;
 await applyBillingSelectionToProfile(admin,'owner@example.test',selection,{providerTransactionId:'payment-1'});
 await applyBillingSelectionToProfile(admin,'owner@example.test',selection,{providerTransactionId:'payment-1'});
 assert.equal(rows.size,1);assert.equal(updates,0);
 await assert.rejects(()=>applyBillingSelectionToProfile(admin,'owner@example.test',selection),/verified payment/);
});
test('An expired/free profile with a One Flyer purchase cannot bypass AI restrictions',async()=>{
 const user={...profile('monthly'),status:'trial',current_period_end:null,generation_cycle_end:null};
 const query:any={select(){return this},eq(){return this},maybeSingle:async()=>({data:user,error:null})};
 const admin:any={from:()=>query,rpc:async()=>({data:{has_one_flyer_purchase:true,one_flyer_access:true},error:null})};
 const result=await reserveGenerationUnits(admin,'test',1);assert.equal(result.ok,false);
 if(!result.ok){assert.equal(result.code,403);assert.match(result.message,/Coco \+ Studio/);}
});
