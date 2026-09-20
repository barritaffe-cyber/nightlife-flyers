import {chromium} from 'playwright';
import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
const mobile=process.env.NF_DEVICE==='mobile';const out=process.env.NF_OUTPUT_DIR || (mobile?'/tmp/coco-quick-sizes-mobile':'/tmp/coco-quick-sizes');mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
await c.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
try{
await p.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});await p.getByLabel('Event name',{exact:true}).fill('Slow Jamz');await p.getByRole('button',{name:'R&B / Lounge',exact:true}).click();await p.getByTestId('coco-build-event-next').click();const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});await chooser.locator('[data-coco-direction-id="slow-jamz"]').getByRole('button',{name:'Choose this direction',exact:true}).click({timeout:120000});
const form=p.getByTestId('coco-build-details');await form.waitFor();for(const d of await form.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
for(const [field,value]of [['venueName','VELVET ROOM'],['address','MIAMI, FL'],['date','Nov 7 2026'],['socials','@slow_jamz']])await form.getByTestId(`coco-build-brief-${field}`).fill(value);
const platforms=form.getByTestId('coco-build-brief-socialPlatforms');for(const platform of ['instagram','tiktok','x','whatsapp'])await platforms.getByRole('button',{name:platform,exact:true}).click();
await form.getByTestId('coco-build-finish').click();await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});
const quick=p.getByTestId('coco-quick-edit');
for(const d of await quick.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
const saved={};
for(const format of ['square','story']){
 await p.getByTestId(`coco-quick-format-${format}`).click();await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 saved[format]={};
 for(const [field,id,value] of [['eventName','headline',format==='square'?90:80],['address','address',format==='square'?8:7],['socials','handle',format==='square'?8:7]]){
  const control=quick.locator(`[data-coco-quick-size-field="${field}"] [data-coco-quick-size-object="${id}"]`);
  const input=control.locator('input[type=text]');await input.fill(String(value));await input.press('Enter');
  await p.waitForFunction(({id,value})=>parseFloat(getComputedStyle(document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)).fontSize)===value,{id,value});
  // Keyboard interaction exercises the slider independently of number entry.
  const slider=control.getByRole('slider');await slider.focus();await slider.press('ArrowRight');
  await p.waitForFunction(({id,value})=>parseFloat(getComputedStyle(document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)).fontSize)===value+.5,{id,value});
  saved[format][id]=value+.5;
 }
 await quick.getByTestId('coco-quick-brief-address').fill('MIAMI FL 3305');
 await p.waitForFunction(()=>document.querySelector('#artboard [data-coco-compiled-object="address"]')?.getAttribute('data-coco-text-value')==='MIAMI FL 3305');
 assert.equal(await quick.locator('[data-coco-quick-size-object="address"] input[type=text]').inputValue(),String(saved[format].address));
 await quick.locator('[data-coco-quick-size-field="address"]').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/quick-${format}.png`});
 assert.ok(await quick.isVisible());assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
 console.log(format,'quick text sizes pass');
}
for(const format of ['square','story']){await p.getByTestId(`coco-quick-format-${format}`).click();await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});for(const [id,size]of Object.entries(saved[format]))assert.equal(await p.locator(`#artboard [data-coco-compiled-object="${id}"]`).evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),size);}
assert.deepEqual(errors,[]);console.log('PASS quick sizes, format isolation, wording edits; zero errors');
}catch(e){await p.screenshot({path:`${out}/failure.png`});console.error(e);console.log(errors);process.exitCode=1;}finally{await b.close();}
