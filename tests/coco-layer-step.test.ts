import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stepCompiledLayer} from '../lib/cocoLayerStep.ts';
test('lowering text swaps its adjacent layer without crossing the background',()=>{
 const peers=[{id:'bg',z:0,background:true},{id:'headline',z:3},{id:'flare',z:2},{id:'subtitle',z:1}];
 assert.deepEqual(stepCompiledLayer('headline',3,'down',peers),{headline:2,flare:3});
 assert.deepEqual(stepCompiledLayer('subtitle',1,'down',peers),{subtitle:1});
});
test('runtime flare can sit above text while text stays above backdrop',()=>{
 const peers=[{id:'bg',z:0,background:true},{id:'flare',z:30,runtime:true}];
 assert.deepEqual(stepCompiledLayer('headline',32,'down',peers),{headline:29});
 assert.deepEqual(stepCompiledLayer('headline',29,'up',peers),{headline:31});
});
