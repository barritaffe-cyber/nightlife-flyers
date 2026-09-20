import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hasPortraitEdgeFade} from '../lib/coco/portraitEdgeFade.ts';
import {replaceCocoRecipeSubjectInVariant} from '../lib/coco/portableRecipeRuntime.ts';

test('portrait fading follows subject identity across imported and older projects', () => {
  for (const asset of [{isExtracted:true}, {isBrandFace:true}, {cocoAssetRole:'subject'}, {cocoAssetRole:'portraitEcho'}]) {
    assert.equal(hasPortraitEdgeFade({...asset, scale:.3, x:20, y:60, rotation:15}), true);
  }
  assert.equal(hasPortraitEdgeFade(undefined, 'portraitEcho'), true);
});

test('logo and background flags take precedence over stale extraction metadata', () => {
  for (const asset of [{isLogo:true,isExtracted:true}, {id:'logo_uploaded',isExtracted:true}, {cocoAssetRole:'background',isExtracted:true}, {isSticker:true}, {isFlare:true}]) {
    assert.equal(hasPortraitEdgeFade(asset), false);
  }
});

test('replacing a portrait preserves the shared fade in both saved formats', () => {
  const project = JSON.parse(readFileSync('public/generated-flyers/ycee-live.nflyer', 'utf8'));
  for (const format of ['square', 'story']) {
    const source = project.state.session[format];
    const original = source.portraits.find((asset: any) => asset.cocoCompiledObjectId === 'subject');
    const replacement = replaceCocoRecipeSubjectInVariant(source, original.id, {
      url: '/replacement-portrait.png', isExtracted: true,
    });
    assert.ok(replacement);
    const reopened = JSON.parse(JSON.stringify(replacement.variant));
    for (const key of ['portraits', 'emojiList', 'emojis']) {
      if (!Array.isArray(reopened[key])) continue;
      const portrait = reopened[key].find((asset: any) => asset.id === original.id);
      if (!portrait) continue;
      assert.equal(portrait.url, '/replacement-portrait.png');
      assert.equal(hasPortraitEdgeFade(portrait), true);
      assert.equal(portrait.cocoCompiledObjectId, original.cocoCompiledObjectId);
      for (const field of ['x', 'y', 'scale', 'rotation']) assert.equal(portrait[field], original[field]);
    }
    assert.equal(source.portraits.find((asset: any) => asset.id === original.id).url, original.url);
  }
});
