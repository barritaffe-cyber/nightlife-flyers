import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || (process.env.NF_ACCEPTED_PREVIEW ? 'public/generated-flyers' : '/tmp/electric-sunset-effects');
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
 if(await starterCard.isVisible()){await starterCard.click({force:true});await page.waitForTimeout(2000);}
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const file of ['electric-sunset.nflyer']){
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
   const lateChoice=page.getByRole('button',{name:'Choose Square format',exact:true});if(await lateChoice.isVisible()){await lateChoice.click();const keep=page.getByRole('button',{name:'Keep this layout',exact:true});if(await keep.isVisible())await keep.click();await page.locator('input[type=file][accept*=json]').setInputFiles('public/generated-flyers/electric-sunset.nflyer');await page.waitForTimeout(2000);}
   const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await dismiss.isVisible())await dismiss.click();

   for(const format of ['Square','Story']){
     await page.getByRole('button',{name:format,exact:true}).click();await page.waitForTimeout(1500);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     for(const [objectId,panel] of [['headline','headline'],['subtitle','head2']]){
       const owner=page.locator('[data-coco-compiled-object="'+objectId+'"]');
       await page.waitForTimeout(1000);
       await owner.scrollIntoViewIfNeeded().catch(async()=>{await page.waitForTimeout(1000);await owner.scrollIntoViewIfNeeded();});
       const hit=await owner.evaluate(el=>{for(const glyph of el.querySelectorAll('[data-text-hit-surface="true"]')){const b=glyph.getBoundingClientRect();for(let y=b.top+.4;y<b.bottom;y+=.7)for(let x=b.left+.4;x<b.right;x+=.7)if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return{x,y};}return null;});
       assert.ok(hit,format+' '+objectId+' reachable');await page.mouse.click(hit.x,hit.y);await page.waitForTimeout(400);
       if(await owner.getAttribute('data-active')!=='true'){
 const candidates=await owner.evaluate(el=>Array.from(el.querySelectorAll('[data-text-hit-surface="true"]')).slice(0,4).flatMap(g=>{const b=g.getBoundingClientRect();return [.3,.5,.7].flatMap(fy=>[.25,.5,.75].map(fx=>({x:b.x+b.width*fx,y:b.y+b.height*fy})));}));
 for(const point of candidates){await page.mouse.click(point.x,point.y);await page.waitForTimeout(180);if(await owner.getAttribute('data-active')==='true')break;}
}
assert.equal(await owner.getAttribute('data-active'),'true');
       const controls=page.locator('#'+panel+'-panel');
       if(!await controls.locator('label').filter({hasText:/^Size$/}).locator('..').locator('input[type=text]').first().isVisible())await page.getByRole('button',{name:objectId==='headline'?'▸ Headline':'▸ Sub Headline',exact:true}).click();
       for(const [label,increment,property] of [['Size',4,'fontSize'],['Spacing',.02,'letterSpacing'],['Leading',.12,'lineHeight']]){
         const field=controls.locator('label').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('input[type=text]').first();
         const original=await field.inputValue();
         const before=await owner.evaluate((el,property)=>getComputedStyle(el)[property],property);
         await field.fill(String(Number(original)+(label==='Leading' && Number(original)>=1.2 ? -increment : increment)));await field.press('Enter');await page.waitForTimeout(350);
         const after=await owner.evaluate((el,property)=>getComputedStyle(el)[property],property);
         assert.notEqual(after,before,format+' '+objectId+' '+label+' updates visible typography');
         await field.fill(original);await field.press('Enter');await page.waitForTimeout(250);
       }
       const shadow=controls.getByRole('button',{name:'Shadow',exact:true});
       if(await shadow.getAttribute('aria-pressed')==='true')await shadow.click();
       const paint=()=>owner.evaluate(el=>Array.from(el.querySelectorAll('span, [data-headline-shadow-glyph]')).map(n=>{const s=getComputedStyle(n);return s.filter+'|'+s.textShadow}).join(';'));
       await page.waitForTimeout(300);const off=await paint();await shadow.click();
       const strength=controls.locator('label, span').filter({hasText:/^Shadow$/}).locator('..').locator('input[type=text]').first();
       assert.ok(await strength.count(),panel+' shadow strength control exists');await strength.fill('1');await strength.press('Enter');
       await page.waitForTimeout(400);assert.notEqual(await paint(),off,format+' '+objectId+' live shadow changes paint');
       if(format==='Story')await shadow.click();
       if(objectId==='headline'){
         const dismissNotice=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await dismissNotice.isVisible())await dismissNotice.click();
         const before=Number(await owner.getAttribute('data-coco-layer-z'));
         await page.locator('[title="Bring selected text forward"]').click();await page.waitForTimeout(350);
         assert.ok(Number(await owner.getAttribute('data-coco-layer-z'))>before,'Forward changes layer order');
         await page.locator('[title="Send selected text backward"]').click();await page.waitForTimeout(350);
       }
       if(objectId==='subtitle'){const spacing=controls.locator('label').filter({hasText:/^Spacing$/}).locator('..').locator('input[type=text]').first();await spacing.fill(format==='Square'?'0.03':'0.06');await spacing.press('Enter');}
       console.log('CONTROLS PASSED',format,objectId);
     }
   }
 }
 const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
 if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();const download=await pending;const saved=out+'/effects.nflyer';await download.saveAs(saved);
 const data=JSON.parse(await readFile(saved,'utf8'));
 for(const format of ['square','story']){assert.equal(data.state.session[format].headShadow,format==='square');assert.equal(data.state.session[format].head2Shadow,format==='square');assert.equal(data.state.session[format].head2Fx.tracking,format==='square'?.03:.06);}
 await page.locator('input[type=file][accept*=json]').setInputFiles(saved);await page.waitForTimeout(2500);
 for(const format of ['Square','Story','Square']){
   await page.getByRole('button',{name:format,exact:true}).click();await page.waitForTimeout(1500);await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   for(const [id,panel] of [['headline','headline'],['subtitle','head2']]){
     await page.locator('[data-coco-compiled-object="'+id+'"]').evaluate(el=>el.click());await page.waitForTimeout(300);
     if(id==='subtitle'){const tracking=await page.locator('[data-coco-compiled-object="subtitle"]').evaluate(el=>parseFloat(getComputedStyle(el).letterSpacing)/parseFloat(getComputedStyle(el).fontSize));assert.ok(Math.abs(tracking-(format==='Square'?.03:.06))<.001,'Subtitle spacing persists independently');}
     assert.equal(await page.locator('#'+panel+'-panel').getByRole('button',{name:'Shadow',exact:true}).getAttribute('aria-pressed'),format==='Square'?'true':'false');
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('EFFECTS, TYPOGRAPHY, LAYERS AND FORMAT ROUNDTRIP PASSED');
}catch(error){console.log((await page.locator('body').ariaSnapshot()).slice(-9000));throw error;}finally{await browser.close();}
