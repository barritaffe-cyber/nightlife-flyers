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
 await page.waitForTimeout(40000);
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['rnb-thursdays','rnb-thursdays.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
   const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
   if(await keep.isVisible()){await keep.click();await page.waitForTimeout(1000);}
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   await page.locator('#artboard').waitFor({timeout:120000});
   if(await page.locator('input[type=file][accept*=json]').count()===0)await project.click();
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
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('R&B'));
     assert.equal(await page.locator('[data-coco-compiled-object="thursdays"]').count(),1);
     assert.doesNotMatch(await page.locator('#artboard').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
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
       return board?.textContent.includes('R&B') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}-preview.png`});
     assert.equal(await page.locator('[data-coco-compiled-object="entry"] [data-node="priceLabel"]').count(),0,'No duplicate price caption');
     assert.equal(await page.locator('[data-coco-compiled-object="entryLabel"] [data-coco-compiled-visible-run], [data-coco-compiled-object="entryLabel"] [data-coco-compiled-auto-wrap]').first().textContent(),'FOR LADIES ONLY');
     assert.equal(await page.locator('[data-coco-glass-headline]').count(),1);
     assert.equal(await page.locator('[data-coco-glass-layer]').count(),4);
     assert.equal(await page.locator('[data-coco-compiled-object="headline"] [data-coco-compiled-gold-text-mask]').count(),0);
     console.log('PREVIEW',id,format);
     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ['headline']){
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
       const input=page.getByPlaceholder('ENTER HEADLINE...', {exact:true});
       await input.fill('SOUL');
       await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-coco-glass-layer]')).length===4&&Array.from(document.querySelectorAll('[data-coco-glass-layer]')).every(el=>el.textContent==='SOUL'));
       await input.fill('R&B');
       await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-coco-glass-layer]')).every(el=>el.textContent==='R&B'));
       console.log('EDITED',format,'all four glass layers');
       if(process.env.NF_GLASS_CONTROLS){
         const panel=page.locator('#headline-panel');
         const size=panel.getByRole('slider',{name:'Size',exact:true});
         const face=page.locator('[data-coco-glass-layer="face"]');
         const originalSize=await face.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
         for(const value of [120,240]){
           await size.fill(String(value));await page.waitForTimeout(700);
           const measured=await page.locator('[data-coco-glass-layer="depth"]').evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),stroke:parseFloat(getComputedStyle(el).webkitTextStrokeWidth)}));
           assert.ok(Math.abs(measured.font-value)<1,JSON.stringify(measured));
           assert.ok(Math.abs(measured.stroke-7*value/330)<.02,JSON.stringify(measured));
         }
         const sizeNumber=size.locator('..').getByRole('textbox');await sizeNumber.fill(String(originalSize));await sizeNumber.press('Tab');await page.waitForTimeout(500);
         for(const [label,hex] of [['Grad A','#00ffff'],['Grad B','#ff00ff']]){
           const color=panel.getByText(label,{exact:true}).locator('..').getByRole('textbox',{name:'Pick color',exact:true});
           await color.fill(hex);await color.press('Tab');await page.waitForTimeout(500);
         }
         await page.waitForFunction(()=>{const fill=document.querySelector('[data-coco-glass-layer="face"]');return getComputedStyle(fill).backgroundImage.includes('rgb(0, 255, 255)')&&getComputedStyle(fill).backgroundImage.includes('rgb(255, 0, 255)')});
         const fill=panel.getByText('Fill',{exact:true}).locator('..').getByRole('textbox',{name:'Pick color',exact:true});
         await fill.fill('#ff2255');await fill.press('Tab');
         await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-coco-glass-layer="face"]')).webkitTextFillColor==='rgb(255, 34, 85)');
         assert.equal(await face.evaluate(el=>getComputedStyle(el).backgroundImage),'none');
         console.log('CONTROLS',format,'120/240 size, proportional bevel, gradient endpoints, solid fill');
       }


     }

   }
 }
 const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
 if(!(await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible()))await projectButton.click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Save Project File',exact:true}).click()]);
 await download.saveAs('/tmp/rnb-glass-roundtrip.nflyer');
 const saved=JSON.parse(await readFile('/tmp/rnb-glass-roundtrip.nflyer','utf8'));
 for(const format of ['square','story'])assert.equal(saved.state.session[format].cocoCompositionSystem.compiledDocument.objects.find(o=>o.id==='headline').paint.textEffect,'cyan-glass-v1');
 await page.locator('input[type=file][accept*=json]').setInputFiles('/tmp/rnb-glass-roundtrip.nflyer');
 await page.waitForTimeout(2000);
 assert.equal(await page.locator('[data-coco-glass-layer]').count(),4);
 console.log('ROUNDTRIP saved and reimported glass effect');
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
