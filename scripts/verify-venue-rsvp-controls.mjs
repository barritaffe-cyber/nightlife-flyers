import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/tmp/venue-rsvp-check';
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
 await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(60000);
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['reggae-jams','reggae-jams.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
   const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
   if(await keep.isVisible()){await keep.click();await page.waitForTimeout(2500);}
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   if(await page.locator('input[type=file][accept*=json]').count()===0)await project.click();
   await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(4000);
   for(const format of ['square','story']){
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(2500);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>document.fonts.ready);

     await page.locator('#artboard').scrollIntoViewIfNeeded();
     await page.waitForTimeout(5000);
     await page.waitForFunction(() => {
       const board=document.querySelector('#artboard');
       const loading=/Preparing (?:story|square) canvas/.test(board?.textContent||'');
       const imagesReady=Array.from(board?.querySelectorAll('img')||[]).every(img=>img.complete);
       if(loading || !imagesReady){window.__recipePreviewReadySince=0;return false;}
       window.__recipePreviewReadySince ||= Date.now();
       return Date.now()-window.__recipePreviewReadySince>4000;
     },null,{timeout:90000});
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('REGGAE'));
     assert.equal(await page.locator('[data-coco-compiled-object="musicLabel"]').count(),1);
     assert.doesNotMatch(await page.locator('#artboard').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(800);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     const venue=page.locator('[data-coco-compiled-object="venue"]');
     const address=page.locator('[data-coco-compiled-object="address"]');
     const beforeAddress=await address.evaluate(e=>getComputedStyle(e).color);
     const header=page.getByRole('button',{name:'▸ Venue',exact:true});
     if(await header.getAttribute('aria-expanded')!=='true')await header.click();
     const colors=page.locator('#venue-panel input[type=color]');
     await colors.first().waitFor({state:'visible',timeout:10000});
     assert.equal(await colors.count(),2);
     await colors.nth(0).fill('#ff0000');
     await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-coco-compiled-object="venue"]')).color==='rgb(255, 0, 0)');
     assert.equal(await address.evaluate(e=>getComputedStyle(e).color),beforeAddress);
     await address.click();await page.waitForTimeout(500);
     await colors.nth(0).fill('#00ff00');
     await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-coco-compiled-object="venue"]')).color==='rgb(0, 255, 0)');
     assert.equal(await address.evaluate(e=>getComputedStyle(e).color),beforeAddress);
     const caption=page.locator('[data-coco-compiled-object="contactLabel"]');
     await caption.click();await page.waitForTimeout(500);
     const card=page.locator('[data-template-label-card="leftRail"]');
     const fields=card.locator('input:not([type=range]):not([type=color])');
     const label=card.locator('input').filter({visible:true});
     const captionInput=card.locator('input').filter({visible:true});
     const input=card.locator('input[placeholder="VIP TABLES & INFO"]');
     assert.equal(await input.inputValue(),'FOR RESERVATIONS:');
     await input.fill('TABLE BOOKINGS:');
     await page.waitForFunction(()=>document.querySelector('[data-coco-compiled-object="contactLabel"]').textContent.includes('TABLE BOOKINGS:'));
     assert.ok((await page.locator('[data-coco-compiled-object="contact"]').textContent()).includes('059 782 1413'));
     await card.locator('input[placeholder="555 123 4567"]').fill('555 010 2026');
     await page.waitForFunction(()=>document.querySelector('[data-coco-compiled-object="contact"]').textContent.includes('555 010 2026'));
     assert.ok((await caption.textContent()).includes('TABLE BOOKINGS:'));
     console.log('PASS',format,'venue name color independent of address; RSVP caption and contact edit independently');
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
