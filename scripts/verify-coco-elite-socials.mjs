import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1500,height:1100},reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{
  for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage(), errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
  await page.getByLabel('Event name',{exact:true}).fill('Ladies Night');
  await page.getByRole('button',{name:'Elegant',exact:true}).click();
  await page.getByTestId('coco-build-event-next').click();
  const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
  const design=chooser.locator('[data-coco-direction-id="elite-monday"]');
  for(let i=0;i<12&&!await design.count();i++){
    assert.equal(await chooser.getByTestId('coco-more-directions').count(),1,'Elite Monday must be offered');
    await chooser.getByTestId('coco-more-directions').click({timeout:120000});
    await page.getByText('Preparing more designs…',{exact:true}).waitFor({state:'hidden',timeout:120000});
  }
  await design.getByRole('button',{name:'Choose this design',exact:true}).click();
  const form=page.getByTestId('coco-build-details');await form.waitFor();
  let sawSocials=false, selectedCount=0, sawVenue=false, sawTime=false;
  for(let step=0;step<40;step++){
    const date=form.getByTestId('coco-build-brief-date');if(await date.count())await date.fill('Nov 7 2026');
    if(process.env.NF_VENUE_TIME==='1') {
      const venue=form.getByTestId('coco-build-brief-venueName');
      const time=form.getByTestId('coco-build-brief-startTime');
      if(await venue.count()) { sawVenue=true; await venue.fill('The Loft'); }
      if(await time.count()) {
        sawTime=true; await time.fill('8 PM');
        await page.waitForFunction(()=>document.querySelector('[data-testid="coco-build-details"] [data-coco-compiled-object="onwards"]')?.textContent==='ONWARDS');
        await time.fill('');
        await page.waitForFunction(()=>!document.querySelector('[data-testid="coco-build-details"] [data-coco-compiled-object="onwards"]')?.textContent?.trim());
        await time.fill('8 PM');
      }
    }
    const social=form.getByTestId('coco-build-brief-socialPlatforms');
    if(await social.count()){
      sawSocials=true;
      const choices=social.getByRole('button');
      selectedCount=await choices.count();
      for(const choice of await choices.all())if(await choice.getAttribute('aria-pressed')!=='true')await choice.click();
      await form.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
      await page.screenshot({path:'/tmp/coco-elite-social-form.png'});
    }
    if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
    await form.getByTestId('coco-question-next').click();
  }
  assert.ok(sawSocials,'form offers social platforms');
  if(process.env.NF_VENUE_TIME==='1')assert.ok(sawVenue&&sawTime,'form exposes separate Venue name and Start time fields');
  const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
  for(const format of ['square','story']){
    await coco.getByTestId(`coco-conversation-format-${format}`).click();
    await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
    const preview=coco.locator('[data-coco-personalized-preview]');
    if(process.env.NF_VENUE_TIME==='1') {
      assert.equal(await preview.locator('[data-coco-compiled-object="artist"]').textContent(),'THE LOFT');
      assert.equal(await preview.locator('[data-coco-compiled-object="onwards"]').textContent(),'ONWARDS');
      assert.equal((await preview.locator('[data-coco-compiled-object="time"]').textContent()).replace(/\s/g,''),'8PM');
      await preview.screenshot({path:`/tmp/coco-elite-venue-time-${format}.png`});
    }
    const icons=preview.locator('[data-coco-compiled-object^="coco-form-social-"] img');
    assert.equal(await icons.count(),selectedCount,'all selected platforms render');
    const boxes=await icons.evaluateAll(imgs=>imgs.map(img=>{const b=img.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};}));
    const root=await preview.boundingBox();
    assert.ok(boxes.every(b=>b.width/root.width<.04),'icons use the smaller visual size');
    if(format==='story')assert.ok(Math.abs((boxes[0].x+boxes.at(-1).x+boxes.at(-1).width)/2-(root.x+root.width/2))<2,'Story footer is centered');
    await preview.screenshot({path:`/tmp/coco-elite-social-${format}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS Elite Monday social form, all platforms, smaller icons, centered Story, zero page errors');
} catch(error){await page.screenshot({path:'/tmp/coco-elite-social-failure.png'});console.error(error);process.exitCode=1;}
finally{await browser.close();}
