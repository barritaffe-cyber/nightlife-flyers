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
const baseUrl=process.env.NF_BASE_URL || 'http://localhost:3000';
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try{
 await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(Number(process.env.NF_STARTUP_MS || 15000));
 const starterCard=page.locator('.nf-startup-shell button').filter({has:page.locator('img')}).first();
 if(await starterCard.isVisible()){await starterCard.click({force:true});await page.waitForTimeout(2000);}
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['reggae-jams','reggae-jams.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
   const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
   if(await keep.isVisible()){await keep.click({force:true});await page.waitForTimeout(1000);}
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   if(await page.locator('input[type=file]').count()===0)await project.click();
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
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('REGGAE'));
     assert.equal(await page.locator('[data-coco-compiled-object="headline"] [data-sunset-foil-mask="true"]').count(),1,'REGGAE uses the live SVG mask renderer');
     assert.ok(await page.locator('[data-coco-compiled-object="headline"] [data-headline-shadow-glyph]').count()>=6,'REGGAE paints the material per glyph');
     assert.ok(await page.locator('[data-coco-compiled-object="headline"] [data-reggae-stucco-material="true"]').count()>=6,'REGGAE keeps its supplied stucco material inside every glyph');
     assert.equal(await page.locator('[data-coco-compiled-object="jams"] [data-png-glyph-run]').count(),1,'Jams uses editable bitmap lettering');
     assert.equal(await page.locator('[data-coco-compiled-object="jams"] [data-headline-shadow-glyph]').count(),4,'Jams keeps four independent supplied glyphs');
     if(process.env.NF_INSPECT_BOUNDS) console.log('BOUNDS',format,await page.evaluate(()=>Object.fromEntries(['headline','jams','dressCode','dressBrush'].map(id=>{const el=document.querySelector(`[data-coco-compiled-object="${id}"]`);const r=el?.getBoundingClientRect();return [id,r&&{x:r.x,y:r.y,width:r.width,height:r.height,position:getComputedStyle(el).position,transform:getComputedStyle(el).transform}]}))));
     assert.equal(await page.locator('[data-coco-compiled-object="musicLabel"]').count(),1);
     assert.doesNotMatch(await page.locator('#artboard').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(800);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ["presenter", "presents", "headline", "jams", "time", "endTime", "dressCode", "musicLabel", "lineup", "hostLabel", "hosts", "weekday", "date", "year", "motto", "venue", "address", "attractions", "contactLabel", "contact"]){
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
