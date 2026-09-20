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
 for(const [id,file] of [['amapiano-night','amapiano-night.nflyer']]){
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
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
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('Amapiano'));
     assert.equal(await page.locator('[data-coco-compiled-object="musicLabel"]').count(),1);
     assert.doesNotMatch(await page.locator('#artboard').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(800);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     for(const [id,panelId,value] of [['hosts','details','MC TEST'],['offer','details','ATTRACTION TEST']]) {
       const node=page.locator('[data-coco-compiled-object="'+id+'"]');
       const glyph=node.locator('[data-text-hit-surface="true"]').first();await glyph.scrollIntoViewIfNeeded();
       const box=await glyph.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(500);
       const panel=page.locator('#'+panelId+'-panel');
       await panel.locator('textarea').first().fill(value);
       await page.waitForFunction(({id,value})=>document.querySelector('[data-coco-compiled-object="'+id+'"]')?.textContent.includes(value),{id,value});
       console.log('MAPPED',format,id);
     }

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
