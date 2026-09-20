import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const mobile=process.env.NF_DEVICE==='mobile', out=process.env.NF_OUTPUT_DIR || (mobile?'/tmp/coco-orb-mobile':'/tmp/coco-orb');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:'reduce'});
await context.addInitScript(()=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
try {
 await page.goto('http://localhost:3000/?guest=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
 await page.getByLabel('Event name',{exact:true}).fill('Slow Jamz');await page.getByRole('button',{name:'R&B / Lounge',exact:true}).click();
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/01-event.png`});
 await page.getByTestId('coco-build-event-next').click();const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/02-designs.png`});await chooser.locator('[data-coco-direction-id="slow-jamz"]').getByRole('button',{name:'Choose this design',exact:true}).click();
 const form=page.getByTestId('coco-build-details');await form.waitFor();
 const answers={date:'Nov 7 2026',venueName:'VELVET ROOM',address:'MIAMI FL',socials:'@slow_jamz',musicPolicy:'R&B ONLY'};
 for(let step=0;step<60;step++){
  for(const [field,value]of Object.entries(answers)){const input=form.getByTestId(`coco-build-brief-${field}`);if(await input.count())await input.fill(value);}
  const social=form.getByTestId('coco-build-brief-socialPlatforms');if(await social.count())for(const name of ['instagram','youtube','twitch']){const button=social.getByRole('button',{name,exact:true});if(await button.getAttribute('aria-pressed')!=='true')await button.click();}
  if(step===0){await form.locator('[data-preview-ready="true"]').waitFor({timeout:120000});await page.waitForTimeout(700);await page.screenshot({path:`${out}/03-question.png`});assert.equal(await form.getByTestId('coco-build-brief-address').count(),0,'one question at a time');}
  if(step===1){await form.getByRole('button',{name:'← Back',exact:true}).click();assert.equal(await form.getByTestId('coco-build-brief-date').inputValue(),'Nov 7 2026');await form.getByTestId('coco-question-next').click();}
  if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
  await form.getByTestId('coco-question-next').click();
 }
 const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});
 console.log('event, design choice, sequential answers and creation pass');await page.waitForTimeout(700);await page.screenshot({path:`${out}/04-review.png`});
 assert.equal(await page.getByTestId('coco-guide').count(),0);assert.equal(await page.getByTestId('coco-quick-edit').count(),0);
 await coco.getByRole('button',{name:'The headline',exact:true}).click();
 const size=coco.locator('[data-coco-quick-size-object="headline"] input[type=text]');const before=Number(await size.inputValue());
 await coco.getByRole('button',{name:'A little bigger',exact:true}).click();assert.ok(Number(await size.inputValue())>before);
 await coco.getByRole('button',{name:'Undo adjustment',exact:true}).click();assert.equal(Number(await size.inputValue()),before);
 await coco.getByRole('button',{name:'That’s it',exact:true}).click();await coco.getByRole('button',{name:'Event details',exact:true}).click();
 await coco.getByLabel('Review answers',{exact:true}).selectOption({label:'Full address'});await coco.getByTestId('coco-quick-brief-address').fill('MIAMI FL 3305');await coco.getByRole('button',{name:'Done',exact:true}).click();
 await coco.getByRole('button',{name:'Looks good →',exact:true}).click();await coco.getByTestId('coco-conversation-ready').click();
 const currentFilter=()=>coco.locator('[aria-label="Your live flyer"] [data-coco-preview-artboard]').evaluate(el=>el.style.filter);
 const original=await currentFilter();await coco.getByTestId('coco-conversation-grade-noir').click();await page.waitForFunction(()=>document.querySelector('[data-testid="coco-conversation-grade-noir"]')?.getAttribute('aria-pressed')==='true');assert.notEqual(await currentFilter(),original);
 for(const f of ['story','square']){await coco.getByTestId(`coco-conversation-format-${f}`).click();await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});const filter=await currentFilter();console.log(f,filter);assert.equal(Number(filter.match(/saturate\(([^)]+)\)/)?.[1]),0,'Noir stays applied after changing format');}
 await coco.getByTestId('coco-conversation-grade-original').click();assert.equal(await currentFilter(),original);
 await coco.getByTestId('coco-conversation-grade-gold').click();
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/05-grade.png`});
 console.log('adjustment conversation, Undo and both-format color grading pass');
 await coco.getByTestId('coco-conversation-export').click();const check=page.getByTestId('coco-finish-review');if(await check.isVisible()){while(await check.getByRole('button',{name:'Keep as is',exact:true}).count())await check.getByRole('button',{name:'Keep as is',exact:true}).first().click();await check.getByRole('button',{name:'Download Square + Story',exact:true}).click();}
 for(const f of ['Square','Story']){await page.getByAltText(`${f} export preview`,{exact:true}).waitFor({timeout:180000});const download=page.waitForEvent('download');await page.getByRole('button',{name:`Save ${f}`,exact:true}).click();await(await download).saveAs(`${out}/export-${f}.png`);}
 assert.deepEqual(errors,[]);console.log('PASS orb conversation, live answers, adjustments, grading, both exports; no page errors');
} catch(error){await page.waitForTimeout(700);await page.screenshot({path:`${out}/failure.png`});console.error(error);console.log(errors);process.exitCode=1;}finally{await browser.close();}
