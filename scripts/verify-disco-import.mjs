import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.NF_OUTPUT_DIR || 'public/generated-flyers';
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
     assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).replace(/\s/g,'').includes('Y2K'));
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
       return board?.textContent.replace(/\s/g,'').includes('Y2K') && !/Preparing (?:story|square) canvas/.test(board.textContent) && rect && (format==='story'?rect.height/rect.width>1.7:Math.abs(rect.height/rect.width-1)<0.05);
     },format,{timeout:90000});
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForTimeout(1000);
     const clearBox=await page.locator('#artboard').boundingBox();
     await page.mouse.click(clearBox.x+3,clearBox.y+3);
     await page.waitForTimeout(500);
     await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`${out}/${id}-${format}-preview.png`});
     console.log('PREVIEW',id,format);
     if(!process.env.NF_PREVIEW_ONLY)for(const objectId of ["presenter", "presents", "mood", "day", "month", "date", "headline", "subtitle", "genres", "musicLabel", "dj1", "dj2", "dj3", "entry", "entryNote", "tagline", "venue", "city", "address", "reserve"]){
       if(process.env.NF_MAPPING_ONLY && objectId!=='musicLabel')continue;
       if(process.env.NF_ALIGNMENT_CHECKS && !['address','genres','dj1'].includes(objectId))continue;
       if(process.env.NF_LABEL_CHECKS && !['genres','dj1'].includes(objectId))continue;
       const owner=page.locator(`[data-coco-compiled-object="${objectId}"]`);
       if(!(await owner.textContent()).trim()){console.log('EMPTY SAVED TEXT',format,objectId);continue;}
       await owner.scrollIntoViewIfNeeded();
       const hit=await owner.evaluate(el=>{
         for(const glyph of el.querySelectorAll('[data-text-hit-surface="true"]')){
           const b=glyph.getBoundingClientRect();
           for(let y=b.top+.4;y<b.bottom;y+=.7)for(let x=b.left+.4;x<b.right;x+=.7){
             if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return {x,y};
           }
         }
         return null;
       });
       assert.ok(hit,format+' '+objectId+' has a reachable text hit target');
       await page.mouse.click(hit.x,hit.y);await page.waitForTimeout(350);
       const glyph=owner.locator('[data-text-hit-surface="true"]').first();
       const box=await glyph.boundingBox();assert.ok(box,objectId);
       if(await owner.getAttribute('data-active')!=='true')for (const [dx,dy] of [[.5,.5],[.25,.25],[.75,.25],[.25,.65],[.75,.65]]) {
         await page.mouse.click(box.x+box.width*dx,box.y+box.height*dy);
         await page.waitForTimeout(400);
         if(await owner.getAttribute('data-active')==='true')break;
       }
       assert.equal(await owner.getAttribute('data-active'),'true',format+' '+objectId+' selects its existing panel');
       assert.equal(await page.locator('[data-floating-controls="text"]').count(),0);
       console.log('SELECTED',format,objectId);
       if(process.env.NF_LABEL_CHECKS){
         const field=page.getByPlaceholder(objectId==='genres'?'EVENT DETAILS':'MUSIC BY',{exact:true});
         const label=page.locator(`[data-coco-compiled-object="${objectId==='genres'?'detailsLabel':'musicLabel'}"]`);
         const body=await owner.textContent();
         for(const value of ['LABEL TEST','','LABEL RESTORED']){
           await field.fill(value);await page.waitForTimeout(500);
           assert.ok((await label.textContent() ?? '').includes(value));
           if(!value)assert.equal((await label.textContent() ?? '').trim(),'');
           assert.equal(await owner.textContent(),body);
         }
         console.log('LABEL PASSED',format,objectId);
         continue;
       }
       if(process.env.NF_ALIGNMENT_CHECKS){
         const panel=objectId==='address'?'venue':objectId==='genres'?'details':'details2';
         const sibling=page.locator(`[data-coco-compiled-object="${objectId==='address'?'venue':objectId==='genres'?'entry':'dj2'}"]`);
         const before=await sibling.getAttribute('data-coco-compiled-align');
         for(const [label,align] of [['L','left'],['C','center'],['R','right'],['L','left']]){
           const chip=page.locator(`#${panel}-panel`).getByRole('button',{name:label,exact:true});
           await chip.click();await page.waitForTimeout(450);
           assert.equal(await owner.getAttribute('data-coco-compiled-align'),align,`${format} ${objectId} ${align}`);
           assert.equal(await chip.getAttribute('aria-pressed'),'true');
           assert.equal(await sibling.getAttribute('data-coco-compiled-align'),before,'sibling alignment unchanged');
         }
         console.log('ALIGNMENT PASSED',format,objectId);
         continue;
       }
       if(objectId==='musicLabel' && process.env.NF_MAPPING_FONTS){
         const dj=page.locator('[data-coco-compiled-object="dj2"]');
         const djBefore=await dj.textContent();
         const field=page.getByPlaceholder('MUSIC BY',{exact:true});
         const original=await field.inputValue();
         await field.fill('MUSIC TEST');await page.waitForTimeout(500);
         assert.ok((await owner.textContent()).includes('MUSIC TEST'));
         assert.equal(await dj.textContent(),djBefore);
         await field.fill(original);await page.waitForTimeout(500);
         const size=page.getByRole('slider',{name:'Label Size',exact:true});
         const before=await owner.evaluate(el=>getComputedStyle(el).fontSize);
         const djSize=await dj.evaluate(el=>getComputedStyle(el).fontSize);
         await size.focus();await size.press('ArrowRight');await page.waitForTimeout(500);
         assert.notEqual(await owner.evaluate(el=>getComputedStyle(el).fontSize),before);
         assert.equal(await dj.evaluate(el=>getComputedStyle(el).fontSize),djSize);
         await size.press('ArrowLeft');await page.waitForTimeout(500);
         console.log('LABEL EDITS ISOLATED',format);
       }
       if(['dj1','dj3'].includes(objectId)){
         const original=objectId==='dj1'?'DJ NOVA':'DJ ELLE';
         const field=page.getByPlaceholder('DJ JOE | DJ KLASS | HYPE\nPlaying the best nightlife anthems',{exact:true});
         assert.equal(await field.inputValue(),original);
         await field.fill(original+' TEST');
         await page.waitForTimeout(500);
         assert.ok((await owner.textContent()).includes(original+' TEST'));
         assert.ok((await page.locator('[data-coco-compiled-object="dj2"]').textContent()).includes('DJ KAY'));
         await field.fill(original);
         await page.waitForTimeout(500);
         console.log('EDIT RESTORED',format,objectId);
       }

     }

   }
 }
 if(process.env.NF_GLINT_CHECKS){
  const original=JSON.parse(await (await import('node:fs/promises')).readFile('public/generated-flyers/disco.nflyer','utf8'));
  const positions=[];
  for(const family of ['Creamer','Billion Dreams','Dopestyle','Northwell','LEMONMILK-Bold']){
   const project=structuredClone(original);
   for(const state of [project.state,...Object.values(project.state.session)])state.headlineFamily=family;
   const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
   if(!await page.locator('input[type=file][accept*=json]').count())await projectButton.evaluate(el=>el.click());
   await page.locator('input[type=file][accept*=json]').setInputFiles({name:'font-check.nflyer',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
   await page.waitForTimeout(2000);
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(f=>getComputedStyle(document.querySelector('[data-coco-compiled-object="headline"]')).fontFamily.includes(f),family);
   await page.waitForFunction(()=>document.querySelector('[data-headline-specular-glint] > g[transform]'));
   const p=await page.locator('[data-headline-specular-glint] > g[transform]').evaluate(el=>{const m=el.transform.baseVal.consolidate().matrix;const t=el.ownerSVGElement.querySelector('mask text');const k=t.textContent.toUpperCase().lastIndexOf('K');const b=t.getExtentOfChar(k);return {x:m.e,y:m.f,left:b.x,top:b.y,right:b.x+b.width,bottom:b.y+b.height};});
   assert.ok(p.x>=p.left-2&&p.x<=p.right+2&&p.y>=p.top-20&&p.y<=p.bottom+20,family+' glint touches K bounds '+JSON.stringify(p));
   positions.push(p.x+','+p.y);console.log('GLINT FONT',family,p);
  }
  assert.equal(new Set(positions).size,5,'glint recomputes for every font');
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());throw error;}finally{await browser.close();}
