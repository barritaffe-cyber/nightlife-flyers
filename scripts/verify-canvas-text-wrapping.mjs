process.env.NF_PREVIEW_ONLY='1';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || (process.env.NF_ACCEPTED_PREVIEW ? 'public/generated-flyers' : '/tmp/nightlife-editor-regressions');
await mkdir(out,{recursive:true});
const baseUrl=process.env.NF_BASE_URL || 'http://localhost:3000';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try{
 await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(Number(process.env.NF_STARTUP_MS || 15000));
 console.log("EDITOR LOADED");
 const starterCard=page.locator('.nf-startup-shell button').filter({has:page.locator('img')}).first();
 if(await starterCard.isVisible()){await starterCard.click({force:true});await page.waitForTimeout(2000);}
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['branch-happy-hour','branch-happy-hour.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
   const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
   if(await keep.isVisible()){await keep.click();await page.waitForTimeout(1000);}
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   for(let attempt=0;attempt<8;attempt++){
     const late=page.getByRole('button',{name:'Choose Square format',exact:true});
     if(await late.isVisible())await late.click({force:true});
     const keepLayout=page.getByRole('button',{name:'Keep this layout',exact:true});
     if(await keepLayout.isVisible())await keepLayout.click({force:true});
     if(await page.locator('input[type=file][accept*=json]').count())break;
     await project.evaluate(el=>el.click());
     await page.waitForTimeout(2000);
   }
   console.log('IMPORTING');
   await page.locator('input[type=file][accept*=json]').setInputFiles(process.env.NF_VERIFY_FILE || `public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   console.log('IMPORTED');
   await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,10000))]));console.log('FONT WAIT FINISHED');
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(1000);
   console.log('READY');
   if(!process.env.NF_ROUNDTRIP_ONLY) for(const format of ['square','story']){
     console.log('FORMAT',format);
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(1000);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,10000))]));console.log('FONT WAIT FINISHED');

     await page.locator('#artboard').scrollIntoViewIfNeeded();
     await page.waitForTimeout(1000);
     console.log('IMAGE READINESS');
     await page.waitForFunction(() => {
       const board=document.querySelector('#artboard');
       const loading=/Preparing (?:story|square) canvas/.test(board?.textContent||'');
       const imagesReady=Array.from(board?.querySelectorAll('img')||[]).every(img=>img.complete);
       if(loading || !imagesReady){window.__recipePreviewReadySince=0;return false;}
       window.__recipePreviewReadySince ||= Date.now();
       return Date.now()-window.__recipePreviewReadySince>4000;
     },null,{timeout:90000});
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').includes('HAPPY'));
     assert.equal(await page.locator('[data-coco-compiled-object="subtitle"]').count(),1);
     assert.doesNotMatch(await page.locator('[data-coco-compiled-document="true"]').innerText(), /SUB HEADLINE/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(1500);
     const lateChooser=page.getByRole('button',{name:format==='square'?'Choose Square format':'Choose Story format',exact:true});
     if(await lateChooser.isVisible()) {
       await lateChooser.click();await page.waitForTimeout(8000);
       const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
       if(await keep.isVisible())await keep.click();
       await page.locator('input[type=file][accept*=json]').setInputFiles(process.env.NF_VERIFY_FILE || `public/generated-flyers/${file}`);
       await page.waitForTimeout(8000);
       await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     }
     await page.waitForTimeout(1000);
     await page.waitForFunction((format)=>{
       const board=document.querySelector('#artboard');
       const rect=board?.getBoundingClientRect();
       return board?.textContent.replace(/\s/g,'').includes('HAPPY') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,10000))]));console.log('FONT WAIT FINISHED');
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     const wrapping = await page.evaluate(() => {
       return ['headline', 'subtitle', 'genres', 'address'].map(id => {
         const owner = document.querySelector('[data-coco-compiled-object="'+id+'"]');
         const before = owner.getBoundingClientRect().height;
         const oldWidth = owner.style.width;
         owner.style.width = '1px';
         const after = owner.getBoundingClientRect().height;
         const whiteSpace = getComputedStyle(owner).whiteSpace;
         owner.style.width = oldWidth;
         return {id, before, after, whiteSpace};
       });
     });
     for (const result of wrapping) {
       assert.equal(result.whiteSpace, 'pre', result.id+' preserves authored lines');
       assert.ok(Math.abs(result.before-result.after)<1, result.id+' must not wrap when narrowed');
     }
     const explicitLines = await page.locator('[data-coco-compiled-object="address"]').evaluate(owner => {
       const probe = owner.cloneNode(false);
       probe.style.position='fixed';probe.style.width='1px';probe.style.height='auto';probe.style.display='block';
       probe.textContent='ONE TWO THREE';document.body.append(probe);
       const single=probe.getBoundingClientRect().height;
       probe.textContent='ONE\nTWO\nTHREE';const multiline=probe.getBoundingClientRect().height;
       probe.remove();return {single,multiline};
     });
     assert.ok(explicitLines.multiline > explicitLines.single*2.5, 'Explicit newlines still create separate lines');
     console.log('NO AUTO WRAP / EXPLICIT NEWLINES PASSED',format);

   }
 }
 assert.deepEqual(errors, []);
 console.log('CANVAS TEXT WRAPPING CHECKS PASSED');
} finally { await browser.close(); }
