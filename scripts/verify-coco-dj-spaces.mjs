import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.NF_COCO_AUDIT_DIR || '/tmp/coco-dj-spaces';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for(const [recipe,eventName,field,owner,expected] of [['bad-girls','Bad Girls','djs','dj1','DJ NIGHT SHIFT']]) {
  const context=await browser.newContext({viewport:{width:1500,height:1200},serviceWorkers:'block'});
  await context.addInitScript(()=>{for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.route('**/api/auth/starter-render',route=>route.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
  try {
   await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
   await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
   await page.getByLabel('Event name',{exact:true}).fill(eventName);
   await page.getByRole('button',{name:'Urban',exact:true}).click();
   await page.getByTestId('coco-build-event-next').click();
   const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:180000});
   let card=chooser.locator(`[data-coco-direction-id="${recipe}"]`);
   for(let i=0;!await card.count()&&i<10;i++) {
    const more=chooser.getByRole('button',{name:/more/i});assert.ok(await more.count(),'matching recipe must be available');await more.first().click();await page.waitForTimeout(2500);
   }
   await card.getByRole('button',{name:'Choose this direction',exact:true}).click();
   const form=page.getByTestId('coco-build-details');await form.waitFor();
   await form.locator('details').evaluateAll(nodes=>nodes.forEach(node=>node.open=true));
   const inputs=form.locator(`input[data-testid="coco-build-brief-${field}"],textarea[data-testid="coco-build-brief-${field}"],input[data-testid^="coco-build-brief-${field}-line-"]`);
   assert.equal(await inputs.count(),2);
   for(const [index,name] of ['DJ Night Shift','DJ Good Vibes'].entries()) {
    const input=inputs.nth(index);await input.fill('');
    await input.pressSequentially('DJ',{delay:80});await input.press('Space');
    assert.equal(await input.inputValue(),'DJ ','space at the end must survive the controlled rerender');
    await input.pressSequentially(name.slice(3),{delay:80});
    assert.equal(await input.inputValue(),name,'multiword name typed naturally');
   }
   assert.equal(await inputs.first().inputValue(),'DJ Night Shift','typing the second DJ must preserve the first');
   await inputs.first().scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${recipe}-form.png`});
   await page.getByTestId('coco-build-finish').click();
   await page.getByTestId('coco-quick-brief-fields').waitFor({timeout:120000});
   for(const format of ['square','story']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForTimeout(1800);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator(`[data-coco-compiled-object="${owner}"]`).getAttribute('data-coco-text-value'),expected);
    assert.equal(await page.locator('[data-coco-compiled-object="dj2"]').getAttribute('data-coco-text-value'),'DJ GOOD VIBES');
    await page.locator('#artboard').screenshot({path:`${out}/${recipe}-editor-${format}.png`});
   }
   const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('coco-quick-save').click()]);await download.saveAs(`${out}/${recipe}.nflyer`);
   await page.getByTestId('coco-quick-master-grade').click();
   for(const format of ['square','story']) {
    await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForTimeout(1500);
    const notice=page.getByRole('button',{name:'Dismiss save notice',exact:true});if(await notice.isVisible())await notice.click();
    await page.getByRole('button',{name:'PNG',exact:true}).click();await page.getByRole('button',{name:'Export',exact:true}).click();
    const preview=page.getByAltText('Export preview',{exact:true});await preview.waitFor({timeout:180000});
    const artifact=await preview.evaluate(async img=>{await img.decode();const blob=await(await fetch(img.src)).blob();return {width:img.naturalWidth,height:img.naturalHeight,type:blob.type,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))}});
    assert.equal(artifact.type,'image/png');assert.equal(artifact.height/artifact.width,format==='square'?1:1920/1080);
    await writeFile(`${out}/${recipe}-export-${format}.png`,Buffer.from(artifact.bytes));
    await page.getByRole('button',{name:'Close export',exact:true}).click();
    console.log('EXPORTED',recipe,format,artifact.width,artifact.height);
   }
   assert.deepEqual(errors,[]);console.log('PASS',recipe,'form, preview, both canvases, save and PNG exports');
  } catch(error) {await page.screenshot({path:`${out}/${recipe}-failure.png`,fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(-10000));throw error;}
  finally {await context.close();}
 }
} finally {await browser.close();}
