import {chromium} from 'playwright';
import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
const mobile=process.env.NF_DEVICE==='mobile';const out=process.env.NF_OUTPUT_DIR || (mobile?'/tmp/coco-guide-mobile':'/tmp/coco-guide');mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
await c.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
try{
await p.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});await p.getByLabel('Event name',{exact:true}).fill('Slow Jamz');await p.getByRole('button',{name:'R&B / Lounge',exact:true}).click();await p.getByTestId('coco-build-event-next').click();const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});await chooser.locator('[data-coco-direction-id="slow-jamz"]').getByRole('button',{name:'Choose this direction',exact:true}).click({timeout:120000});
const form=p.getByTestId('coco-build-details');await form.waitFor();for(const d of await form.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
for(const [field,value]of [['venueName','VELVET ROOM'],['address','MIAMI, FL'],['socials','@slow_jamz']])await form.getByTestId(`coco-build-brief-${field}`).fill(value);
const platforms=form.getByTestId('coco-build-brief-socialPlatforms');for(const platform of ['instagram','tiktok','x','whatsapp'])await platforms.getByRole('button',{name:platform,exact:true}).click();
await form.getByTestId('coco-build-finish').click();await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});
const quick=p.getByTestId('coco-quick-edit');
for(const d of await quick.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
const guide=p.getByTestId('coco-guide');
const size=async()=>Number(await quick.locator('[data-coco-quick-size-object="headline"] input[type=text]').inputValue());
const switchTo=async f=>{await p.getByTestId(`coco-quick-format-${f}`).click();await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});};
const base={};for(const f of ['square','story']){await switchTo(f);base[f]=await size();}await switchTo('square');
await guide.getByTestId('coco-guide-adjust').click();assert.ok(Math.abs(await size()-Math.round(base.square*1.1*10)/10)<.11);
await quick.getByTestId('coco-quick-brief-address').fill('MIAMI FL 3305');
await guide.getByTestId('coco-guide-undo').click();assert.equal(await size(),base.square);assert.equal(await quick.getByTestId('coco-quick-brief-address').inputValue(),'MIAMI FL 3305');
await guide.getByTestId('coco-guide-scope').selectOption('both');await guide.getByTestId('coco-guide-adjust').click();
for(const f of ['square','story']){await switchTo(f);assert.ok(Math.abs(await size()-Math.round(base[f]*1.1*10)/10)<.11);}
await guide.getByTestId('coco-guide-reset').click();assert.equal(await size(),base.story);await switchTo('square');assert.equal(await size(),base.square);
await p.locator('#artboard [data-coco-compiled-object="headline"]').click();assert.ok(await quick.isVisible());assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
await guide.getByTestId('coco-guide-details').click();await guide.getByTestId('coco-guide-adjust').click();await guide.getByTestId('coco-guide-undo').click();
await p.locator('#artboard [data-coco-compiled-object="coco-form-social-instagram"]').click();assert.equal(await guide.getByTestId('coco-guide-socials').getAttribute('aria-pressed'),'true');
await guide.getByTestId('coco-guide-photos').click();assert.ok(await quick.getByTestId('coco-quick-replace-scene').isVisible());
await guide.getByTestId('coco-guide-finish').click();const review=p.getByTestId('coco-finish-review');await review.waitFor();assert.ok((await review.innerText()).includes('date is blank'));
assert.equal(await review.getByRole('button',{name:'Download Square + Story',exact:true}).isEnabled(),false);
await p.screenshot({path:`${out}/finish-review.png`});
for(const choice of ['Leave blank','Keep as is'])while(await review.getByRole('button',{name:choice,exact:true}).count())await review.getByRole('button',{name:choice,exact:true}).first().click();
assert.equal(await review.getByRole('button',{name:'Download Square + Story',exact:true}).isEnabled(),true);
await review.getByRole('button',{name:'Back to Quick Edit',exact:true}).click();
await guide.getByTestId('coco-guide-finish').click();await review.waitFor();
await review.getByRole('button',{name:'Fix it',exact:true}).first().click();await quick.getByTestId('coco-quick-brief-date').fill('Nov 7 2026');
assert.ok(await quick.isVisible());assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
await guide.getByTestId('coco-guide-headline').click();await guide.scrollIntoViewIfNeeded();if(mobile){const mini=p.getByTestId('coco-guide-live-preview');await mini.locator('[data-preview-ready="true"]').waitFor({timeout:120000});const box=await mini.boundingBox();assert.ok(box.y>=60 && box.y+box.height<844);}
await p.screenshot({path:`${out}/guided-quick-edit.png`});
console.log('PASS guided actions, proportional scope, reset, undo, canvas selection, template controls, finish fix');
if(!process.env.NF_SKIP_EXPORT){await guide.getByTestId('coco-guide-finish').click();
// Some authored flourishes extend beyond their text boxes: explicit keep choices.
if(await review.isVisible()){while(await review.getByRole('button',{name:'Keep as is',exact:true}).count())await review.getByRole('button',{name:'Keep as is',exact:true}).first().click();await review.getByRole('button',{name:'Download Square + Story',exact:true}).click();}
for(const f of ['Square','Story']){await p.getByAltText(`${f} export preview`,{exact:true}).waitFor({timeout:180000});const dl=p.waitForEvent('download');await p.getByRole('button',{name:`Save ${f}`,exact:true}).click();await(await dl).saveAs(`${out}/export-${f}.png`);}}
assert.deepEqual(errors,[]);console.log(process.env.NF_SKIP_EXPORT?'PASS guided Quick Edit and explicit finish choices; zero errors':'PASS guided Quick Edit and both exports; zero errors');
}catch(e){await p.screenshot({path:`${out}/failure.png`});console.error(e);console.log(errors);process.exitCode=1;}finally{await b.close();}
