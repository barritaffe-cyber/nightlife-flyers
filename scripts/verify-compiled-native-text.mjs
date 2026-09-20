import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const out = '/private/tmp/compiled-native-text-verification';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try{
 await page.goto(process.env.NF_VERIFY_URL||'http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:240000});
 await page.waitForTimeout(12000);
 await page.getByRole('button',{name:'▸ Project',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/pulse.nflyer');
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(4000);

 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 await page.getByRole('button',{name:/Template Labels/}).first().click();
 const header=page.getByRole('button',{name:/Presenter \/ Promoter/});
 if(await header.getAttribute('aria-expanded')!=='true')await header.click();
 const card=header.locator('..').locator('..');
 await card.locator('textarea').fill('PULSE PRESENTS');
 const off=card.getByRole('button',{name:'Off',exact:true});
 if(await off.count())await off.click();
 const native=page.locator('#artboard [data-node="presenter"]');
 await native.waitFor({state:'visible',timeout:15000});
 assert.match(await native.textContent(),/PULSE PRESENTS/);
 assert.equal(await native.evaluate(e=>getComputedStyle(e).visibility),'visible');
 assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
 const layer = await native.evaluate(e => Number(getComputedStyle(e).zIndex));
 const backgroundLayer = await page.locator('[data-coco-compiled-object="background"]').evaluate(e => Number(getComputedStyle(e).zIndex));
 assert.ok(layer > backgroundLayer, 'New native text must paint above the compiled background');
 await native.scrollIntoViewIfNeeded();
 const point = await native.evaluate(owner => {
   for (const glyph of owner.querySelectorAll('[data-text-hit-surface="true"]')) {
     const box = glyph.getBoundingClientRect();
     for (let y = box.top; y < box.bottom; y += 1) {
       for (let x = box.left; x < box.right; x += 1) {
         const hit = document.elementFromPoint(x, y);
         if (hit && owner.contains(hit)) return {x, y};
       }
     }
   }
   return null;
 });
 assert.ok(point, 'Presenter must have reachable painted glyphs on the canvas');
 await page.mouse.click(point.x, point.y);
 assert.equal(await native.getAttribute('data-active'), 'true');

 await page.locator('#artboard').screenshot({path:`${out}/presenter-on.png`});
 await card.getByRole('button',{name:'On',exact:true}).click();
 await native.waitFor({state:'hidden'});
 await card.getByRole('button',{name:'Off',exact:true}).click();
 await native.waitFor({state:'visible'});
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await page.waitForTimeout(3000);
 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 await page.getByRole('button',{name:'Square',exact:true}).click();
 await page.waitForTimeout(3000);
 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 await native.waitFor({state:'visible'});
 assert.match(await native.textContent(),/PULSE PRESENTS/);
 assert.equal(await page.locator('[data-node="price"][data-coco-runtime-overlay="true"]').count(),0);
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('PASS: missing Presenter enables, edits, selects through painted glyphs, toggles off/on, and persists across format switches; no duplicate compiled price or desktop popup.');
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
