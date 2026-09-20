import test from 'node:test';
import assert from 'node:assert/strict';
import { assetInkBounds, fitAssetInk } from '../lib/assetInkBounds.ts';

test('finds a thin separator inside transparent image margins', () => {
  const data = new Uint8ClampedArray(128 * 128 * 4);
  for(let x=10;x<118;x++) data[(64*128+x)*4+3]=255;
  assert.deepEqual(assetInkBounds(data,128,128),{x:10/128,y:64/128,width:108/128,height:1/128});
  assert.equal(assetInkBounds(new Uint8ClampedArray(16),2,2),null);
});
test('screen flare black margins are excluded from visible bounds',()=>{
  const data=new Uint8ClampedArray([0,0,0,255,255,255,255,255]);
  assert.deepEqual(assetInkBounds(data,2,1,'screen'),{x:.5,y:0,width:.5,height:1});
});
test('maps contained, stretched and cropped artwork into the displayed box',()=>{
  const ink={x:0,y:.4,width:1,height:.2};
  assert.deepEqual(fitAssetInk(ink,400,100,128,128,'contain'),{x:0,y:60.8,width:128,height:6.400000000000006});
  const fill=fitAssetInk(ink,400,100,128,128,'fill');
  assert.equal(fill.y,51.2); assert.ok(Math.abs(fill.height-25.6)<1e-9);
  const cover=fitAssetInk({x:0,y:0,width:1,height:1},400,100,128,128,'cover');
  assert.deepEqual(cover,{x:0,y:0,width:128,height:128});
});
