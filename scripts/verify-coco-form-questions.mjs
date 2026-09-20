import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {verifyCocoStyleControls} from './verify-coco-style-controls.mjs';
import {verifyCocoFineTuneText} from './verify-coco-fine-tune-text.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const out=process.env.NF_COCO_AUDIT_DIR || '/tmp/coco-form-questions';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for(const [recipe,eventName,field,owner,expected] of [['space-neon','Space Neon','entryFee','guest','DJ NIGHT\nSHIFT']]) {
  const context=await browser.newContext({viewport:{width:1500,height:1200},serviceWorkers:'block'});
  await context.addInitScript(()=>{for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.route('**/api/auth/starter-render',route=>route.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
  try {
   await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
   await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
   await page.getByLabel('Event name',{exact:true}).fill(eventName);
   await page.getByRole('button',{name:'Neon',exact:true}).click();
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
   const copy=await form.innerText();
   for(const label of ['Entry / ticket price','Social handle & website','Guest name','Promoter / crew'])assert.ok(copy.includes(label),label);
   for(const label of ['Short event details','RSVP / guest list number','Drink specials','Vibe & specials'])assert.ok(!copy.includes(label),label);
   const answers={performers:['DJ Night','Shift'],entryFee:['Entry','$20'],djs:['DJ Nova','DJ Kai','DJ Moon','DJ Star']};
   for(const [key,lines] of Object.entries(answers))for(const[index,value]of lines.entries())await form.getByTestId(`coco-build-brief-${key}-line-${index+1}`).fill(value);
   await form.getByTestId('coco-build-brief-recipe:contact').fill('@nightcrew, nightcrew.com');
   await form.getByTestId('coco-build-brief-presenterName').fill('Night Crew');
   await form.getByTestId('coco-build-brief-address').fill('123 Night Ave, Miami');
   await form.getByTestId('coco-build-brief-date').fill('Oct 24 2026');
   await form.evaluate(node=>node.scrollTo(0,0));await page.screenshot({path:`${out}/${recipe}-form-top.png`});
   await form.evaluate(node=>node.scrollTo(0,node.scrollHeight));await page.screenshot({path:`${out}/${recipe}-form-bottom.png`});
   await page.getByTestId('coco-build-finish').click();
   await page.getByTestId('coco-quick-brief-fields').waitFor({timeout:120000});
   for(const format of ['square','story']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForTimeout(1800);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator(`[data-coco-compiled-object="${owner}"]`).getAttribute('data-coco-text-value'),expected);
    assert.equal(await page.locator('[data-coco-compiled-object="offer"]').getAttribute('data-coco-text-value'),'ENTRY\n$20');
    assert.equal(await page.locator('[data-coco-compiled-object="guestLabel"]').getAttribute('data-coco-text-value'),'Special Guest');
    assert.equal(await page.locator('[data-coco-compiled-object="lineup"]').getAttribute('data-coco-text-value'),'DJ NOVA\nDJ KAI\nDJ MOON\nDJ STAR');
    await page.locator('#artboard').screenshot({path:`${out}/${recipe}-editor-${format}.png`});
   }
   const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('coco-quick-save').click()]);await download.saveAs(`${out}/${recipe}.nflyer`);
   await verifyCocoFineTuneText(page,{saved:JSON.parse(await readFile(`${out}/${recipe}.nflyer`,'utf8')),auditDir:out,cases:[['guest','DJ NOVA'],['guestLabel','Special Guest'],['presenter','NIGHT CREW'],['address','123 NIGHT AVE']]});
   await page.getByTestId('coco-quick-fine-tune').click();
   for(const format of ['square','story']) {
    await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();
    await page.waitForFunction(format=>{const b=document.querySelector('#artboard')?.getBoundingClientRect();return b && (format==='story'?b.height/b.width>1.7:Math.abs(b.height/b.width-1)<.05);},format);
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForTimeout(1500);
    for(const [panelId,title,field,value,ownerId] of [
     ['details2-panel','DJ Lineup','djLineupLabel','MUSIC BY','editor-djLineupLabel'],
     ['venue-panel','Venue','venue','CLUB NOVA','editor-venue'],
    ]) {
     const panel=page.locator(`#${panelId}`);
     const heading=panel.getByRole('button',{name:new RegExp(title)}).first();
     if(await heading.getAttribute('aria-expanded')!=='true')await heading.click();
     const input=field==='djLineupLabel'?panel.getByPlaceholder('MUSIC BY'):panel.locator('label').filter({hasText:/^Venue Name$/}).locator('..').locator('input').first();
     await input.fill(value);
     const node=page.locator(`#artboard [data-coco-compiled-object="${ownerId}"]`);
     await node.waitFor({state:'visible'});
     assert.equal(await node.getAttribute('data-coco-text-value'),value);
     assert.equal(await page.locator('#artboard [data-coco-compiled-object="address"]').getAttribute('data-coco-text-value'),'123 NIGHT AVE');
    }
    await verifyCocoStyleControls(page,format);
    await page.locator('#artboard').screenshot({path:`${out}/${recipe}-added-text-${format}.png`});
   }
   await page.getByRole('button',{name:'Quick Edit',exact:true}).click();
   const [editedDownload]=await Promise.all([page.waitForEvent('download'),page.getByTestId('coco-quick-save').click()]);
   await editedDownload.saveAs(`${out}/${recipe}-edited.nflyer`);
   const editedProject=JSON.parse(await readFile(`${out}/${recipe}-edited.nflyer`,'utf8'));
   for(const format of ['square','story'])for(const [id,text]of [['editor-venue','CLUB NOVA'],['editor-djLineupLabel','MUSIC BY']])
    assert.equal(editedProject.state.session[format].cocoCompositionSystem.compiledObjectOverrides[id].text,text);
   for(const format of ['square','story']) {
    const overrides=editedProject.state.session[format].cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(overrides['editor-venue'].size,16);
    assert.equal(overrides['editor-venue'].color,'#ffe066');
    assert.equal(overrides['editor-djLineupLabel'].backgroundColor,'#bc1456');
   }
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
