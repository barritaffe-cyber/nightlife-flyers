import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mapCocoFormToRecipe } from '../lib/coco/formRecipeMapping.ts';
import { cocoCompiledTitleSizeEdit } from '../lib/coco/compiledTextEditing.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';

const map = (source: Record<string, any>, eventName: string, brief: Record<string, any>) => {
  const result = mapCocoFormToRecipe('we-outside', source, eventName, brief, { day: '', month: '', weekday: '' });
  return { ...source, ...result.fields, cocoCompositionSystem: result.system, cocoFormMappingVersion: 1 };
};

for (const format of ['square', 'story']) {
  test(`We Outside ${format}: manual title size wins over form size and survives later form edits`, () => {
    const source = JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer', 'utf8')).state.session[format];
    const brief = { theme: 'Urban', subtitle: 'SATURDAY' };
    const mapped = map(source, 'WE OUTSIDE', brief);
    const before = JSON.stringify(mapped);
    for (const [role, field, size] of [['headline', 'headManualPx', 70], ['headline2', 'head2SizePx', 42]] as const) {
      const edited = { ...mapped, [field]: size, ...cocoCompiledTitleSizeEdit(mapped, role, size) };
      const reopened = JSON.parse(JSON.stringify(edited));
      const remapped = map(reopened, 'WE OUTSIDE', brief);
      for (const variant of [edited, reopened, remapped]) {
        for (const owner of variant.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.binding?.size === field)) {
          assert.equal(compiledObjectValue(variant.cocoCompositionSystem.compiledObjectOverrides, compiledPreviewFields(variant), owner, 'size', owner.typography.fontSizePx), size);
        }
      }
      const other = role === 'headline' ? 'script' : 'headline';
      assert.deepEqual(edited.cocoCompositionSystem.compiledObjectOverrides[other], mapped.cocoCompositionSystem.compiledObjectOverrides[other]);
    }
    assert.equal(JSON.stringify(mapped), before, 'the source design stays unchanged');
  });
}

test('accepting an automatically fitted size makes it manual on subsequent wording changes', () => {
  const source = JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer', 'utf8')).state.session.square;
  const fitted = map(source, 'OUTSIDE ALL SUMMER', {});
  const size = fitted.cocoCompositionSystem.compiledObjectOverrides.headline.size;
  assert.equal(typeof size, 'number');
  const edited = { ...fitted, ...cocoCompiledTitleSizeEdit(fitted, 'headline', size) };
  const remapped = map(edited, 'OUTSIDE ALL SUMMER LONG EVERY SATURDAY', {});
  assert.equal(remapped.cocoCompositionSystem.compiledObjectOverrides.headline.size, size);
});
