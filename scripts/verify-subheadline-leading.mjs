import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
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
 for(const [id,file] of [['zona-de-perreo','zona-de-perreo.nflyer']]){
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   if(await project.count())await project.click();
   const saved=JSON.parse(await readFile(`public/generated-flyers/${file}`,'utf8'));
   await page.locator('input[type=file]').setInputFiles({name:file,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
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
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('PERREO'));
     assert.equal(await page.locator('[data-coco-compiled-object="musicLabel"]').count(),1);
     const node=page.locator('[data-node="headline2"]').first();
     const title=page.getByRole('button',{name:'▸ Sub Headline',exact:true});
     await title.click();
     const panel=page.locator('#head2-panel');
     const off=panel.getByRole('button',{name:'Off',exact:true});
     if(await off.isVisible()) await off.click();
     await panel.getByPlaceholder('Optional sub-headline').fill('SUBTITLE SIZE CHECK');
     await node.waitFor();
     await page.waitForTimeout(500);
     const geometry=await node.evaluate(el=>({left:el.style.left,width:el.style.width,align:getComputedStyle(el).textAlign}));
     assert.equal(geometry.left,'5%');assert.equal(geometry.width,'90%');assert.equal(geometry.align,'center');
     const board=await page.locator('#artboard').boundingBox();
     const bounds=await node.boundingBox();
     assert.ok(Math.abs((bounds.x+bounds.width/2)-(board.x+board.width/2))<2,'new text box is centered');
     const size=panel.getByRole('slider',{name:'Size',exact:true});
     await panel.getByPlaceholder('Optional sub-headline').fill('FIRST LINE\nSECOND LINE');
     const leading=panel.getByRole('slider',{name:'Leading',exact:true});
     const heights=[];
     for(const value of [0.4,0.8,1.2]) {
       if(!await leading.isVisible()) await title.click();
       await leading.fill(String(value));
       await page.waitForTimeout(1200);
       const paint=await node.locator(':scope > div').first().evaluate(el=>{
         const css=getComputedStyle(el);
         return {ratio:parseFloat(css.lineHeight)/parseFloat(css.fontSize),height:el.getBoundingClientRect().height};
       });
       assert.ok(Math.abs(paint.ratio-value)<0.01,JSON.stringify(paint));
       heights.push(paint.height);
     }
     assert.ok(heights[1]>heights[0] && heights[2]>heights[1], 'rendered multiline spacing must grow');
     console.log('PASS rendered subheadline leading',format,heights);

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
