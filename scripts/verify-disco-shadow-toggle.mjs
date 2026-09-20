import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'public/generated-flyers';
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
 for(const [id,file] of [['disco','disco.nflyer']]){
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
   await page.locator('input[type=file][accept*=json]').setInputFiles(process.env.NF_PROJECT_FILE || `public/generated-flyers/${file}`);
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   console.log('IMPORTED');
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForTimeout(1000);

   async function selectFormat(format){await page.getByRole('button',{name:format,exact:true}).click();await page.waitForTimeout(1200);await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});}
   async function shadow(panel){const section=page.getByRole('button',{name:'▸ '+panel,exact:true});if(await section.getAttribute('aria-expanded')!=='true')await section.click();return page.locator(panel==='Headline'?'#headline-panel':'#head2-panel').getByRole('button',{name:'Shadow',exact:true});}
   for(const panel of ['Headline','Sub Headline']){
     for(const format of ['Square','Story']){await selectFormat(format);const toggle=await shadow(panel);if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();await page.waitForTimeout(700);console.log('AFTER ENABLE',panel,format,await toggle.getAttribute('aria-pressed'));assert.equal(await toggle.getAttribute('aria-pressed'),'true');}
     for(const format of ['Square','Story','Square']){await selectFormat(format);assert.equal(await (await shadow(panel)).getAttribute('aria-pressed'),'true',panel+' '+format+' retains on');console.log('SHADOW ON RETAINED',panel,format);}
     await (await shadow(panel)).click();
     await selectFormat('Story');assert.equal(await (await shadow(panel)).getAttribute('aria-pressed'),'true');
     await selectFormat('Square');assert.equal(await (await shadow(panel)).getAttribute('aria-pressed'),'false',panel+' Square retains explicit off');
     console.log('INDEPENDENT OFF RETAINED',panel);
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
