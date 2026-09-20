import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out=process.env.NF_OUTPUT_DIR || '/tmp/coco-canvas-handoff-fixed';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
const openGroups=async form=>{for(const d of await form.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();};
try {
for(const mobile of (process.env.NF_DEVICE === 'desktop' ? [false] : process.env.NF_DEVICE === 'mobile' ? [true] : [false,true])) {
 const device=mobile?'mobile':'desktop';
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 await ctx.addInitScript(()=>{for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
 const p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 // Isolate rendering from guest export quota; this does not test entitlements.
 await p.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
 const capture=async name=>{await p.screenshot({path:`${out}/${device}-${name}.png`});console.log(device,name);};
 try {
 await p.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
 await p.getByLabel('Event name',{exact:true}).fill('Soft Life');await p.getByRole('button',{name:'Elegant',exact:true}).click();await p.getByTestId('coco-build-event-next').click();
 const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
 const choose=async id=>{await chooser.locator(`[data-coco-direction-id="${id}"]`).getByRole('button',{name:'Choose this direction',exact:true}).click({timeout:120000});await p.getByTestId('coco-build-details').waitFor();};
 await choose('soft-life');const form=p.getByTestId('coco-build-details');
 await openGroups(form);
 await form.getByTestId('coco-build-brief-venueName').fill('CLUB NOVA');
 await form.getByTestId('coco-build-brief-date').fill('Oct 24 2026');
 await form.getByTestId('coco-build-brief-djs-line-1').fill('DJ NOVA');
 await form.getByTestId('coco-build-brief-djs-line-2').fill('DJ LUNA');
 // Footer remains reachable even after scrolling to optional fields.
 await form.getByTestId('coco-build-finish').click({trial:true});
 if(mobile)await form.getByRole('button',{name:'Preview flyer',exact:true}).click();
 await p.waitForFunction(()=>document.querySelector('[aria-label="Live flyer preview"] [data-coco-compiled-object="venue"]')?.getAttribute('data-coco-text-value')==='CLUB NOVA');
 await form.locator('[data-coco-personalized-preview][data-preview-ready="true"]').waitFor({timeout:120000});
 await p.waitForFunction(()=>{const root=document.querySelector('[aria-label="Live flyer preview"] [data-coco-personalized-preview]');const art=root?.querySelector('[data-coco-preview-artboard]');return root&&art&&root.clientWidth>0&&Math.abs(art.getBoundingClientRect().width-root.clientWidth)<1;});
 await capture('details-preview');
 await form.getByRole('button',{name:'Story',exact:true}).click();
 await form.locator('[data-coco-personalized-preview="story"][data-preview-ready="true"]').waitFor({timeout:120000});
 await p.waitForFunction(()=>{const root=document.querySelector('[aria-label="Live flyer preview"] [data-coco-personalized-preview]');const art=root?.querySelector('[data-coco-preview-artboard]');return root&&art&&root.clientWidth>0&&Math.abs(art.getBoundingClientRect().width-root.clientWidth)<1;});
 await capture('details-story');
 await form.getByRole('button',{name:'Back',exact:true}).click();await choose('grills-and-groove');await openGroups(form);
 assert.equal(await form.getByTestId('coco-build-brief-venueName').inputValue(),'CLUB NOVA');
 assert.equal(await form.getByTestId('coco-build-brief-date').inputValue(),'Oct 24 2026');
 await form.getByRole('button',{name:'Back',exact:true}).click();await choose('soft-life');
 assert.equal(await form.getByTestId('coco-build-brief-venueName').inputValue(),'CLUB NOVA');
 await form.getByTestId('coco-build-finish').click();
 await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});
 await p.waitForFunction(()=>document.querySelector('#artboard [data-coco-compiled-object="venue"]')?.getAttribute('data-coco-text-value')==='CLUB NOVA');
 await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 await p.evaluate(()=>document.fonts.ready);
 if(mobile)await p.waitForFunction(()=>{const r=document.querySelector('[data-testid="coco-mobile-workspace-nav"]')?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight+1;});
 await capture('arrival');
 const quick=p.getByTestId('coco-quick-edit');
 if(!mobile){
  await p.getByTestId('coco-quick-export-both').click({trial:true});
  await p.getByTestId('coco-quick-save').click({trial:true});
  assert.ok(await p.getByTestId('coco-quick-export-both').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'export is not clipped');
 }
 await p.getByTestId('coco-quick-format-story').click();
 await p.waitForFunction(()=>{const r=document.querySelector('#artboard')?.getBoundingClientRect();return r&&r.height/r.width>1.7;});
 await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 if(mobile){
  await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Preview',exact:true}).click();
  await p.waitForFunction(()=>{const r=document.querySelector('#artboard')?.getBoundingClientRect();return r&&Math.abs(r.top+r.height/2-innerHeight/2)<30;});
 }
 await capture('story');
 if(mobile)await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Edit details',exact:true}).click();
 await p.getByTestId('coco-quick-format-square').click();
 await p.waitForFunction(()=>{const r=document.querySelector('#artboard')?.getBoundingClientRect();return r&&Math.abs(r.height/r.width-1)<.05;});
 await p.getByTestId('coco-quick-fine-tune').click();
 await p.getByTestId('coco-workspace-handoff').scrollIntoViewIfNeeded();
 await capture('canvas-editor');
 if(!mobile){
  await p.getByTestId('coco-canvas-tools').waitFor();
  assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
  // Click a painted point belonging to the venue's editable object.
  const venue=p.locator('#artboard [data-coco-compiled-object="venue"]');
  await venue.scrollIntoViewIfNeeded();
  const point=await venue.evaluate(el=>{const r=el.getBoundingClientRect();for(let y=r.y+2;y<r.bottom;y+=2)for(let x=r.x+2;x<r.right;x+=2)if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return{x,y};return null;});
  assert.ok(point);await p.mouse.click(point.x,point.y);
  await p.getByTestId('coco-canvas-text').fill('CLUB EMBER');
  await p.waitForFunction(()=>document.querySelector('#artboard [data-coco-compiled-object="venue"]')?.getAttribute('data-coco-text-value')==='CLUB EMBER');
  const size=p.getByTestId('coco-canvas-tools').locator('input[data-mobile-numeric-input]').nth(0);
  await size.fill('18');await size.press('Enter');assert.equal(await size.inputValue(),'18');
  const rotation=p.getByTestId('coco-canvas-tools').locator('input[data-mobile-numeric-input]').nth(1);
  await rotation.fill('5');await rotation.press('Enter');assert.equal(await rotation.inputValue(),'5');
  await capture('selected-text');
  await p.getByTestId('coco-more-tools').click();assert.ok(await p.locator('#right-controls-panel').isVisible());
  await p.getByTestId('coco-more-tools').click();assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
 }
 if(mobile){
  const venue=p.locator('#artboard [data-coco-compiled-object="venue"]');await venue.scrollIntoViewIfNeeded();
  const point=await venue.evaluate(el=>{const r=el.getBoundingClientRect();for(let y=r.y+2;y<r.bottom;y+=2)for(let x=r.x+2;x<r.right;x+=2)if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return{x,y};return null;});
  assert.ok(point);await p.touchscreen.tap(point.x,point.y);
  const text=p.locator('[data-floating-controls="text"] textarea');await text.fill('CLUB EMBER');
  await capture('selected-text');
  await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Edit details',exact:true}).click();
  await p.getByTestId('coco-quick-fine-tune').click();
  await p.getByTestId('coco-more-tools').click();
  assert.ok(await p.locator('#mobile-controls-panel').isVisible());
 }
 // The save notice must not intercept either return route.
 if(mobile)await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Edit details',exact:true}).click();
 else await p.getByTestId('coco-back-details').click();
 await quick.waitFor();await capture('returned-details');
 if(mobile){
  await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Preview',exact:true}).click();
  assert.ok(await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Download both',exact:true}).isVisible());
 }

 if(!process.env.NF_SKIP_EXPORT) {
 // Exercise the new download entry point and inspect both rendered artifacts.
 if(mobile)await p.getByRole('navigation',{name:'Flyer workspace'}).getByRole('button',{name:'Download both',exact:true}).click();
 else await p.getByTestId('coco-handoff-download').click();
 for(const format of ['Square','Story']) {
   const img=p.getByAltText(`${format} export preview`,{exact:true});
   await img.waitFor({timeout:180000});
   const artifact=await img.evaluate(async el=>{await el.decode();return {width:el.naturalWidth,height:el.naturalHeight};});
   assert.equal(artifact.height/artifact.width,format==='Square'?1:1920/1080);
   const [download]=await Promise.all([p.waitForEvent('download'),p.getByRole('button',{name:`Save ${format}`,exact:true}).click()]);
   await download.saveAs(`${out}/${device}-export-${format.toLowerCase()}.png`);
   console.log(device,'export',format,artifact);
 }
 await capture('download-ready');
 }
 assert.deepEqual(errors,[]);
 results.push({device,pass:true,errors});
 }catch(e){await capture('failure');results.push({device,pass:false,error:e.message,errors});console.log('FAIL',device,e.message);}
 finally{await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));await ctx.close();}
}
}finally{await browser.close();}
assert.ok(results.every(r=>r.pass),JSON.stringify(results));
console.log('PASS handoff, live previews, draft retention, reachable controls, both formats and canvas return');
