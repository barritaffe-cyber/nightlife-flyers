import {chromium} from 'playwright';
import {expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {mockLocalFullStudio} from './lib/local-full-studio-fixture.mjs';
const out='/tmp/flyers-hq-venues';await mkdir(out,{recursive:true});
const items=[['girl-code','recipe_girl_code','venue'],['girl-code-rose','recipe_girl_code_rose','venue'],['brunch-sundays','recipe_brunch_sundays','venue'],['punta-cana','recipe_punta_cana_sundays','venue'],['neon-night','recipe_neon_night_shift','presenter'],['i-love-thursday','recipe_i_love_thursday','city']];
const browser=await chromium.launch({headless:true});const report=[];
try{for(const [stem,key,role] of items.filter(item=>!process.env.NF_VENUE_ONLY||process.env.NF_VENUE_ONLY.split(',').includes(item[0]))){
 const context=await browser.newContext({viewport:{width:1500,height:1200},deviceScaleFactor:2,reducedMotion:'reduce',serviceWorkers:'block'});
 await mockLocalFullStudio(context);
 await context.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://localhost:3000/?studio=1&coco=1&cocoDesign=${key}`,{waitUntil:'domcontentloaded',timeout:120000});
 const board=page.locator('#artboard');
 for(const format of ['square','story']){
  await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).click({timeout:120000});
  const venue=board.locator(`[data-coco-compiled-object="${role}"]`);
  await expect(venue).toHaveAttribute('data-coco-text-value',stem==='i-love-thursday'?'The Playground':stem==='punta-cana'?'FUEGO':/flyers\s*(?:\\n)?\s*hq/i,{timeout:120000});
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state:'hidden',timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  await board.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
  await page.waitForFunction(format=>{
    const root=document.querySelector('#artboard');const rect=root?.getBoundingClientRect();
    const complete=rect&&Math.abs(rect.height/rect.width-(format==='story'?16/9:1))<.01
      &&!root.innerText.includes('Preparing')&&document.fonts.status==='loaded'
      &&[...root.querySelectorAll('img')].every(img=>img.complete&&img.naturalWidth>0);
    const signature=complete?`${format}:${rect.width}:${rect.height}:${root.innerText}`:'';
    if(!signature||window.__venueReady!==signature){window.__venueReady=signature;window.__venueReadyAt=performance.now();return false;}
    return performance.now()-window.__venueReadyAt>2200;
  },format,{timeout:120000});
  await page.addStyleTag({content:'#artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *,[data-floating-controls]{visibility:hidden!important} #artboard,#artboard [data-coco-compiled-active="true"]{border-radius:0!important}'});
  await board.screenshot({path:`${out}/${stem}-${format}.png`,animations:'disabled'});
  await board.screenshot({path:`public/generated-flyers/${stem}-${format}-preview.png`,animations:'disabled'});
  report.push({stem,format,text:await venue.getAttribute('data-coco-text-value'),errors});console.log('PASS',stem,format);
 }
 await context.close();
}await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));}finally{await browser.close();}
