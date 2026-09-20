import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';

const out='/tmp/whimsical-editor';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1300},reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{
  for(const key of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(key,'1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:3000/?studio=1&template=new-york&format=square',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByTestId('coco-canvas-tools').getByRole('button',{name:'More tools',exact:true}).click({timeout:120000});
  const project=page.getByRole('button',{name:'▸ Project',exact:true});
  if(await project.count())await project.click();
  await page.locator('input[type=file][accept*=json]').setInputFiles('public/generated-flyers/day-party.nflyer');
  await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:90000});
  for(const format of ['Square','Story']){
    await page.getByRole('button',{name:format,exact:true}).first().click();
    await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
    await page.waitForFunction(format=>{
      const root=document.querySelector('#export-root');
      return root&&Math.abs(root.offsetHeight/root.offsetWidth-(format==='Story'?16/9:1))<.01;
    },format);
    for(const [id,panel,placeholder,text] of [['headline','headline','ENTER HEADLINE...','Brunch'],['subtitle','head2','Optional sub-headline','Sunday']]){
      const owner=page.locator(`[data-coco-compiled-object="${id}"]`);
      await owner.evaluate(el=>el.click());
      const controls=page.locator(`#${panel}-panel`);
      await controls.locator('[data-floating-controls="fontpicker"]').first().getByRole('button').first().click();
      await page.getByRole('button',{name:/Script \/ Brush Accents/}).click();
      const option=page.getByRole('button',{name:'Whimsical SVG',exact:true});
      await option.screenshot({path:`${out}/${format}-${panel}-picker.png`});
      await option.click();
      await page.evaluate(()=>document.fonts.ready);
      const input=page.getByPlaceholder(placeholder,{exact:true});
      await page.evaluate(id=>{
        window.__whimsicalStates=[];
        window.__whimsicalObserver?.disconnect();
        window.__whimsicalObserver=new MutationObserver(()=>{
          const root=document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-word-run]`);
          if(!root)return;
          const word=root.getAttribute('aria-label'),ready=root.getAttribute('data-whimsical-settled');
          const last=window.__whimsicalStates.at(-1);
          if(last?.word===word&&last?.ready===ready)return;
          const r=root.querySelector('[data-whimsical-letters]')?.getBoundingClientRect();
          window.__whimsicalStates.push({word,ready,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null});
        });
        window.__whimsicalObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-whimsical-settled']});
      },id);
      for(const value of [text[0],text.slice(0,3),text]){
        await input.fill(value);
        await page.waitForFunction(({id,value})=>document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-svg-word]`)?.getAttribute('data-whimsical-svg-word')===value,{id,value});
      }
      await page.waitForFunction(id=>document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-word-run]`)?.getAttribute('data-whimsical-settled')==='true',id);
      const states=await page.evaluate(()=>window.__whimsicalStates);
      console.log('Typing states',format,panel,JSON.stringify(states));
      const pending=states.find(state=>state.word===text&&state.ready==='false');
      assert.ok(pending,'hide ornaments while typing');
      const before=pending.rect;
      assert.ok(await owner.locator('[data-whimsical-ornament]').count()>0,'ornaments appear after typing pause');
      const after=await owner.locator('[data-whimsical-letters]').boundingBox();
      for(const key of ['x','y','width','height'])assert.ok(Math.abs(before[key]-after[key])<.5,`stable letter ${key} while ornaments appear`);
      await page.evaluate(()=>document.fonts.ready);
      assert.match(await owner.evaluate(el=>getComputedStyle(el).fontFamily),/Whimsical SVG/);
      assert.equal(await owner.locator('[data-headline-shadow-glyph]').count(),0,'do not split word into decorated letter spans');
      const upper=controls.getByRole('button',{name:'Upper',exact:true});
      if(await upper.count())assert.notEqual(await upper.getAttribute('aria-pressed'),'true','preserve typed case on font selection');
      for(const [label,value] of [['Size',panel==='headline'?'66':'38'],['Spacing','0']]){
        const field=controls.locator('label').filter({hasText:new RegExp(`^${label}$`)}).locator('..').locator('input[type=text]').first();
        if(await field.count()){await field.fill(value);await field.press('Enter');}
      }
      const spacing=controls.locator('label').filter({hasText:/^Spacing$/}).locator('..').locator('input[type=text]').first();
      await spacing.fill('-0.25');await spacing.press('Enter');
      await page.waitForFunction(id=>!document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-ornament="bottom"]`),id);
      await spacing.fill('0');await spacing.press('Enter');
      await page.waitForFunction(id=>Boolean(document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-ornament]`)),id);
      const shadow=controls.getByRole('button',{name:'Shadow',exact:true});
      if(await shadow.count()){
        await shadow.click();
        assert.equal(await owner.locator('[data-headline-shadow-glyph]').count(),0,'shadow preserves word shaping');
      }
      if(panel==='headline')await input.fill('Brunch\nClub');
      await page.waitForFunction(id=>document.querySelector(`[data-coco-compiled-object="${id}"] [data-whimsical-word-run]`)?.getAttribute('data-whimsical-settled')==='true',id);
      await page.screenshot({path:`${out}/${format}-${panel}.png`});
      console.log('PASS',format,panel);
    }
  }
  const closedProject=page.getByRole('button',{name:'▸ Project',exact:true});
  if(await closedProject.count())await closedProject.click();
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Save Project File',exact:true}).click();
  const saved=await download;await saved.saveAs(`${out}/saved.nflyer`);
  const data=JSON.parse(readFileSync(`${out}/saved.nflyer`,'utf8'));
  for(const format of ['square','story']){
    assert.equal(data.state.session[format].headlineFamily,'Whimsical SVG');
    assert.equal(data.state.session[format].head2Family,'Whimsical SVG');
  }
  await page.locator('input[type=file][accept*=json]').setInputFiles(`${out}/saved.nflyer`);
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  for(const id of ['headline','subtitle'])assert.match(await page.locator(`[data-coco-compiled-object="${id}"]`).evaluate(el=>getComputedStyle(el).fontFamily),/Whimsical SVG/);
  assert.deepEqual(errors,[]);
  console.log('PASS save/reopen; no browser errors');
} catch(error) {
  await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});
  throw error;
} finally {await browser.close();}
