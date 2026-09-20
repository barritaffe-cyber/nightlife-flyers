import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hideWeOutsideSloganHolder, weOutsidePreviewBadges, hideWeOutsideAgeBadge } from '../lib/coco/weOutsideDetails.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';
import { cocoCompiledTextEdit } from '../lib/coco/compiledTextEditing.ts';
import { cocoBriefForCapabilities, cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize } from '../lib/coco/portableRecipeRuntime.ts';
const formats = JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer', 'utf8')).state.session;
const caps = cocoRecipeFormCapabilities('we-outside', formats);
for (const format of ['square', 'story'] as const) {
  test(`${format}: slogan holder follows form and editor wording at the five-character boundary`, () => {
    const brief = cocoBriefForCapabilities({ theme: 'Urban' }, caps);
    const hidden = (v: any) => hideWeOutsideSloganHolder(v.cocoCompositionSystem.compiledDocument,
      v.cocoCompositionSystem.compiledObjectOverrides,
      (object, property, fallback) => compiledObjectValue(v.cocoCompositionSystem.compiledObjectOverrides, compiledPreviewFields(v), object, property, fallback));
    let v = formats[format];
    for (const text of ['We', 'ABCDE', 'ABCDEF', 'Bad Gurlz', '', 'We']) {
      v = materialize('we-outside', v, { eventName: 'Ladies Night', fieldMappingVersion: 1,
        eventBrief: { ...brief, subtitle: text, ageRequirement: '21+' } });
      assert.equal(hidden(v), !text || text.length > 5, text);
      assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.we.text.toLowerCase(), text.toLowerCase());
    }
    const object = v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'we');
    for (const text of ['Bad Gurlz', '', 'We']) {
      v = JSON.parse(JSON.stringify({ ...v, ...cocoCompiledTextEdit(v, object, text) }));
      assert.equal(hidden(v), !text || text.length > 5, `editor ${text}`);
    }
  });
  test(`${format}: preview restores the original ring with native position, size and color`, () => {
    const source = formats[format], before = JSON.stringify(source);
    const badges = weOutsidePreviewBadges(source, format);
    assert.equal(badges.length, 1);
    const asset = source.portraits.find((a: any) => a.id.startsWith('circular_text_'));
    const badge = badges[0];
    assert.equal(badge.image.src, asset.url);
    assert.equal(badge.paint.opacity, asset.opacity);
    assert.ok(Math.abs(badge.bounds.x + badge.bounds.width / 2 - asset.x) < .00001);
    assert.ok(Math.abs(badge.bounds.y + badge.bounds.height / 2 - asset.y) < .00001);
    assert.ok(Math.abs(badge.bounds.width * 5.4 - 128 * asset.scale) < .00001);
    assert.equal(JSON.stringify(source), before);
    assert.deepEqual(weOutsidePreviewBadges({ ...source, portraits: [] }, format), [], 'removed stickers stay removed');
  });
  test(`${format}: age badge appears on entry and hides on clearing in form and editor`, () => {
    const brief = cocoBriefForCapabilities({ theme: 'Urban' }, caps);
    let v = formats[format];
    for (const ageRequirement of ['', '21+', '', '18+']) {
      v = materialize('we-outside', v, { eventName: 'Ladies Night', fieldMappingVersion: 1, eventBrief: { ...brief, ageRequirement } });
      assert.equal(hideWeOutsideAgeBadge(v), !ageRequirement);
      assert.equal(weOutsidePreviewBadges(v, format).length, ageRequirement ? 1 : 0);
    }
    const age = v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'legal');
    for (const text of ['', '21+']) {
      v = { ...v, ...cocoCompiledTextEdit(v, age, text) };
      assert.equal(hideWeOutsideAgeBadge(v), !text);
    }
  });
}
