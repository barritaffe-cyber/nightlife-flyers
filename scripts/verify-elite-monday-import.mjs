import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/private/tmp/elite-monday-verification';
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
 for(const format of ['square','story']){
  await page.goto(`http://localhost:3000/generated-flyers/elite-monday-master.html?format=${format}`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-coco-canvas]').screenshot({path:`${out}/css-${format}.png`});
 }
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(12000);
 await page.addStyleTag({content:'#artboard button { visibility: hidden !important; }'});
 for(const [id,file] of [['elite-monday','elite-monday.nflyer']]){
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   if(await project.count())await project.click();
   await page.locator('input[type=file]').setInputFiles(`public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(4000);
   for(const format of ['square','story']){
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(2500);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     assert.equal(await page.getByText(/Preparing (?:story|square) canvas/).count(),0);
     await page.locator('#artboard').getByText(/Preparing (?:story|square) canvas/).waitFor({state:'hidden',timeout:90000});
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}.png`});
     console.log('PREVIEW',id,format);
     assert.equal(await page.locator('[data-node="price"][data-coco-runtime-overlay="true"]').count(),0,'Compiled offer must not get a duplicate native badge');
     if(process.env.NF_PREVIEW_ONLY)continue;

     for(const objectId of ['brand','tagline','headline','corporate','special','featuring','dj','artist','day','ordinal','month','time','onwards','reservation','address']){
       const textNode=page.locator(`[data-coco-compiled-object="${objectId}"]`);
       const glyph=textNode.locator('[data-text-hit-surface="true"]').first();
       const box=await glyph.boundingBox();assert.ok(box);
       await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
       await page.waitForTimeout(250);
       assert.equal(await textNode.getAttribute('data-active'),'true',format+' '+objectId+' selection');
       assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
       console.log('SELECTED',format,objectId);
     }

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{await browser.close();}
