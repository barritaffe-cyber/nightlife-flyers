import test from 'node:test';
import assert from 'node:assert/strict';
import { erodeAlpha } from '../lib/cleanupCutoutUrl.ts';

function mask() {
  const pixels = new Uint8ClampedArray(9 * 9 * 4);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    pixels.set([120, 60, 30, x >= 2 && x <= 6 && y >= 2 && y <= 6 ? 255 : 0], (y * 9 + x) * 4);
  }
  return pixels;
}

test('1.5-pixel contraction retains half coverage between one- and two-pixel masks', () => {
  const one = mask(), half = mask(), two = mask();
  erodeAlpha(one, 9, 9, 1);
  erodeAlpha(half, 9, 9, 1.5);
  erodeAlpha(two, 9, 9, 2);
  const edge = (4 * 9 + 3) * 4;
  assert.equal(one[edge + 3], 255);
  assert.equal(half[edge + 3], 128);
  assert.equal(two[edge + 3], 0);
  assert.equal(half[(4 * 9 + 4) * 4 + 3], 255);
  for (let i = 0; i < half.length; i += 4) {
    assert.deepEqual([...half.slice(i, i + 3)], [120, 60, 30]);
    assert.ok(half[i + 3] <= one[i + 3] && half[i + 3] >= two[i + 3]);
  }
});

test('zero contraction preserves the mask and half a pixel does not become one', () => {
  const original = mask(), zero = mask(), half = mask();
  erodeAlpha(zero, 9, 9, 0);
  assert.deepEqual(zero, original);
  erodeAlpha(half, 9, 9, 0.5);
  assert.equal(half[(4 * 9 + 2) * 4 + 3], 128);
});
