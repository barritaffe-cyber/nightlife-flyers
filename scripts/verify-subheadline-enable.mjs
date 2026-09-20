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
     const initialLeft=await node.evaluate(el=>el.style.left);
     for(const value of [40,70,96,36]) {
       if(!await size.isVisible()) await title.click();
       await size.fill(String(value));
       console.log('SIZE',format,value);
       await page.waitForTimeout(900);
       assert.equal(Number(await node.getAttribute('data-coco-render-head2-size')),value);
       assert.equal(await node.evaluate(el=>el.style.left),initialLeft);
     }
     // Drag from painted letters, then resize and ensure the anchor stays put.
     const hit=node.locator('[data-text-hit-surface="true"]').first();
     const box=await hit.boundingBox();assert.ok(box);
     await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
     await page.mouse.down();await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2+15,{steps:8});await page.mouse.up();
     await page.waitForTimeout(700);
     const movedLeft=await node.evaluate(el=>el.style.left);
     assert.notEqual(movedLeft,initialLeft);
     if(!await size.isVisible()) await title.click();
     await size.fill('66');await page.waitForTimeout(1500);
     assert.equal(Number(await node.getAttribute('data-coco-render-head2-size')),66);
     assert.equal(await node.evaluate(el=>el.style.left),movedLeft);
     await panel.getByRole('button',{name:'On',exact:true}).click();
     await panel.getByRole('button',{name:'Off',exact:true}).click();
     await page.waitForTimeout(500);
     assert.equal(await node.evaluate(el=>el.style.left),movedLeft,'re-enabling preserves edits');
     console.log('PASS disabled-to-enabled box, size, drag, toggle',format);

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
