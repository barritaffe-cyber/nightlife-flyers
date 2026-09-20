import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/tmp/nightlife-subject-scale';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:900,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{const log=console.error;console.error=(...args)=>{if(String(args[0]).includes('Maximum update depth')){log('SCALE_ERROR_STACK',new Error().stack);}log(...args);};localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.stack)});
page.on('console',message=>{
 if(message.text().includes('SCALE_ERROR_STACK'))console.log(message.text());
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) {errors.push(message.text()); console.log('LOOP',message.text(),message.location());}
});
try{
 await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(60000);

 for(const [id,file] of [['reggae-jams','reggae-jams.nflyer']]){
   const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
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
     assert.equal(await page.locator('[data-coco-compiled-object="musicLabel"]').count(),1);
     assert.doesNotMatch(await page.locator('#artboard').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(800);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     const subject=page.locator('[data-portrait-id]').filter({has:page.locator('img')});

     const node=page.locator(`[data-portrait-id="coco_css_reggae-jams_${format}_subject"]`);
     const box=await node.boundingBox();
     await node.click({position:{x:box.width*.5,y:box.height*.5}});
     await page.waitForTimeout(1000);
     const scene=page.getByRole('button',{name:'▸ Scene Builder',exact:true});

     await page.waitForTimeout(1000);

     const scales=page.locator('[data-floating-controls="asset"] input[type=range]').nth(2);
     assert.equal(await scales.count(),1,'subject scale slider must exist');
     const originalBox=await node.boundingBox();
     for(let i=0;i<await scales.count();i++){
       if(!await scales.nth(i).isVisible())continue;
       for(const scale of ['1.2','1.8','2.5','4']){
         await scales.nth(i).fill(scale);
         await page.waitForTimeout(1500);
         const resized=await node.boundingBox();
         assert.ok(Math.abs(resized.width/originalBox.width-Number(scale))<.03,`subject must scale to ${scale}`);
         console.log('SCALED',format,scale);
       }
       await scales.nth(i).fill('1');
       const sliderBox=await scales.nth(i).boundingBox();
       await page.mouse.move(sliderBox.x+sliderBox.width*.18,sliderBox.y+sliderBox.height/2);
       await page.mouse.down();
       for(let step=0;step<60;step++){
         await page.mouse.move(sliderBox.x+sliderBox.width*(.18+.75*step/59),sliderBox.y+sliderBox.height/2);
         await page.waitForTimeout(35);
       }
       await page.mouse.up();await page.waitForTimeout(2000);
       const enlarged=await node.boundingBox();
       const canvas=await page.locator('#artboard').boundingBox();
       assert.ok(enlarged.width>canvas.width,'subject must extend off canvas');
       console.log('DRAGGED',format,enlarged);
       break;
     }

   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
