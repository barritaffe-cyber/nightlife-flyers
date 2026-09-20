import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.NF_VERIFY_OUT || '/private/tmp/brunch-import-verification';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  localStorage.setItem('nf:pwa-install-ack:v1', '1');
  localStorage.setItem('nf:onboarded:v1', '1');
  localStorage.setItem('nf:saveNoticeDismissed', '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://localhost:3000/generated-flyers/brunch-vibes-studio-final.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-coco-canvas]').screenshot({path:`${out}/css-source.png`});
  await page.goto('http://localhost:3000/?guest=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByRole('button').filter({hasText:'Create with Coco'}).waitFor({timeout:90000});
  await page.getByRole('button', {name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click();
  await new Promise(resolve => setTimeout(resolve, 4000));
  await page.getByRole('button', {name:'▸ Project',exact:true}).click();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.locator('input[type=file]').setInputFiles(process.env.NF_VERIFY_FILE || 'public/generated-flyers/brunch-vibes-compiled-portrait.nflyer');
  await new Promise(resolve => setTimeout(resolve, 8000));
  console.log(await page.locator('body').ariaSnapshot());
  await page.screenshot({ path: `${out}/imported.png`, fullPage: true });
  console.log('SAVED', `${out}/imported.png`);
  await page.locator('#artboard').screenshot({path:`${out}/square.png`});
  console.log('HEADLINE PAINT', await page.locator('[data-coco-compiled-object="headline"] g[data-headline-shadow-glyph="0"] > rect').getAttribute('fill'));
  if (process.env.NF_VERIFY_CONTROLS) {
    await page.getByRole('button', {name:'▸ Headline',exact:true}).click();
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('HEADLINE CONTROLS', await page.locator('body').ariaSnapshot());
    await page.getByRole('button', {name:'Shadow',exact:true}).click();
    const paintedHeadline = page.locator('[data-coco-compiled-object="headline"] svg[data-coco-compiled-gold-text-mask]');
    await page.waitForFunction(() => document.querySelector('[data-coco-compiled-object="headline"] g[data-headline-shadow-glyph]')?.style.filter.includes('drop-shadow'));
    assert.equal(await paintedHeadline.locator('g[data-headline-shadow-glyph]').count(), 6);
    assert.doesNotMatch(await paintedHeadline.getAttribute('style'), /drop-shadow/);
    await page.locator('#artboard').screenshot({path:`${out}/square-shadow-on.png`});
    await page.getByRole('textbox', {name:'Pick color',exact:true}).fill('#ff0000');
    await page.getByRole('textbox', {name:'Pick color',exact:true}).press('Tab');
    await page.waitForFunction(() => document.querySelector('[data-coco-compiled-object="headline"] g > rect')?.getAttribute('fill')?.toLowerCase() === '#ff0000');
    await page.locator('#artboard').screenshot({path:`${out}/square-red-shadow.png`});
    await page.getByRole('button', {name:'Shadow',exact:true}).click();
    await page.waitForFunction(() => !document.querySelector('[data-coco-compiled-object="headline"] g[data-headline-shadow-glyph]')?.style.filter.includes('drop-shadow'));
    console.log('PASS: headline color changed to red; shadow toggled on and off on visible SVG');
  }
  await page.getByRole('button', {name:'Story',exact:true}).click();
  await new Promise(resolve => setTimeout(resolve, 5000));
  await page.locator('#artboard').screenshot({path:`${out}/story.png`});
  console.log('SAVED', `${out}/story.png`);
  if (process.env.NF_VERIFY_STORY_COLOR) {
    await page.getByRole('button', {name:'▸ Headline',exact:true}).click();
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('STORY CONTROLS', await page.locator('body').ariaSnapshot());
    for (const [label, hex] of [['Grad A', '#00ffff'], ['Grad B', '#ff00ff']]) {
      const input = page.getByText(label, {exact:true}).locator('..').getByRole('textbox', {name:'Pick color',exact:true});
      await input.fill(hex);
      await input.press('Tab');
    }
    await page.waitForFunction(() => {
      const stops = [...document.querySelectorAll('[data-coco-compiled-object="headline"] linearGradient stop')];
      return stops.length === 2 && stops[0].getAttribute('stop-color')?.toLowerCase() === '#00ffff' && stops[1].getAttribute('stop-color')?.toLowerCase() === '#ff00ff';
    });
    await page.locator('#artboard').screenshot({path:`${out}/story-gradient-edited.png`});
    await page.getByText('Fill', {exact:true}).locator('..').getByRole('textbox', {name:'Pick color',exact:true}).fill('#ff0000');
    await page.getByRole('textbox', {name:'Pick color',exact:true}).press('Tab');
    await page.waitForFunction(() => document.querySelector('[data-coco-compiled-object="headline"] g > rect')?.getAttribute('fill')?.toLowerCase() === '#ff0000');
    await page.locator('#artboard').screenshot({path:`${out}/story-solid-edited.png`});
    console.log('PASS: Story gradient endpoints and solid headline color update');
  }
  const initialText = await page.locator('#artboard').innerText();
  for(let step=1;step<=Number(process.env.NF_VERIFY_INTERVALS ?? 6);step++) {
    await new Promise(resolve=>setTimeout(resolve,30000));
    const currentText=await page.locator('#artboard').innerText();
    console.log(JSON.stringify({seconds:step*30,sameText:currentText===initialText,hasBrunch:currentText.includes('BRUNCH'),errors:errors.length}));
  }
  const elapsedSeconds = Number(process.env.NF_VERIFY_INTERVALS ?? 6) * 30;
  await page.locator('#artboard').screenshot({path:`${out}/story-after-${elapsedSeconds}s.png`});
} finally {
  await writeFile(`${out}/errors.json`, JSON.stringify(errors));
  await browser.close();
}
