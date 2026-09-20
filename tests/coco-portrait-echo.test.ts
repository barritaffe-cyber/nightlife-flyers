import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {replaceCocoRecipeSubjectInVariant, materializeCocoPortableRecipeVariant} from '../lib/coco/portableRecipeRuntime.ts';
import {hasPortraitEdgeFade} from '../lib/coco/portraitEdgeFade.ts';

const project = () => JSON.parse(readFileSync('public/generated-flyers/ycee-live.nflyer', 'utf8')).state;
const find = (list: any[], role: string) => list.find(asset => asset.cocoAssetRole === role);
const imageKeys = new Set(['url', 'cleanupBaseUrl', 'cleanup', 'cocoSubjectBounds']);
const treatment = (asset: any) => Object.fromEntries(Object.entries(asset).filter(([key]) => !imageKeys.has(key)));

for (const format of ['square', 'story']) test(`${format}: repeat replacement updates ghost source without changing its treatment`, () => {
  const state = project();
  let variant = state.session[format];
  const subject = find(variant.portraits, 'subject');
  const ghost = find(variant.portraits, 'portraitEcho');
  for (const url of ['/new-portrait.png', '/another-portrait.png']) {
    const replaced = replaceCocoRecipeSubjectInVariant(variant, subject.id, {
      url, cleanupBaseUrl: '/original.jpg', cleanup: {shrinkPx: 2},
      cocoSubjectBounds: undefined, isExtracted: true, shadowAlpha: .7, shadowBlur: 22, tintMode: 'colorize',
    });
    assert.ok(replaced);
    for (const key of ['portraits', 'emojiList']) {
      const echo = find(replaced.variant[key], 'portraitEcho');
      assert.equal(echo.url, url);
      assert.equal(find(replaced.variant[key], 'subject').url, url);
      assert.deepEqual(treatment(echo), treatment(ghost));
      assert.equal(hasPortraitEdgeFade(echo), true);
      assert.equal(find(replaced.variant[key], 'background'), find(variant[key], 'background'));
    }
    variant = JSON.parse(JSON.stringify(replaced.variant));
  }
  assert.equal(find(state.session[format].portraits, 'portraitEcho').url, ghost.url);
});

test('personalized previews use the uploaded subject for the ghost in both sizes', () => {
  const state = project();
  for (const format of ['square', 'story']) {
    const source = state.session[format];
    const variant = materializeCocoPortableRecipeVariant('ycee-live', source, {
      eventName: 'YCEE Live', eventBrief: {theme: 'Elegant'}, fieldMappingVersion: 1,
      subjectDataUrl: '/new-portrait.png', subjectSourceDataUrl: '/original.jpg',
    });
    for (const key of ['portraits', 'emojiList']) {
      assert.equal(find(variant[key], 'subject').url, '/new-portrait.png');
      assert.equal(find(variant[key], 'portraitEcho').url, '/new-portrait.png');
      assert.deepEqual(treatment(find(variant[key], 'portraitEcho')), treatment(find(source[key], 'portraitEcho')));
    }
  }
});

test('replacing an unrelated asset does not alter the ghost or subject', () => {
  const source = project().session.square;
  const background = find(source.portraits, 'background');
  const replaced = replaceCocoRecipeSubjectInVariant(source, background.id, {url:'/other-background.png'});
  assert.ok(replaced);
  for (const role of ['subject', 'portraitEcho']) assert.equal(find(replaced.variant.portraits, role), find(source.portraits, role));
});

// Exercise the actual editor commit callback without invoking the unrelated
// background-removal model. Verifies live state AND inactive saved formats.
test('editor replacement updates live ghost, unmounted Story and saved layout snapshots', () => {
  const text = readFileSync('app/page.tsx', 'utf8');
  const file = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback = '';
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'commitReplacementSubject' && node.initializer && ts.isCallExpression(node.initializer)) callback = node.initializer.arguments[0].getText(file);
    ts.forEachChild(node, visit);
  }
  visit(file); assert.ok(callback);
  const state = project();
  state.portraits.story = []; // Story has not been opened yet.
  const liveGhost = find(state.portraits.square, 'portraitEcho');
  Object.assign(liveGhost, {x:11, scale:.42, opacity:.12, rotation:8});
  const originalTreatment = treatment(liveGhost);
  const subject = find(state.portraits.square, 'subject');
  const store = Object.assign(state, {
    updatePortrait: (format: string, id: string, patch: any) => {state.portraits[format] = state.portraits[format].map((p: any) => p.id === id ? {...p, ...patch} : p);},
    setCocoLayoutSession: (format: string, id: string, value: any) => {state.cocoLayoutSessions[format][id] = value;},
    setSession: (update: any) => {state.session = update(state.session);},
    setSessionDirty: (update: any) => {state.sessionDirty = update(state.sessionDirty);},
    setSelectedPortraitId: () => {}, setSelectedPanel: () => {}, setMoveTarget: () => {},
  });
  const js = ts.transpileModule(`(${callback})`, {compilerOptions:{target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.CommonJS}}).outputText;
  const commit = vm.runInNewContext(js, {
    useFlyerState: {getState: () => store}, format:'square',
    subjectPaletteDecision:{portraitId:subject.id, cutoutUrl:'/replaced.png', sourceUrl:'/original.jpg'},
    EXTRACT_SUBJECT_CLEANUP:{shrinkPx:1}, replaceCocoRecipeSubjectInVariant,
    isCocoRecipeSubjectAsset:(asset: any) => asset.cocoAssetRole === 'subject',
    isMaterializedCocoVisualRecipeVariant:() => true, isCocoRushNightVariant:() => false,
    setPortraitUrlSafe:() => Promise.resolve(), ensureCutoutInPortraitSlot:() => {}, setSubjectPaletteDecision:() => {},
    alert:(message: string) => assert.fail(message),
  });
  commit(false);
  assert.equal(find(state.portraits.square, 'subject').url, '/replaced.png');
  assert.equal(find(state.portraits.square, 'portraitEcho').url, '/replaced.png');
  assert.deepEqual(treatment(find(state.portraits.square, 'portraitEcho')), originalTreatment);
  assert.deepEqual(state.portraits.story, []); // No stale inactive design is modified.
  const saved = JSON.parse(JSON.stringify(state));
  for (const format of ['square', 'story']) {
    for (const variant of [saved.session[format], saved.cocoLayoutSessions[format]['subject-center']]) {
      for (const key of ['portraits', 'emojiList']) {
        for (const role of ['subject', 'portraitEcho']) {
          assert.equal(find(variant[key], role).url, '/replaced.png');
          assert.equal(hasPortraitEdgeFade(find(variant[key], role)), true);
        }
      }
    }
  }
});
