import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || (process.env.NF_ACCEPTED_PREVIEW ? 'public/generated-flyers' : '/tmp/nightlife-editor-regressions');
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
 for(const [id,file] of [['sip-and-paint','sip-and-paint.nflyer']]){
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
   if(!process.env.NF_ROUNDTRIP_ONLY) for(const format of ['square','story']){
     console.log('FORMAT',format);
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(1000);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,10000))]));console.log('FONT WAIT FINISHED');

     await page.locator('#artboard').scrollIntoViewIfNeeded();
     await page.waitForTimeout(1000);
     console.log('IMAGE READINESS');
     await page.waitForFunction(() => {
       const board=document.querySelector('#artboard');
       const loading=/Preparing (?:story|square) canvas/.test(board?.textContent||'');
       const imagesReady=Array.from(board?.querySelectorAll('img')||[]).every(img=>img.complete);
       if(loading || !imagesReady){window.__recipePreviewReadySince=0;return false;}
       window.__recipePreviewReadySince ||= Date.now();
       return Date.now()-window.__recipePreviewReadySince>4000;
     },null,{timeout:90000});
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').includes('SIP'));
     assert.equal(await page.locator('[data-coco-compiled-object="subtitle"]').count(),1);
     assert.doesNotMatch(await page.locator('[data-coco-compiled-document="true"]').innerText(), /SUB HEADLINE|MIDNIGHT MUSE/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(1500);
     const lateChooser=page.getByRole('button',{name:format==='square'?'Choose Square format':'Choose Story format',exact:true});
     if(await lateChooser.isVisible()) {
       await lateChooser.click();await page.waitForTimeout(8000);
       const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
       if(await keep.isVisible())await keep.click();
       await page.locator('input[type=file][accept*=json]').setInputFiles(process.env.NF_VERIFY_FILE || `public/generated-flyers/${file}`);
       await page.waitForTimeout(8000);
       await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     }
     await page.waitForTimeout(1000);
     await page.waitForFunction((format)=>{
       const board=document.querySelector('#artboard');
       const rect=board?.getBoundingClientRect();
       return board?.textContent.replace(/\s/g,'').includes('SIP') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,10000))]));console.log('FONT WAIT FINISHED');
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ["headline", "subtitle", "and", "presenter", "day", "date", "hours", "genres", "mood", "tagline", "cost", "perPerson", "included", "venue", "address", "footer", "motto", "napkin"]){

       const owner=page.locator('[data-coco-compiled-object="'+objectId+'"]');
       assert.ok((await owner.textContent()).trim(),format+' '+objectId+' is visible');
       await owner.scrollIntoViewIfNeeded();
       const hit=await owner.evaluate(el=>{
         for(const glyph of el.querySelectorAll('[data-text-hit-surface="true"]')){
           const b=glyph.getBoundingClientRect();
           for(let y=b.top+.4;y<b.bottom;y+=.7)for(let x=b.left+.4;x<b.right;x+=.7)
             if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return {x,y};
         }return null;
       });
       assert.ok(hit,format+' '+objectId+' reachable');
       await page.mouse.click(hit.x,hit.y);await page.waitForTimeout(350);
       // Thin small glyphs have transparent corners; click interior stroke candidates.
       if(await owner.getAttribute('data-active')!=='true'){
         const candidates=await owner.evaluate(el=>Array.from(el.querySelectorAll('[data-text-hit-surface="true"]')).slice(0,4).flatMap(g=>{const b=g.getBoundingClientRect();return [.3,.5,.7].flatMap(fy=>[.25,.5,.75].map(fx=>({x:b.x+b.width*fx,y:b.y+b.height*fy})));}));
         for(const point of candidates){await page.mouse.click(point.x,point.y);await page.waitForTimeout(180);if(await owner.getAttribute('data-active')==='true')break;}
       }
       assert.equal(await owner.getAttribute('data-active'),'true',format+' '+objectId+' selects');
       console.log('SELECTED',format,objectId);
       if(['headline','subtitle'].includes(objectId)){
         const controls=page.locator(objectId==='headline'?'#headline-panel':'#head2-panel');
         const picker=controls.locator('[data-floating-controls="fontpicker"]').first();
         await picker.locator('button').first().evaluate(el=>el.click());
         const category=page.getByRole('button',{name:/Club \/ Poster Headlines/,includeHidden:true});
         await category.evaluate(el=>el.click());
         const menu=page.locator('[data-floating-controls="fontpicker"]').filter({has:page.getByRole('button',{name:'Back to categories',includeHidden:true})});
         assert.equal(await menu.getByRole('button',{name:/Paint Splash Serif|Sunset Paint Brush/,includeHidden:true}).count(),2,'Both paint fonts available in font options');
         assert.equal(await controls.locator('[data-png-glyph-picker]').getByRole('button',{name:/Paint Splash Serif|Sunset Paint Brush/,includeHidden:true}).count(),2,'Both paint fonts available in PNG gallery');
         await picker.locator('button').first().evaluate(el=>el.click());
       }
       if(objectId==='qrCaption'){
         assert.equal(await page.locator('[data-node="qrLabel"]').count(),0,'Authored caption replaces default label');
         const qr=page.locator('[data-node="qr"]');await qr.click();
         const panel=page.locator('#template-qr-panel');
         const chooser=page.waitForEvent('filechooser');await panel.getByRole('button',{name:'Upload QR',exact:true}).click();
         await (await chooser).setFiles('public/generated-flyers/assets/mardi-gras-qr-placeholder.svg');
         await qr.locator('img').waitFor({timeout:30000});
         await panel.getByRole('button',{name:'Use Default',exact:true}).click();
         await qr.locator('svg').waitFor();console.log('QR UPLOAD AND DEFAULT PASSED',format);
       }

       if(['headline','subtitle'].includes(objectId)){
 const input=page.getByPlaceholder(objectId==='headline'?'ENTER HEADLINE...':'Optional sub-headline',{exact:true});
 const original=await input.inputValue();await input.fill('SUN TEST');await page.waitForTimeout(400);assert.ok((await owner.textContent()).includes('SUN TEST'));await input.fill(original);await page.waitForTimeout(400);
 }
 if(['genres','address'].includes(objectId)){
         const panel=objectId==='genres'?'details':'venue';
         for(const [name,align] of [['C','center'],['R','right'],['L','left']]){
           await page.locator('#'+panel+'-panel').getByRole('button',{name,exact:true}).click();
           await page.waitForTimeout(300);
           assert.equal(await owner.getAttribute('data-coco-compiled-align'),align);
         }
       }
       if(objectId==='genres'){
         const tracking=await owner.evaluate(el=>{const style=getComputedStyle(el);return parseFloat(style.letterSpacing)/parseFloat(style.fontSize);});
         assert.ok(Math.abs(tracking-((format==='story'||format==='Story')?.24:.3))<.001,format+' preserves authored details tracking: '+tracking);
         const field=page.getByPlaceholder('EVENT DETAILS',{exact:true});
         const before=await owner.textContent();
         await field.fill('EVENT TEST');await page.waitForTimeout(300);
         const label=page.locator('[data-coco-compiled-object="detailsLabel"]');
         assert.ok((await label.textContent()).includes('EVENT TEST'));
         assert.equal(await owner.textContent(),before);
         await field.fill('');await page.waitForTimeout(300);
         assert.equal((await label.textContent()).trim(),'');
         await field.fill('SUN CLUB');await page.waitForTimeout(300);
         assert.ok((await label.textContent()).includes('SUN CLUB'));
         await field.fill('');
       }
     }
   }
 }
 if(process.env.NF_ACCEPTED_PREVIEW){
   assert.equal(errors.length,0,JSON.stringify(errors));
   console.log('ACCEPTED PREVIEWS PASSED');
   await browser.close();
   process.exit(0);
 }
 const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
 if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Save Project File',exact:true}).click();
 const download=await downloadPromise;
 const savedPath=out+'/roundtrip.nflyer';
 await download.saveAs(savedPath);
 await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
 await page.waitForTimeout(2000);
 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').includes('SIP'));
 assert.equal(await page.locator('[data-coco-compiled-object="address"]').getAttribute('data-coco-compiled-align'),process.env.NF_PREVIEW_ONLY?'center':'left');
 console.log('PROJECT ROUNDTRIP PASSED');
 for(const format of ['Square','Story']){
   await page.getByRole('button',{name:format,exact:true}).click();
   await page.waitForTimeout(1200);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   await page.waitForFunction((format)=>{
     const el=document.querySelector('[data-coco-compiled-object="genres"]');
     const box=document.querySelector('#artboard')?.getBoundingClientRect();
     const style=el && getComputedStyle(el);const tracking=style?parseFloat(style.letterSpacing)/parseFloat(style.fontSize):NaN;
     const ready=box && (format==='Story'?box.height/box.width>1.7:Math.abs(box.height/box.width-1)<.05) && Math.abs(tracking-((format==='story'||format==='Story')?.24:.3))<.001;
     if(!ready){window.__miamiTrackingReady=0;return false;}window.__miamiTrackingReady ||= Date.now();return Date.now()-window.__miamiTrackingReady>1000;
   },format,{timeout:30000});
   await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/sip-and-paint-${format.toLowerCase()}-roundtrip.png`});
 }
 if(process.env.NF_EXPORT_CHECKS){
   await page.getByRole('button',{name:'Master Grade',exact:true}).click();
   for(const format of ['Square','Story']){
     await page.getByRole('button',{name:format,exact:true}).click();
     await page.waitForTimeout(1500);
     await page.getByRole('button',{name:'PNG',exact:true}).click();
     const exportButton=page.getByRole('button',{name:'Export',exact:true});
     assert.equal(await exportButton.isDisabled(),false,'Export verification blocked by the account render limit');
     await exportButton.click();
     const preview=page.getByAltText('Export preview',{exact:true});
     await preview.waitFor({timeout:180000});
     const data=await preview.evaluate(async img=>{
       await img.decode();const res=await fetch(img.src);return Array.from(new Uint8Array(await res.arrayBuffer()));
     });
     await writeFile(`${out}/sip-and-paint-${format.toLowerCase()}-export.png`,Buffer.from(data));
     await page.getByRole('button',{name:'Close export',exact:true}).click();
     console.log('EXPORT PASSED',format);
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));console.log('ALL REQUESTED CHECKS PASSED');
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(-14000));throw error;}finally{await browser.close();}
