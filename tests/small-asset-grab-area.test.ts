import test from 'node:test';
import assert from 'node:assert/strict';
import { smallAssetGrabPadding } from '../lib/smallAssetGrabArea.ts';

test('small icons gain a usable screen target without changing their painted size', () => {
  for (const width of [8, 19.2, 28]) for (const touch of [false, true]) {
    const padding = smallAssetGrabPadding(width, width, touch)!;
    assert.equal(width + padding.x * 2, touch ? 44 : 36);
    assert.equal(width + padding.y * 2, touch ? 44 : 36);
  }
});
test('thin separators gain height while keeping their length', () => {
  assert.deepEqual(smallAssetGrabPadding(320, 2, false, true), { x: 0, y: 17 });
  assert.deepEqual(smallAssetGrabPadding(2, 320, true, true), { x: 21, y: 0 });
});
test('large artwork, normal frames and invalid dimensions do not gain grab areas', () => {
  for (const [w,h] of [[540,540],[100,100],[320,50],[0,10],[NaN,10]]) {
    assert.equal(smallAssetGrabPadding(w,h,false,true), null);
  }
});
test('untagged subpixel rules and hollow icons remain selectable', () => {
  assert.deepEqual(smallAssetGrabPadding(150, .375), { x: 0, y: 17.8125 });
  assert.deepEqual(smallAssetGrabPadding(80,80), { x: 0, y: 0 });
});
