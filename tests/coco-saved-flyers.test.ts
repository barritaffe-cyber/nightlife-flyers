import test from 'node:test';
import assert from 'node:assert/strict';
import {brandFromBrief,mergeRememberedBrand,duplicateFlyerState} from '../lib/coco/savedFlyers.ts';
test('Remember stable brand details, never last event date, price or lineup',()=>{
 const brand=brandFromBrief({presenterName:'Club Woods',presenterLogo:'logo',venueName:'Woods',address:'234 West Avenue',socials:'@woods',website:'https://woods.test',qrDestination:'https://woods.test',date:'May 24',djs:'DJ Spice',entryFee:'$25'});
 assert.equal(brand.date,undefined);assert.equal(brand.djs,undefined);assert.equal(brand.entryFee,undefined);
 assert.equal(brand.venueName,'Woods');assert.equal(brand.presenterLogo,'logo');
 const next=mergeRememberedBrand(brand,{venueName:'',address:'New venue address',date:'May 31'});
 assert.equal(next.venueName,'Woods');assert.equal(next.address,'New venue address');assert.equal(next.date,'May 31');
});
test('Duplicating starts a new billable project while preserving both designs',()=>{
 const original={cocoProjectId:'old',session:{square:{headline:'BAD GIRLS'},story:{headline:'BAD GIRLS'}}};
 const copy=duplicateFlyerState(original,'new');assert.equal(copy.cocoProjectId,'new');assert.equal(original.cocoProjectId,'old');assert.deepEqual(copy.session,original.session);
});
