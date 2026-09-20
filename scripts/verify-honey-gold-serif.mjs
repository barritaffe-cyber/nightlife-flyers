import {mockLocalFullStudio} from './lib/local-full-studio-fixture.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const glyphFamily='Honey Gold Serif PNG';
const sampleText = 'Honey\nGold';
const out = process.env.NF_OUTPUT_DIR || '/tmp/honey-gold-serif-check';
await mkdir(out,{recursive:true});
const baseUrl=process.env.NF_BASE_URL || 'http://localhost:3000';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');localStorage.setItem('nightlife-flyers:coco-dismissed:v2','1');});
await mockLocalFullStudio(context);
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
await page.route('**/api/auth/starter-render',route=>route.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto(`${baseUrl}/generated-flyers/honey-gold-serif-font-preview.html`);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:out+'/specimen.png',fullPage:true});
 await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`,{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('heading',{name:'Where do you want to start?',exact:true}).waitFor({timeout:120000});
 for(const [id,file] of [['glyph-check',process.env.NF_PROJECT || 'honey-nights.nflyer']]){
   await page.locator('.nf-startup-shell input[type=file]').setInputFiles(`public/generated-flyers/${file}`);
   await page.locator('.nf-startup-shell').waitFor({state:'hidden',timeout:120000});
   await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   const more=page.getByRole('button',{name:'More tools',exact:true}).first();if(await more.isVisible())await more.click();
   const project=page.getByRole('button',{name:'▸ Project',exact:true});
   console.log('IMPORTED');
   assert.equal(await page.getByRole('button',{name:'Create Cinematic Text',exact:true}).count(),0);
   for(const format of ['square','story']) {
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
     await page.waitForFunction(format=>{const b=document.querySelector('#artboard')?.getBoundingClientRect();return b&&(format==='square'?Math.abs(b.width/b.height-1)<.01:b.height/b.width>1.7)},format);
     await page.waitForTimeout(2500);
   for(const [objectId,panel,placeholder] of [['headline','headline','ENTER HEADLINE...'],['subtitle','head2','Optional sub-headline']]){
     const owner=page.locator('[data-coco-compiled-object="'+objectId+'"]');
     await owner.evaluate(el=>el.click());await page.waitForTimeout(500);
     const picker=page.locator('#'+panel+'-panel [data-png-glyph-picker]');
     await picker.locator('summary').click();
     await picker.getByRole('button',{name:`Use ${glyphFamily} lettering`}).click();
     const input=page.getByPlaceholder(placeholder,{exact:true});
     await input.fill(sampleText);await page.waitForTimeout(1800);
     await page.evaluate(()=>document.fonts.ready);
     const renderedFamily=await owner.evaluate(el=>getComputedStyle(el).fontFamily);
     if(!renderedFamily.includes(glyphFamily)){
       console.log('FONT DIAGNOSTIC',await owner.evaluate(el=>({html:el.outerHTML.slice(0,2500),children:Array.from(el.querySelectorAll('[data-coco-compiled-text-line]')).map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily}))})),await picker.getByRole('button',{name:`Use ${glyphFamily} lettering`}).getAttribute('aria-pressed'));
       await page.screenshot({path:out+'/font-failure.png',fullPage:true});
     }
     assert.match(renderedFamily,new RegExp(glyphFamily));
     assert.equal(await input.inputValue(),sampleText);
     assert.equal(await owner.locator('[data-coco-compiled-text-line]').count(),2);
     assert.equal(await owner.locator('[data-coco-compiled-text-line]').first().evaluate(el=>getComputedStyle(el).webkitTextFillColor),'rgb(255, 255, 255)');
     const controls=page.locator('#'+panel+'-panel');
     const glyphs=owner.locator('[data-png-glyph-run] [data-headline-shadow-glyph]');
     assert.equal(await glyphs.count(),sampleText.replace(/\n/g,'').length,'each visible letter has an independent paint');
     const shadow=controls.getByRole('button',{name:'Shadow',exact:true});
     if(await shadow.getAttribute('aria-pressed')!=='true')await shadow.click();
     const strength=controls.locator('label, span').filter({hasText:/^Shadow$/}).locator('..').locator('input[type=text]').first();
     if(await strength.count()){await strength.fill('1');await strength.press('Enter');}
     await page.waitForTimeout(2000);
     const shadowPaint=await glyphs.first().evaluate(el=>({filter:getComputedStyle(el).filter,shadow:getComputedStyle(el).textShadow}));
     console.log('SHADOW',panel,shadowPaint);
     await page.screenshot({path:out+'/'+format+'-'+panel+'-shadow.png',fullPage:true});
     assert.ok(shadowPaint.filter!=='none'||shadowPaint.shadow!=='none',panel+' shadow is on the glyph: '+JSON.stringify(shadowPaint));
     const line=owner.locator('[data-coco-compiled-text-line]').first();
     const before=await line.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width}));
     for(const [label,value] of [['Leading','1.2'],['Spacing','0.08'],['Size',panel==='head2'?'32':'90']]){
       const field=controls.locator('label').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('input[type=text]').first();
       await field.fill(value);await field.press('Enter');await page.waitForTimeout(400);
     }
     const after=await line.evaluate(el=>({height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width}));
     assert.notEqual(after.height,before.height,'leading/size updates line geometry');
     assert.notEqual(after.width,before.width,'spacing/size updates glyph advances');
     await page.screenshot({path:out+'/'+format+'-'+panel+'.png',fullPage:true});
   }
     // End the control stress test with a readable mixed-case/digit specimen.
     for(const [id,panel,placeholder,text,size] of [
       ['headline','headline','ENTER HEADLINE...','Rose Code','48'],
       ['subtitle','head2','Optional sub-headline','Party Nights\n0123456789','20']
     ]) {
       await page.locator('[data-coco-compiled-object="'+id+'"]').evaluate(el=>el.click());
       await page.getByPlaceholder(placeholder,{exact:true}).fill(text);
       const field=page.locator('#'+panel+'-panel label').filter({hasText:/^Size$/}).locator('..').locator('input[type=text]').first();
       await field.fill(size);await field.press('Enter');
       await page.waitForTimeout(1200);
     }
     const captureStyle=await page.addStyleTag({content:'#artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *{visibility:hidden!important}'});
     await page.locator('#artboard').screenshot({path:out+'/editor-'+format+'.png'});
     await captureStyle.evaluate(el=>el.remove());
   }
   const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
   if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();
   const dl=await pending;await dl.saveAs(out+'/saved.nflyer');
   await page.locator('input[type=file][accept*=json]').setInputFiles(out+'/saved.nflyer');await page.waitForTimeout(6500);
   for(const id of ['headline','subtitle'])assert.match(await page.locator('[data-coco-compiled-object="'+id+'"]').evaluate(el=>getComputedStyle(el).fontFamily),new RegExp(glyphFamily));
   await page.getByRole('button',{name:'Master Grade',exact:true}).click();
   for(const format of ['square','story']) {
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
     await page.waitForTimeout(2500);
     for(const id of ['headline','subtitle'])assert.match(await page.locator('[data-coco-compiled-object="'+id+'"]').evaluate(el=>getComputedStyle(el).fontFamily),new RegExp(glyphFamily));
     const notice=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await notice.isVisible())await notice.click();
     await page.getByRole('button',{name:'PNG',exact:true}).click();
     await page.getByRole('button',{name:'Export',exact:true}).click();
     const preview=page.getByAltText('Export preview',{exact:true});await preview.waitFor({timeout:180000});
     const artifact=await preview.evaluate(async img=>{await img.decode();const blob=await(await fetch(img.src)).blob();return {width:img.naturalWidth,height:img.naturalHeight,type:blob.type,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))}});
     assert.equal(artifact.type,'image/png');assert.equal(artifact.height/artifact.width,format==='square'?1:1920/1080);
     await writeFile(`${out}/export-${format}.png`,Buffer.from(artifact.bytes));
     await page.getByRole('button',{name:'Close export',exact:true}).click();
     console.log('EXPORTED',format,artifact.width,artifact.height);
   }
   assert.equal(errors.length,0,JSON.stringify(errors));console.log('HONEY GOLD: BOTH PICKERS, FORMATS, EDITING, ROUNDTRIP, AND PNG EXPORT PASSED');
 }
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(0,12000));throw error;}finally{await browser.close()}
