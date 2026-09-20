import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonRect,cssReviewCrops} from '../lib/coco/cssReviewCrops.ts';
import sharp from 'sharp';
test('comparison uses union of target and ink with canvas-clamped context',()=>{
  assert.deepEqual(comparisonRect({id:'x',target:{x:0,y:0,width:10,height:10},ink:{x:60,y:60,width:10,height:10}},100,100),{left:0,top:0,width:100,height:100});
  assert.equal(comparisonRect({id:'missing'},100,100),null);
});
test('review crop pairs preserve left reference and right render',async()=>{
  const original=await sharp({create:{width:100,height:100,channels:3,background:'red'}}).png().toBuffer();
  const render=await sharp({create:{width:100,height:100,channels:3,background:'blue'}}).png().toBuffer();
  const pair=await cssReviewCrops(original,render,100,100,[{id:'copy',ink:{x:5,y:5,width:2,height:2}}]);
  assert.equal(pair.length,2);
  const data=pair[1];
  assert.ok('image_url' in data);
  const {data:pixels,info}=await sharp(Buffer.from(data.image_url.url.split(',')[1],'base64')).raw().toBuffer({resolveWithObject:true});
  assert.ok(pixels[0]>200&&pixels[2]<30);
  const last=(info.width-1)*info.channels;
  assert.ok(pixels[last]<30&&pixels[last+2]>200);
});

test('wide text crops compose before shrinking to the review image limit',async()=>{
  const original=await sharp({create:{width:1024,height:1536,channels:3,background:'red'}}).png().toBuffer();
  const render=await sharp({create:{width:1024,height:1536,channels:3,background:'blue'}}).png().toBuffer();
  const pairs=await cssReviewCrops(original,render,1024,1536,[{id:'footer',target:{x:100,y:1400,width:800,height:20}}]);
  assert.equal(pairs.length,2);
  const pair=pairs[1];assert.ok('image_url' in pair);
  const {data,info}=await sharp(Buffer.from(pair.image_url.url.split(',')[1],'base64')).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,1400);
  assert.ok(info.height>0);
  assert.ok(data[0]>200&&data[2]<30,'original remains on the left');
  const right=(info.width-1)*info.channels;
  assert.ok(data[right]<30&&data[right+2]>200,'render remains on the right');
});

test('wide edge crops remain valid after clamping and downscaling',async()=>{
  const bytes=await sharp({create:{width:1600,height:1600,channels:3,background:'white'}}).png().toBuffer();
  const pairs=await cssReviewCrops(bytes,bytes,1600,1600,[{id:'bottom',target:{x:-20,y:1580,width:1640,height:40}}]);
  assert.equal(pairs.length,2);
  const pair=pairs[1];assert.ok('image_url' in pair);
  const info=await sharp(Buffer.from(pair.image_url.url.split(',')[1],'base64')).metadata();
  assert.equal(info.width,1400);
});
