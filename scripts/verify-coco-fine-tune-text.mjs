import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

async function selectText(page, owner) {
  // Clear the previous selection box before clicking a small overlapping layer.
  const board = await page.locator('#artboard').boundingBox();
  await page.mouse.click(board.x + 2, board.y + board.height - 2);
  await page.waitForTimeout(200);
  await owner.scrollIntoViewIfNeeded();
  const points = await owner.evaluate(el => [...el.querySelectorAll('[data-text-hit-surface="true"]')].flatMap(g => {
    const b = g.getBoundingClientRect();
    return [.3,.5,.7].flatMap(y => [.3,.5,.7].map(x => ({x:b.x+b.width*x,y:b.y+b.height*y})));
  }).filter(p=>document.elementFromPoint(p.x,p.y)?.closest('[data-coco-compiled-object]') === el));
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
    if (await owner.getAttribute('data-active') === 'true') break;
  }
  assert.equal(await owner.getAttribute('data-active'), 'true', `${await owner.getAttribute('data-coco-compiled-object')} selects on canvas (${points.length} reachable points)`);
}

export async function verifyCocoFineTuneText(page, { saved, auditDir, cases: requestedCases } = {}) {
  await page.getByTestId('coco-quick-fine-tune').click();
  const edits = { square:{}, story:{} };
  const textMap = () => page.locator('#artboard [data-coco-text-value]').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.dataset.cocoCompiledObject,n.dataset.cocoTextValue])));
  for (const format of ['square','story']) {
    await page.getByRole('button', {name:format === 'square' ? 'Square' : 'Story',exact:true}).click();
    await page.waitForFunction(format => {
      const b=document.querySelector('#artboard')?.getBoundingClientRect();
      return b && (format === 'story' ? b.height/b.width>1.7 : Math.abs(b.height/b.width-1)<.05);
    },format);
    await page.getByText(`Preparing ${format} canvas.`, {exact:true}).waitFor({state:'hidden',timeout:120000});
    const doc = saved.state.session[format].cocoCompositionSystem.compiledDocument;
    const cases = requestedCases || [
      [doc.objects.find(o => o.semanticRole === 'headline')?.id,'NOVA'],
      [doc.objects.find(o => o.semanticRole === 'headline2')?.id,'RUSH'],
      ['month','NOV'], ['time','9PM'],
      ['genres','ALL WHITE'], ['bucket','Good\nFriends\nGreat\nNights'],
      ['venue','ROOM'], ['address','EAST AVE'], ['rsvp','555 123 4567'],
    ];
    for (const [id,baseValue] of cases) {
      const value = format === 'story' && baseValue === 'NOVA' ? 'LUNA' : baseValue;
      const object=doc.objects.find(o=>o.id===id);
      if (!object?.binding?.panel) continue;
      const owner=page.locator(`#artboard [data-coco-compiled-object="${id}"]`);
      if (!await owner.count() || !await owner.getAttribute('data-coco-text-value')) continue;
      await selectText(page,owner);
      const before=await textMap(), previous=before[id];
      const style=await owner.evaluate(el => {const s=getComputedStyle(el);return {family:s.fontFamily,size:s.fontSize,leading:s.lineHeight,color:s.color};});
      const selector='textarea:visible,input:not([type=range]):not([type=file]):visible';
      await page.waitForFunction(previous => [...document.querySelectorAll('textarea,input:not([type=range]):not([type=file])')].some(el =>
        el.getClientRects().length && el.value===previous),previous,{timeout:5000});
      const inputIndex=await page.locator(selector).evaluateAll((inputs,previous) => inputs.findIndex(el =>
        el.value===previous),previous);
      assert.ok(inputIndex>=0,`${format}/${id}: sidebar displays the selected object's current text (${JSON.stringify(previous)})`);
      const input=page.locator(selector).nth(inputIndex);
      await input.fill(value);
      await page.waitForFunction(({id,value}) => document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value') === value,{id,value},{timeout:5000});
      assert.deepEqual(await owner.evaluate(el=>{const s=getComputedStyle(el);return {family:s.fontFamily,size:s.fontSize,leading:s.lineHeight,color:s.color};}),style,`${format}/${id}: typography is preserved`);
      const after=await textMap();
      for (const [other,text] of Object.entries(before)) {
        const sibling=doc.objects.find(o=>o.id===other);
        const linked=['headline','headline2'].includes(object.semanticRole) && sibling?.binding?.text===object.binding.text &&
          (sibling?.semanticRole===object.semanticRole || (!sibling?.semanticRole && sibling?.editable===false));
        assert.equal(after[other],other===id || linked ? value : text,`${format}/${id}: preserve unrelated object ${other}`);
        if(other===id || linked) edits[format][other]=value;
      }
      if (object.semanticRole==='headline') {
        await input.fill('');
        await page.waitForFunction(id=>!document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value'),id);
        await input.fill(value);
      }
      console.log('EDITED',format,id,value.replaceAll('\n',' / '));
    }
    if(auditDir) await page.locator('#artboard').screenshot({path:`${auditDir}/fine-tune-${format}.png`});
  }
  // Switch away and back, then save through the normal product controls.
  await page.getByRole('button',{name:'Quick Edit',exact:true}).click();
  for(const format of ['square','story']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.getByText(`Preparing ${format} canvas.`,{exact:true}).waitFor({state:'hidden',timeout:120000});
    await page.waitForFunction(({format,values}) => {
      const b=document.querySelector('#artboard')?.getBoundingClientRect();
      return b && (format==='story'?b.height/b.width>1.7:Math.abs(b.height/b.width-1)<.05) && Object.entries(values).every(([id,text])=>document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value')===text);
    },{format,values:edits[format]},{timeout:120000});
  }
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('coco-quick-save').click()]);
  const file=`${auditDir || '/tmp'}/fine-tune-result.nflyer`;
  await download.saveAs(file);
  const project=JSON.parse(await readFile(file,'utf8'));
  for(const format of ['square','story']) {
    const v=project.state.session[format];
    for(const [id,text] of Object.entries(edits[format])) assert.equal(v.cocoCompositionSystem.compiledObjectOverrides[id].text,text,`${format}/${id}: edit is saved`);
    assert.deepEqual(v.cocoCompositionSystem.compiledDocument,saved.state.session[format].cocoCompositionSystem.compiledDocument,'authored layout survives editing');
  }
  if(auditDir) await writeFile(`${auditDir}/fine-tune-edits.json`,JSON.stringify(edits,null,2));
  console.log('PASS: Fine Tune selected text updates immediately, preserves sibling objects and typography, survives format switching and saving');
}
