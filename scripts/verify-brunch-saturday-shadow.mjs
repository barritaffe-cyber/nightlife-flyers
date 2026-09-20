import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/private/tmp/brunch-saturday-verification';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try{
 await page.goto(process.env.NF_VERIFY_URL||'http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 console.log(await page.locator('body').ariaSnapshot());
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(5000);
 await page.getByRole('button',{name:'▸ Project',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/brunch-saturday.nflyer');
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(4000);

 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 const headline=page.locator('[data-coco-compiled-object="headline"]');
 await headline.locator('[data-text-hit-surface="true"]').first().click({noWaitAfter:true});
 const paint=headline.locator('[data-headline-texture-paint]').first();
 const shadowFilters=()=>headline.locator('[data-headline-shadow-glyph]').evaluateAll(nodes=>nodes.map(e=>getComputedStyle(e).filter));
 const snapshot=()=>paint.evaluate(e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return {filter:s.filter,texture:s.backgroundImage,clip:s.backgroundClip,width:r.width,height:r.height};});
 const initial=await snapshot();
 assert.ok(initial.texture.startsWith('url('),'Headline uses the imported texture');
 const toggle=page.getByRole('button',{name:'Shadow',exact:true});
 if((await shadowFilters()).some(f=>f.includes('drop-shadow')))await toggle.click();
 const off=await snapshot();
 assert.equal(off.filter,'none');
 await page.locator('#artboard').screenshot({path:`${out}/texture-shadow-off.png`});
 await toggle.click();
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-coco-compiled-object="headline"] span')].some(e=>getComputedStyle(e).filter.includes('drop-shadow')));
 const on=await snapshot();
 assert.match(on.filter,/drop-shadow/,'Shadow belongs to each visible textured glyph');
 assert.equal((await shadowFilters()).length,6);
 assert.ok((await shadowFilters()).every(f=>f.includes('drop-shadow')),'Each BRUNCH glyph has its own shadow');
 assert.deepEqual(await headline.locator('[data-headline-shadow-glyph]').allTextContents(),Array.from('BRUNCH'));
 assert.equal(await headline.locator('[data-headline-shadow-glyph][data-headline-texture-paint]').count(),6);
 assert.equal(await headline.locator('[data-headline-texture-paint]:not([data-headline-shadow-glyph])').count(),0,'No whole-word repaint covering glyph shadows');
 assert.equal(on.texture,off.texture);
 assert.equal(on.clip,'text');
 assert.equal(on.width,off.width);
 assert.equal(on.height,off.height);
 await page.locator('#artboard').screenshot({path:`${out}/texture-shadow-on.png`});
 await toggle.click();
 assert.ok((await shadowFilters()).every(f=>f==='none'));
 assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
 const spacing=page.getByText('Spacing',{exact:true}).locator('..').locator('input[type="text"]');
 const originalSpacing=await spacing.inputValue();
 const glyphMetrics=()=>headline.locator('[data-headline-shadow-glyph]').evaluateAll(nodes=>nodes.map(e=>({width:e.getBoundingClientRect().width,x:e.getBoundingClientRect().x,spacing:getComputedStyle(e).letterSpacing,margin:parseFloat(getComputedStyle(e).marginRight)})));
 await spacing.fill('0'); await spacing.press('Tab');
 const zero=await glyphMetrics();
 for(const value of ['-0.08','0.08']){
   await spacing.fill(value); await spacing.press('Tab');
   await page.waitForFunction(negative=>{const e=document.querySelector('[data-headline-texture-paint]');return e && (negative?parseFloat(getComputedStyle(e).marginRight)<0:parseFloat(getComputedStyle(e).marginRight)>0);},Number(value)<0);
   const changed=await glyphMetrics();
   for(let i=0;i<zero.length;i++){
     assert.ok(Math.abs(changed[i].width-zero[i].width)<0.1,'Spacing must not shrink or clip a glyph paint box');
     assert.ok(['normal','0px'].includes(changed[i].spacing));
   }
   assert.ok(Number(value)<0 ? changed[1].x-changed[0].x<zero[1].x-zero[0].x : changed[1].x-changed[0].x>zero[1].x-zero[0].x,'Spacing changes glyph advance');
   await page.locator('#artboard').screenshot({path:`${out}/texture-spacing-${value}.png`});
 }
 await spacing.fill(originalSpacing); await spacing.press('Tab');
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('PASS: six separate textured headline glyph shadows toggle on/off through existing sidebar; texture and geometry preserved.');
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
