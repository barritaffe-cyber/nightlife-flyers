import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const out=process.env.NF_GRILLS_GROOVE_AUDIT_DIR || '/tmp/grills-and-groove';
const projectPath=process.env.NF_GRILLS_GROOVE_IMPORT || 'public/generated-flyers/grills-and-groove.nflyer';
const expectedProject=JSON.parse(await readFile(projectPath,'utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:2,serviceWorkers:'block'});
await context.addInitScript(()=>{
  for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage(),errors=[];
if(process.env.NF_GRILLS_GROOVE_EXPORT_ACCESS_FIXTURE==='1') {
  // Isolate renderer verification from account quota; no real quota is consumed.
  await page.route('**/api/auth/starter-render',route=>route.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
  console.log('EXPORT ACCESS FIXTURE: local browser responses only; real renderer and files remain under test');
}
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
const debugTimer=process.env.NF_DEBUG?setInterval(async()=>{try{console.log('STATE',await page.evaluate(()=>({headline:document.querySelector('#artboard [data-coco-compiled-object="headline"]')?.getAttribute('data-coco-text-value'),count:document.querySelectorAll('#artboard [data-coco-text-value]').length,loading:document.querySelector('[aria-label="Preparing flyer canvas"]')?.textContent,startup:!!document.querySelector('.nf-startup-shell'),fonts:document.fonts.status})));}catch{}},15000):undefined;
try {
  await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('button',{name:'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start',exact:true}).click({timeout:120000});
  await page.locator('.nf-startup-shell').waitFor({state:'hidden',timeout:120000});
  await page.locator('#artboard').waitFor({timeout:120000});
  const project=page.getByRole('button',{name:'▸ Project',exact:true});
  if(await project.count())await project.click();
  await page.locator('input[type=file]').setInputFiles(projectPath);console.log('IMPORTED');
  await page.locator('#artboard [data-coco-compiled-object="headline"]').waitFor({timeout:120000});
  const expectedHeadlines=['square','story'].map(format=>{
    const system=(expectedProject.state??expectedProject).session[format].cocoCompositionSystem;
    return system.compiledObjectOverrides?.headline?.text??system.compiledDocument.objects.find(o=>o.id==='headline').text;
  });
  await page.waitForFunction(values=>values.includes(document.querySelector('#artboard [data-coco-compiled-object="headline"]')?.getAttribute('data-coco-text-value')),expectedHeadlines,{timeout:120000});
  await page.addStyleTag({content:'#artboard{border-radius:0!important} #artboard button, #artboard [data-nonexport], [data-floating-controls] {visibility:hidden !important}'});
  for(const format of ['square','story']) {
    await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForFunction(({format,headline})=>{
      const root=document.querySelector('#artboard'),b=root?.getBoundingClientRect();
      const ready=b&&(format==='square'?Math.abs(b.width/b.height-1)<.01:b.height/b.width>1.7)
        &&root.querySelectorAll('[data-coco-text-value]').length>=19
        &&root.querySelector('[data-coco-compiled-object="headline"]')?.getAttribute('data-coco-text-value')===headline
        &&![...document.querySelectorAll('[aria-label="Preparing flyer canvas"]')].some(el=>el.getClientRects().length)
        &&[...root.querySelectorAll('img')].every(img=>img.complete);
      if(!ready){window.__grillsGrooveReadyAt=0;return false;}
      window.__grillsGrooveReadyAt ||= Date.now();
      return Date.now()-window.__grillsGrooveReadyAt>1000;
    },{format,headline:expectedHeadlines[format==='square'?0:1]},{timeout:120000});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(3500);
    await page.locator('#artboard').scrollIntoViewIfNeeded();
    const expected=(expectedProject.state??expectedProject).session[format].cocoCompositionSystem;
    const objects=await page.locator('#artboard [data-coco-text-value]').evaluateAll(nodes=>nodes.map(el=>({id:el.dataset.cocoCompiledObject,text:el.dataset.cocoTextValue,font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize,transform:getComputedStyle(el).transform})));
    assert.equal(objects.filter(o=>o.text).length,expected.compiledDocument.objects.filter(o=>o.kind==='text'&&(expected.compiledObjectOverrides?.[o.id]?.text??o.text)).length);
    for(const object of expected.compiledDocument.objects.filter(o=>o.kind==='text')) {
      assert.equal(objects.find(o=>o.id===object.id)?.text,expected.compiledObjectOverrides?.[object.id]?.text??object.text,`${format}/${object.id} reopens its saved wording`);
    }
    const title=page.locator('#artboard [data-coco-compiled-object="headline"]');
    assert.match(await title.evaluate(el=>getComputedStyle(el).fontFamily), /Textured Gold Serif PNG/);
    assert.equal(await title.locator('[data-png-glyph-run] [data-glyph]').count(),6,'Six textured gold glyphs render');
    await writeFile(`${out}/editor-${format}.json`,JSON.stringify(objects,null,2));
    // Capture artwork without a fixed application toolbar overlapping its top edge.
    const captureStyle=await page.addStyleTag({content:'body{visibility:hidden!important} #artboard,#artboard *{visibility:visible!important} #artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *{visibility:hidden!important}'});
    await page.locator('#artboard').evaluate(node=>{for(let p=node;p;p=p.parentElement)p.style.borderRadius='0';});
    await page.locator('#artboard').screenshot({path:`${out}/editor-${format}.png`});
    if(process.env.NF_GRILLS_GROOVE_PUBLISH_PREVIEWS==='1')await page.locator('#artboard').screenshot({path:`public/generated-flyers/grills-and-groove-${format}-preview.png`});
    await captureStyle.evaluate(node=>node.remove());
    console.log('PASS',format,objects.length,'text owners');
  }
  if(process.env.NF_GRILLS_GROOVE_EXPORT_CHECK==='1') {
    await page.getByRole('button',{name:'Master Grade',exact:true}).click();
    for(const format of ['square','story']) {
      await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
      await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
      await page.waitForFunction(format=>{
        const root=document.querySelector('#artboard'),b=root?.getBoundingClientRect();
        return b&&(format==='square'?Math.abs(b.width/b.height-1)<.01:b.height/b.width>1.7)&&root.querySelectorAll('[data-coco-text-value]').length>=19;
      },format,{timeout:120000});
      await page.waitForTimeout(1500);
      const saveNotice=page.getByRole('button',{name:'Dismiss save notice',exact:true});
      if(await saveNotice.isVisible())await saveNotice.click();
      await page.getByRole('button',{name:'PNG',exact:true}).click();
      await page.waitForTimeout(300);
      assert.equal(await page.getByRole('button',{name:'PNG',exact:true}).getAttribute('aria-pressed'),'true','PNG selection must persist in both formats');
      const exportButton=page.getByRole('button',{name:'Export',exact:true});
      assert.equal(await exportButton.isDisabled(),false,'The current account must allow export verification');
      await exportButton.click();
      const preview=page.getByAltText('Export preview',{exact:true});
      await preview.waitFor({timeout:180000});
      const artifact=await preview.evaluate(async img=>{
        await img.decode();
        const response=await fetch(img.src),blob=await response.blob();
        return {width:img.naturalWidth,height:img.naturalHeight,type:blob.type,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))};
      });
      assert.equal(artifact.type,'image/png');
      assert.ok(artifact.width>=1080);
      assert.equal(artifact.height/artifact.width,format==='square'?1:1920/1080);
      await writeFile(`${out}/export-${format}.png`,Buffer.from(artifact.bytes));
      await page.getByRole('button',{name:'Close export',exact:true}).click();
      console.log('EXPORT FILE READY FOR VISUAL REVIEW',format,artifact.width,artifact.height);
    }
  }
  assert.deepEqual(errors,[]);
} catch(error) {
  await page.screenshot({path:`${out}/failure.png`,fullPage:true});
  console.log((await page.locator('body').ariaSnapshot()).slice(0,14000));
  throw error;
} finally {clearInterval(debugTimer);await browser.close();}
