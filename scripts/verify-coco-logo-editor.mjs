import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
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
  await page.getByLabel('Event name',{exact:true}).fill('We Outside');
  await page.getByRole('button',{name:'Urban',exact:true}).click();
  await page.getByTestId('coco-build-event-next').click();
  const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
  const design=chooser.locator('[data-coco-direction-id="we-outside"]');
  for(let i=0;i<15&&!await design.count();i++){
    await chooser.getByTestId('coco-more-directions').click({timeout:120000});
    await page.getByText('Preparing more designs…',{exact:true}).waitFor({state:'hidden',timeout:120000});
  }
  await design.getByRole('button',{name:'Choose this design',exact:true}).click();
  const form=page.getByTestId('coco-build-details');await form.waitFor();

  let tested=false;
  for(let step=0;step<40;step++){
    const upload=form.getByLabel('Upload presenter logo');
    if(await upload.count()){
      assert.equal(await form.getByRole('slider',{name:'Logo size'}).count(),0);
      const png=await (await import('sharp')).default({create:{width:120,height:80,channels:4,background:{r:255,g:220,b:80,alpha:1}}}).png().toBuffer();
      await upload.setInputFiles({name:'test-logo.png',mimeType:'image/png',buffer:png});
      const slider=form.getByRole('slider',{name:'Logo size'});
      await slider.waitFor();
      const logo=form.locator('[data-coco-compiled-object="coco-presenter-logo"]');
      await logo.waitFor();
      const scale=async(value)=>{await slider.fill(String(value));await page.waitForTimeout(600);};
      for(const format of ['Square','Story']){
        await form.getByRole('button',{name:format,exact:true}).click();
        await scale(100);
        const a=await logo.boundingBox();await scale(50);const b=await logo.boundingBox();
        assert.ok(Math.abs(a.x+a.width/2-b.x-b.width/2)<1,JSON.stringify({format,a,b}));
        assert.ok(Math.abs(a.y+a.height/2-b.y-b.height/2)<1,JSON.stringify({format,a,b}));
        assert.ok(Math.abs(b.width/a.width-.5)<.02,JSON.stringify({format,a,b}));
        console.log(format,'center fixed; width halves',a,b);
        await form.screenshot({path:`/tmp/coco-logo-${format}.png`});
      }
      tested=true;
      await form.getByRole('button',{name:'Remove',exact:true}).click();
      await logo.waitFor({state:'detached'});
      assert.equal(await slider.count(),0);
      await upload.setInputFiles({name:'test-logo.png',mimeType:'image/png',buffer:png});
      await slider.waitFor();await scale(50);
      await form.getByRole('button',{name:'Skip',exact:true}).click();
      await form.locator('[data-coco-compiled-object="coco-presenter-logo"]').waitFor();
      console.log('Uploaded logo survives skipping presenter name');
      continue;
    }
    if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
    await form.getByTestId('coco-question-next').click();
  }
  assert.ok(tested,'Presenter upload available');
  const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
  for(const format of ['square','story']){
    await coco.getByTestId(`coco-conversation-format-${format}`).click();
    await coco.locator('[data-coco-compiled-object="coco-presenter-logo"]').waitFor();
  }
  await coco.getByRole('button',{name:'Event details',exact:true}).click();
  const review=coco.getByLabel('Review answers');
  for(const option of await review.locator('option').evaluateAll(els=>els.map(el=>el.value))){
    await review.selectOption(option);
    if(await coco.getByRole('slider',{name:'Logo size'}).count())break;
  }
  const slider=coco.getByRole('slider',{name:'Logo size'});
  assert.equal(await slider.inputValue(),'50');
  const logo=coco.locator('[data-coco-compiled-object="coco-presenter-logo"]');
  const before=await logo.boundingBox();
  await slider.fill('100');await page.waitForTimeout(600);
  const after=await logo.boundingBox();
  assert.ok(Math.abs(after.width/before.width-2)<.02);
  assert.ok(Math.abs(after.x+after.width/2-before.x-before.width/2)<1);
  assert.ok(Math.abs(after.y+after.height/2-before.y-before.height/2)<1);
  await coco.getByTestId('coco-conversation-format-square').click();
  await page.waitForTimeout(800);assert.equal(await slider.inputValue(),'50','Square unaffected by Story-only sizing');
  await coco.getByLabel('Apply adjustments to').selectOption('both');
  await slider.fill('75');await page.waitForTimeout(600);
  await coco.getByTestId('coco-conversation-format-story').click();
  await page.waitForTimeout(800);assert.equal(await slider.inputValue(),'75','Both formats resize');
  await coco.getByRole('button',{name:'Undo adjustment',exact:true}).click();
  await page.waitForTimeout(500);assert.equal(await slider.inputValue(),'100','Undo restores Story size');
  await coco.getByTestId('coco-conversation-format-square').click();
  await page.waitForTimeout(800);assert.equal(await slider.inputValue(),'50','Undo restores Square size');
  await coco.getByRole('button',{name:'Done',exact:true}).click();
  await coco.getByTestId('coco-conversation-open-editor').click();
  await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
  for(const f of ['Square','Story']){
    await page.getByRole('button',{name:f,exact:true}).first().click();
    await page.waitForFunction(f=>{const root=document.querySelector('#export-root');return root&&Math.abs(root.offsetHeight/root.offsetWidth-(f==='Story'?16/9:1))<.01;},f);
    await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
    const owner=page.locator('#artboard [data-coco-compiled-object="coco-presenter-logo"]');
    await owner.waitFor({timeout:10000});
    console.log('EDITOR LOGO',f,await owner.boundingBox());
    await page.screenshot({path:`/tmp/coco-logo-editor-${f}.png`});
  }
  console.log('Upload through editor passed',errors);
  assert.equal(errors.length,0);
}catch(e){await page.screenshot({path:'/tmp/coco-logo-editor-failure.png'});throw e;}finally{await browser.close();}
