import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { getVisualRecipe, getMaterializedCocoVisualRecipe } from '../lib/visualRecipes.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS, materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { getCocoArtDirection, selectCocoArtDirectionChoices } from '../components/coco/artDirections/registry.ts';
import { COCO_RECIPE_PREVIEW_EXPORTS } from '../components/coco/artDirections/recipePreviewExports.ts';

for (const id of ['brunch-saturday', 'brunch-vibes'] as const) {
  test(`${id} registers the accepted save and preserves its compiled design`, () => {
    const url = COCO_PORTABLE_RECIPE_PROJECT_URLS[id];
    assert.match(url, /updated\.nflyer$/);
    const project = JSON.parse(readFileSync(`public${url}`, 'utf8'));
    assert.equal(getVisualRecipe(id)?.id, id);
    assert.equal(getCocoArtDirection(id)?.visualRecipeId, id);
    for (const format of ['square', 'story'] as const) {
      const source = project.state.session[format];
      assert.equal(getMaterializedCocoVisualRecipe(source)?.id, id);
      const unchanged = materializeCocoPortableRecipeVariant(id, source, { eventName: '', eventBrief: {} });
      assert.deepEqual(unchanged.cocoCompositionSystem, source.cocoCompositionSystem);
      const updated = materializeCocoPortableRecipeVariant(id, source, { eventName: 'SUNDAY BRUNCH', eventBrief: { subtitle: 'Together', date: '2026-09-13', address: '42 Ocean Drive' } });
      assert.deepEqual(updated.cocoCompositionSystem.compiledDocument, source.cocoCompositionSystem.compiledDocument);
      const overrides = updated.cocoCompositionSystem.compiledObjectOverrides;
      assert.equal(overrides.headline.text, 'SUNDAY BRUNCH');
      assert.equal(overrides.script.text, 'Together');
      assert.equal(overrides.address.text, '42 Ocean Drive');
      for (const [objectId, saved] of Object.entries(source.cocoCompositionSystem.compiledObjectOverrides ?? {})) {
        const { text: _savedText, ...savedStyle } = saved as Record<string, unknown>;
        const { text: _nextText, ...nextStyle } = overrides[objectId];
        assert.deepEqual(nextStyle, savedStyle);
      }
      assert.ok(existsSync(`public${COCO_RECIPE_PREVIEW_EXPORTS[id]?.[format]}`));
    }
  });
}

test('Brunch offers both accepted recipes in the default choices', () => {
  const choices = selectCocoArtDirectionChoices({ nightlifeStyle: 'brunch', eventName: 'Brunch', eventDescription: '' });
  const ids = choices.map(choice => choice.id);
  assert.ok(ids.includes('brunch-saturday'));
  assert.ok(ids.includes('brunch-vibes'));
});
