import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/private/tmp/we-outside-verification';
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
  await page.goto(`http://localhost:3000/generated-flyers/we-outside-master.html?format=${format}`,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-coco-canvas]').screenshot({path:`${out}/css-${format}.png`});
 }
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(12000);
 await page.addStyleTag({content:'#artboard button { visibility: hidden !important; }'});
 for(const [id,file] of [['we-outside','we-outside.nflyer']]){
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
     await page.waitForTimeout(5000);
     await page.waitForFunction(()=>{
       const board=document.querySelector('#artboard');
       if(/Preparing (?:story|square) canvas/.test(board?.textContent||'') || !Array.from(board?.querySelectorAll('img')||[]).every(i=>i.complete)){window.__outsideReadySince=0;return false;}
       window.__outsideReadySince ||= Date.now();
       return Date.now()-window.__outsideReadySince>4000;
     },null,{timeout:90000});
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}.png`});
     console.log('PREVIEW',id,format);
     assert.equal(await page.locator('[data-node="price"][data-coco-runtime-overlay="true"]').count(),0,'Compiled offer must not get a duplicate native badge');
     assert.equal(await page.locator('#artboard [data-node="leftRail"]').count(),0,'No inherited contact rail');
     const divider=page.locator('[data-coco-compiled-object="divider"]');
     await divider.click();
     await page.waitForTimeout(400);
     assert.equal(await divider.getAttribute('data-coco-compiled-selected'),'true');
     assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
     console.log('SELECTED GRAPHIC',format,'divider');
     if(process.env.NF_PREVIEW_ONLY)continue;

     for(const objectId of ['brand','presenter','day','weekday','time','we','headline','script','host','lineup','address','legal']){
       const textNode=page.locator(`[data-coco-compiled-object="${objectId}"]`);
       await textNode.scrollIntoViewIfNeeded();
       const point=await textNode.evaluate(owner=>{
         for(const glyph of owner.querySelectorAll('[data-text-hit-surface="true"]')){
           const b=glyph.getBoundingClientRect();
           for(let y=b.top;y<b.bottom;y+=1)for(let x=b.left;x<b.right;x+=1){
             const hit=document.elementFromPoint(x,y);
             if(hit && owner.contains(hit))return {x,y};
           }
         }
         return null;
       });
       assert.ok(point,`${format} ${objectId} must have selectable glyphs`);
       await page.mouse.click(point.x,point.y);
       assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
       if(objectId==='we' || objectId==='headline'){
         const original=objectId==='we'?'We':'OUTSIDE';
         const replacement=objectId==='we'?'Hi':'FIVE';
         let editor=null;
         for(const field of await page.locator('textarea,input[type="text"]').all()){
           if(await field.isVisible() && (await field.inputValue())===original){editor=field;break;}
         }
         assert.ok(editor,`${objectId} has its existing sidebar field`);
         await editor.fill(replacement);
         await page.waitForTimeout(300);
         assert.ok((await textNode.textContent()).includes(replacement));
         // Keep the edits in this isolated browser session to test the combined Hi FIVE example.
         console.log('EDITED',format,objectId,replacement);
       }
       console.log('SELECTED',format,objectId);
     }

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{await browser.close();}
