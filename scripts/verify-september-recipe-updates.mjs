import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { compiledObjectValue, compiledPreviewFields } from '../lib/coco/compiledPreview.ts';

const manifest = JSON.parse(await readFile('docs/september-16-recipe-updates.json', 'utf8'));
const out = '/tmp/september-recipe-updates';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [], report = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
try {
  await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button', { name: 'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start', exact: true }).click({ timeout: 120000 });
  await page.locator('.nf-startup-shell').waitFor({ state: 'hidden', timeout: 120000 });
  await page.locator('#artboard').waitFor({ timeout: 120000 });
  for (let attempt = 0; attempt < 8; attempt++) {
    for (const name of ['Choose Square format', 'Keep this layout']) {
      const b = page.getByRole('button', { name, exact: true });
      if (await b.isVisible()) await b.click();
    }
    if (await page.locator('input[type=file][accept*=json]').count()) break;
    await page.getByRole('button', { name: '▸ Project', exact: true }).evaluate(el => el.click());
    await page.waitForTimeout(2000);
  }
  await page.addStyleTag({ content: '#artboard button, [data-floating-controls] { visibility:hidden !important; }' });
  const records = process.env.NF_RECIPE_IDS ? manifest.records.filter(r => process.env.NF_RECIPE_IDS.split(',').includes(r.recipeId)) : manifest.records;
  for (const r of records) {
    const project = JSON.parse(await readFile(r.publicPath, 'utf8'));
    if (!await page.locator('input[type=file][accept*=json]').count()) {
      await page.getByRole('button', { name: '▸ Project', exact: true }).evaluate(el => el.click());
    }
    await page.locator('input[type=file][accept*=json]').setInputFiles(r.publicPath);
    for (const format of ['square', 'story']) {
      await page.getByRole('button', { name: format === 'square' ? 'Square' : 'Story', exact: true }).click();
      const v = project.state.session[format], system = v.cocoCompositionSystem;
      const fields = compiledPreviewFields(v);
      const expected = Object.fromEntries(system.compiledDocument.objects.filter(o => o.kind === 'text').map(o => [o.id, String(compiledObjectValue(system.compiledObjectOverrides ?? {}, fields, o, 'text', o.text ?? ''))]));
      const title = system.compiledDocument.objects.find(o => o.semanticRole === 'headline');
      await page.waitForFunction(({ format, id, text }) => {
        const b = document.querySelector('#artboard')?.getBoundingClientRect();
        const node = document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`);
        return b && (format === 'square' ? Math.abs(b.height / b.width - 1) < .05 : b.height / b.width > 1.7) && node?.getAttribute('data-coco-text-value') === text;
      }, { format, id: title.id, text: expected[title.id] }, { timeout: 90000 });
      await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({ state: 'hidden', timeout: 90000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('#artboard img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 60000 });
      await page.waitForTimeout(1800);
      const actual = await page.locator('#artboard [data-coco-text-value]').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.dataset.cocoCompiledObject, n.dataset.cocoTextValue])));
      const mismatches = Object.entries(actual).filter(([id, text]) => id in expected && expected[id] !== text).map(([id, text]) => ({ id, expected: expected[id], actual: text }));
      const notice = page.getByRole('button', { name: 'Dismiss save notice', exact: true });
      if (await notice.isVisible()) await notice.click();
      const board = page.locator('#artboard');
      await board.scrollIntoViewIfNeeded();
      const box = await board.boundingBox();
      await page.mouse.click(box.x + 2, box.y + 2);
      await page.waitForTimeout(300);
      const png = `${out}/${r.stem}-${format}-preview.png`;
      await board.screenshot({ path: png });
      report.push({ recipeId: r.recipeId, format, png, renderedTextObjects: Object.keys(actual).length, mismatches });
      await writeFile(`${out}/report.json`, JSON.stringify({ report, errors }, null, 2));
      console.log('RENDERED', r.recipeId, format, `text mismatches: ${mismatches.length}`);
    }
  }
  assert.deepEqual(errors, []);
  assert.ok(report.every(r => r.mismatches.length === 0), 'Saved text mismatch; inspect report.json');
  console.log('PASS saved text and both rendered formats; PNGs require visual inspection before acceptance.');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  await writeFile(`${out}/report.json`, JSON.stringify({ report, errors, failure: String(error) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
