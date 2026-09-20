import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1200}});
await page.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('#artboard').waitFor({timeout:120000});
 await page.waitForTimeout(12000);
 await page.getByRole('button',{name:'▸ Project',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/elite-monday-updated.nflyer');
 const address=page.locator('[data-coco-compiled-object="address"]');
 await address.waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 const sizes={};
 for(const format of ['square','story']){
  await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
  await page.waitForTimeout(5000);
  const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await dismiss.isVisible())await dismiss.click();
  // Open the panel without selecting the address, exercising its native controls.
  const venuePanel=page.getByRole('button',{name:'▸ Venue',exact:true});
  if(await venuePanel.getAttribute('aria-expanded')!=='true')await venuePanel.click();
  const nativeSize=page.getByRole('slider',{name:'Address Size',exact:true});
  const nativeBefore=await address.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  await nativeSize.focus();await nativeSize.press('ArrowRight');
  await page.waitForFunction(before=>parseFloat(getComputedStyle(document.querySelector('[data-coco-compiled-object="address"]')).fontSize)>before,nativeBefore,{timeout:4000});
  console.log('PASS',format,'address size from Venue panel header');
  await address.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  const glyph=address.locator('[data-text-hit-surface="true"]').first();
  const rect=await glyph.boundingBox();assert.ok(rect);
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+5,rect.y+rect.height/2+2,{steps:3});await page.mouse.up();
  await page.waitForTimeout(600);
  assert.equal(await address.getAttribute('data-active'),'true');
  const slider=page.getByRole('slider',{name:'Address Size',exact:true});
  const before=await address.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  await slider.focus();await slider.press('ArrowRight');
  await page.waitForFunction(before=>parseFloat(getComputedStyle(document.querySelector('[data-coco-compiled-object="address"]')).fontSize)>before,before,{timeout:4000});
  const after=await address.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  await slider.scrollIntoViewIfNeeded();
  const box=await slider.boundingBox();assert.ok(box);assert.ok(box.y>=0 && box.y+box.height<=1200,JSON.stringify(box));
  await page.mouse.move(box.x+box.width*.35,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height/2,{steps:6});
  await page.waitForFunction(after=>parseFloat(getComputedStyle(document.querySelector('[data-coco-compiled-object="address"]')).fontSize)!==after,after,{timeout:4000});
  sizes[format]=await address.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  await page.mouse.up();
  console.log('PASS',format,'address changes after drag and while slider pointer is still held',before,after,sizes[format]);
 }
 for(const format of ['square','story']){
  await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();await page.waitForTimeout(2500);
  assert.equal(await address.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)),sizes[format]);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS format switching preserves each address size; no page errors');
}catch(e){console.log((await page.locator('body').ariaSnapshot()).slice(-11000));throw e;}finally{await browser.close();}
