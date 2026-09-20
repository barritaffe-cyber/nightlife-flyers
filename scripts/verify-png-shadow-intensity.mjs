import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || (process.env.NF_ACCEPTED_PREVIEW ? 'public/generated-flyers' : '/tmp/png-shadow-intensity');
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
 for(const file of ['miami-street.nflyer']){
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
   const lateChoice=page.getByRole('button',{name:'Choose Square format',exact:true});if(await lateChoice.isVisible()){await lateChoice.click();const keep=page.getByRole('button',{name:'Keep this layout',exact:true});if(await keep.isVisible())await keep.click();await page.locator('input[type=file][accept*=json]').setInputFiles('public/generated-flyers/miami-street.nflyer');await page.waitForTimeout(2000);}
   const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await dismiss.isVisible())await dismiss.click();

   const savedOpacity={};
   for(const format of ['Square','Story']) {
     await page.getByRole('button',{name:format,exact:true}).click();
     await page.waitForFunction(format=>{const box=document.querySelector('#artboard')?.getBoundingClientRect();return box && (format==='Story'?box.height/box.width>1.7:Math.abs(box.height/box.width-1)<.05) && document.querySelector('[data-coco-compiled-object="headline"]');},format,{timeout:60000});
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     for(const [objectId,panel] of (process.env.NF_HEADLINE_ONLY ? [['headline','headline']] : [['headline','headline'],['subtitle','head2']])) {
       const owner=page.locator(`[data-coco-compiled-object="${objectId}"]`);
       await owner.evaluate(el=>el.click());await page.waitForTimeout(500);
       const controls=page.locator('#'+panel+'-panel');
       if (!process.env.NF_KEEP_FONT) {
         const picker=controls.locator('[data-png-glyph-picker]');
         if(await picker.getAttribute('open')===null)await picker.locator('summary').click();
         await picker.getByRole('button',{name:'Use Neon Green PNG lettering',exact:true}).click();
         await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
         assert.ok((await owner.evaluate(el=>getComputedStyle(el).fontFamily)).includes('Neon Green'));
       }
       if (process.env.NF_EXPECT_NO_WORD_FILTER) assert.equal(await owner.evaluate(el=>getComputedStyle(el).filter),'none','A replacement PNG font must not inherit the old whole-word lighting');
       const shadow=controls.getByRole('button',{name:'Shadow',exact:true});
       if(await shadow.getAttribute('aria-pressed')!=='true')await shadow.click();
       const strength=controls.locator('label, span').filter({hasText:/^Shadow$/}).locator('..').locator('input[type=text]').first();
       let initial,previousOpacity=0;
       for(const value of [0,1,4,8]) {
         await strength.fill(String(value));await strength.press('Enter');await page.waitForTimeout(500);
         const run=owner.locator('[data-png-glyph-run]').first();
         assert.equal(await run.evaluate(el=>getComputedStyle(el).filter),'none','Word wrapper is unfiltered');
         const filters=await run.locator('[data-headline-shadow-glyph]').evaluateAll(nodes=>nodes.filter(el=>el.textContent.trim()).map(el=>getComputedStyle(el).filter));
         assert.ok(filters.length>1 && filters.every(f=>value===0?f==='none':f.includes('url(')),'Each letter owns its shadow');
         if(value) {
           const definition=owner.locator('[data-png-shadow-filter]').first();
           const state=await definition.evaluate(el=>({dx:el.querySelector('feOffset').getAttribute('dx'),dy:el.querySelector('feOffset').getAttribute('dy'),blur:el.querySelector('feGaussianBlur').getAttribute('stdDeviation'),opacity:Number(el.querySelector('feFlood').getAttribute('flood-opacity'))}));
           const geometry={dx:state.dx,dy:state.dy,blur:state.blur};
           if(initial)assert.deepEqual(geometry,initial,'Intensity must never change distance or blur');else initial=geometry;
           assert.ok(state.opacity>previousOpacity && state.opacity<=.8,'Intensity increases opacity only');
           if(value===8)assert.ok(state.opacity-previousOpacity>.1,'Upper half of intensity range still visibly darkens the shadow');
           previousOpacity=state.opacity;
           if(value===(format==='Square'?4:8))savedOpacity[format]=state.opacity;
           const fontSize=await run.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
           assert.ok(Number(state.dy)<fontSize*.05 && Number(state.blur)>fontSize*.01,'Close soft shadow, not a detached duplicate');
           console.log(format,objectId,value,JSON.stringify(state));
         }
         if(objectId==='headline')await owner.screenshot({path:out+'/'+format.toLowerCase()+'-miami-shadow-'+value+'.png'});
       }
       // Exercise the actual range control as well as typed numeric edits.
       const slider=controls.locator('label, span').filter({hasText:/^Shadow$/}).locator('..').locator('input[type=range]').first();
       await slider.scrollIntoViewIfNeeded();
       const track=await slider.boundingBox();assert.ok(track,'Shadow slider is visible');
       await page.mouse.move(track.x+track.width*.25,track.y+track.height/2);
       await page.mouse.down();await page.waitForTimeout(300);
       const readGeometry=()=>owner.locator('[data-png-shadow-filter]').first().evaluate(el=>({
         dx:el.querySelector('feOffset').getAttribute('dx'),dy:el.querySelector('feOffset').getAttribute('dy'),blur:el.querySelector('feGaussianBlur').getAttribute('stdDeviation')
       }));
       assert.deepEqual(await readGeometry(),initial,'Pointer drag leaves shadow geometry fixed');
       const lowOpacity=Number(await owner.locator('[data-png-shadow-filter] feFlood').first().getAttribute('flood-opacity'));
       await page.mouse.move(track.x+track.width-1,track.y+track.height/2,{steps:8});
       await page.mouse.up();await page.waitForTimeout(500);
       assert.equal(Number(await slider.inputValue()),8,'Pointer drag reaches maximum intensity');
       assert.deepEqual(await readGeometry(),initial,'Maximum slider intensity leaves geometry fixed');
       assert.ok(Number(await owner.locator('[data-png-shadow-filter] feFlood').first().getAttribute('flood-opacity'))>lowOpacity,'Pointer drag darkens the shadow');
       console.log(format,objectId,'POINTER SLIDER PASSED');
       await strength.fill(String(format==='Square'?4:8));await strength.press('Enter');
     }
   }
 const save=page.getByRole('button',{name:'Save Project File',exact:true});
 if(!await save.isVisible())await page.getByRole('button',{name:'▸ Project',exact:true}).evaluate(el=>el.click());
 const pending=page.waitForEvent('download');await save.click();const download=await pending;const saved=out+'/intensity.nflyer';await download.saveAs(saved);
 const data=JSON.parse(await readFile(saved,'utf8'));
 for(const format of ['square','story'])for(const key of (process.env.NF_HEADLINE_ONLY ? ['headShadowStrength'] : ['headShadowStrength','head2ShadowStrength']))assert.equal(data.state.session[format][key],format==='square'?4:8);
 await page.locator('input[type=file][accept*=json]').setInputFiles(saved);await page.waitForTimeout(2000);
 for(const format of ['Square','Story']) {
  await page.getByRole('button',{name:format,exact:true}).click();
  await page.waitForFunction(({format,expected,ids})=>{
    const box=document.querySelector('#artboard')?.getBoundingClientRect();
    return box && (format==='Story'?box.height/box.width>1.7:Math.abs(box.height/box.width-1)<.05) && ids.every(id=>{const el=document.querySelector(`[data-coco-compiled-object="${id}"] [data-png-shadow-filter] feFlood`);return el && Math.abs(Number(el.getAttribute('flood-opacity'))-expected)<.001;});
  },{format,expected:savedOpacity[format],ids:process.env.NF_HEADLINE_ONLY ? ['headline'] : ['headline','subtitle']},{timeout:60000});
 }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('INTENSITY ONLY, PER LETTER, BOTH FORMATS AND ROUNDTRIP: PASSED');
} catch(error) {await page.screenshot({path:out+'/failure.png',fullPage:true});throw error;} finally {await browser.close();}
