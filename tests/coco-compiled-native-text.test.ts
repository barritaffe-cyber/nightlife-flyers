import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {missingCompiledNativeTextNodes} from '../lib/coco/compiledNativeText.ts';
test('Pulse exposes missing sidebar text fields without duplicating authored fields',()=>{
 const project=JSON.parse(readFileSync('public/generated-flyers/pulse.nflyer','utf8'));
 for(const format of ['square','story']){
  const result=missingCompiledNativeTextNodes(project.state.session[format].cocoCompositionSystem.compiledDocument.objects);
  for(const node of ['presenter','details2','rightRail','socialHandle','compliance'])assert.ok(result.includes(node));
  for(const node of ['headline','headline2','details','date','venue','leftRail','subtag'])assert.ok(!result.includes(node));
 }
});
test('semantic aliases and native panel bindings suppress duplicate native groups',()=>{
 assert.ok(!missingCompiledNativeTextNodes([{kind:'text',binding:{panel:'presenter'}}]).includes('presenter'));
 assert.ok(!missingCompiledNativeTextNodes([{kind:'text',semanticRole:'djLineup'}]).includes('details2'));
 assert.ok(missingCompiledNativeTextNodes([{kind:'shape',semanticRole:'presenter'}]).includes('presenter'));
});
