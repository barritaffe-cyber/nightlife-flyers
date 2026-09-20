import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:2});
await context.addInitScript(()=>{
 localStorage.setItem('nf:pwa-install-ack:v1','1');
 localStorage.setItem('nf:onboarded:v1','1');
 localStorage.setItem('nf:saveNoticeDismissed','1');
 sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const baseUrl=process.env.NF_BASE_URL||'http://localhost:3001';
try{
 await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(Number(process.env.NF_STARTUP_MS||12000));
 const starter=page.locator('.nf-startup-shell button').filter({has:page.locator('img')}).first();
 if(await starter.isVisible()){await starter.click({force:true});await page.waitForTimeout(2000);}
 const chooser=page.getByRole('button',{name:'Choose Square format',exact:true});
 if(await chooser.isVisible()){await chooser.click();await page.waitForTimeout(8000);}
 const keep=page.getByRole('button',{name:'Keep this layout',exact:true});
 if(await keep.isVisible()){await keep.click({force:true});await page.waitForTimeout(1000);}
 const project=page.getByRole('button',{name:'▸ Project',exact:true});
 await page.locator('#artboard').waitFor({timeout:120000});
 if(await page.locator('input[type=file]').count()===0)await project.click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/ladies-night-rose.nflyer');
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
 await page.addStyleTag({content:'#artboard button,[data-floating-controls]{visibility:hidden!important}'});
 for(const format of ['square','story']){
  await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
  await page.waitForTimeout(2500);
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(5000);
  const headline=page.locator('[data-coco-compiled-object="headline"]');
  assert.ok((await headline.textContent())?.includes('Ladies'));
  assert.equal(await headline.locator('[data-png-glyph-run]').count(),1);
  assert.equal(await headline.locator('[data-headline-shadow-glyph]').count(),6);
  assert.equal(await page.locator('[data-coco-compiled-object]').count(),21);
  const night=page.locator('[data-coco-compiled-object="head2"]');
  assert.equal(await night.locator('[data-headline-shadow-glyph]').count(),5);
  assert.equal(await headline.locator('[data-png-specular-glint]').count(),2);
  const accentStyles=await page.evaluate(()=>Object.fromEntries(['motto','venue'].map(id=>{
   const root=document.querySelector(`[data-coco-compiled-object="${id}"]`);
   const visible=root?.querySelector('[data-coco-compiled-auto-wrap],[data-coco-compiled-visible-run],[data-coco-compiled-text-line]');
   return [id,{text:visible?.textContent,family:visible?getComputedStyle(visible).fontFamily:'',transform:visible?getComputedStyle(visible).textTransform:''}];
  })));
  assert.match(accentStyles.motto.family,/Dear Script/);
  assert.match(accentStyles.venue.family,/Dear Script/);
  assert.equal(accentStyles.motto.transform,'none');
  assert.equal(accentStyles.venue.transform,'none');
  assert.equal(await page.locator('[data-node="subtag"]').count(),0);
  assert.equal(await page.locator('[data-node="price"]').count(),0);
  assert.equal(await page.locator('[data-node="priceLabel"]').count(),0);
  const board=await page.locator('#artboard').boundingBox();
  await page.mouse.click(board.x+3,board.y+3);await page.waitForTimeout(250);
  await page.locator('#artboard').screenshot({path:`public/generated-flyers/ladies-night-rose-${format}-preview.png`});
  console.log('PREVIEW ladies-night-rose',format);
  const ids=await page.locator('[data-coco-compiled-object]').evaluateAll(nodes=>nodes.filter(el=>el.querySelector('[data-text-hit-surface="true"]') && el.textContent.trim()).map(el=>el.getAttribute('data-coco-compiled-object')));
  assert.equal(ids.length,18);
  for(const id of ids){
   const owner=page.locator(`[data-coco-compiled-object="${id}"]`);
   await owner.evaluate(el=>el.click());await page.waitForTimeout(100);
   assert.equal(await owner.getAttribute('data-active'),'true',format+' selectable '+id);
  }
  for(const id of ['headline','head2']){
   const owner=page.locator(`[data-coco-compiled-object="${id}"]`);
   await owner.evaluate(el=>el.click());await page.waitForTimeout(200);
   const input=page.getByPlaceholder(id==='headline'?'ENTER HEADLINE...':'Optional sub-headline',{exact:true});
   if(!await input.isVisible())await page.getByRole('button',{name:id==='headline'?'▸ Headline':'▸ Sub Headline',exact:true}).click();
   const original=await input.inputValue();
   await input.fill(id==='headline'?'Royal 29':'Afterglow');await page.waitForTimeout(350);
   assert.ok((await owner.textContent()).includes(id==='headline'?'Royal 29':'Afterglow'));
   assert.equal(await owner.locator('[data-headline-shadow-glyph]').count(),id==='headline'?8:9);
   await input.fill(original);await page.waitForTimeout(350);
   const filters=await owner.locator('[data-headline-shadow-glyph]').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).filter));
   assert.ok(filters.every(f=>f.includes('url(')),format+' '+id+' individual shadows');
  }
  console.log('EDITABLE TEXT VERIFIED',format,ids.length);

 }
 const save=page.getByRole('button',{name:'Save Project File',exact:true});
 if(!await save.isVisible())await project.evaluate(el=>el.click());
 const pending=page.waitForEvent('download');await save.click();const download=await pending;
 const path='/tmp/ladies-night-rose-roundtrip.nflyer';await download.saveAs(path);
 const data=JSON.parse(await readFile(path,'utf8'));
 for(const format of ['square','story']){
  const v=data.state.session[format];assert.ok(v.headShadow && v.head2Shadow);
  assert.equal(v.cocoCompositionSystem.compiledDocument.objects.find(o=>o.id==='headline').paint.textEffect,'rose-gold-glints-v1');
 }
 await page.locator('input[type=file][accept*=json]').setInputFiles(path);await page.waitForTimeout(2000);
 for(const format of ['Square','Story']){
  await page.getByRole('button',{name:format,exact:true}).click();await page.waitForTimeout(1800);
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  assert.ok((await page.locator('[data-coco-compiled-object="headline"]').textContent()).includes('Ladies'));
  assert.ok((await page.locator('[data-coco-compiled-object="head2"]').textContent()).includes('Night'));
  assert.equal(await page.locator('[data-png-specular-glint]').count(),2);
 }
 console.log('SAVE AND REOPEN VERIFIED');
 if(process.env.NF_EXPORT_CHECKS){
  await page.getByRole('button',{name:'Master Grade',exact:true}).click();
  for(const format of ['Square','Story']){
   await page.getByRole('button',{name:format,exact:true}).click();await page.waitForTimeout(1500);
   await page.getByRole('button',{name:'PNG',exact:true}).click();
   await page.getByRole('button',{name:'4x',exact:true}).click();
   const exportButton=page.getByRole('button',{name:'Export',exact:true});
   assert.equal(await exportButton.isDisabled(),false,(await exportButton.getAttribute('title')) || 'PNG export available');
   await exportButton.click();
   const preview=page.getByAltText('Export preview',{exact:true});await preview.waitFor({timeout:180000});
   const result=await preview.evaluate(async img=>{
    await img.decode();const response=await fetch(img.src);
    return {width:img.naturalWidth,height:img.naturalHeight,bytes:Array.from(new Uint8Array(await response.arrayBuffer()))};
   });
   assert.ok(result.width>=1080 && result.height>=1080);
   await writeFile(`public/generated-flyers/ladies-night-rose-${format.toLowerCase()}-export.png`,Buffer.from(result.bytes));
   await page.getByRole('button',{name:'Close export',exact:true}).click();
   console.log('PNG EXPORT VERIFIED',format,result.width,result.height);
  }
 }

 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{await browser.close();}
