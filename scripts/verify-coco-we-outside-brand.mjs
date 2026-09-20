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
  let initials=false, name=false;
  for(let step=0;step<40;step++){
    if(process.env.NF_DETAILS==='1') {
      const slogan=form.getByTestId('coco-build-brief-subtitle');
      if(await slogan.count()) {
        for(const text of ['ABCDE','ABCDEF','Bad Gurlz']) {
          await slogan.fill(text);
          await page.waitForFunction(hidden=>Boolean(document.querySelector('[data-testid="coco-build-details"] [data-coco-compiled-object="weBadge"]'))!==hidden,text.length>5);
        }
      }
      const age=form.locator('[data-testid="coco-build-brief-ageRequirement"], [data-testid="coco-build-brief-ageRequirement-line-1"]');
      if(await age.count()) {
        assert.equal(await form.locator('[data-coco-compiled-object^="preview-circular_text_"]').count(),0);
        for(const text of ['21+','','21+']) {
          await age.fill(text);
          await page.waitForFunction(show=>Boolean(document.querySelector('[data-testid="coco-build-details"] [data-coco-compiled-object^="preview-circular_text_"]'))===show,Boolean(text));
        }
      }
    }
    const brand=form.getByTestId('coco-build-brief-recipe:brand');
    if(await brand.count()){await brand.fill('NC');initials=true;}
    const lines=form.locator('[data-testid^="coco-build-brief-presenterName-line-"]');
    if(await lines.count()){
      await lines.nth(0).fill('NOVA');await lines.nth(1).fill('CLUB');name=true;
    }
    if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
    await form.getByTestId('coco-question-next').click();
  }
  assert.ok(initials&&name,'separate form inputs');
  const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
  for(const format of ['square','story']){
    await coco.getByTestId(`coco-conversation-format-${format}`).click();
    await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
    const preview=coco.locator('[data-coco-personalized-preview]');
    assert.equal(await preview.locator('[data-coco-compiled-object="brand"]').textContent(),'NC');
    assert.match(await preview.locator('[data-coco-compiled-object="presenter"]').textContent(),/NOVA\s*CLUB/);
    if(process.env.NF_DETAILS==='1') {
      assert.equal(await preview.locator('[data-coco-compiled-object="weBadge"]').count(),0);
      assert.equal(await preview.locator('[data-coco-compiled-object^="preview-circular_text_"]').count(),1);
      await preview.screenshot({path:`/tmp/coco-we-details-preview-${format}.png`});
    }
  }
  await coco.getByTestId('coco-conversation-open-editor').click();
  await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
  const more=page.getByTestId('coco-canvas-tools').getByRole('button',{name:'More tools',exact:true});
  if(await more.isVisible())await more.click();
  if(process.env.NF_GRAB==='1') {
    const fixture=JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer','utf8'));
    for(const format of ['square','story']) {
      const v=fixture.state.session[format];
      for(const list of [v.portraits,v.emojiList,fixture.state.portraits?.[format]]) {
        for(const a of list??[])if(String(a.id).startsWith('circular_text_')){a.scale=.15;a.x=40;a.y=35;}
      }
    }
    writeFileSync('/tmp/coco-small-target-fixture.nflyer',JSON.stringify(fixture));
    const project=page.getByRole('button',{name:'▸ Project',exact:true});if(await project.count())await project.click();
    await page.locator('input[type=file]').setInputFiles('/tmp/coco-small-target-fixture.nflyer');
    await page.locator('#artboard [data-coco-compiled-object="headline"]').waitFor({timeout:120000});
  }
  for(const format of ['Square','Story']){
    await page.getByRole('button',{name:format,exact:true}).first().click();
    if(process.env.NF_GRAB==='1')await page.waitForFunction(format=>{
      const root=document.querySelector('#export-root');
      return root && Math.abs(root.offsetHeight/root.offsetWidth-(format==='Story'?16/9:1))<.01;
    },format);
    await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
    if(process.env.NF_GRAB==='1') {
      for(const selector of ['[data-coco-compiled-object="divider"]','[data-portrait-id^="circular_text_"]']) {
        const owner=page.locator(`#artboard ${selector}`).first();
        const grabId=await owner.locator('[data-small-grab-anchor="true"]').getAttribute('data-grab-target');
        const grab=page.locator(`[id="${grabId}"]`);
        await grab.waitFor({timeout:120000});await grab.scrollIntoViewIfNeeded();
        const pointHandle=await page.waitForFunction(selector=>{
          const anchor=document.querySelector(`#artboard ${selector} [data-small-grab-anchor="true"]`);
          const el=anchor&&document.getElementById(anchor.dataset.grabTarget);if(!el)return false;
          const b=el.getBoundingClientRect(),owner=(anchor.parentElement.querySelector('[data-hit-bounds="true"]')??anchor.parentElement).getBoundingClientRect();
          for(let y=b.y+2;y<b.bottom;y+=4)for(let x=b.x+2;x<b.right;x+=4){
            if(x>=owner.left&&x<=owner.right&&y>=owner.top&&y<=owner.bottom)continue;
            if(document.elementFromPoint(x,y)===el)return{x,y};
          }
          return false;
        },selector,{timeout:30000});
        const point=await pointHandle.jsonValue();
        const box=await grab.boundingBox();assert.ok(box.height>=35.5,`${format} usable grab height`);
        const before=await owner.boundingBox();
        await page.mouse.move(point.x,point.y);await page.mouse.down();
        await page.mouse.move(point.x+24,point.y+12,{steps:5});await page.mouse.up();
        await page.waitForFunction(({selector,x})=>document.querySelector(`#artboard ${selector}`).getBoundingClientRect().x>x+10,{selector,x:before.x});
        const moved=await owner.boundingBox();assert.ok(Math.abs(moved.width-before.width)<1,'painted width unchanged');
        await grab.focus();await grab.press('ArrowRight');
        await page.waitForFunction(({selector,x})=>document.querySelector(`#artboard ${selector}`).getBoundingClientRect().x>x+.1,{selector,x:moved.x});
        console.log('PASS grab and nudge',format,selector);
      }
      await page.locator('#artboard').screenshot({path:`/tmp/coco-small-grab-${format}.png`});
      continue;
    }
    const edits=process.env.NF_DETAILS==='1' ? [['we',null,'We'],['legal',null,'18+']] : [['brand','Brand initials','VX'],['presenter','Brand / venue name','VELVET\nROOM']];
    for(const [id,label,text] of edits){
      const object=page.locator(`#artboard [data-coco-compiled-object="${id}"]`);
      await object.scrollIntoViewIfNeeded();
      if(id==='legal') {
        await page.locator('#template-labels-panel').getByRole('button',{name:'18+',exact:true}).click();
      } else {
      // Use painted glyphs, since transparent object boxes can overlap.
      const pointHandle=await page.waitForFunction(id=>{
        const owner=document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`);
        if(!owner)return false;
        for(const glyph of owner.querySelectorAll('[data-text-hit-surface="true"]')){
          const b=glyph.getBoundingClientRect();
          for(let y=b.top;y<b.bottom;y+=2)for(let x=b.left;x<b.right;x+=2){const hit=document.elementFromPoint(x,y);if(hit&&owner.contains(hit))return{x,y};}
        }
        return false;
      },id,{timeout:120000});
      const point=await pointHandle.jsonValue();
      assert.ok(point,`${format} ${id} selectable`);await page.mouse.click(point.x,point.y);
      }
      let input=label ? page.getByRole('textbox',{name:label,exact:true}) : null;
      if(!input) {
        for(const field of await page.locator('textarea,input[type="text"]').all()) {
          if(await field.isVisible() && ['Bad Gurlz','21+','21'].includes(await field.inputValue())){input=field;break;}
        }
      }
      assert.ok(input,`${id} editor input`);
      await input.fill(text);
      await page.waitForFunction(({id,text})=>document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.textContent?.replace(/\s/g,'').includes(text.replace(/\s/g,'')),{id,text});
      if(process.env.NF_DETAILS==='1') {
        if(id==='we') {
          await page.locator('#artboard [data-coco-compiled-object="weBadge"]').waitFor();
          await input.fill('Bad Gurlz');
          await page.locator('#artboard [data-coco-compiled-object="weBadge"]').waitFor({state:'hidden'});
        } else {
          const ring=page.locator('#artboard [data-portrait-id^="circular_text_"]');
          await ring.first().waitFor();
          await input.fill('');await ring.first().waitFor({state:'hidden'});
          await input.fill('21+');await ring.first().waitFor();
        }
      }
      if(id==='brand'){
        const card=page.locator('[data-template-label-card="rightRail"]');
        const size=card.getByRole('slider',{name:'Size',exact:true});
        const originalSize=await size.inputValue();
        const fontSize=()=>object.evaluate(owner=>Math.max(...Array.from(owner.querySelectorAll('[data-text-hit-surface="true"]'),el=>parseFloat(getComputedStyle(el).fontSize))));
        const before=await fontSize();
        await size.focus();await size.press('Home');
        await page.waitForFunction(before=>{
          const owner=document.querySelector('#artboard [data-coco-compiled-object="brand"]');
          return owner&&Math.max(...Array.from(owner.querySelectorAll('[data-text-hit-surface="true"]'),el=>parseFloat(getComputedStyle(el).fontSize)))<before;
        },before);
        const sizeInput=card.locator('input[data-mobile-numeric-input="true"]').first();
        await sizeInput.fill(originalSize);await sizeInput.press('Tab');
      }
    }
    await page.locator('#artboard').screenshot({path:`/tmp/coco-we-${process.env.NF_DETAILS==='1'?'details-editor':'brand'}-${format}.png`});
  }
  assert.deepEqual(errors,[]);console.log(process.env.NF_GRAB==='1' ? 'PASS small canvas targets: drag and keyboard movement in both formats' : process.env.NF_DETAILS==='1' ? 'PASS We Outside slogan holder and age badge fill/clear in both formats, form and editor' : 'PASS We Outside brand form and canvas edits in both formats');
}catch(error){await page.screenshot({path:'/tmp/coco-we-brand-failure.png'});console.error(error);
if(process.env.NF_GRAB==='1')console.log(await page.locator('[data-small-asset-grab="true"]').evaluateAll(els=>els.map(el=>{
const b=el.getBoundingClientRect(),p=el.parentElement;return{id:p.dataset.cocoCompiledObject||p.dataset.portraitId,box:b.toJSON(),overflow:getComputedStyle(p).overflow,style:el.getAttribute('style'),hit:document.elementFromPoint(b.x+2,b.y+2)?.outerHTML.slice(0,250)};
})));
process.exitCode=1;}
finally{await browser.close();}
