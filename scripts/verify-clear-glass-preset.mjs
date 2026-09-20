import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1200}});
await page.addInitScript(()=>{localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
try{
 await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('#artboard').waitFor({timeout:120000});
 await page.waitForTimeout(20000);
 for(const label of ['Choose Square format','Keep this layout']){const b=page.getByRole('button',{name:label,exact:true});if(await b.isVisible()){await b.click();await page.waitForTimeout(6000);}}
 const h=page.getByRole('button',{name:'▸ Headline',exact:true});if(await h.isVisible())await h.click();
 const glass=page.getByRole('button',{name:'Glass',exact:true});
 if(await glass.getAttribute('aria-pressed')==='true'){await glass.click();await page.waitForTimeout(500);}
 await glass.click();await page.waitForTimeout(1500);
 await page.getByRole('textbox',{name:'ENTER HEADLINE...',exact:true}).fill('LADIES');
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(2000);
 await mkdir('public/generated-flyers',{recursive:true});
 for(const format of ['square','story']){
  await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click();await page.waitForTimeout(20000);
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  const headlineSection=page.getByRole('button',{name:'▸ Headline',exact:true});
  if(await headlineSection.isVisible())await headlineSection.click();
  const g=page.getByRole('button',{name:'Glass',exact:true});
  if(await g.getAttribute('aria-pressed')==='true'){await g.click();await page.waitForTimeout(300);}
  await g.click();await page.waitForTimeout(800);
  await page.getByRole('textbox',{name:'ENTER HEADLINE...',exact:true}).fill('LADIES');
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  await page.waitForTimeout(5000);
  await page.waitForFunction(()=>document.querySelectorAll('[data-headline-layer^="headline-clear-glass-"]').length===9,{},{timeout:60000});
  assert.equal(await page.locator('[data-headline-layer^="headline-clear-glass-"]').count(),9);
  const specular=await page.locator('[data-headline-layer="headline-clear-glass-specular-streak"]').evaluate(el=>{
    const s=getComputedStyle(el);return {fill:s.webkitTextFillColor,mask:getComputedStyle(el.querySelector('[style*="mask-image"]')).maskImage,blend:s.mixBlendMode,background:s.backgroundImage};
  });
  assert.equal(specular.fill,'rgba(0, 0, 0, 0)');
  assert.equal(specular.background,'none');
  assert.equal(specular.blend,'screen');
  assert.match(specular.mask,/gradient/);
  assert.equal(await page.locator('filter#clear-glass-inner-shadow').count(),1);
  assert.equal(await page.locator('filter#clear-glass-inner-glow').count(),1);
  console.log(format,'nine glass layers; contour-only specular and inset filters verified');
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  for(let attempt=0;attempt<3;attempt++){try{await page.locator('#artboard').screenshot({path:`public/generated-flyers/clear-glass-${format}-editor.png`});break;}catch(e){if(attempt===2)throw e;await page.waitForTimeout(5000);}}
 }

}finally{await browser.close();}
