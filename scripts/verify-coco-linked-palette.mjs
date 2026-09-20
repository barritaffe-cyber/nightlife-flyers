import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const recipe=process.env.NF_RECIPE||'afro-sunset', mobile=process.env.NF_DEVICE==='mobile';
const out=`/tmp/coco-linked-${recipe}${mobile?'-mobile':''}${process.env.NF_CANVAS==='1'?'-canvas':''}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
const metrics=async locator=>{const result=await locator.evaluate(async img=>{await img.decode();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const s=getComputedStyle(img);return{src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,width:parseFloat(s.width),height:parseFloat(s.height),transform:s.transform,filter:s.filter};});return {...result,src:createHash('sha256').update(result.src).digest('hex')};};
try{
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
 await page.getByLabel('Event name',{exact:true}).fill('Ladies Night');await page.getByRole('button',{name:'Tropical',exact:true}).click();
 await page.getByTestId('coco-build-event-next').click();const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
 const design=chooser.locator(`[data-coco-direction-id="${recipe}"]`);
 for(let i=0;i<12&&!await design.count();i++){await chooser.getByTestId('coco-more-directions').click({timeout:120000});await page.getByText('Preparing more designs…',{exact:true}).waitFor({state:'hidden',timeout:120000});}
 await design.getByRole('button',{name:'Choose this design',exact:true}).click();
 const form=page.getByTestId('coco-build-details');await form.waitFor();
 for(let step=0;step<40;step++){
  const date=form.getByTestId('coco-build-brief-date');if(await date.count())await date.fill('Nov 7 2026');
  if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
  await form.getByTestId('coco-question-next').click();
 }
 const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});

 const startFormat=recipe==='brunch-saturday'?'story':'square';
 await coco.getByTestId(`coco-conversation-format-${startFormat}`).click();
 const preview=coco.locator('[data-coco-personalized-preview]');
 const ready=async()=>{await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});await preview.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
 const layers=async root=>{const values=await root.locator('[data-coco-compiled-object]').evaluateAll(els=>Object.fromEntries(els.map(el=>[el.dataset.cocoCompiledObject,{role:el.dataset.cocoPaletteRole,filter:getComputedStyle(el).filter,color:el.style.fontFamily?getComputedStyle(el).color:undefined,src:el.querySelector('img[data-hit-source]')?.getAttribute('src')}])));return Object.fromEntries(Object.entries(values).map(([id,v])=>[id,{...v,src:v.src?createHash('sha256').update(v.src).digest('hex'):undefined}]));};
 const bg=()=>startFormat==='story'&&recipe==='brunch-saturday'?preview.locator('[data-coco-preview-background="native"] img'):preview.locator('[data-coco-compiled-object="background"] img');
 await ready();const original=await layers(preview),originalBg=await bg().getAttribute('src');
 assert.ok(Object.values(original).every(v=>v.role));
 await preview.screenshot({path:`${out}/original.png`});
 await coco.getByRole('button',{name:'Color palette',exact:true}).click();
 await coco.getByTestId('coco-conversation-palette-rose').click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="coco-conversation-palette-rose"]')?.getAttribute('aria-pressed')==='true',{},{timeout:120000});await ready();
 const changed=await layers(preview),changedBg=await bg().getAttribute('src');
 assert.notEqual(changedBg,originalBg,'palette remaps main image colors');
 assert.equal(await preview.locator('[data-coco-background-foil]').count(),0,'no wash layer');
 for(const [id,layer] of Object.entries(changed))assert.equal(layer.role,original[id].role,'all object bindings remain stable');
 const textId=recipe==='afro-sunset'?'headline':'month';assert.notEqual(changed[textId].color,original[textId].color);
 await preview.screenshot({path:`${out}/rose.png`});
 const strength=coco.getByRole('slider',{name:'Image color strength',exact:true});
 assert.equal(await strength.inputValue(),'30');
 await strength.press('Home');
 await page.waitForFunction(()=>!document.querySelector('[aria-label="Image color strength"]')?.disabled,{},{timeout:120000});await ready();
 await page.waitForFunction(({selector,src})=>document.querySelector(selector)?.getAttribute('src')===src,{selector:startFormat==='story'&&recipe==='brunch-saturday'?'[data-coco-preview-background="native"] img':'[data-coco-personalized-preview] [data-coco-compiled-object="background"] img',src:originalBg},{timeout:120000});
 assert.equal(await bg().getAttribute('src'),originalBg,'zero strength restores original image pixels');
 await strength.press('PageUp');await page.waitForFunction(()=>!document.querySelector('[aria-label="Image color strength"]')?.disabled);await ready();
 await coco.getByLabel('Image color blend',{exact:true}).selectOption('soft-light');
 await page.waitForFunction(()=>!document.querySelector('[aria-label="Image color blend"]')?.disabled,{},{timeout:120000});await ready();
 assert.notEqual(await bg().getAttribute('src'),originalBg);
 await coco.getByRole('button',{name:'Original colors',exact:true}).click();await ready();
 assert.equal(await bg().getAttribute('src'),originalBg);assert.deepEqual(await layers(preview),original,'Original restores all object colors');
 await coco.getByLabel('Apply adjustments to',{exact:true}).selectOption('both');
 await coco.getByTestId('coco-conversation-palette-ice').click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="coco-conversation-palette-ice"]')?.getAttribute('aria-pressed')==='true',{},{timeout:120000});await ready();
 const expected=await layers(preview),expectedBg=await bg().getAttribute('src');
 await coco.getByTestId(`coco-conversation-format-${startFormat==='square'?'story':'square'}`).click();await ready();
 assert.equal(await coco.getByTestId('coco-conversation-palette-ice').getAttribute('aria-pressed'),'true');
 await coco.getByTestId(`coco-conversation-format-${startFormat}`).click();await ready();
 await page.screenshot({path:`${out}/controls.png`});
 await coco.getByRole('button',{name:'Done',exact:true}).click();await coco.getByTestId('coco-conversation-open-editor').click();
 await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 assert.deepEqual(await layers(page.locator('#export-root')),expected,'preview/editor object palette parity');
 if(startFormat==='story'&&recipe==='brunch-saturday')assert.equal(await page.locator('#export-root [data-export-layer="background"] img').getAttribute('src'),expectedBg);
 assert.equal(await page.locator('#export-root [data-coco-background-foil]').count(),0);
 await page.screenshot({path:`${out}/editor.png`});
 if(process.env.NF_CANVAS==='1') {
  await page.getByTestId('coco-canvas-tools').getByRole('button',{name:'More tools',exact:true}).click();
  const panel=page.locator('#background-panel');
  await panel.getByText('Scene Builder',{exact:true}).click();
  const canvasBackground=page.locator('#export-root [data-coco-compiled-object="background"] img');
  const previous=await canvasBackground.getAttribute('src');
  await panel.getByRole('button',{name:'Warm Luxury',exact:true}).click();
  await page.waitForFunction(src=>document.querySelector('#export-root [data-coco-compiled-object="background"] img')?.getAttribute('src')!==src,previous,{timeout:120000});
  assert.notEqual((await layers(page.locator('#export-root'))).headline.color,expected.headline.color);
  await panel.getByLabel('Image color blend',{exact:true}).selectOption('soft-light');
  await page.waitForFunction(()=>!document.querySelector('#background-panel [aria-label="Image color blend"]')?.disabled,{},{timeout:120000});
  await panel.getByRole('button',{name:'Reset colors to original template colors',exact:true}).click();
  await page.waitForFunction(src=>document.querySelector('#export-root [data-coco-compiled-object="background"] img')?.getAttribute('src')===src,originalBg,{timeout:120000});
  console.log('PASS existing canvas palette choices, material controls and Reset colors');
 }
 await page.getByTestId('coco-back-details').click();
 console.log('PASS automatic selective palette, all object bindings, zero strength, Soft Light, Original, both formats and editor parity');
 if(process.env.NF_SKIP_EXPORT!=='1'){
 await coco.getByRole('button',{name:'Looks good →',exact:true}).click();await coco.getByTestId('coco-conversation-ready').click();
 await coco.getByTestId('coco-conversation-export').click();const check=page.getByTestId('coco-finish-review');if(await check.isVisible()){while(await check.getByRole('button',{name:'Keep as is',exact:true}).count())await check.getByRole('button',{name:'Keep as is',exact:true}).first().click();await check.getByRole('button',{name:'Download Square + Story',exact:true}).click();}
 for(const f of ['Square','Story']){await page.getByAltText(`${f} export preview`,{exact:true}).waitFor({timeout:180000});const download=page.waitForEvent('download');await page.getByRole('button',{name:`Save ${f}`,exact:true}).click();await(await download).saveAs(`${out}/export-${f}.png`);}
 console.log('PASS both exports');}
 assert.deepEqual(errors,[]);console.log('PASS zero page errors');
}catch(error){await page.screenshot({path:`${out}/failure.png`});console.error(error);console.log(errors);process.exitCode=1;}finally{await browser.close();}
