import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const out=process.env.NF_GRILLS_GROOVE_AUDIT_DIR || '/tmp/grills-and-groove-controls';
const projectPath=process.env.NF_GRILLS_GROOVE_IMPORT || 'public/generated-flyers/grills-and-groove.nflyer';
const expectedProject=JSON.parse(await readFile(projectPath,'utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1,serviceWorkers:'block'});
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
  const selectText = async owner => {
    await owner.scrollIntoViewIfNeeded();
    const board=await page.locator('#artboard').boundingBox();
    await page.mouse.click(board.x+2,board.y+board.height-2);
    const points=await owner.evaluate(el=>[...el.querySelectorAll('[data-text-hit-surface="true"]')].flatMap(g=>{const b=g.getBoundingClientRect();return [.3,.5,.7].flatMap(y=>[.3,.5,.7].map(x=>({x:b.x+b.width*x,y:b.y+b.height*y})));}).filter(p=>document.elementFromPoint(p.x,p.y)?.closest('[data-coco-compiled-object]')===el));
    for(const point of points){await page.mouse.click(point.x,point.y);if(await owner.getAttribute('data-active')==='true')break;}
    assert.equal(await owner.getAttribute('data-active'),'true',`${await owner.getAttribute('data-coco-compiled-object')} selects on visible type`);
  };
  const textMap=()=>page.locator('#artboard [data-coco-text-value]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.cocoCompiledObject,n.dataset.cocoTextValue])));
  const ready=async format=>{
    await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
    await page.waitForFunction(f=>{const b=document.querySelector('#artboard')?.getBoundingClientRect();return b&&(f==='square'?Math.abs(b.height/b.width-1)<.01:b.height/b.width>1.7)&&document.querySelectorAll('#artboard [data-coco-text-value]').length===19;},format,{timeout:120000});
    await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:120000});
    await page.evaluate(()=>document.fonts.ready);
  };
  const capture=async name=>{
    const hide=await page.addStyleTag({content:'body{visibility:hidden!important} #artboard,#artboard *{visibility:visible!important} #artboard [data-nonexport],#artboard button{visibility:hidden!important}'});
    await page.locator('#artboard').screenshot({path:`${out}/${name}.png`});await hide.evaluate(n=>n.remove());
  };
  const expectedMaps={};
  for(const format of ['square','story']){
    await ready(format);
    const doc=expectedProject.state.session[format].cocoCompositionSystem.compiledDocument;
    for(const object of doc.objects.filter(o=>o.kind==='text'&&o.text)){
      const owner=page.locator(`#artboard [data-coco-compiled-object="${object.id}"]`);
      await selectText(owner);
      const before=await textMap();
      const inputs=page.locator('textarea:visible,input:not([type=range]):not([type=file]):visible');
      const index=await inputs.evaluateAll((nodes,text)=>nodes.findIndex(n=>n.value===text),before[object.id]);
      assert.ok(index>=0,`${format}/${object.id}: own text input`);
      const input=inputs.nth(index);
      const value=object.id==='headline'?'GRILL':object.id==='subtitle'?'GROOVES':object.id==='date'?'04':object.id==='ampersand'?'+':before[object.id]+'!';
      await input.fill(value);
      await page.waitForFunction(({id,value})=>document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value')===value,{id:object.id,value});
      const after=await textMap();for(const [id,text]of Object.entries(before))assert.equal(after[id],id===object.id?value:text,`${format}/${object.id} keeps sibling ${id}`);
      await input.fill(before[object.id]);
      if(object.id==='djLabel'){
        await input.fill('');await page.waitForFunction(()=>document.querySelector('#artboard [data-coco-compiled-object="djLabel"]')?.getAttribute('data-coco-text-value')==='');
        await input.fill('SOUNDS BY');
      }
      if(object.id==='venue')await input.fill(format==='square'?'CLUB NOVA':'CLUB EMBER');
      console.log('EDITABLE',format,object.id);
    }
    await selectText(page.locator('#artboard [data-coco-compiled-object="genres"]'));
    const details=page.locator('#details-panel');
    const label=page.getByPlaceholder('EVENT DETAILS',{exact:true});
    const bodyBefore=await page.locator('#artboard [data-coco-compiled-object="genres"]').getAttribute('data-coco-text-value');
    for(const value of ['DINNER','','SPECIALS']){
      await label.fill(value);
      await page.waitForFunction(value=>document.querySelector('#artboard [data-coco-compiled-object="detailsLabel"]')?.getAttribute('data-coco-text-value')===value,value);
      assert.equal(await page.locator('#artboard [data-coco-compiled-object="genres"]').getAttribute('data-coco-text-value'),bodyBefore);
    }
    for(const [name,value]of [['L','left'],['R','right'],['C','center']]){
      await details.getByRole('button',{name,exact:true}).click();
      assert.equal(await page.locator('#artboard [data-coco-compiled-object="genres"]').getAttribute('data-coco-compiled-align'),value);
    }
    for(const [id,panel]of [['headline','headline'],['subtitle','head2']]){
      await selectText(page.locator(`#artboard [data-coco-compiled-object="${id}"]`));
      const controls=page.locator(`#${panel}-panel`),button=controls.getByRole('button',{name:'Shadow',exact:true});
      if(await button.getAttribute('aria-pressed')!==(format==='square'?'true':'false'))await button.click();
    }
    expectedMaps[format]=await textMap();
    await capture(`edited-${format}`);
  }
  for(const format of ['square','story','square']){await ready(format);assert.deepEqual(await textMap(),expectedMaps[format]);}
  const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
  if(!await page.getByRole('button',{name:'Save Project File',exact:true}).isVisible())await projectButton.click();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();
  const savedPath=`${out}/roundtrip.nflyer`;await(await download).saveAs(savedPath);
  const saved=JSON.parse(await readFile(savedPath,'utf8'));
  for(const format of ['square','story']){
    const v=saved.state.session[format];assert.equal(v.headShadow,format==='square');assert.equal(v.head2Shadow,format==='square');
  }
  await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
  for(const format of ['square','story']){
    await ready(format);assert.deepEqual(await textMap(),expectedMaps[format]);
    await capture(`reopened-${format}`);
  }
  assert.deepEqual(errors,[]);console.log('PASS 36 visible text selections and edits, independent labels, alignment, format shadows, save/reopen');
}catch(error){await page.screenshot({path:`${out}/controls-failure.png`,fullPage:true});throw error;}finally{clearInterval(debugTimer);await browser.close();}
