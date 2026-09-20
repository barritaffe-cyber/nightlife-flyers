import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const mobile = process.env.NF_DEVICE === 'mobile', out = mobile ? '/tmp/coco-spacing-mobile' : '/tmp/coco-spacing';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1500, height: 1100 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce', serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/api/auth/starter-render', r => r.fulfill({ json: { ok: true, limit: 2, used: 0, remaining: 2, blocked: false } }));
const platforms = ['instagram', 'tiktok', 'x', 'whatsapp', 'youtube', 'twitch'];
async function checkSpacing(preview) {
  await preview.locator('[data-coco-compiled-object="coco-form-social-instagram"]').waitFor();
  const geometry = await preview.locator('[data-coco-compiled-object]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => {
    const r = node.getBoundingClientRect(); return [node.dataset.cocoCompiledObject, { x: r.x, y: r.y, width: r.width, height: r.height }];
  })));
  const overlaps = (a, b) => a.x < b.x + b.width - .2 && a.x + a.width > b.x + .2 && a.y < b.y + b.height - .2 && a.y + a.height > b.y + .2;
  for (const platform of platforms) for (const id of ['motto', 'r4', 'age', 'address', 'venue']) {
    assert.ok(!overlaps(geometry[`coco-form-social-${platform}`], geometry[id]), `${platform} overlaps ${id}`);
  }
  return geometry;
}
try {
  await page.goto('http://localhost:3000/?guest=1', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  await page.getByLabel('Event name', { exact: true }).fill('Ladies Night');
  await page.getByRole('button', { name: 'Tropical', exact: true }).click();
  await page.getByTestId('coco-build-event-next').click();
  const chooser = page.getByTestId('coco-direction-chooser'); await chooser.waitFor({ timeout: 120000 });
  const design = chooser.locator('[data-coco-direction-id="afro-sunset"]');
  for (let i = 0; i < 12 && !await design.count(); i++) {
    await chooser.getByTestId('coco-more-directions').click({ timeout: 120000 });
    await page.getByText('Preparing more designs…', { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
  }
  await design.getByRole('button', { name: 'Choose this design', exact: true }).click();
  const form = page.getByTestId('coco-build-details'); await form.waitFor();
  const answers = { date: 'Dec 1 2026', startTime: '10PM - LATE', venueName: 'THE LOFT', address: 'DOWNTOWN MIAMI FL', musicPolicy: 'HIP HOP | AFROBEATS | REGGAE', subtitle: 'CITY NIGHTS' };
  for (let step = 0; step < 40; step++) {
    for (const [field, value] of Object.entries(answers)) {
      const input = form.getByTestId(`coco-build-brief-${field}`); if (await input.count()) await input.fill(value);
    }
    for (const [field, values] of Object.entries({ presenterName: ['NIGHTLIFE FLYERS'], eventDetails: ['COCKTAILS FOR LADIES', 'MOCKTAILS FOR GENTS'], ageRequirement: ['21'] })) {
      const inputs = form.locator(`input[data-testid^="coco-build-brief-${field}"]`);
      for (let i = 0; i < await inputs.count(); i++) await inputs.nth(i).fill(values[i] ?? values[0]);
    }
    if (step === 0) {
      const back = await form.getByRole('button', { name: '← Back', exact: true }).boundingBox(), skip = await form.getByRole('button', { name: 'Skip', exact: true }).boundingBox();
      assert.ok(back.x + back.width <= skip.x && Math.abs(back.y - skip.y) < 2);
      await page.screenshot({ path: `${out}/01-back-skip.png` });
    }
    if (step === 1) {
      await form.getByRole('button', { name: '← Back', exact: true }).click();
      assert.equal(await form.getByTestId('coco-build-brief-date').inputValue(), answers.date);
      await form.getByTestId('coco-question-next').click();
    }
    if (await form.getByTestId('coco-build-brief-musicPolicy').count()) {
      await form.getByText(/Separate genres with/).waitFor(); await page.screenshot({ path: `${out}/02-genres.png` });
    }
    if (await form.getByTestId('coco-build-brief-subtitle').count()) {
      await form.getByRole('heading', { name: 'What’s your event’s tagline?' }).waitFor();
      await form.getByText(/A tagline is a short phrase/).waitFor(); await page.screenshot({ path: `${out}/03-tagline.png` });
    }
    const social = form.getByTestId('coco-build-brief-socialPlatforms');
    if (await social.count()) {
      for (const name of platforms) { const b = social.getByRole('button', { name, exact: true }); if (await b.getAttribute('aria-pressed') !== 'true') await b.click(); }
      await form.locator('[data-preview-ready="true"]').waitFor({ timeout: 120000 }); await page.waitForTimeout(800);
      await checkSpacing(form.getByRole('region', { name: 'Live flyer preview' }));
      await page.screenshot({ path: `${out}/04-six-socials.png` });
    }
    if (await form.getByTestId('coco-build-finish').count()) { await form.getByTestId('coco-build-finish').click(); break; }
    await form.getByTestId('coco-question-next').click();
  }
  const coco = page.getByTestId('coco-conversation'); await coco.waitFor({ timeout: 120000 });
  for (const format of ['square', 'story']) {
    await coco.getByTestId(`coco-conversation-format-${format}`).click();
    await page.getByLabel('Preparing flyer canvas', { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    await page.waitForTimeout(800);
    const geo = await checkSpacing(coco.getByRole('region', { name: 'Your live flyer' }));
    writeFileSync(`${out}/${format}-geometry.json`, JSON.stringify(geo, null, 2));
    await page.screenshot({ path: `${out}/05-${format}.png` });
  }
  if (process.env.NF_RESIZE === '1') {
    await coco.getByTestId('coco-conversation-format-square').click();
    await page.getByLabel('Preparing flyer canvas', { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    await coco.getByRole('button', { name: 'Event details', exact: true }).click();
    await coco.getByLabel('Review answers', { exact: true }).selectOption({ label: 'Music genres / policy' });
    await coco.locator('summary').filter({ hasText: 'Adjust size' }).click();
    const size = coco.locator('[data-coco-quick-size-object="genres"] input[type="text"]');
    const description = coco.locator('[aria-label="Your live flyer"] [data-coco-compiled-object="description"]');
    const oldSize = Number(await size.inputValue()), before = await description.boundingBox();
    await size.fill(String(oldSize * 2)); await size.press('Tab'); await page.waitForTimeout(700);
    assert.ok((await description.boundingBox()).y > before.y + 1, 'nearby copy moves down when genres grow');
    await page.screenshot({ path: `${out}/06-text-spacing.png` });
    await coco.getByRole('button', { name: 'Undo adjustment', exact: true }).click(); await page.waitForTimeout(500);
    assert.ok(Math.abs((await description.boundingBox()).y - before.y) < 1, 'Undo restores neighbouring copy');
    await coco.getByRole('button', { name: 'Done', exact: true }).click();
    console.log('PASS live text-growth reflow and Undo');
  }
  await coco.getByRole('button', { name: 'Looks good →', exact: true }).click();
  await coco.getByTestId('coco-conversation-ready').click(); await coco.getByTestId('coco-conversation-export').click();
  const review = page.getByTestId('coco-finish-review');
  if (await review.isVisible()) {
    while (await review.getByRole('button', { name: 'Keep as is', exact: true }).count()) await review.getByRole('button', { name: 'Keep as is', exact: true }).first().click();
    await review.getByRole('button', { name: 'Download Square + Story', exact: true }).click();
  }
  for (const format of ['Square', 'Story']) {
    await page.getByAltText(`${format} export preview`, { exact: true }).waitFor({ timeout: 180000 });
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: `Save ${format}`, exact: true }).click();
    await (await download).saveAs(`${out}/export-${format}.png`);
  }
  assert.deepEqual(errors, []); console.log('PASS Back/Skip order, preserved answers, genre/tagline guidance, six-social spacing in both formats, and both PNG downloads');
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png` }); console.error(error); console.log(errors); process.exitCode = 1;
} finally { await browser.close(); }
