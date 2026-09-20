import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {verifyCocoFineTuneText} from './verify-coco-fine-tune-text.mjs';
const custom=process.env.NF_COCO_CUSTOM==='1';
const out=process.env.NF_COCO_AUDIT_DIR || '/tmp/coco-simple-build';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},acceptDownloads:true,serviceWorkers:'block'});
await context.addInitScript(()=>{
 for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');
 sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage();const errors=[],generation=[];
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
page.on('request',r=>{if(/\/api\/coco-(copy|style)/.test(r.url()))generation.push(r.url())});
await page.route('**/api/coco-copy',r=>r.fulfill({json:{copy:{headline:'Bad Girls'}}}));
await page.route('**/api/coco-style',r=>r.fulfill({json:{}}));
await page.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
try{
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
 await page.getByRole('tab',{name:'Custom',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'No portrait',exact:true}).count(),0);
 await page.getByTestId('coco-composer-portrait-upload').setInputFiles('public/generated-flyers/assets/bad-g-subject.png');
 if(!custom) await page.getByRole('button',{name:'Keep the design’s portrait',exact:true}).click();
 await page.getByTestId('coco-composer-image-upload').setInputFiles('public/generated-flyers/assets/bad-girl-square.jpg');
 if(!custom) await page.getByRole('button',{name:'Keep the design’s background',exact:true}).click();
 await page.screenshot({path:`${out}/custom.png`,fullPage:true});
 await page.getByRole('tab',{name:'Designs',exact:true}).click();
 await page.getByLabel('Event name',{exact:true}).fill('Bad Girls');
 await page.getByRole('button',{name:'Urban',exact:true}).click();
 await page.screenshot({path:`${out}/start.png`});
 await page.getByTestId('coco-build-event-next').click();
 const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:180000});
 if(!custom)assert.deepEqual(generation,[],'default design path skips generated filler copy and image processing');
 const card=chooser.locator('[data-coco-direction-id="bad-girls"]');await card.waitFor({timeout:120000});
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-coco-personalized-preview]')].every(n=>n.dataset.previewReady==='true'),null,{timeout:120000});
 assert.ok(await card.locator('[data-coco-subject="true"] img').count(),'authored portrait remains without uploading one');
 await page.screenshot({path:`${out}/choices.png`,fullPage:true});
 await card.getByRole('button',{name:'Choose this direction',exact:true}).click();
 const form=page.getByTestId('coco-build-details');await form.waitFor();await form.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
 await page.getByTestId('coco-build-brief-subtitle-line-1').fill('Sweet');
 await page.getByTestId('coco-build-finish').click();
 assert.match(await form.getByRole('alert').textContent(),/Fill in each line/);
 assert.equal(await form.locator('[data-coco-target-objects]').evaluateAll(nodes=>nodes.some(n=>/\"(?:mood|motto|feeling|presents)\"/.test(n.getAttribute('data-coco-target-objects')||''))),false,'built-in design text is not requested');
 const facts={presenterName:['nova events'],date:['Nov 7 2026'],startTime:['9PM','Till late'],musicPolicy:['Afrobeats','Hip Hop','R&B','Amapiano','Dancehall','Soul'],subtitle:['Sweet','Music'],'recipe:only':['Always'],djs:['dj nova','dj orbit'],drinkSpecials:['Cocktail','Happy Hour'],eventDetails:['VIP Booths','Available'],dressCode:['Smart & Bold'],ageRequirement:['18'],venueName:['Club Aurora'],address:['123 Ocean Drive, Miami'],entryFee:['30'],rsvpContact:['555 123 4567']};
 for(const [key,answers] of Object.entries(facts)){
  const inputs=form.locator(`input[data-testid="coco-build-brief-${key}"],textarea[data-testid="coco-build-brief-${key}"],input[data-testid^="coco-build-brief-${key}-line-"]`);
  assert.equal(await inputs.count(),answers.length,key);
  for(let i=0;i<answers.length;i++)await inputs.nth(i).fill(answers[i]);
 }
 assert.match(await page.getByTestId('coco-build-brief-entryFee-preview').textContent(),/TICKETS \$30/);
 assert.match(await page.getByTestId('coco-build-brief-ageRequirement-preview').textContent(),/18\+ EVENT/);
 await form.locator('details').filter({has:page.getByTestId('coco-build-brief-entryFee-line-1')}).screenshot({path:`${out}/number-fields.png`});
 await form.evaluate(node=>node.scrollTop=0);await form.screenshot({path:`${out}/form.png`});
 await form.getByRole('button',{name:'Back',exact:true}).click();
 await chooser.locator('[data-coco-direction-id="bad-girls"]').getByRole('button',{name:'Choose this direction',exact:true}).click();
 assert.equal(await page.getByTestId('coco-build-brief-entryFee-line-1').inputValue(),'30');
 assert.equal(await page.getByTestId('coco-build-brief-djs-line-2').inputValue(),'dj orbit');
 await page.getByTestId('coco-build-finish').click();
 await page.getByTestId('coco-quick-brief-fields').waitFor({timeout:120000});
 for(const format of ['square','story']){
  await page.getByTestId(`coco-quick-format-${format}`).click();
  await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
  await page.waitForTimeout(2000);await page.evaluate(()=>document.fonts.ready);
  const root=page.locator('#artboard');
  for(const [id,text] of Object.entries({mood:'MUSIC\nPEOPLE\nSTYLE\nGOOD\nVIBES',motto:'Same\nEnergy\nDifferent\nLevel',presents:'PRESENTS',entry:'TICKETS $30',contact:'RSVP 555 123 4567',age:'18+ EVENT',dj1:'DJ NOVA',dj2:'DJ ORBIT',tagline:'Sweet\nMusic',dressCode:'DRESS CODE:\nSMART & BOLD'}))assert.equal(await root.locator(`[data-coco-compiled-object="${id}"]`).getAttribute('data-coco-text-value'),text,`${format}/${id}`);
  await root.screenshot({path:`${out}/canvas-${format}.png`});
 }
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('coco-quick-save').click()]);await download.saveAs(`${out}/result.nflyer`);
 if(process.env.NF_COCO_BUILT_IN_EDIT==='1') await verifyCocoFineTuneText(page,{saved:JSON.parse(await readFile(`${out}/result.nflyer`,'utf8')),auditDir:out,cases:[['mood','MUSIC\nPEOPLE\nSTYLE\nGOOD\nTIMES'],['motto','Same\nEnergy\nHigher\nLevel'],['presents','INVITES YOU']]});
 assert.deepEqual(errors,[]);console.log('PASS default path, retained portrait, optional Custom controls, line validation, numeric labels, draft navigation, both canvases and save');
}catch(e){await page.screenshot({path:`${out}/failure.png`,fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(-14000));throw e}finally{await browser.close()}
