import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const out='/tmp/coco-story-background';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1100},reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
const metrics=async locator=>{const result=await locator.evaluate(async img=>{await img.decode();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const s=getComputedStyle(img);return{src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,width:parseFloat(s.width),height:parseFloat(s.height),transform:s.transform,filter:s.filter};});return {...result,src:createHash('sha256').update(result.src).digest('hex')};};
try{
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
 await page.getByLabel('Event name',{exact:true}).fill('Ladies Night');await page.getByRole('button',{name:'Tropical',exact:true}).click();
 await page.getByTestId('coco-build-event-next').click();const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
 const design=chooser.locator('[data-coco-direction-id="brunch-saturday"]');
 for(let i=0;i<12&&!await design.count();i++){await chooser.getByTestId('coco-more-directions').click({timeout:120000});await page.getByText('Preparing more designs…',{exact:true}).waitFor({state:'hidden',timeout:120000});}
 await design.getByRole('button',{name:'Choose this design',exact:true}).click();
 const form=page.getByTestId('coco-build-details');await form.waitFor();
 await form.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
 assert.equal(await form.locator('[data-coco-preview-background="native"]').count(),0,'Square retains its authored compiled background');
 assert.ok((await metrics(form.locator('[data-coco-compiled-object="background"] img'))).loaded);
 await page.screenshot({path:`${out}/square-form.png`});
 await form.getByRole('button',{name:'Story',exact:true}).click();await form.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
 const saved=await metrics(form.locator('[data-coco-preview-background="native"] img'));
 assert.ok(saved.loaded);
 assert.equal(await form.locator('[data-coco-compiled-object="background"]').count(),0,'removed original background stays removed');
 await page.screenshot({path:`${out}/story-form.png`});console.log('PASS first-question Story background',saved);
 for(let step=0;step<40;step++){
  const date=form.getByTestId('coco-build-brief-date');if(await date.count())await date.fill('Nov 7 2026');
  if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
  await form.getByTestId('coco-question-next').click();
 }
 const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
 await coco.getByTestId('coco-conversation-format-story').click();await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
 assert.deepEqual(await metrics(coco.locator('[aria-label="Your live flyer"] [data-coco-preview-background="native"] img')),saved,'review preserves the same saved background');
 const expected=saved;
 await coco.getByTestId('coco-conversation-open-editor').click();
 await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 const editor=page.locator('#export-root [data-export-layer="background"] img');await editor.waitFor();await page.waitForTimeout(500);
 const canvas=await metrics(editor);assert.ok(canvas.loaded);assert.equal(canvas.src,expected.src);
 assert.ok(Math.abs(canvas.width-expected.width)<.1&&Math.abs(canvas.height-expected.height)<.1,'preview and canvas use the same fit');
 assert.equal(canvas.transform,expected.transform,'preview matches canvas pan and rotation');
 assert.equal(canvas.filter,expected.filter,'native background palette matches the preview');
 await page.screenshot({path:`${out}/story-editor.png`});console.log('PASS Story review/editor geometry');
 await page.getByTestId('coco-back-details').click();await coco.getByRole('button',{name:'Looks good →',exact:true}).click();await coco.getByTestId('coco-conversation-ready').click();
 await coco.getByTestId('coco-conversation-export').click();const check=page.getByTestId('coco-finish-review');if(await check.isVisible()){while(await check.getByRole('button',{name:'Keep as is',exact:true}).count())await check.getByRole('button',{name:'Keep as is',exact:true}).first().click();await check.getByRole('button',{name:'Download Square + Story',exact:true}).click();}
 for(const f of ['Square','Story']){await page.getByAltText(`${f} export preview`,{exact:true}).waitFor({timeout:180000});const download=page.waitForEvent('download');await page.getByRole('button',{name:`Save ${f}`,exact:true}).click();await(await download).saveAs(`${out}/export-${f}.png`);}
 assert.deepEqual(errors,[]);console.log('PASS Square/Story exports; zero page errors');
}catch(error){await page.screenshot({path:`${out}/failure.png`});console.error(error);console.log(errors);process.exitCode=1;}finally{await browser.close();}
