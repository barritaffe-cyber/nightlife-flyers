import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoDjFrameLayout, type CocoDjFrameSource, type CocoFrameTextRun } from '../lib/coco/djFrameLayout.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';

const formats = JSON.parse(readFileSync('public/generated-flyers/elite-monday-updated.nflyer', 'utf8')).state.session;
const measure = (run: CocoFrameTextRun, line: string) => Array.from(line).reduce((w, c) => w + run.size * (c === 'I' ? .25 : c === 'W' ? .95 : .6), 0);
const source = (format: 'square' | 'story', text: string): CocoDjFrameSource => {
  const v = formats[format], system = v.cocoCompositionSystem;
  const overrides = { ...system.compiledObjectOverrides, special: { ...system.compiledObjectOverrides.special, text } };
  return { document: system.compiledDocument, overrides, assets: v.emojiList, format,
    live: (object, property, fallback) => compiledObjectValue(overrides, compiledPreviewFields(v), object, property, fallback) };
};

test('DJ frame grows and shrinks with measured lettering while retaining its left anchor', () => {
  for (const format of ['square', 'story'] as const) {
    const before = JSON.stringify(formats[format]);
    const narrow = cocoDjFrameLayout(source(format, 'III'), measure)!;
    const wide = cocoDjFrameLayout(source(format, 'WWW'), measure)!;
    const long = cocoDjFrameLayout(source(format, 'NOVA & ORBIT'), measure)!;
    assert.ok(wide.boxes.djFrame.width > narrow.boxes.djFrame.width, 'equal character counts can have different widths');
    assert.ok(long.boxes.djFrame.width > wide.boxes.djFrame.width);
    for (const layout of [narrow, wide, long]) {
      const { djFrame: frame, dj, special: name } = layout.boxes;
      assert.equal(frame.left, narrow.boxes.djFrame.left);
      assert.ok(name.left > dj.left + dj.width, 'name never overlaps the DJ label');
      assert.ok(frame.left < dj.left && frame.left + frame.width > name.left + name.width, 'frame contains both texts with padding');
    }
    assert.deepEqual(cocoDjFrameLayout(source(format, 'III'), measure), narrow, 'deleting characters returns to the smaller frame');
    assert.equal(JSON.stringify(formats[format]), before, 'master geometry is unchanged');
  }
});

test('empty names hide the DJ frame; larger type and multiple lines remain enclosed', () => {
  for (const format of ['square', 'story'] as const) {
    assert.ok(cocoDjFrameLayout(source(format, '   '), measure)!.hidden.includes('djFrame'));
    const normal = cocoDjFrameLayout(source(format, 'NOVA'), measure)!;
    const bigger = source(format, 'NOVA\nORBIT');
    bigger.overrides.special.size = 36;
    const layout = cocoDjFrameLayout(bigger, measure)!;
    assert.ok(layout.boxes.djFrame.height > normal.boxes.djFrame.height);
    const { djFrame: frame, special: name } = layout.boxes;
    assert.ok(frame.top < name.top && frame.top + frame.height > name.top + name.height);
  }
});

test('canvas edits restore automatically hidden frames but respect manual removal', () => {
  const s = source('square', 'NOVA');
  s.overrides.dj = { text: '', cocoFormIsLabel: true };
  s.overrides.djFrame = { removed: true, cocoFormBackdropHidden: true };
  const layout = cocoDjFrameLayout(s, measure)!;
  assert.equal(layout.restoreFrame, true);
  assert.equal(layout.text.dj, 'DJ');
  s.overrides.djFrame = { removed: true };
  assert.equal(cocoDjFrameLayout(s, measure)!.restoreFrame, false);
  assert.equal(cocoDjFrameLayout({ ...s, document: { ...s.document, id: 'another-template' } }, measure), null);
});
