import test from 'node:test';
import assert from 'node:assert/strict';
import { runCssReviewLoop, parseVisualReview, REVIEW_CATEGORIES } from '../lib/coco/cssReviewLoop.ts';
const review = (failures:string[]=[]) => ({checks:REVIEW_CATEGORIES.map(category=>({category,pass:!failures.includes(category),evidence:'Observed '+category,repair:failures.includes(category)?'Fix '+category:''}))});
test('renders and reviews the final correction before passing',async()=>{
  const events:string[]=[];
  const result=await runCssReviewLoop({initial:0,render:async d=>{events.push('render'+d);return d;},review:async(d)=>{events.push('review'+d);return review(d<2?['readability']:[]);},revise:async(d)=>{events.push('repair'+d);return d+1;}});
  assert.equal(result.passed,true);assert.equal(result.draft,2);
  assert.deepEqual(events,['render0','review0','repair0','render1','review1','repair1','render2','review2']);
});
test('retains reviewed best draft when repair regresses or render fails',async()=>{
  let revision=0;
  const result=await runCssReviewLoop({initial:0,render:async d=>{if(d===2)throw Error('bad CSS');return d;},review:async d=>review(d===0?['decorations']:['readability','decorations']),revise:async()=>++revision});
  assert.equal(result.draft,0);assert.equal(result.passed,false);assert.equal(result.history.length,2);assert.match(result.stopReason,/failed/);
});
test('stops at repair limit and exposes remaining failures',async()=>{
  const result=await runCssReviewLoop({initial:0,render:async d=>d,review:async()=>review(['typography']),revise:async d=>d+1});
  assert.equal(result.history.length,4);assert.equal(result.passed,false);assert.match(result.stopReason,/limit/);
});
test('malformed or missing reviews never count as success',async()=>{
  assert.throws(()=>parseVisualReview({checks:[]}));
  await assert.rejects(runCssReviewLoop({initial:0,render:async d=>d,review:async()=>{throw Error('offline');},revise:async d=>d}),/initial visual review failed/);
});
test('an acceptable initial render stops without spending repair requests',async()=>{
  const result=await runCssReviewLoop({initial:0,render:async d=>d,review:async()=>review(),revise:async()=>{throw Error('must not run');}});
  assert.equal(result.passed,true);assert.equal(result.history.length,1);
});
test('repairs a broken initial render before visual review, within the same budget',async()=>{
  const calls:string[]=[];
  const result=await runCssReviewLoop({initial:0,render:async d=>{calls.push('render'+d);if(!d)throw Error('bad asset');return d;},repairRender:async d=>{calls.push('repair');return d+1;},review:async()=>{calls.push('review');return review();},revise:async d=>d});
  assert.equal(result.passed,true);
  assert.deepEqual(calls,['render0','repair','render1','review']);
});
test('equal visual check counts retain the closer measured candidate',async()=>{
  const result=await runCssReviewLoop({initial:10,render:async d=>d,review:async()=>review(['typography']),revise:async d=>d-1,rankDraft:d=>d,maxRepairs:2});
  assert.equal(result.draft,10);
  assert.equal(result.iteration,0);
  assert.equal(result.history.length,3);
});
