import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || '/tmp/nightlife-skew-regression';
await mkdir(out,{recursive:true});
const baseUrl=process.env.NF_BASE_URL || 'http://localhost:3000';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:Number(process.env.NF_DEVICE_SCALE||1)});
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
 for(const file of ['punta-cana.nflyer']){
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

   for (const format of ['square', 'story']) {
     await page.getByRole('button', { name: format === 'square' ? 'Square' : 'Story', exact: true }).click();
     await page.waitForTimeout(1500);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden', timeout:90000});
     await page.evaluate(() => document.fonts.ready);
     for (const [objectId, panelId, title] of [['headline', 'headline', 'Headline'], ['subtitle', 'head2', 'Sub Headline']]) {
       const node = page.locator(`[data-coco-compiled-object="${objectId}"]`);
       const panel = page.locator(`#${panelId}-panel`);
       const slider = panel.getByRole('slider', {name:'Skew', exact:true});
       if (!await slider.isVisible()) await page.getByRole('button', {name:'▸ '+title, exact:true}).click();
       const original = await node.evaluate(el => getComputedStyle(el).transform);
       for (const value of [-12, 12, 0]) {
         await slider.fill(String(value));
         await page.waitForTimeout(650);
         const result = await node.evaluate((el, original) => {
           const before = new DOMMatrix(original);
           const after = new DOMMatrix(getComputedStyle(el).transform);
           const relative = before.inverse().multiply(after);
           return {a:relative.a, b:relative.b, c:relative.c, d:relative.d};
         }, original);
         assert.ok(Math.abs(result.a-1)<.001 && Math.abs(result.d-1)<.001, 'Skew does not scale the glyphs');
         assert.ok(Math.abs(result.c)<.001, 'No added horizontal shear');
         if (value) assert.equal(Math.sign(result.b), Math.sign(value), 'Baseline rises/falls with skew direction');
         else assert.ok(Math.abs(result.b)<.001, 'Zero restores authored transform');
         assert.ok((await node.evaluate(el => el.style.transform)).includes(`skewY(${value}deg)`));
         if (value) await node.screenshot({path:`${out}/${format}-${objectId}-${value}.png`});
       }
       // Different values in each session verify independent format persistence.
       await slider.fill(String(format === 'square' ? -8 : 8));
       await page.waitForTimeout(500);
       console.log('VERTICAL SKEW PASS', format, objectId);
     }
   }
 }
 const save=page.getByRole('button',{name:'Save Project File',exact:true});
 if (!await save.isVisible()) await page.getByRole('button',{name:'▸ Project',exact:true}).evaluate(el=>el.click());
 const downloadPromise=page.waitForEvent('download');
 await save.click();
 const download=await downloadPromise;
 const savedPath=out+'/skew-roundtrip.nflyer';
 await download.saveAs(savedPath);
 await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
 await page.waitForTimeout(2000);
 for (const format of ['square','story']) {
   await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
   await page.waitForTimeout(1800);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForFunction((format) => {
     const box=document.querySelector('#artboard')?.getBoundingClientRect();
     return box && (format==='story' ? box.height/box.width>1.7 : Math.abs(box.height/box.width-1)<.05)
       && ['headline','subtitle'].every(id => document.querySelector(`[data-coco-compiled-object="${id}"]`)?.style.transform.includes(`skewY(${format==='square'?-8:8}deg)`));
   }, format, {timeout:30000});
   for (const id of ['headline','subtitle']) {
     const transform=await page.locator(`[data-coco-compiled-object="${id}"]`).evaluate(el=>el.style.transform);
     assert.ok(transform.includes(`skewY(${format==='square'?-8:8}deg)`), 'Saved vertical skew persists: '+format+' '+id);
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 console.log('VERTICAL SKEW AND ROUNDTRIP PASSED');
} catch(error) {
 await page.screenshot({path:out+'/failure.png',fullPage:true});
 throw error;
} finally { await browser.close(); }
