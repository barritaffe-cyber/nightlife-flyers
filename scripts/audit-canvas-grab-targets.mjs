import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1500,height:1500},reducedMotion:'reduce',serviceWorkers:'block'});
await context.addInitScript(()=>{
  for(const k of ['nf:pwa-install-ack:v1','nf:onboarded:v1','nf:saveNoticeDismissed','nightlife-flyers:coco-dismissed:v2','nightlife-flyers:coco-seen:v1'])localStorage.setItem(k,'1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1','1');
});
const page=await context.newPage(), errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:3000/?studio=1&template=new-york&format=square',{waitUntil:'domcontentloaded',timeout:120000});
  const more=page.getByTestId('coco-canvas-tools').getByRole('button',{name:'More tools',exact:true});
  await more.click({timeout:120000});
  const catalog=[...readFileSync('lib/coco/recipeCatalog.ts','utf8').matchAll(/^  ["']?([a-z][a-z0-9-]+)["']?:\s*\{/gm)].map(m=>m[1]);
  const paths=Object.fromEntries([...readFileSync('lib/coco/portableRecipeRuntime.ts','utf8').matchAll(/"([a-z0-9-]+)": "(\/generated-flyers\/[^"\n]+\.nflyer)"/g)].map(m=>[m[1],`public${m[2]}`]));
  const report=[];
  const ids=process.env.NF_AUDIT_IDS?.split(',')??catalog;
  for(const id of ids){
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].filter(b=>['Square','Story'].includes(b.textContent.trim())).every(b=>!b.disabled),null,{timeout:90000});
    const file=paths[id];assert.ok(file,`${id} portable project`);
    const state=JSON.parse(readFileSync(file,'utf8')).state;
    const project=page.getByRole('button',{name:'▸ Project',exact:true});if(await project.count())await project.click();
    await page.locator('input[type=file][accept*=json]').setInputFiles(file);
    for(const format of ['square','story']){
      await page.getByRole('button',{name:format==='square'?'Square':'Story',exact:true}).first().click();
      const variant=state.session[format];
      const first=(variant.portraits??[]).find(a=>a.cocoCompiledObjectId==='background')??variant.portraits?.[0];
      await page.waitForFunction(({format,first})=>{
        const root=document.querySelector('#export-root');
        return root && Math.abs(root.offsetHeight/root.offsetWidth-(format==='story'?16/9:1))<.01
          && (!first||document.querySelector(`#artboard [data-portrait-id="${CSS.escape(first)}"]`))
          && !document.querySelector('[aria-label="Preparing flyer canvas"]');
      },{format,first:first?.id},{timeout:90000});
      await page.waitForFunction(()=>[...document.querySelectorAll('button')].filter(b=>['Square','Story'].includes(b.textContent.trim())).every(b=>!b.disabled),null,{timeout:90000});
      await page.locator('#artboard').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>[...document.querySelectorAll('#artboard img')].every(img=>img.complete),null,{timeout:90000});
      // Allow image-load and ResizeObserver measurements to commit.
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const result=await page.locator('#artboard').evaluate(board=>{
        const reachable=[],blocked=[],missing=[],hiddenGrabs=[];
        for(const owner of board.querySelectorAll('[data-portrait-area="true"], [data-emoji-id]')){
          const anchor=owner.querySelector(':scope > [data-small-grab-anchor="true"]');
          if(!anchor)continue; // Locked/structural artwork intentionally has no target.
          const grab=document.getElementById(anchor.dataset.grabTarget);
          const b=grab?.getBoundingClientRect(),source=owner.querySelector('[data-hit-bounds="true"]')??owner,r=source.getBoundingClientRect();
          const id=owner.dataset.portraitId??owner.dataset.emojiId;
          if(Number(getComputedStyle(owner).opacity)<.01||Number(getComputedStyle(source).opacity)<.01){
            if(grab)hiddenGrabs.push(id);
            continue;
          }
          if(!b?.width||!b.height){if(r.width>0&&r.height>0&&(Math.max(r.width,r.height)<=96||Math.min(r.width,r.height)<18))missing.push(id);continue;}
          let point;
          for(let y=b.top+1;y<b.bottom&&!point;y+=4)for(let x=b.left+1;x<b.right;x+=4){if(document.elementFromPoint(x,y)===grab){point={x,y};break;}}
          (point?reachable:blocked).push({id,point:point??{x:b.x+b.width/2,y:b.y+b.height/2},w:b.width,h:b.height,...(!point?{box:b.toJSON(),hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.outerHTML.slice(0,350)}:{})});
        }
        return {reachable,blocked,missing,hiddenGrabs};
      });
      const row={id,format,...result};report.push(row);
      writeFileSync('/tmp/canvas-grab-audit.json',JSON.stringify(report,null,2));
      console.log(id,format,'reachable',result.reachable.length,'blocked',result.blocked.map(a=>a.id),'missing',result.missing);
      if(result.blocked.length)await page.screenshot({path:`/tmp/grab-blocked-${id}-${format}.png`});
      // Exercise one actual target on every format, not a manufactured fixture.
      for(const target of [...result.blocked,...result.reachable.slice(0,1)]){
        const owner=page.locator(`#artboard [data-portrait-id="${target.id}"],#artboard [data-emoji-id="${target.id}"]`).first();
        const before=await owner.boundingBox();
        if(result.blocked.includes(target)){
          const previousId=await owner.evaluate((el,point)=>{
            const grab=document.getElementById(el.querySelector('[data-small-grab-anchor]').dataset.grabTarget);
            const targets=document.elementsFromPoint(point.x,point.y).filter(e=>e.matches('[data-small-asset-grab="true"]'));
            return targets[(targets.indexOf(grab)-1+targets.length)%targets.length]?.id;
          },target.point);
          assert.ok(previousId,'overlapping target is in the top interaction layer');
          await page.locator(`[id="${previousId}"]`).focus();
          await page.keyboard.down('Alt');
        }
        await page.mouse.move(target.point.x,target.point.y);await page.mouse.down();await page.mouse.move(target.point.x+12,target.point.y+6,{steps:3});await page.mouse.up();
        await page.keyboard.up('Alt');
        await page.waitForFunction(({id,x})=>{
          const el=document.querySelector(`#artboard [data-portrait-id="${CSS.escape(id)}"],#artboard [data-emoji-id="${CSS.escape(id)}"]`);
          return el&&el.getBoundingClientRect().x>x+3;
        },{id:target.id,x:before.x},{timeout:10000});
        row.drag=true;
        target.drag=true;
      }
    }
  }
  writeFileSync('/tmp/canvas-grab-audit.json',JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);
  assert.equal(report.flatMap(r=>r.missing).length,0,'every small asset has a target');
  assert.equal(report.flatMap(r=>r.hiddenGrabs).length,0,'invisible artwork has no grab target');
  assert.equal(report.flatMap(r=>r.blocked).filter(t=>!t.drag).length,0,'coincident grab targets support Alt/Option dragging');
  console.log('PASS',report.length,'template formats');
}catch(e){console.error(e,errors);await page.screenshot({path:'/tmp/canvas-grab-audit-failure.png'});process.exitCode=1;}
finally{await browser.close();}
