import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

// Isolated guest browser verifies real companion controls. Exports are checked
// separately by verify-soft-life.mjs; this script never changes source artwork.
const out = process.env.NF_SOFT_LIFE_CONTROLS_DIR || '/tmp/soft-life-typography';
const projectPath = process.env.NF_SOFT_LIFE_IMPORT || 'public/generated-flyers/soft-life.nflyer';
const baseUrl = process.env.NF_BASE_URL || 'http://localhost:3000';
const formats = (process.env.NF_SOFT_LIFE_FORMATS || 'square,story').split(',');
assert.ok(formats.length && formats.every(format => ['square', 'story'].includes(format)));
const source = JSON.parse(await readFile(projectPath, 'utf8'));
const sourceState = source.state ?? source;
const initialIds = ['presenter', 'presents', 'genres', 'headline', 'subtitle', 'day', 'month', 'date', 'time', 'tagline', 'djLabel', 'dj1', 'dj2', 'experience', 'entry', 'dressLabel', 'dress', 'venue', 'address', 'motto', 'badgeTitle', 'badgeCaption', 'signoff'];
const initialMaps = Object.fromEntries(['square', 'story'].map(format => {
  const system = sourceState.session[format].cocoCompositionSystem;
  return [format, Object.fromEntries(system.compiledDocument.objects.filter(object => object.kind === 'text')
    .map(object => [object.id, system.compiledObjectOverrides?.[object.id]?.text ?? object.text ?? '']))];
}));
for (const format of formats) {
  assert.deepEqual(Object.keys(initialMaps[format]).sort(), [...initialIds, 'detailsLabel'].sort(), `${format}: expected independent text owners`);
}
await mkdir(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1500, height: 1200}, deviceScaleFactor: 2, serviceWorkers: 'block'});
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage();
const errors = [];
const report = {projectPath, formats, controls: [], roundtrip: [], errors};
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {if(message.type()==='error' && /maximum update depth|too many re-renders|unhandled/i.test(message.text())) errors.push(message.text());});
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
    if (!signature || window.__softLifeReadySignature !== signature) {
      window.__softLifeReadySignature = signature;
      window.__softLifeReadyAt = performance.now();
      return false;
    }
    return performance.now() - window.__softLifeReadyAt > 1800;
  }, {format, expectedMap}, {timeout: 120000});
  assert.deepEqual(await textMap(), expectedMap, `${format}: loaded wording`);
}

async function capture(name) {
  await board.scrollIntoViewIfNeeded();
  // Hide application chrome only for capture, including selection handles. Keep
  // controls intact for subsequent actual clicks and edits in this same context.
  const captureStyle = await page.addStyleTag({content: 'body{visibility:hidden!important} #artboard,#artboard *{visibility:visible!important} #artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *,[data-floating-controls]{visibility:hidden!important} #artboard,#artboard [data-coco-compiled-active="true"]{border-radius:0!important}'});
  const ancestorStyles = await board.evaluate(node => {
    const styles = [];
    for (let parent = node; parent; parent = parent.parentElement) {
      styles.push(parent.style.borderRadius);
      parent.style.borderRadius = '0';
    }
    return styles;
  });
  await board.screenshot({path: `${out}/${name}.png`, animations: 'disabled'});
  await board.evaluate((node, styles) => {
    let index = 0;
    for (let parent = node; parent; parent = parent.parentElement) parent.style.borderRadius = styles[index++];
  }, ancestorStyles);
  await captureStyle.evaluate(node => node.remove());
  console.log('ARTWORK READY FOR VISUAL REVIEW', name);
}

async function selectText(id) {
  const target = owner(id);
  await target.scrollIntoViewIfNeeded();
  const bounds = await board.boundingBox();
  await page.mouse.click(bounds.x + 2, bounds.y + bounds.height - 2);
  // Click an exposed glyph hit surface, not a hidden owner box or a DOM handler.
  const points = await target.evaluate(element => [...element.querySelectorAll('[data-text-hit-surface="true"]')].flatMap(surface => {
    const bounds = surface.getBoundingClientRect();
    return [.3, .5, .7].flatMap(y => [.3, .5, .7].map(x => ({x: bounds.x + bounds.width * x, y: bounds.y + bounds.height * y})));
  }).filter(point => document.elementFromPoint(point.x, point.y)?.closest('[data-coco-compiled-object]') === element));
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    if (await target.getAttribute('data-active') === 'true') break;
  }
  assert.equal(await target.getAttribute('data-active'), 'true', `${id}: selection through visible type`);
}

async function editAndCheck(id, input, value) {
  const before = await textMap();
  await input.fill(value);
  await waitValue(id, value);
  const after = await textMap();
  for (const [siblingId, text] of Object.entries(before)) {
    assert.equal(after[siblingId], siblingId === id ? value : text, `${id}: preserves independent sibling ${siblingId}`);
  }
}

const targetId='dj2';
const panel=page.locator('#details2-panel');
const ownerStyles=()=>board.locator('[data-coco-text-value]').evaluateAll(nodes=>Object.fromEntries(nodes.map(el=>{
  const css=getComputedStyle(el);
  return [el.dataset.cocoCompiledObject,{text:el.dataset.cocoTextValue,align:el.dataset.cocoCompiledAlign,family:css.fontFamily,size:css.fontSize,color:css.color,lineHeight:css.lineHeight,transform:css.transform,left:css.left,top:css.top}];
})));
const stableStyles=async()=>{
  await page.waitForFunction(()=>{
    const el=document.querySelector('#artboard [data-coco-compiled-object="dj2"]');if(!el)return false;
    const css=getComputedStyle(el);const signature=[el.dataset.cocoTextValue,css.cssText,css.fontFamily,css.fontSize,css.lineHeight,css.color,css.left,css.top,css.transform].join('|');
    if(window.__softControlSignature!==signature){window.__softControlSignature=signature;window.__softControlAt=performance.now();return false;}
    return document.fonts.status==='loaded'&&performance.now()-window.__softControlAt>450;
  });return ownerStyles();
};
const assertOtherOwners=(before,after,phase)=>{
  for(const [id,style] of Object.entries(before))if(id!==targetId)assert.deepEqual(after[id],style,`${phase}: unchanged companion ${id}`);
};
async function assertControlIndicators(style,format){
  assert.equal(Number(await panel.getByRole('slider',{name:'Size',exact:true}).inputValue()),parseFloat(style.size),`${format}: size control matches rendered size`);
  const leading=Number(await panel.getByRole('slider',{name:'Leading',exact:true}).inputValue());
  assert.ok(Math.abs(leading*parseFloat(style.size)-parseFloat(style.lineHeight))<.015,`${format}: leading control matches render`);
  const rotation=Number(await panel.getByRole('slider',{name:'Rotate',exact:true}).inputValue());
  const matrix=style.transform.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number);
  assert.ok(matrix,`${format}: rendered rotation matrix`);
  const angle=Math.atan2(matrix[1],matrix[0])*180/Math.PI;
  const difference=((angle-rotation+180)%360+360)%360-180;
  assert.ok(Math.abs(difference)<.01,`${format}: rotation control matches render modulo 360 degrees`);
}
const expectedStyles={},expectedMaps={};
try {
  await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('button',{name:'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start',exact:true}).click({timeout:120000});
  await page.locator('.nf-startup-shell').waitFor({state:'hidden',timeout:120000});
  await board.waitFor({timeout:120000});
  const projectButton=page.getByRole('button',{name:'▸ Project',exact:true});
  if(await projectButton.count())await projectButton.click();
  await page.locator('input[type=file]').setInputFiles(projectPath);
  await waitValue('headline',initialMaps.square.headline);
  for(const format of ['square','story']){
    await ready(format,initialMaps[format]);
    await capture(`original-${format}`);
    await selectText(targetId);
    assert.equal(await panel.getByRole('button',{name:'On',exact:true}).count(),1,`${format}: companion controls enabled initially`);
    const baseline=await stableStyles();
    for(const [name,value]of [['L','left'],['C','center'],['R','right'],['L','left']]){
      const chip=panel.getByRole('button',{name,exact:true});await chip.click();
      await page.waitForFunction(value=>document.querySelector('#artboard [data-coco-compiled-object="dj2"]')?.getAttribute('data-coco-compiled-align')===value,value);
      assert.equal(await chip.getAttribute('aria-pressed'),'true');
      assertOtherOwners(baseline,await stableStyles(),`${format}/${value}`);console.log('ALIGN',format,value);
    }
    const fontPicker=panel.getByRole('button',{name:'Avigea Aa Bb 123',exact:true});
    assert.equal(await fontPicker.isEnabled(),true);await fontPicker.click();
    await page.getByText('Details / Body Copy',{exact:true}).click();
    await page.getByRole('button',{name:'LEMONMILK-Regular Aa Bb 123',exact:true}).click();
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]')).fontFamily.includes('LEMONMILK-Regular'));
    assert.equal(await panel.getByRole('button',{name:'LEMONMILK-Regular Aa Bb 123',exact:true}).count(),1);
    assertOtherOwners(baseline,await stableStyles(),`${format}/font`);console.log('FONT',format);
    const size=panel.getByRole('slider',{name:'Size',exact:true});
    const sizeBefore=(await ownerStyles())[targetId].size;
    await size.focus();await size.press('ArrowRight');await size.press('ArrowRight');
    await page.waitForFunction(before=>getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]')).fontSize!==before,sizeBefore);console.log('SIZE',format);
    const color=panel.getByText('Color',{exact:true}).last().locator('..').getByRole('textbox',{name:'Pick color',exact:true});
    // Two Color captions are intentional: label color and body color.
    assert.equal(await panel.getByText('Color',{exact:true}).count(),2);
    await color.fill(format==='square'?'#ad1740':'#7a2044');await color.press('Tab');
    console.log('COLOR INPUT',format);
    const expectedColor=format==='square'?'rgb(173, 23, 64)':'rgb(122, 32, 68)';
    await page.waitForFunction(color=>getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]')).color===color,expectedColor);
    const copy=panel.getByPlaceholder('DJ JOE | DJ KLASS | HYPE\nPlaying the best nightlife anthems',{exact:true});
    await editAndCheck(targetId,copy,'DJ\nELEVATE');
    const leading=panel.getByRole('slider',{name:'Leading',exact:true});
    const heightBefore=(await ownerStyles())[targetId].lineHeight;
    await leading.focus();await leading.press('ArrowRight');await leading.press('ArrowRight');
    await page.waitForFunction(before=>getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]')).lineHeight!==before,heightBefore);
    const rotation=panel.getByRole('slider',{name:'Rotate',exact:true});
    const transformBefore=(await ownerStyles())[targetId].transform;
    await rotation.focus();await rotation.press(format==='square'?'ArrowRight':'ArrowLeft');
    await rotation.press(format==='square'?'ArrowRight':'ArrowLeft');
    await page.waitForFunction(before=>getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]')).transform!==before,transformBefore);
    await capture(`leading-${format}`);
    await editAndCheck(targetId,copy,'DJ ELEVATE');
    await selectText(targetId);
    const locationBefore=(await ownerStyles())[targetId];
    const points=await owner(targetId).evaluate(el=>[...el.querySelectorAll('[data-text-hit-surface="true"]')].flatMap(surface=>{
      const b=surface.getBoundingClientRect();return [.3,.5,.7].flatMap(y=>[.3,.5,.7].map(x=>({x:b.x+b.width*x,y:b.y+b.height*y})));
    }).filter(p=>document.elementFromPoint(p.x,p.y)?.closest('[data-coco-compiled-object]')===el));
    assert.ok(points.length,'Visible type exposes drag handle');
    await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();
    await page.mouse.move(points[0].x+12,points[0].y+5,{steps:10});await page.mouse.up();
    await page.waitForFunction(before=>{
      const css=getComputedStyle(document.querySelector('#artboard [data-coco-compiled-object="dj2"]'));return css.left!==before.left||css.top!==before.top;
    },locationBefore);
    expectedStyles[format]=await stableStyles();
    await assertControlIndicators(expectedStyles[format][targetId],format);
    assertOtherOwners(baseline,expectedStyles[format],`${format}/all controls`);
    expectedMaps[format]=await textMap();
    await capture(`edited-${format}`);
    report.controls.push({format,id:targetId,alignment:'L/C/R with active indicators',font:'LEMONMILK-Regular',size:true,color:expectedColor,leading:true,rotation:true,position:'visible-glyph drag',siblingsPreserved:true,style:expectedStyles[format][targetId]});
    console.log('COMPANION CONTROLS PASSED',format,JSON.stringify(expectedStyles[format][targetId]));
  }
  for(const format of ['square','story','square']){
    await ready(format,expectedMaps[format]);
    assert.deepEqual(await stableStyles(),expectedStyles[format],`${format}: style persistence across format switching`);
  }
  const save=page.getByRole('button',{name:'Save Project File',exact:true});if(!await save.isVisible())await projectButton.click();
  const download=page.waitForEvent('download');await save.click();
  const savedPath=`${out}/roundtrip.nflyer`;await(await download).saveAs(savedPath);
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await board.waitFor({timeout:120000});
  if(await page.locator('.nf-startup-shell').isVisible()){
    await page.getByRole('button',{name:'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start',exact:true}).click({timeout:120000});
    await page.locator('.nf-startup-shell').waitFor({state:'hidden',timeout:120000});
  }
  const restoredProject=page.getByRole('button',{name:'▸ Project',exact:true});
  if(!await page.locator('input[type=file][accept*=json]').count())await restoredProject.click();
  await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
  for(const format of ['square','story']){
    await ready(format,expectedMaps[format]);
    assert.deepEqual(await stableStyles(),expectedStyles[format],`${format}: saved companion text/style/position`);
    await selectText(targetId);
    assert.equal(await panel.getByRole('button',{name:'L',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await panel.getByRole('button',{name:'LEMONMILK-Regular Aa Bb 123',exact:true}).count(),1);
    await assertControlIndicators(expectedStyles[format][targetId],format);
    await capture(`reopened-${format}`);report.roundtrip.push({format,renderedStylesEqual:true,activeControlsEqual:true});
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
  console.log('PASS companion controls, sibling isolation, format switching, reload and project save/reopen');
}catch(error){
  report.failure=String(error);await writeFile(`${out}/results.json`,JSON.stringify(report,null,2));
  await writeFile(`${out}/failure-panel.txt`,await panel.ariaSnapshot());
  await page.screenshot({path:`${out}/controls-failure.png`,fullPage:true});throw error;
}finally{await browser.close();}
