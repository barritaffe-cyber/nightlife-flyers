import {chromium} from 'playwright';
import {expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/tmp/coco-homepage';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];const base=process.env.NF_BASE_URL||'http://localhost:3000';
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
 await context.route('**/api/analytics/**',r=>r.fulfill({json:{ok:true}}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/landing?utm_source=homepage-test`,{waitUntil:'networkidle',timeout:120000});
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your next flyer.Ready in five.');
 for(const [id,price] of [['basic',10],['full',15],['manager',30],['one-flyer',5]])await expect(page.getByTestId(`pricing-${id}`)).toContainText(`$${price}`);
 await expect(page.getByTestId('pricing-manager').getByRole('link')).toHaveCount(0);
 for(const image of await page.locator('main img').all())await image.evaluate(el=>el.decode());
 await page.screenshot({path:`${out}/desktop.png`,fullPage:true});
 await page.getByRole('button',{name:'Show We Outside',exact:true}).click();
 await expect(page.getByRole('button',{name:'Show We Outside',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('searchbox').fill('Salsa');
 await expect(page.locator('#vibes').getByRole('heading',{name:/Salsa Noche/})).toBeVisible();
 await page.getByRole('searchbox').fill('zzzz-no-template');
 await expect(page.getByText(/No matching designs yet/)).toBeVisible();
 await page.getByRole('button',{name:'Afrobeats',exact:true}).click();
 await expect(page.locator('#vibes').getByRole('heading',{name:'Afro Sunset',exact:true})).toBeVisible();
 await page.getByLabel('Your event name',{exact:true}).fill('AFTER DARK');
 const flyer=page.frameLocator('iframe[title="Live editable Girl Code Rose flyer"]');
 await expect(flyer.locator('.headline')).toHaveText('AFTER');
 await expect(flyer.locator('.subtitle')).toHaveText('Dark');
 // Background clipping truncates script flourishes outside the line box.
 await expect(flyer.locator('.subtitle')).toHaveCSS('background-image','none');
 await expect(flyer.locator('.subtitle')).toHaveCSS('-webkit-text-fill-color','rgb(255, 209, 215)');
 await page.locator('#walkthrough').screenshot({path:`${out}/live-square.png`});
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await expect(flyer.locator('.canvas')).toHaveAttribute('data-format','story');
 await expect(flyer.locator('.background')).toHaveAttribute('src','/generated-flyers/assets/girl-code-story2.jpg');
 await page.locator('#walkthrough').screenshot({path:`${out}/live-story.png`});
 await page.getByLabel('Your event name',{exact:true}).fill('<script>alert(1)</script>');
 await expect(flyer.locator('.headline')).toHaveText('<SCRIPT>ALERT(1)</SCRIPT>');
 await page.getByLabel('Your event name',{exact:true}).fill('AFTER DARK');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`no overflow at ${width}`);
  await page.screenshot({path:`${out}/mobile-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1050});
 await page.locator('#new a').first().click();
 await expect(page.locator('[data-testid="coco-build-event-next"]')).toHaveCount(0);
 await page.waitForFunction(()=>!new URL(location.href).searchParams.has('cocoDesign'),null,{timeout:120000});
 await expect(page.getByRole('heading',{name:'Your next flyer. Ready in five.'})).toHaveCount(0);
 await expect(page.getByText('Preparing square canvas.',{exact:true})).toHaveCount(0,{timeout:120000});
 await expect(page.getByText('YCEE',{exact:true}).first()).toBeVisible({timeout:120000});
 await page.screenshot({path:`${out}/opened-ycee.png`,fullPage:false});
 console.log('Recipe destination:',page.url());
 assert.deepEqual(errors,[]);
 writeFileSync(`${out}/results.json`,JSON.stringify({desktop:true,mobile:true,liveGlyphs:true,formats:true,search:true,managerComingSoon:true,recipeEntry:true,errors},null,2));
 console.log('PASS homepage: desktop/mobile, search, live headline, both formats, pricing, recipe entry.');
}finally{await browser.close();}
