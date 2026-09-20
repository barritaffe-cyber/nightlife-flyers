import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'public/generated-flyers';
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
 for(const [id,file] of [['throwback-saturdays','throwback-saturdays.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
   const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
   if(await keep.isVisible()){await keep.click();await page.waitForTimeout(1000);}
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   if(await page.locator('input[type=file][accept*=json]').count()===0)await project.click({noWaitAfter:true});
   await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(1000);
   for(const format of ['square','story']){
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(1000);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>document.fonts.ready);

     await page.locator('#artboard').scrollIntoViewIfNeeded();
     await page.waitForTimeout(1000);
     await page.waitForFunction(() => {
       const board=document.querySelector('#artboard');
       const loading=/Preparing (?:story|square) canvas/.test(board?.textContent||'');
       const imagesReady=Array.from(board?.querySelectorAll('img')||[]).every(img=>img.complete);
       if(loading || !imagesReady){window.__recipePreviewReadySince=0;return false;}
       window.__recipePreviewReadySince ||= Date.now();
       return Date.now()-window.__recipePreviewReadySince>4000;
     },null,{timeout:90000});
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').includes('THROWBACK'));
     assert.equal(await page.locator('[data-coco-compiled-object="subtag"]').count(),1);
     assert.doesNotMatch(await page.locator('[data-coco-compiled-document="true"]').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(1500);
     const lateChooser=page.getByRole('button',{name:format==='square'?'Choose Square format':'Choose Story format',exact:true});
     if(await lateChooser.isVisible()) {
       await lateChooser.click();await page.waitForTimeout(8000);
       const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
       if(await keep.isVisible())await keep.click();
       await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
       await page.waitForTimeout(8000);
       await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     }
     await page.waitForTimeout(1000);
     await page.waitForFunction((format)=>{
       const board=document.querySelector('#artboard');
       const rect=board?.getBoundingClientRect();
       return board?.textContent.replace(/\s/g,'').includes('THROWBACK') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     if(process.env.VERIFY_COMPLIANCE){
       const owner=page.locator('[data-coco-compiled-object="compliance"]');
       const box=await owner.locator('[data-text-hit-surface="true"]').first().boundingBox();assert.ok(box);
       await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
       const input=page.locator('[data-template-label-card="compliance"] textarea');
       await input.waitFor({state:'visible'});
       assert.equal(await input.getAttribute('inputmode'),null);
       const original=await input.inputValue();assert.match(original,/DRESS TO IMPRESS/);
       const updated='DOORS 9PM | 18+ | SMART CASUAL';
       await input.fill(updated);
       await page.waitForFunction(text=>document.querySelector('[data-coco-compiled-object="compliance"]')?.textContent.includes(text),updated);
       await input.fill(original);
       await page.waitForFunction(text=>document.querySelector('[data-coco-compiled-object="compliance"]')?.textContent.includes(text),original);
       console.log('EDITED compliance words and punctuation',format);
     }

     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ["presents", "day", "month", "motto", "genres", "musicBy", "club", "headline", "subtag", "date", "djs", "venue", "address"]){
       const owner=page.locator(`[data-coco-compiled-object="${objectId}"]`);
       await owner.scrollIntoViewIfNeeded();
       const glyph=owner.locator('[data-text-hit-surface="true"]').first();
       const box=await glyph.boundingBox();assert.ok(box,objectId);
       for (const [dx,dy] of [[.5,.5],[.25,.25],[.75,.25],[.25,.65],[.75,.65]]) {
         await page.mouse.click(box.x+box.width*dx,box.y+box.height*dy);
         await page.waitForTimeout(400);
         if(await owner.getAttribute('data-active')==='true')break;
       }
       assert.equal(await owner.getAttribute('data-active'),'true',format+' '+objectId+' selects its existing panel');
       assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
       console.log('SELECTED',format,objectId);
     }

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}