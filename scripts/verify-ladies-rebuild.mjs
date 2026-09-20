import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || '/tmp/ladies-rebuild-check';
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
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['ladies-css-editorial','ladies-css-coco.nflyer']]){
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
   await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   console.log('IMPORTED');
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(1000);


   for(const format of ['square','story']){
     if(format==='story'){await page.getByRole('button',{name:'Story',exact:true}).first().click();await page.waitForTimeout(3500);}
     await page.evaluate(()=>document.fonts.ready);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.waitForTimeout(1200);
     await page.locator('#artboard').screenshot({path:out+'/'+format+'.png'});
     for(const [id,family] of [['headline','Avigea'],['subtitle','OpenScript']]){
       const owner=page.locator('[data-coco-compiled-object="'+id+'"]');
       assert.match(await owner.evaluate(el=>getComputedStyle(el).fontFamily),new RegExp(family));
     }
     console.log('FORMAT VERIFIED',format);
   }
   await page.getByRole('button',{name:'Square',exact:true}).first().click();await page.waitForTimeout(2500);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.locator('[data-coco-compiled-object="headline"]').evaluate(el=>el.click());
   for(const [id,original] of [['musicLabel','MUSIC POLICY:'],['hypeLabel','HYPE POLICY:'],['address','JAMESLINE HOTEL, AVIELE.']]){
     const owner=page.locator('[data-coco-compiled-object="'+id+'"]');
     await owner.evaluate(el=>el.click());await page.waitForTimeout(500);
     await page.waitForTimeout(1500);
     const found=await page.evaluate(({id,original})=>{
       const input=Array.from(document.querySelectorAll('textarea,input')).find(el=>el.value===original && el.getClientRects().length);
       if(input)input.dataset.ladiesCheck=id;
       return Boolean(input);
     },{id,original});
     const input=found?page.locator('[data-ladies-check="'+id+'"]'):null;
     assert.ok(input,id+' has an editable field');
     await input.fill('');await page.waitForTimeout(400);
     await input.fill('TEST '+original);await page.waitForTimeout(800);
     assert.match(await owner.innerText(),/TEST /);
     await input.fill(original);await page.waitForTimeout(500);
     console.log('FIELD VERIFIED',id);
   }
   await page.locator('[data-coco-compiled-object="headline"]').evaluate(el=>el.click());
   await page.getByPlaceholder('ENTER HEADLINE...',{exact:true}).fill('LADIES NIGHT');
   await page.waitForTimeout(1000);
   assert.match(await page.locator('[data-coco-compiled-object="headline"]').innerText(),/LADIES NIGHT/);
   const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
   if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();
   await (await pending).saveAs(out+'/saved.nflyer');
   await page.locator('input[type=file][accept*=json]').setInputFiles(out+'/saved.nflyer');await page.waitForTimeout(6500);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   assert.match(await page.locator('[data-coco-compiled-object="headline"]').innerText(),/LADIES NIGHT/);
   assert.equal(errors.length,0,JSON.stringify(errors));console.log('LADIES REBUILD ROUNDTRIP PASSED');
 }
}finally{await browser.close()}
