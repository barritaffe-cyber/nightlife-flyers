import { materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const out = '/private/tmp/recipe-background-verification';
const chosenBackground='/generated-flyers/assets/grey%20assets-bg.png';
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
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(5000);
 await page.addStyleTag({content:'#artboard button { visibility: hidden !important; }'});
 for(const [id,file] of [['brunch-saturday','brunch-saturday-updated.nflyer'],['brunch-vibes','brunch-vibes-compiled-portrait-updated.nflyer']]){
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   if(await project.count())await project.click();
   const projectData=JSON.parse(await readFile(`public/generated-flyers/${file}`,'utf8'));
   for(const format of ['square','story'])projectData.state.session[format]=materializeCocoPortableRecipeVariant(id,projectData.state.session[format],{eventName:'BRUNCH',eventBrief:{},backgroundSrc:chosenBackground,backgroundSelectionExplicit:true});
   Object.assign(projectData.state,projectData.state.session[projectData.state.format || 'square']);
   await page.locator('input[type=file]').setInputFiles({name:`${id}.nflyer`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(projectData))});
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(4000);
   for(const format of ['square','story']){
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(2500);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     assert.equal(await page.getByText(/Preparing (?:story|square) canvas/).count(),0);
     const selector=id==='brunch-vibes'?'bg-image':'background';
     await page.waitForFunction(({selector,url})=>document.querySelector(`[data-coco-compiled-object="${selector}"] img`)?.getAttribute('src')===url,{selector,url:chosenBackground});
     assert.equal(await page.locator(`[data-coco-compiled-object="${selector}"] img`).getAttribute('src'),chosenBackground);
     await page.locator('#artboard').screenshot({path:`${out}/${id}-${format}.png`});
     console.log('PREVIEW',id,format);
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{await browser.close();}
