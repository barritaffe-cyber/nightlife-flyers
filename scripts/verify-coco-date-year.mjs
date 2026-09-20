import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out=process.env.NF_OUTPUT_DIR || '/tmp/coco-date-year';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1500,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
await context.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const verify=async(root,weekday)=>{await p.waitForFunction(({root,weekday})=>{const r=document.querySelector(root);return r?.querySelector('[data-coco-compiled-object="day"]')?.getAttribute('data-coco-text-value')?.toUpperCase()===weekday&&![...r.querySelectorAll('[data-coco-text-value]')].some(n=>/\b202[67]\b/.test(n.getAttribute('data-coco-text-value')||''));},{root,weekday});};
try{
 await p.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});await p.getByLabel('Event name',{exact:true}).fill('Aura');await p.getByRole('button',{name:'Elegant',exact:true}).click();await p.getByTestId('coco-build-event-next').click();
 const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});await chooser.locator('[data-coco-direction-id="aura"]').getByRole('button',{name:'Choose this direction',exact:true}).click({timeout:120000});
 const form=p.getByTestId('coco-build-details');await form.waitFor();for(const detail of await form.locator('details').all())if(!await detail.evaluate(e=>e.open))await detail.locator('summary').click();
 const date=form.getByTestId('coco-build-brief-date');await date.fill('Nov 7, 2026');await verify('[aria-label="Live flyer preview"]','SAT');assert.equal(await date.inputValue(),'Nov 7, 2026');
 await date.fill('Nov 7, 2027');await verify('[aria-label="Live flyer preview"]','SUN');assert.equal(await date.inputValue(),'Nov 7, 2027');
 for(const format of ['Square','Story']){await form.getByRole('button',{name:format,exact:true}).click();await verify('[aria-label="Live flyer preview"]','SUN');await p.screenshot({path:`${out}/preview-${format}.png`});}
 console.log('previews: year retained in input, weekday updates, no year paint');
 await form.getByTestId('coco-build-finish').click();await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});
 for(const format of ['square','story']){await p.getByTestId(`coco-quick-format-${format}`).click();await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});await verify('#artboard','SUN');await p.locator('#artboard').screenshot({path:`${out}/canvas-${format}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS editor Square/Story, zero page errors');
}catch(e){await p.screenshot({path:`${out}/failure.png`});console.error(e);console.log(errors);process.exitCode=1;}finally{await browser.close();}
