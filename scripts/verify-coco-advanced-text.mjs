import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const mobile=process.env.NF_DEVICE==='mobile', out=process.env.NF_OUTPUT_DIR || (mobile?'/tmp/coco-advanced-text-mobile':'/tmp/coco-advanced-text');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1500,height:1100},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block',reducedMotion:process.env.NF_MOTION==='1'?'no-preference':'reduce'});
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
  const social=form.getByTestId('coco-build-brief-socialPlatforms');if(await social.count())for(const name of ['instagram','tiktok','x','whatsapp','youtube','twitch']){const button=social.getByRole('button',{name,exact:true});if(await button.getAttribute('aria-pressed')!=='true')await button.click();}
  if(step===0){await form.locator('[data-preview-ready="true"]').waitFor({timeout:120000});await page.waitForTimeout(700);await page.screenshot({path:`${out}/03-question.png`});assert.equal(await form.getByTestId('coco-build-brief-address').count(),0,'one question at a time');}
  if(step===1){await form.getByRole('button',{name:'← Back',exact:true}).click();assert.equal(await form.getByTestId('coco-build-brief-date').inputValue(),'Nov 7 2026');await form.getByTestId('coco-question-next').click();}
  if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}
  await form.getByTestId('coco-question-next').click();
 }
 const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});await coco.locator('[data-preview-ready="true"]').waitFor({timeout:120000});

 await page.waitForTimeout(700);
 await page.screenshot({path:`${out}/04-review.png`});
 const orb=coco.locator('.coco-conversation-orb');assert.ok(await orb.evaluate(el=>parseFloat(getComputedStyle(el).width)<=76));
 assert.equal(await coco.locator('h1').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 const editor=coco.getByTestId('coco-conversation-open-editor'), done=coco.getByRole('button',{name:'Looks good →',exact:true});
 assert.ok((await editor.boundingBox()).y<(await done.boundingBox()).y,'Open editor is above Looks good');
 if(process.env.NF_MOTION==='1'){const a=await orb.locator('img').evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(700);assert.notEqual(await orb.locator('img').evaluate(el=>getComputedStyle(el).transform),a,'orb rotates continuously');}
 await coco.getByRole('button',{name:'Color palette',exact:true}).click();
 const address=()=>coco.locator('[aria-label="Your live flyer"] [data-coco-compiled-object="address"]').evaluate(el=>getComputedStyle(el).color);
 const original=await address();
 await coco.getByLabel('Apply adjustments to',{exact:true}).selectOption('both');
 await coco.getByTestId('coco-conversation-palette-rose').click();assert.notEqual(await address(),original);
 await coco.getByTestId('coco-conversation-format-story').click();await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 assert.equal(await coco.getByTestId('coco-conversation-palette-rose').getAttribute('aria-pressed'),'true');
 assert.equal(await address(),'rgb(246, 228, 234)');
 const storyPreview=coco.locator('[aria-label="Your live flyer"]');
 const footer=await storyPreview.evaluate(root=>{
  const icons=[...root.querySelectorAll('[data-coco-compiled-object^="coco-form-social-"]')].filter(el=>el.dataset.cocoCompiledObject!=='coco-form-social-handle').map(el=>el.getBoundingClientRect());
  const canvas=root.querySelector('[data-coco-compiled-object="background"]')?.getBoundingClientRect();
  const handle=root.querySelector('[data-coco-compiled-object="handle"]')?.getBoundingClientRect();
  return {icons:icons.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height})),canvas:canvas?.toJSON(),handle:handle?.toJSON()};
 });
 console.log('Story footer bounds',JSON.stringify(footer));
 assert.equal(footer.icons.length,6);
 const left=Math.min(...footer.icons.map(b=>b.x)),right=Math.max(...footer.icons.map(b=>b.x+b.width));
 assert.ok(Math.abs((left+right)/2-(footer.handle.x+footer.handle.width/2))<2,'Story icons and handle share a center');
 assert.ok(footer.icons.every(b=>b.y+b.height< footer.handle.y+1),'Story handle sits beneath icons');
 await page.screenshot({path:`${out}/story-centered-footer.png`});
 await coco.getByTestId('coco-conversation-format-square').click();await page.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});
 await coco.getByRole('button',{name:'Undo adjustment',exact:true}).click();assert.equal(await address(),original);
 await coco.getByTestId('coco-conversation-palette-ice').click();
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/05-palette.png`});
 await coco.getByRole('button',{name:'Done',exact:true}).click();await coco.getByTestId('coco-conversation-open-editor').click();
 if(!mobile) await page.getByTestId('coco-more-tools').click();
 const templateCopy=await page.locator('#export-root [data-coco-compiled-object]').evaluateAll(els=>Object.fromEntries(els.filter(el=>el.dataset.cocoCompiledObject && !el.dataset.cocoCompiledObject.startsWith('user-text-')).map(el=>[el.dataset.cocoCompiledObject,el.textContent])));
 await page.getByTestId('coco-add-text').click();
 const input=mobile?page.locator('[data-floating-controls="text"] textarea').first():page.getByTestId('coco-canvas-text').filter({visible:true});
 const added=page.locator('#export-root [data-coco-compiled-object^="user-text-"]');
 assert.equal(await input.inputValue(),'','new details start empty');
 assert.equal(await input.getAttribute('placeholder'),'Your text');
 await input.pressSequentially('Dress Code:');await input.press('Enter');await input.pressSequentially('Sexy & Stylish');
 assert.equal(await input.inputValue(),'Dress Code:\nSexy & Stylish','typing never retains the placeholder');
 await added.filter({hasText:'Sexy & Stylish'}).waitFor();
 assert.equal((await added.first().textContent()).includes('Your text'),false);
 await input.fill('');
 assert.equal(await added.evaluateAll(els=>els.map(el=>el.textContent).join('').trim()),'','clearing details does not restore a prompt on the canvas');
 await input.pressSequentially('Guest list open');
 await added.filter({hasText:'Guest list open'}).waitFor({timeout:30000});
 const controls=mobile?page.locator('[data-floating-controls="text"]'):page.getByTestId('coco-added-text-controls').filter({visible:true});
 if(!mobile){
  assert.equal(await controls.getAttribute('data-editor-mode'),'advanced');
  assert.equal(await page.locator('#details-panel').getByText('Event Details',{exact:true}).count(),0);
  assert.equal(await page.locator('#details-panel').getByText('More details',{exact:true}).count(),1);
  assert.equal(await input.evaluate(el=>document.activeElement===el),true,'new text receives focus');
  await controls.locator('[data-added-control="size"] input[type="text"]').fill('30');
  await controls.locator('[data-added-control="size"] input[type="text"]').press('Tab');
 }
 const fontButton=controls.getByRole('button',{name:mobile?'Choose font':'Font',exact:true});
 assert.equal((await fontButton.textContent()).trim(),'Arial','closed picker shows only the font name');
 await fontButton.click();
 const choices=page.locator('[aria-label="Font choices"]');
 await choices.getByRole('button').filter({hasText:'Club / Poster Headlines'}).click();
 const fontPreview=choices.locator('[data-font-preview="Bebas Neue"]');
 assert.equal(await fontPreview.textContent(),'Guest list open');
 assert.ok(await fontPreview.evaluate(el=>getComputedStyle(el).fontFamily.includes('Bebas Neue')));
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await fontPreview.evaluate(el=>document.fonts.check(`20px ${getComputedStyle(el).fontFamily}`,el.textContent)),true,'preview font loaded');
 await page.screenshot({path:`${out}/font-previews.png`});
 await choices.getByRole('button',{name:'Bebas Neue',exact:true}).click();
 assert.equal((await fontButton.textContent()).trim(),'Bebas Neue','selected font remains name-only');
 if(mobile) await controls.getByRole('button',{name:'More',exact:true}).click();
 const appearance=controls.getByTestId('coco-added-text-appearance');
 for(const label of ['Bold','Italic','Upper'])await appearance.getByRole('button',{name:label,exact:true}).click();
 const setAppearance=async(key,value)=>{const field=appearance.locator(`[data-added-control="${key}"] input[type="text"]`);await field.fill(value);await field.press('Tab');};
 await setAppearance('shadow','3');await setAppearance('opacity','65');
 if(!mobile){
  await controls.getByLabel('Text color',{exact:true}).fill('#20e0ee');
  await page.locator('#details-panel').getByTitle('Align left',{exact:true}).click();
  for(const [key,value] of [['tracking','0.08'],['leading','1.5'],['rotation','8']]){const field=controls.locator(`[data-added-control="${key}"] input[type="text"]`);await field.fill(value);await field.press('Tab');}
 }
 const style=await added.first().evaluate(el=>{const s=getComputedStyle(el);return{size:s.fontSize,weight:s.fontWeight,italic:s.fontStyle,uppercase:s.textTransform,opacity:s.opacity,family:s.fontFamily,line:s.lineHeight,tracking:s.letterSpacing,transform:s.transform,shadow:[el,...el.querySelectorAll('*')].map(e=>getComputedStyle(e).textShadow).find(v=>v!=='none')};});
 console.log('Added text appearance',style);
 assert.equal(style.weight,'700');assert.equal(style.italic,'italic');assert.equal(style.uppercase,'uppercase');assert.equal(style.opacity,'0.65');assert.ok(style.family.includes('Bebas Neue'));assert.ok(style.shadow.includes('12px'));
 if(!mobile){assert.equal(style.size,'30px');assert.equal(style.line,'45px');assert.equal(style.tracking,'2.4px');assert.notEqual(style.transform,'none');}
 await appearance.getByRole('button',{name:'Shadow',exact:true}).click();
 assert.equal(await added.first().evaluate(el=>[el,...el.querySelectorAll('*')].some(e=>getComputedStyle(e).textShadow!=='none')),false,'shadow toggle removes the actual shadow');
 await appearance.getByRole('button',{name:'Shadow',exact:true}).click();
 await page.waitForTimeout(700);await page.screenshot({path:`${out}/06-added-text.png`});
 await page.getByTestId('coco-add-text').click();await input.fill('SECOND NOTE');
 assert.equal(await added.filter({hasText:'Guest list open'}).count(),1,'first added object keeps its wording');
 assert.equal(await added.filter({hasText:'SECOND NOTE'}).count(),1,'second added object edits independently');
 const currentCopy=await page.locator('#export-root [data-coco-compiled-object]').evaluateAll(els=>Object.fromEntries(els.filter(el=>el.dataset.cocoCompiledObject && !el.dataset.cocoCompiledObject.startsWith('user-text-')).map(el=>[el.dataset.cocoCompiledObject,el.textContent])));
 assert.deepEqual(currentCopy,templateCopy,'template text stays unchanged');
 await page.getByTestId('coco-remove-text').click();assert.equal(await added.count(),1,'remove only the newly added object');
 if(!mobile){
  await added.first().click({position:{x:20,y:15}});
  assert.equal(await input.inputValue(),'Guest list open','canvas reselection opens the added text');
  await page.getByTestId('coco-more-tools').click();
  assert.equal(await input.inputValue(),'Guest list open','simple editor edits the same object');
 }

 await page.getByTestId('coco-back-details').click();await coco.waitFor();
 await coco.getByRole('button',{name:'Event details',exact:true}).click();await coco.getByLabel('Review answers',{exact:true}).selectOption({label:'Full address'});await coco.getByTestId('coco-quick-brief-address').fill('MIAMI FL 3305');await coco.getByRole('button',{name:'Done',exact:true}).click();
 await coco.locator('[aria-label="Your live flyer"] [data-coco-compiled-object^="user-text-"]').filter({hasText:'Guest list open'}).waitFor();
 const preserved=coco.locator('[aria-label="Your live flyer"] [data-coco-compiled-object^="user-text-"]');
 assert.equal(await preserved.evaluate(el=>getComputedStyle(el).opacity),'0.65','appearance survives form editing');
 assert.equal(await preserved.evaluate(el=>getComputedStyle(el).fontWeight),'700');
 console.log('PASS advanced appearance, font previews, independent objects and preservation after form edits');
 if(process.env.NF_SKIP_EXPORT!=='1'){
 await coco.getByRole('button',{name:'Looks good →',exact:true}).click();await coco.getByTestId('coco-conversation-ready').click();
 await coco.getByTestId('coco-conversation-export').click();const check=page.getByTestId('coco-finish-review');if(await check.isVisible()){while(await check.getByRole('button',{name:'Keep as is',exact:true}).count())await check.getByRole('button',{name:'Keep as is',exact:true}).first().click();await check.getByRole('button',{name:'Download Square + Story',exact:true}).click();}
 for(const f of ['Square','Story']){await page.getByAltText(`${f} export preview`,{exact:true}).waitFor({timeout:180000});const download=page.waitForEvent('download');await page.getByRole('button',{name:`Save ${f}`,exact:true}).click();await(await download).saveAs(`${out}/export-${f}.png`);}
 console.log('PASS both PNG exports');
 }
 assert.deepEqual(errors,[]);console.log('PASS zero page errors');
} catch(error){await page.screenshot({path:`${out}/failure.png`});console.error(error);console.log(errors);process.exitCode=1;}finally{await browser.close();}
