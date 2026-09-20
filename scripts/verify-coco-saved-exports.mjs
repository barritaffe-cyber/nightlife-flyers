import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const out = '/tmp/coco-form-questions';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
await page.route('**/api/auth/starter-render', r => r.fulfill({ json: { ok: true, limit: 2, used: 0, remaining: 2, blocked: false } }));
try {
  await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button', { name: 'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start', exact: true }).click({ timeout: 120000 });
  await page.locator('.nf-startup-shell').waitFor({ state: 'hidden', timeout: 120000 });
  await page.locator('#artboard').waitFor({ timeout: 120000 });
  for (let attempt = 0; attempt < 8; attempt++) {
    for (const name of ['Choose Square format', 'Keep this layout']) {
      const button = page.getByRole('button', { name, exact: true });
      if (await button.isVisible()) await button.click();
    }
    if (await page.locator('input[type=file][accept*=json]').count()) break;
    await page.getByRole('button', { name: '▸ Project', exact: true }).evaluate(el => el.click());
    await page.waitForTimeout(2000);
  }
  await page.locator('input[type=file][accept*=json]').setInputFiles(`${out}/space-neon-edited.nflyer`);
  await page.locator('[data-coco-compiled-object="editor-venue"]').waitFor({ timeout: 120000 });
  await page.getByRole('button', { name: 'Master Grade', exact: true }).click();
  for (const format of ['square', 'story']) {
    await page.getByRole('button', { name: format === 'square' ? 'Square' : 'Story', exact: true }).click();
    await page.waitForFunction(f => { const b = document.querySelector('#artboard')?.getBoundingClientRect(); return b && (f === 'square' ? Math.abs(b.height / b.width - 1) < .05 : b.height / b.width > 1.7); }, format);
    await page.getByText(`Preparing ${format} canvas.`, { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    await page.waitForTimeout(1800);
    await page.evaluate(() => document.fonts.ready);
    for (const [id, text] of [['offer', 'ENTRY\n$20'], ['editor-venue', 'CLUB NOVA'], ['editor-djLineupLabel', 'MUSIC BY']]) {
      assert.equal(await page.locator(`#artboard [data-coco-compiled-object="${id}"]`).getAttribute('data-coco-text-value'), text);
    }
    const colors = await page.evaluate(() => ({
      venue: getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="editor-venue"]')).color,
      label: getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="editor-djLineupLabel"] [data-coco-compiled-auto-wrap]')).backgroundColor,
    }));
    assert.deepEqual(colors, { venue: 'rgb(255, 224, 102)', label: 'rgb(188, 20, 86)' });
    await page.locator('#artboard').screenshot({ path: `${out}/space-neon-reopened-${format}.png` });
    const notice = page.getByRole('button', { name: 'Dismiss save notice', exact: true });
    if (await notice.isVisible()) await notice.click();
    await page.getByRole('button', { name: 'PNG', exact: true }).click();
    await page.getByRole('button', { name: '4x', exact: true }).click();
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const preview = page.getByAltText('Export preview', { exact: true });
    await preview.waitFor({ timeout: 180000 });
    const artifact = await preview.evaluate(async img => { await img.decode(); return { width: img.naturalWidth, height: img.naturalHeight, bytes: Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())) }; });
    assert.equal(artifact.width, 2160);
    assert.equal(artifact.height, format === 'square' ? 2160 : 3840);
    await writeFile(`${out}/space-neon-export-${format}.png`, Buffer.from(artifact.bytes));
    await page.getByRole('button', { name: 'Close export', exact: true }).click();
    console.log('EXPORTED saved', format, artifact.width, artifact.height);
  }
  assert.deepEqual(errors, []);
  console.log('PASS saved venue/label styles, text and both PNG exports; inspect PNGs visually before passing');
} catch (error) {
  await page.screenshot({ path: `${out}/saved-export-failure.png`, fullPage: true });
  throw error;
} finally {
  await browser.close();
}
