import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
const out=process.env.NF_OUTPUT_DIR || '/tmp/png-quick-edit-fixed';mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:{width:1500,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
// Isolated paid-account fixture; no real account or entitlement changes.
const env=readFileSync('.env.local','utf8');const url=env.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\s"']+)/m)?.[1];
const authKey=`sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
await c.addInitScript(({authKey})=>{for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');localStorage.setItem(authKey,JSON.stringify({access_token:'local-ui-test',refresh_token:'local-ui-test',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'local-ui-test',email:'local-ui-test@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));},{authKey});
const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>{console.log('dialog',d.message());d.accept();});
await p.route('**/auth/v1/**',r=>r.fulfill({json:{id:'local-ui-test',email:'local-ui-test@example.test'}}));
await p.route('**/api/auth/status',r=>r.fulfill({json:{status:'active',plan:'pro'}}));
await p.route('**/api/auth/profile-bootstrap',r=>r.fulfill({json:{ok:true}}));
await p.route('**/api/auth/starter-render',r=>r.fulfill({json:{ok:true,limit:2,used:0,remaining:2,blocked:false}}));
const owner=id=>p.locator(`#artboard [data-coco-compiled-object="${id}"]`);
const settle=async()=>{await p.getByLabel('Preparing flyer canvas',{exact:true}).waitFor({state:'hidden',timeout:120000});await p.evaluate(()=>document.fonts.ready);};
const clickOwner=async id=>{const o=owner(id);await o.scrollIntoViewIfNeeded();const point=await o.evaluate(el=>{const r=el.getBoundingClientRect();for(let y=Math.max(1,r.y+2);y<Math.min(innerHeight-1,r.bottom);y+=2)for(let x=Math.max(1,r.x+2);x<Math.min(innerWidth-1,r.right);x+=2)if(document.elementFromPoint(x,y)?.closest('[data-coco-compiled-object]')===el)return{x,y};return null;});assert.ok(point,`painted point: ${id}`);await p.mouse.click(point.x,point.y);};
const edit=async(panel,label,value)=>{const input=panel.locator('label').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('input[type=text]').first();await input.fill(String(value));await input.press('Enter');};
try{
await p.goto(`${process.env.NF_BASE_URL || 'http://localhost:3000'}/?guest=1`,{waitUntil:'domcontentloaded',timeout:120000});await p.getByRole('button').filter({hasText:'Create with Coco'}).click({timeout:120000});await p.getByLabel('Event name',{exact:true}).fill('We Outside');await p.getByRole('button',{name:'Urban',exact:true}).click();await p.getByTestId('coco-build-event-next').click();
const chooser=p.getByTestId('coco-direction-chooser');await chooser.waitFor({timeout:120000});console.log('chooser ready');
const direction=chooser.locator('[data-coco-direction-id="we-outside"]');
while(!await direction.count()){const more=chooser.getByRole('button',{name:/more/i});console.log('load more',await more.count());assert.ok(await more.count(),'We Outside available');await more.click();await p.waitForTimeout(3000);}
await direction.getByRole('button',{name:'Choose this direction',exact:true}).click();await p.getByTestId('coco-build-details').waitFor();await p.getByTestId('coco-build-finish').click();await p.getByTestId('coco-quick-edit').waitFor({timeout:120000});await settle();console.log('built');
assert.ok(await p.getByTestId('coco-quick-replace-subject').isDisabled());
const beforeText=await p.locator('#artboard [data-coco-text-value]').evaluateAll(ns=>ns.map(n=>[n.dataset.cocoCompiledObject,n.dataset.cocoTextValue]));
const filePromise=p.waitForEvent('filechooser');await p.getByTestId('coco-quick-replace-scene').click();const picker=await filePromise;
await picker.setFiles('public/generated-flyers/assets/soft-life-Sq.jpg');
await p.waitForFunction(()=>document.querySelector('#artboard [data-coco-compiled-object="background"] img')?.getAttribute('src')?.startsWith('data:image/'),null,{timeout:60000});console.log('scene replaced');
assert.deepEqual(await p.locator('#artboard [data-coco-text-value]').evaluateAll(ns=>ns.map(n=>[n.dataset.cocoCompiledObject,n.dataset.cocoTextValue])),beforeText);
for(const fmt of ['square','story']){
await p.getByTestId(`coco-quick-format-${fmt}`).click();await settle();assert.ok(await p.getByTestId('coco-quick-replace-subject').isDisabled());assert.ok((await owner('background').locator('img').getAttribute('src')).startsWith('data:image/'));
await p.getByTestId('coco-quick-fine-tune').click();if(await p.getByTestId('coco-canvas-tools').isVisible())await p.getByTestId('coco-more-tools').click();
for(const [id,panelId,size,alpha] of [['headline','headline-panel',70,30],['script','head2-panel',44,45]]){
await clickOwner(id);const panel=p.locator('#'+panelId);const glyphPicker=panel.locator('[data-png-glyph-picker]');await glyphPicker.locator('summary').click();await glyphPicker.getByRole('button',{name:'Use Neon Green PNG lettering',exact:true}).click();await p.evaluate(()=>document.fonts.ready);await glyphPicker.locator('summary').click();
await edit(panel,'Size',size);await edit(panel,'Opacity',alpha);
await p.waitForFunction(({id,size,alpha})=>{const o=document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`);return o&&getComputedStyle(o).fontSize===`${size}px`&&Number(getComputedStyle(o).opacity)===alpha/100;},{id,size,alpha});
// Exercise pointer sliders as well as typed values.
const slider=panel.getByRole('slider',{name:'Size',exact:true});await slider.scrollIntoViewIfNeeded();let r=await slider.boundingBox();await p.mouse.move(r.x+r.width*.25,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width*.35,r.y+r.height/2,{steps:5});await p.mouse.up();await p.waitForTimeout(300);
const sliderValue=Number(await slider.inputValue());assert.equal(await owner(id).evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),sliderValue);assert.notEqual(sliderValue,size);await edit(panel,'Size',size);
const alphaSlider=panel.getByRole('slider',{name:'Opacity',exact:true});await alphaSlider.focus();await alphaSlider.press('Home');await p.waitForFunction(id=>getComputedStyle(document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)).opacity==='0',id);await edit(panel,'Opacity',alpha);
console.log(fmt,id,'size/opacity numeric and slider pass');
}
await p.locator('#artboard').screenshot({path:`${out}/${fmt}.png`});await p.getByTestId('coco-back-details').click();await p.getByTestId('coco-quick-edit').waitFor();
}
// Both formats retain changes after leaving and reopening the editor.
for(const fmt of ['square','story']){await p.getByTestId(`coco-quick-format-${fmt}`).click();await settle();for(const [id,size,alpha]of [['headline',70,.3],['script',44,.45]])assert.deepEqual(await owner(id).evaluate(el=>({size:parseFloat(getComputedStyle(el).fontSize),alpha:Number(getComputedStyle(el).opacity)})),{size,alpha});}
await p.getByTestId('coco-quick-fine-tune').click();if(await p.getByTestId('coco-canvas-tools').isVisible())await p.getByTestId('coco-more-tools').click();
const save=p.getByRole('button',{name:'Save Project File',exact:true});if(!await save.isVisible())await p.getByRole('button',{name:'▸ Project',exact:true}).click();
const downloaded=p.waitForEvent('download');await save.click();const savedPath=`${out}/roundtrip.nflyer`;await(await downloaded).saveAs(savedPath);
const saved=JSON.parse(readFileSync(savedPath,'utf8'));for(const fmt of ['square','story']){const v=saved.state.session[fmt];assert.equal(v.headManualPx,70);assert.equal(v.head2SizePx,44);assert.equal(v.textFx.alpha,.3);assert.equal(v.head2Alpha,.45);assert.ok(v.bgUploadUrl.startsWith('data:image/'));}
await p.locator('input[type=file][accept*=json]').setInputFiles(savedPath);await settle();
for(const fmt of ['Square','Story']){await p.getByRole('button',{name:fmt,exact:true}).first().click();await settle();for(const [id,size,alpha]of [['headline',70,.3],['script',44,.45]])assert.deepEqual(await owner(id).evaluate(el=>({size:parseFloat(getComputedStyle(el).fontSize),alpha:Number(getComputedStyle(el).opacity)})),{size,alpha});assert.ok((await owner('background').locator('img').getAttribute('src')).startsWith('data:image/'));}
console.log('save/reopen pass');
await p.getByTestId('coco-handoff-download').click();for(const fmt of ['Square','Story']){const img=p.getByAltText(`${fmt} export preview`,{exact:true});await img.waitFor({timeout:180000});const dimensions=await img.evaluate(async el=>{await el.decode();return[el.naturalWidth,el.naturalHeight];});assert.equal(dimensions[1]/dimensions[0],fmt==='Square'?1:1920/1080);const download=p.waitForEvent('download');await p.getByRole('button',{name:`Save ${fmt}`,exact:true}).click();await(await download).saveAs(`${out}/export-${fmt.toLowerCase()}.png`);console.log('export',fmt,dimensions);}
assert.deepEqual(errors,[]);console.log('PASS',out);
}catch(e){await p.screenshot({path:`${out}/failure.png`});console.error(e);console.log('errors',errors);process.exitCode=1;}finally{await b.close();}
