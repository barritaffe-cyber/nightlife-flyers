import test from 'node:test';
import assert from 'node:assert/strict';
import {describeCssFailure} from '../lib/coco/cssFailure.ts';
test('retains API status through wrapped cross-realm errors without leaking payload',()=>{
  const result=describeCssFailure({message:'wrapper',cause:{status:429,request_id:'req_123',message:'secret payload',cause:{message:'network detail'}}});
  assert.equal(result.status,429);assert.equal(result.requestId,'req_123');
  assert.match(result.reason,/429/);assert.doesNotMatch(JSON.stringify(result),/secret|network detail/);
});
test('distinguishes transport, malformed response, and crop failures',()=>{
  assert.match(describeCssFailure({cause:{code:'ECONNRESET'}}).reason,/connection/);
  assert.match(describeCssFailure(new SyntaxError('private source')).reason,/JSON/);
  assert.match(describeCssFailure(new Error('extract_area: bad extract area')).reason,/crop/);
});
test('handles cyclic causes and does not disclose unknown error payloads',()=>{
  const error:{message:string;cause?:unknown}={message:'sk-private data:image/png;base64,private'};error.cause=error;
  assert.match(describeCssFailure(error).reason,/unclassified/);
  assert.doesNotMatch(JSON.stringify(describeCssFailure(error)),/sk-private|base64/);
});
