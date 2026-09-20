import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const out = process.env.NF_OUTPUT_DIR || '/tmp/coco-no-matches';
const retryName = process.env.NF_RETRY_NAME || 'Bad Girls';
const retryTheme = process.env.NF_RETRY_THEME || 'Urban';
const retryRecipe = process.env.NF_RETRY_RECIPE || 'bad-girls';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [], reports = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /Coco direction build failed|No designs currently match|maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try {
  await page.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  const input = page.getByLabel('Event name', { exact: true });
  const next = page.getByTestId('coco-build-event-next');
  await page.getByRole('button', { name: process.env.NF_THEME || 'Urban', exact: true }).click();
  for (const [name, expected] of [
    [process.env.NF_EVENT_NAME || `${'W'.repeat(30)} ${'W'.repeat(30)}`, /shorter name or a different theme/],
    ['One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve', /different event name or theme/],
  ]) {
    await input.fill(name);
    await next.click();
    const alert = page.getByRole('alert').filter({ hasText: expected });
    await alert.waitFor({ timeout: 180000 });
    assert.equal(await input.inputValue(), name, 'Rejected input remains available for editing');
    assert.equal(await next.isEnabled(), true, 'Retry is enabled after the rejection');
    assert.equal(await page.getByTestId('coco-direction-chooser').count(), 0);
    assert.deepEqual(errors, [], 'Expected no-match results must not trigger the console overlay');
    reports.push({ eventName: name, message: await alert.innerText() });
    await page.screenshot({ path: `${out}/no-match-${reports.length}.png`, fullPage: true });
  }
  await input.fill(retryName);
  await page.getByRole('button', { name: retryTheme, exact: true }).click();
  await next.click();
  const chooser = page.getByTestId('coco-direction-chooser');
  await chooser.waitFor({ timeout: 180000 });
  const card = chooser.locator(`[data-coco-direction-id="${retryRecipe}"]`);
  await card.waitFor({ timeout: 120000 });
  await page.waitForFunction(id => [...document.querySelectorAll(`[data-coco-direction-id="${id}"] [data-coco-personalized-preview]`)].every(el => el.dataset.previewReady === 'true'), retryRecipe, { timeout: 120000 });
  for (const format of ['square', 'story']) await card.locator(`[data-coco-personalized-preview="${format}"]`).screenshot({ path: `${out}/retry-${format}.png` });
  await card.getByRole('button', { name: 'Choose this direction', exact: true }).click();
  await page.getByTestId('coco-build-details').waitFor();
  assert.deepEqual(errors, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ reports, retry: `${retryName} / ${retryTheme} reaches design details`, errors }, null, 2));
  console.log('PASS wide-name and empty-match guidance, retained inputs, no console error, and successful retry through previews to details.');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  console.log((await page.locator('body').ariaSnapshot()).slice(-8000));
  throw error;
} finally {
  await browser.close();
}
