import {PORTRAIT_EDGE_FADE_STYLE,createPortraitEdgeTexture} from '../lib/coco/portraitEdgeFade.ts';
import {mockLocalFullStudio} from './lib/local-full-studio-fixture.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

// Local Full Studio fixture; no real quota or billing changes.
// Checks mask pixels, image transforms, actual PNG exports and project reload.
const out = '/tmp/portrait-edge-fade';
const projectPath = process.env.NF_YCEE_LIVE_IMPORT || 'public/generated-flyers/ycee-live.nflyer';
const baseUrl = process.env.NF_BASE_URL || 'http://localhost:3000';
const formats = (process.env.NF_YCEE_LIVE_FORMATS || 'square,story').split(',');
assert.ok(formats.length && formats.every(format => ['square', 'story'].includes(format)));
const source = JSON.parse(await readFile(projectPath, 'utf8'));
const sourceState = source.state ?? source;
const initialIds = ['presenter','presents','headline','subtitle','day','month','date','ordinal','doors','time','brandName','brandCity','motto','venue','address','contactLabel','contact','age'];
const initialMaps = Object.fromEntries(['square', 'story'].map(format => {
  const system = sourceState.session[format].cocoCompositionSystem;
  return [format, Object.fromEntries(system.compiledDocument.objects.filter(object => object.kind === 'text')
    .map(object => [object.id, system.compiledObjectOverrides?.[object.id]?.text ?? object.text ?? '']))];
}));
for (const format of formats) {
  assert.deepEqual(Object.keys(initialMaps[format]).sort(), initialIds.sort(), `${format}: expected independent text owners`);
}
await mkdir(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1500, height: 1200}, deviceScaleFactor: 2, serviceWorkers: 'block'});
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
await mockLocalFullStudio(context);
const page = await context.newPage();
const errors = [];
const report = {projectPath, formats, exports: [], roundtrip: [], errors};
if (process.env.NF_YCEE_LIVE_EXPORT_ACCESS_FIXTURE === '1') {
  // Local responses isolate renderer QA from guest account quota. This does not
  // change application entitlements or consume real quota; PNGs use the real UI.
  await page.route('**/api/auth/starter-render', route => route.fulfill({json: {ok: true, limit: 2, used: 0, remaining: 2, blocked: false}}));
  report.exportAccessFixture = 'Local starter-render response only; real export renderer under test.';
  console.log('EXPORT ACCESS FIXTURE: local responses only; real renderer and PNG files remain under test');
}
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const board = page.locator('#artboard');
const owner = id => board.locator(`[data-coco-compiled-object="${id}"]`);
const textMap = () => board.locator('[data-coco-text-value]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.cocoCompiledObject, node.dataset.cocoTextValue])));
const waitValue = (id, value) => page.waitForFunction(({id, value}) => document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value') === value, {id, value});

async function ready(format, expectedMap) {
  await page.getByRole('button', {name: format === 'square' ? 'Square' : 'Story', exact: true}).click();
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state: 'hidden', timeout: 120000});
  await page.evaluate(() => document.fonts.ready);
  // Require a stable canvas geometry and content across the format transition.
  await page.waitForFunction(({format, expectedMap}) => {
    const root = document.querySelector('#artboard');
    const bounds = root?.getBoundingClientRect();
    const current = root && Object.fromEntries([...root.querySelectorAll('[data-coco-text-value]')].map(node => [node.dataset.cocoCompiledObject, node.dataset.cocoTextValue]));
    const complete = bounds && (format === 'square' ? Math.abs(bounds.height / bounds.width - 1) < .01 : Math.abs(bounds.height / bounds.width - 16 / 9) < .01)
      && Object.entries(expectedMap).every(([id, value]) => current[id] === value)
      && Object.keys(current).length === Object.keys(expectedMap).length
      && [...root.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0)
      && ![...document.querySelectorAll('[aria-label="Preparing flyer canvas"]')].some(node => node.getClientRects().length)
      && document.fonts.status === 'loaded';
    const signature = complete ? JSON.stringify([format, bounds.x, bounds.y, bounds.width, bounds.height, current]) : '';
    if (!signature || window.__yceeLiveReadySignature !== signature) {
      window.__yceeLiveReadySignature = signature;
      window.__yceeLiveReadyAt = performance.now();
      return false;
    }
    return performance.now() - window.__yceeLiveReadyAt > 1800;
  }, {format, expectedMap}, {timeout: 120000});
  assert.deepEqual(await textMap(), expectedMap, `${format}: loaded wording`);
}

async function capture(name, publishFormat) {
  await board.scrollIntoViewIfNeeded();
  // Hide application chrome only for capture, including selection handles. Keep
  // controls intact for subsequent actual clicks and edits in this same context.
  const captureStyle = await page.addStyleTag({content: '#artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *,[data-floating-controls]{visibility:hidden!important} #artboard,#artboard [data-coco-compiled-active="true"]{border-radius:0!important}'});
  const ancestorStyles = await board.evaluate(node => {
    const styles = [];
    for (let parent = node; parent; parent = parent.parentElement) {
      styles.push(parent.style.borderRadius);
      parent.style.borderRadius = '0';
    }
    return styles;
  });
  await board.screenshot({path: `${out}/${name}.png`, animations: 'disabled'});
  if (publishFormat && process.env.NF_YCEE_LIVE_PUBLISH_PREVIEWS === '1') {
    await board.screenshot({path: `public/generated-flyers/ycee-live-${publishFormat}-preview.png`, animations: 'disabled'});
  }
  await board.evaluate((node, styles) => {
    let index = 0;
    for (let parent = node; parent; parent = parent.parentElement) parent.style.borderRadius = styles[index++];
  }, ancestorStyles);
  await captureStyle.evaluate(node => node.remove());
  console.log('ARTWORK READY FOR VISUAL REVIEW', name);
}

async function exportPng(format, stage) {
  const masterGrade = page.getByRole('button', {name: 'Master Grade', exact: true});
  if (await masterGrade.isVisible()) await masterGrade.click();
  const saveNotice = page.getByRole('button', {name: 'Dismiss save notice', exact: true});
  if (await saveNotice.isVisible()) await saveNotice.click();
  await page.getByRole('button', {name: 'PNG', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: 'PNG', exact: true}).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', {name: '4x', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: '4x', exact: true}).getAttribute('aria-pressed'), 'true');
  const exportButton = page.getByRole('button', {name: 'Export', exact: true});
  assert.equal(await exportButton.isDisabled(), false, 'Export QA requires export access (or the isolated quota response fixture)');
  await exportButton.click();
  const preview = page.getByAltText('Export preview', {exact: true});
  await preview.waitFor({timeout: 180000});
  const artifact = await preview.evaluate(async img => {
    await img.decode();
    const blob = await (await fetch(img.src)).blob();
    return {width: img.naturalWidth, height: img.naturalHeight, type: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer()))};
  });
  assert.equal(artifact.type, 'image/png');
  assert.equal(artifact.width, 2160, 'Master Grade PNG width');
  assert.equal(artifact.height, format === 'square' ? 2160 : 3840);
  const path = `${out}/export-${stage}-${format}.png`;
  await writeFile(path, Buffer.from(artifact.bytes));
  report.exports.push({format, stage, path, width: artifact.width, height: artifact.height});
  await page.getByRole('button', {name: 'Close export', exact: true}).click();
  console.log('EXPORT READY FOR VISUAL REVIEW', stage, format, artifact.width, artifact.height);
}


try {
  await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`, {waitUntil:'domcontentloaded', timeout:120000});
  await page.getByRole('heading',{name:'Where do you want to start?',exact:true}).waitFor({timeout:120000});
  await page.locator('.nf-startup-shell input[type=file]').setInputFiles(projectPath);
  await page.locator('.nf-startup-shell').waitFor({state:'hidden',timeout:120000});
  await board.waitFor({timeout:120000});
  const probe=await context.newPage();
  await probe.setContent('<html><body></body></html>');
  await probe.addScriptTag({path:'node_modules/html-to-image/dist/html-to-image.js'});
  const pixels=await probe.evaluate(async ({style,createTexture})=>{
    const root=document.createElement('div');root.style.cssText='width:100px;height:100px;background:rgb(255,0,255)';
    const subject=document.createElement('div');subject.style.cssText='width:100%;height:100%;background:white';Object.assign(subject.style,style);root.append(subject);document.body.append(root);
    try{
      const image=new Image();image.src=await htmlToImage.toPng(root,{skipFonts:true,pixelRatio:1});await image.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=100;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,100,100);
      const source=document.createElement('canvas');source.width=source.height=100;const sourceCtx=source.getContext('2d');sourceCtx.fillStyle='white';sourceCtx.fillRect(0,0,100,100);
      const texture=(0,eval)(`(${createTexture})`)(source,100,100);const tc=texture.getContext('2d');
      return {textureCenter:[...tc.getImageData(50,50,1,1).data],textureBottom:[...tc.getImageData(50,99,1,1).data],center:[...ctx.getImageData(50,50,1,1).data],bottom:[...ctx.getImageData(50,99,1,1).data],side:[...ctx.getImageData(0,50,1,1).data]};
    }finally{root.remove();}
  },{style:PORTRAIT_EDGE_FADE_STYLE,createTexture:createPortraitEdgeTexture.toString()});
  await probe.close();
  console.log('PNG PIXELS',pixels);
  assert.equal(pixels.textureCenter[3],255);assert.ok(pixels.textureBottom[3]<10);
  assert.equal(pixels.center[1],255,'portrait center stays opaque');
  assert.ok(pixels.bottom[1]<10,'PNG bottom fades to background');
  assert.ok(pixels.side[1]<25,'PNG sides fade to background');
  console.log('PNG PIXEL CHECK',pixels);

  const moreTools=page.getByRole('button',{name:'More tools',exact:true}).first();
  if(await moreTools.isVisible())await moreTools.click();
  // Resized and moved project exercises the persisted image transform, with
  // all four image edges now inside the canvas where abrupt edges are visible.
  const resized=structuredClone(source);
  function resizePortraits(value){
    if(!value || typeof value!=='object')return;
    if(['subject','ghost'].includes(value.cocoCompiledObjectId)){value.scale=.64;value.x=54;value.y=48;}
    for(const child of Object.values(value))resizePortraits(child);
  }
  resizePortraits(resized); // Include the portable project's per-layout snapshots.
  const fixturePath=`${out}/resized.nflyer`;
  await writeFile(fixturePath,JSON.stringify(resized));
  await page.getByRole('button',{name:'▸ Project',exact:true}).click();
  await page.locator('input[type=file][accept*=json]').setInputFiles(fixturePath);
  for(const format of formats){
    await ready(format,initialMaps[format]);
    const expectedWidth=sourceState.session[format].cocoCompositionSystem.compiledDocument.objects.find(o=>o.id==='subject').bounds.width*.64;
    await page.waitForFunction(width=>Math.abs(parseFloat(document.querySelector('#artboard [data-coco-compiled-object=subject]').style.width)-width)<.01,expectedWidth);
    for(const id of ['subject','ghost']){
      const mask=await owner(id).locator('[data-portrait-edge-fade]').evaluate(el=>({mask:getComputedStyle(el).maskImage, composite:getComputedStyle(el).maskComposite}));
      assert.match(mask.mask,/linear-gradient/); assert.match(mask.composite,/intersect/);
    }
    assert.equal(await owner('background').locator('[data-portrait-edge-fade]').count(),0);
    // Move using the actual canvas, then verify the fade stayed on the image.
    const before=await owner('subject').boundingBox();
    const point={x:before.x+before.width*.5,y:before.y+before.height*.3};
    await page.mouse.move(point.x,point.y);await page.mouse.down();
    await page.mouse.move(point.x+24,point.y+18,{steps:8});await page.mouse.up();
    await page.waitForTimeout(350);
    const after=await owner('subject').boundingBox();
    assert.ok(Math.abs(after.x-before.x)>5 || Math.abs(after.y-before.y)>5,'actual canvas drag moved portrait');
    await capture(`resized-moved-${format}`);
    await exportPng(format,'resized-moved');
    const back=page.getByRole('button',{name:'Back to Design',exact:true});if(await back.isVisible())await back.click();
    report.roundtrip.push({format,before,after});
  }
  const save=page.getByRole('button',{name:'Save Project File',exact:true});
  if(!await save.isVisible())await page.getByRole('button',{name:'▸ Project',exact:true}).click();
  const download=page.waitForEvent('download');await save.click();
  const savedPath=`${out}/roundtrip.nflyer`;await(await download).saveAs(savedPath);
  await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
  for(const format of formats){
    await ready(format,initialMaps[format]);
    const mask=await owner('subject').locator('[data-portrait-edge-fade]').evaluate(el=>getComputedStyle(el).maskImage);
    assert.match(mask,/linear-gradient/);
    const saved=JSON.parse(await readFile(savedPath,'utf8'));
    assert.equal((saved.state??saved).portraits[format].find(p=>p.cocoCompiledObjectId==='subject').scale,.64);
    await capture(`reopened-${format}`);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
  console.log('PASS portrait fades follow resizing, actual dragging, both PNG exports, and save/reopen');
} catch(error){await page.screenshot({path:`${out}/failure.png`,fullPage:true});console.log((await page.locator('body').ariaSnapshot()).slice(-9000));throw error;}
finally{await browser.close();}
