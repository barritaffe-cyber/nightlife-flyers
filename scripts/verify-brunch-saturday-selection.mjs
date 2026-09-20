import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = '/private/tmp/brunch-saturday-verification';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:1});
await context.addInitScript(()=>{localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{
 if(message.type()==='error' && /maximum update depth|too many re-renders/i.test(message.text())) errors.push(message.text());
});
try{
 await page.goto(process.env.NF_VERIFY_URL||'http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 console.log(await page.locator('body').ariaSnapshot());
 await page.getByRole('button',{name:'DJ Night Flyer DJ Night Flyer Start',exact:true}).click({timeout:120000});
 await page.waitForTimeout(5000);
 await page.getByRole('button',{name:'▸ Project',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles('public/generated-flyers/brunch-saturday.nflyer');
 await page.locator('[data-coco-compiled-object="headline"]').waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(4000);

 await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
 const original = JSON.parse(await (await import('node:fs/promises')).readFile('public/generated-flyers/brunch-saturday.nflyer','utf8'));
 const texts=original.state.cocoCompositionSystem.compiledDocument.objects.filter(o=>o.kind==='text');
 for(const object of texts.filter(o=>!process.env.NF_SELECTION_IDS || process.env.NF_SELECTION_IDS.split(',').includes(o.id))){
  const node=page.locator(`[data-coco-compiled-object="${object.id}"]`);
  const hit=node.locator('[data-text-hit-surface="true"]').first();
  await hit.click({timeout:15000,noWaitAfter:true});
  assert.equal(await page.locator('[data-floating-controls="text"]').count(),0,'No extra desktop editor');
  const sidebar=page.locator('aside').first();
  const inputs=sidebar.locator('textarea:visible,input:visible');
  const clean=text=>text.replace(/\s/g,'');
  await page.waitForFunction(text=>[...document.querySelectorAll('aside:first-of-type textarea,aside:first-of-type input')].some(e=>e.getBoundingClientRect().width>0&&e.value.replace(/\s/g,'')===text.replace(/\s/g,'')),object.text);
  let editor;
  for(const candidate of await inputs.all())if(clean(await candidate.inputValue())===clean(object.text)){editor=candidate;break;}
  assert.ok(editor,`${object.id} opens its existing sidebar field`);
  console.log('MAPPED',object.id);
  if(!object.binding?.panel || object.semanticRole==='address'){
   const before=await editor.inputValue();
   await editor.fill(before+' TEST');
   await page.waitForFunction(({id,text})=>document.querySelector(`[data-coco-compiled-object="${id}"]`)?.textContent.replace(/\s/g,'').includes(text.replace(/\s/g,'')),{id:object.id,text:before+' TEST'});
   await editor.fill(before);
  }
 }
 await page.screenshot({path:`${out}/selection.png`});
 console.log('PASS: text objects map to existing sidebar controls; no desktop floating editor.',process.env.NF_SELECTION_IDS || 'all 16');
 assert.equal(errors.length,0,JSON.stringify(errors));
}catch(error){console.log(await page.locator('body').ariaSnapshot());await page.screenshot({path:`${out}/selection-failure.png`});throw error;}finally{await browser.close();}
