import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
try {
  await page.goto('http://localhost:3000/?guest=1', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  await page.getByLabel('Event name', { exact: true }).fill('Y2K Disco');
  await page.getByRole('button', { name: 'R&B / Lounge', exact: true }).click();
  await page.getByTestId('coco-build-event-next').click();
  const chooser = page.getByTestId('coco-direction-chooser');
  await chooser.waitFor({ timeout: 180000 });
  const card = chooser.locator('[data-coco-direction-id="disco"]');
  for (let i = 0; !await card.count() && i < 10; i++) {
    await chooser.getByRole('button', { name: /more/i }).first().click();
    await page.waitForTimeout(1500);
  }
  await card.getByRole('button', { name: 'Choose this direction', exact: true }).click();
  const form = page.getByTestId('coco-build-details');
  await form.waitFor();
  await form.locator('details').evaluateAll(nodes => nodes.forEach(n => n.open = true));
  for (const [index, value] of ['DJ Ana', 'DJ Bea', 'DJ Cee'].entries()) await form.getByTestId(`coco-build-brief-djs-line-${index + 1}`).fill(value);
  const storyInput = form.locator('input[data-testid="coco-build-brief-recipe:story:djs"],textarea[data-testid="coco-build-brief-recipe:story:djs"],input[data-testid="coco-build-brief-recipe:story:djs-line-1"]');
  assert.equal(await storyInput.count(), 1);
  await storyInput.fill('DJ Ana | DJ Bea | DJ Cee');
  await storyInput.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/september-recipe-updates/disco-form.png' });
  await page.getByTestId('coco-build-finish').click();
  await page.getByTestId('coco-quick-brief-fields').waitFor({ timeout: 120000 });
  for (const format of ['square', 'story']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.waitForFunction(f => { const b = document.querySelector('#artboard')?.getBoundingClientRect(); return b && (f === 'square' ? Math.abs(b.height / b.width - 1) < .05 : b.height / b.width > 1.7); }, format);
    await page.getByText(`Preparing ${format} canvas.`, { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    await page.waitForTimeout(1800);
    await page.evaluate(() => document.fonts.ready);
    const expected = format === 'story' ? ['DJ ANA | DJ BEA | DJ CEE', '', ''] : ['DJ ANA', 'DJ BEA', 'DJ CEE'];
    for (const [index, text] of expected.entries()) assert.equal(await page.locator(`#artboard [data-coco-compiled-object="dj${index + 1}"]`).getAttribute('data-coco-text-value'), text);
    assert.equal(await page.locator('#artboard [data-coco-compiled-object="musicLabel"]').getAttribute('data-coco-text-value'), 'MUSIC BY');
    await page.locator('#artboard').screenshot({ path: `/tmp/september-recipe-updates/disco-form-result-${format}.png` });
    console.log('VERIFIED Disco form', format, expected);
  }
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: '/tmp/september-recipe-updates/disco-form-failure.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
}
