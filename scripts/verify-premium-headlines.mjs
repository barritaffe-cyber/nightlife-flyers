import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1500,height:1100}});
await page.addInitScript(() => {
 localStorage.setItem('nf:onboarded:v1','1');localStorage.setItem('nf:pwa-install-ack:v1','1');localStorage.setItem('nf:saveNoticeDismissed','1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
await mkdir('public/generated-flyers/premium-headlines',{recursive:true});
try {
 await page.goto('http://localhost:3000/?guest=1&test=ladies-night&format=square',{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('#artboard').waitFor({timeout:120000});
 console.log('editor mounted');
 await page.waitForTimeout(25000);
 for (const name of ['Choose Square format','Keep this layout']) {
  const button=page.getByRole('button',{name,exact:true});if(await button.isVisible()){await button.click();await page.waitForTimeout(5000);}
 }
 const headline=page.getByRole('button',{name:'▸ Headline',exact:true});if(await headline.isVisible())await headline.click({noWaitAfter:true});
 const picker=page.locator('[data-headline-collection="desktop"]');
 await picker.waitFor({state:'visible',timeout:30000});
 const core=['Clean','Glass','Metal','3D','Neon','Outline','Stroke'];
 for(const name of core)assert.equal(await picker.getByRole('button',{name,exact:true}).count(),1);
 for(const name of ['Flat 3D','Pure 3D','Gold Block','Line','Miami Heat','Doodle','Neon Pulse','Neon Glow'])assert.equal(await picker.getByRole('button',{name,exact:true}).count(),0);
 console.log('curated picker verified');
 // Use a neutral letterform to compare materials, then verify it is retained.
 const fontPicker=picker.locator('xpath=..').locator('[data-floating-controls="fontpicker"]').first();
 await fontPicker.getByRole('button').first().click();
 await page.getByRole('button',{name:/Club \/ Poster Headlines/}).click();
 await page.getByRole('button',{name:/^Anton Aa/}).click();

 for(const name of [...core,'Halftone','Kinetic'].filter(name => !process.env.HEADLINE_PRESET || name === process.env.HEADLINE_PRESET)) {
  if(name==='Halftone')await picker.locator('summary').click();
  const button=picker.getByRole('button',{name,exact:true});await button.click();
  await page.waitForFunction(label=>[...document.querySelectorAll('[data-headline-collection="desktop"] button')].some(b=>b.textContent.trim()===label&&b.getAttribute('aria-pressed')==='true'),name,{timeout:20000});
  await page.getByRole('textbox',{name:'ENTER HEADLINE...',exact:true}).fill('PREMIUM');
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
  if(name==='Metal')assert.equal(await page.locator('[data-headline-layer="headline-metal-edge-light"]').count(),1);
  if(name==='Metal' && process.env.VERIFY_METAL_BLUR) {
   const slider=page.getByRole('slider',{name:'Interior blur',exact:true});
   assert.equal(await slider.getAttribute('max'),'28');
   for(const value of [0,28]) {
    await slider.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);
    await page.waitForFunction(value=>{const blur=document.querySelector('[data-metal-interior-blur]');return value===0?Number(blur?.getAttribute('stdDeviation'))===0:Number(blur?.getAttribute('stdDeviation'))>0;},value);
    await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`public/generated-flyers/premium-headlines/metal-blur-${value}.png`});
   }
   assert.equal(await page.locator('[data-headline-layer="headline-metal-inner-bevel"]').getAttribute('filter'),null);
   console.log('Metal interior blur 0–28 updates the filter; bevel remains sharp');
  }
  if(name==='Metal' && process.env.VERIFY_METAL_SHINE) {
   const slider=page.getByRole('slider',{name:'Shine',exact:true});
   assert.equal(await slider.getAttribute('max'),'5');
   for(const value of [1,5]) {
    await slider.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);
    await page.waitForFunction(expected=>document.querySelector('[data-metal-shine-gain]')?.getAttribute('slope')===String(expected),value);
    await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`public/generated-flyers/premium-headlines/metal-shine-${value}.png`});
   }
   console.log('Metal Shine reaches 5 and updates rendered light gain');
  }
  if(name==='Glass')assert.equal(await page.locator('[data-headline-layer^="headline-clear-glass-"]').count(),9);
  await page.screenshot({clip:await page.locator('#artboard').boundingBox(),path:`public/generated-flyers/premium-headlines/${name.toLowerCase()}.png`});
  console.log(name,'selected and rendered');
 }
 const cards=[...core,'Halftone','Kinetic'].map(n=>`<figure><img src="${n.toLowerCase()}.png"><figcaption>${n}</figcaption></figure>`).join('');
 await writeFile('public/generated-flyers/premium-headlines/index.html',`<!doctype html><title>Coco headline collection</title><style>body{background:#101019;color:#eee;font:18px sans-serif;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}figure{margin:0}img{width:100%;display:block}figcaption{padding:12px}</style><h1>Coco headline collection</h1><main>${cards}</main>`);
} catch(error) {
 await page.screenshot({path:'public/generated-flyers/premium-headlines/failure.png',fullPage:true}).catch(()=>{});
 await writeFile('/tmp/premium-headline-failure.txt',await page.locator('body').ariaSnapshot().catch(()=>''));
 throw error;
} finally {await browser.close();}
