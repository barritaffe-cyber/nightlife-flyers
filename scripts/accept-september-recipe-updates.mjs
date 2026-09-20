import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS } from '../lib/coco/portableRecipeRuntime.ts';

const names = ['mojito-mondays', 'afro-sunset', 'afrobeat-rooftop', 'aura', 'boa', 'disco', 'drift', 'glow-in-dark', 'in crowd', 'ladies night neon', 'mardi gras', 'mindstate', 'night-rides', 'night-shift', 'punta-cana', 'soiree'];
const sourceDir = '/Users/thepartyrocker/Desktop/recipe-files';
const backup = 'recipe-file-backups/september-16-updates';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const records = names.map(name => {
  const source = path.join(sourceDir, `${name}.nflyer`), bytes = fs.readFileSync(source);
  const project = JSON.parse(bytes), session = (project.state ?? project).session;
  const recipeId = session?.square?.cocoVisualRecipeId;
  assert.ok(COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId], `${name}: unknown recipe`);
  for (const format of ['square', 'story']) {
    assert.equal(session?.[format]?.cocoVisualRecipeId, recipeId, `${name}/${format}: recipe identity`);
    assert.ok(session[format].cocoCompositionSystem?.compiledDocument?.objects?.length, `${name}/${format}: missing document`);
  }
  const publicPath = 'public' + COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId];
  const stem = path.basename(publicPath, '.nflyer');
  const cachePath = `lib/template-data/${stem}-v2.json`;
  const previousSha256 = hash(fs.readFileSync(publicPath)), sha256 = hash(bytes);
  return { recipeId, source, publicPath, stem, sha256, previousSha256, changed: sha256 !== previousSha256,
    cachePath: fs.existsSync(cachePath) ? cachePath : null,
    archive: `${backup}/${recipeId}/${sha256.slice(0, 12)}/${name}.nflyer`, bytes, session };
});
assert.equal(new Set(records.map(r => r.recipeId)).size, names.length);
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify(records.map(({ bytes, session, ...r }) => r), null, 2));
} else {
  // Keep the first pre-import baseline even if this script is run again.
  const preserve = (source, target) => {
    if (!fs.existsSync(source) || fs.existsSync(target)) return;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  };
  preserve('lib/template-data/registered-recipes.json', `${backup}/before-registered-recipes.json`);
  preserve('lib/coco/portableRecipeRuntime.ts', `${backup}/before-portableRecipeRuntime.ts`);
  for (const r of records) {
    fs.mkdirSync(path.dirname(r.archive), { recursive: true });
    fs.writeFileSync(r.archive, r.bytes);
    const folder = `${backup}/${r.recipeId}/${r.sha256.slice(0, 12)}`;
    preserve(r.publicPath, `${folder}/before.nflyer`);
    if (r.cachePath) preserve(r.cachePath, `${folder}/before-v2.json`);
    const marker = `lib/template-data/${r.stem}-saved-source.json`;
    preserve(marker, `${folder}/before-saved-source.json`);
    for (const format of ['square', 'story']) preserve(`public/generated-flyers/${r.stem}-${format}-preview.png`, `${folder}/before-${format}-preview.png`);
    fs.writeFileSync(r.publicPath, r.bytes);
    if (r.cachePath) fs.writeFileSync(r.cachePath, JSON.stringify({ square: r.session.square, story: r.session.story }, null, 2) + '\n');
    fs.writeFileSync(marker, JSON.stringify({ source: r.source, archive: r.archive, sha256: r.sha256, acceptedAt: '2026-09-16', previousSha256: r.previousSha256 }, null, 2) + '\n');
  }
  const runtimePath = 'lib/coco/portableRecipeRuntime.ts';
  let runtime = fs.readFileSync(runtimePath, 'utf8');
  const start = runtime.indexOf('const COCO_PORTABLE_RECIPE_PROJECT_REVISIONS:');
  const end = runtime.indexOf('\n};', start);
  let revisions = runtime.slice(start, end);
  for (const r of records) {
    const pattern = new RegExp(`  "${r.recipeId}": "[^"]*",`);
    const line = `  "${r.recipeId}": "${r.sha256.slice(0, 12)}",`;
    revisions = pattern.test(revisions) ? revisions.replace(pattern, line) : revisions + '\n' + line;
  }
  runtime = runtime.slice(0, start) + revisions + runtime.slice(end);
  fs.writeFileSync(runtimePath, runtime);
  fs.writeFileSync('docs/september-16-recipe-updates.json', JSON.stringify({ acceptedAt: '2026-09-16', records: records.map(({ bytes, session, ...r }) => r), verification: 'pending visual review' }, null, 2) + '\n');
  console.log(`Accepted ${records.length} recipes (${records.filter(r => r.changed).length} changed); sources archived byte-for-byte. Rebuild registered bundle and verify renders next.`);
}
