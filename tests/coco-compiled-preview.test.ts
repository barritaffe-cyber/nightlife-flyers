import test from 'node:test';
import assert from 'node:assert/strict';
import { compiledMasterFilter, compiledObjectValue, compiledPreviewFields, namespaceCompiledSvg } from '../lib/coco/compiledPreview.ts';

test('preview and editor share the same master exposure, contrast and color formula', () => {
  assert.equal(compiledMasterFilter({exp:1,contrast:1.08,saturation:1.1,vibrance:.15,warmth:.1,tint:0,gamma:1}), 'brightness(1.000) contrast(0.972) saturate(1.220) sepia(0.100) hue-rotate(0.000deg)');
  assert.equal(compiledMasterFilter({exp:1,contrast:1/.9,saturation:1,vibrance:0,warmth:0,tint:0,gamma:1}), 'brightness(1.000) contrast(1.000) saturate(1.000) sepia(0.000) hue-rotate(0.000deg)');
});

test('preview bindings honor explicit edits, authored fallback, and stored control aliases', () => {
  const object = { id: 'headline', binding: { text: 'headline', color: 'headColor', initial: { text: 'Night Rides', color: '#fff' } } };
  const fields = compiledPreviewFields({ headline: 'Beat Therapy', textFx: { color: '#fed', tracking: .02 }, head2: 'After Dark', bodySize: 24 });
  assert.equal(compiledObjectValue({}, fields, object, 'text', 'Night Rides'), 'Beat Therapy');
  assert.equal(compiledObjectValue({}, fields, object, 'color', '#fff'), '#fed');
  assert.equal(compiledObjectValue({ headline: { text: '' } }, fields, object, 'text', 'Night Rides'), '');
  assert.equal(compiledObjectValue({}, { headline: 'Night Rides' }, object, 'text', 'Authored line break'), 'Authored line break');
  assert.equal(fields.head2line, 'After Dark');
  assert.equal(fields.detailsSize, 24);
});

test('simultaneous previews isolate SVG masks and gradient references without changing paint', () => {
  const svg = '<svg><defs><linearGradient id="gold"/><mask id="clip.1"/></defs><rect fill="url(#gold)" mask="url(\'#clip.1\')"/><use href="#gold"/><use xlink:href="#clip.1"/></svg>';
  const one = namespaceCompiledSvg(svg, 'one');
  const two = namespaceCompiledSvg(svg, 'two');
  assert.match(one, /id="one-gold"/);
  assert.match(one, /fill="url\(#one-gold\)"/);
  assert.match(one, /mask="url\('#one-clip\.1'\)"/);
  assert.match(one, /href="#one-gold"/);
  assert.match(one, /xlink:href="#one-clip\.1"/);
  assert.ok(!two.includes('one-gold'));
  assert.equal(svg.includes('one-'), false);
});
