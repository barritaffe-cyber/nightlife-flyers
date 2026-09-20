import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, acceptDownloads: true, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
await page.route('**/api/coco-copy', r => r.fulfill({ json: { copy: { headline: 'City Nights' } } }));
await page.route('**/api/coco-style', r => r.fulfill({ json: {} }));
let failedRecipe = 0;
await page.route('**/generated-flyers/city-nights.nflyer*', r => { failedRecipe++; return r.fulfill({ status: 404, body: 'Simulated missing recipe' }); });
try {
  await page.goto(`${process.env.NF_BASE_URL || 'http://localhost:3001'}/?guest=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  await page.getByLabel('Event name', { exact: true }).fill('City Nights');
  await page.getByTestId('coco-composer-event-description').fill('City nightlife, bold lettering, no subject or portrait.');
  await page.getByTestId('coco-composer-image-upload').setInputFiles('public/generated-flyers/assets/city-nights-background.jpg');
  await page.getByRole('button', { name: 'Create 5 options', exact: true }).click();
  const chooser = page.getByTestId('coco-direction-chooser');
  await chooser.waitFor({ timeout: 180000 });
  const ids = await chooser.locator('[data-coco-direction-id]').evaluateAll(nodes => nodes.map(n => n.dataset.cocoDirectionId));
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  assert.ok(ids.every(id => ['summer-sunset', 'como-una-boa', 'brunch-saturday', 'brunch-vibes', 'dodge-night-rides', 'mojito-monday', 'yacht-escape'].includes(id)), ids.join(', '));
  assert.ok(failedRecipe > 0, 'replacement path was exercised');
  await page.waitForTimeout(800); // Let the chooser's entrance animation settle.
  await page.screenshot({ path: '/tmp/coco-five-choices.png', fullPage: true });
  await chooser.locator('[data-coco-direction-id]').first().getByRole('button', { name: 'Use this direction', exact: true }).click();
  await page.getByTestId('coco-quick-brief-fields').waitFor({ timeout: 120000 });
  for (const format of ['story', 'square']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.waitForTimeout(1500);
    assert.equal(await page.locator('#artboard [data-coco-compiled-object="subject"]').count(), 0);
  }
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('coco-quick-save').click()]);
  await download.saveAs('/tmp/coco-five-choices.nflyer');
  const saved = JSON.parse(await readFile('/tmp/coco-five-choices.nflyer', 'utf8'));
  for (const format of ['square', 'story']) assert.equal(saved.state.session[format].cocoSubjectDecision.intent, 'none');
  assert.deepEqual(errors, []);
  console.log('PASS: five subject-free choices, failed recipe replaced, selection and both formats verified', ids);
} catch (error) {
  await page.screenshot({ path: '/tmp/coco-five-choices-failure.png' });
  console.log((await page.locator('body').innerText()).slice(-1800));
  throw error;
} finally {
  await browser.close();
}
