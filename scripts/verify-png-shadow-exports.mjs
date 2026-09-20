import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const out = process.env.NF_OUTPUT_DIR || '/tmp/png-shadow-exports';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (/maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text()); });
page.on('dialog', dialog => dialog.accept());
// Isolate rendering from local guest quota; use the actual PNG export pipeline.
await page.route('**/api/auth/starter-render', route => route.fulfill({ json: { ok: true, limit: 2, used: 0, remaining: 2, blocked: false } }));
try {
  await page.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1&test=ladies-night&format=square`, { waitUntil: 'domcontentloaded', timeout: 120000 });
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
    await page.waitForTimeout(1000);
  }
  await page.locator('input[type=file][accept*=json]').setInputFiles(process.env.NF_VERIFY_FILE || 'public/generated-flyers/glow.nflyer');
  await page.locator('#artboard [data-png-glyph-run]').first().waitFor({ timeout: 120000 });
  for (const format of ['square', 'story']) {
    await page.getByRole('button', { name: format === 'square' ? 'Square' : 'Story', exact: true }).click();
    await page.waitForFunction(f => { const b = document.querySelector('#artboard')?.getBoundingClientRect(); return b && (f === 'square' ? Math.abs(b.height / b.width - 1) < .01 : b.height / b.width > 1.7); }, format);
    await page.getByText(`Preparing ${format} canvas.`, { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    await page.waitForTimeout(1800);
    await page.evaluate(() => document.fonts.ready);
    for (const strength of [0, 8]) {
      for (const [id, panel] of (process.env.NF_HEADLINE_ONLY ? [['headline', 'headline']] : [['headline', 'headline'], ['subtitle', 'head2']])) {
        const owner = page.locator(`#artboard [data-coco-compiled-object="${id}"]`);
        if (process.env.NF_EXPECT_NO_WORD_FILTER) assert.equal(await owner.evaluate(el => getComputedStyle(el).filter), 'none', 'No lighting inherited from the replaced font');
        await owner.evaluate(el => el.click());
        const controls = page.locator(`#${panel}-panel`);
        const shadow = controls.getByRole('button', { name: 'Shadow', exact: true });
        if (await shadow.getAttribute('aria-pressed') !== 'true') await shadow.click();
        const input = controls.locator('label, span').filter({ hasText: /^Shadow$/ }).locator('..').locator('input[type=text]').first();
        await input.fill(String(strength));
        await input.press('Enter');
      }
      await page.getByRole('button', { name: 'Master Grade', exact: true }).click();
      await page.waitForTimeout(500);
      const cleanCapture = await page.addStyleTag({ content: '#artboard button, #artboard [data-nonexport="true"] { visibility: hidden !important; }' });
      await page.locator('#artboard').screenshot({ path: `${out}/${format}-${strength}-editor.png` });
      await cleanCapture.evaluate(el => el.remove());
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
      await writeFile(`${out}/${format}-${strength}-export.png`, Buffer.from(artifact.bytes));
      await page.getByRole('button', { name: 'Close export', exact: true }).click();
      console.log('CAPTURED', format, strength);
    }
    for (const kind of ['editor', 'export']) {
      const a = await sharp(`${out}/${format}-0-${kind}.png`).removeAlpha().raw().toBuffer();
      const b = await sharp(`${out}/${format}-8-${kind}.png`).removeAlpha().raw().toBuffer();
      assert.equal(a.length, b.length);
      let darkened = 0, brightened = 0;
      for (let i = 0; i < a.length; i += 3) {
        if ([0, 1, 2].some(c => a[i + c] - b[i + c] > 5)) darkened++;
        if ([0, 1, 2].some(c => b[i + c] - a[i + c] > 5)) brightened++;
      }
      console.log('PIXELS', format, kind, { darkened, brightened });
      assert.ok(darkened > 100, `${format} ${kind}: shadow must darken rendered pixels`);
      if (process.env.NF_EXPECT_NO_WORD_FILTER && kind === 'export') {
        assert.equal(brightened, 0, 'Black letter shadows must not generate the former font’s gold glow');
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS shadow pixels in Square/Story editor and actual PNG exports; visual review required.');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  throw error;
} finally {
  await browser.close();
}
