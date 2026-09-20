import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/private/tmp/brunch-saturday-verification';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.NF_VERIFY_URL||'http://localhost:3001/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 console.log(await page.locator('body').ariaSnapshot());
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(5000);
 await page.getByRole('button',{name:'▸ Project',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/brunch-saturday.nflyer');
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(4000);
 for(const format of ['square','story']){
  if(format==='story'){await page.getByRole('button',{name:'Story',exact:true}).click();await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:90000});await page.waitForTimeout(3000);}
  await page.waitForFunction(()=>document.querySelector('#artboard')?.innerText.includes('BRUNCH'),null,{timeout:90000});
  assert.match(await page.locator('#artboard').innerText(),/BRUNCH/);
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  await page.waitForTimeout(1000);
  await page.locator('#artboard').screenshot({path:`${out}/${format}.png`});
  const objects=await page.locator('[data-coco-compiled-object]').evaluateAll(nodes=>nodes.map(el=>({id:el.dataset.cocoCompiledObject,text:el.innerText,font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,children:[...el.querySelectorAll('span')].slice(0,2).map(n=>({font:getComputedStyle(n).fontFamily,size:getComputedStyle(n).fontSize})),rect:el.getBoundingClientRect().toJSON()})));
  await writeFile(`${out}/${format}.json`,JSON.stringify(objects,null,2));
  assert.equal(objects.find(o=>o.id==='presenter').font,'Arial');
  assert.equal(objects.find(o=>o.id==='band').font,'Arial');
  assert.match(objects.find(o=>o.id==='script').font,/Dear Script/);
 }
 await page.getByRole('button',{name:'Square',exact:true}).click();
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:90000});
 await page.waitForTimeout(3000);
 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 await page.getByRole('button',{name:'▸ Headline',exact:true}).click();
 console.log(await page.locator('body').ariaSnapshot());
 console.log('ERRORS',errors);
 assert.equal(errors.length,0);
}catch(error){console.log(await page.locator('body').ariaSnapshot());await page.screenshot({path:`${out}/failure.png`});throw error;}finally{await browser.close();}
