import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReferenceLayout} from '../lib/coco/cssReferenceLayout.ts';
const block={id:'date',kind:'text',text:'02',role:'date',x:10,y:8,width:10,height:5,fontSize:6,weight:700,align:'center'};
test('reference blocks retain normalized coordinates and individual weights',()=>{
  assert.deepEqual(parseReferenceLayout({blocks:[block]}),[block]);
});
test('accepts divider measurements without meaningless font properties',()=>{
  const line={id:'divider',kind:'line',x:8,y:32.5,width:84,height:.07};
  const [result]=parseReferenceLayout({blocks:[line]});
  assert.equal(result.kind,'shape');assert.equal(result.fontSize,0);assert.equal(result.weight,400);assert.equal(result.height,.07);
  const [zero]=parseReferenceLayout({blocks:[{...line,kind:'shape',fontSize:0,weight:0,align:'left',text:''}]});
  assert.equal(zero.weight,400);
});
test('rejects duplicate IDs, nonfinite and off-canvas geometry',()=>{
  for(const blocks of [[block,block],[{...block,x:95}],[{...block,width:NaN}],[{...block,id:'x"]{color:red}'}],[{...block,text:''}]])assert.throws(()=>parseReferenceLayout({blocks}));
});
