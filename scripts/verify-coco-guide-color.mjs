import {chromium} from 'playwright';
import assert from 'node:assert/strict';import {mkdirSync} from 'node:fs';
const mobile=process.env.NF_DEVICE==='mobile';const out=process.env.NF_OUTPUT_DIR || (mobile?'/tmp/coco-guide-color-mobile':'/tmp/coco-guide-color');mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
await c.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
try{
await p.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});await p.getByLabel('Event name',{exact:true}).fill('City Nights');await p.getByRole('button',{name:'Urban',exact:true}).click();await p.getByTestId('coco-build-event-next').click();const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});for(let i=0;i<20 && !await chooser.locator('[data-coco-direction-id="city-nights"]').count();i++){const more=p.getByTestId('coco-more-directions');if(!await more.count())break;await more.click();await p.waitForFunction(()=>!document.querySelector('[data-testid="coco-more-directions"]')?.disabled);}await chooser.locator('[data-coco-direction-id="city-nights"]').getByRole('button',{name:'Choose this direction',exact:true}).click({timeout:120000});
const form=p.getByTestId('coco-build-details');await form.waitFor();for(const d of await form.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
await form.getByTestId('coco-build-finish').click();await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});
const quick=p.getByTestId('coco-quick-edit');
for(const d of await quick.locator('details').all())if(!await d.evaluate(e=>e.open))await d.locator('summary').click();
const guide=p.getByTestId('coco-guide');
await guide.getByTestId('coco-guide-scope').selectOption('both');
const color=quick.getByTestId('coco-quick-color-headline');await color.fill('#00ff00');
for(const f of ['square','story']){
 await p.getByTestId(`coco-quick-format-${f}`).click();await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 assert.equal(await color.inputValue(),'#00ff00');
 assert.equal(await p.locator('#artboard [data-coco-compiled-object="headline"]').evaluate(el=>getComputedStyle(el).color),'rgb(0, 255, 0)');
 await p.locator('#artboard').screenshot({path:`${out}/color-${f}.png`});
}
await guide.getByTestId('coco-guide-undo').click();assert.notEqual(await color.inputValue(),'#00ff00');
assert.ok(await quick.isVisible());assert.equal(await p.locator('#right-controls-panel').isVisible(),false);
assert.deepEqual(errors,[]);console.log('PASS headline colors in both formats and Undo; zero errors');
}catch(e){await p.screenshot({path:`${out}/failure.png`});console.error(e);console.log(errors);process.exitCode=1;}finally{await b.close();}
