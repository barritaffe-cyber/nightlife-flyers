import test from 'node:test';
import assert from 'node:assert/strict';
import {HEADLINE_COLLECTION, isHeadlinePresetId, mapHeadlinePalette} from '../headline-presets/collection.ts';

test('core collection retains Stroke and groups specialty effects separately', () => {
  assert.deepEqual(HEADLINE_COLLECTION.filter(p => p.group === 'core').map(p => p.label), ['Clean','Glass','Metal','3D','Neon','Outline','Stroke']);
  assert.deepEqual(HEADLINE_COLLECTION.filter(p => p.group === 'specialty').map(p => p.id), ['halftone','kinetic']);
  assert.equal(isHeadlinePresetId('goldblock'), false);
  assert.equal(isHeadlinePresetId(undefined), false);
});
test('every material role comes from one core palette, including warm neutrals', () => {
  const p = {primary:'#ad3425',secondary:'#284955',accent:'#f4b651',neutral:'#f8edda',bgFrom:'#141c25'};
  const c = mapHeadlinePalette(p);
  assert.equal(c.face,p.primary); assert.equal(c.edge,p.accent);
  assert.equal(c.depth,p.secondary); assert.equal(c.highlight,p.neutral);
  assert.equal(c.shadow,p.bgFrom);
  assert.deepEqual(c.stroke,[p.primary,p.accent,p.neutral,p.secondary,p.accent]);
  assert.notEqual(mapHeadlinePalette({...p,primary:'#225599'}).light,c.light);
});
test('short hex and incomplete legacy palette inputs produce valid derived colors', () => {
  const c = mapHeadlinePalette({primary:'#abc',accent:'invalid'});
  assert.equal(c.face,'#aabbcc'); assert.equal(c.edge,c.face);
  for (const value of [c.light,c.dark,c.shadow,c.highlight]) assert.match(value,/^#[\da-f]{6}$/i);
});
