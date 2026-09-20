import test from 'node:test';
import assert from 'node:assert/strict';
import {anchorReferenceText} from '../lib/coco/cssReferenceOcr.ts';
import type {ReferenceBlock} from '../lib/coco/cssReferenceLayout.ts';
const block=(text:string,x=5,y=5):ReferenceBlock=>({id:text,kind:'text',text,role:'details',x,y,width:30,height:10,fontSize:3,weight:400,align:'center'});
const row=(text:string,x=10,y=10)=>({text,confidence:1,x,y,width:10,height:2});
test('anchors exact utility text and keeps guessed fonts untouched',()=>{
  const [actual]=anchorReferenceText([block('JUN')],[row('JUN',11,13)]);
  assert.equal(actual.x,11);assert.equal(actual.y,13);assert.equal(actual.fontSize,3);
});
test('combines spaced words and resolves repeated venue by location',()=>{
  const [actual]=anchorReferenceText([block('THE TERRACE',30,88)],[row('THE',30,2),row('TERRACE',45,2),row('THE',30,89),row('TERRACE',45,89)]);
  assert.equal(actual.y,89);assert.equal(actual.width,25);
});
test('does not anchor uncertain OCR, incomplete words, or decorative headlines',()=>{
  const blocks=[block('MIAMI FL'),{...block('BRUNCH'),role:'headline'},block('Vibes')];
  assert.deepEqual(anchorReferenceText(blocks,[row('MIAMI F'),row('BRUNCH'),{...row('Vibes'),confidence:.3}]),blocks);
});
