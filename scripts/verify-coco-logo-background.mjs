import { chromium } from 'playwright';
import { expect } from '@playwright/test';
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


  for(let step=0;step<40&&!await form.getByLabel('Upload presenter logo').count();step++)await form.getByTestId('coco-question-next').click();
  const upload=form.getByLabel('Upload presenter logo');await upload.waitFor({state:'attached'});
  const sharp=(await import('sharp')).default;
  const makeLogo=async(bg,format)=>sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect width="200" height="160" fill="${bg}"/><rect x="5" y="5" width="2" height="2" fill="${bg==='white'?'#d3d3d3':'#36cc8c'}"/><rect x="35" y="25" width="130" height="110" rx="8" fill="#123968"/><path d="M60 55h20v50H60zm40 0h40v12h-25v10h20v12h-20v16h-15z" fill="white"/></svg>`))[format]().toBuffer();
  const thumbnail=page.getByRole('img',{name:'Logo transparency preview',exact:true});
  const alpha=async()=>thumbnail.evaluate(async image=>{
    await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    return {corner:data[3],speck:data[(5*canvas.width+5)*4+3],inside:[...data.slice((65*canvas.width+65)*4,(65*canvas.width+65)*4+4)],width:canvas.width,height:canvas.height};
  });
  const waitClean=async()=>{
    await page.getByRole('button',{name:'Restore original',exact:true}).waitFor();
    await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent==='Removing background…'));
    const result=await alpha();assert.equal(result.corner,0);assert.equal(result.speck,0);assert.equal(result.inside[3],255);assert.ok(result.inside[0]>235);assert.equal(result.width,200);assert.equal(result.height,160);
  };
  const requestLog=[];page.on('request',r=>{if(/remove-bg|remove\.bg|imgly|background-removal-data/.test(r.url()))requestLog.push(r.url());});
  let original;
  for(const [format,bg] of [['jpeg','white'],['png','#19bb72']]){
    await upload.setInputFiles({name:`logo.${format}`,mimeType:`image/${format}`,buffer:await makeLogo(bg,format)});
    await thumbnail.waitFor();await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    original=await thumbnail.getAttribute('src');
    const logo=form.locator('[data-coco-compiled-object="coco-presenter-logo"]');
    await logo.waitFor();await form.getByRole('slider',{name:'Logo size'}).fill('50');await page.waitForTimeout(500);
    const before=await logo.boundingBox();
    await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Remove background',exact:true}).click();await waitClean();
    assert.ok((await thumbnail.getAttribute('src')).startsWith('data:image/png'));
    const after=await logo.boundingBox();assert.ok(Math.abs(before.x-after.x)<.1);assert.ok(Math.abs(before.width-after.width)<.1);
    for(const f of ['Square','Story']){
      await form.getByRole('button',{name:f,exact:true}).click();
      const src=await logo.locator('img').getAttribute('src');assert.equal(src,await thumbnail.getAttribute('src'));
    }
    await page.getByRole('slider',{name:'Background tolerance'}).fill('40');
    await page.waitForTimeout(800);await waitClean();
    const gaps=page.getByRole('checkbox',{name:'Clear enclosed gaps',exact:true});
    await gaps.check();
    await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    assert.equal((await alpha()).inside[3],bg==='white'?0:255,'Opt-in removes only enclosed background-colored pixels');
    await gaps.uncheck();
    await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    await waitClean();
    await form.screenshot({path:`/tmp/coco-logo-background-${format}.png`});
    await page.getByRole('button',{name:'Restore original',exact:true}).click();
    assert.equal(await thumbnail.getAttribute('src'),original);assert.equal((await alpha()).corner,255);
    assert.equal(await page.getByRole('slider',{name:'Logo size'}).inputValue(),'50');
    console.log(format,'transparent output, lettering preserved, center unchanged, tolerance and restore passed');
  }
  // Transparent uploads remain intact, with a useful explanation.
  await upload.setInputFiles({name:'transparent.png',mimeType:'image/png',buffer:await makeLogo('none','png')});
  await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Remove background',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'already has a transparent background'}).waitFor();
  assert.equal((await alpha()).corner,0);
  await upload.setInputFiles({name:'logo.jpg',mimeType:'image/jpeg',buffer:await makeLogo('white','jpeg')});
  await expect(page.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
    await page.getByRole('button',{name:'Remove background',exact:true}).click();await waitClean();
  for(let step=0;step<40;step++){
    if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
    await form.getByTestId('coco-question-next').click();
  }
  const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
  await coco.getByRole('button',{name:'Event details',exact:true}).click();
  const review=coco.getByLabel('Review answers');
  for(const option of await review.locator('option').evaluateAll(els=>els.map(el=>el.value))){
    await review.selectOption(option);if(await coco.getByRole('slider',{name:'Logo size'}).count())break;
  }
  for(const f of ['square','story']){
    await coco.getByTestId(`coco-conversation-format-${f}`).click();await waitClean();
    const logo=coco.locator('[data-coco-compiled-object="coco-presenter-logo"]');
    assert.equal(await logo.locator('img').getAttribute('src'),await thumbnail.getAttribute('src'));
  }
  await coco.getByLabel('Apply adjustments to').selectOption('both');
  await coco.getByRole('button',{name:'Restore original',exact:true}).click();assert.equal((await alpha()).corner,255);
  await coco.getByTestId('coco-conversation-format-square').click();assert.equal((await alpha()).corner,255);
  await coco.getByRole('button',{name:'Undo adjustment',exact:true}).click();await waitClean();
  await coco.getByTestId('coco-conversation-format-story').click();await waitClean();
  await coco.getByLabel('Apply adjustments to').selectOption('current');
  const gaps=coco.getByRole('checkbox',{name:'Clear enclosed gaps',exact:true});
  await gaps.check();await expect(coco.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();
  assert.equal((await alpha()).inside[3],0);
  await coco.getByTestId('coco-conversation-format-square').click();await expect(gaps).not.toBeChecked();await waitClean();
  await coco.getByTestId('coco-conversation-format-story').click();await expect(gaps).toBeChecked();
  await gaps.uncheck();await expect(coco.getByRole('button',{name:'Remove background',exact:true})).toBeEnabled();await waitClean();

  await coco.getByRole('button',{name:'Restore original',exact:true}).click();assert.equal((await alpha()).corner,255);
  await coco.getByRole('button',{name:'Remove background',exact:true}).click();await waitClean();
  await coco.getByRole('slider',{name:'Logo size'}).fill('75');await page.waitForTimeout(500);
  await coco.getByRole('button',{name:'Restore original',exact:true}).click();assert.equal((await alpha()).corner,255);
  assert.equal(await coco.getByRole('slider',{name:'Logo size'}).inputValue(),'75');
  await coco.getByTestId('coco-conversation-format-square').click();await waitClean();
  assert.equal(await coco.getByRole('slider',{name:'Logo size'}).inputValue(),'50');
  await coco.screenshot({path:'/tmp/coco-logo-background-quick.png'});
  assert.deepEqual(requestLog,[],'No background-removal API or model requests');
  assert.deepEqual(errors,[]);
  console.log('Form and Quick Edit, both formats, tolerance, enclosed-gap toggle, restore after resizing, scope and Undo passed. No paid API requests or page errors.');
}finally{await browser.close();}
