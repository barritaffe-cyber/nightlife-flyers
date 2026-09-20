import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const glyphFamily=process.env.NF_GLYPH_FAMILY || 'Block Gold PNG';
const sampleText = glyphFamily === 'Distressed Ink PNG' ? 'Fresh\nNights' : ['Calligraphy Gold PNG','Whimsical Gold PNG','Rose Fur PNG','Distressed Ink PNG','Circuit Lines PNG','Liquid Chrome PNG'].includes(glyphFamily) ? 'Party\nNights' : 'GAME\nNIGHT';
const out = process.env.NF_OUTPUT_DIR || '/tmp/png-glyph-check';
const sourceProject=JSON.parse(await readFile('public/generated-flyers/day-party.nflyer','utf8'));
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
 const starterCard=page.locator('.nf-startup-shell button').filter({has:page.locator('img')}).first();
 if(await starterCard.isVisible()){
   await starterCard.click({force:true});await page.waitForTimeout(2000);
 }

 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['glyph-check',process.env.NF_PROJECT || 'day-party.nflyer']]){
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

   // The startup chooser can arrive after an import on a cold server.
   const lateChooser=page.getByRole('button',{name:'Choose Square format',exact:true});
   if(await lateChooser.isVisible()){
     await lateChooser.click();await page.waitForTimeout(2000);
     const keepLayout=page.getByRole('button',{name:'Keep this layout',exact:true});
     if(await keepLayout.isVisible())await keepLayout.click();
     await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   }
   assert.equal(await page.getByRole('button',{name:'Create Cinematic Text',exact:true}).count(),0);
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
     await page.screenshot({path:out+'/'+panel+'-shadow.png',fullPage:true});
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
     await page.screenshot({path:out+'/'+panel+'.png',fullPage:true});
   }
   const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
   if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();
   const dl=await pending;await dl.saveAs(out+'/saved.nflyer');
   await page.locator('input[type=file][accept*=json]').setInputFiles(out+'/saved.nflyer');await page.waitForTimeout(6500);
   for(const id of ['headline','subtitle'])assert.match(await page.locator('[data-coco-compiled-object="'+id+'"]').evaluate(el=>getComputedStyle(el).fontFamily),new RegExp(glyphFamily));
   assert.equal(errors.length,0,JSON.stringify(errors));console.log('PNG GLYPH EDITING AND ROUNDTRIP PASSED');
 }
}finally{await browser.close()}
