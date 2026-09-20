import assert from 'node:assert/strict';

export async function verifyCocoStyleControls(page,format) {
 const venue=page.locator('#artboard [data-coco-compiled-object="editor-venue"]');
 const address=page.locator('#artboard [data-coco-compiled-object="address"]');
 const style=node=>node.evaluate(el=>({size:getComputedStyle(el).fontSize,color:getComputedStyle(el).color}));
 const label=page.locator('#artboard [data-coco-compiled-object="editor-djLineupLabel"]');
 const checkLabel=async phase=>{assert.equal(await label.getAttribute('data-coco-text-value'),'MUSIC BY',`${format}: label survives ${phase}`);};
 await checkLabel('before styles');
 const addressBefore=await style(address);
 const panel=page.locator('#venue-panel');
 const slider=panel.getByRole('slider',{name:'Venue Name Size',exact:true});
 const before=await style(venue);
 await slider.focus();await slider.press('ArrowRight');
 await page.waitForFunction(previous=>getComputedStyle(document.querySelector('[data-coco-compiled-object="editor-venue"]')).fontSize!==previous,before.size);
 assert.deepEqual(await style(address),addressBefore,'Venue size must not resize address');
 // Check live pointer changes too, then return to a readable preview size.
 const box=await slider.boundingBox();
 await page.mouse.move(box.x+box.width*.2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.3,box.y+box.height/2,{steps:4});
 await page.waitForFunction(previous=>getComputedStyle(document.querySelector('[data-coco-compiled-object="editor-venue"]')).fontSize!==previous,before.size);
 await page.mouse.up();await slider.focus();await slider.press('Home');for(let i=0;i<11;i++)await slider.press('ArrowRight');
 await checkLabel('venue size changes');
 const color=panel.locator('.mt-2.grid').first().getByRole('textbox',{name:'Pick color',exact:true});
 await color.fill('#ffe066');await color.press('Tab');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-coco-compiled-object="editor-venue"]')).color==='rgb(255, 224, 102)');
 assert.deepEqual(await style(address),addressBefore,'Venue color must not recolor address');
 await checkLabel('venue color changes');
 const djPanel=page.locator('#details2-panel');
 const heading=djPanel.getByRole('button',{name:/DJ Lineup/}).first();
 if(await heading.getAttribute('aria-expanded')!=='true')await heading.click();
 const controls=djPanel.locator('[data-text-label-controls="details2"]');
 const background=controls.getByText('Label Background',{exact:true}).locator('..').getByRole('textbox',{name:'Pick color',exact:true});
 await background.fill('#bc1456');await background.press('Tab');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-coco-compiled-object="editor-djLineupLabel"] [data-coco-compiled-auto-wrap]')).backgroundColor==='rgb(188, 20, 86)');
 assert.equal(await page.locator('#artboard [data-coco-compiled-object="lineup"]').getAttribute('data-coco-text-value'),'DJ NOVA\nDJ KAI\nDJ MOON\nDJ STAR');
 await checkLabel('background color change');
 console.log('STYLES',format,await style(venue),'label background rgb(188, 20, 86)');
}
