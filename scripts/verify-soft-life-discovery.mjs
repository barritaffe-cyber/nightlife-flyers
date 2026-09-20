import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const out = process.env.NF_OUTPUT_DIR || '/tmp/soft-life-discovery';
const eventName = process.env.NF_EVENT_NAME || 'Soft Life';
const theme = process.env.NF_THEME || 'Elegant';
const recipeId = process.env.NF_RECIPE_ID || 'soft-life';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /Coco direction build failed|No designs currently match|maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try {
  await page.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  const input = page.getByLabel('Event name', { exact: true });
  const next = page.getByTestId('coco-build-event-next');
  await input.fill(eventName);
  await page.getByRole('button', { name: theme, exact: true }).click();
  await next.click();
  const chooser = page.getByTestId('coco-direction-chooser');
  await chooser.waitFor({ timeout: 180000 });
  const card = chooser.locator(`[data-coco-direction-id="${recipeId}"]`);
  await card.waitFor({ timeout: 120000 });
  await page.waitForFunction(id => [...document.querySelectorAll(`[data-coco-direction-id="${id}"] [data-coco-personalized-preview]`)].every(el => el.dataset.previewReady === 'true'), recipeId, { timeout: 120000 });
  for (const format of ['square', 'story']) await card.locator(`[data-coco-personalized-preview="${format}"]`).screenshot({ path: `${out}/retry-${format}.png` });
  await card.getByRole('button', { name: 'Choose this direction', exact: true }).click();
  await page.getByTestId('coco-build-details').waitFor();
  assert.deepEqual(errors, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ result: `${eventName} / ${theme} reaches design details`, errors }, null, 2));
  console.log('PASS Soft Life / Elegant through both personalized previews to the details form.');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  console.log((await page.locator('body').ariaSnapshot()).slice(-8000));
  throw error;
} finally {
  await browser.close();
}
