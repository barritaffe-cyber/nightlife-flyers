import { chromium } from 'playwright';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1080,height:1920}});
 for(const format of ['square','story']) {
  await page.goto(`http://localhost:3000/generated-flyers/amapiano-night-master.html?format=${format}`,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{document.querySelector('.background').src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><path fill="#123456" d="M0 0h1080v1920H0z"/></svg>');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const screenshot=await page.locator('[data-coco-canvas]').screenshot();
  const {data,info}=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(x,y)=>[...data.subarray((y*info.width+x)*3,(y*info.width+x)*3+3)];
  assert.deepEqual(pixel(10,100),[18,52,86],'background has changed');
  assert.ok(pixel(10,info.height-20).every(v=>v>240),'paper footer stays white');
  assert.deepEqual(pixel(10,Math.floor(info.height*(format==='square'?.835:.855))),[0,0,0],'black content area remains above tear');
  console.log('PASS independent paper after background replacement',format);
 }
}finally{await browser.close();}
