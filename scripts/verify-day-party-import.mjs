import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || 'public/generated-flyers';
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
 await page.addStyleTag({content:'#artboard button, [data-floating-controls] { visibility: hidden !important; }'});
 for(const [id,file] of [['day-party','day-party.nflyer']]){
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
     await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     await page.waitForTimeout(1000);
     await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
     await page.evaluate(()=>document.fonts.ready);

     await page.locator('#artboard').scrollIntoViewIfNeeded();
     await page.waitForTimeout(1000);
     await page.waitForFunction(() => {
       const board=document.querySelector('#artboard');
       const loading=/Preparing (?:story|square) canvas/.test(board?.textContent||'');
       const imagesReady=Array.from(board?.querySelectorAll('img')||[]).every(img=>img.complete);
       if(loading || !imagesReady){window.__recipePreviewReadySince=0;return false;}
       window.__recipePreviewReadySince ||= Date.now();
       return Date.now()-window.__recipePreviewReadySince>4000;
     },null,{timeout:90000});
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').toUpperCase().includes('OFFSHORE'));
     assert.equal(await page.locator('[data-coco-compiled-object="subtitle"]').count(),1);
     assert.doesNotMatch(await page.locator('[data-coco-compiled-document="true"]').innerText(), /SUB HEADLINE|MIDNIGHT MUSE|NIGHTLIFE FLYERS/);
     const dismiss=page.getByRole('button',{name:'Dismiss save notice',exact:true});
     if(await dismiss.isVisible())await dismiss.click();
     await page.waitForTimeout(1500);
     const lateChooser=page.getByRole('button',{name:format==='square'?'Choose Square format':'Choose Story format',exact:true});
     if(await lateChooser.isVisible()) {
       await lateChooser.click();await page.waitForTimeout(8000);
       const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
       if(await keep.isVisible())await keep.click();
       await page.locator('input[type=file][accept*=json]').setInputFiles(`public/generated-flyers/${file}`);
       await page.waitForTimeout(8000);
       await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
     }
     await page.waitForTimeout(1000);
     await page.waitForFunction((format)=>{
       const board=document.querySelector('#artboard');
       const rect=board?.getBoundingClientRect();
       return board?.textContent.replace(/\s/g,'').toUpperCase().includes('OFFSHORE') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ["presenter","presents","headline","subtitle","details","day","month","date","time","venue","address","mood","escape","musicLabel","dj1","dj2","dj3","dress"]){

       const owner=page.locator('[data-coco-compiled-object="'+objectId+'"]');
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
       assert.equal(await owner.getAttribute('data-active'),'true',format+' '+objectId+' selects');
       console.log('SELECTED',format,objectId);
       if(objectId==='headline'){
         const painted=owner.locator('[data-headline-texture-paint="true"]');
         assert.equal(await painted.count(),8);
         const tops=await painted.evaluateAll(nodes=>nodes.map(el=>el.offsetTop));
         assert.equal(new Set(tops).size,1,'OFFSHORE remains a single line');
         const asset=await page.request.get(`${baseUrl}/generated-flyers/assets/day-party-title-texture.svg`);
         assert.ok(asset.ok(),'headline texture resolves on the app server');
         assert.match(await owner.evaluate(el=>getComputedStyle(el).fontFamily), /Offshore SVG/);
         const field=page.getByPlaceholder('ENTER HEADLINE...', {exact:true});
         const original=await field.inputValue();
         await field.fill('o');
         await field.press('End');
         await field.press('Shift+O');
         await page.waitForTimeout(500);
         assert.equal(await field.inputValue(),'oO','Shift+O preserves the alternate glyph code');
         assert.equal((await painted.allTextContents()).join(''),'oO');
         assert.equal(await owner.evaluate(el=>getComputedStyle(el.querySelector('[data-headline-texture-paint]')).textTransform),'none');
         await field.fill(original);
         await page.waitForTimeout(500);
       }
       if(['details','address'].includes(objectId)){
         const panel=objectId==='details'?'details':'venue';
         const originalAlign=await owner.getAttribute('data-coco-compiled-align');
         for(const [name,align] of [['C','center'],['R','right'],['L','left']]){
           await page.locator('#'+panel+'-panel').getByRole('button',{name,exact:true}).click();
           await page.waitForTimeout(300);
           assert.equal(await owner.getAttribute('data-coco-compiled-align'),align);
         }
         await page.locator('#'+panel+'-panel').getByRole('button',{name:originalAlign==='center'?'C':originalAlign==='right'?'R':'L',exact:true}).click();
         await page.waitForTimeout(300);
       }
       if(['dj1','dj2','dj3'].includes(objectId)){
         const field=page.getByPlaceholder('MUSIC BY',{exact:true});
         const before=await owner.textContent();
         await field.fill('MUSIC TEST');await page.waitForTimeout(300);
         assert.ok((await page.locator('[data-coco-compiled-object=\"musicLabel\"]').textContent()).includes('MUSIC TEST'));
         assert.equal(await owner.textContent(),before);
         await field.fill('MUSIC BY');
       }
       if(objectId==='details'){
         const tracking=await owner.evaluate(el=>{const style=getComputedStyle(el);return parseFloat(style.letterSpacing)/parseFloat(style.fontSize);});
         assert.ok(Math.abs(tracking-Number(sourceProject.state.session[format.toLowerCase()].bodyTracking))<.001,format+' preserves authored details tracking: '+tracking);
         const field=page.getByPlaceholder('EVENT DETAILS',{exact:true});
         const before=await owner.textContent();
         await field.fill('EVENT TEST');await page.waitForTimeout(300);
         const label=page.locator('[data-coco-compiled-object="detailsLabel"]');
         assert.ok((await label.textContent()).includes('EVENT TEST'));
         assert.equal(await owner.textContent(),before);
         await field.fill('');await page.waitForTimeout(300);
         assert.equal((await label.textContent()).trim(),'');
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
 const addressAlignmentBeforeSave=await page.locator('[data-coco-compiled-object="address"]').getAttribute('data-coco-compiled-align');
 const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
 if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.evaluate(el=>el.click());
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Save Project File',exact:true}).click();
 const download=await downloadPromise;
 const savedPath='/tmp/day-party-roundtrip.nflyer';
 await download.saveAs(savedPath);
 const saved=JSON.parse(await readFile(savedPath,'utf8'));
 for(const format of ['square','story']){
   assert.equal(saved.state.session[format].headline,sourceProject.state.session[format].headline,'save preserves plain/palm O case in '+format);
   assert.equal(saved.state.session[format].headlineFamily,'Offshore SVG');
 }
 await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
 await page.waitForTimeout(6000);
 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).toUpperCase().includes('OFFSHORE'));
 assert.equal(await page.locator('[data-coco-compiled-object="address"]').getAttribute('data-coco-compiled-align'),addressAlignmentBeforeSave);
 console.log('PROJECT ROUNDTRIP PASSED');
 for(const format of ['Square','Story']){
   await page.getByRole('button',{name:format,exact:true}).click();
   await page.waitForTimeout(4500);
   await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
   const tracking=await page.locator('[data-coco-compiled-object="details"]').evaluate(el=>{const style=getComputedStyle(el);return parseFloat(style.letterSpacing)/parseFloat(style.fontSize);});
   assert.ok(Math.abs(tracking-Number(sourceProject.state.session[format.toLowerCase()].bodyTracking))<.001,format+' retains details tracking after reopening: '+tracking);
   await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/day-party-${format.toLowerCase()}-preview.png`});
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
     await writeFile(`${out}/day-party-${format.toLowerCase()}-export.png`,Buffer.from(data));
     await page.getByRole('button',{name:'Close export',exact:true}).click();
     console.log('EXPORT PASSED',format);
   }
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
