import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mapCocoFormToRecipe, cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const manifest = read('docs/september-16-recipe-updates.json');
const gallery = read('lib/template-data/registered-recipes.json');
function externalize(v: any): any {
  if (typeof v === 'string') {
    const m = v.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.*)$/s);
    if (!m) return v;
    const hash = createHash('sha256').update(Buffer.from(m[2], 'base64')).digest('hex').slice(0, 24);
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1] === 'svg+xml' ? 'svg' : m[1];
    const url = `/generated-flyers/assets/registered-recipes/${hash}.${ext}`;
    assert.ok(existsSync('public' + url));
    return url;
  }
  if (Array.isArray(v)) return v.map(externalize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, externalize(x)]));
  return v;
}
for (const r of manifest.records) test(`${r.recipeId}: exact accepted source, cache and gallery preserve both saved formats`, () => {
  const bytes = readFileSync(r.publicPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), r.sha256);
  assert.deepEqual(bytes, readFileSync(r.archive));
  const sessions = JSON.parse(bytes.toString()).state.session;
  if (r.cachePath) assert.deepEqual(read(r.cachePath), { square: sessions.square, story: sessions.story });
  const row = gallery.find((t: any) => t.recipeId === r.recipeId);
  for (const f of ['square', 'story']) {
    const expected = externalize(sessions[f]);
    if (expected.portraits?.length) expected.emojiList = expected.portraits;
    delete expected.portraits; delete expected.emojis;
    assert.deepEqual(row.formats[f], expected);
  }
  const runtime = readFileSync('lib/coco/portableRecipeRuntime.ts', 'utf8');
  assert.ok(runtime.includes(`"${r.recipeId}": "${r.sha256.slice(0, 12)}"`));
});
test('batch import leaves all unrelated registered designs unchanged', () => {
  const ids = new Set(manifest.records.map((r: any) => r.recipeId));
  const before = read('recipe-file-backups/september-16-updates/before-registered-recipes.json');
  assert.deepEqual(gallery.filter((r: any) => !ids.has(r.recipeId)), before.filter((r: any) => !ids.has(r.recipeId)));
});

test('Coco keeps the effective saved font sizes for all updated designs in both formats', () => {
  for (const r of manifest.records) {
    const row = gallery.find((t: any) => t.recipeId === r.recipeId);
    const capabilities = cocoRecipeFormCapabilities(r.recipeId, row.formats);
    for (const f of ['square', 'story']) {
      const source = row.formats[f];
      const system = source.cocoCompositionSystem;
      const result = mapCocoFormToRecipe(r.recipeId, source, source.headline, {
        recipeFieldBindings: capabilities.bindings, fieldFormats: capabilities.fieldFormats,
      }, { day: '', month: '', weekday: '' });
      for (const o of system.compiledDocument.objects.filter((o: any) => o.kind === 'text')) {
        const before = compiledObjectValue(system.compiledObjectOverrides ?? {}, compiledPreviewFields(source), o, 'size', o.typography?.fontSizePx ?? 0);
        const after = compiledObjectValue(result.system.compiledObjectOverrides, compiledPreviewFields({ ...source, ...result.fields }), o, 'size', o.typography?.fontSizePx ?? 0);
        assert.equal(after, before, `${r.recipeId}/${f}/${o.id} preserves the saved canvas size`);
      }
    }
  }
});
