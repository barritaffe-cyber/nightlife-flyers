import {chromium} from 'playwright';
import {expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
const out='/tmp/coco-studio-pricing';mkdirSync(out,{recursive:true});
const base=process.env.NF_BASE_URL||'http://localhost:3000';
const env=readFileSync('.env.local','utf8');
const supabaseUrl=env.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\s"']+)/m)?.[1];
const authKey=`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
const browser=await chromium.launch({headless:true});
const results=[];
try{
 const pricing=await browser.newPage({viewport:{width:1280,height:1000}});
 const unauthorized=await pricing.request.post(`${base}/api/flyers/allowance`,{data:{action:'consume',projectId:'00000000-0000-4000-8000-000000000001'}});assert.equal(unauthorized.status(),401);
 await pricing.goto(`${base}/pricing`,{waitUntil:'networkidle',timeout:120000});
 for(const [plan,price] of [['basic',10],['full',15]]){
  const card=pricing.getByTestId(`pricing-${plan}`);await expect(card).toContainText(`$${price}`);await expect(card).toContainText('/ month');
  assert.equal(await card.getByRole('link').getAttribute('href'),`/billing/checkout?plan=${plan}&billing=monthly`);
 }
 for(const old of ['Event Pass','Weekend Pass','90 / month','180 / month','Yearly'])await expect(pricing.getByText(old,{exact:true})).toHaveCount(0);
 await pricing.screenshot({path:`${out}/pricing-desktop.png`,fullPage:true});
 await pricing.setViewportSize({width:390,height:844});await pricing.screenshot({path:`${out}/pricing-mobile.png`,fullPage:true});
 assert.equal(await pricing.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const [plan,name,price] of [['basic','Coco',10],['full','Coco + Studio',15]]){
  await pricing.goto(`${base}/billing/checkout?plan=${plan}&billing=monthly`,{waitUntil:'networkidle',timeout:120000});
  await expect(pricing.getByRole('heading',{name,exact:true})).toBeVisible();
  await expect(pricing.locator('body')).toContainText(`$${price}`);
  await expect(pricing.locator('body')).toContainText('every month');
 }
 await pricing.goto(`${base}/pricing`,{waitUntil:'networkidle'});
 await expect(pricing.getByTestId('pricing-one-flyer')).toContainText('$5');
 assert.equal(await pricing.getByTestId('pricing-one-flyer').getByRole('link').getAttribute('href'),'/billing/checkout?offer=one-flyer');
 await pricing.goto(`${base}/billing/checkout?offer=one-flyer`,{waitUntil:'networkidle'});
 await expect(pricing.getByRole('heading',{name:'One Flyer',exact:true})).toBeVisible();
 await expect(pricing.getByText('Recurring Payment Agreement',{exact:true})).toHaveCount(0);
 await pricing.goto(`${base}/contact?subject=Template%20request`,{waitUntil:'networkidle'});
 await expect(pricing.getByPlaceholder('What do you need help with?')).toHaveValue('Template request');
 await pricing.close();console.log('PRICING, CHECKOUT, REQUEST FORM AND UNAUTHENTICATED EXPORT PASS');
 for(const plan of (process.env.NF_PRICING_ONLY ? [] : ['basic','full','one_flyer'])){
  const context=await browser.newContext({viewport:{width:1500,height:1100},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.addInitScript(({authKey})=>{
   for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');
   sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
   localStorage.setItem(authKey,JSON.stringify({access_token:'local-ui-test',refresh_token:'local-ui-test',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'local-ui-test',email:'local-ui-test@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));
  },{authKey});
  const charged=new Set(); const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/auth/v1/**',r=>r.fulfill({json:{id:'local-ui-test',email:'local-ui-test@example.test'}}));
  await page.route('**/api/auth/status',r=>r.fulfill({json:{status:plan==='one_flyer'?'ondemand':'active',plan,generation_limit:plan==='full'?180:0,generation_used:0,generation_remaining:plan==='full'?180:0}}));
  await page.route('**/api/flyers/allowance',async r=>{
   const {action,projectId}=r.request().postDataJSON();
   assert.match(projectId,/^[0-9a-f-]{36}$/i);
   const allowed=charged.has(projectId)||charged.size<(plan==='one_flyer'?1:20);
   if(allowed&&action==='consume')charged.add(projectId);
   await r.fulfill({status:allowed?200:402,json:{allowed,monthly_remaining:plan==='one_flyer'?null:20-charged.size,credits:plan==='one_flyer'?1-charged.size:0,error:allowed?undefined:'Your flyer allowance is used.'}});
  });
  await page.route('**/api/auth/profile-bootstrap' ,r=>r.fulfill({json:{ok:true}}));
  await page.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
  // Suppress analytics only; no real subscription/account changes or payments.
  await page.route('**/api/analytics/**',r=>r.fulfill({json:{ok:true}}));
  try{
   await page.goto(`${base}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});
   await page.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});
   await page.getByLabel('Event name',{exact:true}).fill('We Outside');
   await page.getByRole('button',{name:'Urban',exact:true}).click();await page.getByTestId('coco-build-event-next').click();
   const chooser=page.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});
   const design=chooser.locator('[data-coco-direction-id="we-outside"]');
   for(let i=0;i<15&&!await design.count();i++){await chooser.getByTestId('coco-more-directions').click();await page.getByText('Preparing more designs…',{exact:true}).waitFor({state:'hidden',timeout:120000});}
   await design.getByRole('button',{name:'Choose this design',exact:true}).click();
   const form=page.getByTestId('coco-build-details');await form.waitFor();
   for(let i=0;i<40&&!await form.getByLabel('Upload presenter logo').count();i++)await form.getByTestId('coco-question-next').click();
   const logo=await sharp({create:{width:80,height:50,channels:4,background:'#ffffff'}}).png().toBuffer();
   await form.getByLabel('Upload presenter logo').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:logo});
   await expect(page.getByRole('img',{name:'Logo transparency preview'})).toBeVisible();
   await form.getByRole('slider',{name:'Logo size'}).fill('50');
   if(plan!=='one_flyer')await form.getByRole('checkbox',{name:'Remember my logo and venue details for next time'}).check();
   else await expect(form.getByRole('checkbox',{name:'Remember my logo and venue details for next time'})).toHaveCount(0);
   for(let i=0;i<40;i++){if(await form.getByTestId('coco-build-finish').count()){await form.getByTestId('coco-build-finish').click();break;}await form.getByTestId('coco-question-next').click();}
   if(plan!=='one_flyer')assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('coco-brand:local-ui-test')||'{}').presenterLogo),'brand remembers logo');
   const coco=page.getByTestId('coco-conversation');await coco.waitFor({timeout:120000});
   await expect(coco.getByRole('button',{name:'The photos',exact:true})).toHaveCount(plan==='full'?1:0);
   await expect(coco.getByRole('button',{name:'Color palette',exact:true})).toBeVisible();
   await coco.screenshot({path:`${out}/${plan}-coco.png`});
   if(plan==='full'){
    await coco.getByRole('button',{name:'The photos',exact:true}).click();
    const fc=page.waitForEvent('filechooser');await coco.getByRole('button',{name:'Change scene',exact:true}).click();
    await(await fc).setFiles('public/generated-flyers/assets/girl-code-square2.jpg');
    await expect(coco.getByRole('button',{name:'Done',exact:true})).toBeEnabled({timeout:120000});await coco.getByRole('button',{name:'Done',exact:true}).click();
   }
   await coco.getByRole('button',{name:/^Open editor/}).click();
   await page.locator('#artboard').waitFor();await page.evaluate(()=>document.fonts.ready);
   await page.getByRole('button',{name:'More tools',exact:true}).first().click();
   const head=page.locator('#artboard [data-coco-compiled-object="headline"]');await head.evaluate(el=>el.click());
   const text=page.getByPlaceholder('ENTER HEADLINE...',{exact:true});await text.fill('NIGHTS');
   await expect(head).toHaveAttribute('data-coco-text-value','NIGHTS');
   await expect(page.locator('#background-panel')).toBeVisible({visible:plan==='full'});
   if(plan!=='full'){
    await expect(page.locator('#portrait-panel')).toBeHidden();
    await expect(page.locator('#ai-background-panel')).toBeHidden();
   }
   await page.screenshot({path:`${out}/${plan}-editor.png`});
   if(plan!=='one_flyer'){
   await page.getByRole('button',{name:'▸ Project',exact:true}).click();
   const saved=page.waitForEvent('download');await page.getByRole('button',{name:'Save Project File',exact:true}).click();
   const savedPath=`${out}/${plan}.nflyer`;await(await saved).saveAs(savedPath);
   const sessions=JSON.parse(readFileSync(savedPath,'utf8')).state.session;
   for(const format of ['square','story']){assert.ok(sessions[format].cocoEventBrief?.presenterLogo,'logo survives save');assert.equal(Boolean(sessions[format].bgUploadUrl?.startsWith('data:image/')),plan==='full','only Full replaced the template background');}
   await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
   await expect(head).toHaveAttribute('data-coco-text-value','NIGHTS',{timeout:120000});
   }
   await page.getByTestId('coco-handoff-download').click();
   for(const fmt of ['Square','Story']){
    const img=page.getByAltText(`${fmt} export preview`,{exact:true});await img.waitFor({timeout:180000});
    const dim=await img.evaluate(async el=>{await el.decode();return[el.naturalWidth,el.naturalHeight];});
    assert.equal(dim[1]/dim[0],fmt==='Square'?1:1920/1080);
   }
   assert.equal(charged.size,1,'Square and Story consume one flyer');
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.getByTestId('coco-my-flyers').click();
   const library=page.getByRole('dialog',{name:'My flyers',exact:true});
   await expect(library.getByRole('button',{name:'Open',exact:true}).first()).toBeVisible({timeout:30000});
   if(plan==='one_flyer')await expect(library.getByRole('button',{name:'Duplicate',exact:true})).toHaveCount(0);
   else {
    await library.getByRole('button',{name:'Duplicate',exact:true}).first().click();
    await page.getByTestId('coco-handoff-download').click();
    await page.getByAltText('Story export preview',{exact:true}).waitFor({timeout:180000});
    assert.equal(charged.size,2,'Duplicate starts another flyer');
   }
   assert.deepEqual(errors,[]);results.push({plan,logo:true,copyEditing:true,roundtrip:plan!=='one_flyer',currentFlyerSaved:true,chargedProjects:charged.size,exports:['square','story'],errors});console.log('PASS',plan);
  }catch(e){await page.screenshot({path:`${out}/${plan}-failure.png`,fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(-7000));throw e;}
  finally{await context.close();}
 }
 if(results.length)writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
